import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: {
            hasAppId: !!process.env.GITHUB_APP_ID,
            hasPrivateKey: !!process.env.GITHUB_APP_PRIVATE_KEY,
            hasClientId: !!process.env.GITHUB_APP_CLIENT_ID,
            hasCronSecret: !!process.env.CRON_SECRET,
            hasDbUrl: !!process.env.DATABASE_URL,
        }
    })
}
