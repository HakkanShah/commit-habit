'use client'

import { useEffect, useState } from 'react'
import { XCircle, X } from 'lucide-react'
import { parseURLError, clearURLError } from '@/lib/api-client'
import { playErrorSound, playDismissSound } from '@/lib/sounds'

interface ErrorBannerProps {
    className?: string
}

/**
 * Log error to dev console with structured format
 */
function logClientError(error: string, message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
        console.group('%c[Auth Error]', 'color: #f85149; font-weight: bold;')
        console.log('%cError Code:', 'color: #8b949e;', error)
        console.log('%cMessage:', 'color: #8b949e;', message)
        console.log('%cTimestamp:', 'color: #8b949e;', new Date().toISOString())
        if (context) {
            console.log('%cContext:', 'color: #8b949e;', context)
        }
        console.log('%cURL:', 'color: #8b949e;', window.location.href)
        console.groupEnd()
    }
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
            // Log to dev console for debugging
            logClientError(urlError.error, urlError.message, {
                source: 'URL_PARAM',
                page: window.location.pathname,
            })

            // Play error sound
            playErrorSound()

            setErrorInfo(urlError)
            setIsVisible(true)
            // Clear URL params after small delay so user sees the message
            setTimeout(() => clearURLError(), 500)
        }
    }, [])

    const dismiss = () => {
        playDismissSound()
        setIsVisible(false)
        setTimeout(() => setErrorInfo(null), 300)
    }

    if (!errorInfo || !isVisible) return null

    return (
        <div
            className={`
                fixed top-4 left-4 right-4 z-[100]
                sm:top-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2
                sm:max-w-md sm:w-full
                ${className}
            `}
        >
            <div
                className="
                    bg-[#161b22] border-2 border-[#f85149]/50 rounded-xl
                    p-4 shadow-2xl shadow-black/50
                    animate-in slide-in-from-top-4 fade-in duration-300
                    relative overflow-hidden
                "
                role="alert"
            >
                {/* Red accent bar on left */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f85149]" />

                <div className="flex items-start gap-3 pl-2">
                    <div className="flex-shrink-0 mt-0.5">
                        <XCircle size={20} className="text-[#f85149]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm sm:text-base">
                            {getErrorTitle(errorInfo.error)}
                        </p>
                        <p className="text-sm text-[#c9d1d9] mt-1 leading-relaxed">
                            {errorInfo.message}
                        </p>
                    </div>
                    <button
                        onClick={dismiss}
                        className="flex-shrink-0 text-[#8b949e] hover:text-white transition-colors p-1 -m-1 rounded-lg hover:bg-white/10"
                        aria-label="Dismiss error"
                    >
                        <X size={18} />
                    </button>
                </div>
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

