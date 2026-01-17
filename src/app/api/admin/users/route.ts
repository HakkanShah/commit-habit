import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse } from '@/lib/errors'

// GET /api/admin/users - List all users with activity summary
export async function GET(request: NextRequest) {
    try {
        // Require admin access
        await requireAdmin()

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') ?? undefined
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

        // Build where clause for search
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {}

        // Fetch users with related data
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                    lastLoginAt: true,
                    createdAt: true,
                    accounts: {
                        select: {
                            provider: true,
                            providerUsername: true
                        }
                    },
                    _count: {
                        select: {
                            installations: true,
                            testimonials: true,
                            auditLogs: true
                        }
                    },
                    installations: {
                        select: {
                            id: true,
                            repoFullName: true,
                            active: true,
                            commitsToday: true,
                            lastRunAt: true,
                            _count: {
                                select: {
                                    activityLogs: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.user.count({ where })
        ])

        // Get total stats
        const stats = await prisma.$transaction([
            prisma.user.count(),
            prisma.installation.count({ where: { active: true } }),
            prisma.testimonial.count({ where: { status: 'PENDING' } }),
            prisma.activityLog.count({ where: { action: 'commit_created' } })
        ])

        // Format users
        const formattedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            githubUsername: user.accounts.find(a => a.provider === 'github')?.providerUsername ?? null,
            providers: user.accounts.map(a => a.provider),
            stats: {
                installations: user._count.installations,
                testimonials: user._count.testimonials,
                auditLogs: user._count.auditLogs
            },
            installations: user.installations.map(i => ({
                id: i.id,
                repoFullName: i.repoFullName,
                active: i.active,
                commitsToday: i.commitsToday,
                lastRunAt: i.lastRunAt,
                totalActivityLogs: i._count.activityLogs
            }))
        }))

        return NextResponse.json({
            users: formattedUsers,
            total,
            limit,
            offset,
            hasMore: offset + users.length < total,
            globalStats: {
                totalUsers: stats[0],
                activeInstallations: stats[1],
                pendingTestimonials: stats[2],
                totalAutoCommits: stats[3]
            }
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
