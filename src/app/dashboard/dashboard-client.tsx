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
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Subtle background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#39d353]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header - Redesigned */}
            <header className="sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
                    <Link href="/" className="flex items-center group">
                        <span className="font-black text-xl sm:text-2xl flex items-center tracking-tight">
                            <span className="text-white">C</span>
                            <img
                                src="/logo.png"
                                alt="o"
                                className="h-[0.95em] w-auto object-contain inline-block align-middle -mx-2 translate-y-[0.15em] transition-transform group-hover:scale-110 group-hover:rotate-12"
                                style={{ filter: "drop-shadow(0 0 15px rgba(57,211,83,0.5))" }}
                            />
                            <span className="text-white">mmit</span>
                            <span className="mx-1">&nbsp;</span>
                            <span className="text-[#39d353] drop-shadow-[0_0_20px_rgba(57,211,83,0.3)]">Habit</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <a
                            href={githubAppUrl}
                            className="hidden sm:inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                            <Plus size={16} />
                            <span>Add Repo</span>
                        </a>

                        {user.avatarUrl && (
                            <div className="relative">
                                <img
                                    src={user.avatarUrl}
                                    alt={displayName}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/10 hover:ring-[#39d353]/50 transition-all cursor-pointer"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#39d353] rounded-full border-2 border-[#0d1117]" />
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

            <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* Hero Welcome Card */}
                <div className="relative bg-gradient-to-br from-[#161b22] via-[#1c2128] to-[#161b22] border border-white/5 rounded-2xl p-5 sm:p-6 mb-6 overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#39d353]/10 rounded-full blur-3xl" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {user.avatarUrl && (
                                <img
                                    src={user.avatarUrl}
                                    alt=""
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-2 ring-white/10 shadow-xl hidden sm:block"
                                />
                            )}
                            <div>
                                <p className="text-[#8b949e] text-sm mb-1">Welcome back,</p>
                                <h1 className="text-xl sm:text-2xl font-bold">
                                    <span className="bg-gradient-to-r from-white via-white to-[#39d353] bg-clip-text text-transparent">
                                        {displayName.split(' ')[0]}
                                    </span>
                                    <span className="ml-2 text-2xl">👋</span>
                                </h1>
                                <p className="text-[#8b949e] text-sm mt-1 hidden sm:block">
                                    Manage your automated commit streak
                                </p>
                            </div>
                        </div>

                        <a
                            href={githubAppUrl}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#238636]/20 hover:shadow-[#238636]/40 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            <span>Add Repository</span>
                        </a>
                    </div>
                </div>

                {/* Stats Cards - 2x2 grid on mobile, 4 cols on desktop */}
                <div className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {/* Total Repos */}
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#8b949e]/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#8b949e]/10 flex items-center justify-center">
                                    <Github size={14} className="text-[#8b949e]" />
                                </div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium">Repos</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold tabular-nums">{totalCount}</p>
                        </div>

                        {/* Active */}
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#39d353]/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#39d353]/10 flex items-center justify-center">
                                    <Zap size={14} className="text-[#39d353]" />
                                </div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium">Active</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-[#39d353] tabular-nums">{activeCount}</p>
                        </div>

                        {/* Paused */}
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#d29922]/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#d29922]/10 flex items-center justify-center">
                                    <Activity size={14} className="text-[#d29922]" />
                                </div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium">Paused</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-[#d29922] tabular-nums">{totalCount - activeCount}</p>
                        </div>

                        {/* Today's Commits */}
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#58a6ff]/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 flex items-center justify-center">
                                    <TrendingUp size={14} className="text-[#58a6ff]" />
                                </div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium">Today</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-[#58a6ff] tabular-nums">
                                {installations.reduce((sum, i) => sum + i.commitsToday, 0)}
                            </p>
                        </div>
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
