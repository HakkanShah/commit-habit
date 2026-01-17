import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

// Import the functions to test
import { isAdmin, requireAdmin, getAdminUser } from '@/lib/admin-auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
    getSession: vi.fn(),
    requireSession: vi.fn(),
}))

import { getSession, requireSession } from '@/lib/auth'

describe('Admin Auth Module', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('isAdmin', () => {
        it('should return true for user with ADMIN role', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                role: 'ADMIN',
                email: 'user@example.com',
                name: null,
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await isAdmin('user-1')

            expect(result).toBe(true)
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                select: { role: true, email: true }
            })
        })

        it('should return true for user in ADMIN_EMAILS env var', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-2',
                role: 'USER',
                email: 'admin@test.com', // This is in ADMIN_EMAILS
                name: null,
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await isAdmin('user-2')

            expect(result).toBe(true)
        })

        it('should return false for regular user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-3',
                role: 'USER',
                email: 'regular@example.com',
                name: null,
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await isAdmin('user-3')

            expect(result).toBe(false)
        })

        it('should return false for non-existent user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

            const result = await isAdmin('non-existent')

            expect(result).toBe(false)
        })
    })

    describe('requireAdmin', () => {
        it('should throw for non-admin user', async () => {
            vi.mocked(requireSession).mockResolvedValue({
                userId: 'user-1',
                provider: 'github',
                providerAccountId: '12345',
                name: 'Test User',
            })

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                role: 'USER',
                email: 'regular@example.com',
                name: 'Test User',
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await expect(requireAdmin()).rejects.toThrow()
        })

        it('should return admin session for admin user', async () => {
            vi.mocked(requireSession).mockResolvedValue({
                userId: 'admin-1',
                provider: 'github',
                providerAccountId: '12345',
                name: 'Admin User',
            })

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'admin-1',
                role: 'ADMIN',
                email: 'admin@example.com',
                name: 'Admin User',
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await requireAdmin()

            expect(result.userId).toBe('admin-1')
            expect(result.user.role).toBe('ADMIN')
        })
    })

    describe('getAdminUser', () => {
        it('should return null when not logged in', async () => {
            vi.mocked(getSession).mockResolvedValue(null)

            const result = await getAdminUser()

            expect(result).toBeNull()
        })

        it('should return null for non-admin user', async () => {
            vi.mocked(getSession).mockResolvedValue({
                userId: 'user-1',
                provider: 'github',
                providerAccountId: '12345',
                name: 'Test User',
            })

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-1',
                role: 'USER',
                email: 'regular@example.com',
                name: 'Test User',
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await getAdminUser()

            expect(result).toBeNull()
        })

        it('should return admin user for admin', async () => {
            vi.mocked(getSession).mockResolvedValue({
                userId: 'admin-1',
                provider: 'github',
                providerAccountId: '12345',
                name: 'Admin User',
            })

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'admin-1',
                role: 'ADMIN',
                email: 'admin@example.com',
                name: 'Admin User',
                avatarUrl: null,
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await getAdminUser()

            expect(result).not.toBeNull()
            expect(result?.role).toBe('ADMIN')
        })
    })
})
