'use client'

import { useState } from 'react'
import { ExternalLink, Pause, Play, Loader2, GitCommit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

interface ActivityLog {
    id: string
    action: string
    message: string | null
    createdAt: string
}

interface Installation {
    id: string
    installationId: number
    repoFullName: string
    active: boolean
    commitsToday: number
    lastRunAt: string | null
    createdAt: string
    activityLogs: ActivityLog[]
}

interface UpdateResponse {
    success: boolean
    installation?: Installation
    message?: string
}

export function InstallationCard({ installation }: { installation: Installation }) {
    const [isActive, setIsActive] = useState(installation.active)
    const [isLoading, setIsLoading] = useState(false)
    const { success, error: showError } = useToast()
    const router = useRouter()

    const toggle = async () => {
        setIsLoading(true)
        const result = await apiFetch<UpdateResponse>('/api/installations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installationId: installation.id, active: !isActive }),
        })
        setIsLoading(false)

        if (result.error) {
            if (result.error.isAuthError) router.push('/api/auth/github')
            else showError(result.error.message)
            return
        }

        setIsActive(!isActive)
        success(!isActive ? 'Resumed' : 'Paused')
    }

    const repoName = installation.repoFullName.split('/')[1] || installation.repoFullName

    return (
        <div className="flex items-center gap-3 p-4 active:bg-[#21262d] transition-colors touch-manipulation">
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#238636]/20 text-[#39d353]' : 'bg-[#21262d] text-[#8b949e]'}`}>
                <GitCommit size={18} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <a
                    href={`https://github.com/${installation.repoFullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sm truncate block hover:text-[#58a6ff]"
                >
                    {repoName}
                </a>
                <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                    <span>{installation.commitsToday}/5 today</span>
                    <span>•</span>
                    <span className={isActive ? 'text-[#39d353]' : 'text-[#8b949e]'}>
                        {isActive ? 'Active' : 'Paused'}
                    </span>
                </div>
            </div>

            {/* Toggle Button - Touch Friendly */}
            <button
                onClick={toggle}
                disabled={isLoading}
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors touch-manipulation ${isActive ? 'bg-[#21262d] text-[#8b949e] hover:text-white' : 'bg-[#238636]/20 text-[#39d353]'}`}
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : isActive ? <Pause size={18} /> : <Play size={18} />}
            </button>
        </div>
    )
}
