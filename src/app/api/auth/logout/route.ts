import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST() {
    await clearSession()
    return NextResponse.json({ success: true })
}

export async function GET() {
    await clearSession()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(appUrl)
}
