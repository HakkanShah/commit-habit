'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Star, MessageSquare, ArrowRight, Sparkles, Quote } from 'lucide-react'

// Mock testimonials data (will be replaced with API data in Phase 2)
const MOCK_TESTIMONIALS = [
    {
        id: '1',
        userName: 'Alex Chen',
        role: 'Full Stack Developer',
        avatarUrl: null,
        content: "Commit Habit saved my streak multiple times! Love how it just works in the background without any hassle.",
        rating: 5,
    },
    {
        id: '2',
        userName: 'Sarah Miller',
        role: 'Frontend Engineer',
        avatarUrl: null,
        content: "Perfect for developers who code daily but sometimes forget to commit. Simple, effective, and secure.",
        rating: 5,
    },
    {
        id: '3',
        userName: 'Dev Kumar',
        role: 'Software Engineer',
        avatarUrl: null,
        content: "I was skeptical at first, but this actually works great. My GitHub graph has never looked better!",
        rating: 4,
    },
    {
        id: '4',
        userName: 'Emma Wilson',
        role: 'DevOps Engineer',
        avatarUrl: null,
        content: "The fact that it's open source and uses official GitHub App integration made me trust it. Highly recommend!",
        rating: 5,
    },
    {
        id: '5',
        userName: 'James Park',
        role: 'Backend Developer',
        avatarUrl: null,
        content: "Been using it for a month now. Zero issues, my streak is protected, and I can focus on actual coding.",
        rating: 5,
    },
    {
        id: '6',
        userName: 'Lisa Zhang',
        role: 'Mobile Developer',
        avatarUrl: null,
        content: "Finally, a streak keeper that doesn't require personal access tokens. This is how it should be done!",
        rating: 5,
    },
    {
        id: '7',
        userName: 'Marcus Johnson',
        role: 'Tech Lead',
        avatarUrl: null,
        content: "Recommended this to my entire team. We're all using it now and our contribution graphs look amazing!",
        rating: 5,
    },
    {
        id: '8',
        userName: 'Priya Sharma',
        role: 'Open Source Contributor',
        avatarUrl: null,
        content: "As someone who contributes to multiple repos, this is a lifesaver. My streak stays green effortlessly.",
        rating: 5,
    },
]

interface TestimonialCardProps {
    userName: string
    role: string
    avatarUrl: string | null
    content: string
    rating: number
}

function TestimonialCard({ userName, role, avatarUrl, content, rating }: TestimonialCardProps) {
    // Generate a consistent gradient based on username
    const gradients = [
        'from-[#238636] to-[#39d353]',
        'from-[#58a6ff] to-[#a371f7]',
        'from-[#d29922] to-[#f0b800]',
        'from-[#f778ba] to-[#ff6b6b]',
        'from-[#79c0ff] to-[#58a6ff]',
    ]
    const gradientIndex = userName.charCodeAt(0) % gradients.length

    return (
        <div className="group relative w-[260px] sm:w-[300px] flex-shrink-0 p-4 sm:p-5 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-[#58a6ff]/40 hover:shadow-[0_0_30px_rgba(88,166,255,0.15)] hover:-translate-y-1">
            {/* Quote icon background */}
            <Quote className="absolute top-3 right-3 w-8 h-8 text-[#21262d]/50 transform rotate-180" />

            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#58a6ff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            className={`transition-all duration-300 ${i < rating
                                ? 'text-[#d29922] fill-[#d29922] group-hover:scale-110'
                                : 'text-[#30363d]'
                                }`}
                            style={{ transitionDelay: `${i * 50}ms` }}
                        />
                    ))}
                </div>

                {/* Testimonial content */}
                <p className="text-[#c9d1d9] text-xs sm:text-sm leading-relaxed mb-4 min-h-[60px]">
                    "{content}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            userName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">{userName}</p>
                        <p className="text-[#8b949e] text-xs">{role}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Marquee component for infinite scrolling
function Marquee({ children, direction = 'left', speed = 30, mobileSpeed = 15 }: { children: React.ReactNode, direction?: 'left' | 'right', speed?: number, mobileSpeed?: number }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const duration = isMobile ? mobileSpeed : speed

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            <motion.div
                className="flex gap-4 sm:gap-6"
                animate={{
                    x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
                }}
                transition={{
                    x: {
                        duration: duration,
                        repeat: Infinity,
                        ease: 'linear',
                    },
                }}
                style={{
                    animationPlayState: isPaused ? 'paused' : 'running',
                }}
            >
                {children}
                {children}
            </motion.div>
        </div>
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
                const authRes = await fetch('/api/auth/me')
                if (authRes.ok) {
                    const authData = await authRes.json()
                    if (authData.user) {
                        setIsLoggedIn(true)
                        const installRes = await fetch('/api/installations')
                        if (installRes.ok) {
                            const installData = await installRes.json()
                            setHasRepos(installData.installations?.length > 0)
                        }
                    }
                }
            } catch {
                // Silently fail
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
            disabled: true,
            subtext: 'Coming soon!'
        }
    }

    const buttonState = getButtonState()

    // Split testimonials into two rows
    const row1 = MOCK_TESTIMONIALS.slice(0, 4)
    const row2 = MOCK_TESTIMONIALS.slice(4, 8)

    return (
        <section className="relative py-16 lg:py-24 overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#58a6ff]/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#a371f7]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Section Header */}
            <div className="relative max-w-6xl mx-auto px-4 z-10 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-[#58a6ff] text-xs font-mono mb-6 backdrop-blur-sm">
                        <MessageSquare size={12} />
                        Community Feedback
                    </span>
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
                        What Developers <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">Say</span>
                    </h2>
                    <p className="text-[#8b949e] max-w-xl mx-auto text-lg">
                        Join hundreds of developers who trust Commit Habit to protect their GitHub streaks.
                    </p>
                </motion.div>
            </div>

            {/* Testimonials Marquee - Row 1 */}
            <div className="relative max-w-6xl mx-auto px-4 mb-6 overflow-hidden">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#0d1117] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#0d1117] to-transparent z-10 pointer-events-none" />

                <Marquee direction="left" speed={35} mobileSpeed={18}>
                    {row1.map((testimonial) => (
                        <TestimonialCard
                            key={testimonial.id}
                            userName={testimonial.userName}
                            role={testimonial.role}
                            avatarUrl={testimonial.avatarUrl}
                            content={testimonial.content}
                            rating={testimonial.rating}
                        />
                    ))}
                </Marquee>
            </div>

            {/* Testimonials Marquee - Row 2 (opposite direction) - Hidden on mobile */}
            <div className="relative max-w-6xl mx-auto px-4 mb-8 sm:mb-12 hidden sm:block overflow-hidden">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0d1117] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0d1117] to-transparent z-10 pointer-events-none" />

                <Marquee direction="right" speed={40} mobileSpeed={20}>
                    {row2.map((testimonial) => (
                        <TestimonialCard
                            key={testimonial.id}
                            userName={testimonial.userName}
                            role={testimonial.role}
                            avatarUrl={testimonial.avatarUrl}
                            content={testimonial.content}
                            rating={testimonial.rating}
                        />
                    ))}
                </Marquee>
            </div>

            {/* Add Feedback CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative max-w-6xl mx-auto px-4 z-10 text-center"
            >
                <div className="inline-flex flex-col items-center gap-3">
                    <button
                        disabled={buttonState.disabled}
                        className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${buttonState.disabled
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
        </section>
    )
}
