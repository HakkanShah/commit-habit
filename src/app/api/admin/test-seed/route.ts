import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'

/**
 * POST /api/admin/test-seed
 * 
 * Seeds sample data for testing the admin panel UI.
 * ONLY available in development mode and requires admin access.
 * 
 * Creates:
 * - Sample testimonials with various statuses (PENDING, APPROVED)
 * - Sample audit log entries
 */
export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Test seeding is not allowed in production' },
            { status: 403 }
        )
    }

    try {
        // Require admin access
        const adminSession = await requireAdmin()

        // Get the admin user
        const adminUser = await prisma.user.findUnique({
            where: { id: adminSession.userId }
        })

        if (!adminUser) {
            return NextResponse.json(
                { error: 'Admin user not found' },
                { status: 404 }
            )
        }

        // Create sample testimonials with different statuses
        const sampleTestimonials = [
            {
                userId: adminUser.id,
                content: 'CommitHabit saved my 365-day streak! Amazing tool for developers.',
                rating: 5,
                status: 'PENDING',
                featured: false,
            },
            {
                userId: adminUser.id,
                content: 'Love this app! No more worrying about breaking my streak on busy days.',
                rating: 5,
                status: 'PENDING',
                featured: false,
            },
            {
                userId: adminUser.id,
                content: 'Simple, effective, and works perfectly with my workflow.',
                rating: 4,
                status: 'PENDING',
                featured: false,
            },
            {
                userId: adminUser.id,
                content: 'Great tool for maintaining consistency!',
                rating: 4,
                status: 'APPROVED',
                featured: false,
            },
            {
                userId: adminUser.id,
                content: 'Exactly what I needed. Highly recommend!',
                rating: 5,
                status: 'APPROVED',
                featured: true,
            },
        ]

        // Clear existing testimonials for this user (for fresh testing)
        await prisma.testimonial.deleteMany({
            where: { userId: adminUser.id }
        })

        // Create new testimonials
        const createdTestimonials = await Promise.all(
            sampleTestimonials.map(t =>
                prisma.testimonial.create({ data: t })
            )
        )

        // Create sample audit logs
        const sampleAuditActions = [
            { action: 'LOGIN', entityType: null, entityId: null, metadata: { ip: '127.0.0.1' } },
            { action: 'TESTIMONIAL_SUBMITTED', entityType: 'Testimonial', entityId: createdTestimonials[0].id },
            { action: 'TESTIMONIAL_SUBMITTED', entityType: 'Testimonial', entityId: createdTestimonials[1].id },
            { action: 'TESTIMONIAL_APPROVED', entityType: 'Testimonial', entityId: createdTestimonials[3].id },
            { action: 'TESTIMONIAL_APPROVED', entityType: 'Testimonial', entityId: createdTestimonials[4].id },
            { action: 'LOGIN', entityType: null, entityId: null, metadata: { ip: '192.168.1.1' } },
        ]

        for (const audit of sampleAuditActions) {
            await logAudit({
                userId: adminUser.id,
                action: audit.action,
                entityType: audit.entityType ?? undefined,
                entityId: audit.entityId ?? undefined,
                metadata: audit.metadata,
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Test data seeded successfully!',
            summary: {
                testimonials: {
                    total: createdTestimonials.length,
                    pending: createdTestimonials.filter(t => t.status === 'PENDING').length,
                    approved: createdTestimonials.filter(t => t.status === 'APPROVED').length,
                },
                auditLogs: sampleAuditActions.length,
            },
            nextSteps: [
                'Go to /admin to see the dashboard',
                'Go to /admin/feedback to see pending testimonials',
                'Go to /admin/users to see user details',
            ],
        })
    } catch (error) {
        console.error('[TEST-SEED] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to seed test data' },
            { status: 500 }
        )
    }
}

// GET endpoint to show instructions
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 403 }
        )
    }

    return NextResponse.json({
        message: 'Test Seed Endpoint',
        usage: 'Send a POST request to this endpoint to seed sample data for testing the admin UI.',
        note: 'Requires admin access (your email must be in ADMIN_EMAILS env var)',
        example: 'curl -X POST http://localhost:3000/api/admin/test-seed -b "your-session-cookie"',
        browser: 'Or call fetch("/api/admin/test-seed", { method: "POST" }) from browser console while logged in as admin',
    })
}
