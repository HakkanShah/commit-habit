import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { exchangeCodeForUser } from '@/lib/github'
import { setSessionCookie } from '@/lib/auth'
import { OAUTH_STATE_COOKIE } from '../github/route'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail, sendAdminNewUserNotification } from '@/lib/email'
import {
    AppError,
    AuthenticationError,
    DatabaseError,
    ValidationError,
    toAppError,
    logError,
    createErrorResponse,
} from '@/lib/errors'

// ============================================================================
// Error Code Mappings for URL Parameters
// ============================================================================

const ERROR_CODES: Record<string, { code: string; message: string }> = {
    no_code: { code: 'missing_code', message: 'Authorization code is missing' },
    code_expired: { code: 'code_expired', message: 'Authorization code has expired' },
    oauth_failed: { code: 'oauth_failed', message: 'OAuth authentication failed' },
    user_fetch_failed: { code: 'user_error', message: 'Failed to retrieve user information' },
    db_error: { code: 'server_error', message: 'A server error occurred' },
    bad_state: { code: 'bad_state', message: 'Login session expired or invalid. Please try again.' },
    account_deleted: { code: 'account_deleted', message: 'This account has been deleted. Contact support to restore it.' },
    unknown: { code: 'unknown_error', message: 'An unexpected error occurred' },
}

/**
 * Create a redirect URL with error parameters
 */
function createErrorRedirect(
    appUrl: string,
    errorKey: keyof typeof ERROR_CODES,
    details?: string
): NextResponse {
    const errorInfo = ERROR_CODES[errorKey] || ERROR_CODES.unknown
    const url = new URL(appUrl)
    url.searchParams.set('error', errorInfo.code)
    url.searchParams.set('message', details || errorInfo.message)
    return NextResponse.redirect(url.toString())
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateInstallationId(id: string | null): number | null {
    if (!id) return null
    const parsed = parseInt(id, 10)
    if (isNaN(parsed) || parsed <= 0) {
        logError(new ValidationError(
            'Invalid installation ID',
            `Installation ID '${id}' is not a valid positive integer`,
            { installationId: id }
        ))
        return null
    }
    return parsed
}

/**
 * Decide whether `email` can be written to `userId`'s row.
 *
 * `User.email` is unique. Returns false when another user already holds it.
 */
async function isEmailAvailable(email: string | null, userId: string | null): Promise<boolean> {
    if (!email) return false

    try {
        const owner = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })
        return !owner || owner.id === userId
    } catch (error) {
        // If we cannot tell, do not risk the constraint error.
        logError(error, { action: 'check email availability' })
        return false
    }
}

/** Build the `email` part of a user update, omitting it when unsafe. */
async function resolveEmailUpdate(
    email: string | null,
    userId: string
): Promise<{ email?: string }> {
    return (await isEmailAvailable(email, userId)) ? { email: email as string } : {}
}

/** Constant-time string comparison for the OAuth state nonce. */
function timingSafeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const setupAction = searchParams.get('setup_action')
    const installationIdStr = searchParams.get('installation_id')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Handle GitHub App installation callback (install or update repos)
    if (setupAction === 'install' || setupAction === 'update') {
        const installationId = validateInstallationId(installationIdStr)

        if (!installationId) {
            console.warn('[AUTH] Installation callback with invalid installation_id:', installationIdStr)
        }

        // User just installed/updated the app, redirect to dashboard
        // The webhook will have already created/updated the installation record
        const redirectUrl = new URL(`${appUrl}/dashboard`)
        redirectUrl.searchParams.set('installed', 'true')
        if (installationId) {
            redirectUrl.searchParams.set('installation_id', String(installationId))
        }
        return NextResponse.redirect(redirectUrl.toString())
    }

    // Handle OAuth callback - validate code
    if (!code) {
        console.warn('[AUTH] OAuth callback missing code parameter')
        return createErrorRedirect(appUrl, 'no_code')
    }

    // Verify the CSRF nonce issued by /api/auth/github before spending the code.
    const stateFromGitHub = searchParams.get('state')
    const cookieStore = await cookies()
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value

    if (!stateFromGitHub || !expectedState || !timingSafeEquals(stateFromGitHub, expectedState)) {
        console.warn('[AUTH] OAuth callback with missing or mismatched state')
        cookieStore.delete(OAUTH_STATE_COOKIE)
        return createErrorRedirect(appUrl, 'bad_state')
    }

    // Single use: consume the nonce so a replayed callback cannot reuse it.
    cookieStore.delete(OAUTH_STATE_COOKIE)

    // Validate code format (GitHub codes are typically 20 characters)
    if (code.length < 10 || code.length > 100) {
        console.warn('[AUTH] OAuth callback with suspicious code length:', code.length)
        return createErrorRedirect(appUrl, 'no_code', 'Invalid authorization code format')
    }

    try {
        // Exchange code for user info
        console.log('[AUTH] Exchanging OAuth code for user info')
        const { accessToken, user } = await exchangeCodeForUser(code)
        console.log('[AUTH] Successfully authenticated user:', user.login)

        // Check if GitHub account already exists
        let existingAccount
        try {
            existingAccount = await prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: 'github',
                        providerAccountId: String(user.id),
                    },
                },
                include: { user: true },
            })
        } catch (dbError) {
            logError(dbError, {
                action: 'find account',
                provider: 'github',
                providerAccountId: user.id,
            })
            throw DatabaseError.queryError('find account by provider', {}, dbError instanceof Error ? dbError : undefined)
        }

        let userId: string

        if (existingAccount) {
            // Existing user - update tokens
            console.log('[AUTH] Updating existing user:', existingAccount.userId)

            // A deleted account must not be revived by simply logging in again.
            if (existingAccount.user.deletedAt) {
                console.warn('[AUTH] Login attempt on soft-deleted user:', existingAccount.userId)
                return createErrorRedirect(appUrl, 'account_deleted')
            }

            try {
                await prisma.account.update({
                    where: { id: existingAccount.id },
                    data: {
                        accessToken,
                        providerUsername: user.login,
                    },
                })

                await prisma.user.update({
                    where: { id: existingAccount.userId },
                    data: {
                        name: user.name,
                        // `email` is unique, and GitHub hands back null whenever the
                        // user keeps their address private. Writing that null wiped a
                        // good address, and writing an address another row already
                        // held (the same person signed in with Google first) threw a
                        // unique-constraint error that surfaced as a generic
                        // "server error" and made login permanently impossible for
                        // that account. Only claim an email we can actually hold.
                        ...(await resolveEmailUpdate(user.email, existingAccount.userId)),
                        avatarUrl: user.avatar_url,
                        lastLoginAt: new Date(),
                    },
                })
            } catch (dbError) {
                logError(dbError, {
                    action: 'update account',
                    userId: existingAccount.userId,
                })
                throw DatabaseError.queryError('update account', {}, dbError instanceof Error ? dbError : undefined)
            }

            userId = existingAccount.userId
        } else {
            // Create new user with GitHub account
            console.log('[AUTH] Creating new user for GitHub account:', user.id)

            try {
                const newUser = await prisma.user.create({
                    data: {
                        name: user.name,
                        // Same unique-email hazard as above: if this address is
                        // already taken by another account, create the user without
                        // one rather than failing the whole login.
                        email: (await isEmailAvailable(user.email, null)) ? user.email : null,
                        avatarUrl: user.avatar_url,
                        lastLoginAt: new Date(),
                        accounts: {
                            create: {
                                provider: 'github',
                                providerAccountId: String(user.id),
                                providerUsername: user.login,
                                accessToken,
                            },
                        },
                    },
                })

                userId = newUser.id

                // Send welcome email (non-blocking)
                if (user.email) {
                    sendWelcomeEmail(user.email, user.name || user.login)
                        .then(sent => {
                            if (sent) console.log('[AUTH] Welcome email sent to:', user.email)
                        })
                        .catch(err => console.error('[AUTH] Failed to send welcome email:', err))
                }

                // Send admin notification (non-blocking)
                sendAdminNewUserNotification({
                    email: user.email,
                    githubUsername: user.login,
                    name: user.name,
                    avatarUrl: user.avatar_url,
                    githubId: user.id,
                })
                    .then(sent => {
                        if (sent) console.log('[AUTH] Admin notification sent for new user:', user.login)
                    })
                    .catch(err => console.error('[AUTH] Failed to send admin notification:', err))
            } catch (dbError) {
                logError(dbError, {
                    action: 'create user',
                    githubId: user.id,
                    githubLogin: user.login,
                })
                throw DatabaseError.queryError('create user', {}, dbError instanceof Error ? dbError : undefined)
            }
        }

        // Set session
        await setSessionCookie({
            userId,
            provider: 'github',
            providerAccountId: String(user.id),
            name: user.login,
        })

        console.log('[AUTH] Session created for user:', userId)

        // Redirect to dashboard
        return NextResponse.redirect(`${appUrl}/dashboard`)
    } catch (error) {
        // Log the full error for debugging
        logError(error, { action: 'auth callback', codePrefix: code.substring(0, 8) })

        // Determine the appropriate error response
        if (error instanceof AuthenticationError) {
            if (error.code === 'AUTH_004') {
                return createErrorRedirect(appUrl, 'code_expired')
            }
            return createErrorRedirect(appUrl, 'oauth_failed', error.userMessage)
        }

        if (error instanceof DatabaseError) {
            return createErrorRedirect(appUrl, 'db_error')
        }

        if (error instanceof AppError) {
            return createErrorRedirect(appUrl, 'unknown', error.userMessage)
        }

        // Unknown error
        const appError = toAppError(error)
        return createErrorRedirect(appUrl, 'unknown', appError.userMessage)
    }
}
