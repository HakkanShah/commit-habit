import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    ValidationError,
    AuthenticationError,
    DatabaseError,
    logError,
    createErrorResponse,
} from '@/lib/errors'

// ============================================================================
// Types
// ============================================================================

interface PatchRequestBody {
    installationId?: unknown
    active?: unknown
}

// ============================================================================
// Validation
// ============================================================================

function validatePatchBody(body: PatchRequestBody): { installationId: string; active: boolean } {
    if (!body.installationId || typeof body.installationId !== 'string') {
        throw ValidationError.missingField('installationId')
    }

    if (typeof body.active !== 'boolean') {
        throw ValidationError.invalidValue('active', body.active, 'must be a boolean')
    }

    return {
        installationId: body.installationId,
        active: body.active,
    }
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET /api/installations - List user's installations
export async function GET() {
    // Check authentication
    const session = await getSession()

    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'AUTH_005', message: 'Please log in to continue' },
            { status: 401 }
        )
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

        return NextResponse.json({
            success: true,
            installations,
            count: installations.length,
        })
    } catch (error) {
        logError(error, { action: 'fetch installations', userId: session.userId })
        const { body, status } = createErrorResponse(
            DatabaseError.queryError('fetch installations')
        )
        return NextResponse.json(body, { status })
    }
}

// PATCH /api/installations - Update installation (pause/resume)
export async function PATCH(request: NextRequest) {
    // Check authentication
    const session = await getSession()

    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'AUTH_005', message: 'Please log in to continue' },
            { status: 401 }
        )
    }

    // Parse and validate request body
    let body: PatchRequestBody
    try {
        body = await request.json()
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON', code: 'VALIDATION_001', message: 'Request body must be valid JSON' },
            { status: 400 }
        )
    }

    let validated: { installationId: string; active: boolean }
    try {
        validated = validatePatchBody(body)
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json(error.toUserResponse(), { status: 400 })
        }
        throw error
    }

    try {
        // Verify ownership - user can only modify their own installations
        const installation = await prisma.installation.findFirst({
            where: {
                id: validated.installationId,
                userId: session.userId,
            },
        })

        if (!installation) {
            return NextResponse.json(
                {
                    error: 'Not found',
                    code: 'DB_003',
                    message: 'Installation not found or you do not have access',
                },
                { status: 404 }
            )
        }

        // Check if already in the requested state
        if (installation.active === validated.active) {
            return NextResponse.json({
                success: true,
                installation,
                message: `Installation is already ${validated.active ? 'active' : 'paused'}`,
            })
        }

        // Update installation
        const updated = await prisma.installation.update({
            where: { id: validated.installationId },
            data: { active: validated.active },
        })

        // Log the action
        await prisma.activityLog.create({
            data: {
                installationId: validated.installationId,
                action: validated.active ? 'resumed' : 'paused',
                message: `Automation ${validated.active ? 'resumed' : 'paused'} by user`,
            },
        })

        console.log(
            `[INSTALLATIONS] User ${session.userId} ${validated.active ? 'resumed' : 'paused'} installation ${validated.installationId}`
        )

        return NextResponse.json({
            success: true,
            installation: updated,
            message: `Automation ${validated.active ? 'resumed' : 'paused'}`,
        })
    } catch (error) {
        logError(error, {
            action: 'update installation',
            userId: session.userId,
            installationId: validated.installationId,
        })
        const { body, status } = createErrorResponse(
            DatabaseError.queryError('update installation')
        )
        return NextResponse.json(body, { status })
    }
}

// DELETE /api/installations - Remove an installation (optional endpoint)
export async function DELETE(request: NextRequest) {
    const session = await getSession()

    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'AUTH_005', message: 'Please log in to continue' },
            { status: 401 }
        )
    }

    // Get installation ID from query params
    const { searchParams } = new URL(request.url)
    const installationId = searchParams.get('id')

    if (!installationId) {
        return NextResponse.json(
            { error: 'Missing parameter', code: 'VALIDATION_002', message: 'Installation ID is required' },
            { status: 400 }
        )
    }

    try {
        // Verify ownership
        const installation = await prisma.installation.findFirst({
            where: {
                id: installationId,
                userId: session.userId,
            },
        })

        if (!installation) {
            return NextResponse.json(
                { error: 'Not found', code: 'DB_003', message: 'Installation not found' },
                { status: 404 }
            )
        }

        // Delete activity logs first (cascade)
        await prisma.activityLog.deleteMany({
            where: { installationId },
        })

        // Delete the installation
        await prisma.installation.delete({
            where: { id: installationId },
        })

        console.log(`[INSTALLATIONS] User ${session.userId} deleted installation ${installationId}`)

        return NextResponse.json({
            success: true,
            message: 'Installation removed',
        })
    } catch (error) {
        logError(error, {
            action: 'delete installation',
            userId: session.userId,
            installationId,
        })
        const { body, status } = createErrorResponse(
            DatabaseError.queryError('delete installation')
        )
        return NextResponse.json(body, { status })
    }
}
