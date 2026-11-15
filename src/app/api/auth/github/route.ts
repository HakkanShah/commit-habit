import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const GITHUB_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/** Name of the short-lived cookie holding the OAuth `state` nonce. */
export const OAUTH_STATE_COOKIE = 'commit-habit-oauth-state'

export const dynamic = 'force-dynamic'

export async function GET() {
    if (!GITHUB_CLIENT_ID) {
        return NextResponse.redirect(new URL('/?error=github_not_configured', APP_URL))
    }

    // The login flow had no `state` parameter at all, which makes it vulnerable
    // to login CSRF: an attacker can complete the OAuth dance with their own
    // authorization code and have a victim's browser submit it, silently signing
    // the victim into the attacker's account (and, from there, attaching the
    // attacker's repositories to a session the victim trusts). The nonce below is
    // echoed back by GitHub and checked against an httpOnly cookie in the
    // callback, so only a flow this server started can complete.
    const state = crypto.randomBytes(32).toString('hex')

    const cookieStore = await cookies()
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes is plenty to finish a login
        path: '/',
    })

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: `${APP_URL}/api/auth/callback`,
        scope: 'read:user user:email',
        state,
    })

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}
