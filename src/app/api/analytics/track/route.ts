import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

        // Skip localhost to avoid spamming Discord during development
        const isLocalhost = !ip || ip === '127.0.0.1' || ip === '::1'
        if (isLocalhost) {
            return NextResponse.json({ success: true, skipped: 'localhost' })
        }

        // Normalize page to only track specific pages
        const normalizedPage = page === '/dashboard' ? '/dashboard' : '/'

        // Check if this IP+page combination has already been notified
        const existing = await prisma.visitorLog.findUnique({
            where: {
                ip_page: { ip, page: normalizedPage }
            }
        })

        // Rate limit: allow one notification per IP per page per hour
        const ONE_HOUR_MS = 60 * 60 * 1000
        const now = new Date()

        if (existing) {
            const timeSinceLastVisit = now.getTime() - existing.createdAt.getTime()

            if (timeSinceLastVisit < ONE_HOUR_MS) {
                // Less than 1 hour since last notification, skip
                return NextResponse.json({ success: true, rateLimited: true })
            }

            // More than 1 hour ago - update the record and send new notification
            await prisma.visitorLog.update({
                where: { id: existing.id },
                data: {
                    createdAt: now,
                    country,
                    userAgent,
                }
            })
        } else {
            // New visitor - create record
            await prisma.visitorLog.create({
                data: {
                    ip,
                    page: normalizedPage,
                    country,
                    userAgent,
                }
            })
        }

        // Get current visitor count for this page (for display in notification)
        const visitorCount = await prisma.visitorLog.count({
            where: { page: normalizedPage }
        })

        // Send to Discord with visitor count (non-blocking in background)
        sendVisitorNotification({
            page: normalizedPage,
            userAgent,
            ip,
            country,
            referrer: referrer || undefined,
            timestamp: new Date().toISOString(),
            visitorNumber: visitorCount + 1, // +1 because this is the new visitor
        }).catch(err => console.error('[ANALYTICS] Background send failed:', err))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[ANALYTICS] Track error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
