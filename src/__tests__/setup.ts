import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock environment variables
process.env.SESSION_SECRET = 'test-secret-for-testing-purposes-only'
process.env.ADMIN_EMAILS = 'admin@test.com,superadmin@test.com'
process.env.AUDIT_RETENTION_DAYS = '365'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        testimonial: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            deleteMany: vi.fn(),
        },
        installation: {
            count: vi.fn(),
        },
        activityLog: {
            count: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

// Mock cookies
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })),
}))
