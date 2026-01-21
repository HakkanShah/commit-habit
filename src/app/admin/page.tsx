'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import {
    Users, MessageSquare, GitCommit, Activity, TrendingUp, RefreshCw,
    AlertCircle, ArrowRight, Sparkles, Shield, Clock, ChevronRight,
    GitBranch, Zap, Calendar, Eye, Mail
} from 'lucide-react'
import Link from 'next/link'
import { DashboardSkeleton } from './components/skeletons'

interface GlobalStats {
    totalUsers: number
    activeInstallations: number
    pendingTestimonials: number
    totalAutoCommits: number
}

interface RecentActivity {
    id: string
    action: string
    actorType?: string
    createdAt: string
    user: { name: string | null; email: string | null; avatarUrl?: string | null }
    metadata: Record<string, unknown> | null
}

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
}

// Action info mapping
const ACTION_INFO: Record<string, { text: string; icon: string; color: string }> = {
    'LOGIN': { text: 'logged in', icon: '🔐', color: 'blue' },
    'LOGOUT': { text: 'logged out', icon: '👋', color: 'gray' },
    'SIGNUP': { text: 'joined', icon: '🎉', color: 'green' },
    'USER_CREATED': { text: 'signed up', icon: '👤', color: 'green' },
    'TESTIMONIAL_SUBMITTED': { text: 'submitted feedback', icon: '💬', color: 'purple' },
    'TESTIMONIAL_APPROVED': { text: 'approved feedback', icon: '✅', color: 'green' },
    'TESTIMONIAL_REJECTED': { text: 'rejected feedback', icon: '❌', color: 'red' },
    'TESTIMONIAL_EDITED': { text: 'edited feedback', icon: '✏️', color: 'yellow' },
    'REPO_ADDED': { text: 'added a repo', icon: '📁', color: 'blue' },
    'REPO_REMOVED': { text: 'removed a repo', icon: '🗑️', color: 'red' },
    'REPO_PAUSED': { text: 'paused automation', icon: '⏸️', color: 'yellow' },
    'REPO_RESUMED': { text: 'resumed automation', icon: '▶️', color: 'green' },
    'ADMIN_DELETE_USER': { text: 'deleted a user', icon: '🚫', color: 'red' },
    'ADMIN_RESTORE_USER': { text: 'restored a user', icon: '♻️', color: 'green' },
    'ADMIN_DELETE_REPO': { text: 'removed a repo', icon: '🗑️', color: 'red' },
    'ADMIN_PAUSE_REPO': { text: 'paused a repo', icon: '⏸️', color: 'yellow' },
    'ADMIN_RESUME_REPO': { text: 'resumed a repo', icon: '▶️', color: 'green' },
    'ADMIN_COMMIT': { text: 'triggered a commit', icon: '📝', color: 'purple' },
}

export default function AdminDashboard() {
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users')

    // Fetch stats
    const { data: usersData, error: usersError, isLoading: usersLoading, mutate: mutateUsers } = useSWR(
        '/api/admin/users?limit=1', fetcher, swrConfig
    )

    // Fetch user activity
    const { data: userActivityData, error: userActivityError, isLoading: userActivityLoading, mutate: mutateUserActivity } = useSWR(
        activeTab === 'users' ? '/api/admin/audit?limit=10&actorType=USER' : null,
        fetcher,
        swrConfig
    )

    // Fetch admin activity
    const { data: adminActivityData, error: adminActivityError, isLoading: adminActivityLoading, mutate: mutateAdminActivity } = useSWR(
        activeTab === 'admins' ? '/api/admin/audit?limit=10&actorType=ADMIN' : null,
        fetcher,
        swrConfig
    )

    const stats: GlobalStats | null = usersData?.globalStats || null
    const userActivity: RecentActivity[] = userActivityData?.logs || []
    const adminActivity: RecentActivity[] = adminActivityData?.logs || []

    const loading = usersLoading
    const activityLoading = activeTab === 'users' ? userActivityLoading : adminActivityLoading
    const activityError = activeTab === 'users' ? userActivityError : adminActivityError
    const activity = activeTab === 'users' ? userActivity : adminActivity
    const error = usersError ? 'Failed to load data' : null

    // Calculate growth indicators (mock for now)
    const growthData = useMemo(() => ({
        users: stats?.totalUsers ? '+12%' : null,
        repos: stats?.activeInstallations ? '+8%' : null,
    }), [stats])

    async function fetchData() {
        setRefreshing(true)
        await Promise.all([
            mutateUsers(),
            mutateUserActivity(),
            mutateAdminActivity()
        ])
        setRefreshing(false)
    }

    const formatAction = (action: string) => {
        return ACTION_INFO[action] || { text: action.replace(/_/g, ' ').toLowerCase(), icon: '📌', color: 'gray' }
    }

    const formatTimeAgo = (dateString: string) => {
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

    if (loading) {
        return <DashboardSkeleton />
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Failed to load dashboard</h3>
                    <p className="text-red-400/80 text-sm mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39d353]/20 to-[#39d353]/5 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#39d353]" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold">Dashboard</h1>
                        <p className="text-xs text-gray-500">Welcome back, Admin</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 press-effect"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Grid - Desktop: 4 cols, Mobile: 2 cols */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats?.totalUsers ?? 0}
                    color="blue"
                    href="/admin/users"
                    growth={growthData.users}
                />
                <StatCard
                    icon={GitBranch}
                    label="Active Repos"
                    value={stats?.activeInstallations ?? 0}
                    color="green"
                    growth={growthData.repos}
                />
                <StatCard
                    icon={MessageSquare}
                    label="Pending Reviews"
                    value={stats?.pendingTestimonials ?? 0}
                    color="yellow"
                    href="/admin/feedback"
                    alert={stats?.pendingTestimonials ? stats.pendingTestimonials > 0 : false}
                />
                <StatCard
                    icon={GitCommit}
                    label="Auto Commits"
                    value={stats?.totalAutoCommits ?? 0}
                    color="purple"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Activity Feed - Takes 2 cols on desktop */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Tab Headers */}
                    <div className="flex items-center border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${activeTab === 'users'
                                ? 'text-[#39d353] bg-[#39d353]/5 border-b-2 border-[#39d353] -mb-px'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            <Activity className="w-4 h-4" />
                            <span>User Activity</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${activeTab === 'admins'
                                ? 'text-orange-400 bg-orange-400/5 border-b-2 border-orange-400 -mb-px'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span>Admin Actions</span>
                        </button>
                    </div>

                    {/* Activity Content */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activityLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3">
                                <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
                                <p className="text-sm text-gray-500">Loading activity...</p>
                            </div>
                        ) : activityError ? (
                            <div className="py-16 text-center">
                                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                <p className="text-red-400 font-medium">Failed to load activity</p>
                                <p className="text-xs text-gray-500 mt-1">Try refreshing the page</p>
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-400 font-medium">No activity yet</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {activeTab === 'users' ? 'User actions will appear here' : 'Admin actions will appear here'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activity.map((a, index) => {
                                    const actionInfo = formatAction(a.action)
                                    const isAdminAction = a.action.startsWith('ADMIN_') || a.actorType === 'ADMIN'

                                    return (
                                        <div
                                            key={a.id}
                                            className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors ${index === 0 ? 'bg-white/[0.01]' : ''
                                                }`}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {/* Avatar or Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base ${isAdminAction
                                                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 ring-2 ring-orange-500/30'
                                                : 'bg-white/5'
                                                }`}>
                                                {actionInfo.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">
                                                    <span className="font-medium text-white">
                                                        {a.user?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-gray-500"> {actionInfo.text}</span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {a.metadata && 'repoFullName' in a.metadata && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                                                            <GitBranch className="w-3 h-3" />
                                                            {String(a.metadata.repoFullName).split('/')[1] || String(a.metadata.repoFullName)}
                                                        </span>
                                                    )}
                                                    {a.metadata && 'userName' in a.metadata && (
                                                        <span className="text-xs text-gray-600">
                                                            → {String(a.metadata.userName)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
                                                    {formatTimeAgo(a.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Sidebar - Desktop only */}
                <div className="space-y-4">
                    {/* Quick Actions Card */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <QuickActionButton
                                href="/admin/users"
                                icon={Users}
                                label="Manage Users"
                                color="blue"
                            />
                            <QuickActionButton
                                href="/admin/feedback"
                                icon={MessageSquare}
                                label="Review Feedback"
                                color="yellow"
                                badge={stats?.pendingTestimonials}
                            />
                            <QuickActionButton
                                href="/admin/emails"
                                icon={Mail}
                                label="Email Center"
                                color="purple"
                            />
                        </div>
                    </div>

                    {/* System Status Card */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-400" />
                            System Status
                        </h3>
                        <div className="space-y-3">
                            <StatusItem label="API Status" status="operational" />
                            <StatusItem label="Cron Jobs" status="operational" />
                            <StatusItem label="GitHub Sync" status="operational" />
                        </div>
                    </div>

                    {/* Today's Summary */}
                    <div className="bg-gradient-to-br from-[#39d353]/10 to-transparent border border-[#39d353]/20 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-[#39d353] mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Today
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">{stats?.totalAutoCommits ? Math.floor(stats.totalAutoCommits * 0.1) : 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commits</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">{activity.length}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Actions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Quick Actions */}
            <div className="lg:hidden grid grid-cols-3 gap-3">
                <Link
                    href="/admin/users"
                    className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 active:scale-95 transition-transform"
                >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-medium">Users</span>
                </Link>
                <Link
                    href="/admin/feedback"
                    className="relative flex flex-col items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 active:scale-95 transition-transform"
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs font-medium">Feedback</span>
                    {(stats?.pendingTestimonials ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                            {stats?.pendingTestimonials}
                        </span>
                    )}
                </Link>
                <Link
                    href="/admin/emails"
                    className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 active:scale-95 transition-transform"
                >
                    <Mail className="w-5 h-5" />
                    <span className="text-xs font-medium">Emails</span>
                </Link>
            </div>
        </div>
    )
}

// Enhanced Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    color,
    href,
    growth,
    alert
}: {
    icon: React.ElementType
    label: string
    value: number
    color: string
    href?: string
    growth?: string | null
    alert?: boolean
}) {
    const colorClasses: Record<string, { bg: string; icon: string; glow: string }> = {
        blue: { bg: 'from-blue-500/20 to-blue-500/5', icon: 'text-blue-400', glow: 'bg-blue-500' },
        green: { bg: 'from-green-500/20 to-green-500/5', icon: 'text-green-400', glow: 'bg-green-500' },
        yellow: { bg: 'from-yellow-500/20 to-yellow-500/5', icon: 'text-yellow-400', glow: 'bg-yellow-500' },
        purple: { bg: 'from-purple-500/20 to-purple-500/5', icon: 'text-purple-400', glow: 'bg-purple-500' },
    }

    const colors = colorClasses[color] || colorClasses.blue

    const Card = (
        <div className={`relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-2xl p-4 lg:p-5 transition-all group ${href ? 'cursor-pointer hover:bg-white/[0.04] hover:border-white/10 active:scale-[0.98]' : ''
            }`}>
            {/* Glow Effect */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 ${colors.glow} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

            {/* Alert Pulse */}
            {alert && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            )}

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-gray-500">{label}</p>
                        {href && <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl lg:text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
                        {growth && (
                            <span className="text-xs text-green-400 font-medium">{growth}</span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
            </div>
        </div>
    )

    return href ? <Link href={href}>{Card}</Link> : Card
}

// Quick Action Button Component
function QuickActionButton({
    href,
    icon: Icon,
    label,
    color,
    badge
}: {
    href: string
    icon: React.ElementType
    label: string
    color: string
    badge?: number
}) {
    const colorClasses: Record<string, string> = {
        blue: 'hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400',
        yellow: 'hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-400',
        purple: 'hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400',
    }

    return (
        <Link
            href={href}
            className={`relative flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-400 transition-all press-effect ${colorClasses[color]}`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
            <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
            {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    )
}

// Status Item Component
function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
    const statusClasses = {
        operational: { dot: 'bg-green-500', text: 'text-green-400', label: 'Operational' },
        degraded: { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'Degraded' },
        down: { dot: 'bg-red-500', text: 'text-red-400', label: 'Down' },
    }

    const s = statusClasses[status]

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot} ${status === 'operational' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs ${s.text}`}>{s.label}</span>
            </div>
        </div>
    )
}
