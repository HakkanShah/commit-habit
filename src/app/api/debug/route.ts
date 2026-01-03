import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    // Only allow with cron secret
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
