import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, DatabaseError } from '@/lib/errors'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/admin/feedback/[id] - Approve testimonial (with optional edit)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        // Require admin access
        const adminSession = await requireAdmin()
        const { id } = await params

        // Parse request body
        const body = await request.json()
        const { editedContent, featured } = body

        // Fetch existing testimonial
        const testimonial = await prisma.testimonial.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true } }
            }
        })

        if (!testimonial) {
            return NextResponse.json(
                { error: 'Testimonial not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: {
            status: string
            featured?: boolean
            editedContent?: string | null
            editedAt?: Date
            editedBy?: string
        } = {
            status: 'APPROVED'
        }

        // Handle featured flag
        if (typeof featured === 'boolean') {
            updateData.featured = featured
        }

        // Handle content editing
        if (editedContent && typeof editedContent === 'string' && editedContent.trim()) {
            if (editedContent.length > 280) {
                return NextResponse.json(
                    { error: 'Edited content is too long (max 280 characters).' },
                    { status: 400 }
                )
            }
            updateData.editedContent = editedContent.trim()
            updateData.editedAt = new Date()
            updateData.editedBy = adminSession.userId
        }

        // Update testimonial
        const updated = await prisma.testimonial.update({
            where: { id },
            data: updateData
        })

        // Log audit entry
        await logAudit({
            userId: adminSession.userId,
            action: editedContent ? 'TESTIMONIAL_EDITED' : 'TESTIMONIAL_APPROVED',
            entityType: 'Testimonial',
            entityId: id,
            metadata: {
                originalContent: testimonial.content,
                editedContent: updateData.editedContent ?? null,
                authorName: testimonial.user.name,
                authorEmail: testimonial.user.email
            }
        })

        return NextResponse.json({
            success: true,
            testimonial: updated,
            message: editedContent
                ? 'Testimonial edited and approved successfully.'
                : 'Testimonial approved successfully.'
        })
    } catch (error) {
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}

// DELETE /api/admin/feedback/[id] - Reject and permanently delete testimonial
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // Require admin access
        const adminSession = await requireAdmin()
        const { id } = await params

        // Fetch existing testimonial before deletion
        const testimonial = await prisma.testimonial.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        })

        if (!testimonial) {
            return NextResponse.json(
                { error: 'Testimonial not found' },
                { status: 404 }
            )
        }

        // Permanently delete the testimonial
        await prisma.testimonial.delete({
            where: { id }
        })

        // Log audit entry (preserves record of rejection without storing content)
        await logAudit({
            userId: adminSession.userId,
            action: 'TESTIMONIAL_REJECTED',
            entityType: 'Testimonial',
            entityId: id,
            metadata: {
                authorUserId: testimonial.user.id,
                authorName: testimonial.user.name,
                authorEmail: testimonial.user.email,
                rating: testimonial.rating,
                contentLength: testimonial.content.length,
                // Note: We don't store the content itself for privacy reasons
                reason: 'Rejected by admin'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Testimonial rejected and permanently deleted.'
        })
    } catch (error) {
        // Handle case where testimonial doesn't exist
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json(
                { error: 'Testimonial not found or already deleted' },
                { status: 404 }
            )
        }

        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
