'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { playSound, SoundType } from '@/lib/sounds'

// ============================================================================
// Types
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
    /** If true, don't play sound for this toast */
    silent?: boolean
}

interface ToastContextValue {
    toasts: Toast[]
    showToast: (toast: Omit<Toast, 'id'>) => void
    dismissToast: (id: string) => void
    success: (title: string, message?: string, silent?: boolean) => void
    error: (title: string, message?: string, action?: Toast['action'], silent?: boolean) => void
    warning: (title: string, message?: string, silent?: boolean) => void
    info: (title: string, message?: string, silent?: boolean) => void
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

let toastIdCounter = 0

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

// ============================================================================
// Provider
// ============================================================================

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastIdCounter}`
        const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000)

        // Play sound effect unless silenced
        if (!toast.silent) {
            playSound(toast.type as SoundType)
        }

        setToasts(prev => [...prev, { ...toast, id }])

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(() => dismissToast(id), duration)
        }
    }, [dismissToast])

    const success = useCallback((title: string, message?: string, silent?: boolean) => {
        showToast({ type: 'success', title, message, silent })
    }, [showToast])

    const error = useCallback((title: string, message?: string, action?: Toast['action'], silent?: boolean) => {
        showToast({ type: 'error', title, message, action, silent })
    }, [showToast])

    const warning = useCallback((title: string, message?: string, silent?: boolean) => {
        showToast({ type: 'warning', title, message, silent })
    }, [showToast])

    const info = useCallback((title: string, message?: string, silent?: boolean) => {
        showToast({ type: 'info', title, message, silent })
    }, [showToast])

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}

// ============================================================================
// Toast Container
// ============================================================================

function ToastContainer({
    toasts,
    onDismiss,
}: {
    toasts: Toast[]
    onDismiss: (id: string) => void
}) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 left-4 right-4 sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-3 sm:max-w-sm sm:w-full">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

// ============================================================================
// Toast Item
// ============================================================================

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast
    onDismiss: (id: string) => void
}) {
    const styles = {
        success: {
            bg: 'bg-[#0d1117]',
            border: 'border-[#238636]',
            icon: <CheckCircle size={20} className="text-[#3fb950]" />,
            accent: 'bg-[#238636]',
        },
        error: {
            bg: 'bg-[#0d1117]',
            border: 'border-[#f85149]',
            icon: <XCircle size={20} className="text-[#f85149]" />,
            accent: 'bg-[#da3633]',
        },
        warning: {
            bg: 'bg-[#0d1117]',
            border: 'border-[#d29922]',
            icon: <AlertCircle size={20} className="text-[#d29922]" />,
            accent: 'bg-[#9e6a03]',
        },
        info: {
            bg: 'bg-[#0d1117]',
            border: 'border-[#58a6ff]',
            icon: <Info size={20} className="text-[#58a6ff]" />,
            accent: 'bg-[#1f6feb]',
        },
    }

    const style = styles[toast.type]

    return (
        <div
            className={`
                ${style.bg} ${style.border}
                border-2 rounded-xl p-4 shadow-2xl
                animate-in slide-in-from-bottom-4 fade-in duration-300
                relative overflow-hidden
            `}
            role="alert"
        >
            {/* Accent bar on left */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent}`} />

            <div className="flex items-start gap-3 pl-2">
                <div className="flex-shrink-0 mt-0.5">
                    {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{toast.title}</p>
                    {toast.message && (
                        <p className="text-sm text-[#8b949e] mt-1">{toast.message}</p>
                    )}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="text-sm font-medium text-[#58a6ff] hover:underline mt-2"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 text-[#8b949e] hover:text-white transition-colors p-1 -m-1 rounded-lg hover:bg-white/10"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}

