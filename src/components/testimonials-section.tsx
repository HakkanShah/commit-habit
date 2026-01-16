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
        userName: 'Hakkan Shah',

        githubUsername: 'hakkanshah',
        content: "I build this shit and this shit is a dope.",
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

function BrickCard({ testimonial, index }: { testimonial: Testimonial, index: number }) {
    // Deterministic rotation and scale for that "organic patch" feel
    const randomRotate = ((index * 137) % 10 - 5); // -5 to 5 degree
    const randomScale = 0.95 + ((index * 79) % 10) / 100; // 0.95 to 1.05

    return (
        <div
            className="relative w-[340px] md:w-[380px] flex-shrink-0 mx-[-10px] h-[260px] group flex items-center justify-center"
            style={{
                transform: `rotate(${randomRotate}deg) scale(${randomScale})`,
                zIndex: index % 2 === 0 ? 1 : 2,
                backgroundImage: `url('/wall-hole.png')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
            {/* Content - "Painted" inside the wall hole */}
            {/* Adjusted Width/Height to fit inside the 'hole' of the image */}
            {/* Content - "Painted" inside the wall hole */}
            {/* Horizontal Layout: Profile Left, Content Right */}
            <div className="relative z-10 w-[80%] h-[75%] flex flex-row items-center gap-4 font-['Permanent_Marker'] tracking-wide text-left mt-1 group-hover:scale-105 transition-transform duration-300">

                {/* Dark Overlay for Readability */}
                <div className="absolute inset-0 bg-black/60 blur-[20px] rounded-full -z-10 scale-125"></div>

                {/* Left Side: Avatar */}
                <div className="flex-shrink-0 ml-2">
                    <div className="p-1 rounded-full bg-white/10 shadow-lg rotate-[-2deg]">
                        <img
                            src={`https://github.com/${testimonial.githubUsername}.png`}
                            alt={testimonial.userName}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full grayscale contrast-125 border-2 border-white/20"
                        />
                    </div>
                </div>

                {/* Right Side: Info & Review */}
                <div className="flex flex-col min-w-0 flex-1 pr-2">
                    {/* Header */}
                    <div className="flex flex-col items-start mb-1">
                        <h3 className="text-[#f2cc60] text-xl sm:text-2xl leading-none drop-shadow-[2px_2px_0_rgba(0,0,0,1)] tracking-wider">
                            {testimonial.userName}
                        </h3>
                        <a
                            href={`https://github.com/${testimonial.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#58a6ff] text-xs mt-0.5 hover:text-white transition-colors drop-shadow-[1px_1px_0_black]"
                        >
                            @{testimonial.githubUsername}
                        </a>
                    </div>

                    {/* Review Text */}
                    <div className="relative mb-1">
                        <p className="text-white text-[12px] sm:text-[13px] leading-tight drop-shadow-[0_2px_0_rgba(0,0,0,1)] line-clamp-3">
                            <span style={{ textShadow: '2px 2px 0 #000' }}>
                                "{testimonial.content}"
                            </span>
                        </p>
                    </div>

                    {/* Footer: Stars */}
                    <div className="flex items-center gap-1 opacity-100">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                className={i < testimonial.rating
                                    ? "text-[#f2cc60] fill-[#f2cc60] drop-shadow-[0_2px_0_rgba(0,0,0,1)]"
                                    : "text-gray-600 fill-gray-800"
                                }
                                strokeWidth={2}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CssMarquee({ items, direction = 'left', speed = '40s', className }: { items: Testimonial[], direction?: 'left' | 'right', speed?: string, className?: string }) {
    return (
        <div className={`flex overflow-hidden group ${className}`} style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            <div
                className={`flex gap-0 w-max shrink-0 hover:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
                style={{ animationDuration: speed }}
            >
                {[...items, ...items, ...items].map((testimonial, i) => (
                    <div key={`${testimonial.id}-${i}`} className="py-2">
                        <BrickCard testimonial={testimonial} index={i} />
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes marquee-left {
                    from { transform: translateX(0); }
                    to { transform: translateX(-33.33%); }
                }
                @keyframes marquee-right {
                     from { transform: translateX(-33.33%); }
                    to { transform: translateX(0); }
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
        <section className="relative py-24 overflow-hidden bg-[#0d1117]">
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl font-['Permanent_Marker']"
                            style={{
                                backgroundImage: `url('/brick-wall.png')`,
                                backgroundSize: '200px',
                                backgroundPosition: 'center',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Dark Overlay for Readability */}
                            <div className="absolute inset-0 bg-black/60 rounded-2xl pointer-events-none"></div>

                            {/* Close Button */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-3 right-3 z-20 text-white/60 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={24} />
                            </button>

                            {/* Modal Content */}
                            <div className="relative z-10">
                                <h3 className="text-2xl text-[#f2cc60] text-center mb-4 drop-shadow-[2px_2px_0_#000]">
                                    {hasExistingFeedback ? 'MODIFY YOUR WALL' : 'ADD YOUR WALL'}
                                </h3>

                                {/* Auth Error Message */}
                                {authError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-3 bg-[#f85149]/20 border border-[#f85149]/50 rounded-lg text-center"
                                    >
                                        <p className="text-white text-sm mb-2">
                                            Connect with GitHub to submit your review!
                                        </p>
                                        <a
                                            href="/api/auth/github"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] text-white text-sm rounded-lg hover:bg-[#2ea043] transition-colors"
                                        >
                                            <Github size={16} />
                                            Connect with GitHub
                                        </a>
                                    </motion.div>
                                )}

                                {/* Star Rating */}
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="cursor-pointer transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={28}
                                                className={star <= rating
                                                    ? "text-[#f2cc60] fill-[#f2cc60] drop-shadow-[0_2px_0_rgba(0,0,0,1)]"
                                                    : "text-gray-600 fill-gray-800"
                                                }
                                                strokeWidth={2}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Feedback Textarea */}
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Write your feedback here..."
                                    maxLength={100}
                                    className="w-full h-32 p-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-[#f2cc60]/50 transition-colors"
                                />
                                <p className="text-right text-xs text-white/40 mt-1">
                                    {feedbackText.length}/100
                                </p>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full mt-4 py-3 bg-[#238636] text-white text-lg rounded-lg hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {hasExistingFeedback ? 'Updating...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Texture for the Whole Wall Section */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `url('/brick-wall.png')`, // Reuse texture for the background wall too for blending
                    backgroundSize: '400px',
                    filter: 'grayscale(100%) contrast(120%) brightness(50%)'
                }}
            />
            {/* Vignette & Ambient Light */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d1117_90%)] pointer-events-none" />



            <div className="relative z-10 w-full">
                {/* Header */}
                <div className="text-center mb-16 max-w-2xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-['Permanent_Marker']"
                    >
                        <h2 className="text-4xl sm:text-6xl text-white mb-4 drop-shadow-[0_4px_0_#000]">
                            {/* Stencil Style Effect on Title */}
                            <span className="relative inline-block">
                                <span className="absolute inset-0 transform translate-x-1 translate-y-1 text-black blur-[1px]">WALL OF LOVE</span>
                                <span className="relative text-[#e6edf3]">WALL OF LOVE</span>
                            </span>
                        </h2>
                        <p className="text-xl text-[#8b949e] drop-shadow-md">
                            Join thousands of developers who are consistently shipping code.
                        </p>
                    </motion.div>
                </div>

                {/* Marquee Container */}
                <div className="flex flex-col gap-[-20px]">
                    {/* Desktop: Two Opposing Rows */}
                    <div className="hidden md:flex flex-col gap-0">
                        <CssMarquee items={testimonials.slice(0, Math.ceil(testimonials.length / 2))} direction="left" speed="60s" />
                        <CssMarquee items={testimonials.slice(Math.ceil(testimonials.length / 2))} direction="right" speed="60s" />
                    </div>

                    {/* Mobile: Single Unified Row */}
                    <div className="md:hidden">
                        <CssMarquee items={testimonials} direction="left" speed="45s" />
                    </div>
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 flex justify-center px-6 font-['Permanent_Marker']"
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="relative px-8 py-3 sm:px-10 sm:py-3.5 text-white text-lg sm:text-xl tracking-widest hover:scale-105 hover:-translate-y-1 hover:shadow-cyan-500/20 transition-all duration-300 rotate-[-1deg] group rounded-full overflow-hidden border-2 border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-pointer"
                        style={{
                            backgroundImage: `url('/brick-wall.png')`,
                            backgroundSize: '150px',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Darken Overlay */}
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none"></div>

                        {/* Button Text */}
                        <span className="relative z-10 drop-shadow-[2px_2px_0_#000] text-[#f2cc60] whitespace-nowrap">ADD YOUR WALL</span>
                    </button>
                </motion.div>
            </div>
        </section>
    )
}
