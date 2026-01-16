import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all approved testimonials
export async function GET() {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { approved: true },
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

        // Format for frontend
        const formatted = testimonials.map(t => ({
            id: t.id,
            userName: t.user.name || 'Anonymous',
            githubUsername: t.user.accounts[0]?.providerUsername || 'user',
            content: t.content,
            rating: t.rating,
            createdAt: t.createdAt
        }))

        return NextResponse.json({ testimonials: formatted })
    } catch (error) {
        console.error('Error fetching testimonials:', error)
        return NextResponse.json({ testimonials: [] })
    }
}

// POST - Create or update feedback
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

        let testimonial
        if (existing) {
            // Update existing
            testimonial = await prisma.testimonial.update({
                where: { id: existing.id },
                data: {
                    content: content.trim(),
                    rating: Math.round(ratingNum),
                    approved: true, // Auto-approve updates for now
                    updatedAt: new Date()
                }
            })
        } else {
            // Create new
            testimonial = await prisma.testimonial.create({
                data: {
                    userId: session.userId,
                    content: content.trim(),
                    rating: Math.round(ratingNum),
                    approved: true, // Auto-approve for now (can add moderation later)
                    featured: false,
                }
            })
        }

        return NextResponse.json(
            { success: true, testimonial, isUpdate: !!existing },
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
