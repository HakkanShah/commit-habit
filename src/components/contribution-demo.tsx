'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

const ROWS = 7
const COLS = 53 // Full year for desktop
// Levels of green: 0 (bg), 1, 2, 3, 4
const LEVELS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Generate random data for "Before" (Sparse) and "After" (Consistent)
const generateData = (type: 'before' | 'after') => {
    return Array.from({ length: ROWS * COLS }).map(() => {
        if (type === 'before') {
            // 80% empty, 20% random low activity
            return Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0
        } else {
            // 90% active, mixed high activity
            return Math.random() > 0.1 ? Math.floor(Math.random() * 4) + 1 : 0
        }
    })
}

// Stable seed data
const beforeData = generateData('before')
const afterData = generateData('after')

export function ContributionDemo() {
    const [mode, setMode] = useState<'before' | 'after'>('before')

    // Auto-toggle every few seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setMode(prev => prev === 'before' ? 'after' : 'before')
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full flex flex-col items-center gap-8">
            {/* Toggle / Status Indicator */}
            <div className="flex items-center gap-4 bg-[#161b22] px-6 py-2 rounded-full border border-[#30363d] backdrop-blur-md relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-8 text-sm font-medium font-mono">
                    <button
                        onClick={() => setMode('before')}
                        className={cn(
                            "transition-colors duration-300",
                            mode === 'before' ? "text-white" : "text-[#484f58]"
                        )}
                    >
                        Before
                    </button>
                    <button
                        onClick={() => setMode('after')}
                        className={cn(
                            "transition-colors duration-300",
                            mode === 'after' ? "text-[#39d353]" : "text-[#484f58]"
                        )}
                    >
                        After
                    </button>
                </div>

                {/* Sliding Indicator */}
                <motion.div
                    className="absolute top-1 bottom-1 w-1/2 left-0 bg-[#30363d]/50 rounded-full"
                    animate={{
                        x: mode === 'before' ? 0 : '100%',
                        backgroundColor: mode === 'before' ? 'rgba(48, 54, 61, 0.5)' : 'rgba(57, 211, 83, 0.1)'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            {/* Grid Container */}
            <div className="relative p-6 bg-[#0d1117]/80 backdrop-blur-xl rounded-xl border border-[#30363d] shadow-2xl overflow-hidden group hover:border-[#39d353]/30 transition-colors duration-500">
                {/* Month Labels (Desktop Only) */}
                <div className="hidden lg:flex justify-between mb-2 px-1 text-xs text-[#7d8590] font-mono">
                    {MONTHS.map((month, i) => (
                        <span key={i}>{month}</span>
                    ))}
                </div>

                <div className="flex gap-[3px]">
                    {Array.from({ length: COLS }).map((_, colIndex) => (
                        <div key={colIndex} className={cn("flex flex-col gap-[3px]", colIndex >= 20 ? "hidden lg:flex" : "")}>
                            {Array.from({ length: ROWS }).map((_, rowIndex) => {
                                const i = colIndex * ROWS + rowIndex
                                const level = mode === 'before' ? beforeData[i] : afterData[i]

                                return (
                                    <motion.div
                                        key={`${colIndex}-${rowIndex}`}
                                        initial={false}
                                        animate={{
                                            backgroundColor: LEVELS[level],
                                            scale: mode === 'after' && level > 0 ? [1, 1.2, 1] : 1,
                                        }}
                                        transition={{
                                            backgroundColor: { duration: 0.8, ease: "easeInOut" },
                                            scale: { duration: 0.4, delay: Math.random() * 0.2 + 0.2 } // Random "pop" effect
                                        }}
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-[2px]"
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-[#39d353]/0 via-[#39d353]/0 to-[#39d353]/20 pointer-events-none"
                    animate={{ opacity: mode === 'after' ? 1 : 0 }}
                    transition={{ duration: 1 }}
                />
            </div>
        </div>
    )
}
