import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Check if current user has existing feedback
export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ hasFeedback: false, feedback: null })
        }

        const existing = await prisma.testimonial.findFirst({
            where: { userId: session.userId }
        })

        if (existing) {
            return NextResponse.json({
                hasFeedback: true,
                feedback: {
                    id: existing.id,
                    content: existing.content,
                    rating: existing.rating,
                    status: existing.status // Changed from approved to status
                }
            })
        }

        return NextResponse.json({ hasFeedback: false, feedback: null })
    } catch (error) {
        console.error('Error checking user feedback:', error)
        return NextResponse.json({ hasFeedback: false, feedback: null })
    }
}
