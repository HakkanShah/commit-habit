import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Github, ExternalLink, LogOut, AlertCircle, GitCommit, Plus } from 'lucide-react'
import { InstallationCard } from './installation-card'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
    const session = await getSession()

    if (!session) {
        redirect('/')
    }

    // Fetch user data with installations
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            accounts: {
                where: { provider: 'github' },
            },
            installations: {
                include: {
                    activityLogs: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!user) {
        redirect('/')
    }

    const githubAccount = user.accounts.find(a => a.provider === 'github')
    const displayName = user.name || githubAccount?.providerUsername || 'User'
    const githubAppUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'commit-habit'}/installations/new`

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-green)] flex items-center justify-center">
                            <GitCommit size={16} className="text-white" />
                        </div>
                        <span className="gradient-text">Commit Habit</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {user.avatarUrl && (
                                <img
                                    src={user.avatarUrl}
                                    alt={displayName}
                                    className="w-8 h-8 rounded-full ring-2 ring-[var(--border)]"
                                />
                            )}
                            <span className="font-medium hidden sm:inline">{displayName}</span>
                        </div>
                        <a
                            href="/api/auth/logout"
                            className="btn btn-ghost text-sm text-[var(--muted)]"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </a>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
                        <p className="text-[var(--muted)]">
                            Manage your automated repositories
                        </p>
                    </div>
                    <a href={githubAppUrl} className="btn btn-primary">
                        <Plus size={18} />
                        Add Repository
                    </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted)] mb-1">Total Repositories</p>
                        <p className="text-3xl font-bold">{user.installations.length}</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted)] mb-1">Active Automations</p>
                        <p className="text-3xl font-bold text-[var(--accent)]">
                            {user.installations.filter(i => i.active).length}
                        </p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted)] mb-1">Member Since</p>
                        <p className="text-lg font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                </div>

                {/* Installations List */}
                {user.installations.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center mx-auto mb-4">
                            <Github size={32} className="text-[var(--muted)]" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No repositories connected</h2>
                        <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
                            Install the Commit Habit app on a repository to start automating your daily activity.
                        </p>
                        <a href={githubAppUrl} className="btn btn-primary">
                            <Github size={18} />
                            Connect Your First Repository
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Your Repositories</h2>
                        {user.installations.map((installation) => (
                            <InstallationCard
                                key={installation.id}
                                installation={{
                                    id: installation.id,
                                    installationId: installation.installationId,
                                    repoFullName: installation.repoFullName,
                                    active: installation.active,
                                    commitsToday: installation.commitsToday,
                                    lastRunAt: installation.lastRunAt?.toISOString() || null,
                                    createdAt: installation.createdAt.toISOString(),
                                    activityLogs: installation.activityLogs.map(log => ({
                                        id: log.id,
                                        action: log.action,
                                        message: log.message,
                                        createdAt: log.createdAt.toISOString(),
                                    })),
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Uninstall Instructions */}
                <div className="card mt-8 border-[var(--warning)]/30 bg-[var(--warning)]/5">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-[var(--warning)] flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold mb-1">How to Uninstall</h3>
                            <p className="text-sm text-[var(--muted)] mb-2">
                                To completely remove automation from a repository:
                            </p>
                            <ol className="text-sm text-[var(--muted)] list-decimal ml-4 space-y-1">
                                <li>Go to your GitHub Settings → Applications → Installed GitHub Apps</li>
                                <li>Find &quot;Commit Habit&quot; and click Configure</li>
                                <li>Remove the repository or uninstall the app entirely</li>
                            </ol>
                            <a
                                href="https://github.com/settings/installations"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2"
                            >
                                Go to GitHub Settings
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
