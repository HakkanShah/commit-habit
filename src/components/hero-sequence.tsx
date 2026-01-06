'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Github, ChevronDown } from 'lucide-react'
import { ContributionGraph } from './contribution-graph'

export function HeroSequence() {
    const [step, setStep] = useState(0)

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 200),
            setTimeout(() => setStep(2), 1200),
            setTimeout(() => setStep(3), 2500),
            setTimeout(() => setStep(4), 4000),
            setTimeout(() => setStep(5), 5000),
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0d1117] overflow-hidden">
            {/* Subtle Background */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 w-full px-4 py-8 flex flex-col items-center">

                {/* Animated Title - Text Only */}
                <motion.h1
                    initial={{ opacity: 0, y: -20, letterSpacing: '0.2em' }}
                    animate={{ opacity: 1, y: 0, letterSpacing: '0.02em' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black mb-8 lg:mb-12 tracking-tight"
                >
                    <span className="text-white">Commit</span>
                    <span className="text-[#39d353]">Habit</span>
                </motion.h1>

                {/* Contribution Graph */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={step >= 1 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-4xl mb-8 lg:mb-10"
                >
                    <div className="bg-[#161b22] p-3 lg:p-5 rounded-lg border border-[#30363d]">
                        <ContributionGraph animated={step >= 3} showLabels={true} />
                    </div>
                </motion.div>

                {/* Headline */}
                <div className="text-center mb-6 lg:mb-8 px-2 min-h-[60px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {step >= 2 && step < 4 && (
                            <motion.p
                                key="sub"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm lg:text-lg text-[#8b949e] font-mono"
                            >
                                Missed commits ≠ missed growth
                            </motion.p>
                        )}
                        {step >= 4 && (
                            <motion.h2
                                key="main"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl sm:text-3xl lg:text-5xl font-black leading-tight"
                            >
                                Consistency <span className="text-[#39d353]">&gt;</span> Motivation
                            </motion.h2>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={step >= 5 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm px-4 lg:px-0"
                >
                    <a
                        href="/api/auth/github"
                        className="flex items-center justify-center gap-3 w-full bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] text-white py-4 px-6 rounded-xl font-bold text-base lg:text-lg transition-all touch-manipulation hover:shadow-[0_0_30px_rgba(57,211,83,0.4)]"
                    >
                        <Github size={20} />
                        <span>Connect with GitHub</span>
                        <ArrowRight size={18} />
                    </a>

                    <div className="flex items-center justify-center gap-4 mt-4 text-xs lg:text-sm text-[#8b949e]">
                        <span className="flex items-center gap-1">
                            <span className="text-[#39d353]">✓</span> No PAT
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-[#39d353]">✓</span> Open Source
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-[#39d353]">✓</span> Free
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={step >= 5 ? { opacity: 1 } : {}}
                className="absolute bottom-6 lg:bottom-10 text-[#8b949e]"
            >
                <ChevronDown size={24} className="animate-bounce" />
            </motion.div>
        </section>
    )
}
