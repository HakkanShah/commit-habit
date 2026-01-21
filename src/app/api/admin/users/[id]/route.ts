import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { createErrorResponse, DatabaseError, ValidationError } from '@/lib/errors'

// GET /api/admin/users/[id] - Get detailed user info
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id } = await params

        if (!id || typeof id !== 'string') {
            throw ValidationError.missingField('id')
        }

        // Fetch user with all related data using optimized select
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                role: true,
                lastLoginAt: true,
                deletedAt: true,
                deletedBy: true,
                createdAt: true,
                updatedAt: true,
                accounts: {
                    select: {
                        id: true,
                        provider: true,
                        providerUsername: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        installations: true,
                        testimonials: true,
                        auditLogs: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Get GitHub username from accounts
        const githubAccount = user.accounts.find(a => a.provider === 'github')

        // Get total commits made by CommitHabit for this user
        const totalCommits = await prisma.activityLog.count({
            where: {
                installation: { userId: id },
                action: 'commit_created'
            }
        })

        return NextResponse.json({
            user: {
                ...user,
                githubUsername: githubAccount?.providerUsername ?? null,
                providers: user.accounts.map(a => a.provider),
                stats: {
                    repos: user._count.installations,
                    testimonials: user._count.testimonials,
                    auditLogs: user._count.auditLogs,
                    totalCommits
                },
                isDeleted: !!user.deletedAt
            }
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// PATCH /api/admin/users/[id] - Restore soft-deleted user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id } = await params

        if (!id || typeof id !== 'string') {
            throw ValidationError.missingField('id')
        }

        // Parse request body
        let body: { action?: string }
        try {
            body = await request.json()
        } catch {
            body = {}
        }

        if (body.action !== 'restore') {
            return NextResponse.json(
                { error: 'Invalid action', code: 'VALIDATION_ERROR', message: 'Only "restore" action is supported' },
                { status: 400 }
            )
        }

        // Check if user exists and is deleted
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, deletedAt: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        if (!user.deletedAt) {
            return NextResponse.json(
                { error: 'User is not deleted', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Restore user
        const restoredUser = await prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
                deletedBy: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                deletedAt: true
            }
        })

        // Log admin action
        await logAudit({
            userId: adminSession.userId,
            action: 'ADMIN_RESTORE_USER',
            actorType: 'ADMIN',
            targetUserId: id,
            entityType: 'User',
            entityId: id,
            metadata: {
                userName: user.name,
                userEmail: user.email
            }
        })

        return NextResponse.json({
            success: true,
            message: 'User restored successfully',
            user: restoredUser
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// DELETE /api/admin/users/[id] - Soft-delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminSession = await requireAdmin()
        const { id } = await params

        if (!id || typeof id !== 'string') {
            throw ValidationError.missingField('id')
        }

        // Prevent self-deletion
        if (id === adminSession.userId) {
            return NextResponse.json(
                { error: 'Cannot delete yourself', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, deletedAt: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        if (user.deletedAt) {
            return NextResponse.json(
                { error: 'User already deleted', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Prevent deleting other admins (optional safety)
        if (user.role === 'ADMIN') {
            return NextResponse.json(
                { error: 'Cannot delete admin users', code: 'FORBIDDEN' },
                { status: 403 }
            )
        }

        // Soft-delete: set deletedAt and deletedBy
        const deletedUser = await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: adminSession.userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                deletedAt: true
            }
        })

        // Pause all user's installations
        await prisma.installation.updateMany({
            where: { userId: id },
            data: { active: false }
        })

        // Log admin action
        await logAudit({
            userId: adminSession.userId,
            action: 'ADMIN_DELETE_USER',
            actorType: 'ADMIN',
            targetUserId: id,
            entityType: 'User',
            entityId: id,
            metadata: {
                userName: user.name,
                userEmail: user.email
            }
        })

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully (soft-delete, 30-day retention)',
            user: deletedUser
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
