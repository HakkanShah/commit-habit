'use client'

import { useEffect, useState } from 'react'
import { Users, MessageSquare, GitCommit, Activity, Clock, TrendingUp, RefreshCw, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface GlobalStats {
    totalUsers: number
    activeInstallations: number
    pendingTestimonials: number
    totalAutoCommits: number
}

interface RecentActivity {
    id: string
    action: string
    createdAt: string
    user: { name: string | null; email: string | null }
    metadata: Record<string, unknown> | null
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null)
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    async function fetchData() {
        try {
            setRefreshing(true)
            const usersRes = await fetch('/api/admin/users?limit=1')
            if (!usersRes.ok) throw new Error('Failed to fetch stats')
            const usersData = await usersRes.json()
            setStats(usersData.globalStats)

            const auditRes = await fetch('/api/admin/audit?limit=8')
            if (!auditRes.ok) throw new Error('Failed to fetch activity')
            const auditData = await auditRes.json()
            setRecentActivity(auditData.logs || [])
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const formatAction = (action: string) => {
        const map: Record<string, string> = {
            'LOGIN': '🔐 User logged in',
            'LOGOUT': '👋 User logged out',
            'TESTIMONIAL_SUBMITTED': '💬 New testimonial',
            'TESTIMONIAL_APPROVED': '✅ Testimonial approved',
            'TESTIMONIAL_REJECTED': '❌ Testimonial rejected',
            'REPO_ADDED': '📁 Repository added',
        }
        return map[action] || action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-[#39d353]/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#39d353] animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-xs">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#39d353]" />
                    <h1 className="text-lg sm:text-xl font-bold">Dashboard</h1>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full sm:rounded-lg text-sm transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline text-gray-400">Refresh</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Users className="w-5 h-5" />} label="Users" value={stats?.totalUsers ?? 0} color="blue" />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Repos" value={stats?.activeInstallations ?? 0} color="green" />
                <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Pending" value={stats?.pendingTestimonials ?? 0} color="yellow" href="/admin/feedback" />
                <StatCard icon={<GitCommit className="w-5 h-5" />} label="Commits" value={stats?.totalAutoCommits ?? 0} color="purple" />
            </div>

            {/* Quick Actions - Mobile */}
            <div className="flex gap-3 sm:hidden">
                <Link href="/admin/feedback" className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm font-medium active:scale-95 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                    <span>Reviews</span>
                    {(stats?.pendingTestimonials ?? 0) > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                            {stats?.pendingTestimonials}
                        </span>
                    )}
                </Link>
                <Link href="/admin/users" className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-medium active:scale-95 transition-transform">
                    <Users className="w-4 h-4" />
                    <span>Users</span>
                </Link>
            </div>

            {/* Activity */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Recent Activity</span>
                    </div>
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{recentActivity.length}</span>
                </div>

                {recentActivity.length === 0 ? (
                    <div className="py-10 text-center">
                        <TrendingUp className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No activity yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {recentActivity.map((a) => (
                            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{formatAction(a.action)}</p>
                                    <p className="text-xs text-gray-600 truncate">{a.user?.name || a.user?.email || 'Unknown'}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 shrink-0">{formatTimeAgo(a.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color, href }: { icon: React.ReactNode; label: string; value: number; color: string; href?: string }) {
    const colors: Record<string, string> = {
        blue: 'from-blue-500 to-cyan-400',
        green: 'from-green-500 to-emerald-400',
        yellow: 'from-yellow-500 to-orange-400',
        purple: 'from-purple-500 to-pink-400',
    }

    const Card = (
        <div className={`relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-all ${href ? 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]' : ''}`}>
            <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${colors[color]} opacity-10 blur-2xl`} />
            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${colors[color]} mb-2`}>{icon}</div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{label}</p>
            {href && <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-600" />}
        </div>
    )
    return href ? <Link href={href}>{Card}</Link> : Card
}
