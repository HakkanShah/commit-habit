/**
 * The commit engine.
 *
 * Previously the daily cron job, the user's "commit now" button and the admin
 * "trigger commit" button each carried their own copy of this flow. The copies
 * had drifted apart in ways that directly caused user-visible failures:
 *
 *   - the cron attributed commits to the GitHub noreply identity, the admin
 *     route attributed them to the user's *profile* email (which often is not a
 *     verified email on their account, so the commit never reached their
 *     contribution graph), and both fell back to the App's bot identity when the
 *     lookup came up empty - producing commits that count for nobody;
 *   - only the cron checked whether the user had already committed today, and
 *     only the cron enforced the daily cap, so the buttons could burn through
 *     rate limits and double-commit;
 *   - the cron read `README.md` literally and treated "no README" the same as
 *     "GitHub is down".
 *
 * Everything now goes through `runCommitForInstallation`, which returns a
 * structured outcome rather than throwing, so callers only have to decide how to
 * present it.
 */

import type { Octokit } from '@octokit/rest'
import { prisma } from './prisma'
import {
    getInstallationOctokit,
    getReadmeContent,
    getRepoMeta,
    hasUserCommitsToday,
    toggleReadmeWhitespace,
    commitReadmeUpdate,
    startOfNextUtcDay,
    utcDayKey,
} from './github'
import { AppError, GitHubError, ValidationError, toAppError, logError } from './errors'
import { MAX_COMMITS_PER_DAY } from './limits'

// ============================================================================
// Types
// ============================================================================

export type SkipReason =
    | 'daily_limit'
    | 'has_real_commits'
    | 'no_readme'
    | 'no_identity'
    | 'paused'

export type CommitOutcome =
    | { status: 'committed'; repo: string; sha: string; message: string; warnings: string[] }
    | { status: 'skipped'; repo: string; reason: SkipReason; message: string; warnings: string[] }
    | {
        status: 'failed'
        repo: string
        message: string
        errorCode: string
        retryable: boolean
        warnings: string[]
    }

/** Activity-log action names. Kept narrow so the dashboard can rely on them. */
export type ActivityAction =
    | 'commit_created'
    | 'manual_commit'
    | 'skipped_daily_limit'
    | 'skipped_has_commits'
    | 'skipped_no_readme'
    | 'skipped_no_identity'
    | 'warning_fork'
    | 'warning_private'
    | 'error_permission'
    | 'error_not_found'
    | 'error_rate_limited'
    | 'error_conflict'
    | 'error_network'
    | 'error_unknown'

/** The installation shape the engine needs. */
export interface InstallationForCommit {
    id: string
    installationId: number
    repoFullName: string
    active: boolean
    commitsToday: number
    commitDayUtc: string | null
    readmePath: string | null
    defaultBranch: string | null
    isFork: boolean
    isPrivate: boolean
    failureCount: number
    user: {
        name: string | null
        deletedAt?: Date | null
        accounts: Array<{
            provider: string
            providerAccountId: string
            providerUsername: string | null
        }>
    }
}

export interface RunOptions {
    /** Clock injection point, so tests do not depend on the wall clock. */
    now?: Date
    /**
     * Skip the "did the user already commit today" check. Used by the explicit
     * user/admin buttons: the user asked for a commit, so give them one. The
     * daily cap still applies.
     */
    ignoreExistingCommits?: boolean
    /** Activity-log action to record on success. */
    successAction?: Extract<ActivityAction, 'commit_created' | 'manual_commit'>
    /** Pre-built Octokit, for tests and for batching within one run. */
    octokit?: Octokit
}

/** Selection object for loading an installation the engine can run on. */
export const installationForCommitSelect = {
    id: true,
    installationId: true,
    repoFullName: true,
    active: true,
    commitsToday: true,
    commitDayUtc: true,
    readmePath: true,
    defaultBranch: true,
    isFork: true,
    isPrivate: true,
    failureCount: true,
    user: {
        select: {
            name: true,
            deletedAt: true,
            accounts: {
                where: { provider: 'github' },
                select: { provider: true, providerAccountId: true, providerUsername: true },
            },
        },
    },
} as const

// ============================================================================
// Attribution
// ============================================================================

export interface CommitAuthor {
    name: string
    email: string
    login: string
}

/**
 * Resolve the identity to author commits as.
 *
 * GitHub's `ID+LOGIN@users.noreply.github.com` form is the only identity that is
 * guaranteed to land on the user's contribution graph: GitHub resolves it by
 * account id, so it works even when the user keeps their address private and
 * even if they later change their email. A profile email, by contrast, only
 * counts while it is a *verified* address on the account - which is why the
 * admin path produced invisible commits.
 *
 * Returns null when we cannot build that identity. Callers must skip rather than
 * commit as the bot: a bot-authored commit is worse than no commit, because it
 * looks like success and changes nothing on the graph.
 */
export function resolveCommitAuthor(installation: InstallationForCommit): CommitAuthor | null {
    const account = installation.user.accounts.find(a => a.provider === 'github')

    if (!account?.providerUsername || !account.providerAccountId) {
        return null
    }

    // The noreply address is only valid with the numeric account id.
    if (!/^\d+$/.test(account.providerAccountId)) {
        return null
    }

    return {
        name: installation.user.name || account.providerUsername,
        email: `${account.providerAccountId}+${account.providerUsername}@users.noreply.github.com`,
        login: account.providerUsername,
    }
}

// ============================================================================
// Activity logging
// ============================================================================

/**
 * Write an activity-log row, at most once per installation per action per UTC
 * day for the repetitive ones.
 *
 * The cron used to append a row on every pass for every installation, including
 * "skipped" rows. Running hourly that is 24 rows per repo per day of pure noise,
 * it buries the entries that matter in the dashboard, and it grows a table
 * nothing ever prunes.
 */
export async function logActivity(
    installationId: string,
    action: ActivityAction,
    message: string,
    options: { dedupePerDay?: boolean; now?: Date } = {}
): Promise<void> {
    const now = options.now ?? new Date()

    try {
        if (options.dedupePerDay) {
            const existing = await prisma.activityLog.findFirst({
                where: {
                    installationId,
                    action,
                    createdAt: { gte: startOfUtcDayLocal(now) },
                },
                select: { id: true },
            })
            if (existing) return
        }

        await prisma.activityLog.create({
            data: {
                installationId,
                action,
                // The column is unbounded text but the UI is not; keep rows small.
                message: message.slice(0, 500),
            },
        })
    } catch (error) {
        // Logging must never be the reason a commit fails.
        console.error('[COMMIT] Failed to write activity log:', error)
    }
}

function startOfUtcDayLocal(now: Date): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** Map an error to the activity-log action that describes it. */
export function getErrorAction(error: unknown): ActivityAction {
    if (error instanceof GitHubError) {
        switch (error.code) {
            case 'GITHUB_003': return 'error_permission'
            case 'GITHUB_002': return 'error_not_found'
            case 'GITHUB_001': return 'error_rate_limited'
            case 'GITHUB_007': return 'error_conflict'
            case 'GITHUB_005':
            case 'GITHUB_006': return 'error_network'
            default: return 'error_unknown'
        }
    }
    return 'error_unknown'
}

// ============================================================================
// Backoff
// ============================================================================

const BACKOFF_STEPS_MS = [
    15 * 60 * 1000,   // 15 minutes
    60 * 60 * 1000,   // 1 hour
    3 * 60 * 60 * 1000, // 3 hours
]

/**
 * How long a repository that cannot produce a commit for a *structural* reason
 * waits before being looked at again.
 *
 * A repository with no README, or belonging to an account with no linked GitHub
 * identity, will still have no README and no identity tomorrow. Re-checking all
 * of them every single day costs an API call each and, worse, occupies slots in
 * a run that other users are waiting for - in production 9 of 11 skips in a
 * single run were the same account's README-less repositories.
 *
 * So the interval grows: tomorrow, then 2 days, then 4, capped at a week. A user
 * who adds a README still gets picked up the next day the first time, while a
 * repository that has been empty for months is only polled weekly.
 */
export function nextEligibleAfterStructuralSkip(unproductiveRuns: number, now: Date): Date {
    const days = Math.min(2 ** Math.max(0, unproductiveRuns - 1), 7)
    return new Date(startOfNextUtcDay(now).getTime() + (days - 1) * 24 * 60 * 60 * 1000)
}

/**
 * When to try again after a failure.
 *
 * Retryable failures come back within the same day so a transient GitHub outage
 * does not cost the user their streak. Permanent ones wait for tomorrow instead
 * of hammering the API every run.
 */
export function nextEligibleAfterFailure(
    failureCount: number,
    retryable: boolean,
    now: Date
): Date {
    if (!retryable) {
        return startOfNextUtcDay(now)
    }

    const step = BACKOFF_STEPS_MS[Math.min(failureCount, BACKOFF_STEPS_MS.length - 1)]
    const retryAt = new Date(now.getTime() + step)
    const tomorrow = startOfNextUtcDay(now)

    // Never schedule past the end of the day: the next day's run re-queues it anyway.
    return retryAt < tomorrow ? retryAt : tomorrow
}

// ============================================================================
// Engine
// ============================================================================

/**
 * Run the automation for one installation.
 *
 * Never throws: every outcome, including failure, comes back as a `CommitOutcome`
 * so a batch caller cannot lose the rest of the batch to one bad repository.
 */
export async function runCommitForInstallation(
    installation: InstallationForCommit,
    options: RunOptions = {}
): Promise<CommitOutcome> {
    const now = options.now ?? new Date()
    const repo = installation.repoFullName
    const warnings: string[] = []
    const successAction = options.successAction ?? 'commit_created'

    try {
        if (!installation.active) {
            return {
                status: 'skipped',
                repo,
                reason: 'paused',
                message: 'Automation is paused for this repository',
                warnings,
            }
        }

        const [owner, repoName] = repo.split('/')
        if (!owner || !repoName) {
            throw ValidationError.invalidFormat('repoFullName', 'owner/repo')
        }

        // --- Attribution first: no identity means no useful commit is possible,
        // --- and finding that out costs no API calls.
        const author = resolveCommitAuthor(installation)
        if (!author) {
            await logActivity(
                installation.id,
                'skipped_no_identity',
                'Cannot attribute commits to you yet. Sign in with GitHub once to link your account, otherwise commits would not appear on your contribution graph.',
                { dedupePerDay: true, now }
            )
            await markHandled(
                installation.id,
                nextEligibleAfterStructuralSkip(installation.failureCount + 1, now),
                { countUnproductive: true }
            )
            return {
                status: 'skipped',
                repo,
                reason: 'no_identity',
                message: 'No linked GitHub identity to attribute commits to',
                warnings,
            }
        }

        // --- Daily counter, keyed on the UTC day it belongs to.
        const dayKey = utcDayKey(now)
        const commitsToday = installation.commitDayUtc === dayKey ? installation.commitsToday : 0

        if (commitsToday >= MAX_COMMITS_PER_DAY) {
            await logActivity(
                installation.id,
                'skipped_daily_limit',
                `Daily limit of ${MAX_COMMITS_PER_DAY} commit(s) already reached`,
                { dedupePerDay: true, now }
            )
            await markHandled(installation.id, startOfNextUtcDay(now))
            return {
                status: 'skipped',
                repo,
                reason: 'daily_limit',
                message: 'Daily limit reached',
                warnings,
            }
        }

        const octokit = options.octokit ?? await getInstallationOctokit(installation.installationId)

        // --- Repository facts. Also tells the user when their commits will not
        // --- show up no matter how well the automation works.
        //
        // Fork status, visibility and default branch almost never change, so they
        // are cached on the installation and only re-fetched when missing. That
        // keeps the steady-state cost at three GitHub calls per repository per
        // day, which matters when the scheduler is working through a backlog.
        // `handleFailure` clears the cache on a 404/409 so a renamed or
        // re-defaulted repository re-resolves on the next run.
        const meta = installation.defaultBranch
            ? {
                defaultBranch: installation.defaultBranch,
                isFork: installation.isFork,
                isPrivate: installation.isPrivate,
            }
            : await getRepoMeta(octokit, owner, repoName)

        if (meta.isFork) {
            warnings.push('This repository is a fork. GitHub never counts commits in forks towards your contribution graph.')
            await logActivity(
                installation.id,
                'warning_fork',
                'This repository is a fork - GitHub does not count commits in forks on your contribution graph. Pick a non-forked repository.',
                { dedupePerDay: true, now }
            )
        }
        if (meta.isPrivate) {
            warnings.push('This repository is private. Enable "Include private contributions on my profile" in your GitHub settings, or your graph will stay empty.')
            await logActivity(
                installation.id,
                'warning_private',
                'This repository is private - turn on "Include private contributions on my profile" in GitHub settings for these commits to show.',
                { dedupePerDay: true, now }
            )
        }

        // --- Has the user already done real work today?
        if (!options.ignoreExistingCommits) {
            const hasRealCommits = await hasUserCommitsToday(octokit, owner, repoName, author.login, now)

            if (hasRealCommits) {
                await logActivity(
                    installation.id,
                    'skipped_has_commits',
                    'You already committed today - no filler commit needed',
                    { dedupePerDay: true, now }
                )
                await markHandled(installation.id, startOfNextUtcDay(now))
                return {
                    status: 'skipped',
                    repo,
                    reason: 'has_real_commits',
                    message: 'User already has real commits today',
                    warnings,
                }
            }
        }

        // --- README
        const readme = await getReadmeContent(octokit, owner, repoName)

        if (!readme) {
            await logActivity(
                installation.id,
                'skipped_no_readme',
                'No README found in this repository. Add a README so there is a file to touch.',
                { dedupePerDay: true, now }
            )
            await markHandled(
                installation.id,
                nextEligibleAfterStructuralSkip(installation.failureCount + 1, now),
                {
                    defaultBranch: meta.defaultBranch,
                    isFork: meta.isFork,
                    isPrivate: meta.isPrivate,
                    countUnproductive: true,
                }
            )
            return {
                status: 'skipped',
                repo,
                reason: 'no_readme',
                message: 'No README found',
                warnings,
            }
        }

        const newContent = toggleReadmeWhitespace(readme.content)

        // Guard rail: an unchanged body means GitHub records no commit while we
        // would happily report success. Fail loudly instead.
        if (newContent === readme.content) {
            throw new AppError({
                code: 'GITHUB_004',
                userMessage: 'Could not produce a change in the README to commit',
                developerMessage: `toggleReadmeWhitespace returned identical content for ${repo}`,
                statusCode: 500,
                context: { repo, path: readme.path },
            })
        }

        const sha = await commitReadmeUpdate(
            octokit,
            owner,
            repoName,
            newContent,
            readme.sha,
            author,
            { path: readme.path, branch: meta.defaultBranch, now }
        )

        // --- Persist success
        await prisma.installation.update({
            where: { id: installation.id },
            data: {
                commitsToday: commitsToday + 1,
                commitDayUtc: dayKey,
                lastRunAt: now,
                lastCommitAt: now,
                nextEligibleAt: startOfNextUtcDay(now),
                failureCount: 0,
                lastError: null,
                readmePath: readme.path,
                defaultBranch: meta.defaultBranch,
                isFork: meta.isFork,
                isPrivate: meta.isPrivate,
            },
        })

        await logActivity(
            installation.id,
            successAction,
            `Commit ${sha.substring(0, 7)} on ${readme.path}`,
            { now }
        )

        return {
            status: 'committed',
            repo,
            sha,
            message: `Created commit ${sha.substring(0, 7)}`,
            warnings,
        }
    } catch (error) {
        return handleFailure(installation, error, now, warnings)
    }
}

/**
 * Record that this installation has been dealt with for now.
 * `nextEligibleAt` is what keeps the scheduler from re-picking it.
 *
 * `countUnproductive` keeps `failureCount` climbing for structural skips, which
 * is what drives the growing re-check interval. It is reset by any run that
 * produces a commit, and by the ordinary skips (`has_real_commits`,
 * `daily_limit`) that mean the repository is working exactly as intended.
 */
async function markHandled(
    installationId: string,
    nextEligibleAt: Date,
    extra: {
        defaultBranch?: string
        isFork?: boolean
        isPrivate?: boolean
        countUnproductive?: boolean
    } = {}
): Promise<void> {
    const { countUnproductive, ...fields } = extra

    try {
        await prisma.installation.update({
            where: { id: installationId },
            data: {
                nextEligibleAt,
                lastRunAt: new Date(),
                ...(countUnproductive
                    ? { failureCount: { increment: 1 } }
                    : { failureCount: 0, lastError: null }),
                ...fields,
            },
        })
    } catch (error) {
        console.error('[COMMIT] Failed to update installation schedule:', error)
    }
}

async function handleFailure(
    installation: InstallationForCommit,
    error: unknown,
    now: Date,
    warnings: string[]
): Promise<CommitOutcome> {
    logError(error, {
        installationId: installation.id,
        repo: installation.repoFullName,
        action: 'run commit for installation',
    })

    const appError = toAppError(error)
    const retryable = error instanceof AppError ? error.retryable : false
    const failureCount = installation.failureCount + 1

    await logActivity(
        installation.id,
        getErrorAction(error),
        appError.userMessage,
        { dedupePerDay: true, now }
    )

    // A permission error means the installation lost access - usually the app
    // was removed from the repository. Stop trying until the user reinstalls.
    const deactivate = error instanceof GitHubError && error.code === 'GITHUB_003'

    // A missing resource or a SHA/branch conflict usually means the repository
    // was renamed, transferred, or had its default branch changed. Drop the
    // cached facts so the next run resolves them again instead of repeating the
    // same doomed request every day.
    const invalidateCache =
        error instanceof GitHubError && (error.code === 'GITHUB_002' || error.code === 'GITHUB_007')

    try {
        await prisma.installation.update({
            where: { id: installation.id },
            data: {
                lastRunAt: now,
                failureCount,
                lastError: appError.userMessage.slice(0, 500),
                nextEligibleAt: nextEligibleAfterFailure(failureCount, retryable, now),
                ...(deactivate ? { active: false } : {}),
                ...(invalidateCache ? { defaultBranch: null, readmePath: null } : {}),
            },
        })
    } catch (dbError) {
        console.error('[COMMIT] Failed to record failure:', dbError)
    }

    return {
        status: 'failed',
        repo: installation.repoFullName,
        message: appError.userMessage,
        errorCode: appError.code,
        retryable,
        warnings,
    }
}
