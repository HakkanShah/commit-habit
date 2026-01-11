'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TerminalLine {
    text: string
    color?: string
    delay?: number
    typeSpeed?: number
}

const TERMINAL_LINES: TerminalLine[] = [
    { text: '# 00:00 UTC - Daily Streak Check', color: '#8b949e', delay: 500, typeSpeed: 30 },
    { text: 'Connecting to GitHub API...', delay: 800, typeSpeed: 25 },
    { text: '✓ Authentication successful', color: '#39d353', delay: 600, typeSpeed: 20 },
    { text: 'Scanning repository for today\'s activity...', delay: 1000, typeSpeed: 25 },
    { text: '⚠ Alert: No commits detected for today', color: '#f85149', delay: 1200, typeSpeed: 30 },
    { text: '→ Initiating streak protection protocol...', color: '#d29922', delay: 800, typeSpeed: 25 },
    { text: 'git add README.md', delay: 500, typeSpeed: 40 },
    { text: 'git commit -m "docs: maintain streak ✨"', delay: 600, typeSpeed: 35 },
    { text: 'git push origin main', delay: 500, typeSpeed: 40 },
    { text: '✓ Streak successfully protected! 🔥', color: '#39d353', delay: 800, typeSpeed: 25 },
]

export function AnimatedTerminal() {
    const [visibleLines, setVisibleLines] = useState<number>(0)
    const [currentText, setCurrentText] = useState<string>('')
    const [isTyping, setIsTyping] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Start animation when component is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasStarted) {
                    setHasStarted(true)
                }
            },
            { threshold: 0.3 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [hasStarted])

    // Typewriter effect
    useEffect(() => {
        if (!hasStarted) return
        if (visibleLines >= TERMINAL_LINES.length) return

        const currentLine = TERMINAL_LINES[visibleLines]
        const delay = currentLine.delay || 500
        const typeSpeed = currentLine.typeSpeed || 30

        // Wait before starting to type
        const startTimer = setTimeout(() => {
            setIsTyping(true)
            let charIndex = 0

            const typeInterval = setInterval(() => {
                if (charIndex <= currentLine.text.length) {
                    setCurrentText(currentLine.text.slice(0, charIndex))
                    charIndex++
                } else {
                    clearInterval(typeInterval)
                    setIsTyping(false)
                    setCurrentText('')
                    setVisibleLines(prev => prev + 1)
                }
            }, typeSpeed)

            return () => clearInterval(typeInterval)
        }, delay)

        return () => clearTimeout(startTimer)
    }, [visibleLines, hasStarted])

    // Reset and replay when all lines are done
    useEffect(() => {
        if (visibleLines >= TERMINAL_LINES.length) {
            const resetTimer = setTimeout(() => {
                setVisibleLines(0)
                setCurrentText('')
            }, 5000)
            return () => clearTimeout(resetTimer)
        }
    }, [visibleLines])

    return (
        <div ref={containerRef} className="bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-[#161b22] px-4 py-3 flex items-center gap-4 border-b border-[#30363d] select-none">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#27ca40] hover:brightness-110 transition-all" />
                </div>
                <div className="text-xs text-gray-500 font-mono flex-1 text-center">
                    commit-habit — automation.service
                </div>
                <div className="w-16" />
            </div>

            {/* Terminal Content */}
            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-[#c9d1d9] min-h-[280px] sm:min-h-[320px]">
                <AnimatePresence mode="sync">
                    {TERMINAL_LINES.slice(0, visibleLines).map((line, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-2 mb-2"
                        >
                            <span className="text-[#39d353] select-none">$</span>
                            <span style={{ color: line.color || '#c9d1d9' }}>
                                {line.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Currently typing line */}
                {isTyping && visibleLines < TERMINAL_LINES.length && (
                    <div className="flex gap-2 mb-2">
                        <span className="text-[#39d353] select-none">$</span>
                        <span style={{ color: TERMINAL_LINES[visibleLines]?.color || '#c9d1d9' }}>
                            {currentText}
                            <span className="animate-pulse text-[#39d353]">▊</span>
                        </span>
                    </div>
                )}

                {/* Waiting cursor */}
                {!isTyping && visibleLines < TERMINAL_LINES.length && hasStarted && (
                    <div className="flex gap-2">
                        <span className="text-[#39d353] select-none">$</span>
                        <span className="animate-pulse text-[#39d353]">▊</span>
                    </div>
                )}
            </div>
        </div>
    )
}
