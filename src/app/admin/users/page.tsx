'use client'

import { useState, useDeferredValue, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import {
    Search, Users, GitBranch, MessageSquare, ChevronRight,
    RefreshCw, AlertCircle, Sparkles, Trash2, Filter,
    Clock, Activity, Crown, UserX
} from 'lucide-react'
import { UsersSkeleton, EmptyState, StatusIndicator } from '../components/skeletons'
import { UserActionPanel } from '../components/UserActionPanel'

interface Installation {
    id: string
    repoFullName: string
    active: boolean
    commitsToday: number
    lastRunAt: string | null
    totalActivityLogs: number
}

interface User {
    id: string
    email: string | null
    name: string | null
    avatarUrl: string | null
    role: string
    lastLoginAt: string | null
    createdAt: string
    deletedAt?: string | null
    githubUsername: string | null
    providers: string[]
    stats: { installations: number; testimonials: number; auditLogs: number }
    installations: Installation[]
}

type FilterTab = 'all' | 'active' | 'admins' | 'deleted'

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
})

// SWR config
const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
}

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

    // Deferred search for smoother typing
    const deferredSearch = useDeferredValue(search)

    // Build SWR key with search
    const searchParam = deferredSearch.length >= 2 ? `&search=${encodeURIComponent(deferredSearch)}` : ''
    const deletedParam = activeFilter === 'deleted' ? '&includeDeleted=true' : ''
    const { data, error, isLoading: loading, mutate } = useSWR(
        `/api/admin/users?limit=100${searchParam}${deletedParam}`,
        fetcher,
        swrConfig
    )

    const allUsers: User[] = data?.users || []
    const total = data?.total || 0

    // Filter users based on active tab
    const users = useMemo(() => {
        switch (activeFilter) {
            case 'active':
                return allUsers.filter(u => !u.deletedAt && u.stats.installations > 0)
            case 'admins':
                return allUsers.filter(u => u.role === 'ADMIN')
            case 'deleted':
                return allUsers.filter(u => u.deletedAt)
            default:
                return allUsers.filter(u => !u.deletedAt)
        }
    }, [allUsers, activeFilter])

    /**
     * Render one page of rows at a time.
     *
     * The list is rendered twice — a desktop table and a mobile card list, both
     * always in the DOM and switched with CSS. With 100 users fetched that was
     * 10,333 DOM nodes and a 551 ms unbroken main-thread task on a throttled
     * phone, which is what made this page feel frozen on open.
     *
     * Slicing the rendered rows is the fix rather than server-side paging,
     * because the filter tab counts below are computed across the whole fetched
     * set; paging the fetch would make those counts wrong.
     */
    const PAGE_SIZE = 25
    const [page, setPage] = useState(0)

    const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount - 1)
    const visibleUsers = useMemo(
        () => users.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
        [users, currentPage]
    )

    // Changing tab or search must not leave you stranded on a page that no
    // longer exists.
    useEffect(() => { setPage(0) }, [activeFilter, deferredSearch])

    // Stats for filter tabs
    const stats = useMemo(() => ({
        all: allUsers.filter(u => !u.deletedAt).length,
        active: allUsers.filter(u => !u.deletedAt && u.stats.installations > 0).length,
        admins: allUsers.filter(u => u.role === 'ADMIN').length,
        deleted: allUsers.filter(u => u.deletedAt).length
    }), [allUsers])

    async function fetchUsers() {
        await mutate()
    }

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const diff = Date.now() - new Date(dateString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d ago`
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const filterTabs: { id: FilterTab; label: string; icon: React.ElementType; count: number }[] = [
        { id: 'all', label: 'All Users', icon: Users, count: stats.all },
        { id: 'active', label: 'Active', icon: Activity, count: stats.active },
        { id: 'admins', label: 'Admins', icon: Crown, count: stats.admins },
        { id: 'deleted', label: 'Deleted', icon: UserX, count: stats.deleted },
    ]

    if (loading && allUsers.length === 0) {
        return <UsersSkeleton />
    }

    return (
        <>
            <div className="space-y-4 sm:space-y-5">
                {/* Sticky Header Section */}
                <div className="sticky top-0 z-20 pb-6 pt-1 bg-gradient-to-b from-[#0d1117] via-[#0d1117] via-80% to-transparent">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39d353]/20 to-[#39d353]/5 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#39d353]" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold">Users</h1>
                                <p className="text-xs text-gray-500">{total} registered users</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 press-effect"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or GitHub username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39d353]/30 focus:border-[#39d353]/30 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/10"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs - Scrollable on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
                        {filterTabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeFilter === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveFilter(tab.id)}
                                    className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                                    transition-all press-effect shrink-0
                                    ${isActive
                                            ? tab.id === 'deleted'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-[#39d353]/20 text-[#39d353] border border-[#39d353]/30'
                                            : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:bg-white/5 hover:text-white'
                                        }
                                `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className={`
                                    px-1.5 py-0.5 text-[10px] rounded-full font-bold
                                    ${isActive
                                            ? tab.id === 'deleted' ? 'bg-red-500/30' : 'bg-[#39d353]/30'
                                            : 'bg-white/10'
                                        }
                                `}>
                                        {tab.count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 fade-in">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <div className="flex-1">
                            <p className="text-red-400 text-sm font-medium">Failed to load users</p>
                            <p className="text-red-400/70 text-xs">{error?.message}</p>
                        </div>
                        <button
                            onClick={fetchUsers}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-4">User</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-center">Repos</div>
                        <div className="col-span-2 text-center">Feedback</div>
                        <div className="col-span-2 text-right">Last Active</div>
                    </div>

                    {/* Table Body */}
                    {users.length === 0 ? (
                        <EmptyState
                            icon={activeFilter === 'deleted' ? Trash2 : Users}
                            title={activeFilter === 'deleted' ? 'No deleted users' : 'No users found'}
                            description={search ? 'Try adjusting your search terms' : 'Users will appear here once they sign up'}
                        />
                    ) : (
                        <div className="divide-y divide-white/5 stagger-children">
                            {visibleUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUserId(user.id)}
                                    className={`
                                        list-row-auto grid grid-cols-12 gap-4 items-center px-4 py-3 
                                        cursor-pointer transition-all premium-card
                                        hover:bg-white/[0.03]
                                        ${user.deletedAt ? 'opacity-60' : ''}
                                    `}
                                >
                                    {/* User Info */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=1a1a2e&color=fff&size=40`}
                                                alt=""
                                                className="w-10 h-10 rounded-full ring-2 ring-white/10"
                                            />
                                            {user.role === 'ADMIN' && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                                                    <Crown className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm truncate">{user.name || 'Unknown'}</span>
                                                {user.deletedAt && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 rounded-full">
                                                        DELETED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex justify-center">
                                        {user.deletedAt ? (
                                            <span className="flex items-center gap-1.5 text-xs text-red-400">
                                                <StatusIndicator status="error" />
                                                Deleted
                                            </span>
                                        ) : user.stats.installations > 0 ? (
                                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                                                <StatusIndicator status="active" pulse />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <StatusIndicator status="inactive" />
                                                Inactive
                                            </span>
                                        )}
                                    </div>

                                    {/* Repos */}
                                    <div className="col-span-2 flex justify-center">
                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <GitBranch className="w-4 h-4" />
                                            {user.stats.installations}
                                        </span>
                                    </div>

                                    {/* Feedback */}
                                    <div className="col-span-2 flex justify-center">
                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <MessageSquare className="w-4 h-4" />
                                            {user.stats.testimonials}
                                        </span>
                                    </div>

                                    {/* Last Active */}
                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                        <span className="text-xs text-gray-500">
                                            {formatTimeAgo(user.lastLoginAt)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3 stagger-children">
                    {users.length === 0 ? (
                        <EmptyState
                            icon={activeFilter === 'deleted' ? Trash2 : Users}
                            title={activeFilter === 'deleted' ? 'No deleted users' : 'No users found'}
                            description={search ? 'Try adjusting your search terms' : 'Users will appear here once they sign up'}
                        />
                    ) : (
                        visibleUsers.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUserId(user.id)}
                                className={`
                                    list-row-auto bg-white/[0.02] border rounded-xl p-4 
                                    cursor-pointer transition-all premium-card press-effect
                                    active:scale-[0.98]
                                    ${user.deletedAt
                                        ? 'border-red-500/20 bg-red-500/5'
                                        : 'border-white/5 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=1a1a2e&color=fff&size=48`}
                                            alt=""
                                            className={`w-12 h-12 rounded-full ring-2 ${user.deletedAt ? 'ring-red-500/30 opacity-60' : 'ring-white/10'}`}
                                        />
                                        {user.role === 'ADMIN' && (
                                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center ring-2 ring-[#0d1117]">
                                                <Crown className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-semibold truncate ${user.deletedAt ? 'text-gray-400' : ''}`}>
                                                {user.name || 'Unknown'}
                                            </span>
                                            {user.deletedAt && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 rounded-full">
                                                    DELETED
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <GitBranch className="w-3.5 h-3.5" />
                                                {user.stats.installations} repos
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {user.stats.testimonials}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTimeAgo(user.lastLoginAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-5 h-5 text-gray-600 shrink-0 mt-1" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Results count */}
                {users.length > 0 && (
                    <p className="text-xs text-gray-600 text-center pt-2">
                        Showing {users.length} of {stats.all} users
                    </p>
                )}
            </div>

            {/* User Action Panel */}
            {/*
              Pager. Rendered once, below both list layouts, so it controls
              whichever one CSS is currently showing.
            */}
            {users.length > PAGE_SIZE && (
                <nav
                    aria-label="User list pages"
                    className="flex items-center justify-between gap-4 px-4 py-4 text-sm"
                >
                    <p className="text-gray-400" aria-live="polite">
                        Showing{' '}
                        <span className="text-white">
                            {currentPage * PAGE_SIZE + 1}–
                            {Math.min((currentPage + 1) * PAGE_SIZE, users.length)}
                        </span>{' '}
                        of <span className="text-white">{users.length}</span>
                        {/* The fetch is capped at 100. Without saying so, the tab
                            badge reading "100" next to a header reading "141
                            registered users" looks like a bug, and an admin would
                            reasonably assume they are seeing everyone. */}
                        {total > allUsers.length && (
                            <span className="text-gray-500">
                                {' '}· first {allUsers.length} of {total} loaded, search to narrow
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-gray-500">
                            {currentPage + 1} / {pageCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                            disabled={currentPage >= pageCount - 1}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </nav>
            )}

            {selectedUserId && (
                <UserActionPanel
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onUserUpdate={fetchUsers}
                />
            )}
        </>
    )
}
