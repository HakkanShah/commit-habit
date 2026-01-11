import { NextRequest, NextResponse } from 'next/server'
import { sendVisitorNotification } from '@/lib/analytics'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { page, referrer } = body

        // Get visitor info from headers
        const userAgent = request.headers.get('user-agent') || undefined
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            undefined

        // Try to get country from Vercel headers
        const country = request.headers.get('x-vercel-ip-country') || undefined

        // Send to Discord (non-blocking in background)
        sendVisitorNotification({
            page: page || '/',
            userAgent,
            ip,
            country,
            referrer: referrer || undefined,
            timestamp: new Date().toISOString(),
        }).catch(err => console.error('[ANALYTICS] Background send failed:', err))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[ANALYTICS] Track error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
