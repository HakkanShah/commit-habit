import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForUser } from '@/lib/github'
import { setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const setupAction = searchParams.get('setup_action')
    const installationIdStr = searchParams.get('installation_id')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Handle GitHub App installation callback
    if (setupAction === 'install') {
        const installationId = validateInstallationId(installationIdStr)

        if (!installationId) {
            console.warn('[AUTH] Installation callback with invalid installation_id:', installationIdStr)
        }

        // User just installed the app, redirect to dashboard
        // The webhook will have already created the installation record
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
                        email: user.email,
                        avatarUrl: user.avatar_url,
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
                        email: user.email,
                        avatarUrl: user.avatar_url,
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
