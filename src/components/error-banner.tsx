'use client'

import { useEffect, useState } from 'react'
import { XCircle, X } from 'lucide-react'
import { parseURLError, clearURLError } from '@/lib/api-client'

interface ErrorBannerProps {
    className?: string
}

/**
 * Displays error messages from URL parameters (OAuth errors, etc.)
 * Auto-clears the URL params after displaying
 */
export function ErrorBanner({ className = '' }: ErrorBannerProps) {
    const [errorInfo, setErrorInfo] = useState<{ error: string; message: string } | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const urlError = parseURLError()
        if (urlError) {
            setErrorInfo(urlError)
            setIsVisible(true)
            // Clear URL params after small delay so user sees the message
            setTimeout(() => clearURLError(), 500)
        }
    }, [])

    const dismiss = () => {
        setIsVisible(false)
        setTimeout(() => setErrorInfo(null), 300)
    }

    if (!errorInfo || !isVisible) return null

    return (
        <div
            className={`
                fixed top-20 left-1/2 transform -translate-x-1/2 z-40
                max-w-md w-full mx-4
                ${className}
            `}
        >
            <div className="alert alert-error shadow-lg animate-slide-in-right">
                <XCircle size={20} className="flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium text-sm">{getErrorTitle(errorInfo.error)}</p>
                    <p className="text-sm opacity-90">{errorInfo.message}</p>
                </div>
                <button
                    onClick={dismiss}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    aria-label="Dismiss error"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}

function getErrorTitle(errorCode: string): string {
    const titles: Record<string, string> = {
        missing_code: 'Login Failed',
        code_expired: 'Login Expired',
        oauth_failed: 'Authentication Failed',
        user_error: 'Login Error',
        server_error: 'Server Error',
        unknown_error: 'Something Went Wrong',
    }
    return titles[errorCode] || 'Error'
}
