import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    getInstallationOctokit,
    hasUserCommitsToday,
    getReadmeContent,
    toggleReadmeWhitespace,
    commitReadmeUpdate
} from '@/lib/github'
import {
    AppError,
    GitHubError,
    DatabaseError,
    ConfigurationError,
    toAppError,
    logError,
    createErrorResponse,
} from '@/lib/errors'

// ============================================================================
// Configuration
// ============================================================================

const CRON_SECRET = process.env.CRON_SECRET
const MAX_COMMITS_PER_DAY = 5
const CRON_TIMEOUT_MS = 55000 // 55 seconds (Vercel has 60s limit)

// ============================================================================
// Types
// ============================================================================

interface ProcessingResult {
    repo: string
    status: 'success' | 'skipped' | 'error'
    message: string
    errorCode?: string
    retryable?: boolean
}

type ActivityAction =
    | 'commit_created'
    | 'skipped_daily_limit'
    | 'skipped_has_commits'
    | 'skipped_no_readme'
    | 'error_permission'
    | 'error_not_found'
    | 'error_rate_limited'
    | 'error_conflict'
    | 'error_network'
    | 'error_unknown'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map error to activity action type
 */
function getErrorAction(error: unknown): ActivityAction {
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

/**
 * Create a promise that rejects after a timeout
 */
function createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Cron job timed out after ${ms}ms`))
        }, ms)
    })
}

/**
 * Process a single installation
 */
async function processInstallation(
    installation: {
        id: string
        installationId: number
        repoFullName: string
        commitsToday: number
        lastRunAt: Date | null
    },
    today: Date
): Promise<ProcessingResult> {
    const [owner, repo] = installation.repoFullName.split('/')

    try {
        // Reset count if last run was before today
        if (installation.lastRunAt && installation.lastRunAt < today) {
            await prisma.installation.update({
                where: { id: installation.id },
                data: { commitsToday: 0 },
            })
            installation.commitsToday = 0
        }

        // Check daily limit
        if (installation.commitsToday >= MAX_COMMITS_PER_DAY) {
            await prisma.activityLog.create({
                data: {
                    installationId: installation.id,
                    action: 'skipped_daily_limit',
                    message: `Daily limit of ${MAX_COMMITS_PER_DAY} commits reached`,
                },
            })

            return {
                repo: installation.repoFullName,
                status: 'skipped',
                message: 'Daily limit reached',
            }
        }

        // Get Octokit instance
        const octokit = await getInstallationOctokit(installation.installationId)

        // Check if user has made real commits today
        const hasRealCommits = await hasUserCommitsToday(octokit, owner, repo)

        if (hasRealCommits) {
            await prisma.activityLog.create({
                data: {
                    installationId: installation.id,
                    action: 'skipped_has_commits',
                    message: 'User already has commits today',
                },
            })

            return {
                repo: installation.repoFullName,
                status: 'skipped',
                message: 'User has real commits today',
            }
        }

        // Get README content
        const readme = await getReadmeContent(octokit, owner, repo)

        if (!readme) {
            await prisma.activityLog.create({
                data: {
                    installationId: installation.id,
                    action: 'skipped_no_readme',
                    message: 'Repository has no README.md',
                },
            })

            return {
                repo: installation.repoFullName,
                status: 'skipped',
                message: 'No README.md found',
            }
        }

        // Toggle whitespace in README
        const newContent = toggleReadmeWhitespace(readme.content)

        // Commit the change
        const commitSha = await commitReadmeUpdate(
            octokit,
            owner,
            repo,
            newContent,
            readme.sha
        )

        // Update installation record
        await prisma.installation.update({
            where: { id: installation.id },
            data: {
                commitsToday: { increment: 1 },
                lastRunAt: new Date(),
            },
        })

        // Log success
        await prisma.activityLog.create({
            data: {
                installationId: installation.id,
                action: 'commit_created',
                message: `Commit ${commitSha.substring(0, 7)}`,
            },
        })

        return {
            repo: installation.repoFullName,
            status: 'success',
            message: `Created commit ${commitSha.substring(0, 7)}`,
        }

    } catch (error) {
        // Log the error
        logError(error, {
            installationId: installation.id,
            repo: installation.repoFullName,
            action: 'process installation',
        })

        const appError = toAppError(error)
        const errorAction = getErrorAction(error)
        const isRetryable = error instanceof AppError ? error.retryable : false

        // Log to activity log
        try {
            await prisma.activityLog.create({
                data: {
                    installationId: installation.id,
                    action: errorAction,
                    message: appError.userMessage.substring(0, 500), // Limit message length
                },
            })
        } catch (dbError) {
            console.error('[CRON] Failed to log error to activity log:', dbError)
        }

        // If permission denied, deactivate the installation
        if (error instanceof GitHubError && error.code === 'GITHUB_003') {
            try {
                await prisma.installation.update({
                    where: { id: installation.id },
                    data: { active: false },
                })
                console.log(`[CRON] Deactivated installation ${installation.id} due to permission error`)
            } catch (dbError) {
                console.error('[CRON] Failed to deactivate installation:', dbError)
            }
        }

        return {
            repo: installation.repoFullName,
            status: 'error',
            message: appError.userMessage,
            errorCode: appError.code,
            retryable: isRetryable,
        }
    }
}

// ============================================================================
// Route Handlers
// ============================================================================

export async function GET(request: NextRequest) {
    const startTime = Date.now()

    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET) {
        logError(new ConfigurationError('CRON_SECRET is not configured'))
        return NextResponse.json(
            { error: 'Server misconfiguration', code: 'CONFIG_001' },
            { status: 500 }
        )
    }

    if (cronSecret !== CRON_SECRET) {
        console.warn('[CRON] Unauthorized access attempt')
        return NextResponse.json(
            { error: 'Unauthorized', code: 'AUTH_005' },
            { status: 401 }
        )
    }

    const results: ProcessingResult[] = []

    try {
        // Get today's date at midnight
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all active installations
        let installations
        try {
            installations = await prisma.installation.findMany({
                where: { active: true },
            })
        } catch (dbError) {
            logError(dbError, { action: 'fetch installations' })
            const { body, status } = createErrorResponse(
                DatabaseError.queryError('fetch active installations')
            )
            return NextResponse.json(body, { status })
        }

        console.log(`[CRON] Processing ${installations.length} active installations`)

        // Process installations with timeout protection
        const processingPromise = (async () => {
            for (const installation of installations) {
                // Check if we're running out of time
                const elapsed = Date.now() - startTime
                if (elapsed > CRON_TIMEOUT_MS - 5000) {
                    console.warn(`[CRON] Timeout approaching, stopping after ${results.length}/${installations.length} installations`)
                    break
                }

                const result = await processInstallation(installation, today)
                results.push(result)
            }
        })()

        // Race against timeout
        await Promise.race([
            processingPromise,
            createTimeout(CRON_TIMEOUT_MS),
        ])

        // Summary statistics
        const summary = {
            total: installations.length,
            processed: results.length,
            success: results.filter(r => r.status === 'success').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
            durationMs: Date.now() - startTime,
        }

        console.log('[CRON] Completed:', JSON.stringify(summary))

        return NextResponse.json({
            success: true,
            summary,
            results,
        })

    } catch (error) {
        logError(error, { action: 'cron job', durationMs: Date.now() - startTime })

        // If we have partial results, still return them
        if (results.length > 0) {
            return NextResponse.json({
                success: false,
                error: 'Cron job partially failed',
                processed: results.length,
                results,
            }, { status: 207 }) // 207 Multi-Status
        }

        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request)
}
