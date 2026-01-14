'use client'

import { useState, useEffect } from 'react'
import { X, Github, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

interface OnboardingPopupProps {
    onClose: () => void
}

const SLIDES = [
    {
        icon: Github,
        iconColor: 'text-[#39d353]',
        iconBg: 'bg-[#39d353]/10',
        title: 'Connect a Repo & Relax',
        description: 'Simply connect any GitHub repository and let Commit Habit take care of your streak. No complex setup needed!',
    },
    {
        icon: Clock,
        iconColor: 'text-[#58a6ff]',
        iconBg: 'bg-[#58a6ff]/10',
        title: 'Every 6 Hours, We Check',
        description: "Commit Habit runs 4 times daily. If you haven't committed, it creates one for you. If you have, it skips!",
    },
    {
        icon: CheckCircle2,
        iconColor: 'text-[#a371f7]',
        iconBg: 'bg-[#a371f7]/10',
        title: "Let's Make it a Habit!",
        description: 'Your streak stays protected 24/7. Focus on coding when you want — we handle the rest.',
    },
]

export function OnboardingPopup({ onClose }: OnboardingPopupProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [isExiting, setIsExiting] = useState(false)

    // Animate in on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => {
            onClose()
        }, 300)
    }

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(prev => prev + 1)
        } else {
            handleClose()
        }
    }

    const isLastSlide = currentSlide === SLIDES.length - 1
    const slide = SLIDES[currentSlide]
    const IconComponent = slide.icon

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-gradient-to-br from-[#161b22] via-[#1c2128] to-[#161b22] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 ${isVisible && !isExiting
                    ? 'scale-100 translate-y-0'
                    : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#39d353]/10 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10">
                    {/* Slide indicator */}
                    <div className="flex justify-center gap-2 mb-8">
                        {SLIDES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'w-8 bg-[#39d353]'
                                    : index < currentSlide
                                        ? 'w-3 bg-[#39d353]/50'
                                        : 'w-3 bg-white/20'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Animated Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            key={currentSlide}
                            className={`w-20 h-20 rounded-2xl ${slide.iconBg} flex items-center justify-center shadow-lg animate-[bounce-in_0.4s_ease-out]`}
                        >
                            <IconComponent size={36} className={`${slide.iconColor} animate-[pulse_2s_ease-in-out_infinite]`} />
                        </div>
                    </div>

                    {/* Title */}
                    <h2
                        key={`title-${currentSlide}`}
                        className="text-xl sm:text-2xl font-bold text-center mb-3 bg-gradient-to-r from-white to-[#8b949e] bg-clip-text text-transparent animate-[fade-slide-up_0.4s_ease-out]"
                    >
                        {slide.title}
                    </h2>

                    {/* Description */}
                    <p
                        key={`desc-${currentSlide}`}
                        className="text-[#8b949e] text-center text-sm sm:text-base leading-relaxed mb-8 animate-[fade-slide-up_0.4s_ease-out_0.1s_both]"
                    >
                        {slide.description}
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={handleNext}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${isLastSlide
                            ? 'bg-gradient-to-r from-[#238636] to-[#2ea043] text-white shadow-lg shadow-[#238636]/30'
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                            }`}
                    >
                        {isLastSlide ? (
                            <>
                                <Sparkles size={18} />
                                <span>Understood, Let&apos;s Go!</span>
                            </>
                        ) : (
                            <>
                                <span>Next</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* Skip hint for non-last slides */}
                    {!isLastSlide && (
                        <p className="text-center text-xs text-[#8b949e]/60 mt-4">
                            Press anywhere outside or click X to skip
                        </p>
                    )}
                </div>
            </div>

            {/* Custom animations */}
            <style jsx global>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes fade-slide-up {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div >
    )
}
