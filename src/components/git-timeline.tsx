'use client'

import { ReactNode } from 'react'

interface GitTimelineProps {
    children: ReactNode
}

export function GitTimeline({ children }: GitTimelineProps) {
    return (
        <div className="relative pl-8 md:pl-16">
            {/* The Main Branch Line */}
            <div className="absolute left-[19px] md:left-[35px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#2f363d] to-transparent" />

            {/* Content using slots or just children mapped */}
            <div className="flex flex-col gap-24 py-12">
                {children}
            </div>
        </div>
    )
}

interface TimelineItemProps {
    hash?: string
    message?: string
    author?: string
    date?: string
    icon?: ReactNode
    children: ReactNode
}

export function TimelineItem({ hash, message, author, date, icon, children }: TimelineItemProps) {
    return (
        <div className="relative group">
            {/* Commit Node Dot */}
            <div className="absolute -left-[27px] md:-left-[43px] top-0 flex items-center justify-center w-[30px] h-[30px]">
                <div className="w-3 h-3 rounded-full bg-[#2f363d] ring-4 ring-[#0d1117] group-hover:bg-[#58a6ff] group-hover:scale-125 transition-all duration-300" />
            </div>

            {/* Commit Metadata Label (Desktop) */}
            <div className="absolute -left-[160px] top-1 hidden lg:block text-right w-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs font-mono text-[#58a6ff]">{hash}</div>
                <div className="text-[10px] text-gray-500">{date}</div>
            </div>

            {/* Content */}
            <div className="opacity-90 group-hover:opacity-100 transition-opacity">
                {children}
            </div>
        </div>
    )
}
