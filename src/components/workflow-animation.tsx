'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Github, Settings, Coffee, CheckCircle } from 'lucide-react'

const STEPS = [
    {
        number: 1,
        title: 'Connect GitHub',
        description: 'Install the GitHub App with one click',
        icon: Github,
        color: '#58a6ff',
        duration: 3000,
    },
    {
        number: 2,
        title: 'Configure',
        description: 'Select repos to protect',
        icon: Settings,
        color: '#d29922',
        duration: 2500,
    },
    {
        number: 3,
        title: 'Relax',
        description: 'We handle the rest automatically',
        icon: Coffee,
        color: '#39d353',
        duration: 3000,
    },
]

export function WorkflowAnimation() {
    const [activeStep, setActiveStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Start animation when component is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.3 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    // Cycle through steps
    useEffect(() => {
        if (!isVisible) return

        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % STEPS.length)
        }, STEPS[activeStep].duration)

        return () => clearInterval(timer)
    }, [isVisible, activeStep])

    return (
        <div ref={containerRef} className="w-full max-w-4xl mx-auto">
            {/* Step Indicators */}
            <div className="flex justify-center gap-4 mb-4">
                {STEPS.map((step, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveStep(index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${activeStep === index
                            ? 'bg-white/10 scale-105'
                            : 'bg-transparent hover:bg-white/5'
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${activeStep >= index
                                ? 'bg-gradient-to-br from-[#39d353] to-[#238636] text-white'
                                : 'bg-[#21262d] text-[#8b949e]'
                                }`}
                        >
                            {activeStep > index ? <CheckCircle size={16} /> : step.number}
                        </div>
                        <span className={`hidden sm:block text-sm font-medium transition-colors ${activeStep === index ? 'text-white' : 'text-[#8b949e]'
                            }`}>
                            {step.title}
                        </span>
                    </button>
                ))}
            </div>

            {/* Animation Area - No border, transparent */}
            <div className="relative h-[240px] sm:h-[280px]">
                {/* Animated Background Glow */}
                <motion.div
                    className="absolute w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"
                    animate={{
                        background: STEPS[activeStep].color,
                        opacity: 0.2,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />

                {/* Step Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center">
                    {STEPS.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{
                                opacity: activeStep === index ? 1 : 0,
                                scale: activeStep === index ? 1 : 0.8,
                                y: activeStep === index ? 0 : 20,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`absolute inset-0 flex flex-col items-center justify-center ${activeStep === index ? 'pointer-events-auto' : 'pointer-events-none'
                                }`}
                        >
                            {/* Icon Container */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: activeStep === index ? [0, 5, -5, 0] : 0
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center mb-6"
                                style={{
                                    background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                                    border: `2px solid ${step.color}40`,
                                    boxShadow: `0 0 60px ${step.color}40`
                                }}
                            >
                                <step.icon size={48} className="sm:hidden" style={{ color: step.color }} />
                                <step.icon size={56} className="hidden sm:block" style={{ color: step.color }} />
                            </motion.div>

                            {/* Text */}
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
                                {step.title}
                            </h3>
                            <p className="text-[#8b949e] text-center text-sm sm:text-base max-w-xs mb-4">
                                {step.description}
                            </p>

                            {/* Progress Bar - smaller */}
                            <div className="w-32 sm:w-40 mt-2">
                                <div className="h-0.5 bg-[#21262d] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: step.color }}
                                        initial={{ width: '0%' }}
                                        animate={{ width: activeStep === index ? '100%' : '0%' }}
                                        transition={{ duration: step.duration / 1000, ease: 'linear' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
