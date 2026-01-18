import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendCustomEmail } from '@/lib/email'

interface SendEmailRequest {
    userIds: string[]
    subject: string
    body: string
    isHtml?: boolean
}

interface EmailResult {
    userId: string
    email: string | null
    status: 'SENT' | 'FAILED' | 'SKIPPED_NO_EMAIL'
    error?: string
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: SendEmailRequest = await request.json()
        const { userIds, subject, body: emailBody, isHtml = true } = body

        // Validation
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No users selected' }, { status: 400 })
        }

        if (!subject || subject.trim().length === 0) {
            return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
        }

        if (!emailBody || emailBody.trim().length === 0) {
            return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
        }

        // Safety limit
        if (userIds.length > 100) {
            return NextResponse.json({ error: 'Maximum 100 users per batch' }, { status: 400 })
        }

        // Fetch users
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true }
        })

        const results: EmailResult[] = []
        let sent = 0
        let failed = 0
        let skipped = 0

        // Send emails sequentially with delay to avoid rate limits
        for (const user of users) {
            if (!user.email) {
                results.push({
                    userId: user.id,
                    email: null,
                    status: 'SKIPPED_NO_EMAIL'
                })
                skipped++
                continue
            }

            // Small delay between emails (100ms)
            if (results.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            const result = await sendCustomEmail(user.email, subject, emailBody, isHtml)

            if (result.success) {
                results.push({
                    userId: user.id,
                    email: user.email,
                    status: 'SENT'
                })
                sent++

                // Log to audit
                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'ADMIN_EMAIL_RECEIVED',
                        metadata: { subject }
                    }
                })
            } else {
                results.push({
                    userId: user.id,
                    email: user.email,
                    status: 'FAILED',
                    error: result.error
                })
                failed++
            }
        }

        console.log(`[ADMIN EMAIL] Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`)

        return NextResponse.json({
            success: true,
            total: users.length,
            sent,
            failed,
            skipped,
            results
        })

    } catch (error) {
        console.error('[ADMIN EMAIL] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send emails' },
            { status: 500 }
        )
    }
}
