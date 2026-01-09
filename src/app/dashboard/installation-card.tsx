'use client'

import { useState } from 'react'
import { Pause, Play, Loader2, GitCommit, Trash2, MoreVertical, X, ExternalLink, Clock } from 'lucide-react'
import { useToast } from '@/components/toast'

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

interface InstallationCardProps {
    installation: Installation
    isLoading?: boolean
    onToggle: () => void
    onRemove: () => void
}

export function InstallationCard({ installation, isLoading = false, onToggle, onRemove }: InstallationCardProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
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

    return (
        <>
            <div className={`group flex items-center gap-4 p-4 sm:p-5 transition-all hover:bg-white/[0.02] ${isLoading ? 'opacity-60' : ''}`}>
                {/* Status Icon with animation */}
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${installation.active
                    ? 'bg-gradient-to-br from-[#39d353]/20 to-[#238636]/20 text-[#39d353]'
                    : 'bg-[#21262d] text-[#8b949e]'
                    }`}>
                    {isLoading ? (
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
                        <span className={`font-medium ${installation.active ? 'text-[#39d353]' : 'text-[#d29922]'}`}>
                            {installation.active ? '● Active' : '○ Paused'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1">
                            <Clock size={12} />
                            {getRelativeTime(installation.lastRunAt)}
                        </span>
                    </div>
                </div>

                {/* Progress indicator */}
                <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8b949e]">Today</span>
                        <span className="text-sm font-bold tabular-nums">{installation.commitsToday}/5</span>
                    </div>
                    <div className="w-24 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#39d353] to-[#58a6ff] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (installation.commitsToday / 5) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggle}
                        disabled={isLoading}
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
                            disabled={isLoading}
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-all active:scale-95"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu - positioned relative to button */}
                        {showMenu && (
                            <div className="absolute right-0 top-12 z-50 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
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
