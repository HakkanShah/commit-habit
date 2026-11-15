/**
 * POST /api/installations/commit - the dashboard's "commit now" button.
 *
 * This used to be a second copy of the commit flow, and it was missing the daily
 * cap and the "already committed today" check entirely, so the button could be
 * pressed repeatedly to burn through GitHub rate limits and stack up commits.
 * It now defers to the shared engine.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    runCommitForInstallation,
    installationForCommitSelect,
    type InstallationForCommit,
} from '@/lib/commit-service'
import { MAX_COMMITS_PER_DAY } from '@/lib/limits'
import { AuthenticationError, logError, createErrorResponse } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/** Friendly text for each reason the engine declined to commit. */
const SKIP_MESSAGES: Record<string, string> = {
    paused: 'This repository is paused. Resume it first.',
    daily_limit: `You have already used today's ${MAX_COMMITS_PER_DAY} automated commit. Try again tomorrow.`,
    has_real_commits: 'You already have commits today, so your streak is safe.',
    no_readme: 'This repository has no README to update. Add one and try again.',
    no_identity:
        'We cannot attribute commits to you yet. Sign in with GitHub once so commits land on your contribution graph.',
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            const { body, status } = createErrorResponse(AuthenticationError.tokenExpired())
            return NextResponse.json(body, { status })
        }

        let installationId: string
        try {
            const body = await request.json()
            installationId = body?.installationId

            if (!installationId || typeof installationId !== 'string') {
                return NextResponse.json(
                    { success: false, error: 'Installation ID is required' },
                    { status: 400 }
                )
            }
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // Scope the lookup to the session user, so a wrong id cannot even reveal
        // that someone else's installation exists.
        const installation = await prisma.installation.findFirst({
            where: { id: installationId, userId: session.userId },
            select: installationForCommitSelect,
        })

        if (!installation) {
            return NextResponse.json(
                { success: false, error: 'Installation not found' },
                { status: 404 }
            )
        }

        const outcome = await runCommitForInstallation(
            installation as unknown as InstallationForCommit,
            {
                // The user asked for this commit explicitly; don't refuse it just
                // because they also committed by hand today. The cap still holds.
                ignoreExistingCommits: true,
                successAction: 'manual_commit',
            }
        )

        if (outcome.status === 'committed') {
            console.log(`[MANUAL COMMIT] ${outcome.sha} for ${outcome.repo}`)
            return NextResponse.json({
                success: true,
                commitSha: outcome.sha.substring(0, 7),
                message: `Commit created: ${outcome.sha.substring(0, 7)}`,
                warnings: outcome.warnings,
            })
        }

        if (outcome.status === 'skipped') {
            return NextResponse.json(
                {
                    success: false,
                    error: SKIP_MESSAGES[outcome.reason] ?? outcome.message,
                    reason: outcome.reason,
                    warnings: outcome.warnings,
                },
                { status: outcome.reason === 'daily_limit' ? 429 : 400 }
            )
        }

        return NextResponse.json(
            {
                success: false,
                error: outcome.message,
                code: outcome.errorCode,
                retryable: outcome.retryable,
                warnings: outcome.warnings,
            },
            { status: outcome.errorCode === 'GITHUB_001' ? 429 : 502 }
        )
    } catch (error) {
        logError(error, { action: 'manual commit' })
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
