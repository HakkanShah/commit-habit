/**
 * Frontend API Error Handling Utilities
 * 
 * Provides consistent error handling for API calls with:
 * - User-friendly error messages
 * - Error type detection
 * - Retry support
 */

// ============================================================================
// Types
// ============================================================================

export interface APIError {
    error: string
    code: string
    message: string
}

export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: APIError
}

export interface FetchResult<T> {
    data: T | null
    error: ParsedError | null
    status: number
}

export interface ParsedError {
    message: string
    code: string
    isRetryable: boolean
    isAuthError: boolean
    isNetworkError: boolean
    suggestedAction: string
}

// ============================================================================
// Error Code Mappings
// ============================================================================

const ERROR_MESSAGES: Record<string, { message: string; action: string }> = {
    // Auth errors
    AUTH_001: { message: 'Invalid session', action: 'Please log in again' },
    AUTH_002: { message: 'Session expired', action: 'Please log in again' },
    AUTH_003: { message: 'Login failed', action: 'Please try again' },
    AUTH_004: { message: 'Login link expired', action: 'Please try logging in again' },
    AUTH_005: { message: 'Not authorized', action: 'Please log in to continue' },

    // GitHub errors
    GITHUB_001: { message: 'Rate limit exceeded', action: 'Please wait a moment and try again' },
    GITHUB_002: { message: 'Resource not found', action: 'The item may have been deleted' },
    GITHUB_003: { message: 'Permission denied', action: 'Please reinstall the GitHub app' },
    GITHUB_004: { message: 'GitHub error', action: 'Please try again later' },
    GITHUB_005: { message: 'Connection failed', action: 'Please check your internet connection' },
    GITHUB_006: { message: 'Request timed out', action: 'Please try again' },
    GITHUB_007: { message: 'Conflict detected', action: 'Please refresh and try again' },

    // Database errors
    DB_001: { message: 'Database connection error', action: 'Please try again later' },
    DB_002: { message: 'Database error', action: 'Please try again later' },
    DB_003: { message: 'Not found', action: 'The item may have been deleted' },

    // Validation errors
    VALIDATION_001: { message: 'Invalid input', action: 'Please check your input and try again' },
    VALIDATION_002: { message: 'Missing required field', action: 'Please fill in all required fields' },

    // Default
    UNKNOWN_001: { message: 'An unexpected error occurred', action: 'Please try again later' },
}

// ============================================================================
// Client-Side Error Logging
// ============================================================================

export interface ClientErrorContext {
    source?: string
    action?: string
    endpoint?: string
    statusCode?: number
    [key: string]: unknown
}

/**
 * Log error to browser console with structured format for debugging
 * Works in development and production for client-side debugging
 */
export function logClientError(
    error: ParsedError | APIError | { code: string; message: string },
    context?: ClientErrorContext
): void {
    if (typeof window === 'undefined') return

    const code = 'code' in error ? error.code : 'UNKNOWN'
    const message = 'message' in error ? error.message : String(error)
    const isRetryable = 'isRetryable' in error ? error.isRetryable : false
    const suggestedAction = 'suggestedAction' in error ? error.suggestedAction : undefined

    // Styled console output for visibility
    console.group(
        '%c[API Error]',
        'color: #f85149; font-weight: bold; background: #161b22; padding: 2px 6px; border-radius: 4px;'
    )
    console.log('%cCode:', 'color: #8b949e; font-weight: 600;', code)
    console.log('%cMessage:', 'color: #8b949e; font-weight: 600;', message)

    if (suggestedAction) {
        console.log('%cSuggested Action:', 'color: #58a6ff; font-weight: 600;', suggestedAction)
    }

    if (isRetryable) {
        console.log('%cRetryable:', 'color: #39d353; font-weight: 600;', 'Yes')
    }

    if (context && Object.keys(context).length > 0) {
        console.log('%cContext:', 'color: #d29922; font-weight: 600;', context)
    }

    console.log('%cTimestamp:', 'color: #8b949e;', new Date().toISOString())
    console.log('%cURL:', 'color: #8b949e;', window.location.href)
    console.groupEnd()
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Parse an API error response into a user-friendly format
 */
export function parseAPIError(response: Response, body?: unknown): ParsedError {
    // Network/fetch errors
    if (!response.ok && response.status === 0) {
        return {
            message: 'Unable to connect to the server',
            code: 'NETWORK_ERROR',
            isRetryable: true,
            isAuthError: false,
            isNetworkError: true,
            suggestedAction: 'Please check your internet connection',
        }
    }

    // Parse error code from body
    let code = 'UNKNOWN_001'
    let serverMessage = ''

    if (body && typeof body === 'object') {
        const errorBody = body as Record<string, unknown>
        code = String(errorBody.code || 'UNKNOWN_001')
        serverMessage = String(errorBody.message || errorBody.error || '')
    }

    // Get error details from mapping
    const errorDetails = ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_001

    // Determine if retryable based on status code and error type
    const isRetryable =
        response.status >= 500 ||
        response.status === 429 ||
        code.startsWith('GITHUB_005') ||
        code.startsWith('GITHUB_006') ||
        code.startsWith('DB_001')

    // Determine if auth error
    const isAuthError =
        response.status === 401 ||
        code.startsWith('AUTH_')

    return {
        message: serverMessage || errorDetails.message,
        code,
        isRetryable,
        isAuthError,
        isNetworkError: false,
        suggestedAction: errorDetails.action,
    }
}

/**
 * Parse URL error parameters (for OAuth callbacks)
 */
export function parseURLError(): { error: string; message: string } | null {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const message = params.get('message')

    if (!error) return null

    return {
        error,
        message: message || getErrorMessage(error),
    }
}

/**
 * Get a user-friendly error message for an error code
 */
export function getErrorMessage(code: string): string {
    const details = ERROR_MESSAGES[code]
    return details?.message || 'An unexpected error occurred'
}

/**
 * Clear error parameters from URL
 */
export function clearURLError(): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    url.searchParams.delete('message')
    window.history.replaceState({}, '', url.toString())
}

// ============================================================================
// API Fetch Wrapper
// ============================================================================

interface FetchOptions extends RequestInit {
    timeout?: number
    /** Enable automatic error logging to browser console (default: true) */
    logErrors?: boolean
}

/**
 * Fetch wrapper with error handling, timeout, and auto-logging
 */
export async function apiFetch<T>(
    url: string,
    options: FetchOptions = {}
): Promise<FetchResult<T>> {
    const { timeout = 30000, logErrors = true, ...fetchOptions } = options

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        let body: unknown
        try {
            body = await response.json()
        } catch {
            body = null
        }

        if (!response.ok) {
            const parsedError = parseAPIError(response, body)

            // Auto-log error to console for debugging
            if (logErrors) {
                logClientError(parsedError, {
                    endpoint: url,
                    statusCode: response.status,
                    method: fetchOptions.method || 'GET',
                })
            }

            return {
                data: null,
                error: parsedError,
                status: response.status,
            }
        }

        return {
            data: body as T,
            error: null,
            status: response.status,
        }
    } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                data: null,
                error: {
                    message: 'Request timed out',
                    code: 'TIMEOUT',
                    isRetryable: true,
                    isAuthError: false,
                    isNetworkError: false,
                    suggestedAction: 'Please try again',
                },
                status: 0,
            }
        }

        // Handle network errors
        return {
            data: null,
            error: {
                message: 'Unable to connect to the server',
                code: 'NETWORK_ERROR',
                isRetryable: true,
                isAuthError: false,
                isNetworkError: true,
                suggestedAction: 'Please check your internet connection',
            },
            status: 0,
        }
    }
}

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryOptions {
    maxRetries?: number
    delayMs?: number
    onRetry?: (attempt: number) => void
}

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<FetchResult<T>>,
    options: RetryOptions = {}
): Promise<FetchResult<T>> {
    const { maxRetries = 3, delayMs = 1000, onRetry } = options

    let lastResult: FetchResult<T> | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await fn()
        lastResult = result

        // Success or non-retryable error
        if (!result.error || !result.error.isRetryable) {
            return result
        }

        // Don't retry on last attempt
        if (attempt >= maxRetries) {
            break
        }

        // Notify about retry
        onRetry?.(attempt + 1)

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
    }

    return lastResult!
}
