'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Error boundary component to catch React rendering errors.
 * Displays a friendly error message and allows recovery.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        console.error('[ErrorBoundary] Caught error:', error, errorInfo)

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo)
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-400 mb-4 max-w-md">
                        An unexpected error occurred. Please try again or refresh the page.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mb-4 text-left w-full max-w-md">
                            <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                                Error details (dev only)
                            </summary>
                            <pre className="mt-2 p-3 bg-red-500/10 rounded-lg text-xs text-red-300 overflow-x-auto">
                                {this.state.error.message}
                                {this.state.error.stack && (
                                    <span className="block mt-2 text-red-400/60">
                                        {this.state.error.stack}
                                    </span>
                                )}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Functional wrapper for ErrorBoundary with render prop pattern
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}
