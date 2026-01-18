'use client'

import { useEffect, useState } from 'react'
import { Search, Users, GitBranch, MessageSquare, ChevronDown, ChevronUp, ExternalLink, RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import { UsersSkeleton } from '../components/skeletons'

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
    githubUsername: string | null
    providers: string[]
    stats: { installations: number; testimonials: number; auditLogs: number }
    installations: Installation[]
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [total, setTotal] = useState(0)

    async function fetchUsers() {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (search && search.length >= 2) params.set('search', search)
            params.set('limit', '50')
            const res = await fetch(`/api/admin/users?${params}`)
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            setUsers(data.users)
            setTotal(data.total)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (search === '') { fetchUsers(); return }
        if (search.length < 2) return
        const debounce = setTimeout(fetchUsers, 500)
        return () => clearTimeout(debounce)
    }, [search])

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return '—'
        const diff = Date.now() - new Date(dateString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h`
        return `${Math.floor(hours / 24)}d`
    }

    if (loading && users.length === 0) {
        return <UsersSkeleton />
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#39d353]" />
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold">Users</h1>
                        <p className="text-xs text-gray-600">{total} total</p>
                    </div>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full sm:rounded-lg text-sm transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline text-gray-400">Refresh</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                    type="text"
                    placeholder="Search (min 2 chars)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#39d353]/30 transition-all"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* List */}
            <div className="space-y-2">
                {users.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl py-12 text-center">
                        <Users className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No users found</p>
                    </div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            {/* Row */}
                            <div
                                className="flex items-center gap-3 p-3 cursor-pointer active:bg-white/[0.02]"
                                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            >
                                <img
                                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=1a1a2e&color=fff&size=40`}
                                    alt=""
                                    className="w-10 h-10 rounded-full ring-2 ring-white/10 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{user.name || 'Unknown'}</span>
                                        {user.role === 'ADMIN' && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shrink-0">
                                                ADMIN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {user.stats.installations}</span>
                                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {user.stats.testimonials}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600">{formatTimeAgo(user.lastLoginAt)}</span>
                                    {expandedUser === user.id ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                </div>
                            </div>

                            {/* Expanded */}
                            {expandedUser === user.id && (
                                <div className="px-3 pb-3 border-t border-white/5 bg-black/20">
                                    <div className="pt-3 space-y-3">
                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                                                <p className="text-lg font-bold text-blue-400">{user.stats.installations}</p>
                                                <p className="text-[10px] text-gray-500">Repos</p>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                                                <p className="text-lg font-bold text-green-400">{user.stats.testimonials}</p>
                                                <p className="text-[10px] text-gray-500">Feedback</p>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                                                <p className="text-lg font-bold text-purple-400">{user.stats.auditLogs}</p>
                                                <p className="text-[10px] text-gray-500">Actions</p>
                                            </div>
                                        </div>

                                        {/* GitHub */}
                                        {user.githubUsername && (
                                            <a
                                                href={`https://github.com/${user.githubUsername}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-[#58a6ff]"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                @{user.githubUsername}
                                            </a>
                                        )}

                                        {/* Repos */}
                                        {user.installations.length > 0 && (
                                            <div className="space-y-1">
                                                {user.installations.slice(0, 3).map((i) => (
                                                    <div key={i.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.02] rounded-lg text-xs">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${i.active ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                        <span className="text-gray-400 truncate flex-1">{i.repoFullName}</span>
                                                        <span className="text-gray-600">{i.commitsToday}↑</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
