import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
    const session = await getSession()
    if (!session) redirect('/')

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            accounts: { where: { provider: 'github' } },
            installations: {
                include: { activityLogs: { orderBy: { createdAt: 'desc' }, take: 3 } },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!user) redirect('/')

    const githubAccount = user.accounts.find(a => a.provider === 'github')
    const displayName = user.name || githubAccount?.providerUsername || 'User'
    const githubAppUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'commit-habit'}/installations/new`

    // Transform installations for client component
    const installations = user.installations.map(inst => ({
        id: inst.id,
        installationId: inst.installationId,
        repoFullName: inst.repoFullName,
        active: inst.active,
        commitsToday: inst.commitsToday,
        lastRunAt: inst.lastRunAt?.toISOString() || null,
        createdAt: inst.createdAt.toISOString(),
        activityLogs: inst.activityLogs.map(log => ({
            id: log.id,
            action: log.action,
            message: log.message,
            createdAt: log.createdAt.toISOString(),
        })),
    }))

    return (
        <DashboardClient
            user={{
                name: user.name,
                avatarUrl: user.avatarUrl,
            }}
            displayName={displayName}
            githubAppUrl={githubAppUrl}
            initialInstallations={installations}
        />
    )
}
