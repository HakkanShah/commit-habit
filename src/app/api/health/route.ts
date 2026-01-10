import { NextResponse } from 'next/server'

// Simple health check - no database, no auth
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            hasDatabase: !!process.env.DATABASE_URL,
            hasGithubApp: !!process.env.GITHUB_APP_ID,
            hasCronSecret: !!process.env.CRON_SECRET,
            hasSessionSecret: !!process.env.SESSION_SECRET,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
        }
    })
}
