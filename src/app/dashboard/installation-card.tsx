'use client'

import { useState } from 'react'
import { Pause, Play, Loader2, GitCommit, Trash2, MoreVertical, X, ExternalLink, Clock, Zap, ChevronDown, CheckCircle, XCircle, SkipForward, History, AlertTriangle, FilePlus } from 'lucide-react'
import { useToast } from '@/components/toast'
import { MAX_COMMITS_PER_DAY } from '@/lib/limits'

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
    /** Commits in a fork never reach the contribution graph. */
    isFork?: boolean
    /** Private repos need "include private contributions" enabled on GitHub. */
    isPrivate?: boolean
}

interface InstallationCardProps {
    installation: Installation
    isLoading?: boolean
    isCommitting?: boolean
    onToggle: () => void
    onRemove: () => void
    onCommit: () => void
}

export function InstallationCard({ installation, isLoading = false, isCommitting = false, onToggle, onRemove, onCommit }: InstallationCardProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const { error: showError } = useToast()

    const repoName = installation.repoFullName.split('/')[1] || installation.repoFullName
    const ownerName = installation.repoFullName.split('/')[0] || ''

    const handleRemoveClick = () => {
        setShowMenu(false)
        setShowConfirm(true)
    }

    const handleConfirmRemove = () => {
        setShowConfirm(false)
        onRemove()
    }

    // Format relative time
    const getRelativeTime = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    /**
     * How each activity-log action is presented.
     *
     * The old version only knew three actions and fell through to
     * `return action`, so the dashboard showed users raw strings like
     * `skipped_no_identity` and `error_permission`. Every action the engine can
     * write now has a label a person can read and a colour that matches what it
     * means: green for "a commit happened", blue for "nothing needed doing",
     * amber for "needs your attention", red for "broken".
     */
    const ACTIVITY: Record<string, { label: string; tone: 'good' | 'info' | 'warn' | 'bad' }> = {
        commit_created: { label: 'Commit', tone: 'good' },
        manual_commit: { label: 'Manual commit', tone: 'good' },
        readme_created: { label: 'README added', tone: 'good' },

        skipped_has_commits: { label: 'You already committed', tone: 'info' },
        skipped_daily_limit: { label: 'Daily limit', tone: 'info' },
        resumed: { label: 'Resumed', tone: 'info' },
        paused: { label: 'Paused', tone: 'info' },

        skipped_no_readme: { label: 'No README', tone: 'warn' },
        skipped_no_identity: { label: 'GitHub not linked', tone: 'warn' },
        warning_fork: { label: 'Fork — will not count', tone: 'warn' },
        warning_private: { label: 'Private — check settings', tone: 'warn' },
        error_rate_limited: { label: 'Rate limited', tone: 'warn' },
        error_network: { label: 'Network issue', tone: 'warn' },
        error_conflict: { label: 'Conflict', tone: 'warn' },

        error_permission: { label: 'Access lost', tone: 'bad' },
        error_not_found: { label: 'Repo not found', tone: 'bad' },
        error_unknown: { label: 'Error', tone: 'bad' },
        error: { label: 'Error', tone: 'bad' },
    }

    const TONE_CLASS: Record<string, string> = {
        good: 'bg-[#39d353]/10 text-[#39d353]',
        info: 'bg-[#58a6ff]/10 text-[#58a6ff]',
        warn: 'bg-[#d29922]/10 text-[#d29922]',
        bad: 'bg-[#f85149]/10 text-[#f85149]',
    }

    const activityMeta = (action: string) =>
        ACTIVITY[action] ?? { label: action.replace(/_/g, ' '), tone: 'info' as const }

    const getActivityIcon = (action: string) => {
        const { tone } = activityMeta(action)
        if (action === 'readme_created') return <FilePlus size={14} className="text-[#39d353]" />
        switch (tone) {
            case 'good':
                return <CheckCircle size={14} className="text-[#39d353]" />
            case 'info':
                return <SkipForward size={14} className="text-[#58a6ff]" />
            case 'warn':
                return <AlertTriangle size={14} className="text-[#d29922]" />
            case 'bad':
                return <XCircle size={14} className="text-[#f85149]" />
            default:
                return <GitCommit size={14} className="text-[#8b949e]" />
        }
    }

    const getActivityLabel = (action: string) => activityMeta(action).label


    return (
        <>
            <div className={`group flex items-center gap-4 p-4 sm:p-5 transition-all hover:bg-white/[0.02] ${isLoading ? 'opacity-60' : ''}`}>
                {/* Status Icon with animation */}
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isCommitting
                    ? 'bg-gradient-to-br from-[#58a6ff]/20 to-[#388bfd]/20 text-[#58a6ff]'
                    : installation.active
                        ? 'bg-gradient-to-br from-[#39d353]/20 to-[#238636]/20 text-[#39d353]'
                        : 'bg-[#21262d] text-[#8b949e]'
                    }`}>
                    {isLoading || isCommitting ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            <GitCommit size={20} />
                            {installation.active && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#39d353] rounded-full border-2 border-[#161b22] animate-pulse" />
                            )}
                        </>
                    )}
                </div>

                {/* Repo Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <a
                            href={`https://github.com/${installation.repoFullName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-base truncate hover:text-[#58a6ff] transition-colors flex items-center gap-2 group/link"
                        >
                            {repoName}
                            <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-50 transition-opacity" />
                        </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b949e]">
                        <span className="opacity-70">{ownerName}</span>
                        <span className="hidden sm:inline">•</span>
                        {isCommitting ? (
                            <span className="font-medium text-[#58a6ff] flex items-center gap-1">
                                <Loader2 size={10} className="animate-spin" />
                                Committing...
                            </span>
                        ) : (
                            <span className={`font-medium ${installation.active ? 'text-[#39d353]' : 'text-[#d29922]'}`}>
                                {installation.active ? '● Active' : '○ Paused'}
                            </span>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1">
                            <Clock size={12} />
                            {getRelativeTime(installation.lastRunAt)}
                        </span>
                    </div>

                    {/*
                      Visibility warnings. A commit can succeed perfectly and still
                      leave the contribution graph empty - GitHub never counts
                      commits in forks, and private commits only show when the user
                      has opted in. Without this notice the app looks broken for
                      reasons that are not the app's fault and that the user can fix.
                    */}
                    {(installation.isFork || installation.isPrivate) && (
                        <div className="mt-1.5 flex flex-col gap-1">
                            {installation.isFork && (
                                <span className="flex items-start gap-1.5 text-[11px] leading-snug text-[#d29922]">
                                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        This is a fork — GitHub never counts commits in forks on your
                                        contribution graph. Use a non-forked repository.
                                    </span>
                                </span>
                            )}
                            {installation.isPrivate && (
                                <span className="flex items-start gap-1.5 text-[11px] leading-snug text-[#8b949e]">
                                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        Private repository — turn on{' '}
                                        <a
                                            href="https://github.com/settings/profile"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline hover:text-[#58a6ff]"
                                        >
                                            private contributions
                                        </a>{' '}
                                        for these commits to appear.
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress indicator */}
                <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8b949e]">Today</span>
                        <span className="text-sm font-bold tabular-nums">{installation.commitsToday}/{MAX_COMMITS_PER_DAY}</span>
                    </div>
                    <div className="w-24 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#39d353] to-[#58a6ff] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (installation.commitsToday / MAX_COMMITS_PER_DAY) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Commit Now Button - Primary Action */}
                    <button
                        onClick={() => { setShowMenu(false); onCommit() }}
                        disabled={isLoading || isCommitting || !installation.active}
                        title={!installation.active ? 'Resume automation to commit' : 'Create commit now'}
                        className={`hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl font-medium text-sm transition-all active:scale-95 ${installation.active
                            ? 'bg-gradient-to-r from-[#58a6ff] to-[#388bfd] text-white hover:shadow-lg hover:shadow-[#58a6ff]/20'
                            : 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
                            }`}
                    >
                        {isCommitting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Zap size={14} />
                        )}
                        <span>{isCommitting ? 'Committing...' : 'Commit'}</span>
                    </button>

                    {/* Toggle Button */}
                    <button
                        onClick={onToggle}
                        disabled={isLoading || isCommitting}
                        title={installation.active ? 'Pause automation' : 'Resume automation'}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${installation.active
                            ? 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]'
                            : 'bg-[#39d353]/10 text-[#39d353] hover:bg-[#39d353]/20'
                            }`}
                    >
                        {installation.active ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    {/* Menu Button with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            disabled={isLoading || isCommitting}
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-all active:scale-95"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu - positioned relative to button */}
                        {showMenu && (
                            <div className="absolute right-0 top-12 z-50 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                                {/* Commit Now - shown on mobile */}
                                <button
                                    onClick={() => { setShowMenu(false); onCommit() }}
                                    disabled={isCommitting || !installation.active}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${installation.active
                                        ? 'text-[#58a6ff] hover:bg-[#58a6ff]/10'
                                        : 'text-[#8b949e] cursor-not-allowed'
                                        }`}
                                >
                                    {isCommitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    <span>{isCommitting ? 'Committing...' : 'Commit Now'}</span>
                                </button>
                                <div className="border-t border-[#30363d]" />
                                <button
                                    onClick={() => { setShowMenu(false); onToggle() }}
                                    disabled={isLoading}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-white hover:bg-white/5 transition-colors"
                                >
                                    {installation.active ? <Pause size={14} /> : <Play size={14} />}
                                    <span>{installation.active ? 'Pause' : 'Resume'}</span>
                                </button>
                                <a
                                    href={`https://github.com/${installation.repoFullName}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setShowMenu(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-white hover:bg-white/5 transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    <span>Open on GitHub</span>
                                </a>
                                <div className="border-t border-[#30363d]" />
                                <button
                                    onClick={handleRemoveClick}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    <span>Remove</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Activity History Section */}
            {installation.activityLogs.length > 0 && (
                <div className="border-t border-white/5">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-sm text-[#8b949e] hover:text-white hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <History size={14} />
                            <span>Activity History</span>
                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
                                {installation.activityLogs.length}
                            </span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showHistory && (
                        <div className="px-4 sm:px-5 pb-4 space-y-2">
                            {installation.activityLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 bg-[#0d1117] rounded-lg border border-white/5"
                                >
                                    <div className="mt-0.5">
                                        {getActivityIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${TONE_CLASS[activityMeta(log.action).tone]}`}>
                                                {getActivityLabel(log.action)}
                                            </span>
                                            <span className="text-xs text-[#8b949e]">
                                                {getRelativeTime(log.createdAt)}
                                            </span>
                                        </div>
                                        {log.message && (
                                            <p className="text-sm text-[#c9d1d9] truncate">
                                                {log.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Remove Repository?</h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-[#8b949e] mb-6">
                            This will remove <strong className="text-white">{installation.repoFullName}</strong> from automation.
                            You can always add it back later.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#21262d] text-white font-medium hover:bg-[#30363d] transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemove}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#da3633] to-[#f85149] text-white font-medium hover:from-[#f85149] hover:to-[#da3633] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                <span>Remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
