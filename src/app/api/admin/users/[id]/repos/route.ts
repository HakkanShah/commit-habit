import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, ValidationError } from '@/lib/errors'
import { parsePaginationParams, buildPaginatedResponse, DEFAULT_LIMIT } from '@/lib/pagination'

// GET /api/admin/users/[id]/repos - Get user's repositories with pagination
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params
        const { searchParams } = new URL(request.url)

        if (!id || typeof id !== 'string') {
            throw ValidationError.missingField('id')
        }

        // Verify user exists
        const userExists = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        })

        if (!userExists) {
            return NextResponse.json(
                { error: 'User not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Parse pagination
        const { cursor, limit } = parsePaginationParams(searchParams)
        const take = Math.min(limit || DEFAULT_LIMIT, 50) + 1

        // Fetch installations with activity stats
        const [installations, total] = await Promise.all([
            prisma.installation.findMany({
                where: { userId: id },
                select: {
                    id: true,
                    installationId: true,
                    repoFullName: true,
                    repoId: true,
                    active: true,
                    commitsToday: true,
                    lastRunAt: true,
                    createdAt: true,
                    _count: {
                        select: {
                            activityLogs: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
            }),
            prisma.installation.count({ where: { userId: id } })
        ])

        // Get total commits per repo
        const repoIds = installations.map(i => i.id)
        const commitCounts = await prisma.activityLog.groupBy({
            by: ['installationId'],
            where: {
                installationId: { in: repoIds },
                action: 'commit_created'
            },
            _count: { id: true }
        })

        const commitCountMap = new Map(
            commitCounts.map(c => [c.installationId, c._count.id])
        )

        // Format response
        const formattedRepos = installations.slice(0, limit || DEFAULT_LIMIT).map(repo => ({
            id: repo.id,
            installationId: repo.installationId,
            repoFullName: repo.repoFullName,
            repoId: repo.repoId,
            active: repo.active,
            commitsToday: repo.commitsToday,
            totalCommits: commitCountMap.get(repo.id) || 0,
            totalActivityLogs: repo._count.activityLogs,
            lastRunAt: repo.lastRunAt,
            createdAt: repo.createdAt
        }))

        const hasMore = installations.length > (limit || DEFAULT_LIMIT)
        const lastItem = formattedRepos[formattedRepos.length - 1]

        return NextResponse.json({
            repos: formattedRepos,
            total,
            hasMore,
            nextCursor: hasMore && lastItem ? lastItem.id : null
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
