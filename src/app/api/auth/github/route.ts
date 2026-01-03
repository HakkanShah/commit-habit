import { NextResponse } from 'next/server'

const GITHUB_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET() {
    if (!GITHUB_CLIENT_ID) {
        return NextResponse.redirect(new URL('/?error=github_not_configured', APP_URL))
    }

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: `${APP_URL}/api/auth/callback`,
        scope: 'read:user user:email',
    })

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}
