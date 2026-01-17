import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import { AdminLayoutClient } from './AdminLayoutClient'

export const dynamic = 'force-dynamic'

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
