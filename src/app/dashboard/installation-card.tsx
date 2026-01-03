'use client'

import { useState } from 'react'
import { ExternalLink, Pause, Play, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
}

export function InstallationCard({ installation }: InstallationCardProps) {
    const [isActive, setIsActive] = useState(installation.active)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const toggleActive = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/installations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    installationId: installation.id,
                    active: !isActive,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update')
            }

            setIsActive(!isActive)
        } catch {
            setError('Failed to update. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = () => {
        if (!isActive) {
            return (
                <span className="badge badge-warning">
                    <Pause size={12} />
                    Paused
                </span>
            )
        }
        return (
            <span className="badge badge-success">
                <span className="status-dot active"></span>
                Active
            </span>
        )
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'commit_created':
                return <CheckCircle size={14} className="text-[var(--accent)]" />
            case 'skipped_has_commits':
                return <CheckCircle size={14} className="text-[var(--muted)]" />
            case 'skipped_daily_limit':
                return <AlertCircle size={14} className="text-[var(--warning)]" />
            case 'error':
                return <XCircle size={14} className="text-[var(--danger)]" />
            case 'paused':
                return <Pause size={14} className="text-[var(--warning)]" />
            case 'resumed':
                return <Play size={14} className="text-[var(--accent)]" />
            default:
                return <Clock size={14} className="text-[var(--muted)]" />
        }
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'commit_created':
                return 'Commit created'
            case 'skipped_has_commits':
                return 'Skipped (has real commits)'
            case 'skipped_daily_limit':
                return 'Skipped (daily limit)'
            case 'skipped_no_readme':
                return 'Skipped (no README)'
            case 'error':
                return 'Error'
            case 'paused':
                return 'Paused'
            case 'resumed':
                return 'Resumed'
            default:
                return action
        }
    }

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                        <span className="text-lg">📁</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <a
                                href={`https://github.com/${installation.repoFullName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold hover:text-[var(--primary)] flex items-center gap-1"
                            >
                                {installation.repoFullName}
                                <ExternalLink size={14} />
                            </a>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                            Connected {formatDate(installation.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {getStatusBadge()}
                    <button
                        onClick={toggleActive}
                        disabled={isLoading}
                        className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'} text-sm py-2`}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isActive ? (
                            <>
                                <Pause size={16} />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                Resume
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-[var(--danger)] mb-4 flex items-center gap-1">
                    <XCircle size={14} />
                    {error}
                </div>
            )}

            {/* Stats Row */}
            <div className="flex gap-6 mb-4 text-sm">
                <div>
                    <span className="text-[var(--muted)]">Commits Today:</span>{' '}
                    <span className="font-medium">{installation.commitsToday}/5</span>
                </div>
                <div>
                    <span className="text-[var(--muted)]">Last Run:</span>{' '}
                    <span className="font-medium">{formatDate(installation.lastRunAt)}</span>
                </div>
            </div>

            {/* Activity Log */}
            {installation.activityLogs.length > 0 && (
                <div className="border-t border-[var(--border)] pt-4 mt-4">
                    <p className="text-sm font-medium mb-2">Recent Activity</p>
                    <div className="space-y-2">
                        {installation.activityLogs.slice(0, 3).map((log) => (
                            <div key={log.id} className="flex items-center gap-2 text-sm">
                                {getActionIcon(log.action)}
                                <span className="text-[var(--muted)]">
                                    {getActionLabel(log.action)}
                                    {log.message && ` - ${log.message}`}
                                </span>
                                <span className="text-xs text-[var(--muted)] ml-auto">
                                    {formatDate(log.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
