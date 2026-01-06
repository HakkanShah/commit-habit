import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Github, ExternalLink, LogOut, AlertCircle, GitCommit, Plus, ChevronRight } from 'lucide-react'
import { InstallationCard } from './installation-card'
import { formatDate } from '@/lib/utils'

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
    const activeCount = user.installations.filter(i => i.active).length

    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Header - Mobile Optimized */}
            <header className="sticky top-0 z-50 bg-[#0d1117]/95 backdrop-blur border-b border-[#30363d]">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#39d353] flex items-center justify-center">
                            <GitCommit size={16} />
                        </div>
                        <span className="font-bold hidden sm:inline">Commit Habit</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user.avatarUrl && (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        )}
                        <a href="/api/auth/logout" className="text-[#8b949e] hover:text-white p-2 -mr-2">
                            <LogOut size={18} />
                        </a>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6 max-w-4xl mx-auto">
                {/* Welcome + Add Button */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold">Hey, {displayName.split(' ')[0]}!</h1>
                        <p className="text-sm text-[#8b949e]">{activeCount} active automation{activeCount !== 1 ? 's' : ''}</p>
                    </div>
                    <a
                        href={githubAppUrl}
                        className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] px-4 py-3 rounded-xl text-sm font-bold touch-manipulation"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Repo</span>
                    </a>
                </div>

                {/* Stats Cards - 2 Column Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                        <p className="text-xs text-[#8b949e] mb-1">Repositories</p>
                        <p className="text-2xl font-bold">{user.installations.length}</p>
                    </div>
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                        <p className="text-xs text-[#8b949e] mb-1">Active</p>
                        <p className="text-2xl font-bold text-[#39d353]">{activeCount}</p>
                    </div>
                </div>

                {/* Repositories List */}
                {user.installations.length === 0 ? (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#21262d] flex items-center justify-center mx-auto mb-4">
                            <Github size={24} className="text-[#8b949e]" />
                        </div>
                        <h2 className="font-bold mb-2">No repos yet</h2>
                        <p className="text-sm text-[#8b949e] mb-6">Connect a repository to start.</p>
                        <a
                            href={githubAppUrl}
                            className="inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] px-6 py-3 rounded-xl font-bold text-sm touch-manipulation"
                        >
                            <Github size={18} />
                            Connect Repository
                        </a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-[#8b949e] uppercase tracking-wide">Your Repos</h2>
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden divide-y divide-[#30363d]">
                            {user.installations.map((inst) => (
                                <InstallationCard
                                    key={inst.id}
                                    installation={{
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
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Help Card - Collapsible Style */}
                <details className="mt-6 bg-[#161b22] border border-[#30363d] rounded-xl">
                    <summary className="flex items-center justify-between px-4 py-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} className="text-[#d29922]" />
                            <span className="font-medium text-sm">How to uninstall</span>
                        </div>
                        <ChevronRight size={18} className="text-[#8b949e] transition-transform details-open:rotate-90" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-[#8b949e]">
                        <ol className="list-decimal ml-4 space-y-1">
                            <li>Go to GitHub Settings → Applications</li>
                            <li>Find &quot;Commit Habit&quot; and click Configure</li>
                            <li>Remove the repo or uninstall</li>
                        </ol>
                        <a
                            href="https://github.com/settings/installations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#58a6ff] mt-3"
                        >
                            Open GitHub Settings <ExternalLink size={12} />
                        </a>
                    </div>
                </details>
            </main>
        </div>
    )
}
