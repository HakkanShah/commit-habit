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

                {/*
                  Beta notice.

                  This used to be a hover-only tooltip nested inside the <h1>, and
                  it was broken four different ways:

                  1. The <h1> uses `bg-clip-text` + `text-transparent`. That mask is
                     built from every glyph inside the heading, including this
                     absolutely-positioned badge - so the browser painted a ghost
                     copy of the word "BETA" at the heading's background origin,
                     i.e. floating over the top-left of the title. One element,
                     two visible badges.
                  2. `group-hover` does not exist on a touch device. Tapping near it
                     left the hover state stuck, so the tooltip sat permanently on
                     top of "Commit Habit".
                  3. Positioned `top-full` inside the heading, the tooltip overlapped
                     the title text by design the moment it did appear.
                  4. At 393px wide the tooltip rendered 218px wide starting at x=245
                     - 70px past the right edge of the viewport.

                  It is now a plain, always-visible element that is a sibling of the
                  heading rather than a child, so none of the above can recur.
                */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
                    className="inline-flex items-center gap-2 sm:gap-2.5 max-w-[calc(100vw-2rem)] rounded-full border border-[#58a6ff]/25 bg-[#58a6ff]/[0.07] px-3 py-1.5 backdrop-blur-sm"
                >
                    {/* Live pulse. Replaces a spinning conic-gradient ring that read
                        as a lopsided rectangle at small sizes. */}
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#58a6ff] opacity-75 motion-safe:animate-ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#58a6ff]" />
                    </span>

                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">
                        Beta
                    </span>

                    <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden="true" />

                    <span className="truncate text-[11px] sm:text-xs text-[#8b949e]">
                        Try it out &amp; share your feedback
                    </span>
                </motion.div>

                {/* Animated Title with Logo as 'O' */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center transform-gpu"
                >
                    <h1 className="text-[2.5rem] sm:text-7xl lg:text-8xl font-black tracking-wide text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 flex items-center justify-center whitespace-nowrap">
                        <span>C</span>
                        <motion.img
                            src="/logo.webp"
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
                            }}
                        />
                        <span>mmit</span>
                        <span className="w-[0.2em] sm:w-[0.3em] inline-block"></span>
                        <span className="text-[#39d353] drop-shadow-[0_0_30px_rgba(57,211,83,0.3)]">Habit</span>
                    </h1>
                </motion.div>

                {/* Contribution Demo */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-5xl mx-auto transform-gpu"
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
            >
                <ChevronDown size={28} className="animate-bounce" />
            </motion.button>
        </section>
    )
}
