import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { logAudit, logAuditAsync, queryAuditLogs, cleanupOldAuditLogs } from '@/lib/audit'

describe('Audit Module', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('logAudit', () => {
        it('should create an audit log entry', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({
                id: 'audit-1',
                userId: 'user-1',
                action: 'LOGIN',
                entityType: null,
                entityId: null,
                metadata: null,
                ipAddress: null,
                createdAt: new Date(),
            })

            await logAudit({
                userId: 'user-1',
                action: 'LOGIN',
            })

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    action: 'LOGIN',
                    entityType: null,
                    entityId: null,
                    metadata: undefined,
                    ipAddress: null,
                }
            })
        })

        it('should log audit with all fields', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({
                id: 'audit-2',
                userId: 'user-1',
                action: 'TESTIMONIAL_APPROVED',
                entityType: 'Testimonial',
                entityId: 'test-123',
                metadata: { reason: 'Good content' },
                ipAddress: '127.0.0.1',
                createdAt: new Date(),
            })

            await logAudit({
                userId: 'user-1',
                action: 'TESTIMONIAL_APPROVED',
                entityType: 'Testimonial',
                entityId: 'test-123',
                metadata: { reason: 'Good content' },
                ipAddress: '127.0.0.1',
            })

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    action: 'TESTIMONIAL_APPROVED',
                    entityType: 'Testimonial',
                    entityId: 'test-123',
                    metadata: { reason: 'Good content' },
                    ipAddress: '127.0.0.1',
                }
            })
        })

        it('should not throw on database error', async () => {
            vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB Error'))

            // Should not throw
            await expect(logAudit({
                userId: 'user-1',
                action: 'LOGIN',
            })).resolves.toBeUndefined()
        })
    })

    describe('queryAuditLogs', () => {
        it('should query with filters', async () => {
            const mockLogs = [
                {
                    id: 'audit-1',
                    userId: 'user-1',
                    action: 'LOGIN',
                    entityType: null,
                    entityId: null,
                    metadata: null,
                    ipAddress: null,
                    createdAt: new Date(),
                    user: { name: 'Test User', email: 'test@test.com', avatarUrl: null },
                },
            ]

            vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never)
            vi.mocked(prisma.auditLog.count).mockResolvedValue(1)

            const result = await queryAuditLogs({
                userId: 'user-1',
                action: 'LOGIN',
                limit: 10,
                offset: 0,
            })

            expect(result.logs).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(prisma.auditLog.findMany).toHaveBeenCalled()
        })

        it('should filter by date range', async () => {
            vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
            vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-12-31')

            await queryAuditLogs({
                startDate,
                endDate,
            })

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    }),
                })
            )
        })
    })

    describe('cleanupOldAuditLogs', () => {
        it('should delete old audit logs', async () => {
            vi.mocked(prisma.auditLog.deleteMany).mockResolvedValue({ count: 100 })

            const result = await cleanupOldAuditLogs(30) // 30 days

            expect(result).toBe(100)
            expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
                where: {
                    createdAt: { lt: expect.any(Date) },
                },
            })
        })
    })
})
