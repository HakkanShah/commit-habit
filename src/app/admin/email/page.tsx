'use client'

import { useEffect, useState, useMemo } from 'react'
import { Mail, Search, Users, Send, AlertCircle, CheckCircle, XCircle, Eye, X, RefreshCw, ChevronLeft } from 'lucide-react'
import { EmailSkeleton } from '../components/skeletons'

interface User {
    id: string
    name: string | null
    email: string | null
    avatarUrl: string | null
}

interface SendResult {
    userId: string
    email: string | null
    status: 'SENT' | 'FAILED' | 'SKIPPED_NO_EMAIL'
    error?: string
}

export default function AdminEmailPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // UI State
    const [activeTab, setActiveTab] = useState<'recipients' | 'compose'>('recipients')

    // Email composition
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    // States
    const [showPreview, setShowPreview] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [sending, setSending] = useState(false)
    const [results, setResults] = useState<SendResult[] | null>(null)

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/users?limit=500')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setUsers(data.users || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    // Filtered users
    const filteredUsers = useMemo(() => {
        if (!search) return users
        const s = search.toLowerCase()
        return users.filter(u =>
            u.name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
        )
    }, [users, search])

    // Users with emails
    const usersWithEmail = useMemo(() =>
        Array.from(selectedIds).filter(id => users.find(u => u.id === id)?.email),
        [selectedIds, users]
    )

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const selectAll = () => {
        const newSet = new Set(selectedIds)
        filteredUsers.forEach(u => newSet.add(u.id))
        setSelectedIds(newSet)
    }

    const deselectAll = () => setSelectedIds(new Set())

    const handleSend = async () => {
        if (confirmText !== 'CONFIRM') return

        setSending(true)
        setShowConfirm(false)
        setResults(null)

        try {
            const res = await fetch('/api/admin/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: Array.from(selectedIds),
                    subject,
                    body,
                    isHtml: true
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')

            setResults(data.results)
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Failed to send')
        } finally {
            setSending(false)
            setConfirmText('')
        }
    }

    const canSend = selectedIds.size > 0 && subject.trim() && body.trim() && usersWithEmail.length > 0

    if (loading) {
        return <EmailSkeleton />
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#39d353]/10 rounded-lg">
                        <Mail className="w-5 h-5 text-[#39d353]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Email Broadcast</h1>
                        <p className="text-xs text-gray-500 hidden sm:block">Send updates to your users</p>
                    </div>
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Mobile Tabs */}
            <div className="flex p-1 bg-white/5 rounded-lg sm:hidden">
                <button
                    onClick={() => setActiveTab('recipients')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'recipients' ? 'bg-[#39d353] text-black shadow-lg' : 'text-gray-400'
                        }`}
                >
                    Recipients ({selectedIds.size})
                </button>
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'compose' ? 'bg-[#39d353] text-black shadow-lg' : 'text-gray-400'
                        }`}
                >
                    Compose
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] sm:h-[600px]">
                {/* Left: User Selection */}
                <div className={`lg:col-span-4 bg-[#161b22] border border-white/5 rounded-2xl flex flex-col overflow-hidden ${activeTab === 'recipients' ? 'flex' : 'hidden lg:flex'
                    }`}>
                    {/* Search & Filter Header */}
                    <div className="p-4 border-b border-white/5 space-y-3 bg-[#0d1117]/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#39d353]/50 focus:ring-1 focus:ring-[#39d353]/20 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="flex-1 text-xs font-medium px-3 py-2 bg-[#39d353]/10 text-[#39d353] border border-[#39d353]/20 rounded-lg hover:bg-[#39d353]/20 transition-colors"
                            >
                                Select All ({filteredUsers.length})
                            </button>
                            <button
                                onClick={deselectAll}
                                className="flex-1 text-xs font-medium px-3 py-2 bg-white/5 text-gray-400 border border-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => toggleSelect(user.id)}
                                className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 transition-colors ${selectedIds.has(user.id) ? 'bg-[#39d353]/5' : 'hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${selectedIds.has(user.id)
                                    ? 'bg-[#39d353] border-[#39d353]'
                                    : 'border-white/20 group-hover:border-white/40'
                                    }`}>
                                    {selectedIds.has(user.id) && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                                </div>

                                <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden shrink-0">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500">
                                            {user.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${selectedIds.has(user.id) ? 'text-white' : 'text-gray-300'}`}>
                                        {user.name || 'Unknown'}
                                    </p>
                                    <p className={`text-xs truncate ${user.email ? 'text-gray-500' : 'text-red-400'}`}>
                                        {user.email || 'No email'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Footer selection summary */}
                    <div className="p-3 border-t border-white/5 bg-[#0d1117]/50 lg:hidden">
                        <button
                            onClick={() => setActiveTab('compose')}
                            className="w-full py-2.5 bg-[#39d353] text-black font-bold text-sm rounded-xl"
                        >
                            Continue ({selectedIds.size})
                        </button>
                    </div>
                </div>

                {/* Right: Compose Area */}
                <div className={`lg:col-span-8 bg-[#161b22] border border-white/5 rounded-2xl flex flex-col overflow-hidden ${activeTab === 'compose' ? 'flex' : 'hidden lg:flex'
                    }`}>
                    <div className="flex-1 flex flex-col p-5 sm:p-6 gap-4 overflow-y-auto custom-scrollbar">
                        {/* Mobile Back Button */}
                        <div className="flex items-center gap-2 mb-2 lg:hidden text-gray-400" onClick={() => setActiveTab('recipients')}>
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm">Back to recipients</span>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Subject line"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 text-xl font-bold focus:ring-0 focus:border-[#39d353] placeholder:text-gray-600 transition-colors"
                            />
                        </div>

                        <div className="flex-1 bg-[#0d1117]/50 rounded-xl border border-white/5 p-1 min-h-[50vh] sm:min-h-0 flex flex-col">
                            <textarea
                                placeholder="Write your message here... (HTML is supported)"
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                className="w-full h-full bg-transparent border-0 resize-none p-4 text-sm focus:ring-0 text-gray-300 placeholder:text-gray-700 font-mono leading-relaxed flex-1 custom-scrollbar"
                            />
                        </div>

                        {/* Validation Warnings */}
                        {selectedIds.size === 0 && (
                            <div className="flex items-center gap-2 text-gray-500 text-sm bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                <AlertCircle className="w-4 h-4" />
                                <span>Select recipients from the list to enable sending</span>
                            </div>
                        )}

                        {selectedIds.size > 0 && usersWithEmail.length < selectedIds.size && (
                            <div className="flex items-center gap-2 text-yellow-500 text-sm bg-yellow-500/10 px-4 py-3 rounded-xl border border-yellow-500/20">
                                <AlertCircle className="w-4 h-4" />
                                <span>{selectedIds.size - usersWithEmail.length} selected users have no email and will be skipped</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/5 bg-[#0d1117]/30 flex justify-between items-center gap-4">
                        <div className="text-sm text-gray-500 hidden sm:block">
                            <span className="text-white font-medium">{usersWithEmail.length}</span> recipients ready
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowPreview(true)}
                                disabled={!body.trim()}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!canSend || sending}
                                className="flex-1 sm:flex-none px-8 py-2.5 bg-[#39d353] hover:bg-[#2eaa42] text-black rounded-xl text-sm font-bold shadow-[0_0_20px_-5px_#39d353] hover:shadow-[0_0_25px_-5px_#39d353] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        <span>Send</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            {results && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl transform scale-100 transition-all">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Broadcast Complete</h3>
                            <p className="text-gray-400 text-sm">Your emails have been processed</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-green-500/5 rounded-xl p-3 text-center border border-green-500/10">
                                <p className="text-2xl font-bold text-green-500">{results.filter(r => r.status === 'SENT').length}</p>
                                <p className="text-xs text-green-500/70 font-medium uppercase tracking-wider mt-1">Sent</p>
                            </div>
                            <div className="bg-red-500/5 rounded-xl p-3 text-center border border-red-500/10">
                                <p className="text-2xl font-bold text-red-500">{results.filter(r => r.status === 'FAILED').length}</p>
                                <p className="text-xs text-red-500/70 font-medium uppercase tracking-wider mt-1">Failed</p>
                            </div>
                            <div className="bg-yellow-500/5 rounded-xl p-3 text-center border border-yellow-500/10">
                                <p className="text-2xl font-bold text-yellow-500">{results.filter(r => r.status === 'SKIPPED_NO_EMAIL').length}</p>
                                <p className="text-xs text-yellow-500/70 font-medium uppercase tracking-wider mt-1">Skipped</p>
                            </div>
                        </div>

                        <button
                            onClick={() => { setResults(null); setSelectedIds(new Set()); setSubject(''); setBody(''); setActiveTab('recipients') }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    {/* Close button - always visible */}
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-30"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Desktop: Phone simulation */}
                    <div className="hidden sm:flex flex-col items-center gap-4">
                        <p className="text-gray-400 text-sm">Mobile Preview</p>
                        <div className="bg-[#1a1a1a] border-[12px] border-[#2a2a2a] rounded-[3rem] w-[390px] h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-8 bg-[#2a2a2a] rounded-b-3xl z-20"></div>

                            {/* Screen Content */}
                            <div className="flex-1 bg-[#0d1117] overflow-hidden pt-8">
                                <iframe
                                    srcDoc={`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Custom scrollbar - apply to html for outer scroll */
        html, body {
            scrollbar-width: thin;
            scrollbar-color: #30363d #161b22;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar { 
            width: 8px; 
        }
        html::-webkit-scrollbar-track, body::-webkit-scrollbar-track { 
            background: #161b22; 
        }
        html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb { 
            background: linear-gradient(180deg, #484f58 0%, #30363d 100%); 
            border-radius: 4px; 
        }
        html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover { 
            background: linear-gradient(180deg, #6e7681 0%, #484f58 100%); 
        }
        
        img { max-width: 100%; height: auto; }
        * { box-sizing: border-box; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; overflow-y: auto; overflow-x: hidden;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 0; vertical-align: top;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #161b22; border-bottom: 1px solid #30363d;">
                    <tr>
                        <td style="padding: 20px 16px; text-align: center; border-bottom: 1px solid #30363d;">
                            <div style="font-size: 22px; font-weight: 900; color: white;">
                                C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 16px;">
                            <div style="color: #c9d1d9; font-size: 15px; line-height: 1.6; word-wrap: break-word;">
                                ${body || '<span style="color: #6b7280; font-style: italic;">(No content)</span>'}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 16px; text-align: center; background-color: #0d1117;">
                            <p style="color: #6b7280; font-size: 11px; margin: 0;">
                                © 2026 CommitHabit • <a href="#" style="color: #58a6ff; text-decoration: none;">commithabit.app</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                                    `}
                                    className="w-full h-full border-0"
                                    title="Email Preview"
                                />
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-20"></div>
                        </div>
                    </div>

                    {/* Mobile: Simple full preview (no phone frame) */}
                    <div className="sm:hidden w-full h-full flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h3 className="text-sm font-medium text-white">Email Preview</h3>
                        </div>
                        <div className="flex-1 bg-[#0d1117] overflow-auto">
                            <iframe
                                srcDoc={`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Custom scrollbar - apply to html for outer scroll */
        html, body {
            scrollbar-width: thin;
            scrollbar-color: #30363d #161b22;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar { 
            width: 6px; 
        }
        html::-webkit-scrollbar-track, body::-webkit-scrollbar-track { 
            background: #161b22; 
        }
        html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb { 
            background: linear-gradient(180deg, #484f58 0%, #30363d 100%); 
            border-radius: 3px; 
        }
        html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover { 
            background: linear-gradient(180deg, #6e7681 0%, #484f58 100%); 
        }
        
        img { max-width: 100%; height: auto; }
        * { box-sizing: border-box; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #161b22;">
        <tr>
            <td style="padding: 20px; text-align: center; border-bottom: 1px solid #30363d;">
                <div style="font-size: 24px; font-weight: 900; color: white;">
                    C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px 20px;">
                <div style="color: #c9d1d9; font-size: 16px; line-height: 1.6; word-wrap: break-word;">
                    ${body || '<span style="color: #6b7280; font-style: italic;">(No content)</span>'}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px 20px; text-align: center; background-color: #0d1117;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    © 2026 CommitHabit • <a href="#" style="color: #58a6ff; text-decoration: none;">commithabit.app</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
                                `}
                                className="w-full h-full border-0"
                                title="Email Preview"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                                <Send className="w-6 h-6 text-yellow-500 ml-1" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Ready to send?</h3>
                            <p className="text-sm text-gray-400">
                                You are sending this email to <span className="text-white font-bold">{usersWithEmail.length}</span> recipients.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
                                    placeholder='Type "CONFIRM"'
                                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-center font-bold tracking-widest text-sm focus:border-yellow-500/50 focus:outline-none transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={confirmText !== 'CONFIRM'}
                                className="w-full py-3 bg-[#39d353] hover:bg-[#2eaa42] text-black rounded-xl text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Send Broadcast
                            </button>

                            <button
                                onClick={() => { setShowConfirm(false); setConfirmText('') }}
                                className="w-full py-3 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
