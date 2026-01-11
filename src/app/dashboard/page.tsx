import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

// ⚠️ DEV ONLY: Set to true to bypass login for UI testing
const BYPASS_AUTH = false

// Mock data for testing when BYPASS_AUTH is true
const MOCK_USER = {
    name: 'Test User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
}

const MOCK_INSTALLATIONS = [
    {
        id: 'mock-1',
        installationId: 12345,
        repoFullName: 'test-user/demo-repo',
        active: true,
        commitsToday: 3,
        lastRunAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        activityLogs: [
            { id: 'log-1', action: 'commit_created', message: 'docs: maintain streak ✨', createdAt: new Date().toISOString() },
            { id: 'log-2', action: 'commit_created', message: 'docs: daily update', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
            { id: 'log-3', action: 'skipped_has_commits', message: 'User already committed today', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'log-4', action: 'commit_created', message: 'docs: streak backup', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'log-5', action: 'error', message: 'Rate limit exceeded', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
    {
        id: 'mock-2',
        installationId: 12346,
        repoFullName: 'test-user/another-repo',
        active: false,
        commitsToday: 0,
        lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        activityLogs: [
            { id: 'log-6', action: 'commit_created', message: 'docs: initial setup', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'log-7', action: 'skipped_has_commits', message: 'User committed manually', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
]

export default async function DashboardPage() {
    // Bypass auth for UI testing
    if (BYPASS_AUTH) {
        return (
            <DashboardClient
                user={MOCK_USER}
                displayName="Test User"
                githubAppUrl="https://github.com/apps/commit-habit/installations/new"
                initialInstallations={MOCK_INSTALLATIONS}
            />
        )
    }

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
