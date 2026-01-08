'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function Particles() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <>
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-[#39d353] rounded-full"
                    initial={{ opacity: 0, y: 100, x: Math.random() * 1000 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: -100,
                        x: Math.random() * 1000
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "linear"
                    }}
                />
            ))}
        </>
    )
}
