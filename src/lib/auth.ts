import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const SESSION_SECRET = process.env.CRON_SECRET || 'default-secret-change-me'
const SESSION_COOKIE_NAME = 'commit-habit-session'

export interface SessionPayload {
    userId: string
    provider: 'github' | 'google'
    providerAccountId: string
    name: string
}

/**
 * Create a session token
 */
export function createSessionToken(payload: SessionPayload): string {
    return jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' })
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, SESSION_SECRET) as SessionPayload
    } catch {
        return null
    }
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
    const token = createSessionToken(payload)
    const cookieStore = await cookies()

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    })
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) return null

    return verifySessionToken(token)
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}
