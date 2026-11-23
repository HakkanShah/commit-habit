import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import { AdminLayoutClient } from './AdminLayoutClient'
import './admin-animations.css'

export const dynamic = 'force-dynamic'

/**
 * Every admin page was inheriting the marketing title, so all five browser tabs
 * read "CommitHabit — Protect Your GitHub Streak Automatically" and were
 * impossible to tell apart. The template gives each page its own name.
 *
 * `noindex` is belt-and-braces alongside the robots.txt disallow: a disallowed
 * URL that is linked from somewhere can still be indexed without being
 * crawled, and only the header actually prevents that.
 */
export const metadata: Metadata = {
    title: {
        default: 'Admin',
        template: '%s · Admin | CommitHabit',
    },
    robots: { index: false, follow: false, nocache: true },
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const adminUser = await getAdminUser()

    if (!adminUser) {
        redirect('/')
    }

    return (
        <AdminLayoutClient adminName={adminUser.name || adminUser.email}>
            {children}
        </AdminLayoutClient>
    )
}
