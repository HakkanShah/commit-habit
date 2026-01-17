import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse } from '@/lib/errors'

// GET /api/admin/feedback - List testimonials with optional status filter
export async function GET(request: NextRequest) {
    try {
        // Require admin access
        await requireAdmin()

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // PENDING, APPROVED, REJECTED, or null for all
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

        // Build where clause
        const where = status ? { status } : {}

        // Fetch testimonials with user info
        const [testimonials, total] = await Promise.all([
            prisma.testimonial.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                            accounts: {
                                where: { provider: 'github' },
                                select: { providerUsername: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.testimonial.count({ where })
        ])

        // Format response
        const formattedTestimonials = testimonials.map(t => ({
            id: t.id,
            userId: t.userId,
            userName: t.user.name || 'Anonymous',
            userEmail: t.user.email,
            userAvatar: t.user.avatarUrl,
            githubUsername: t.user.accounts[0]?.providerUsername || null,
            content: t.content,
            editedContent: t.editedContent,
            rating: t.rating,
            status: t.status,
            featured: t.featured,
            editedAt: t.editedAt,
            editedBy: t.editedBy,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        }))

        // Get pending count for badge
        const pendingCount = await prisma.testimonial.count({ where: { status: 'PENDING' } })

        return NextResponse.json({
            testimonials: formattedTestimonials,
            total,
            pendingCount,
            limit,
            offset,
            hasMore: offset + testimonials.length < total
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
