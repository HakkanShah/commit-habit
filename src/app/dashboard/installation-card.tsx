'use client'

import { useState } from 'react'
import { Pause, Play, Loader2, GitCommit, Trash2, MoreVertical, X } from 'lucide-react'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

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

interface UpdateResponse {
    success: boolean
    installation?: Installation
    message?: string
}

interface DeleteResponse {
    success: boolean
    message?: string
}

export function InstallationCard({ installation }: { installation: Installation }) {
    const [isActive, setIsActive] = useState(installation.active)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [isRemoved, setIsRemoved] = useState(false)
    const { success, error: showError } = useToast()
    const router = useRouter()

    const toggle = async () => {
        setIsLoading(true)
        setShowMenu(false)
        const result = await apiFetch<UpdateResponse>('/api/installations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId: installation.id, active: !isActive }),
        })
        setIsLoading(false)

        if (result.error) {
            if (result.error.isAuthError) router.push('/api/auth/github')
            else showError(result.error.message)
            return
        }

        setIsActive(!isActive)
        success(!isActive ? 'Automation resumed' : 'Automation paused')
    }

    const handleRemove = async () => {
        setIsDeleting(true)
        const result = await apiFetch<DeleteResponse>(`/api/installations?id=${installation.id}`, {
            method: 'DELETE',
        })
        setIsDeleting(false)
        setShowConfirm(false)

        if (result.error) {
            if (result.error.isAuthError) router.push('/api/auth/github')
            else showError(result.error.message)
            return
        }

        setIsRemoved(true)
        success('Repository removed')
        // Refresh the page after a short delay
        setTimeout(() => router.refresh(), 500)
    }

    const repoName = installation.repoFullName.split('/')[1] || installation.repoFullName

    // Don't render if removed
    if (isRemoved) {
        return (
            <div className="flex items-center justify-center p-4 text-[#8b949e] text-sm">
                <span>Removed</span>
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center gap-3 p-4 active:bg-[#21262d] transition-colors touch-manipulation relative">
                {/* Status Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#238636]/20 text-[#39d353]' : 'bg-[#21262d] text-[#8b949e]'}`}>
                    <GitCommit size={18} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <a
                        href={`https://github.com/${installation.repoFullName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-sm truncate block hover:text-[#58a6ff]"
                    >
                        {repoName}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                        <span>{installation.commitsToday}/5 today</span>
                        <span>•</span>
                        <span className={isActive ? 'text-[#39d353]' : 'text-[#8b949e]'}>
                            {isActive ? 'Active' : 'Paused'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Toggle Button */}
                    <button
                        onClick={toggle}
                        disabled={isLoading || isDeleting}
                        title={isActive ? 'Pause automation' : 'Resume automation'}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors touch-manipulation ${isActive ? 'bg-[#21262d] text-[#8b949e] hover:text-white' : 'bg-[#238636]/20 text-[#39d353]'}`}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    {/* Menu Button */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        disabled={isLoading || isDeleting}
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#21262d] text-[#8b949e] hover:text-white transition-colors touch-manipulation"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute right-4 top-14 z-20 bg-[#161b22] border border-[#30363d] rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                        <button
                            onClick={toggle}
                            disabled={isLoading}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#21262d] transition-colors"
                        >
                            {isActive ? <Pause size={14} /> : <Play size={14} />}
                            <span>{isActive ? 'Pause' : 'Resume'}</span>
                        </button>
                        <button
                            onClick={() => { setShowMenu(false); setShowConfirm(true) }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#f85149] hover:bg-[#21262d] transition-colors"
                        >
                            <Trash2 size={14} />
                            <span>Remove</span>
                        </button>
                    </div>
                )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Remove Repository?</h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-[#8b949e] hover:text-white"
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
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#21262d] text-white font-medium hover:bg-[#30363d] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#da3633] text-white font-medium hover:bg-[#f85149] transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Remove</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

