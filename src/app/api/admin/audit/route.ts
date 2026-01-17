import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { queryAuditLogs, type AuditLogQuery } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'

// GET /api/admin/audit - Query audit logs
export async function GET(request: NextRequest) {
    try {
        // Require admin access
        await requireAdmin()

        // Parse query parameters
        const { searchParams } = new URL(request.url)

        const query: AuditLogQuery = {
            userId: searchParams.get('userId') ?? undefined,
            action: searchParams.get('action') ?? undefined,
            entityType: searchParams.get('entityType') ?? undefined,
            entityId: searchParams.get('entityId') ?? undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
        }

        // Parse date filters
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (startDate) {
            query.startDate = new Date(startDate)
        }
        if (endDate) {
            query.endDate = new Date(endDate)
        }

        // Query audit logs
        const { logs, total } = await queryAuditLogs(query)

        return NextResponse.json({
            logs,
            total,
            limit: query.limit,
            offset: query.offset,
            hasMore: (query.offset ?? 0) + logs.length < total
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
