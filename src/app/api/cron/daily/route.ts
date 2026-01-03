import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    getInstallationOctokit,
    hasUserCommitsToday,
    getReadmeContent,
    toggleReadmeWhitespace,
    commitReadmeUpdate
} from '@/lib/github'

const CRON_SECRET = process.env.CRON_SECRET
const MAX_COMMITS_PER_DAY = 5

export async function GET(request: NextRequest) {
    // Verify cron secret (for Vercel Cron or manual triggers)
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (cronSecret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: Array<{
        repo: string
        status: string
        message?: string
    }> = []

    try {
        // Reset daily commit counts at the start of a new day
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all active installations
        const installations = await prisma.installation.findMany({
            where: { active: true },
        })

        console.log(`Processing ${installations.length} active installations`)

        for (const installation of installations) {
            try {
                // Check if we've already hit the daily limit
                // Reset count if last run was before today
                if (installation.lastRunAt && installation.lastRunAt < today) {
                    await prisma.installation.update({
                        where: { id: installation.id },
                        data: { commitsToday: 0 },
                    })
                    installation.commitsToday = 0
                }

                if (installation.commitsToday >= MAX_COMMITS_PER_DAY) {
                    results.push({
                        repo: installation.repoFullName,
                        status: 'skipped',
                        message: 'Daily limit reached',
                    })

                    await prisma.activityLog.create({
                        data: {
                            installationId: installation.id,
                            action: 'skipped_daily_limit',
                            message: `Daily limit of ${MAX_COMMITS_PER_DAY} commits reached`,
                        },
                    })
                    continue
                }

                const [owner, repo] = installation.repoFullName.split('/')
                const octokit = await getInstallationOctokit(installation.installationId)

                // Check if user has made real commits today
                const hasRealCommits = await hasUserCommitsToday(octokit, owner, repo)

                if (hasRealCommits) {
                    results.push({
                        repo: installation.repoFullName,
                        status: 'skipped',
                        message: 'User has real commits today',
                    })

                    await prisma.activityLog.create({
                        data: {
                            installationId: installation.id,
                            action: 'skipped_has_commits',
                            message: 'User already has commits today',
                        },
                    })
                    continue
                }

                // Get README content
                const readme = await getReadmeContent(octokit, owner, repo)

                if (!readme) {
                    results.push({
                        repo: installation.repoFullName,
                        status: 'skipped',
                        message: 'No README.md found',
                    })

                    await prisma.activityLog.create({
                        data: {
                            installationId: installation.id,
                            action: 'skipped_no_readme',
                            message: 'Repository has no README.md',
                        },
                    })
                    continue
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

                results.push({
                    repo: installation.repoFullName,
                    status: 'success',
                    message: `Created commit ${commitSha.substring(0, 7)}`,
                })

            } catch (error) {
                console.error(`Error processing ${installation.repoFullName}:`, error)

                await prisma.activityLog.create({
                    data: {
                        installationId: installation.id,
                        action: 'error',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                })

                results.push({
                    repo: installation.repoFullName,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        return NextResponse.json({
            success: true,
            processed: installations.length,
            results,
        })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request)
}
