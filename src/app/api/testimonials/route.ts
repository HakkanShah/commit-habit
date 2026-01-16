import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Testimonial, User } from '@prisma/client'

// GET /api/testimonials - Fetch approved testimonials for homepage
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const featured = searchParams.get('featured') === 'true'

        const testimonials = await prisma.testimonial.findMany({
            where: {
                approved: true,
                ...(featured && { featured: true }),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 12, // Limit to 12 testimonials
        })

        // Transform data to hide user IDs
        const formattedTestimonials = testimonials.map((t) => ({
            id: t.id,
            userName: t.user.name || 'Anonymous User',
            avatarUrl: t.user.avatarUrl,
            content: t.content,
            rating: t.rating,
            createdAt: t.createdAt,
        }))

        return NextResponse.json({ testimonials: formattedTestimonials })
    } catch (error) {
        console.error('[API] Error fetching testimonials:', error)
        return NextResponse.json(
            { error: 'Failed to fetch testimonials' },
            { status: 500 }
        )
    }
}
