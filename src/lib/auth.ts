import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AuthenticationError, ConfigurationError, logError } from './errors'

// ============================================================================
// Configuration
// ============================================================================

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.CRON_SECRET

// Validate session secret at startup
if (!SESSION_SECRET) {
    console.error('[SECURITY] SESSION_SECRET is not configured - using insecure default!')
} else if (SESSION_SECRET.length < 32) {
    console.warn('[SECURITY] SESSION_SECRET should be at least 32 characters long')
}

const EFFECTIVE_SESSION_SECRET = SESSION_SECRET || 'default-secret-change-me-in-production'
const SESSION_COOKIE_NAME = 'commit-habit-session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

// ============================================================================
// Types
// ============================================================================

export interface SessionPayload {
    userId: string
    provider: 'github' | 'google'
    providerAccountId: string
    name: string
    iat?: number
    exp?: number
}

// ============================================================================
// Session Token Functions
// ============================================================================

/**
 * Create a session token
 */
export function createSessionToken(payload: SessionPayload): string {
    // Validate payload
    if (!payload.userId || typeof payload.userId !== 'string') {
        throw new ConfigurationError('Invalid session payload: missing userId')
    }
    if (!payload.provider || !['github', 'google'].includes(payload.provider)) {
        throw new ConfigurationError('Invalid session payload: invalid provider')
    }
    if (!payload.providerAccountId || typeof payload.providerAccountId !== 'string') {
        throw new ConfigurationError('Invalid session payload: missing providerAccountId')
    }
    if (!payload.name || typeof payload.name !== 'string') {
        throw new ConfigurationError('Invalid session payload: missing name')
    }

    try {
        return jwt.sign(
            {
                userId: payload.userId,
                provider: payload.provider,
                providerAccountId: payload.providerAccountId,
                name: payload.name,
            },
            EFFECTIVE_SESSION_SECRET,
            { expiresIn: '30d' }
        )
    } catch (error) {
        logError(error, { action: 'create session token' })
        throw new ConfigurationError(
            'Failed to create session token',
            { error: error instanceof Error ? error.message : String(error) },
            error instanceof Error ? error : undefined
        )
    }
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
    if (!token || typeof token !== 'string') {
        return null
    }

    try {
        const decoded = jwt.verify(token, EFFECTIVE_SESSION_SECRET) as SessionPayload

        // Validate the decoded payload structure
        if (!decoded.userId || !decoded.provider || !decoded.providerAccountId) {
            logError(new Error('Invalid token payload structure'), {
                hasUserId: !!decoded.userId,
                hasProvider: !!decoded.provider,
                hasProviderAccountId: !!decoded.providerAccountId,
            })
            return null
        }

        return decoded
    } catch (error) {
        // Log specific JWT errors for debugging
        if (error instanceof jwt.TokenExpiredError) {
            console.log('[AUTH] Session token expired at:', error.expiredAt)
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.log('[AUTH] Invalid token:', error.message)
        } else if (error instanceof jwt.NotBeforeError) {
            console.log('[AUTH] Token not yet valid')
        } else {
            logError(error, { action: 'verify session token' })
        }

        return null
    }
}

/**
 * Verify session token and throw specific errors for different failure cases
 * Use this when you need to know WHY verification failed
 */
export function verifySessionTokenStrict(token: string): SessionPayload {
    if (!token || typeof token !== 'string') {
        throw AuthenticationError.invalidToken({ reason: 'empty or invalid token' })
    }

    try {
        const decoded = jwt.verify(token, EFFECTIVE_SESSION_SECRET) as SessionPayload

        // Validate the decoded payload structure
        if (!decoded.userId || !decoded.provider || !decoded.providerAccountId) {
            throw AuthenticationError.invalidToken({ reason: 'malformed payload' })
        }

        return decoded
    } catch (error) {
        if (error instanceof AuthenticationError) {
            throw error
        }

        if (error instanceof jwt.TokenExpiredError) {
            throw AuthenticationError.tokenExpired({
                expiredAt: error.expiredAt.toISOString(),
            })
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw AuthenticationError.invalidToken({
                reason: error.message,
            })
        }

        throw AuthenticationError.invalidToken({
            reason: error instanceof Error ? error.message : 'unknown error',
        })
    }
}

// ============================================================================
// Cookie Functions
// ============================================================================

/**
 * Set the session cookie
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
    const token = createSessionToken(payload)

    try {
        const cookieStore = await cookies()

        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE_SECONDS,
            path: '/',
        })
    } catch (error) {
        logError(error, { action: 'set session cookie' })
        throw new ConfigurationError(
            'Failed to set session cookie',
            {},
            error instanceof Error ? error : undefined
        )
    }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

        if (!token) {
            return null
        }

        return verifySessionToken(token)
    } catch (error) {
        // Log but don't throw - return null for any session retrieval issues
        logError(error, { action: 'get session' })
        return null
    }
}

/**
 * Get session or throw AuthenticationError
 * Use this when authentication is required
 */
export async function requireSession(): Promise<SessionPayload> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

        if (!token) {
            throw AuthenticationError.unauthorized({ reason: 'no session cookie' })
        }

        return verifySessionTokenStrict(token)
    } catch (error) {
        if (error instanceof AuthenticationError) {
            throw error
        }

        logError(error, { action: 'require session' })
        throw AuthenticationError.unauthorized({
            reason: error instanceof Error ? error.message : 'unknown error',
        })
    }
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
    try {
        const cookieStore = await cookies()
        cookieStore.delete(SESSION_COOKIE_NAME)
    } catch (error) {
        // Log but don't throw - clearing session should be best-effort
        logError(error, { action: 'clear session' })
    }
}

/**
 * Check if the current request has a valid session
 */
export async function hasValidSession(): Promise<boolean> {
    const session = await getSession()
    return session !== null
}
