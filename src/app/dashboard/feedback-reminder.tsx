'use client'

import { useState, useEffect } from 'react'
import { Rocket, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeedbackReminderProps {
    canShow: boolean
    onClose: () => void
}

export function FeedbackReminder({ canShow, onClose }: FeedbackReminderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Only proceed if we're allowed to show (e.g. onboarding finished)
        // and we have a pending intent
        if (canShow) {
            const hasIntent = localStorage.getItem('pendingFeedbackIntent')

            if (hasIntent) {
                // Wait 10 seconds as requested
                const timer = setTimeout(() => {
                    setIsVisible(true)
                }, 10000)

                return () => clearTimeout(timer)
            }
        }
    }, [canShow])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => {
            setIsVisible(false)
            onClose()
            // Clear intent on close so we don't nag again
            localStorage.removeItem('pendingFeedbackIntent')
        }, 300)
    }

    const handleAction = () => {
        // Redirect to homepage with a query param to open the modal
        // We'll clean up the intent now, or the homepage can check and clean it
        localStorage.removeItem('pendingFeedbackIntent')

        setIsExiting(true)
        setTimeout(() => {
            // Use window.location to ensure full reload if needed, 
            // but router.push is better for SPA feel. 
            // However, homepage modal state defaults to false. 
            // We need a way to tell homepage to open modal.
            // Let's use a URL param: `?openFeedback=true`
            router.push('/?openFeedback=true')
        }, 300)
    }

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
                {/* Background Texture from homepage style */}
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
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-[#f2cc60]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <span className="text-3xl">🎨</span>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-wide font-['Permanent_Marker']"
                        style={{ textShadow: '2px 2px 0 #000' }}>
                        WAIT A SEC!
                    </h2>

                    <p className="text-[#8b949e] mb-8 text-lg">
                        You forgot to leave your mark on the wall!
                    </p>

                    <button
                        onClick={handleAction}
                        className="w-full relative group overflow-hidden rounded-xl bg-[#f2cc60] py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>ADD YOUR WALL</span>
                            <Sparkles size={18} />
                        </span>

                        {/* Shimmer */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500" />
                    </button>

                    <p className="mt-4 text-xs text-[#8b949e] cursor-pointer hover:text-white transition-colors" onClick={handleClose}>
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
