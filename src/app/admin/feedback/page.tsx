'use client'

import { useEffect, useState } from 'react'
import { Check, X, Edit3, Star, Clock, ExternalLink, MessageSquare, RefreshCw, AlertCircle, Sparkles } from 'lucide-react'

interface Testimonial {
    id: string
    userId: string
    userName: string
    userEmail: string | null
    userAvatar: string | null
    githubUsername: string | null
    content: string
    editedContent: string | null
    rating: number
    status: string
    featured: boolean
    createdAt: string
    updatedAt: string
}

export default function AdminFeedbackPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('PENDING')
    const [pendingCount, setPendingCount] = useState(0)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    async function fetchTestimonials() {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            params.set('limit', '50')
            const res = await fetch(`/api/admin/feedback?${params}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setTestimonials(data.testimonials)
            setPendingCount(data.pendingCount)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTestimonials() }, [statusFilter])

    const handleApprove = async (id: string, editedContent?: string) => {
        try {
            setActionLoading(id)
            const body: { editedContent?: string } = {}
            if (editedContent) body.editedContent = editedContent
            const res = await fetch(`/api/admin/feedback/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (!res.ok) throw new Error('Failed')
            await fetchTestimonials()
            setEditingId(null)
            setEditContent('')
        } catch (err) {
            alert('Failed to approve')
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (id: string) => {
        if (!confirm('Delete this testimonial?')) return
        try {
            setActionLoading(id)
            const res = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            await fetchTestimonials()
        } catch {
            alert('Failed to reject')
        } finally {
            setActionLoading(null)
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
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

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#39d353]" />
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold">Testimonials</h1>
                        <p className="text-xs text-gray-600">
                            {pendingCount > 0 ? <span className="text-yellow-400">{pendingCount} pending</span> : <span className="text-green-400">All reviewed ✓</span>}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchTestimonials}
                    className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full sm:rounded-lg text-sm transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline text-gray-400">Refresh</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['PENDING', 'APPROVED', 'ALL'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s === 'ALL' ? '' : s)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${(s === 'ALL' && !statusFilter) || statusFilter === s
                            ? 'bg-[#39d353] text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {s}
                        {s === 'PENDING' && pendingCount > 0 && (
                            <span className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full ${statusFilter === 'PENDING' ? 'bg-black/20' : 'bg-yellow-500 text-black'}`}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {testimonials.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl py-12 text-center">
                        <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">{statusFilter === 'PENDING' ? 'No pending reviews' : 'No testimonials'}</p>
                    </div>
                ) : (
                    testimonials.map((t) => (
                        <div key={t.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="p-4">
                                {/* User */}
                                <div className="flex items-start gap-3 mb-3">
                                    <img
                                        src={t.userAvatar || `https://ui-avatars.com/api/?name=${t.userName}&background=1a1a2e&color=fff&size=40`}
                                        alt=""
                                        className="w-9 h-9 rounded-full ring-2 ring-white/10 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{t.userName}</span>
                                            {t.githubUsername && (
                                                <a href={`https://github.com/${t.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] text-xs hover:underline">
                                                    @{t.githubUsername}
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatTimeAgo(t.createdAt)}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {t.status}
                                    </span>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-3.5 h-3.5 ${star <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                                    ))}
                                </div>

                                {/* Content */}
                                {editingId === t.id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#39d353]/30"
                                            rows={3}
                                            maxLength={280}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-gray-600">{editContent.length}/280</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingId(null); setEditContent('') }} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(t.id, editContent)}
                                                    disabled={actionLoading === t.id}
                                                    className="px-3 py-1.5 text-xs bg-[#39d353] text-black font-semibold rounded-lg hover:bg-[#45e05f] disabled:opacity-50"
                                                >
                                                    {actionLoading === t.id ? 'Saving...' : 'Save & Approve'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className="text-gray-200 text-sm leading-relaxed">&quot;{t.content}&quot;</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {t.status === 'PENDING' && editingId !== t.id && (
                                <div className="flex gap-2 px-4 pb-4">
                                    <button
                                        onClick={() => handleApprove(t.id)}
                                        disabled={actionLoading === t.id}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#39d353] text-black font-semibold text-sm rounded-lg hover:bg-[#45e05f] disabled:opacity-50 active:scale-[0.98] transition-all"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{actionLoading === t.id ? 'Approving...' : 'Approve'}</span>
                                    </button>
                                    <button
                                        onClick={() => { setEditingId(t.id); setEditContent(t.content) }}
                                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg active:scale-[0.98] transition-all"
                                    >
                                        <Edit3 className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => handleReject(t.id)}
                                        disabled={actionLoading === t.id}
                                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg disabled:opacity-50 active:scale-[0.98] transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
