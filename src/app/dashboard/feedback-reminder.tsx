'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeedbackReminderProps {
    /** True when dashboard is busy with operations (onboarding, repo actions, etc.) */
    isBusy: boolean
}

export function FeedbackReminder({ isBusy }: FeedbackReminderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [hasFeedback, setHasFeedback] = useState<boolean | null>(null) // null = loading
    const router = useRouter()

    // Check if user already has feedback on mount
    useEffect(() => {
        const checkFeedback = async () => {
            try {
                const res = await fetch('/api/feedback/me')
                if (res.ok) {
                    const data = await res.json()
                    setHasFeedback(data.hasFeedback)
                } else {
                    setHasFeedback(false) // Assume no feedback on error
                }
            } catch {
                setHasFeedback(false)
            }
        }
        checkFeedback()
    }, [])

    // Show reminder logic: wait for not busy, no feedback, once per session
    useEffect(() => {
        // Still loading feedback status
        if (hasFeedback === null) return

        // Already has feedback - never show
        if (hasFeedback) return

        // Dashboard is busy - wait
        if (isBusy) return

        // Already shown this session
        const alreadyShown = sessionStorage.getItem('feedbackReminderShown')
        if (alreadyShown) return

        // Also check if user dismissed it before (localStorage flag)
        // This provides a "don't show again today" experience
        const dismissedToday = localStorage.getItem('feedbackReminderDismissedAt')
        if (dismissedToday) {
            const dismissedTime = parseInt(dismissedToday, 10)
            const hoursSince = (Date.now() - dismissedTime) / (1000 * 60 * 60)
            // Don't show again within 12 hours of dismissal
            if (hoursSince < 12) return
        }

        // All conditions met - show after 15s delay
        const timer = setTimeout(() => {
            setIsVisible(true)
            sessionStorage.setItem('feedbackReminderShown', 'true')
        }, 15000)

        return () => clearTimeout(timer)
    }, [hasFeedback, isBusy])

    const handleClose = useCallback(() => {
        setIsExiting(true)
        // Record dismissal time to prevent nagging
        localStorage.setItem('feedbackReminderDismissedAt', Date.now().toString())

        setTimeout(() => {
            setIsVisible(false)
        }, 300)
    }, [])

    const handleAction = useCallback(() => {
        // Clear any dismissal tracking since they're taking action
        localStorage.removeItem('feedbackReminderDismissedAt')
        localStorage.removeItem('pendingFeedbackIntent')

        setIsExiting(true)
        setTimeout(() => {
            router.push('/?openFeedback=true')
        }, 300)
    }, [router])

    if (!isVisible) return null

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${!isExiting ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md bg-[#0d1117] border-2 border-[#f2cc60] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(242,204,96,0.2)] transform transition-all duration-300 ${!isExiting ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Background Texture */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url('/brick-wall.png')`,
                        backgroundSize: '150px',
                    }}
                />

                {/* Content */}
                <div className="relative p-8 text-center">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-[#f2cc60]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <span className="text-3xl">🎨</span>
                    </div>

                    <h2
                        className="text-3xl font-black text-white mb-2 tracking-wide font-['Permanent_Marker']"
                        style={{ textShadow: '2px 2px 0 #000' }}
                    >
                        LEAVE YOUR MARK!
                    </h2>

                    <p className="text-[#8b949e] mb-8 text-lg">
                        Share your experience and join our Wall of Love 🧱
                    </p>

                    <button
                        onClick={handleAction}
                        className="w-full relative group overflow-hidden rounded-xl bg-[#f2cc60] py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>ADD YOUR WALL</span>
                            <Sparkles size={18} />
                        </span>

                        {/* Shimmer */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500" />
                    </button>

                    <p
                        className="mt-4 text-xs text-[#8b949e] cursor-pointer hover:text-white transition-colors"
                        onClick={handleClose}
                    >
                        Maybe later
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
            `}</style>
        </div>
    )
}
