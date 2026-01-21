'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import {
    X, ExternalLink, GitBranch, GitCommit, Trash2,
    Play, Pause, ChevronDown, ChevronRight, Loader2,
    AlertCircle, Clock, Undo2
} from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from '@/components/toast'
import { parseApiError, getErrorMessage } from '@/lib/api-utils'

interface UserData {
    id: string
    email: string | null
    name: string | null
    avatarUrl: string | null
    role: string
    githubUsername: string | null
    lastLoginAt: string | null
    createdAt: string
    isDeleted: boolean
    stats: {
        repos: number
        testimonials: number
        auditLogs: number
        totalCommits: number
    }
}

interface Repo {
    id: string
    repoFullName: string
    active: boolean
    commitsToday: number
    totalCommits: number
    lastRunAt: string | null
    createdAt: string
}

interface Commit {
    id: string
    repoFullName: string
    message: string | null
    createdAt: string
}

interface UserActionPanelProps {
    userId: string | null
    onClose: () => void
    onUserUpdate?: () => void
}

const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        const error = await parseApiError(res)
        throw new Error(error.message || error.error)
    }
    return res.json()
}

export function UserActionPanel({ userId, onClose, onUserUpdate }: UserActionPanelProps) {
    const [expandedSection, setExpandedSection] = useState<'repos' | 'commits' | null>('repos')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        type: 'delete-user' | 'delete-repo' | 'commit'
        data?: { repoId?: string; repoName?: string }
    }>({ open: false, type: 'delete-user' })

    const toast = useToast()

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && userId) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [userId, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (userId) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [userId])

    // Fetch user data
    const { data: userData, error: userError, mutate: mutateUser, isLoading: userLoading } = useSWR(
        userId ? `/api/admin/users/${userId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    // Lazy-load repos only when section is expanded
    const { data: reposData, mutate: mutateRepos, isLoading: reposLoading } = useSWR(
        userId && expandedSection === 'repos' ? `/api/admin/users/${userId}/repos?limit=20` : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    // Lazy-load commits only when section is expanded
    const { data: commitsData, isLoading: commitsLoading } = useSWR(
        userId && expandedSection === 'commits' ? `/api/admin/users/${userId}/commits?limit=20` : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    const user: UserData | null = userData?.user || null
    const repos: Repo[] = reposData?.repos || []
    const commits: Commit[] = commitsData?.commits || []

    // Handlers with proper error handling
    const handleToggleRepo = useCallback(async (repoId: string, active: boolean) => {
        setActionLoading(`toggle-${repoId}`)
        try {
            const res = await fetch(`/api/admin/users/${userId}/repos/${repoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active })
            })
            if (!res.ok) {
                const error = await parseApiError(res)
                throw new Error(getErrorMessage(error.code, error.error))
            }
            await mutateRepos()
            toast.success(active ? 'Repo resumed' : 'Repo paused')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update repo'
            toast.error('Action failed', message)
        } finally {
            setActionLoading(null)
        }
    }, [userId, mutateRepos, toast])

    const handleDeleteRepo = useCallback(async () => {
        if (!confirmDialog.data?.repoId) return
        const repoId = confirmDialog.data.repoId
        const repoName = confirmDialog.data.repoName || 'Repository'

        try {
            const res = await fetch(`/api/admin/users/${userId}/repos/${repoId}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const error = await parseApiError(res)
                throw new Error(getErrorMessage(error.code, error.error))
            }
            await mutateRepos()
            onUserUpdate?.()
            toast.success('Repo removed', `${repoName} has been removed`)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete repo'
            toast.error('Delete failed', message)
            throw err
        }
    }, [userId, confirmDialog.data, mutateRepos, onUserUpdate, toast])

    const handleTriggerCommit = useCallback(async () => {
        if (!confirmDialog.data?.repoId) return
        const repoId = confirmDialog.data.repoId
        const repoName = confirmDialog.data.repoName || 'Repository'

        try {
            const res = await fetch(`/api/admin/users/${userId}/repos/${repoId}/commit`, {
                method: 'POST'
            })
            if (!res.ok) {
                const error = await parseApiError(res)
                throw new Error(getErrorMessage(error.code, error.error))
            }
            await mutateRepos()
            toast.success('Commit created', `Successfully committed to ${repoName}`)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to trigger commit'
            toast.error('Commit failed', message)
            throw err
        }
    }, [userId, confirmDialog.data, mutateRepos, toast])

    const handleDeleteUser = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const error = await parseApiError(res)
                throw new Error(getErrorMessage(error.code, error.error))
            }
            await mutateUser()
            onUserUpdate?.()
            toast.success('User deleted', 'User has been soft-deleted')
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete user'
            toast.error('Delete failed', message)
            throw err
        }
    }, [userId, mutateUser, onUserUpdate, onClose, toast])

    const handleRestoreUser = useCallback(async () => {
        setActionLoading('restore')
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore' })
            })
            if (!res.ok) {
                const error = await parseApiError(res)
                throw new Error(getErrorMessage(error.code, error.error))
            }
            await mutateUser()
            onUserUpdate?.()
            toast.success('User restored', 'User account has been reactivated')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to restore user'
            toast.error('Restore failed', message)
        } finally {
            setActionLoading(null)
        }
    }, [userId, mutateUser, onUserUpdate, toast])

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const diff = Date.now() - new Date(dateString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    if (!userId) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 fade-in"
                onClick={onClose}
            />

            {/* Centered Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Modal */}
                <div
                    className="w-full max-w-lg max-h-[90vh] bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
                        <h2 className="text-lg font-semibold">User Details</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors press-effect"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {userLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                            </div>
                        ) : userError ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4">
                                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                                <p className="text-red-400 font-medium">Failed to load user</p>
                                <p className="text-xs text-gray-500 mt-1 text-center max-w-xs">
                                    {userError instanceof Error ? userError.message : 'Unknown error occurred'}
                                </p>
                                <button
                                    onClick={() => mutateUser()}
                                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : user ? (
                            <div className="p-4 space-y-4">
                                {/* User Profile */}
                                <div className={`p-4 rounded-xl border ${user.isDeleted ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=1a1a2e&color=fff&size=80`}
                                            alt=""
                                            className={`w-16 h-16 rounded-full ring-2 ${user.isDeleted ? 'ring-red-500/30 opacity-50' : 'ring-white/10'}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-semibold text-lg ${user.isDeleted ? 'text-gray-400' : ''}`}>
                                                    {user.name || 'Unknown'}
                                                </span>
                                                {user.role === 'ADMIN' && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full">
                                                        ADMIN
                                                    </span>
                                                )}
                                                {user.isDeleted && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full">
                                                        DELETED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            {user.githubUsername && (
                                                <a
                                                    href={`https://github.com/${user.githubUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#58a6ff] hover:underline"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    @{user.githubUsername}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-blue-400">{user.stats.repos}</p>
                                            <p className="text-[10px] text-gray-500">Repos</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-green-400">{user.stats.totalCommits}</p>
                                            <p className="text-[10px] text-gray-500">Commits</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-purple-400">{user.stats.testimonials}</p>
                                            <p className="text-[10px] text-gray-500">Feedback</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-gray-400">{user.stats.auditLogs}</p>
                                            <p className="text-[10px] text-gray-500">Actions</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Last seen: {formatTimeAgo(user.lastLoginAt)}
                                        </span>
                                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Repos Section */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSection(expandedSection === 'repos' ? null : 'repos')}
                                        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-blue-400" />
                                            <span className="font-medium">Repositories</span>
                                            <span className="text-xs text-gray-500">({user.stats.repos})</span>
                                        </div>
                                        {expandedSection === 'repos' ? (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>

                                    {expandedSection === 'repos' && (
                                        <div className="border-t border-white/5">
                                            {reposLoading ? (
                                                <div className="py-6 flex justify-center">
                                                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                                                </div>
                                            ) : repos.length === 0 ? (
                                                <div className="py-6 text-center text-gray-500 text-sm">
                                                    No repositories
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                                    {repos.map((repo) => (
                                                        <div key={repo.id} className="p-3 hover:bg-white/[0.02]">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className={`w-2 h-2 rounded-full ${repo.active ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                                    <span className="text-sm truncate">{repo.repoFullName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => setConfirmDialog({
                                                                            open: true,
                                                                            type: 'commit',
                                                                            data: { repoId: repo.id, repoName: repo.repoFullName }
                                                                        })}
                                                                        disabled={!repo.active}
                                                                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors disabled:opacity-30"
                                                                        title="Trigger Commit"
                                                                    >
                                                                        <GitCommit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleToggleRepo(repo.id, !repo.active)}
                                                                        disabled={actionLoading === `toggle-${repo.id}`}
                                                                        className={`p-1.5 rounded-lg transition-colors ${repo.active ? 'hover:bg-yellow-500/10 text-yellow-400' : 'hover:bg-green-500/10 text-green-400'}`}
                                                                        title={repo.active ? 'Pause' : 'Resume'}
                                                                    >
                                                                        {actionLoading === `toggle-${repo.id}` ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : repo.active ? (
                                                                            <Pause className="w-4 h-4" />
                                                                        ) : (
                                                                            <Play className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmDialog({
                                                                            open: true,
                                                                            type: 'delete-repo',
                                                                            data: { repoId: repo.id, repoName: repo.repoFullName }
                                                                        })}
                                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                                        title="Remove Repo"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                <span>{repo.totalCommits} commits</span>
                                                                <span>Last run: {formatTimeAgo(repo.lastRunAt)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Commits Section */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSection(expandedSection === 'commits' ? null : 'commits')}
                                        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <GitCommit className="w-4 h-4 text-green-400" />
                                            <span className="font-medium">Commit History</span>
                                        </div>
                                        {expandedSection === 'commits' ? (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>

                                    {expandedSection === 'commits' && (
                                        <div className="border-t border-white/5">
                                            {commitsLoading ? (
                                                <div className="py-6 flex justify-center">
                                                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                                                </div>
                                            ) : commits.length === 0 ? (
                                                <div className="py-6 text-center text-gray-500 text-sm">
                                                    No commits yet
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                                    {commits.map((commit) => (
                                                        <div key={commit.id} className="p-3 hover:bg-white/[0.02]">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-gray-400 truncate">{commit.repoFullName}</span>
                                                                <span className="text-xs text-gray-600">{formatTimeAgo(commit.createdAt)}</span>
                                                            </div>
                                                            {commit.message && (
                                                                <p className="text-xs text-gray-500 truncate mt-0.5">{commit.message}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                    <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
                                    {user.isDeleted ? (
                                        <button
                                            onClick={handleRestoreUser}
                                            disabled={actionLoading === 'restore'}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === 'restore' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Undo2 className="w-4 h-4" />
                                            )}
                                            Restore User
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDialog({ open: true, type: 'delete-user' })}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete User
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        {user.isDeleted
                                            ? 'This user was deleted. Restore to reactivate their account.'
                                            : 'Soft-delete with 30-day retention. User can be restored within this period.'
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={confirmDialog.open && confirmDialog.type === 'delete-user'}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={handleDeleteUser}
                title="Delete User"
                description={`This will soft-delete the user "${user?.name || user?.email}". Their data will be retained for 30 days before permanent deletion.`}
                confirmText="Delete User"
                confirmType="danger"
                requireConfirmText="DELETE"
            />

            <ConfirmDialog
                open={confirmDialog.open && confirmDialog.type === 'delete-repo'}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={handleDeleteRepo}
                title="Remove Repository"
                description={`This will remove "${confirmDialog.data?.repoName}" and all its activity logs permanently.`}
                confirmText="Remove"
                confirmType="danger"
            />

            <ConfirmDialog
                open={confirmDialog.open && confirmDialog.type === 'commit'}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={handleTriggerCommit}
                title="Trigger Commit"
                description={`This will create a commit on "${confirmDialog.data?.repoName}" attributed to the user. This counts towards their GitHub contribution graph.`}
                confirmText="Create Commit"
                confirmType="default"
            />
        </>
    )
}
