'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ContributionGraphProps {
    animated?: boolean
    showLabels?: boolean
}

function createSeededRandom(seed: number) {
    let state = seed % 2147483647
    if (state <= 0) state += 2147483646
    return () => {
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    }
}

function generateSparseContributions(): number[] {
    const random = createSeededRandom(12345)
    return Array.from({ length: 371 }, () => {
        const r = random()
        if (r > 0.92) return Math.floor(random() * 2) + 1
        if (r > 0.85) return 1
        return 0
    })
}

function generateFullContributions(): number[] {
    const random = createSeededRandom(67890)
    return Array.from({ length: 371 }, () => {
        const r = random()
        if (r > 0.1) {
            const level = random()
            if (level > 0.6) return 4
            if (level > 0.35) return 3
            if (level > 0.15) return 2
            return 1
        }
        return 0
    })
}

const COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
const WEEKS = 52

function getMonthLabels() {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (WEEKS * 7))
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const months: { name: string; col: number }[] = []
    let currentMonth = -1

    for (let week = 0; week < WEEKS; week++) {
        const weekDate = new Date(startDate)
        weekDate.setDate(weekDate.getDate() + week * 7)
        const month = weekDate.getMonth()

        if (month !== currentMonth) {
            currentMonth = month
            months.push({
                name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
                col: week
            })
        }
    }
    return months
}

export function ContributionGraph({ animated = true, showLabels = true }: ContributionGraphProps) {
    const [isAfter, setIsAfter] = useState(false)
    const sparseData = useMemo(() => generateSparseContributions(), [])
    const fullData = useMemo(() => generateFullContributions(), [])
    const monthLabels = useMemo(() => getMonthLabels(), [])

    useEffect(() => {
        if (!animated) return
        const timer = setTimeout(() => setIsAfter(true), 2500)
        const interval = setInterval(() => setIsAfter(prev => !prev), 6000)
        return () => { clearTimeout(timer); clearInterval(interval) }
    }, [animated])

    const data = isAfter ? fullData : sparseData

    // Calculate exact width: 52 weeks * (10px cell + 3px gap) - 3px final gap + day labels
    const gridWidth = WEEKS * 13 - 3
    const totalWidth = showLabels ? gridWidth + 32 : gridWidth

    return (
        <div className="flex flex-col items-center w-full">
            {/* Cinematic Before/After Toggle */}
            <div className="flex items-center gap-4 mb-6">
                <motion.span
                    className="text-sm font-medium"
                    animate={{
                        color: !isAfter ? '#ffffff' : '#484f58',
                        scale: !isAfter ? 1.05 : 1
                    }}
                    transition={{ duration: 0.4 }}
                >
                    Before
                </motion.span>

                <div className="relative w-16 h-1 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#f85149] to-[#39d353] rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: isAfter ? '100%' : '0%' }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                    />
                </div>

                <motion.span
                    className="text-sm font-medium"
                    animate={{
                        color: isAfter ? '#39d353' : '#484f58',
                        scale: isAfter ? 1.05 : 1,
                        textShadow: isAfter ? '0 0 20px rgba(57,211,83,0.5)' : '0 0 0px transparent'
                    }}
                    transition={{ duration: 0.4 }}
                >
                    After
                </motion.span>
            </div>

            {/* Graph Container - Centered, No Extra Space */}
            <div className="overflow-x-auto w-full flex justify-center">
                <div style={{ width: `${totalWidth}px` }}>
                    {/* Month Labels */}
                    {showLabels && (
                        <div className="relative h-4 mb-1" style={{ marginLeft: '32px' }}>
                            {monthLabels.map((m, i) => (
                                <span
                                    key={i}
                                    className="absolute text-[11px] text-[#8b949e]"
                                    style={{ left: `${m.col * 13}px` }}
                                >
                                    {m.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Grid with Day Labels */}
                    <div className="flex">
                        {showLabels && (
                            <div className="flex flex-col justify-around w-8 pr-1" style={{ height: '88px' }}>
                                <span className="text-[10px] text-[#8b949e] leading-none">&nbsp;</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">Mon</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">&nbsp;</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">Wed</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">&nbsp;</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">Fri</span>
                                <span className="text-[10px] text-[#8b949e] leading-none">&nbsp;</span>
                            </div>
                        )}

                        {/* Contribution Grid with Wave Animation */}
                        <div className="flex gap-[3px]">
                            {Array.from({ length: WEEKS }).map((_, week) => (
                                <div key={week} className="flex flex-col gap-[3px]">
                                    {Array.from({ length: 7 }).map((_, day) => {
                                        const idx = week * 7 + day
                                        const level = data[idx] ?? 0
                                        const delay = week * 15 + day * 5

                                        return (
                                            <motion.div
                                                key={`${week}-${day}-${isAfter}`}
                                                className="w-[10px] h-[10px] rounded-[2px]"
                                                initial={{
                                                    backgroundColor: COLORS[0],
                                                    scale: 0.8,
                                                    opacity: 0.5
                                                }}
                                                animate={{
                                                    backgroundColor: COLORS[level],
                                                    scale: 1,
                                                    opacity: 1
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: delay / 1000,
                                                    ease: 'easeOut'
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-[3px] mt-4">
                        <span className="text-[11px] text-[#8b949e] mr-1">Less</span>
                        {COLORS.map((color, i) => (
                            <div
                                key={i}
                                className="w-[10px] h-[10px] rounded-[2px]"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <span className="text-[11px] text-[#8b949e] ml-1">More</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ContributionGraphMini({ filled = false }: { filled?: boolean }) {
    const data = useMemo(() => {
        return filled ? generateFullContributions().slice(0, 84) : generateSparseContributions().slice(0, 84)
    }, [filled])

    return (
        <div className="flex gap-[2px]">
            {Array.from({ length: 12 }).map((_, week) => (
                <div key={week} className="flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, day) => (
                        <div
                            key={day}
                            className="w-[6px] h-[6px] rounded-[1px]"
                            style={{ backgroundColor: COLORS[data[week * 7 + day] || 0] }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
