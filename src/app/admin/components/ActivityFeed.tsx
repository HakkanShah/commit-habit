'use client'

import { memo } from 'react'
import useSWR from 'swr'
import { Clock, TrendingUp, Loader2 } from 'lucide-react'

interface ActivityItem {
    id: string
    action: string
    actorType?: string
    createdAt: string
    user: { name: string | null; email: string | null; avatarUrl?: string | null }
    metadata: Record<string, unknown> | null
}

interface ActivityFeedProps {
    actorType?: 'USER' | 'ADMIN'
    limit?: number
    title?: string
    emptyMessage?: string
    showLoadMore?: boolean
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
})

const ACTION_INFO: Record<string, { text: string; icon: string }> = {
    'LOGIN': { text: 'logged in', icon: '🔐' },
    'LOGOUT': { text: 'logged out', icon: '👋' },
    'SIGNUP': { text: 'joined', icon: '🎉' },
    'USER_CREATED': { text: 'signed up', icon: '👤' },
    'TESTIMONIAL_SUBMITTED': { text: 'submitted feedback', icon: '💬' },
    'TESTIMONIAL_APPROVED': { text: 'approved feedback', icon: '✅' },
    'TESTIMONIAL_REJECTED': { text: 'rejected feedback', icon: '❌' },
    'TESTIMONIAL_EDITED': { text: 'edited feedback', icon: '✏️' },
    'REPO_ADDED': { text: 'added a repo', icon: '📁' },
    'REPO_REMOVED': { text: 'removed a repo', icon: '🗑️' },
    'REPO_PAUSED': { text: 'paused automation', icon: '⏸️' },
    'REPO_RESUMED': { text: 'resumed automation', icon: '▶️' },
    'ADMIN_DELETE_USER': { text: 'deleted a user', icon: '🚫' },
    'ADMIN_RESTORE_USER': { text: 'restored a user', icon: '♻️' },
    'ADMIN_DELETE_REPO': { text: 'removed a repo', icon: '🗑️' },
    'ADMIN_PAUSE_REPO': { text: 'paused a repo', icon: '⏸️' },
    'ADMIN_RESUME_REPO': { text: 'resumed a repo', icon: '▶️' },
    'ADMIN_COMMIT': { text: 'triggered a commit', icon: '📝' },
}

const formatAction = (action: string) => {
    return ACTION_INFO[action] || { text: action.replace(/_/g, ' ').toLowerCase(), icon: '📌' }
}

const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
}

const ActivityItem = memo(function ActivityItem({ item }: { item: ActivityItem }) {
    const actionInfo = formatAction(item.action)
    const isAdminAction = item.action.startsWith('ADMIN_') || item.actorType === 'ADMIN'

    return (
        <div className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${isAdminAction ? 'border-l-2 border-orange-500/50' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-sm">
                {actionInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm">
                    <span className="font-medium text-white">{item.user?.name || 'Unknown'}</span>
                    <span className="text-gray-500"> {actionInfo.text}</span>
                    {item.metadata && 'repoFullName' in item.metadata && (
                        <span className="text-gray-600 text-xs ml-1">
                            ({String(item.metadata.repoFullName)})
                        </span>
                    )}
                </p>
                {item.user?.email && (
                    <p className="text-xs text-gray-600 truncate">{item.user.email}</p>
                )}
            </div>
            <span className="text-[10px] text-gray-600 shrink-0 bg-white/5 px-2 py-0.5 rounded-full">
                {formatTimeAgo(item.createdAt)}
            </span>
        </div>
    )
})

export function ActivityFeed({
    actorType,
    limit = 10,
    title = 'Recent Activity',
    emptyMessage = 'No activity yet',
    showLoadMore = true
}: ActivityFeedProps) {
    const actorParam = actorType ? `&actorType=${actorType}` : ''
    const { data, error, isLoading, mutate, size, setSize } = useSWRInfinite(
        (pageIndex, previousPageData) => {
            if (previousPageData && !previousPageData.hasMore) return null
            const cursor = previousPageData?.nextCursor ? `&cursor=${previousPageData.nextCursor}` : ''
            return `/api/admin/audit?limit=${limit}${actorParam}${cursor}`
        },
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000
        }
    )

    // Flatten pages
    const activity: ActivityItem[] = data?.flatMap(page => page.logs) || []
    const hasMore = data?.[data.length - 1]?.hasMore || false

    if (isLoading && activity.length === 0) {
        return (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{title}</span>
                    </div>
                </div>
                <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                    {activity.length}
                </span>
            </div>

            {activity.length === 0 ? (
                <div className="py-10 text-center">
                    <TrendingUp className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">{emptyMessage}</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-white/5">
                        {activity.map((item) => (
                            <ActivityItem key={item.id} item={item} />
                        ))}
                    </div>

                    {showLoadMore && hasMore && (
                        <div className="p-3 border-t border-white/5">
                            <button
                                onClick={() => setSize(size + 1)}
                                className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                Load more
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// Need to import useSWRInfinite
import useSWRInfinite from 'swr/infinite'
