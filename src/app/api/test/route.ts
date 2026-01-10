import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test endpoint - with database access
export async function GET() {
    try {
        const count = await prisma.installation.count({ where: { active: true } })

        return NextResponse.json({
            status: 'ok',
            activeInstallations: count,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        }, { status: 500 })
    }
}
