import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    const isAdmin = await isCurrentUserAdmin()
    return NextResponse.json({ isAdmin })
}
