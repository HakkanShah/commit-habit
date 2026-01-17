'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Sparkles, Quote, Github, X, Loader2 } from 'lucide-react'
import { useToast } from './toast'

// Import Font (We'll load it via style tag for simplicity in this component)
// Google Font: Permanent Marker

const MOCK_TESTIMONIALS: Testimonial[] = [
    {
        id: '1',
        userName: 'Akshat Garg',

        githubUsername: 'Akshat7garg',
        content: "i think Commit Habit is a useful tool for new developers.",
        rating: 5,
    },
    {
        id: '9',
        userName: 'Janmejoy',

        githubUsername: 'janmej0y',
        content: "Clean, invisible, and efficient. Exactly how developer tools should be.",
        rating: 5,
    },
    {
        id: '2',
        userName: 'Suman Karmakar',

        githubUsername: 'SumanKarmakar467',
        content: "Perfect for developers who code daily but sometimes forget to push.",
        rating: 5,
    },
    {
        id: '3',
        userName: 'Dev Kumar',

        githubUsername: 'devkumar',
        content: "My GitHub graph has never looked better! Highly recommended.",
        rating: 4,
    },
    {
        id: '4',
        userName: 'Sourav Chowdhury',

        githubUsername: 'sourav81R',
        content: "Official GitHub App integration made me trust it. Great security!",
        rating: 5,
    },
    {
        id: '5',
        userName: 'Justin Pratik',

        githubUsername: 'pratikdas018',
        content: "Zero issues after a month. My streak is always protected.",
        rating: 4,
    },
    {
        id: '6',
        userName: 'Avisekh Giri',

        githubUsername: 'imavishek-coder',
        content: "No personal access tokens needed! Security is top notch.",
        rating: 5,
    },
    {
        id: '7',
        userName: 'Shankha Shubhra',

        githubUsername: 'Shankha-Shubhra',
        content: "Recommended this to my entire team. Everyone loves it!",
        rating: 5,
    },
    {
        id: '8',
        userName: 'Debjyoti Chowdhury',

        githubUsername: 'debjyoti',
        content: "The best tool for maintaining consistency. A must-have for every serious dev.",
        rating: 4,
    }
]

// Testimonial type for both mock and real data
interface Testimonial {
    id: string
    userName: string
    githubUsername: string
    content: string
    rating: number
}

// Paint drip SVG component for graffiti effect
function PaintDrip({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 40" className={className} fill="currentColor">
            <path d="M10 0 C10 0, 6 8, 6 15 C6 22, 10 28, 10 40 C10 28, 14 22, 14 15 C14 8, 10 0, 10 0 Z" />
        </svg>
    )
}

// Spray dots for authentic graffiti look
function SprayDots({ className }: { className?: string }) {
    return (
        <div className={`absolute ${className}`}>
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-current opacity-40"
                    style={{
                        left: `${(i * 13) % 30}px`,
                        top: `${(i * 17) % 20}px`,
                        transform: `scale(${0.5 + (i % 3) * 0.3})`
                    }}
                />
            ))}
        </div>
    )
}

function BrickCard({ testimonial, index, onClick }: { testimonial: Testimonial, index: number, onClick?: () => void }) {
    // Deterministic rotation for organic street art feel
    const randomRotate = ((index * 137) % 6 - 3); // -3 to 3 degrees (slightly less rotation)
    const randomScale = 0.98 + ((index * 79) % 4) / 100; // 0.98 to 1.02

    // Color palette for spray paint colors - vibrant street art colors
    const sprayColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1'];
    const primaryColor = sprayColors[index % sprayColors.length];
    const secondaryColor = sprayColors[(index + 3) % sprayColors.length];

    // Tape rotation variations
    const tapeRotations = [-15, 12, -8, 18, -12, 10, -20, 15];
    const tapeRotation = tapeRotations[index % tapeRotations.length];

    return (
        <div
            className="relative w-[340px] md:w-[380px] flex-shrink-0 mx-2 h-[240px] md:h-[260px] group cursor-pointer"
            style={{
                transform: `rotate(${randomRotate}deg) scale(${randomScale}) translateZ(0)`,
                willChange: 'transform',
                contain: 'layout style paint',
            }}
            onClick={onClick}
        >
            {/* === BRICK WALL BACKGROUND === */}
            <div
                className="absolute inset-0 rounded-lg overflow-hidden"
                style={{
                    backgroundImage: `url('/brick-wall.png')`,
                    backgroundSize: '150px',
                    backgroundPosition: 'center',
                }}
            >
                {/* Dark grunge overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60" />

                {/* Weathering/aging texture overlay */}
                <div
                    className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* === CONTENT CONTAINER - NEW LAYOUT === */}
            <div className="relative z-10 h-full p-4 flex flex-col">

                {/* === TOP ROW: AVATAR + NAME WITH PAINT SPLASH === */}
                <div className="flex items-start gap-5 mb-3">
                    {/* Avatar with tape */}
                    <div className="flex-shrink-0 relative">
                        {/* Masking tape */}
                        <div
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-gradient-to-b from-amber-100/90 to-amber-200/80 rounded-sm shadow-sm z-20"
                            style={{ transform: `translateX(-50%) rotate(${tapeRotation}deg)` }}
                        >
                            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
                        </div>

                        {/* Avatar image */}
                        <div
                            className="relative w-14 h-16 md:w-16 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300"
                            style={{
                                transform: `rotate(${randomRotate * 0.3}deg)`,
                                boxShadow: '3px 3px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            <img
                                src={`https://github.com/${testimonial.githubUsername}.png`}
                                alt={testimonial.userName}
                                width={64}
                                height={80}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover grayscale-[20%] contrast-110 group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]" />
                        </div>
                    </div>

                    {/* Name with white paint splash banner */}
                    <div className="flex-1 min-w-0 pt-1 flex flex-col items-start">
                        <div className="relative inline-block max-w-full">
                            {/* White paint splash background - more natural organic shape */}
                            <div
                                className="absolute -inset-x-2 -inset-y-1"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                                    transform: `rotate(${-randomRotate * 0.3}deg) skewX(${randomRotate * 0.2}deg)`,
                                    borderRadius: '4px 12px 6px 10px',
                                    boxShadow: '2px 3px 8px rgba(0,0,0,0.25), inset 0 0 8px rgba(255,255,255,0.5)',
                                }}
                            />
                            {/* Paint drip on the splash */}
                            <div
                                className="absolute -bottom-2 left-4 w-1.5 h-3 bg-white/80 rounded-b-full"
                                style={{ filter: 'blur(0.3px)' }}
                            />
                            <h3
                                className="relative font-['Permanent_Marker'] text-xl md:text-2xl leading-tight tracking-wide truncate px-1"
                                style={{
                                    color: primaryColor,
                                    textShadow: `
                                        2px 2px 0 rgba(0,0,0,0.3),
                                        -1px -1px 0 rgba(255,255,255,0.8)
                                    `,
                                    WebkitTextStroke: '0.3px rgba(0,0,0,0.2)',
                                }}
                            >
                                {testimonial.userName}
                            </h3>
                        </div>

                        {/* GitHub handle - more readable with background, left aligned */}
                        <a
                            href={`https://github.com/${testimonial.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-white/85 rounded hover:bg-white transition-colors"
                            style={{
                                boxShadow: '1px 1px 4px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Github size={11} className="text-[#24292f]" />
                            <span className="text-[11px] font-mono text-[#24292f] font-medium">
                                @{testimonial.githubUsername}
                            </span>
                        </a>
                    </div>
                </div>

                {/* === MIDDLE: FEEDBACK TEXT - BOLD AND PROMINENT === */}
                <div className="flex-1 flex items-center">
                    <div className="relative w-full">
                        {/* Subtle background for readability */}
                        <div className="absolute inset-0 -m-2 bg-black/30 rounded-md blur-sm" />
                        <p
                            className="relative font-['Permanent_Marker'] text-base md:text-lg leading-relaxed line-clamp-3 tracking-wide"
                            style={{
                                color: '#ffffff',
                                textShadow: `
                                    2px 2px 0 rgba(0,0,0,1),
                                    -1px -1px 0 rgba(0,0,0,0.8),
                                    1px -1px 0 rgba(0,0,0,0.8),
                                    -1px 1px 0 rgba(0,0,0,0.8),
                                    0 0 20px rgba(255,255,255,0.3)
                                `,
                                fontWeight: 500,
                            }}
                        >
                            "{testimonial.content}"
                        </p>
                    </div>
                </div>

                {/* === BOTTOM ROW: STAR RATING === */}
                <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={18}
                            className="transition-all duration-300"
                            style={{
                                color: i < testimonial.rating ? '#feca57' : 'rgba(255,255,255,0.3)',
                                fill: i < testimonial.rating ? '#feca57' : 'transparent',
                                filter: i < testimonial.rating
                                    ? 'drop-shadow(0 0 6px rgba(254,202,87,0.8)) drop-shadow(2px 2px 0 rgba(0,0,0,0.9))'
                                    : 'drop-shadow(1px 1px 0 rgba(0,0,0,0.5))',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* === DECORATIVE SPRAY DOTS === */}
            <div
                className="absolute top-3 right-3 w-2 h-2 rounded-full opacity-50"
                style={{ backgroundColor: primaryColor, filter: 'blur(1px)' }}
            />
            <div
                className="absolute bottom-4 left-6 w-1.5 h-1.5 rounded-full opacity-40"
                style={{ backgroundColor: secondaryColor, filter: 'blur(0.5px)' }}
            />

            {/* Hover border highlight */}
            <div
                className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-white/30 pointer-events-none"
                style={{ transition: 'border-color 0.15s ease-out' }}
            />
        </div>
    )
}

function CssMarquee({ items, direction = 'left', speed = '40s', className, onCardClick }: { items: Testimonial[], direction?: 'left' | 'right', speed?: string, className?: string, onCardClick?: (testimonial: Testimonial) => void }) {
    return (
        <div
            className={`flex overflow-hidden group/row ${className}`}
            style={{
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                contain: 'layout style',
            }}
        >
            <div
                className={`flex gap-0 w-max shrink-0 group-hover/row:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
                style={{
                    animationDuration: speed,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                }}
            >
                {[...items, ...items].map((testimonial, i) => (
                    <div key={`${testimonial.id}-${i}`} className="py-2">
                        <BrickCard
                            testimonial={testimonial}
                            index={i}
                            onClick={() => onCardClick?.(testimonial)}
                        />
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes marquee-left {
                    from { transform: translate3d(0, 0, 0); }
                    to { transform: translate3d(-50%, 0, 0); }
                }
                @keyframes marquee-right {
                    from { transform: translate3d(-50%, 0, 0); }
                    to { transform: translate3d(0, 0, 0); }
                }
                .animate-marquee-left {
                    animation: marquee-left linear infinite;
                }
                .animate-marquee-right {
                    animation: marquee-right linear infinite;
                }
            `}</style>
        </div>
    )
}

export function TestimonialsSection() {
    const { success, error } = useToast()

    // Testimonials from database
    const [testimonials, setTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [feedbackText, setFeedbackText] = useState('')
    const [rating, setRating] = useState(5)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [authError, setAuthError] = useState(false)

    // Existing feedback state
    const [hasExistingFeedback, setHasExistingFeedback] = useState(false)

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [user, setUser] = useState<{ login?: string; id?: string; name?: string } | null>(null)

    // Selected testimonial for popup
    const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)

    // Fetch testimonials on mount
    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch('/api/feedback')
                if (res.ok) {
                    const data = await res.json()
                    if (data.testimonials && data.testimonials.length > 0) {
                        setTestimonials([...data.testimonials, ...MOCK_TESTIMONIALS])
                    }
                }
            } catch {
                // Use mock data on error
            }
        }
        fetchTestimonials()
    }, [])

    // Check session and existing feedback on mount
    useEffect(() => {
        const checkSessionAndFeedback = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    if (data.user) {
                        setIsLoggedIn(true)
                        setUser(data.user)

                        // Check for existing feedback
                        const feedbackRes = await fetch('/api/feedback/me')
                        if (feedbackRes.ok) {
                            const feedbackData = await feedbackRes.json()
                            if (feedbackData.hasFeedback && feedbackData.feedback) {
                                setHasExistingFeedback(true)
                                setFeedbackText(feedbackData.feedback.content)
                                setRating(feedbackData.feedback.rating)
                            }
                        }
                    }
                }
            } catch {
                // User is not logged in
            } finally {
                setIsCheckingSession(false)
            }
        }
        checkSessionAndFeedback()
    }, [])

    // Handle submit
    const handleSubmit = async () => {
        if (!feedbackText.trim()) {
            error('Please write some feedback!')
            return
        }

        if (!isLoggedIn) {
            setAuthError(true)
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: feedbackText, rating })
            })

            if (res.ok) {
                const data = await res.json()
                success(hasExistingFeedback ? 'Feedback updated! 🎉' : 'Thanks for your feedback! 🎉')
                setIsModalOpen(false)
                setAuthError(false)
                setHasExistingFeedback(true) // Now they have feedback

                // Refresh testimonials to show the new one
                const testimonialsRes = await fetch('/api/feedback')
                if (testimonialsRes.ok) {
                    const testimonialsData = await testimonialsRes.json()
                    if (testimonialsData.testimonials && testimonialsData.testimonials.length > 0) {
                        setTestimonials([...testimonialsData.testimonials, ...MOCK_TESTIMONIALS])
                    }
                }
            } else {
                const data = await res.json()
                error(data.error || 'Failed to submit feedback')
            }
        } catch {
            error('Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="relative py-12 lg:py-24 overflow-hidden bg-[#0d1117]">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
            `}</style>

            {/* Feedback Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        {/* Backdrop with colored tint */}
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotateX: -10 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotateX: 10 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Static border */}
                            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#f2cc60]/50 via-[#ff6b6b]/50 to-[#a855f7]/50" />

                            {/* Outer glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#f2cc60]/30 via-[#ff6b6b]/30 to-[#a855f7]/30 rounded-3xl blur-2xl opacity-60 animate-pulse" />

                            {/* Main modal container */}
                            <div
                                className="relative rounded-2xl overflow-hidden"
                                style={{
                                    backgroundImage: `url('/brick-wall.png')`,
                                    backgroundSize: '200px',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

                                {/* Colorful ambient light spots */}
                                <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#f2cc60]/20 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-[#a855f7]/20 rounded-full blur-3xl" />

                                {/* Content container */}
                                <div className="relative p-8">

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-[#ff6b6b] border border-white/20 hover:border-[#ff6b6b] text-white/70 hover:text-white transition-all duration-300 cursor-pointer group"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>

                                    {/* Header Section */}
                                    <div className="text-center mb-8">

                                        {/* Title with spray paint effect */}
                                        <div className="relative inline-block">
                                            {/* Paint drips */}
                                            <div className="absolute -bottom-4 left-8 w-0.5 h-5 bg-gradient-to-b from-[#f2cc60] to-transparent rounded-b-full" />
                                            <div className="absolute -bottom-6 left-1/2 w-1 h-7 bg-gradient-to-b from-[#ff6b6b] to-transparent rounded-b-full" />
                                            <div className="absolute -bottom-3 right-12 w-0.5 h-4 bg-gradient-to-b from-[#a855f7] to-transparent rounded-b-full" />

                                            <h3
                                                className="text-3xl sm:text-4xl tracking-wider"
                                                style={{
                                                    color: '#f2cc60',
                                                    textShadow: '0 0 30px rgba(242,204,96,0.5), 3px 3px 0 #000, -1px -1px 0 #000',
                                                }}
                                            >
                                                {hasExistingFeedback ? 'MODIFY YOUR WALL' : 'SPRAY YOUR WALL'}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Auth Error Message */}
                                    {authError && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mb-6 p-4 bg-gradient-to-r from-[#f85149]/20 to-transparent border-l-4 border-[#f85149] rounded-r-xl"
                                        >
                                            <p className="text-white text-sm mb-3 font-sans">
                                                🔐 Connect with GitHub to leave your mark!
                                            </p>
                                            <a
                                                href="/api/auth/github"
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#24292f] text-sm rounded-full hover:bg-[#f2cc60] hover:text-black transition-all font-sans font-bold shadow-lg hover:shadow-[#f2cc60]/30"
                                            >
                                                <Github size={16} />
                                                Connect GitHub
                                            </a>
                                        </motion.div>
                                    )}

                                    {/* Star Rating Section */}
                                    <div className="mb-6">
                                        <p className="text-center text-white/50 text-sm font-sans mb-3">Rate your experience</p>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <motion.button
                                                    key={star}
                                                    onClick={() => setRating(star)}
                                                    whileHover={{ scale: 1.2, y: -3 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="cursor-pointer relative"
                                                >
                                                    {/* Star glow */}
                                                    {star <= rating && (
                                                        <div className="absolute inset-0 bg-[#feca57] rounded-full blur-md opacity-50" />
                                                    )}
                                                    <Star
                                                        size={36}
                                                        style={{
                                                            color: star <= rating ? '#feca57' : 'rgba(255,255,255,0.15)',
                                                            fill: star <= rating ? '#feca57' : 'transparent',
                                                            filter: star <= rating ? 'drop-shadow(0 0 10px rgba(254,202,87,0.8))' : 'none',
                                                            position: 'relative',
                                                        }}
                                                        strokeWidth={1.5}
                                                    />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Feedback Textarea with paint splash */}
                                    <div className="relative mb-6">
                                        {/* White paint splash background */}
                                        <div
                                            className="absolute -inset-1 bg-white/10 rounded-xl"
                                            style={{
                                                clipPath: 'polygon(0% 5%, 3% 0%, 10% 3%, 25% 0%, 40% 2%, 60% 0%, 75% 3%, 90% 0%, 97% 2%, 100% 5%, 100% 95%, 97% 100%, 85% 97%, 70% 100%, 50% 98%, 30% 100%, 15% 97%, 5% 100%, 0% 97%)',
                                            }}
                                        />
                                        <textarea
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Write your message on the wall..."
                                            maxLength={100}
                                            className="relative w-full h-28 p-4 bg-black/40 border-2 border-[#f2cc60]/30 rounded-xl text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-[#f2cc60] focus:shadow-[0_0_20px_rgba(242,204,96,0.3)] transition-all font-['Permanent_Marker'] text-base tracking-wide"
                                        />
                                        <p className="absolute bottom-2 right-3 text-xs text-white/30 font-sans">
                                            {feedbackText.length}/100
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <motion.button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative w-full py-4 rounded-xl overflow-hidden group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {/* Button background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#f2cc60] via-[#ff9f43] to-[#ff6b6b]" />

                                        {/* Shimmer */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                        {/* Button content */}
                                        <span className="relative flex items-center justify-center gap-3 text-black font-bold text-lg font-['Permanent_Marker'] tracking-wide">
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={22} className="animate-spin" />
                                                    {hasExistingFeedback ? 'UPDATING...' : 'SPRAYING...'}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-2xl">🎨</span>
                                                    {hasExistingFeedback ? 'UPDATE WALL' : 'SPRAY IT!'}
                                                </>
                                            )}
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Testimonial Popup Modal */}
            <AnimatePresence>
                {selectedTestimonial && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedTestimonial(null)}
                    >
                        {/* Blurred backdrop */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Glow effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#f2cc60]/20 via-[#ff6b6b]/20 to-[#a855f7]/20 rounded-3xl blur-2xl opacity-60" />

                            {/* Card container */}
                            <div
                                className="relative rounded-2xl overflow-hidden border border-white/20"
                                style={{
                                    backgroundImage: `url('/brick-wall.png')`,
                                    backgroundSize: '150px',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/80" />

                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedTestimonial(null)}
                                    className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-[#ff6b6b] border border-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                                >
                                    <X size={20} />
                                </button>

                                {/* Content */}
                                <div className="relative p-8 font-['Permanent_Marker']">
                                    {/* Avatar and name */}
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
                                                <img
                                                    src={`https://github.com/${selectedTestimonial.githubUsername}.png`}
                                                    alt={selectedTestimonial.userName}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h4
                                                className="text-2xl tracking-wide mb-1"
                                                style={{
                                                    color: '#f2cc60',
                                                    textShadow: '2px 2px 0 #000',
                                                }}
                                            >
                                                {selectedTestimonial.userName}
                                            </h4>
                                            <div className="flex items-center gap-2 text-white/60 text-sm font-sans">
                                                <Github size={14} />
                                                <span>@{selectedTestimonial.githubUsername}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex gap-1 mb-5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={24}
                                                style={{
                                                    color: star <= selectedTestimonial.rating ? '#feca57' : 'rgba(255,255,255,0.2)',
                                                    fill: star <= selectedTestimonial.rating ? '#feca57' : 'transparent',
                                                    filter: star <= selectedTestimonial.rating ? 'drop-shadow(0 0 6px rgba(254,202,87,0.6))' : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Feedback text */}
                                    <p
                                        className="text-xl text-white leading-relaxed tracking-wide"
                                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                                    >
                                        "{selectedTestimonial.content}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Texture for the Whole Wall Section */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `url('/brick-wall.png')`,
                    backgroundSize: '400px',
                    filter: 'grayscale(100%) contrast(120%) brightness(50%)'
                }}
            />
            {/* Vignette & Ambient Light */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d1117_90%)] pointer-events-none" />



            <div className="relative z-10 w-full">
                {/* Header */}
                <div className="text-center mb-8 lg:mb-16 max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="font-['Permanent_Marker'] relative"
                    >
                        {/* Glowing aura behind the title */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-yellow-500/20 blur-3xl rounded-full" />

                        <h2 className="relative text-5xl sm:text-7xl mb-6">
                            {/* Multi-layer graffiti effect */}
                            <span className="relative inline-block">
                                {/* Background shadow layer */}
                                <span
                                    className="absolute inset-0 transform translate-x-2 translate-y-2 blur-[2px]"
                                    style={{
                                        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    WALL OF LOVE
                                </span>
                                {/* Outline stroke layer */}
                                <span
                                    className="absolute inset-0 transform translate-x-0.5 translate-y-0.5"
                                    style={{
                                        WebkitTextStroke: '3px rgba(0,0,0,0.8)',
                                        color: 'transparent'
                                    }}
                                >
                                    WALL OF LOVE
                                </span>
                                {/* Main gradient text */}
                                <span
                                    className="relative"
                                    style={{
                                        background: 'linear-gradient(135deg, #f2cc60 0%, #ff6b6b 25%, #a855f7 50%, #4ecdc4 75%, #f2cc60 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        textShadow: 'none',
                                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                                    }}
                                >
                                    WALL OF LOVE
                                </span>
                                {/* Paint drips */}
                                <span className="absolute -bottom-4 left-[15%] text-[#f2cc60] opacity-70">
                                    <PaintDrip className="w-3 h-8" />
                                </span>
                                <span className="absolute -bottom-6 left-[45%] text-[#ff6b6b] opacity-60">
                                    <PaintDrip className="w-4 h-10" />
                                </span>
                                <span className="absolute -bottom-3 right-[20%] text-[#a855f7] opacity-70">
                                    <PaintDrip className="w-2.5 h-6" />
                                </span>
                            </span>
                        </h2>

                        <p className="text-lg sm:text-xl text-[#8b949e] mt-4 tracking-wide drop-shadow-lg">
                            <span className="bg-gradient-to-r from-[#8b949e] via-[#c9d1d9] to-[#8b949e] bg-clip-text text-transparent">
                                See what developers are saying about their experience.
                            </span>
                        </p>

                        {/* Decorative spray dots */}
                        <SprayDots className="-top-2 -left-4 text-yellow-500/30" />
                        <SprayDots className="-top-2 -right-4 text-purple-500/30" />
                    </motion.div>
                </div>

                {/* Marquee Container */}
                <div className="flex flex-col gap-[-20px]">
                    {/* Desktop: Two Opposing Rows */}
                    <div className="hidden md:flex flex-col gap-0">
                        <CssMarquee items={testimonials.slice(0, Math.ceil(testimonials.length / 2))} direction="left" speed="60s" onCardClick={setSelectedTestimonial} />
                        <CssMarquee items={testimonials.slice(Math.ceil(testimonials.length / 2))} direction="right" speed="60s" onCardClick={setSelectedTestimonial} />
                    </div>

                    {/* Mobile: Single Unified Row */}
                    <div className="md:hidden">
                        <CssMarquee items={testimonials} direction="left" speed="45s" onCardClick={setSelectedTestimonial} />
                    </div>
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="mt-12 flex justify-center px-6 font-['Permanent_Marker']"
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="relative group cursor-pointer"
                    >
                        {/* Glow effect behind button */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#f2cc60] via-[#ff6b6b] to-[#a855f7] rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 scale-105" />

                        {/* Main button */}
                        <div className="relative px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-2xl border border-white/10 group-hover:border-white/25 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">

                            {/* Inner glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            </div>

                            {/* Button content */}
                            <span className="relative z-10 flex items-center gap-3 text-xl sm:text-2xl tracking-wide">
                                <span className="text-2xl sm:text-3xl group-hover:animate-bounce">🧱</span>
                                <span
                                    className="font-bold"
                                    style={{
                                        background: 'linear-gradient(135deg, #f2cc60 0%, #ff9f43 30%, #ff6b6b 60%, #a855f7 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        textShadow: 'none',
                                    }}
                                >
                                    ADD YOUR WALL
                                </span>
                            </span>

                            {/* Corner accents */}
                            <span className="absolute top-2 left-2 w-2 h-2 bg-[#f2cc60] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#ff6b6b] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                </motion.div>
            </div>
        </section >
    )
}
