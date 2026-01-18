'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'

// Generate stable random values for particles (only runs once)
function generateParticleConfig(count: number) {
    return Array.from({ length: count }, () => ({
        initialX: Math.random() * 1000,
        animateX: Math.random() * 1000,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
    }))
}

export function Particles() {
    const [mounted, setMounted] = useState(false)

    // Generate particle configs once on mount (stable across re-renders)
    const particleConfigs = useMemo(() => generateParticleConfig(5), [])

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <>
            {particleConfigs.map((config, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-[#39d353] rounded-full"
                    initial={{ opacity: 0, y: 100, x: config.initialX }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: -100,
                        x: config.animateX
                    }}
                    transition={{
                        duration: config.duration,
                        repeat: Infinity,
                        delay: config.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </>
    )
}
