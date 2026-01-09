import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    getInstallationOctokit,
    getReadmeContent,
    toggleReadmeWhitespace,
    commitReadmeUpdate
} from '@/lib/github'
import {
    AuthenticationError,
    GitHubError,
    DatabaseError,
    toAppError,
    logError,
    createErrorResponse,
} from '@/lib/errors'

// ============================================================================
// POST /api/installations/commit - Manual commit for a repository
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const session = await getSession()
        if (!session) {
            const { body, status } = createErrorResponse(
                AuthenticationError.tokenExpired()
            )
            return NextResponse.json(body, { status })
        }

        // Parse request body
        let installationId: string
        try {
            const body = await request.json()
            installationId = body.installationId

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

        // Get installation and verify ownership, include user for commit attribution
        const installation = await prisma.installation.findUnique({
            where: { id: installationId },
            include: {
                user: { select: { name: true, email: true } },
            },
        })

        if (!installation) {
            return NextResponse.json(
                { success: false, error: 'Installation not found' },
                { status: 404 }
            )
        }

        if (installation.userId !== session.userId) {
            return NextResponse.json(
                { success: false, error: 'You do not own this installation' },
                { status: 403 }
            )
        }

        if (!installation.active) {
            return NextResponse.json(
                { success: false, error: 'This repository is paused. Resume it first.' },
                { status: 400 }
            )
        }

        // Parse repo owner/name
        const [owner, repo] = installation.repoFullName.split('/')

        // Get Octokit instance for this installation
        const octokit = await getInstallationOctokit(installation.installationId)

        // Get README content
        const readme = await getReadmeContent(octokit, owner, repo)

        if (!readme) {
            return NextResponse.json(
                { success: false, error: 'No README.md found in this repository' },
                { status: 400 }
            )
        }

        // Toggle whitespace in README
        const newContent = toggleReadmeWhitespace(readme.content)

        // Get author info for contribution graph attribution
        const author = installation.user.email && installation.user.name
            ? { name: installation.user.name, email: installation.user.email }
            : undefined

        // Commit the change with user attribution
        const commitSha = await commitReadmeUpdate(
            octokit,
            owner,
            repo,
            newContent,
            readme.sha,
            author
        )

        // Update installation record
        await prisma.installation.update({
            where: { id: installationId },
            data: {
                commitsToday: { increment: 1 },
                lastRunAt: new Date(),
            },
        })

        // Log success
        await prisma.activityLog.create({
            data: {
                installationId: installationId,
                action: 'manual_commit',
                message: `Manual commit ${commitSha.substring(0, 7)}`,
            },
        })

        console.log(`[MANUAL COMMIT] Created commit ${commitSha} for ${installation.repoFullName}`)

        return NextResponse.json({
            success: true,
            commitSha: commitSha.substring(0, 7),
            message: `Commit created: ${commitSha.substring(0, 7)}`,
        })

    } catch (error) {
        logError(error, { action: 'manual commit' })

        // Handle specific GitHub errors
        if (error instanceof GitHubError) {
            if (error.code === 'GITHUB_003') {
                return NextResponse.json(
                    { success: false, error: 'Permission denied. The app may need to be reinstalled.' },
                    { status: 403 }
                )
            }
            if (error.code === 'GITHUB_001') {
                return NextResponse.json(
                    { success: false, error: 'GitHub rate limit exceeded. Please try again later.' },
                    { status: 429 }
                )
            }
        }

        const appError = toAppError(error)
        const { body, status } = createErrorResponse(appError)
        return NextResponse.json(body, { status })
    }
}
