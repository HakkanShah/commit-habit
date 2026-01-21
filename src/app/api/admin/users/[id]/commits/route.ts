import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, ValidationError } from '@/lib/errors'
import { parsePaginationParams, DEFAULT_LIMIT } from '@/lib/pagination'

// GET /api/admin/users/[id]/commits - Get user's commit history
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
        const take = Math.min(limit || DEFAULT_LIMIT, 100) + 1

        // Get user's installations first
        const installations = await prisma.installation.findMany({
            where: { userId: id },
            select: { id: true, repoFullName: true }
        })

        const installationIds = installations.map(i => i.id)
        const repoNameMap = new Map(installations.map(i => [i.id, i.repoFullName]))

        if (installationIds.length === 0) {
            return NextResponse.json({
                commits: [],
                total: 0,
                hasMore: false,
                nextCursor: null
            })
        }

        // Fetch commit activity logs
        const [commits, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: {
                    installationId: { in: installationIds },
                    action: 'commit_created'
                },
                select: {
                    id: true,
                    installationId: true,
                    action: true,
                    message: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
            }),
            prisma.activityLog.count({
                where: {
                    installationId: { in: installationIds },
                    action: 'commit_created'
                }
            })
        ])

        // Format response
        const formattedCommits = commits.slice(0, limit || DEFAULT_LIMIT).map(c => ({
            id: c.id,
            repoFullName: repoNameMap.get(c.installationId) || 'Unknown',
            message: c.message,
            createdAt: c.createdAt
        }))

        const hasMore = commits.length > (limit || DEFAULT_LIMIT)
        const lastItem = formattedCommits[formattedCommits.length - 1]

        return NextResponse.json({
            commits: formattedCommits,
            total,
            hasMore,
            nextCursor: hasMore && lastItem ? lastItem.id : null
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
