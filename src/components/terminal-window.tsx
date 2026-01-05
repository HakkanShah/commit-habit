'use client'

import { ReactNode } from 'react'

interface TerminalWindowProps {
    title?: string
    children: ReactNode
    className?: string
}

export function TerminalWindow({ title = 'bash', children, className = '' }: TerminalWindowProps) {
    return (
        <div className={`bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden shadow-2xl flex flex-col ${className}`}>
            {/* Window Bar */}
            <div className="bg-[#161b22] px-4 py-2 flex items-center gap-4 border-b border-[#30363d] select-none">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
                </div>
                <div className="text-xs text-gray-500 font-mono flex-1 text-center pr-12">
                    {title} — 80x24
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 font-mono text-sm text-[#c9d1d9] overflow-x-auto">
                {children}
            </div>
        </div>
    )
}

export function TerminalLine({ children, prompt = true }: { children: ReactNode, prompt?: boolean }) {
    return (
        <div className="flex gap-3 mb-1 min-h-[20px]">
            {prompt && (
                <span className="text-[#39d353] select-none flex-shrink-0">➜ ~</span>
            )}
            <div className="break-all">
                {children}
            </div>
        </div>
    )
}
