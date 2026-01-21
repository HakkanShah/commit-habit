import { prisma } from './prisma'
import { logError } from './errors'
import type { Prisma } from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

/**
 * Actor type for distinguishing who performed the action
 */
export type AuditActorType = 'USER' | 'ADMIN' | 'SYSTEM'

/**
 * Audit action types for tracking user and admin activities
 */
export type AuditAction =
    // User authentication
    | 'LOGIN'
    | 'LOGOUT'
    // Repository management (user actions)
    | 'REPO_ADDED'
    | 'REPO_REMOVED'
    | 'REPO_PAUSED'
    | 'REPO_RESUMED'
    // Auto-commit events (system actions)
    | 'AUTO_COMMIT_SUCCESS'
    | 'AUTO_COMMIT_SKIPPED'
    | 'AUTO_COMMIT_ERROR'
    // Testimonial events
    | 'TESTIMONIAL_SUBMITTED'
    | 'TESTIMONIAL_APPROVED'
    | 'TESTIMONIAL_REJECTED'
    | 'TESTIMONIAL_EDITED'
    // Admin actions
    | 'ADMIN_DELETE_USER'
    | 'ADMIN_RESTORE_USER'
    | 'ADMIN_DELETE_REPO'
    | 'ADMIN_PAUSE_REPO'
    | 'ADMIN_RESUME_REPO'
    | 'ADMIN_COMMIT'
    | 'ADMIN_PROMOTED'
    | 'ADMIN_DEMOTED'
    // Generic (catch-all)
    | string

export type AuditEntityType =
    | 'User'
    | 'Installation'
    | 'Testimonial'
    | 'Account'
    | string

export interface AuditLogParams {
    userId: string
    action: AuditAction
    actorType?: AuditActorType
    targetUserId?: string
    entityType?: AuditEntityType
    entityId?: string
    metadata?: Prisma.InputJsonValue
    ipAddress?: string
}

// ============================================================================
// Audit Logging Functions
// ============================================================================

/**
 * Create an immutable audit log entry
 * This is the primary function for logging user and admin actions
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                actorType: params.actorType ?? 'USER',
                targetUserId: params.targetUserId ?? null,
                entityType: params.entityType ?? null,
                entityId: params.entityId ?? null,
                metadata: params.metadata ?? undefined,
                ipAddress: params.ipAddress ?? null
            }
        })
    } catch (error) {
        // Log the error but don't throw - audit logging should not break the main flow
        logError(error, {
            action: 'logAudit',
            auditAction: params.action,
            userId: params.userId
        })
    }
}

/**
 * Log an audit entry asynchronously (fire-and-forget)
 * Use this when you don't want to wait for the audit log to be written
 */
export function logAuditAsync(params: AuditLogParams): void {
    // Don't await - fire and forget
    logAudit(params).catch(error => {
        logError(error, { action: 'logAuditAsync', auditAction: params.action })
    })
}

/**
 * Query audit logs with filters
 */
export interface AuditLogQuery {
    userId?: string
    action?: AuditAction
    actions?: AuditAction[]
    actorType?: AuditActorType
    targetUserId?: string
    entityType?: AuditEntityType
    entityId?: string
    startDate?: Date
    endDate?: Date
    cursor?: string
    limit?: number
    offset?: number
}

export async function queryAuditLogs(query: AuditLogQuery) {
    const where: Prisma.AuditLogWhereInput = {}

    if (query.userId) where.userId = query.userId
    if (query.action) where.action = query.action
    if (query.actions && query.actions.length > 0) {
        where.action = { in: query.actions }
    }
    if (query.actorType) where.actorType = query.actorType
    if (query.targetUserId) where.targetUserId = query.targetUserId
    if (query.entityType) where.entityType = query.entityType
    if (query.entityId) where.entityId = query.entityId

    if (query.startDate || query.endDate) {
        where.createdAt = {}
        if (query.startDate) where.createdAt.gte = query.startDate
        if (query.endDate) where.createdAt.lte = query.endDate
    }

    const limit = query.limit ?? 50

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            select: {
                id: true,
                action: true,
                actorType: true,
                targetUserId: true,
                entityType: true,
                entityId: true,
                metadata: true,
                createdAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {})
        }),
        prisma.auditLog.count({ where })
    ])

    const hasMore = logs.length > limit
    const resultLogs = hasMore ? logs.slice(0, limit) : logs
    const lastItem = resultLogs[resultLogs.length - 1]

    return {
        logs: resultLogs,
        total,
        hasMore,
        nextCursor: hasMore && lastItem ? lastItem.id : null
    }
}

/**
 * Get audit log summary for a user
 */
export async function getUserAuditSummary(userId: string) {
    const [
        totalActions,
        lastLogin,
        recentActions
    ] = await Promise.all([
        prisma.auditLog.count({ where: { userId } }),
        prisma.auditLog.findFirst({
            where: { userId, action: 'LOGIN' },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        })
    ])

    return {
        totalActions,
        lastLogin: lastLogin?.createdAt ?? null,
        recentActions
    }
}

/**
 * Clean up old audit logs based on retention policy
 * Default: 3 years (1095 days)
 */
export async function cleanupOldAuditLogs(retentionDays?: number): Promise<number> {
    const days = retentionDays ?? parseInt(process.env.AUDIT_RETENTION_DAYS ?? '1095', 10)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    try {
        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        })

        console.log(`[AUDIT] Cleaned up ${result.count} audit logs older than ${days} days`)
        return result.count
    } catch (error) {
        logError(error, { action: 'cleanupOldAuditLogs', retentionDays: days })
        throw error
    }
}
