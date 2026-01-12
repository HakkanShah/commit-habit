'use client'

import {
    Link,
    Bot,
    ShieldCheck,
    LucideIcon
} from 'lucide-react'

interface WelcomeAnimationProps {
    hasRepos: boolean
    hasCommitsToday?: boolean
}

export function WelcomeAnimation({ hasRepos, hasCommitsToday = false }: WelcomeAnimationProps) {
    // State 1: Onboarding Guide (No Repos)
    if (!hasRepos) {
        return (
            <div className="flex w-auto items-center">
                <div className="relative group w-auto">
                    <div className="relative flex items-center gap-2 sm:gap-3 w-auto sm:min-w-[280px]">

                        {/* Connection Icon Container */}
                        <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 bg-[#2ea043]/20 rounded-full animate-ping-slow" />
                            <div className="absolute inset-2 bg-[#2ea043]/10 rounded-full animate-pulse" />

                            {/* Connect Icon */}
                            <Link
                                className="text-[#3fb950] relative z-10 animate-float-slow drop-shadow-[0_0_15px_rgba(46,160,67,0.6)]"
                                size={20}
                                strokeWidth={2.5}
                            />
                        </div>

                        <div>
                            <p className="text-[#3fb950] font-bold text-xs sm:text-[15px] tracking-tight">Start Here</p>
                            <p className="text-[#8b949e] text-[10px] sm:text-xs font-medium leading-tight">Connect repo</p>
                        </div>
                    </div>

                    {/* Animated Arrow Indicator */}
                    <div className="absolute bottom-1 left-[1.1rem] sm:left-[1.6rem] w-0.5 h-4 sm:h-6 bg-gradient-to-b from-[#2ea043] to-transparent opacity-0 animate-fade-arrow" />
                </div>

                <style jsx>{`
                    @keyframes float-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    @keyframes ping-slow {
                        0%, 100% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.4); opacity: 0.4; }
                    }
                    @keyframes fade-arrow {
                        0%, 100% { opacity: 0; transform: translateY(-8px); }
                        50% { opacity: 1; transform: translateY(0); }
                    }
                    .animate-float-slow { animation: float-slow 3s ease-in-out infinite; }
                    .animate-ping-slow { animation: ping-slow 2s ease-in-out infinite; }
                    .animate-fade-arrow { animation: fade-arrow 2.5s ease-in-out infinite; }
                `}</style>
            </div>
        )
    }

    // State 2: Status Center (Active User)
    return (
        <div className="flex w-auto items-center">
            <div className={`relative group w-auto transition-all duration-700 hover:scale-[1.02]`}>

                <div className="relative flex items-center gap-2 sm:gap-3 w-auto sm:min-w-[300px]">

                    {/* Advanced Icon Container - Transparent */}
                    <div className="relative flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">

                        {hasCommitsToday ? (
                            // === SAFE STATE: SHIELD & PARTICLES ===
                            <>
                                {/* Shield Glow */}
                                <div className="absolute inset-0 bg-[#2ea043]/10 blur-xl opacity-40 rounded-full" />

                                <ShieldCheck className="text-[#3fb950] relative z-20 drop-shadow-[0_0_10px_rgba(63,185,80,0.5)]" size={24} />

                                {/* Floating Particles (Shield Effect) */}
                                <div className="absolute inset-0 z-10">
                                    <div className="absolute top-2 left-2 w-1 h-1 bg-[#3fb950] rounded-full animate-float-p1 opacity-60" />
                                    <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-[#3fb950] rounded-full animate-float-p2 opacity-40" />
                                    <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-[#3fb950] rounded-full animate-float-p3 opacity-80" />
                                </div>

                                {/* Ripple Pulse */}
                                <div className="absolute inset-0 border-2 border-[#3fb950]/20 rounded-full animate-ripple-slow" />
                            </>
                        ) : (
                            // === STANDBY STATE: MATRIX/BINARY RAIN ===
                            <>
                                {/* Standby Glow */}
                                <div className="absolute inset-0 bg-[#d29922]/10 blur-xl opacity-40 rounded-full" />

                                {/* Matrix Rain Effect (CSS simulated) */}
                                <div className="absolute inset-0 opacity-30 flex justify-between px-2 pointer-events-none overflow-hidden rounded-full">
                                    <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-[#d29922] to-transparent animate-rain-1" />
                                    <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-[#d29922] to-transparent animate-rain-2" />
                                </div>

                                <Bot className="text-[#d29922] relative z-20 drop-shadow-[0_0_8px_rgba(210,153,34,0.6)]" size={24} />

                                {/* Scan Line */}
                                <div className="absolute inset-0 z-10 overflow-hidden rounded-full">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d29922]/80 shadow-[0_0_15px_#d29922] animate-scan-fast" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center mb-0.5 sm:mb-1 gap-1.5 sm:gap-2">
                            <p className={`font-bold text-xs sm:text-[14px] uppercase tracking-wider leading-none 
                                ${hasCommitsToday ? 'text-[#3fb950]' : 'text-[#d29922]'}`}>
                                {hasCommitsToday ? 'Protected' : 'Standby'}
                            </p>

                            {/* Live Indicator Pulse - Moved next to text */}
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasCommitsToday ? 'bg-[#3fb950]' : 'bg-[#d29922]'}`}></span>
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${hasCommitsToday ? 'bg-[#3fb950]' : 'bg-[#d29922]'}`}></span>
                            </span>
                        </div>

                        <p className="text-[#8b949e] text-[10px] sm:text-xs font-medium truncate leading-tight">
                            {hasCommitsToday
                                ? 'Streak safe'
                                : 'Waiting...'}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes breathe {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.02); }
                }
                @keyframes ripple-slow {
                    0% { transform: scale(1); opacity: 0.5; border-width: 2px; }
                    100% { transform: scale(1.5); opacity: 0; border-width: 0px; }
                }
                @keyframes scan-fast {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                @keyframes rain {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                @keyframes float-p {
                    0%, 100% { transform: translate(0,0); }
                    50% { transform: translate(var(--tx), var(--ty)); }
                }
                
                .animate-breathe { animation: breathe 4s ease-in-out infinite; }
                .animate-ripple-slow { animation: ripple-slow 3s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
                .animate-scan-fast { animation: scan-fast 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                
                .animate-rain-1 { animation: rain 2s linear infinite; }
                .animate-rain-2 { animation: rain 2.5s linear infinite 0.5s; }
                .animate-rain-3 { animation: rain 3s linear infinite 1s; }
                
                .animate-float-p1 { --tx: 4px; --ty: -4px; animation: float-p 3s ease-in-out infinite; }
                .animate-float-p2 { --tx: -3px; --ty: -5px; animation: float-p 4s ease-in-out infinite; }
                .animate-float-p3 { --tx: 2px; --ty: 3px; animation: float-p 5s ease-in-out infinite; }
            `}</style>
        </div>
    )
}
