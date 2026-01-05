'use client'

import { useEffect, useState, useMemo } from 'react'

// ============================================================================
// Types
// ============================================================================

interface ContributionGraphProps {
    animated?: boolean
    showLabels?: boolean
    className?: string
}

// ============================================================================
// Generate Contribution Data
// ============================================================================

// Simple seeded random number generator (Linear Congruential Generator)
function createSeededRandom(seed: number) {
    let state = seed % 2147483647
    if (state <= 0) state += 2147483646

    return () => {
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    }
}

function generateSparseContributions(): number[] {
    const random = createSeededRandom(12345) // Fixed seed
    const data: number[] = []

    for (let i = 0; i < 52 * 7; i++) {
        const r = random()
        if (r > 0.92) {
            data.push(Math.floor(random() * 2) + 1) // 1-2
        } else if (r > 0.85) {
            data.push(1)
        } else {
            data.push(0)
        }
    }
    return data
}

function generateFullContributions(): number[] {
    const random = createSeededRandom(67890) // Different fixed seed
    const data: number[] = []

    for (let i = 0; i < 52 * 7; i++) {
        const r = random()
        if (r > 0.15) {
            const level = random()
            if (level > 0.7) {
                data.push(4) // High activity
            } else if (level > 0.4) {
                data.push(3)
            } else if (level > 0.2) {
                data.push(2)
            } else {
                data.push(1)
            }
        } else {
            data.push(0)
        }
    }
    return data
}

// ============================================================================
// Component
// ============================================================================

export function ContributionGraph({
    animated = true,
    showLabels = true,
    className = '',
}: ContributionGraphProps) {
    const [isAfter, setIsAfter] = useState(false)

    // Generate stable data with useMemo
    const sparseData = useMemo(() => generateSparseContributions(), [])
    const fullData = useMemo(() => generateFullContributions(), [])

    useEffect(() => {
        if (!animated) return

        // Initial delay, then toggle
        const timer = setTimeout(() => {
            setIsAfter(true)
        }, 2000)

        // Toggle back and forth
        const interval = setInterval(() => {
            setIsAfter(prev => !prev)
        }, 5000)

        return () => {
            clearTimeout(timer)
            clearInterval(interval)
        }
    }, [animated])

    const currentData = isAfter ? fullData : sparseData

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const days = ['', 'Mon', '', 'Wed', '', 'Fri', '']

    return (
        <div className={`contribution-graph-container ${className}`}>
            {/* Before/After Label */}
            <div className="flex items-center justify-center gap-4 mb-4">
                <span className={`text-sm font-medium transition-all duration-500 ${!isAfter ? 'text-[var(--text-muted)] opacity-100' : 'text-[var(--text-muted)] opacity-40'}`}>
                    Before 😢
                </span>
                <div className="w-8 h-0.5 bg-gradient-to-r from-[var(--text-muted)] to-[var(--accent-green)] rounded" />
                <span className={`text-sm font-medium transition-all duration-500 ${isAfter ? 'text-[var(--accent-green)] opacity-100' : 'text-[var(--text-muted)] opacity-40'}`}>
                    After 🚀
                </span>
            </div>

            <div className="contribution-graph">
                {/* Month Labels */}
                {showLabels && (
                    <div className="contribution-months">
                        <div className="w-8" /> {/* Spacer for day labels */}
                        {months.map((month, i) => (
                            <span key={i} className="contribution-month-label">
                                {month}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex">
                    {/* Day Labels */}
                    {showLabels && (
                        <div className="contribution-days">
                            {days.map((day, i) => (
                                <span key={i} className="contribution-day-label">
                                    {day}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Grid */}
                    <div className="contribution-grid">
                        {Array.from({ length: 52 }).map((_, weekIndex) => (
                            <div key={weekIndex} className="contribution-week">
                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                    const index = weekIndex * 7 + dayIndex
                                    const level = currentData[index] || 0
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`contribution-cell level-${level}`}
                                            style={{
                                                transitionDelay: `${(weekIndex * 7 + dayIndex) * 2}ms`,
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="contribution-legend">
                    <span className="text-xs text-[var(--text-muted)]">Less</span>
                    <div className="contribution-cell level-0" />
                    <div className="contribution-cell level-1" />
                    <div className="contribution-cell level-2" />
                    <div className="contribution-cell level-3" />
                    <div className="contribution-cell level-4" />
                    <span className="text-xs text-[var(--text-muted)]">More</span>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Mini Version for Cards
// ============================================================================

export function ContributionGraphMini({ filled = false }: { filled?: boolean }) {
    const data = useMemo(() => {
        if (filled) return generateFullContributions().slice(0, 7 * 12)
        return generateSparseContributions().slice(0, 7 * 12)
    }, [filled])

    return (
        <div className="contribution-graph-mini">
            {Array.from({ length: 12 }).map((_, weekIndex) => (
                <div key={weekIndex} className="contribution-week">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const index = weekIndex * 7 + dayIndex
                        const level = data[index] || 0
                        return (
                            <div
                                key={dayIndex}
                                className={`contribution-cell-mini level-${level}`}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
