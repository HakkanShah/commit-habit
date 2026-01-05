'use client'

import { useState } from 'react'
import { ExternalLink, Pause, Play, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RotateCcw, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/toast'
import { apiFetch } from '@/lib/api-client'

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
// Action Label & Icon Helpers
// ============================================================================

const ACTION_CONFIG: Record<string, { icon: 'success' | 'muted' | 'warning' | 'danger' | 'primary' | 'default'; label: string }> = {
    commit_created: { icon: 'success', label: 'Commit created' },
    skipped_has_commits: { icon: 'muted', label: 'Skipped (has real commits)' },
    skipped_daily_limit: { icon: 'warning', label: 'Skipped (daily limit)' },
    skipped_no_readme: { icon: 'warning', label: 'Skipped (no README)' },
    error: { icon: 'danger', label: 'Error' },
    error_permission: { icon: 'danger', label: 'Permission error' },
    error_not_found: { icon: 'danger', label: 'Repository not found' },
    error_rate_limited: { icon: 'warning', label: 'Rate limited' },
    error_conflict: { icon: 'warning', label: 'Conflict' },
    error_network: { icon: 'danger', label: 'Network error' },
    error_unknown: { icon: 'danger', label: 'Error' },
    paused: { icon: 'warning', label: 'Paused' },
    resumed: { icon: 'primary', label: 'Resumed' },
}

function getActionConfig(action: string): { icon: string; label: string } {
    return ACTION_CONFIG[action] || { icon: 'default', label: action }
}

// ============================================================================
// Component
// ============================================================================

export function InstallationCard({ installation, onUpdate }: InstallationCardProps) {
    const [isActive, setIsActive] = useState(installation.active)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { success, error: showError } = useToast()

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
            const { message, isRetryable, isAuthError, suggestedAction } = result.error

            // Handle auth errors - redirect to login
            if (isAuthError) {
                showError('Session expired', 'Please log in again')
                setTimeout(() => {
                    window.location.href = '/api/auth/github'
                }, 2000)
                return
            }

            // Show error with retry option if retryable
            if (isRetryable && retryCount < 2) {
                showError(
                    message,
                    suggestedAction,
                    {
                        label: 'Retry',
                        onClick: () => toggleActive(retryCount + 1),
                    }
                )
            } else {
                setError(message)
                showError(message, suggestedAction)
            }
            return
        }

        // Success
        setIsActive(!isActive)
        success(
            isActive ? 'Automation paused' : 'Automation resumed',
            `${installation.repoFullName} has been ${isActive ? 'paused' : 'resumed'}`
        )
        onUpdate?.()
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
        const config = getActionConfig(action)
        const iconProps = { size: 14 }

        switch (config.icon) {
            case 'success':
                return <CheckCircle {...iconProps} className="text-[var(--accent)]" />
            case 'muted':
                return <CheckCircle {...iconProps} className="text-[var(--muted)]" />
            case 'warning':
                return <AlertCircle {...iconProps} className="text-[var(--warning)]" />
            case 'danger':
                return <XCircle {...iconProps} className="text-[var(--danger)]" />
            case 'primary':
                return <Play {...iconProps} className="text-[var(--primary)]" />
            default:
                return <Clock {...iconProps} className="text-[var(--muted)]" />
        }
    }

    const getActionLabel = (action: string) => {
        return getActionConfig(action).label
    }

    const hasRecentError = installation.activityLogs.some(
        log => log.action.startsWith('error_') || log.action === 'error'
    )

    return (
        <div className={`card ${hasRecentError ? 'border-[var(--danger)]/30' : ''}`}>
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
                        onClick={() => toggleActive()}
                        disabled={isLoading}
                        className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'} text-sm py-2`}
                        aria-label={isActive ? 'Pause automation' : 'Resume automation'}
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

            {/* Inline Error with Retry */}
            {error && (
                <div className="alert alert-error mb-4">
                    <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                    <button
                        onClick={() => toggleActive()}
                        className="flex items-center gap-1 text-sm hover:underline"
                        disabled={isLoading}
                    >
                        <RotateCcw size={14} />
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Row */}
            <div className="flex gap-6 mb-4 text-sm">
                <div>
                    <span className="text-[var(--muted)]">Commits Today:</span>{' '}
                    <span className={`font-medium ${installation.commitsToday >= 5 ? 'text-[var(--warning)]' : ''}`}>
                        {installation.commitsToday}/5
                    </span>
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
                                <span className="text-[var(--muted)] truncate flex-1">
                                    {getActionLabel(log.action)}
                                    {log.message && ` - ${log.message}`}
                                </span>
                                <span className="text-xs text-[var(--muted)] flex-shrink-0">
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
