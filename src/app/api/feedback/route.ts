import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditAsync } from '@/lib/audit'
import { sendAdminNewTestimonialNotification } from '@/lib/email'

// GET - Fetch all approved testimonials
export async function GET() {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { status: 'APPROVED' },
            include: {
                user: {
                    include: {
                        accounts: {
                            where: { provider: 'github' },
                            select: { providerUsername: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Format for frontend - use editedContent if available, otherwise original content
        const formatted = testimonials.map(t => ({
            id: t.id,
            userName: t.user.name || 'Anonymous',
            githubUsername: t.user.accounts[0]?.providerUsername || 'user',
            content: t.editedContent ?? t.content, // Prefer edited content
            rating: t.rating,
            createdAt: t.createdAt
        }))

        return NextResponse.json({ testimonials: formatted })
    } catch (error) {
        console.error('Error fetching testimonials:', error)
        return NextResponse.json({ testimonials: [] })
    }
}

// POST - Create or update feedback (always goes to PENDING for new submissions)
export async function POST(request: Request) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { error: 'You must be logged in to submit feedback.' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { content, rating } = body

        // Validate content
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Feedback content is required.' },
                { status: 400 }
            )
        }

        if (content.length > 100) {
            return NextResponse.json(
                { error: 'Feedback content is too long (max 100 characters).' },
                { status: 400 }
            )
        }

        // Validate rating
        const ratingNum = Number(rating)
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5.' },
                { status: 400 }
            )
        }

        // Check if user already has a testimonial (upsert)
        const existing = await prisma.testimonial.findFirst({
            where: { userId: session.userId }
        })

        // Get user info for notification
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                name: true,
                email: true,
                avatarUrl: true,
                accounts: {
                    where: { provider: 'github' },
                    select: { providerUsername: true }
                }
            }
        })

        let testimonial
        if (existing) {
            // Update existing - goes back to PENDING for re-review
            testimonial = await prisma.testimonial.update({
                where: { id: existing.id },
                data: {
                    content: content.trim(),
                    rating: Math.round(ratingNum),
                    status: 'PENDING', // Requires re-approval when updated
                    editedContent: null, // Clear any previous admin edits
                    editedAt: null,
                    editedBy: null,
                    updatedAt: new Date()
                }
            })

            // Log audit
            logAuditAsync({
                userId: session.userId,
                action: 'TESTIMONIAL_SUBMITTED',
                entityType: 'Testimonial',
                entityId: testimonial.id,
                metadata: { isUpdate: true }
            })
        } else {
            // Create new - starts as PENDING
            testimonial = await prisma.testimonial.create({
                data: {
                    userId: session.userId,
                    content: content.trim(),
                    rating: Math.round(ratingNum),
                    status: 'PENDING', // Requires admin approval
                    featured: false,
                }
            })

            // Log audit
            logAuditAsync({
                userId: session.userId,
                action: 'TESTIMONIAL_SUBMITTED',
                entityType: 'Testimonial',
                entityId: testimonial.id,
                metadata: { isUpdate: false }
            })
        }

        // Send email notification to admins (fire and forget)
        sendAdminNewTestimonialNotification({
            userName: user?.name || 'Anonymous',
            userEmail: user?.email || null,
            githubUsername: user?.accounts[0]?.providerUsername || null,
            avatarUrl: user?.avatarUrl || null,
            content: content.trim(),
            rating: Math.round(ratingNum),
            isUpdate: !!existing
        }).catch(err => console.error('[EMAIL] Failed to send admin notification:', err))

        return NextResponse.json(
            {
                success: true,
                testimonial: {
                    id: testimonial.id,
                    status: testimonial.status,
                    content: testimonial.content,
                    rating: testimonial.rating
                },
                isUpdate: !!existing,
                message: 'Your feedback has been submitted and is pending admin approval.'
            },
            { status: existing ? 200 : 201 }
        )
    } catch (error) {
        console.error('Feedback submission error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}
