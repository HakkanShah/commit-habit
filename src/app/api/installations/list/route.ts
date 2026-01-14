import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/installations/list
 * Returns the current user's installations with minimal data for polling.
 * This endpoint is optimized for lightweight polling to detect new installations.
 */
export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch only essential fields for efficiency
        const installations = await prisma.installation.findMany({
            where: { userId: session.userId },
            select: {
                id: true,
                installationId: true,
                repoFullName: true,
                active: true,
                commitsToday: true,
                lastRunAt: true,
                createdAt: true,
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    select: {
                        id: true,
                        action: true,
                        message: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            count: installations.length,
            installations: installations.map(inst => ({
                id: inst.id,
                installationId: inst.installationId,
                repoFullName: inst.repoFullName,
                active: inst.active,
                commitsToday: inst.commitsToday,
                lastRunAt: inst.lastRunAt?.toISOString() || null,
                createdAt: inst.createdAt.toISOString(),
                activityLogs: inst.activityLogs.map(log => ({
                    id: log.id,
                    action: log.action,
                    message: log.message,
                    createdAt: log.createdAt.toISOString(),
                })),
            })),
        })
    } catch (error) {
        console.error('[API] Failed to fetch installations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch installations' },
            { status: 500 }
        )
    }
}
