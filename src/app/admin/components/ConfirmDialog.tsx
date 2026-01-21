'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    title: string
    description: string
    confirmText?: string
    confirmType?: 'danger' | 'warning' | 'default'
    requireConfirmText?: string // If set, user must type this to confirm
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    confirmType = 'default',
    requireConfirmText
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-focus input when dialog opens
    useEffect(() => {
        if (open && requireConfirmText && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open, requireConfirmText])

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setInputValue('')
            setError(null)
            setSuccess(false)
        }
    }, [open])

    const handleConfirm = useCallback(async () => {
        if (requireConfirmText && inputValue !== requireConfirmText) {
            setError(`Please type "${requireConfirmText}" to confirm`)
            inputRef.current?.focus()
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onConfirm()
            setSuccess(true)
            setTimeout(() => {
                setInputValue('')
                setSuccess(false)
                onClose()
            }, 500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [inputValue, requireConfirmText, onConfirm, onClose])

    const handleClose = useCallback(() => {
        if (!loading) {
            setInputValue('')
            setError(null)
            onClose()
        }
    }, [loading, onClose])

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open && !loading) {
                handleClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [open, loading, handleClose])

    // Handle enter key for confirmation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading && (!requireConfirmText || inputValue === requireConfirmText)) {
            handleConfirm()
        }
    }

    if (!open) return null

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        default: 'bg-[#39d353] hover:bg-[#2ea043] focus:ring-[#39d353]'
    }

    const iconColors = {
        danger: { bg: 'bg-red-500/10', text: 'text-red-400' },
        warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
        default: { bg: 'bg-green-500/10', text: 'text-green-400' }
    }

    const isConfirmDisabled = loading || success || (requireConfirmText && inputValue !== requireConfirmText)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-in"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div
                className="relative bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl scale-in"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${iconColors[confirmType].bg} flex items-center justify-center transition-transform hover:scale-105`}>
                            {success ? (
                                <CheckCircle className="w-5 h-5 text-green-400 check-animate" />
                            ) : (
                                <AlertTriangle className={`w-5 h-5 ${iconColors[confirmType].text}`} />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all disabled:opacity-50 press-effect"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>

                    {requireConfirmText && (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-500">
                                Type <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{requireConfirmText}</span> to confirm:
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value)
                                    setError(null)
                                }}
                                placeholder={requireConfirmText}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#39d353]/30 focus:border-[#39d353]/30 transition-all placeholder:text-gray-600"
                                disabled={loading || success}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 fade-in">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
                    <button
                        onClick={handleClose}
                        disabled={loading || success}
                        className="px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-50 press-effect"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!!isConfirmDisabled}
                        className={`
                            px-5 py-2.5 text-sm font-medium text-white rounded-xl 
                            transition-all disabled:opacity-50 
                            flex items-center gap-2 press-effect
                            ${success ? 'bg-green-600' : buttonColors[confirmType]}
                        `}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : success ? (
                            <CheckCircle className="w-4 h-4 check-animate" />
                        ) : null}
                        {success ? 'Done!' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
