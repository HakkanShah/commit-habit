import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createErrorResponse, ValidationError, GitHubError } from '@/lib/errors'
import {
    getInstallationOctokit,
    getReadmeContent,
    toggleReadmeWhitespace,
    commitReadmeUpdate
} from '@/lib/github'

// POST /api/admin/users/[id]/repos/[repoId]/commit - Admin trigger commit
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; repoId: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id: userId, repoId } = await params

        if (!userId || !repoId) {
            throw ValidationError.missingField('userId or repoId')
        }

        // Find installation with user info for commit attribution
        const installation = await prisma.installation.findFirst({
            where: { id: repoId, userId },
            select: {
                id: true,
                installationId: true,
                repoFullName: true,
                active: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        accounts: {
                            where: { provider: 'github' },
                            select: { providerUsername: true }
                        }
                    }
                }
            }
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Repository not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Parse repo name
        const [owner, repo] = installation.repoFullName.split('/')
        if (!owner || !repo) {
            return NextResponse.json(
                { error: 'Invalid repo name format', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Get Octokit for this installation
        const octokit = await getInstallationOctokit(installation.installationId)

        // Get README content
        const readme = await getReadmeContent(octokit, owner, repo)
        if (!readme) {
            return NextResponse.json(
                { error: 'README.md not found in repository', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Toggle whitespace
        const newContent = toggleReadmeWhitespace(readme.content)

        // Get user email for commit attribution (so it counts for their contribution graph)
        const userEmail = installation.user.email
        const userName = installation.user.name || installation.user.accounts[0]?.providerUsername || 'CommitHabit User'

        // Commit with user attribution
        const commitSha = await commitReadmeUpdate(
            octokit,
            owner,
            repo,
            newContent,
            readme.sha,
            userEmail ? { name: userName, email: userEmail } : undefined
        )

        // Update installation stats
        await prisma.installation.update({
            where: { id: repoId },
            data: {
                commitsToday: { increment: 1 },
                lastRunAt: new Date()
            }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                installationId: repoId,
                action: 'commit_created',
                message: `Admin-triggered commit: ${commitSha.substring(0, 7)}`
            }
        })

        // Log admin action
        await logAudit({
            userId: adminSession.userId,
            action: 'ADMIN_COMMIT',
            actorType: 'ADMIN',
            targetUserId: userId,
            entityType: 'Installation',
            entityId: repoId,
            metadata: {
                repoFullName: installation.repoFullName,
                commitSha,
                attributedTo: userName
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Commit created successfully',
            commit: {
                sha: commitSha,
                repo: installation.repoFullName,
                attributedTo: userName
            }
        })
    } catch (error) {
        // Handle GitHub-specific errors
        if (error instanceof GitHubError) {
            return NextResponse.json(
                { error: error.userMessage, code: error.code },
                { status: 400 }
            )
        }

        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
