'use client'

import { useState, useCallback, useMemo } from 'react'
import { Github, ExternalLink, LogOut, AlertCircle, GitCommit, Plus, ChevronRight, Zap, Activity, TrendingUp } from 'lucide-react'
import { InstallationCard } from './installation-card'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'
import Link from 'next/link'

// Types
interface ActivityLog {
    id: string
    action: string
    message: string | null
    createdAt: string
}

interface Installation {
    id: string
    installationId: number
    repoFullName: string
    active: boolean
    commitsToday: number
    lastRunAt: string | null
    createdAt: string
    activityLogs: ActivityLog[]
}

interface DashboardProps {
    user: {
        name: string | null
        avatarUrl: string | null
    }
    displayName: string
    githubAppUrl: string
    initialInstallations: Installation[]
}

interface UpdateResponse {
    success: boolean
    installation?: Installation
    message?: string
}

interface DeleteResponse {
    success: boolean
    message?: string
}

interface CommitResponse {
    success: boolean
    commitSha?: string
    message?: string
    error?: string
}

export function DashboardClient({ user, displayName, githubAppUrl, initialInstallations }: DashboardProps) {
    // State for all installations - enables optimistic updates
    const [installations, setInstallations] = useState<Installation[]>(initialInstallations)
    const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())
    const [committingRepos, setCommittingRepos] = useState<Set<string>>(new Set())
    const { success, error: showError, warning } = useToast()

    // Computed values that update instantly
    const activeCount = useMemo(() =>
        installations.filter(i => i.active).length,
        [installations]
    )
    const totalCount = installations.length

    // Optimistic toggle (pause/resume)
    const handleToggle = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || pendingActions.has(installationId)) return

        const newActive = !installation.active
        const previousState = installation.active

        // Optimistic update - instant UI feedback
        setInstallations(prev =>
            prev.map(i => i.id === installationId ? { ...i, active: newActive } : i)
        )
        setPendingActions(prev => new Set(prev).add(installationId))

        // API call in background
        const result = await apiFetch<UpdateResponse>('/api/installations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId, active: newActive }),
        })

        setPendingActions(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error) {
            // Rollback on error
            setInstallations(prev =>
                prev.map(i => i.id === installationId ? { ...i, active: previousState } : i)
            )
            showError(result.error.message || 'Failed to update')
            return
        }

        success(newActive ? 'Automation resumed' : 'Automation paused')
    }, [installations, pendingActions, showError, success])

    // Optimistic remove
    const handleRemove = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || pendingActions.has(installationId)) return

        const previousInstallations = [...installations]

        // Optimistic update - remove immediately
        setInstallations(prev => prev.filter(i => i.id !== installationId))
        setPendingActions(prev => new Set(prev).add(installationId))

        // API call in background
        const result = await apiFetch<DeleteResponse>(`/api/installations?id=${installationId}`, {
            method: 'DELETE',
        })

        setPendingActions(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error) {
            // Rollback on error
            setInstallations(previousInstallations)
            showError(result.error.message || 'Failed to remove repository')
            return
        }

        success('Repository removed')
    }, [installations, pendingActions, showError, success])

    // Manual commit with optimistic UI
    const handleCommit = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || committingRepos.has(installationId)) return

        if (!installation.active) {
            showError('Resume automation first to commit')
            return
        }

        const previousCommitsToday = installation.commitsToday

        // Optimistic update - increment commits immediately
        setInstallations(prev =>
            prev.map(i => i.id === installationId ? {
                ...i,
                commitsToday: i.commitsToday + 1,
                lastRunAt: new Date().toISOString()
            } : i)
        )
        setCommittingRepos(prev => new Set(prev).add(installationId))

        // API call
        const result = await apiFetch<CommitResponse>('/api/installations/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId }),
        })

        setCommittingRepos(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error || !result.data?.success) {
            // Rollback on error
            setInstallations(prev =>
                prev.map(i => i.id === installationId ? { ...i, commitsToday: previousCommitsToday } : i)
            )
            showError(result.error?.message || result.data?.error || 'Failed to create commit')
            return
        }

        success(`Commit created: ${result.data.commitSha}`)
    }, [installations, committingRepos, showError, success])

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] text-white">
            {/* Animated background gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#39d353]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#238636]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img
                            src="/logo.png"
                            alt="Commit Habit"
                            className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
                            style={{ filter: "drop-shadow(0 0 10px rgba(57,211,83,0.3))" }}
                        />
                        <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            Commit Habit
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {user.avatarUrl && (
                            <div className="relative">
                                <img
                                    src={user.avatarUrl}
                                    alt=""
                                    className="w-9 h-9 rounded-full ring-2 ring-white/10 hover:ring-[#39d353]/50 transition-all"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#39d353] rounded-full border-2 border-[#0d1117]" />
                            </div>
                        )}
                        <a
                            href="/api/auth/logout"
                            className="text-[#8b949e] hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </a>
                    </div>
                </div>
            </header>

            <main className="relative px-4 py-8 max-w-4xl mx-auto">
                {/* Welcome Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                            Welcome back, <span className="bg-gradient-to-r from-[#39d353] to-[#58a6ff] bg-clip-text text-transparent">{displayName.split(' ')[0]}</span>!
                        </h1>
                        <p className="text-[#8b949e]">Manage your automated commit habits</p>
                    </div>
                    <a
                        href={githubAppUrl}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#238636] px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#238636]/20 hover:shadow-[#238636]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        <span>Add Repository</span>
                    </a>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="group bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5 hover:border-[#39d353]/30 transition-all hover:shadow-lg hover:shadow-[#39d353]/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#39d353]/10 flex items-center justify-center">
                                <Github size={18} className="text-[#39d353]" />
                            </div>
                        </div>
                        <p className="text-xs text-[#8b949e] mb-1">Total Repos</p>
                        <p className="text-3xl font-bold tabular-nums">{totalCount}</p>
                    </div>

                    <div className="group bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5 hover:border-[#39d353]/30 transition-all hover:shadow-lg hover:shadow-[#39d353]/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#39d353]/10 flex items-center justify-center">
                                <Zap size={18} className="text-[#39d353]" />
                            </div>
                        </div>
                        <p className="text-xs text-[#8b949e] mb-1">Active</p>
                        <p className="text-3xl font-bold text-[#39d353] tabular-nums">{activeCount}</p>
                    </div>

                    <div className="group bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5 hover:border-[#d29922]/30 transition-all hover:shadow-lg hover:shadow-[#d29922]/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#d29922]/10 flex items-center justify-center">
                                <Activity size={18} className="text-[#d29922]" />
                            </div>
                        </div>
                        <p className="text-xs text-[#8b949e] mb-1">Paused</p>
                        <p className="text-3xl font-bold text-[#d29922] tabular-nums">{totalCount - activeCount}</p>
                    </div>

                    <div className="group bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5 hover:border-[#58a6ff]/30 transition-all hover:shadow-lg hover:shadow-[#58a6ff]/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 flex items-center justify-center">
                                <TrendingUp size={18} className="text-[#58a6ff]" />
                            </div>
                        </div>
                        <p className="text-xs text-[#8b949e] mb-1">Today&apos;s Commits</p>
                        <p className="text-3xl font-bold text-[#58a6ff] tabular-nums">
                            {installations.reduce((sum, i) => sum + i.commitsToday, 0)}
                        </p>
                    </div>
                </div>

                {/* Repositories List */}
                {installations.length === 0 ? (
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#30363d] flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Github size={32} className="text-[#8b949e]" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">No repositories yet</h2>
                        <p className="text-[#8b949e] mb-8 max-w-sm mx-auto">
                            Connect your first repository to start building your commit habit.
                        </p>
                        <a
                            href={githubAppUrl}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#238636]/20 hover:shadow-[#238636]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Github size={20} />
                            Connect Repository
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">
                                Your Repositories
                            </h2>
                            <span className="text-xs text-[#8b949e] bg-white/5 px-2 py-1 rounded-full">
                                {activeCount} of {totalCount} active
                            </span>
                        </div>
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl divide-y divide-white/5">
                            {installations.map((inst) => (
                                <InstallationCard
                                    key={inst.id}
                                    installation={inst}
                                    isLoading={pendingActions.has(inst.id)}
                                    isCommitting={committingRepos.has(inst.id)}
                                    onToggle={() => handleToggle(inst.id)}
                                    onRemove={() => handleRemove(inst.id)}
                                    onCommit={() => handleCommit(inst.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Help Card */}
                <details className="mt-8 bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl group">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#d29922]/10 flex items-center justify-center">
                                <AlertCircle size={16} className="text-[#d29922]" />
                            </div>
                            <span className="font-medium text-sm">How to manage your installation</span>
                        </div>
                        <ChevronRight size={18} className="text-[#8b949e] transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-[#8b949e]">
                        <ol className="list-decimal ml-4 space-y-2">
                            <li>Go to <strong className="text-white">GitHub Settings → Applications</strong></li>
                            <li>Find &quot;Commit Habit&quot; and click <strong className="text-white">Configure</strong></li>
                            <li>Add/remove repositories or uninstall the app</li>
                        </ol>
                        <a
                            href="https://github.com/settings/installations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#58a6ff] mt-4 hover:underline"
                        >
                            Open GitHub Settings <ExternalLink size={12} />
                        </a>
                    </div>
                </details>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 mt-16">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-[#8b949e]">
                    <p>Built with 💚 for developers who want to stay consistent</p>
                </div>
            </footer>
        </div>
    )
}
