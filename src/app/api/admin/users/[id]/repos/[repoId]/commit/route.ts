/**
 * POST /api/admin/users/[id]/repos/[repoId]/commit - admin-triggered commit.
 *
 * This was the third copy of the commit flow and the most broken of the three:
 * it attributed the commit to the user's **profile email**. A profile email only
 * counts towards the contribution graph while it is a verified address on that
 * GitHub account, so support-triggered commits frequently landed in the
 * repository and changed nothing on the user's graph - making the problem look
 * unfixable from the admin side. It now uses the same engine and the same
 * noreply identity as everything else.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createErrorResponse, ValidationError } from '@/lib/errors'
import {
    runCommitForInstallation,
    installationForCommitSelect,
    type InstallationForCommit,
} from '@/lib/commit-service'

export const dynamic = 'force-dynamic'

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

        const installation = await prisma.installation.findFirst({
            where: { id: repoId, userId },
            select: installationForCommitSelect,
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Repository not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        const outcome = await runCommitForInstallation(
            installation as unknown as InstallationForCommit,
            { ignoreExistingCommits: true, successAction: 'manual_commit' }
        )

        // Audit the attempt either way: a failed admin action is as important to
        // record as a successful one.
        await logAudit({
            userId: adminSession.userId,
            action: 'ADMIN_COMMIT',
            actorType: 'ADMIN',
            targetUserId: userId,
            entityType: 'Installation',
            entityId: repoId,
            metadata: {
                repoFullName: installation.repoFullName,
                outcome: outcome.status,
                detail: outcome.status === 'committed' ? outcome.sha : outcome.message,
            },
        })

        if (outcome.status === 'committed') {
            return NextResponse.json({
                success: true,
                message: 'Commit created successfully',
                commit: {
                    sha: outcome.sha,
                    repo: outcome.repo,
                },
                warnings: outcome.warnings,
            })
        }

        if (outcome.status === 'skipped') {
            return NextResponse.json(
                {
                    success: false,
                    error: outcome.message,
                    reason: outcome.reason,
                    warnings: outcome.warnings,
                },
                { status: 409 }
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
            { status: 502 }
        )
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
