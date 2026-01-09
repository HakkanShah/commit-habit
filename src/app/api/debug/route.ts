import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const quickCheck = url.searchParams.get('quick') === 'true'

    // Quick health check without auth for diagnosing issues
    if (quickCheck) {
        const results: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            env: {
                DATABASE_URL: !!process.env.DATABASE_URL,
                DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) || 'NOT_SET',
                GITHUB_APP_ID: !!process.env.GITHUB_APP_ID,
                GITHUB_APP_CLIENT_ID: !!process.env.GITHUB_APP_CLIENT_ID,
                GITHUB_APP_CLIENT_SECRET: !!process.env.GITHUB_APP_CLIENT_SECRET,
                SESSION_SECRET: !!process.env.SESSION_SECRET,
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
            }
        }

        // Test database connection
        try {
            const userCount = await prisma.user.count()
            results.database = {
                connected: true,
                userCount,
            }
        } catch (dbError) {
            results.database = {
                connected: false,
                error: dbError instanceof Error ? dbError.message : String(dbError),
                errorName: dbError instanceof Error ? dbError.name : 'Unknown',
            }
        }

        return NextResponse.json(results)
    }

    // Full debug requires auth
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n')

    // Get active installations count
    const installationsCount = await prisma.installation.count({ where: { active: true } })
    const installations = await prisma.installation.findMany({ where: { active: true } })

    return NextResponse.json({
        envCheck: {
            GITHUB_APP_ID: !!process.env.GITHUB_APP_ID,
            GITHUB_APP_PRIVATE_KEY_LENGTH: privateKey?.length || 0,
            GITHUB_APP_PRIVATE_KEY_STARTS_WITH: privateKey?.substring(0, 30),
            GITHUB_APP_CLIENT_ID: !!process.env.GITHUB_APP_CLIENT_ID,
            GITHUB_APP_CLIENT_SECRET: !!process.env.GITHUB_APP_CLIENT_SECRET,
            CRON_SECRET: !!process.env.CRON_SECRET,
        },
        database: {
            activeInstallations: installationsCount,
            installations: installations.map(i => ({
                id: i.id,
                repoFullName: i.repoFullName,
                installationId: i.installationId,
                active: i.active,
            })),
        },
    })
}
