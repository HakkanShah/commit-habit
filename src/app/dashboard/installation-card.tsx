'use client'

import { useState } from 'react'
import { ExternalLink, Pause, Play, Clock, Loader2, GitCommit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

// ============================================================================
// Types
// ============================================================================

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

interface InstallationCardProps {
    installation: Installation
    onUpdate?: () => void
}

interface UpdateResponse {
    success: boolean
    installation?: Installation
    message?: string
}

// ============================================================================
// Component
// ============================================================================

export function InstallationCard({ installation, onUpdate }: InstallationCardProps) {
    const [isActive, setIsActive] = useState(installation.active)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { success, error: showError } = useToast()
    const router = useRouter()

    const toggleActive = async (retryCount = 0) => {
        setIsLoading(true)
        setError(null)

        const result = await apiFetch<UpdateResponse>('/api/installations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                installationId: installation.id,
                active: !isActive,
            }),
        })

        setIsLoading(false)

        if (result.error) {
            const { message, isRetryable, isAuthError } = result.error

            if (isAuthError) {
                showError('Session expired', 'Please log in again')
                router.push('/api/auth/github')
                return
            }

            if (isRetryable && retryCount < 2) {
                toggleActive(retryCount + 1)
            } else {
                setError(message)
                showError(message)
            }
            return
        }

        setIsActive(!isActive)
        success(
            !isActive ? 'Automation resumed' : 'Automation paused',
            `${installation.repoFullName} is now ${!isActive ? 'active' : 'paused'}`
        )
        onUpdate?.()
    }

    return (
        <div className="group hover:bg-[#161b22] transition-colors p-4">
            <div className="flex items-start justify-between gap-4">

                {/* Repo Info Col */}
                <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded bg-[#0d1117] border border-[#30363d] ${isActive ? 'text-[#39d353]' : 'text-gray-600'}`}>
                        <GitCommit size={18} />
                    </div>
                    <div>
                        <a href={`https://github.com/${installation.repoFullName}`} target="_blank" rel="noreferrer" className="text-[#58a6ff] hover:underline font-bold font-mono text-sm flex items-center gap-2">
                            {installation.repoFullName}
                            <ExternalLink size={12} className="opacity-50" />
                        </a>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>last_run: {installation.lastRunAt ? formatDate(installation.lastRunAt) : 'never'}</span>
                            </div>
                            <div>
                                <span>commits_today: <span className={installation.commitsToday >= 5 ? 'text-[#d29922]' : 'text-gray-400'}>{installation.commitsToday}/5</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Toggle (Switch Style) */}
                <div className="flex items-center gap-4">
                    <div className={`text-xs font-mono px-2 py-0.5 rounded border ${isActive ? 'bg-[#39d353]/10 border-[#39d353]/30 text-[#39d353]' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        {isActive ? 'active' : 'paused'}
                    </div>

                    <button
                        onClick={() => toggleActive()}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#30363d] rounded"
                        aria-label={isActive ? "Pause automation" : "Resume automation"}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : (isActive ? <Pause size={16} /> : <Play size={16} />)}
                    </button>
                </div>
            </div>

            {/* Error Line */}
            {error && (
                <div className="mt-3 pl-12 text-xs font-mono text-[#f85149] flex items-center gap-2">
                    <span>⚠ error: {error}</span>
                </div>
            )}

            {/* Recent Log (Only 1 latest line) */}
            {installation.activityLogs.length > 0 && (
                <div className="mt-3 pl-14">
                    <div className="font-mono text-xs text-gray-500 truncate opacity-60">
                        $ {installation.activityLogs[0].action} - {installation.activityLogs[0].message || 'completed'}
                    </div>
                </div>
            )}
        </div>
    )
}
