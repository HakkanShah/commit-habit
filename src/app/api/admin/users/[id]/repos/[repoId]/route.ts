import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createErrorResponse, ValidationError } from '@/lib/errors'

// GET /api/admin/users/[id]/repos/[repoId] - Get single repo details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; repoId: string }> }
) {
    try {
        await requireAdmin()
        const { id: userId, repoId } = await params

        if (!userId || !repoId) {
            throw ValidationError.missingField('userId or repoId')
        }

        const installation = await prisma.installation.findFirst({
            where: { id: repoId, userId },
            select: {
                id: true,
                installationId: true,
                repoFullName: true,
                repoId: true,
                active: true,
                commitsToday: true,
                lastRunAt: true,
                createdAt: true,
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        action: true,
                        message: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: { activityLogs: true }
                }
            }
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Repository not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Count total commits
        const totalCommits = await prisma.activityLog.count({
            where: {
                installationId: repoId,
                action: 'commit_created'
            }
        })

        return NextResponse.json({
            repo: {
                ...installation,
                totalCommits,
                totalActivityLogs: installation._count.activityLogs
            }
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// PATCH /api/admin/users/[id]/repos/[repoId] - Pause/Resume repo
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; repoId: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id: userId, repoId } = await params

        if (!userId || !repoId) {
            throw ValidationError.missingField('userId or repoId')
        }

        // Parse body
        let body: { active?: boolean }
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        if (typeof body.active !== 'boolean') {
            return NextResponse.json(
                { error: 'active field must be boolean', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Find installation
        const installation = await prisma.installation.findFirst({
            where: { id: repoId, userId },
            select: { id: true, repoFullName: true, active: true }
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Repository not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Update
        const updated = await prisma.installation.update({
            where: { id: repoId },
            data: { active: body.active },
            select: { id: true, repoFullName: true, active: true }
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                installationId: repoId,
                action: body.active ? 'resumed' : 'paused',
                message: `Automation ${body.active ? 'resumed' : 'paused'} by admin`
            }
        })

        // Log admin action
        await logAudit({
            userId: adminSession.userId,
            action: body.active ? 'ADMIN_RESUME_REPO' : 'ADMIN_PAUSE_REPO',
            actorType: 'ADMIN',
            targetUserId: userId,
            entityType: 'Installation',
            entityId: repoId,
            metadata: {
                repoFullName: installation.repoFullName,
                previousState: installation.active,
                newState: body.active
            }
        })

        return NextResponse.json({
            success: true,
            message: `Repository ${body.active ? 'resumed' : 'paused'}`,
            repo: updated
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// DELETE /api/admin/users/[id]/repos/[repoId] - Remove repo
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; repoId: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id: userId, repoId } = await params

        if (!userId || !repoId) {
            throw ValidationError.missingField('userId or repoId')
        }

        // Find installation
        const installation = await prisma.installation.findFirst({
            where: { id: repoId, userId },
            select: { id: true, repoFullName: true, userId: true }
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Repository not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Delete activity logs first, then installation
        await prisma.$transaction([
            prisma.activityLog.deleteMany({
                where: { installationId: repoId }
            }),
            prisma.installation.delete({
                where: { id: repoId }
            })
        ])

        // Log admin action
        await logAudit({
            userId: adminSession.userId,
            action: 'ADMIN_DELETE_REPO',
            actorType: 'ADMIN',
            targetUserId: userId,
            entityType: 'Installation',
            entityId: repoId,
            metadata: {
                repoFullName: installation.repoFullName
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Repository removed'
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
