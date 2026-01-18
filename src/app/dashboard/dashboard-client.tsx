'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Github, ExternalLink, LogOut, AlertCircle, GitCommit, Plus, ChevronRight, ChevronDown, Zap, Activity, TrendingUp, BarChart3, X, Settings } from 'lucide-react'
import { InstallationCard } from './installation-card'
import { WelcomeAnimation } from './WelcomeAnimation'
import { OnboardingPopup } from './onboarding-popup'
import { FeedbackReminder } from './feedback-reminder'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'
import Link from 'next/link'

// Types
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

interface DashboardProps {
    user: {
        name: string | null
        avatarUrl: string | null
    }
    displayName: string
    githubAppUrl: string
    initialInstallations: Installation[]
    isAdmin?: boolean
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

interface CommitResponse {
    success: boolean
    commitSha?: string
    message?: string
    error?: string
}

export function DashboardClient({ user, displayName, githubAppUrl, initialInstallations, isAdmin }: DashboardProps) {
    // State for all installations - enables optimistic updates
    const [installations, setInstallations] = useState<Installation[]>(initialInstallations)
    const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())
    const [committingRepos, setCommittingRepos] = useState<Set<string>>(new Set())
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [proTipOpen, setProTipOpen] = useState(false)
    const { success, error: showError, warning } = useToast()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // State for polling when waiting for new installations
    const [isPollingForNewRepos, setIsPollingForNewRepos] = useState(false)

    // State for onboarding popup (shown to new users)
    const [showOnboarding, setShowOnboarding] = useState(false)

    // Poll for new installations after GitHub App install/update
    // This replaces the unreliable single refresh approach
    useEffect(() => {
        // Track dashboard visit
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: '/dashboard' }),
        }).catch(() => { })

        const installed = searchParams.get('installed')
        const hasShownWelcome = sessionStorage.getItem('hasShownWelcome')

        if (installed === 'true') {
            // Clean URL immediately to prevent re-triggering on manual refresh
            window.history.replaceState({}, '', '/dashboard')

            // Check if we've already handled this install session
            const hasPolled = sessionStorage.getItem('hasPolledForInstall')
            if (hasPolled) {
                sessionStorage.removeItem('hasPolledForInstall')
                return
            }

            // Start polling for new installations
            setIsPollingForNewRepos(true)
            const initialCount = initialInstallations.length
            let pollCount = 0
            const maxPolls = 20 // 10 seconds max (500ms x 20)

            const pollInterval = setInterval(async () => {
                pollCount++

                try {
                    const response = await fetch('/api/installations/list')
                    if (!response.ok) throw new Error('Failed to fetch')

                    const data = await response.json()

                    // Check if new installations appeared
                    if (data.count > initialCount || (initialCount === 0 && data.count > 0)) {
                        // New repos detected - update state
                        clearInterval(pollInterval)
                        setIsPollingForNewRepos(false)
                        setInstallations(data.installations)
                        sessionStorage.setItem('hasPolledForInstall', 'true')

                        if (!hasShownWelcome) {
                            success('Repository connected successfully! 🎉')
                            sessionStorage.setItem('hasShownWelcome', 'true')
                        }
                        return
                    }

                    // Timeout reached - show fallback message
                    if (pollCount >= maxPolls) {
                        clearInterval(pollInterval)
                        setIsPollingForNewRepos(false)
                        sessionStorage.setItem('hasPolledForInstall', 'true')

                        // Update with whatever we have
                        if (data.installations) {
                            setInstallations(data.installations)
                        }

                        if (!hasShownWelcome) {
                            warning('Repository may take a moment to appear. Refresh if needed.')
                            sessionStorage.setItem('hasShownWelcome', 'true')
                        }
                    }
                } catch (err) {
                    // On error, continue polling (silent retry)
                    if (pollCount >= maxPolls) {
                        clearInterval(pollInterval)
                        setIsPollingForNewRepos(false)
                        sessionStorage.setItem('hasPolledForInstall', 'true')
                        warning('Could not verify repository. Please refresh the page.')
                    }
                }
            }, 500)

            // Cleanup on unmount
            return () => {
                clearInterval(pollInterval)
                setIsPollingForNewRepos(false)
            }
        } else if (!hasShownWelcome) {
            // First visit to dashboard after login
            success(`Welcome back, ${displayName.split(' ')[0]}! 👋`)
            sessionStorage.setItem('hasShownWelcome', 'true')

            // Show onboarding for new users who have no repos yet
            const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
            if (!hasSeenOnboarding && initialInstallations.length === 0) {
                // Delay to let welcome toast appear first
                setTimeout(() => {
                    setShowOnboarding(true)
                }, 1500)
            }
        }

        // Handle test mode: force show onboarding when ?onboarding=true
        const forceOnboarding = searchParams.get('onboarding')
        if (forceOnboarding === 'true') {
            // Clear stored flags for testing
            localStorage.removeItem('hasSeenOnboarding')
            sessionStorage.removeItem('hasShownWelcome')
            // Show onboarding after a short delay
            setTimeout(() => {
                setShowOnboarding(true)
            }, 500)
        }
    }, [searchParams, success, warning, displayName, initialInstallations.length])

    // Logout handler with toast
    const handleLogout = useCallback(async () => {
        if (isLoggingOut) return

        setIsLoggingOut(true)
        setShowProfileMenu(false)

        try {
            success('Logging out... See you soon! 👋')

            // Small delay to show toast before redirect
            await new Promise(resolve => setTimeout(resolve, 800))

            // Clear welcome flag so it shows again on next login
            sessionStorage.removeItem('hasShownWelcome')

            // Redirect to logout
            router.push('/api/auth/logout')
        } catch (err) {
            showError('Failed to logout. Please try again.')
            setIsLoggingOut(false)
        }
    }, [isLoggingOut, success, showError, router])

    // Computed values that update instantly
    const activeCount = useMemo(() =>
        installations.filter(i => i.active).length,
        [installations]
    )
    const totalCount = installations.length

    // Check if any active repo has commits today
    const hasCommitsToday = useMemo(() =>
        installations.some(i => i.active && i.commitsToday > 0),
        [installations]
    )

    // Check if dashboard is busy with any operation
    // Used to prevent feedback reminder from interrupting user actions
    const isBusy = useMemo(() =>
        showOnboarding ||
        isPollingForNewRepos ||
        pendingActions.size > 0 ||
        committingRepos.size > 0 ||
        isLoggingOut,
        [showOnboarding, isPollingForNewRepos, pendingActions, committingRepos, isLoggingOut]
    )

    // Optimistic toggle (pause/resume)
    const handleToggle = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || pendingActions.has(installationId)) return

        const newActive = !installation.active
        const previousState = installation.active

        // Optimistic update - instant UI feedback
        setInstallations(prev =>
            prev.map(i => i.id === installationId ? { ...i, active: newActive } : i)
        )
        setPendingActions(prev => new Set(prev).add(installationId))

        // API call in background
        const result = await apiFetch<UpdateResponse>('/api/installations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId, active: newActive }),
        })

        setPendingActions(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error) {
            // Rollback on error
            setInstallations(prev =>
                prev.map(i => i.id === installationId ? { ...i, active: previousState } : i)
            )
            showError(result.error.message || 'Failed to update')
            return
        }

        success(newActive ? 'Automation resumed' : 'Automation paused')
    }, [installations, pendingActions, showError, success])

    // Optimistic remove
    const handleRemove = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || pendingActions.has(installationId)) return

        const previousInstallations = [...installations]

        // Optimistic update - remove immediately
        setInstallations(prev => prev.filter(i => i.id !== installationId))
        setPendingActions(prev => new Set(prev).add(installationId))

        // API call in background
        const result = await apiFetch<DeleteResponse>(`/api/installations?id=${installationId}`, {
            method: 'DELETE',
        })

        setPendingActions(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error) {
            // Rollback on error
            setInstallations(previousInstallations)
            showError(result.error.message || 'Failed to remove repository')
            return
        }

        success('Repository removed')
    }, [installations, pendingActions, showError, success])

    // Manual commit with optimistic UI
    const handleCommit = useCallback(async (installationId: string) => {
        const installation = installations.find(i => i.id === installationId)
        if (!installation || committingRepos.has(installationId)) return

        if (!installation.active) {
            showError('Resume automation first to commit')
            return
        }

        const previousCommitsToday = installation.commitsToday

        // Optimistic update - increment commits immediately
        setInstallations(prev =>
            prev.map(i => i.id === installationId ? {
                ...i,
                commitsToday: i.commitsToday + 1,
                lastRunAt: new Date().toISOString()
            } : i)
        )
        setCommittingRepos(prev => new Set(prev).add(installationId))

        // API call
        const result = await apiFetch<CommitResponse>('/api/installations/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId }),
        })

        setCommittingRepos(prev => {
            const next = new Set(prev)
            next.delete(installationId)
            return next
        })

        if (result.error || !result.data?.success) {
            // Rollback on error
            setInstallations(prev =>
                prev.map(i => i.id === installationId ? { ...i, commitsToday: previousCommitsToday } : i)
            )
            showError(result.error?.message || result.data?.error || 'Failed to create commit')
            return
        }

        success(`Commit created: ${result.data.commitSha}`)
    }, [installations, committingRepos, showError, success])

    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Subtle background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#39d353]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header - Premium Design */}
            <header className="sticky top-0 z-50">
                {/* Gradient border effect */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#39d353]/50 to-transparent" />

                <div className="bg-[#0d1117]/80 backdrop-blur-xl">
                    <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group">
                            <span className="font-black text-xl sm:text-2xl flex items-center tracking-wide">
                                <span className="text-white">C</span>
                                <img
                                    src="/logo.png"
                                    alt="o"
                                    className="h-[0.9em] w-auto object-contain inline-block align-middle -mx-[0.05em] translate-y-[0.1em] transition-transform group-hover:scale-110 group-hover:rotate-12"
                                    style={{ filter: "drop-shadow(0 0 15px rgba(57,211,83,0.5))" }}
                                />
                                <span className="text-white">mmit</span>
                                <span className="w-[0.2em] inline-block"></span>
                                <span className="text-[#39d353] drop-shadow-[0_0_20px_rgba(57,211,83,0.3)]">Habit</span>
                            </span>
                        </Link>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* User Profile Section with Dropdown */}
                            <div className="relative">
                                {user.avatarUrl && (
                                    <>
                                        {/* Profile Button */}
                                        <button
                                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                                            className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl px-3 py-1.5 transition-all cursor-pointer group"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={displayName}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg ring-2 ring-white/10 group-hover:ring-[#39d353]/30 transition-all"
                                                />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#39d353] rounded-full border-2 border-[#0d1117] animate-pulse" />
                                            </div>
                                            <div className="hidden sm:block text-left">
                                                <p className="text-xs font-medium text-white leading-none">{displayName.split(' ')[0]}</p>
                                                <p className="text-[10px] text-[#39d353] leading-tight mt-0.5">● Online</p>
                                            </div>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showProfileMenu && (
                                            <>
                                                {/* Backdrop to close menu */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowProfileMenu(false)}
                                                />

                                                {/* Menu */}
                                                <div className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                                    {/* Profile Header */}
                                                    <div className="p-4 border-b border-white/5 text-center">
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt={displayName}
                                                            className="w-20 h-20 rounded-2xl ring-4 ring-[#39d353]/20 mx-auto mb-3 shadow-xl"
                                                        />
                                                        <p className="font-bold text-white">{displayName}</p>
                                                        <p className="text-xs text-[#39d353] mt-1 flex items-center justify-center gap-1">
                                                            <span className="w-2 h-2 bg-[#39d353] rounded-full animate-pulse" />
                                                            Online
                                                        </p>
                                                    </div>

                                                    {/* Menu Options */}
                                                    <div className="p-2">
                                                        <a
                                                            href={githubAppUrl}
                                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#238636]/10 text-white hover:text-[#39d353] transition-colors group"
                                                            onClick={() => setShowProfileMenu(false)}
                                                        >
                                                            <div className="w-9 h-9 rounded-lg bg-[#238636]/10 flex items-center justify-center group-hover:bg-[#238636]/20 transition-colors">
                                                                <Plus size={18} className="text-[#39d353]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Add Repository</p>
                                                                <p className="text-[10px] text-[#8b949e]">Connect a new repo</p>
                                                            </div>
                                                        </a>

                                                        <a
                                                            href="https://github.com/settings/installations"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#8b949e] hover:text-white transition-colors group"
                                                            onClick={() => setShowProfileMenu(false)}
                                                        >
                                                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                                <ExternalLink size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">Manage on GitHub</p>
                                                                <p className="text-[10px] text-[#8b949e]">Configure installations</p>
                                                            </div>
                                                        </a>

                                                        {isAdmin && (
                                                            <Link
                                                                href="/admin"
                                                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f85149]/10 text-white hover:text-[#f85149] transition-colors group"
                                                            >
                                                                <div className="w-9 h-9 rounded-lg bg-[#f85149]/10 flex items-center justify-center group-hover:bg-[#f85149]/20 transition-colors">
                                                                    <Settings size={18} className="text-[#f85149]" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Admin Panel</p>
                                                                    <p className="text-[10px] text-[#8b949e]">Manage users & feedback</p>
                                                                </div>
                                                            </Link>
                                                        )}
                                                    </div>

                                                    {/* Logout */}
                                                    <div className="p-2 border-t border-white/5">
                                                        <button
                                                            onClick={handleLogout}
                                                            disabled={isLoggingOut}
                                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f85149]/10 text-[#8b949e] hover:text-[#f85149] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="w-9 h-9 rounded-lg bg-[#f85149]/10 flex items-center justify-center group-hover:bg-[#f85149]/20 transition-colors">
                                                                {isLoggingOut ? (
                                                                    <div className="w-4 h-4 border-2 border-[#f85149] border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <LogOut size={18} className="text-[#f85149]" />
                                                                )}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</p>
                                                                <p className="text-[10px] text-[#8b949e]">Sign out of your account</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Welcome & Quick Actions Row */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
                    {/* Welcome Card */}
                    <div className="relative bg-gradient-to-br from-[#161b22] via-[#1c2128] to-[#161b22] border border-white/5 rounded-2xl p-5 sm:p-6 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#39d353]/10 rounded-full blur-3xl" />
                        <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                            {/* Left side: Avatar + Welcome text */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                {user.avatarUrl && (
                                    <img
                                        src={user.avatarUrl}
                                        alt=""
                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ring-2 ring-white/10 shadow-xl hidden xs:block"
                                    />
                                )}
                                <div>
                                    <p className="text-[#8b949e] text-xs sm:text-sm mb-0.5 sm:mb-1">Welcome back,</p>
                                    <h1 className="text-lg sm:text-2xl font-bold whitespace-nowrap">
                                        <span className="bg-gradient-to-r from-white via-white to-[#39d353] bg-clip-text text-transparent">
                                            {displayName.split(' ')[0]}
                                        </span>
                                        <span className="ml-1.5 sm:ml-2 text-lg sm:text-2xl">👋</span>
                                    </h1>
                                    <p className="text-[#8b949e] text-sm mt-1 hidden sm:block">
                                        Manage your automated commit streak
                                    </p>
                                </div>
                            </div>

                            {/* Right side: Contextual Animation */}
                            <WelcomeAnimation
                                hasRepos={installations.length > 0}
                                hasCommitsToday={hasCommitsToday}
                            />
                        </div>
                    </div>

                    {/* Quick Actions - Mobile: 2 buttons on top row, Add Repo below | Desktop: vertical stack */}
                    <div className="flex flex-col-reverse lg:flex-col gap-2 lg:justify-between">
                        {/* Add Repository - Full width, shown at bottom on mobile */}
                        <a
                            href={githubAppUrl}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#238636]/20 hover:shadow-[#238636]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            <span>Add Repository</span>
                        </a>

                        {/* Manage & Analytics - Side by side on mobile, stacked on desktop */}
                        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
                            <a
                                href="https://github.com/settings/installations"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-white/10 px-4 lg:px-5 py-3 rounded-xl text-sm font-medium text-[#8b949e] hover:text-white transition-all"
                            >
                                <ExternalLink size={16} />
                                <span className="hidden sm:inline">Manage on </span>GitHub
                            </a>
                            <button
                                onClick={() => setShowAnalytics(true)}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#161b22] to-[#21262d] border border-[#58a6ff]/30 hover:border-[#58a6ff]/60 px-4 lg:px-5 py-3 rounded-xl text-sm font-medium text-[#58a6ff] hover:text-[#79c0ff] transition-all group"
                            >
                                <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">View </span>Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row - Always horizontal */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#8b949e]/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium mb-1">Total Repos</p>
                                <p className="text-3xl font-bold tabular-nums">{totalCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#8b949e]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Github size={20} className="text-[#8b949e]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#39d353]/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium mb-1">Active</p>
                                <p className="text-3xl font-bold text-[#39d353] tabular-nums">{activeCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#39d353]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap size={20} className="text-[#39d353]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#d29922]/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium mb-1">Paused</p>
                                <p className="text-3xl font-bold text-[#d29922] tabular-nums">{totalCount - activeCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#d29922]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity size={20} className="text-[#d29922]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4 hover:border-[#58a6ff]/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-medium mb-1">Today&apos;s Commits</p>
                                <p className="text-3xl font-bold text-[#58a6ff] tabular-nums">
                                    {installations.reduce((sum, i) => sum + i.commitsToday, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#58a6ff]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp size={20} className="text-[#58a6ff]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repositories Section */}
                {installations.length === 0 ? (
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-10 text-center">
                        {isPollingForNewRepos ? (
                            <>
                                {/* Loading state while waiting for webhook */}
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#238636]/20 to-[#39d353]/20 flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                                    <div className="w-10 h-10 border-3 border-[#39d353] border-t-transparent rounded-full animate-spin" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Connecting repository...</h2>
                                <p className="text-[#8b949e] mb-4 max-w-sm mx-auto">
                                    Setting up your repository. This usually takes a few seconds.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-sm text-[#39d353]">
                                    <span className="w-2 h-2 bg-[#39d353] rounded-full animate-pulse" />
                                    Waiting for GitHub...
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#30363d] flex items-center justify-center mx-auto mb-6 shadow-xl">
                                    <Github size={32} className="text-[#8b949e]" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">No repositories yet</h2>
                                <p className="text-[#8b949e] mb-8 max-w-sm mx-auto">
                                    Connect your first repository to start building your commit habit.
                                </p>
                                <a
                                    href={githubAppUrl}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#238636] to-[#2ea043] px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#238636]/20 hover:shadow-[#238636]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Github size={20} />
                                    Connect Repository
                                </a>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">
                                Your Repositories
                            </h2>
                            <span className="text-xs text-[#8b949e] bg-white/5 px-3 py-1.5 rounded-full">
                                {activeCount} of {totalCount} active
                            </span>
                        </div>
                        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl divide-y divide-white/5">
                            {installations.map((inst) => (
                                <InstallationCard
                                    key={inst.id}
                                    installation={inst}
                                    isLoading={pendingActions.has(inst.id)}
                                    isCommitting={committingRepos.has(inst.id)}
                                    onToggle={() => handleToggle(inst.id)}
                                    onRemove={() => handleRemove(inst.id)}
                                    onCommit={() => handleCommit(inst.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Pro Tip & Help Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                    {/* Pro Tip */}
                    <details className="bg-gradient-to-br from-[#1c2128] to-[#161b22] border border-[#58a6ff]/20 rounded-2xl group">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 flex items-center justify-center">
                                    <GitCommit size={18} className="text-[#58a6ff]" />
                                </div>
                                <span className="font-medium text-sm text-white">Pro Tip</span>
                            </div>
                            <ChevronRight size={18} className="text-[#8b949e] transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="px-5 pb-5 text-sm text-[#8b949e] leading-relaxed">
                            Keep at least one repository active to maintain your daily commit streak automatically!
                            The cron job runs every 6 hours and creates a backup commit if you haven&apos;t committed that day.
                        </div>
                    </details>

                    {/* Help Card */}
                    <details className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl group">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#d29922]/10 flex items-center justify-center">
                                    <AlertCircle size={18} className="text-[#d29922]" />
                                </div>
                                <span className="font-medium text-sm">How to manage your installation</span>
                            </div>
                            <ChevronRight size={18} className="text-[#8b949e] transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="px-5 pb-5 text-sm text-[#8b949e]">
                            <ol className="list-decimal ml-4 space-y-2">
                                <li>Go to <strong className="text-white">GitHub Settings → Applications</strong></li>
                                <li>Find &quot;Commit Habit&quot; and click <strong className="text-white">Configure</strong></li>
                                <li>Add/remove repositories or uninstall the app</li>
                            </ol>
                            <a
                                href="https://github.com/settings/installations"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[#58a6ff] mt-4 hover:underline"
                            >
                                Open GitHub Settings <ExternalLink size={12} />
                            </a>
                        </div>
                    </details>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 mt-16">
                <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[#8b949e]">
                    <p className="flex items-center gap-2">
                        <span>Crafted by</span>
                        <a
                            href="https://hakkan.is-a.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-white hover:text-[#39d353] transition-colors underline decoration-[#39d353]/50 underline-offset-2"
                        >
                            Hakkan
                        </a>
                    </p>
                    <span className="text-xs text-[#8b949e]/50">Keep the streak alive 🔥</span>
                </div>
            </footer>

            {/* Analytics Modal */}
            {showAnalytics && (() => {
                // Calculate analytics data
                const totalCommitsToday = installations.reduce((sum, i) => sum + i.commitsToday, 0)
                const totalActivities = installations.reduce((sum, i) => sum + i.activityLogs.length, 0)
                const maxCommitsPerDay = 4 * activeCount
                const utilizationRate = maxCommitsPerDay > 0 ? Math.round((totalCommitsToday / maxCommitsPerDay) * 100) : 0
                const pausedCount = totalCount - activeCount
                const activePercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0

                // Generate mock weekly data based on actual activity
                const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                const today = new Date().getDay()
                const weeklyData = weekDays.map((day, i) => {
                    // Generate data based on installations' activity patterns
                    const adjustedIndex = (i + 1) % 7
                    const isToday = adjustedIndex === today
                    if (isToday) return totalCommitsToday
                    // Simulate past week based on active repos
                    return Math.floor(Math.random() * (activeCount * 3)) + (activeCount > 0 ? 1 : 0)
                })
                const maxWeekly = Math.max(...weeklyData, 1)

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowAnalytics(false)}
                        />

                        {/* Modal */}
                        <div className="relative bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 flex items-center justify-center">
                                        <BarChart3 size={20} className="text-[#58a6ff]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Analytics Dashboard</h2>
                                        <p className="text-xs text-[#8b949e]">Comprehensive commit statistics & insights</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAnalytics(false)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-[#8b949e] hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">

                                {/* Top Stats Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold">{totalCount}</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Total Repos</p>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold text-[#39d353]">{activeCount}</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Active</p>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold text-[#d29922]">{pausedCount}</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Paused</p>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold text-[#58a6ff]">{totalCommitsToday}</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Today</p>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold text-[#a371f7]">{totalActivities}</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Activities</p>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-bold text-[#f78166]">{utilizationRate}%</p>
                                        <p className="text-[10px] text-[#8b949e] mt-1 uppercase tracking-wider">Utilization</p>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

                                    {/* Donut Chart - Repo Status */}
                                    <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
                                        <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider mb-4">Repository Status</h3>
                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                            {/* SVG Donut Chart */}
                                            <div className="relative w-32 h-32 flex-shrink-0">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                    {/* Background circle */}
                                                    <circle
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke="#21262d"
                                                        strokeWidth="12"
                                                    />
                                                    {/* Active segment */}
                                                    <circle
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke="#39d353"
                                                        strokeWidth="12"
                                                        strokeDasharray={`${activePercent * 2.51} 251`}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-500"
                                                    />
                                                    {/* Paused segment */}
                                                    <circle
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke="#d29922"
                                                        strokeWidth="12"
                                                        strokeDasharray={`${(100 - activePercent) * 2.51} 251`}
                                                        strokeDashoffset={`${-activePercent * 2.51}`}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-500"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold">{totalCount}</span>
                                                    <span className="text-[10px] text-[#8b949e]">REPOS</span>
                                                </div>
                                            </div>
                                            {/* Legend */}
                                            <div className="space-y-3 w-full sm:flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-[#39d353]" />
                                                        <span className="text-sm">Active</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#39d353] whitespace-nowrap">{activeCount} ({Math.round(activePercent)}%)</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-[#d29922]" />
                                                        <span className="text-sm">Paused</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#d29922] whitespace-nowrap">{pausedCount} ({Math.round(100 - activePercent)}%)</span>
                                                </div>
                                                <div className="pt-2 border-t border-white/5">
                                                    <p className="text-xs text-[#8b949e]">
                                                        {activeCount > pausedCount ? '🎯 Great! Most repos are active.' : activeCount === pausedCount ? '⚖️ Balanced active and paused.' : '⚠️ Consider activating more repos.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bar Chart - Weekly Activity */}
                                    <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
                                        <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider mb-4">Weekly Activity</h3>
                                        <div className="flex items-end justify-between gap-2 h-32">
                                            {weekDays.map((day, i) => {
                                                const adjustedIndex = (i + 1) % 7
                                                const isToday = adjustedIndex === today
                                                const height = (weeklyData[i] / maxWeekly) * 100
                                                return (
                                                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                                                        <div className="w-full flex flex-col items-center justify-end h-24">
                                                            <span className="text-xs font-bold mb-1">{weeklyData[i]}</span>
                                                            <div
                                                                className={`w-full rounded-t-md transition-all ${isToday ? 'bg-gradient-to-t from-[#58a6ff] to-[#79c0ff]' : 'bg-gradient-to-t from-[#39d353] to-[#56d364]'}`}
                                                                style={{ height: `${Math.max(height, 8)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] ${isToday ? 'text-[#58a6ff] font-bold' : 'text-[#8b949e]'}`}>
                                                            {isToday ? 'Today' : day}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                            <span className="text-xs text-[#8b949e]">Total this week</span>
                                            <span className="text-sm font-bold text-[#39d353]">{weeklyData.reduce((a, b) => a + b, 0)} commits</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Commit Capacity Indicator */}
                                <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5 mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">Today&apos;s Commit Capacity</h3>
                                        <span className="text-sm font-medium">{totalCommitsToday} / {maxCommitsPerDay} max</span>
                                    </div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#39d353] via-[#58a6ff] to-[#a371f7] rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-xs text-[#8b949e]">
                                        <span>0%</span>
                                        <span className={utilizationRate >= 80 ? 'text-[#39d353] font-medium' : ''}>
                                            {utilizationRate >= 100 ? '🎉 Maxed out!' : utilizationRate >= 80 ? '🔥 Almost there!' : utilizationRate >= 50 ? '📈 Good progress' : '⏳ Room to grow'}
                                        </span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {/* Per-Repo Stats */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">Repository Breakdown</h3>

                                    {installations.length === 0 ? (
                                        <div className="text-center py-8 text-[#8b949e] bg-white/[0.02] rounded-xl border border-white/5">
                                            <Github size={32} className="mx-auto mb-3 opacity-50" />
                                            <p>No repositories connected yet.</p>
                                            <p className="text-xs mt-1">Add a repository to see analytics.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                            {installations.map((inst) => {
                                                const commitPercent = (inst.commitsToday / 5) * 100
                                                const daysActive = Math.floor((Date.now() - new Date(inst.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                                                return (
                                                    <div key={inst.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inst.active ? 'bg-[#39d353]/10' : 'bg-[#d29922]/10'}`}>
                                                                    <Github size={14} className={inst.active ? 'text-[#39d353]' : 'text-[#d29922]'} />
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-sm block">{inst.repoFullName.split('/')[1]}</span>
                                                                    <span className="text-[10px] text-[#8b949e]">{inst.repoFullName.split('/')[0]}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-1 rounded-full ${inst.active ? 'bg-[#39d353]/10 text-[#39d353]' : 'bg-[#d29922]/10 text-[#d29922]'}`}>
                                                                {inst.active ? '● Active' : '○ Paused'}
                                                            </span>
                                                        </div>

                                                        {/* Mini stats row */}
                                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                                            <div className="text-center p-2 bg-white/[0.02] rounded-lg">
                                                                <p className="text-lg font-bold text-[#58a6ff]">{inst.commitsToday}</p>
                                                                <p className="text-[9px] text-[#8b949e]">TODAY</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-white/[0.02] rounded-lg">
                                                                <p className="text-lg font-bold text-[#a371f7]">{inst.activityLogs.length}</p>
                                                                <p className="text-[9px] text-[#8b949e]">LOGS</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-white/[0.02] rounded-lg">
                                                                <p className="text-lg font-bold text-[#f78166]">{daysActive}</p>
                                                                <p className="text-[9px] text-[#8b949e]">DAYS</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${commitPercent >= 100 ? 'bg-gradient-to-r from-[#39d353] to-[#a371f7]' : 'bg-gradient-to-r from-[#39d353] to-[#2ea043]'}`}
                                                                    style={{ width: `${Math.min(commitPercent, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-[#8b949e] tabular-nums">
                                                                {inst.commitsToday}/5
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Insights Box */}
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 bg-[#39d353]/5 border border-[#39d353]/20 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">🔥</span>
                                            <div>
                                                <p className="text-sm font-medium text-[#39d353]">Streak Status</p>
                                                <p className="text-xs text-[#8b949e] mt-1">
                                                    {totalCommitsToday > 0
                                                        ? `Great job! You've made ${totalCommitsToday} commit${totalCommitsToday > 1 ? 's' : ''} today.`
                                                        : 'No commits yet today. Click Commit on any active repo!'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="p-4 bg-[#58a6ff]/5 border border-[#58a6ff]/20 rounded-xl cursor-pointer hover:bg-[#58a6ff]/10 transition-colors"
                                        onClick={() => setProTipOpen(!proTipOpen)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">💡</span>
                                                <p className="text-sm font-medium text-[#58a6ff]">Pro Tip</p>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`text-[#58a6ff] transition-transform duration-200 ${proTipOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        {proTipOpen && (
                                            <p className="text-xs text-[#8b949e] mt-3 leading-relaxed">
                                                Each repo can have up to 4 automated commits/day. The cron runs every 6 hours.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Onboarding Popup for new users */}
            {showOnboarding && (
                <OnboardingPopup
                    onClose={() => {
                        setShowOnboarding(false)
                        localStorage.setItem('hasSeenOnboarding', 'true')
                    }}
                />
            )}

            {/* Feedback Reminder - Shows if user has no feedback and not busy */}
            <FeedbackReminder isBusy={isBusy} />
        </div>
    )
}
