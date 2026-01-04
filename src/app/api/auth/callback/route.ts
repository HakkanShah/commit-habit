import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForUser } from '@/lib/github'
import { setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const setupAction = searchParams.get('setup_action')
    const installationId = searchParams.get('installation_id')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Handle GitHub App installation callback
    if (setupAction === 'install' && installationId) {
        // User just installed the app, redirect to dashboard
        // The webhook will have already created the installation record
        return NextResponse.redirect(`${appUrl}/dashboard?installed=true`)
    }

    // Handle OAuth callback
    if (!code) {
        return NextResponse.redirect(`${appUrl}?error=no_code`)
    }

    try {
        // Exchange code for user info
        const { accessToken, user } = await exchangeCodeForUser(code)

        // Check if GitHub account already exists
        const existingAccount = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'github',
                    providerAccountId: String(user.id),
                },
            },
            include: { user: true },
        })

        let userId: string

        if (existingAccount) {
            // Existing user - update tokens
            await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                    accessToken,
                    providerUsername: user.login,
                },
            })

            // Update user info
            await prisma.user.update({
                where: { id: existingAccount.userId },
                data: {
                    name: user.login,
                    avatarUrl: user.avatar_url,
                },
            })

            userId = existingAccount.userId
        } else {
            // Create new user with GitHub account
            const newUser = await prisma.user.create({
                data: {
                    name: user.login,
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
        }

        // Set session
        await setSessionCookie({
            userId,
            provider: 'github',
            providerAccountId: String(user.id),
            name: user.login,
        })

        // Redirect to dashboard
        return NextResponse.redirect(`${appUrl}/dashboard`)
    } catch (error) {
        console.error('Auth callback error:', error)
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }
        return NextResponse.redirect(`${appUrl}?error=auth_failed`)
    }
}
