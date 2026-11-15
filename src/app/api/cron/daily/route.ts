/**
 * Scheduled automation run.
 *
 * ## Why this file was rewritten
 *
 * The old version is the direct cause of "it commits for some users but not for
 * most of them". It:
 *
 *   1. ran **once a day** (`0 6 * * *`) and gave itself a 25 second budget;
 *   2. loaded **every** active installation with `findMany` and **no `orderBy`**,
 *      so the order was whatever Postgres happened to return - in practice
 *      stable across runs;
 *   3. walked that list in batches of 5 and `break`-ed out as soon as it got
 *      within 3 seconds of the budget.
 *
 * Each installation needs roughly 4 GitHub round trips plus a few writes, so a
 * run got through a few dozen repositories at best. Everyone past that point was
 * dropped - and because the order never changed and there was only one run per
 * day, it was *the same* users dropped every single day. They never got a
 * commit, and nothing in the logs said why.
 *
 * ## How it works now
 *
 * Installations carry a `nextEligibleAt` watermark. A run claims the ones whose
 * watermark has passed, **oldest first**, and sets the watermark forward as each
 * one is handled. So:
 *
 *   - a run that cannot finish the queue leaves the rest eligible, and the next
 *     run starts exactly where this one stopped - no starvation;
 *   - the schedule is hourly, so leftovers are picked up within the hour instead
 *     of waiting a day;
 *   - an installation already handled today is skipped without a single API call;
 *   - a transient failure backs off and is retried later the same day instead of
 *     costing the user their streak.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    runCommitForInstallation,
    installationForCommitSelect,
    type CommitOutcome,
    type InstallationForCommit,
} from '@/lib/commit-service'
import { ConfigurationError, DatabaseError, logError, createErrorResponse } from '@/lib/errors'

// Allow the platform to give us real time to work with. The old 25s ceiling was
// a guess copied from a free cron service; on Vercel this is what actually
// governs the budget.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ============================================================================
// Configuration
// ============================================================================

const CRON_SECRET = process.env.CRON_SECRET

/** Wall-clock budget for one run, slightly under `maxDuration`. */
const RUN_BUDGET_MS = 50_000
/** Stop starting new work with this much budget left, so in-flight work finishes. */
const BUDGET_RESERVE_MS = 8_000
/** Installations processed concurrently. */
const CONCURRENCY = 6
/**
 * Upper bound on rows claimed per run. Keeps memory and the GitHub request rate
 * predictable; whatever is left over is picked up by the next hourly run.
 */
const MAX_PER_RUN = 300
/**
 * How long a claimed installation stays reserved. Long enough to cover
 * processing, short enough that a run which dies mid-flight releases its rows
 * again quickly.
 */
const CLAIM_LEASE_MS = 5 * 60 * 1000

// ============================================================================
// Helpers
// ============================================================================

function isAuthorized(request: NextRequest): boolean {
    const header = request.headers.get('authorization')
    if (!header) return false

    const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header
    if (!CRON_SECRET || provided.length !== CRON_SECRET.length) return false

    // Constant-time comparison: this endpoint is the one thing standing between
    // the open internet and writing to every connected repository.
    let mismatch = 0
    for (let i = 0; i < CRON_SECRET.length; i++) {
        mismatch |= provided.charCodeAt(i) ^ CRON_SECRET.charCodeAt(i)
    }
    return mismatch === 0
}

/**
 * Read the installations due for a run. Reserving them is a separate, atomic
 * step (`claim`) taken immediately before each one is processed.
 *
 * `nextEligibleAt: null` covers rows that have never run (including every row
 * that existed before this column did), and they sort first so new users get
 * their first commit on the very next run.
 */
async function fetchDueInstallations(now: Date, limit: number): Promise<InstallationForCommit[]> {
    const rows = await prisma.installation.findMany({
        where: {
            active: true,
            // Soft-deleted users must not keep receiving commits.
            user: { deletedAt: null },
            OR: [
                { nextEligibleAt: null },
                { nextEligibleAt: { lte: now } },
            ],
        },
        select: installationForCommitSelect,
        orderBy: [
            { nextEligibleAt: { sort: 'asc', nulls: 'first' } },
            { createdAt: 'asc' },
        ],
        take: limit,
    })

    return rows as unknown as InstallationForCommit[]
}

/**
 * Reserve one installation for this run.
 *
 * Schedulers overlap in practice - a slow run is still going when the next one
 * fires, or the platform retries a timed-out invocation. Without a reservation
 * both runs would process the same row and the user would get two commits.
 * Moving `nextEligibleAt` forward under a `WHERE` that still requires the row to
 * be due makes the claim atomic: exactly one run gets `count === 1`.
 *
 * The engine overwrites `nextEligibleAt` with its own value when it finishes, so
 * the lease only matters while work is in flight.
 */
async function claim(installationId: string, now: Date): Promise<boolean> {
    try {
        const { count } = await prisma.installation.updateMany({
            where: {
                id: installationId,
                active: true,
                OR: [{ nextEligibleAt: null }, { nextEligibleAt: { lte: now } }],
            },
            data: { nextEligibleAt: new Date(now.getTime() + CLAIM_LEASE_MS) },
        })
        return count === 1
    } catch (error) {
        logError(error, { action: 'claim installation', installationId })
        return false
    }
}

// ============================================================================
// Route handler
// ============================================================================

export async function GET(request: NextRequest) {
    const startedAt = Date.now()
    const now = new Date()

    if (!CRON_SECRET) {
        logError(new ConfigurationError('CRON_SECRET is not configured'))
        return NextResponse.json(
            { error: 'Server misconfiguration', code: 'CONFIG_001' },
            { status: 500 }
        )
    }

    if (!isAuthorized(request)) {
        console.warn('[CRON] Unauthorized access attempt')
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_005' }, { status: 401 })
    }

    let due: InstallationForCommit[]
    try {
        due = await fetchDueInstallations(now, MAX_PER_RUN)
    } catch (dbError) {
        logError(dbError, { action: 'fetch due installations' })
        const { body, status } = createErrorResponse(
            DatabaseError.queryError('fetch due installations')
        )
        return NextResponse.json(body, { status })
    }

    // How much work is waiting in total, so the response says whether a backlog
    // is building up rather than leaving it to be discovered by users.
    let pendingTotal = due.length
    try {
        pendingTotal = await prisma.installation.count({
            where: {
                active: true,
                user: { deletedAt: null },
                OR: [{ nextEligibleAt: null }, { nextEligibleAt: { lte: now } }],
            },
        })
    } catch {
        // Non-essential statistic.
    }

    console.log(`[CRON] processing ${due.length} installation(s) of ${pendingTotal} due`)

    const outcomes: CommitOutcome[] = []
    let budgetExhausted = false
    /** Rows another concurrent run had already claimed. */
    let skippedNotClaimed = 0

    for (let i = 0; i < due.length; i += CONCURRENCY) {
        if (Date.now() - startedAt > RUN_BUDGET_MS - BUDGET_RESERVE_MS) {
            budgetExhausted = true
            console.warn(
                `[CRON] Budget reached after ${outcomes.length}/${due.length}; the rest stay eligible for the next run`
            )
            break
        }

        const batch = due.slice(i, i + CONCURRENCY)

        // `runCommitForInstallation` never throws, so one bad repository cannot
        // take down the batch - no `Promise.all` rejection to lose results to.
        const batchOutcomes = await Promise.all(
            batch.map(async installation => {
                const claimedAt = new Date()
                if (!await claim(installation.id, claimedAt)) {
                    // Another run got there first, or the row was paused in the
                    // meantime. Leave it alone.
                    skippedNotClaimed++
                    return null
                }
                return runCommitForInstallation(installation, { now: claimedAt })
            })
        )

        outcomes.push(...batchOutcomes.filter((o): o is CommitOutcome => o !== null))
    }

    const summary = {
        due: pendingTotal,
        selected: due.length,
        processed: outcomes.length,
        committed: outcomes.filter(o => o.status === 'committed').length,
        skipped: outcomes.filter(o => o.status === 'skipped').length,
        failed: outcomes.filter(o => o.status === 'failed').length,
        notClaimed: skippedNotClaimed,
        /** True when work remains; the next hourly run resumes from the watermark. */
        remaining: Math.max(0, pendingTotal - outcomes.length),
        budgetExhausted,
        durationMs: Date.now() - startedAt,
    }

    console.log('[CRON] Completed:', JSON.stringify(summary))

    return NextResponse.json({ success: true, summary, results: outcomes })
}

export async function POST(request: NextRequest) {
    return GET(request)
}
