import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/auth'

/**
 * POST /api/dev/login
 * 
 * Development-only endpoint to create a mock admin session for local testing.
 * ⚠️ ONLY works when NODE_ENV !== 'production'
 * 
 * Usage: 
 *   fetch('/api/dev/login', { method: 'POST' }).then(r => r.json()).then(console.log)
 */
export async function POST(request: NextRequest) {
    // CRITICAL: Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'This endpoint is disabled in production' },
            { status: 403 }
        )
    }

    try {
        // Get admin email from env
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? []
        const adminEmail = adminEmails[0]

        if (!adminEmail) {
            return NextResponse.json(
                { error: 'No ADMIN_EMAILS configured in .env' },
                { status: 400 }
            )
        }

        // Find or create a dev admin user
        let user = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (!user) {
            // Create a dev admin user
            user = await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Dev Admin',
                    role: 'ADMIN',
                    avatarUrl: 'https://github.com/identicons/admin.png',
                }
            })
            console.log('[DEV] Created dev admin user:', user.email)
        } else if (user.role !== 'ADMIN') {
            // Promote existing user to admin for dev purposes
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' }
            })
            console.log('[DEV] Promoted user to admin:', user.email)
        }

        // Create a session for this user
        await setSessionCookie({
            userId: user.id,
            provider: 'github',
            providerAccountId: 'dev-admin',
            name: user.name || 'Dev Admin',
        })

        return NextResponse.json({
            success: true,
            message: 'Dev admin session created!',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            nextSteps: [
                'Refresh the page',
                'Go to /admin to see the dashboard',
                'Run the test-seed to populate sample data',
            ],
        })
    } catch (error) {
        console.error('[DEV LOGIN] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create dev session' },
            { status: 500 }
        )
    }
}

// GET endpoint with instructions
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    return NextResponse.json({
        message: '🔧 Dev Login Endpoint',
        usage: 'Send POST request to login as admin without GitHub OAuth',
        note: 'This creates a session using the first email in ADMIN_EMAILS',
        example: "fetch('/api/dev/login', { method: 'POST' }).then(r => r.json()).then(console.log)",
    })
}
