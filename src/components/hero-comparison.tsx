'use client'

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { ContributionGraphMini } from './contribution-graph'

export function HeroComparison() {
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percentage = (x / rect.width) * 100
        setSliderPosition(percentage)
    }

    const onMouseDown = () => setIsDragging(true)
    const onTouchStart = () => setIsDragging(true)

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        handleMove(e.clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) return
        handleMove(e.touches[0].clientX)
    }

    const onEnd = () => setIsDragging(false)

    useEffect(() => {
        const handleUp = () => setIsDragging(false)
        const handleBrowserMove = (e: globalThis.MouseEvent) => {
            if (isDragging) handleMove(e.clientX)
        }

        window.addEventListener('mouseup', handleUp)
        window.addEventListener('mousemove', handleBrowserMove)
        return () => {
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('mousemove', handleBrowserMove)
        }
    }, [isDragging])

    return (
        <div className="w-full max-w-4xl mx-auto perspective-1000">
            <div
                ref={containerRef}
                className="relative h-[300px] md:h-[400px] bg-[#0d1117] rounded-xl overflow-hidden border border-[#30363d] shadow-2xl transform-style-3d rotate-x-2 select-none touch-none"
                onTouchMove={onTouchMove}
                onTouchEnd={onEnd}
            >
                {/* Right Layer (After - Full Green) - Default Background */}
                <div className="absolute inset-0 bg-[#0d1117] flex items-center justify-center p-8">
                    <div className="text-center w-full">
                        <h3 className="text-2xl font-bold mb-6 text-[#39d353]">After Commit Habit 🚀</h3>
                        <div className="transform scale-150 origin-center">
                            <ContributionGraphMini filled={true} />
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded bg-[#39d353]/10 border border-[#39d353]/20">
                                <div className="text-2xl font-bold text-[#39d353]">365</div>
                                <div className="text-xs text-gray-400">Streak</div>
                            </div>
                            <div className="p-4 rounded bg-[#39d353]/10 border border-[#39d353]/20">
                                <div className="text-2xl font-bold text-[#39d353]">1,825</div>
                                <div className="text-xs text-gray-400">Contribs</div>
                            </div>
                            <div className="p-4 rounded bg-[#39d353]/10 border border-[#39d353]/20">
                                <div className="text-2xl font-bold text-[#39d353]">Top 1%</div>
                                <div className="text-xs text-gray-400">Activity</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Layer (Before - Grey) - Clip Path Mask */}
                <div
                    className="absolute inset-0 bg-[#0d1117] flex items-center justify-center p-8 border-r border-[#30363d]"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <div className="text-center w-full opacity-60 grayscale filter">
                        <h3 className="text-2xl font-bold mb-6 text-gray-400">Before Commit Habit 😢</h3>
                        <div className="transform scale-150 origin-center">
                            <ContributionGraphMini filled={false} />
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded bg-gray-800/50 border border-gray-700">
                                <div className="text-2xl font-bold text-gray-400">12</div>
                                <div className="text-xs text-gray-500">Streak</div>
                            </div>
                            <div className="p-4 rounded bg-gray-800/50 border border-gray-700">
                                <div className="text-2xl font-bold text-gray-400">43</div>
                                <div className="text-xs text-gray-500">Contribs</div>
                            </div>
                            <div className="p-4 rounded bg-gray-800/50 border border-gray-700">
                                <div className="text-2xl font-bold text-gray-400">Top 80%</div>
                                <div className="text-xs text-gray-500">Activity</div>
                            </div>
                        </div>
                    </div>

                    {/* Dark Overlay for contrast */}
                    <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-[#58a6ff] cursor-ew-resize hover:bg-white transition-colors z-20"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={onMouseDown}
                    onTouchStart={onTouchStart}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#58a6ff] rounded-full shadow-[0_0_20px_rgba(88,166,255,0.5)] flex items-center justify-center hover:scale-110 transition-transform">
                        <MoveHorizontal size={20} className="text-white" />
                    </div>
                </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-4 animate-pulse">
                Drag slider to see the transformation
            </p>
        </div>
    )
}
