'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, User, ArrowRight, Sparkles } from 'lucide-react'

// Mock testimonials data (will be replaced with API data in Phase 2)
const MOCK_TESTIMONIALS = [
    {
        id: '1',
        userName: 'Alex Chen',
        avatarUrl: null,
        content: "Commit Habit saved my streak multiple times! Love how it just works in the background without any hassle.",
        rating: 5,
    },
    {
        id: '2',
        userName: 'Sarah Miller',
        avatarUrl: null,
        content: "Perfect for developers who code daily but sometimes forget to commit. Simple, effective, and secure.",
        rating: 5,
    },
    {
        id: '3',
        userName: 'Dev Kumar',
        avatarUrl: null,
        content: "I was skeptical at first, but this actually works great. My GitHub graph has never looked better!",
        rating: 4,
    },
    {
        id: '4',
        userName: 'Emma Wilson',
        avatarUrl: null,
        content: "The fact that it's open source and uses official GitHub App integration made me trust it. Highly recommend!",
        rating: 5,
    },
    {
        id: '5',
        userName: 'James Park',
        avatarUrl: null,
        content: "Been using it for a month now. Zero issues, my streak is protected, and I can focus on actual coding.",
        rating: 5,
    },
    {
        id: '6',
        userName: 'Lisa Zhang',
        avatarUrl: null,
        content: "Finally, a streak keeper that doesn't require personal access tokens. This is how it should be done!",
        rating: 5,
    },
]

interface TestimonialCardProps {
    userName: string
    avatarUrl: string | null
    content: string
    rating: number
    index: number
}

function TestimonialCard({ userName, avatarUrl, content, rating, index }: TestimonialCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, borderColor: 'rgba(88, 166, 255, 0.3)' }}
            className="group relative p-6 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#58a6ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                {/* Header: Avatar + Name + Rating */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#238636] to-[#39d353] flex items-center justify-center text-white font-bold text-sm">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            userName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{userName}</p>
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    className={i < rating ? 'text-[#d29922] fill-[#d29922]' : 'text-[#30363d]'}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Testimonial content */}
                <p className="text-[#8b949e] text-sm leading-relaxed">
                    "{content}"
                </p>
            </div>
        </motion.div>
    )
}

export function TestimonialsSection() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasRepos, setHasRepos] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    // Check user auth status and repos
    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                // Check if logged in
                const authRes = await fetch('/api/auth/me')
                if (authRes.ok) {
                    const authData = await authRes.json()
                    if (authData.user) {
                        setIsLoggedIn(true)

                        // Check if user has repos
                        const installRes = await fetch('/api/installations')
                        if (installRes.ok) {
                            const installData = await installRes.json()
                            setHasRepos(installData.installations?.length > 0)
                        }
                    }
                }
            } catch {
                // Silently fail - user is not logged in
            } finally {
                setIsChecking(false)
            }
        }
        checkUserStatus()
    }, [])

    const getButtonState = () => {
        if (isChecking) {
            return { text: 'Loading...', disabled: true, subtext: null }
        }
        if (!isLoggedIn) {
            return {
                text: 'Add Your Feedback',
                disabled: true,
                subtext: 'Use Commit Habit first, then share your feedback!'
            }
        }
        if (!hasRepos) {
            return {
                text: 'Add Your Feedback',
                disabled: true,
                subtext: 'Connect a repo first to leave feedback'
            }
        }
        return {
            text: 'Add Your Feedback',
            disabled: true, // Will be enabled in Phase 2
            subtext: 'Coming soon!'
        }
    }

    const buttonState = getButtonState()

    return (
        <section className="relative py-16 lg:py-24 overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#58a6ff]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-4 z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-[#58a6ff] text-xs font-mono mb-6 backdrop-blur-sm">
                        <MessageSquare size={12} />
                        Community Feedback
                    </span>
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
                        What Developers <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">Say</span>
                    </h2>
                    <p className="text-[#8b949e] max-w-xl mx-auto text-lg">
                        Real feedback from developers using Commit Habit to protect their streaks.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {MOCK_TESTIMONIALS.map((testimonial, index) => (
                        <TestimonialCard
                            key={testimonial.id}
                            userName={testimonial.userName}
                            avatarUrl={testimonial.avatarUrl}
                            content={testimonial.content}
                            rating={testimonial.rating}
                            index={index}
                        />
                    ))}
                </div>

                {/* Add Feedback CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="inline-flex flex-col items-center gap-3">
                        <button
                            disabled={buttonState.disabled}
                            className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${buttonState.disabled
                                    ? 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#238636] to-[#2ea043] text-white hover:shadow-[0_0_30px_rgba(57,211,83,0.3)] hover:scale-105'
                                }`}
                        >
                            <Sparkles size={18} className={buttonState.disabled ? 'text-[#484f58]' : 'text-white'} />
                            <span>{buttonState.text}</span>
                            {!buttonState.disabled && <ArrowRight size={18} />}
                        </button>
                        {buttonState.subtext && (
                            <p className="text-xs text-[#8b949e]">
                                {buttonState.subtext}
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
