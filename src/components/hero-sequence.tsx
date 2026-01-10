'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Github, ChevronDown, LayoutDashboard } from 'lucide-react'
import { ContributionDemo } from './contribution-demo'

export function HeroSequence() {
    const [step, setStep] = useState(0)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)

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
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0d1117] overflow-hidden selection:bg-[#39d353]/30 selection:text-[#39d353]">
            {/* Dynamic Backgrounds */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] animate-grid pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-[#050505]/80 pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-center gap-12">

                {/* Animated Title with Logo as 'O' */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                >
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 flex items-center">
                        <span>C</span>
                        <motion.img
                            src="/logo.png"
                            alt="o"
                            className="h-[0.95em] w-auto object-contain inline-block align-middle -mx-2 translate-y-[0.15em]"
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                rotate: 0
                            }}
                            transition={{
                                duration: 0.8,
                                delay: 0.3,
                                type: "spring",
                                stiffness: 200
                            }}
                            whileHover={{
                                scale: 1.2,
                                rotate: 360,
                                filter: "drop-shadow(0 0 30px rgba(57,211,83,0.8))"
                            }}
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(57,211,83,0.5))"
                            }}
                        />
                        <span>mmit</span>
                        <span className="mx-1">&nbsp;</span>
                        <span className="text-[#39d353] drop-shadow-[0_0_30px_rgba(57,211,83,0.3)]">Habit</span>
                    </h1>
                </motion.div>

                {/* Contribution Demo */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-5xl mx-auto"
                >
                    <ContributionDemo />
                </motion.div>

                {/* Headline */}
                <div className="text-center min-h-[60px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {step >= 0 && (
                            <motion.h2
                                key="main"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
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
                    className="w-full max-w-sm px-4 lg:px-0"
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
                    ) : (
                        <a
                            href="/api/auth/github"
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
                        className="flex items-center justify-center gap-6 mt-6 text-sm text-[#8b949e]"
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

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-4 text-[#8b949e]"
            >
                <ChevronDown size={28} className="animate-bounce" />
            </motion.div>
        </section>
    )
}
