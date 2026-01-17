'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Github, ChevronDown, LayoutDashboard, Loader2 } from 'lucide-react'
import { ContributionDemo } from './contribution-demo'

export function HeroSequence() {
    const [step, setStep] = useState(0)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)

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

    // Check if user is logged in
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setIsLoggedIn(!!data.user)
                }
            } catch {
                // Ignore errors - user is not logged in
            } finally {
                setIsCheckingSession(false)
            }
        }
        checkSession()
    }, [])

    return (
        <section className="relative min-h-fit lg:min-h-screen flex flex-col items-center justify-start pt-6 lg:justify-center lg:pt-0 bg-[#0d1117] overflow-hidden selection:bg-[#39d353]/30 selection:text-[#39d353]">
            {/* Dynamic Backgrounds */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] animate-grid pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-[#050505]/80 pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 lg:py-8 flex flex-col items-center gap-4 lg:gap-6">

                {/* Animated Title with Logo as 'O' */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center transform-gpu"
                    style={{ willChange: 'opacity, transform, filter' }}
                >
                    <h1 className="text-[2.5rem] sm:text-7xl lg:text-8xl font-black tracking-wide text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 flex items-center justify-center whitespace-nowrap">
                        <span>C</span>
                        <motion.img
                            src="/logo.png"
                            alt="o"
                            width={80}
                            height={80}
                            fetchPriority="high"
                            className="h-[0.9em] w-auto object-contain inline-block align-middle -mx-[0.05em] translate-y-[0.1em]"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(57,211,83,0.5))",
                                willChange: 'opacity, transform'
                            }}
                        />
                        <span>mmit</span>
                        <span className="w-[0.2em] sm:w-[0.3em] inline-block"></span>
                        <span className="relative inline-flex flex-col items-center">
                            {/* Beta Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                                className="absolute top-1 -right-8 sm:top-0 sm:-right-10 group cursor-pointer"
                                style={{ willChange: 'opacity, transform' }}
                            >
                                <div className="relative rounded-full p-[1px] overflow-hidden transform-gpu">
                                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_180deg,transparent_360deg)] animate-[spin_4s_linear_infinite]" />
                                    <div className="relative flex items-center justify-center px-1.5 py-[1px] sm:px-2 sm:py-0.5 rounded-full bg-[#0d1117] backdrop-blur-sm">
                                        <span className="text-[8px] sm:text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#a371f7] tracking-[0.15em] leading-none uppercase">
                                            Beta
                                        </span>
                                    </div>
                                </div>
                                {/* Hover Tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-95 group-hover:scale-100">
                                    {/* Tooltip Arrow */}
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1c2128] border-l border-t border-[#58a6ff]/30 rotate-45"></div>

                                    {/* Tooltip Content */}
                                    <div className="relative px-4 py-3 bg-gradient-to-br from-[#1c2128] to-[#161b22] border border-[#58a6ff]/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl whitespace-nowrap">
                                        {/* Gradient accent line */}
                                        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#58a6ff]/50 to-transparent"></div>

                                        <p className="text-xs sm:text-sm text-white font-semibold mb-1">
                                            Beta Testing
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-[#8b949e]">
                                            Try it out & share your feedback!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                            <span className="text-[#39d353] drop-shadow-[0_0_30px_rgba(57,211,83,0.3)]">Habit</span>
                        </span>
                    </h1>
                </motion.div>

                {/* Contribution Demo */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-5xl mx-auto transform-gpu"
                    style={{ willChange: 'opacity, transform' }}
                >
                    <ContributionDemo />
                </motion.div>

                {/* Headline */}
                <div className="text-center min-h-[40px] flex items-center justify-center -mt-2">
                    <AnimatePresence mode="wait">
                        {step >= 0 && (
                            <motion.h2
                                key="main"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight transform-gpu"
                                style={{ willChange: 'opacity, transform' }}
                            >
                                Consistency <span className="text-[#39d353]">&gt;</span> Motivation
                            </motion.h2>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="w-full max-w-sm px-4 lg:px-0 transform-gpu"
                    style={{ willChange: 'opacity, transform' }}
                >
                    {isCheckingSession ? (
                        <div className="h-[60px] flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#39d353] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : isLoggedIn ? (
                        <a
                            href="/dashboard"
                            className="group relative flex items-center justify-center gap-3 w-full bg-[#238636] hover:bg-[#2ea043] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(57,211,83,0.4)]"
                        >
                            <LayoutDashboard size={22} className="group-hover:rotate-12 transition-transform" />
                            <span>Go to Dashboard</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 rounded-xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </a>
                    ) : isConnecting ? (
                        <div className="group relative flex items-center justify-center gap-3 w-full bg-[#238636] text-white py-4 px-6 rounded-xl font-bold text-lg cursor-wait">
                            <Loader2 size={22} className="animate-spin" />
                            <span className="animate-pulse">Connecting to GitHub...</span>
                            <div className="absolute inset-0 rounded-xl bg-[#39d353]/20 blur-xl opacity-100 animate-pulse" />
                        </div>
                    ) : (
                        <a
                            href="/api/auth/github"
                            onClick={(e) => {
                                setIsConnecting(true)
                                // Allow the navigation to continue
                            }}
                            className="group relative flex items-center justify-center gap-3 w-full bg-[#238636] hover:bg-[#2ea043] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(57,211,83,0.4)]"
                        >
                            <Github size={22} className="group-hover:rotate-12 transition-transform" />
                            <span>Connect with GitHub</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 rounded-xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </a>
                    )}

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-center gap-6 mt-4 text-sm text-[#8b949e]"
                        style={{ willChange: 'opacity' }}
                    >
                        {['No PAT', 'Open Source', 'Free'].map((item, i) => (
                            <span key={i} className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#238636]/20 text-[#39d353] text-xs">✓</span>
                                {item}
                            </span>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator - Clickable for smooth scroll */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="relative lg:absolute mt-6 lg:mt-0 lg:bottom-4 text-[#8b949e] hover:text-white transition-colors cursor-pointer pb-4 lg:pb-0"
                onClick={() => {
                    const featuresSection = document.getElementById('features')
                    if (featuresSection) {
                        featuresSection.scrollIntoView({ behavior: 'smooth' })
                    }
                }}
                aria-label="Scroll to next section"
                style={{ willChange: 'opacity' }}
            >
                <ChevronDown size={28} className="animate-bounce" />
            </motion.button>
        </section>
    )
}
