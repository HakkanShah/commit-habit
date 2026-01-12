import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

// ⚠️ DEV ONLY: Set to true to bypass login for UI testing (MUST be false in production!)
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

// Props type for search params
interface PageProps {
    searchParams: Promise<{ empty?: string; status?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
    // Bypass auth for UI testing
    if (BYPASS_AUTH) {
        const params = await searchParams
        const showEmpty = params.empty === 'true'
        const status = params.status // 'active' (green) or 'inactive' (amber)

        // Mock installation with configurable commitsToday
        const mockInstallations = [...MOCK_INSTALLATIONS]
        if (status === 'active') {
            mockInstallations[0].commitsToday = 5
        } else if (status === 'inactive') {
            mockInstallations[0].commitsToday = 0
        }

        return (
            <>
                {/* Dev toggle banner */}
                <div className="fixed bottom-4 left-4 z-50 bg-[#161b22] border border-white/10 rounded-xl p-3 shadow-xl text-sm flex gap-3 items-center">
                    <p className="text-[#8b949e] font-medium mr-1">🧪 Animation Test:</p>

                    <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                        <a
                            href="/dashboard?empty=true"
                            className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold ${showEmpty ? 'bg-[#58a6ff] text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            Guest
                        </a>
                        <a
                            href="/dashboard?status=inactive"
                            className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold ${!showEmpty && status !== 'active' ? 'bg-[#d29922] text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            Standby
                        </a>
                        <a
                            href="/dashboard?status=active"
                            className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold ${!showEmpty && status === 'active' ? 'bg-[#39d353] text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            Protected
                        </a>
                    </div>
                </div>

                <DashboardClient
                    user={MOCK_USER}
                    displayName="Test User"
                    githubAppUrl="https://github.com/apps/commit-habit/installations/new"
                    initialInstallations={showEmpty ? [] : mockInstallations}
                />
            </>
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
