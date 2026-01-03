import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/installations - List user's installations
export async function GET() {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const installations = await prisma.installation.findMany({
            where: { userId: session.userId },
            include: {
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ installations })
    } catch (error) {
        console.error('Error fetching installations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch installations' },
            { status: 500 }
        )
    }
}

// PATCH /api/installations - Update installation (pause/resume)
export async function PATCH(request: NextRequest) {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { installationId, active } = await request.json()

        if (!installationId || typeof active !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // Verify ownership
        const installation = await prisma.installation.findFirst({
            where: {
                id: installationId,
                userId: session.userId,
            },
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Installation not found' },
                { status: 404 }
            )
        }

        // Update installation
        const updated = await prisma.installation.update({
            where: { id: installationId },
            data: { active },
        })

        // Log the action
        await prisma.activityLog.create({
            data: {
                installationId: installationId,
                action: active ? 'resumed' : 'paused',
                message: `Automation ${active ? 'resumed' : 'paused'} by user`,
            },
        })

        return NextResponse.json({ installation: updated })
    } catch (error) {
        console.error('Error updating installation:', error)
        return NextResponse.json(
            { error: 'Failed to update installation' },
            { status: 500 }
        )
    }
}
