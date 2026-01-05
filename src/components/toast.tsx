'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

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
}

interface ToastContextValue {
    toasts: Toast[]
    showToast: (toast: Omit<Toast, 'id'>) => void
    dismissToast: (id: string) => void
    success: (title: string, message?: string) => void
    error: (title: string, message?: string, action?: Toast['action']) => void
    warning: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
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

        setToasts(prev => [...prev, { ...toast, id }])

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(() => dismissToast(id), duration)
        }
    }, [dismissToast])

    const success = useCallback((title: string, message?: string) => {
        showToast({ type: 'success', title, message })
    }, [showToast])

    const error = useCallback((title: string, message?: string, action?: Toast['action']) => {
        showToast({ type: 'error', title, message, action })
    }, [showToast])

    const warning = useCallback((title: string, message?: string) => {
        showToast({ type: 'warning', title, message })
    }, [showToast])

    const info = useCallback((title: string, message?: string) => {
        showToast({ type: 'info', title, message })
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
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
    const icons = {
        success: <CheckCircle size={18} className="text-[var(--accent)]" />,
        error: <XCircle size={18} className="text-[var(--danger)]" />,
        warning: <AlertCircle size={18} className="text-[var(--warning)]" />,
        info: <Info size={18} className="text-[var(--primary)]" />,
    }

    const bgColors = {
        success: 'bg-[var(--accent)]/10 border-[var(--accent)]/30',
        error: 'bg-[var(--danger)]/10 border-[var(--danger)]/30',
        warning: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
        info: 'bg-[var(--primary)]/10 border-[var(--primary)]/30',
    }

    return (
        <div
            className={`
                pointer-events-auto
                ${bgColors[toast.type]}
                border rounded-lg p-4 shadow-lg
                bg-[var(--card)] backdrop-blur-sm
                animate-slide-in-right
            `}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[toast.type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{toast.title}</p>
                    {toast.message && (
                        <p className="text-sm text-[var(--muted)] mt-1">{toast.message}</p>
                    )}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="text-sm font-medium text-[var(--primary)] hover:underline mt-2"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
