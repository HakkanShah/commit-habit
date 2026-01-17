import { prisma } from './prisma'
import { getSession, requireSession, type SessionPayload } from './auth'
import { AuthenticationError, logError } from './errors'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Admin emails from environment variable (comma-separated)
 * Used as a fallback for bootstrapping the first admin
 */
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
    ?.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean) ?? []

// ============================================================================
// Types
// ============================================================================

export interface AdminUser {
    id: string
    email: string | null
    name: string | null
    role: string
}

export interface AdminSession extends SessionPayload {
    user: AdminUser
}

// ============================================================================
// Admin Authentication Functions
// ============================================================================

/**
 * Check if a user is an admin by their database role or email
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, email: true }
        })

        if (!user) return false

        // Check database role first
        if (user.role === 'ADMIN') return true

        // Fallback: check ADMIN_EMAILS environment variable
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return true
        }

        return false
    } catch (error) {
        logError(error, { action: 'isAdmin check', userId })
        return false
    }
}

/**
 * Check if the current session belongs to an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    const session = await getSession()
    if (!session) return false
    return isAdmin(session.userId)
}

/**
 * Require admin access - throws if user is not an admin
 * Use this in API routes that require admin privileges
 */
export async function requireAdmin(): Promise<AdminSession> {
    // First, require a valid session
    const session = await requireSession()

    // Fetch user and check admin status
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    })

    if (!user) {
        throw AuthenticationError.unauthorized({ reason: 'User not found' })
    }

    // Check if user is admin
    const isAdminUser = user.role === 'ADMIN' ||
        (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))

    if (!isAdminUser) {
        throw AuthenticationError.unauthorized({
            reason: 'Admin access required',
            code: 'ADMIN_REQUIRED'
        })
    }

    return {
        ...session,
        user
    }
}

/**
 * Get admin user info if current user is admin, null otherwise
 * Use this for conditional UI rendering (non-throwing)
 */
export async function getAdminUser(): Promise<AdminUser | null> {
    try {
        const session = await getSession()
        if (!session) return null

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        if (!user) return null

        const isAdminUser = user.role === 'ADMIN' ||
            (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))

        return isAdminUser ? user : null
    } catch (error) {
        logError(error, { action: 'getAdminUser' })
        return null
    }
}
