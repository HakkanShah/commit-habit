'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Terminal, ChevronDown } from 'lucide-react'
import { ContributionGraph } from './contribution-graph'

export function HeroSequence() {
    const [step, setStep] = useState(0)

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 500),
            setTimeout(() => setStep(2), 2000),
            setTimeout(() => setStep(3), 4000),
            setTimeout(() => setStep(4), 6000),
            setTimeout(() => setStep(5), 7500),
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0d1117] overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-[#39d353]/5 via-transparent to-transparent pointer-events-none" />

            {/* Dot Matrix Background */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #30363d 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center">
                {/* Contribution Graph */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={step >= 1 ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="mb-12"
                >
                    <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] shadow-2xl shadow-black/50">
                        <ContributionGraph
                            animated={step >= 3}
                            showLabels={false}
                            className="scale-90 md:scale-100 origin-center"
                        />
                    </div>
                </motion.div>

                {/* Text Sequence */}
                <div className="text-center min-h-[100px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {step >= 2 && step < 4 && (
                            <motion.h2
                                key="subtitle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-xl md:text-2xl font-mono text-[#8b949e]"
                            >
                                Missed commits don&apos;t mean missed growth.
                            </motion.h2>
                        )}

                        {step >= 4 && (
                            <motion.h1
                                key="headline"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
                            >
                                Consistency <span className="text-[#39d353]">&gt;</span> Motivation.
                            </motion.h1>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={step >= 5 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10"
                >
                    <a
                        href="/api/auth/github"
                        className="group relative inline-flex items-center gap-3 bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-4 rounded-lg font-mono font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(57,211,83,0.4)]"
                    >
                        <Terminal size={20} />
                        <span>git commit -m "start-habit"</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </a>

                    <p className="mt-6 text-center text-[#8b949e] font-mono text-sm">
                        <span className="text-[#39d353]">✔</span> No PAT required
                        <span className="mx-3 text-[#30363d]">•</span>
                        <span className="text-[#39d353]">✔</span> Open Source
                    </p>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={step >= 5 ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
                className="absolute bottom-10 flex flex-col items-center gap-2 text-[#8b949e]"
            >
                <span className="font-mono text-xs">scroll</span>
                <ChevronDown size={20} className="animate-bounce" />
            </motion.div>
        </section>
    )
}
