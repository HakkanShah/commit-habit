/**
 * API utilities for frontend error handling
 * Provides consistent error parsing and user-friendly messages
 */

export interface ApiError {
    error: string
    code?: string
    message?: string
}

export interface ApiResult<T> {
    data: T | null
    error: ApiError | null
    status: number
}

/**
 * Parse API response and extract error information
 */
export async function parseApiError(response: Response): Promise<ApiError> {
    try {
        const data = await response.json()
        return {
            error: data.error || data.message || 'An error occurred',
            code: data.code,
            message: data.message || data.error
        }
    } catch {
        // Failed to parse JSON response
        return {
            error: getHttpStatusMessage(response.status),
            code: `HTTP_${response.status}`,
            message: getHttpStatusMessage(response.status)
        }
    }
}

/**
 * Get user-friendly message for HTTP status codes
 */
export function getHttpStatusMessage(status: number): string {
    const messages: Record<number, string> = {
        400: 'Invalid request. Please check your input.',
        401: 'You are not authorized. Please log in again.',
        403: 'You don\'t have permission to perform this action.',
        404: 'The requested resource was not found.',
        409: 'A conflict occurred. Please refresh and try again.',
        429: 'Too many requests. Please wait a moment.',
        500: 'Server error. Please try again later.',
        502: 'Bad gateway. Please try again later.',
        503: 'Service unavailable. Please try again later.',
        504: 'Request timed out. Please try again.'
    }
    return messages[status] || `Request failed (${status})`
}

/**
 * Get user-friendly message from error code
 */
export function getErrorMessage(code: string | undefined, fallback: string): string {
    if (!code) return fallback

    const messages: Record<string, string> = {
        // Auth errors
        'AUTH_001': 'Invalid session. Please log in again.',
        'AUTH_002': 'Your session has expired. Please log in again.',
        'AUTH_005': 'You are not authorized to perform this action.',

        // Validation errors
        'VALIDATION_001': 'Invalid input. Please check your data.',
        'VALIDATION_002': 'Required field is missing.',

        // GitHub errors
        'GITHUB_001': 'GitHub rate limit exceeded. Please wait a moment.',
        'GITHUB_002': 'Repository not found on GitHub.',
        'GITHUB_003': 'Permission denied. Please reinstall the GitHub app.',
        'GITHUB_004': 'GitHub API error. Please try again.',
        'GITHUB_007': 'File was modified. Please refresh and try again.',

        // Database errors
        'DB_003': 'Record not found.',

        // Admin-specific
        'FORBIDDEN': 'You don\'t have permission to perform this action.',
        'NOT_FOUND': 'The requested item was not found.',
        'VALIDATION_ERROR': 'Invalid request. Please check your input.'
    }

    return messages[code] || fallback
}

/**
 * Wrapper for fetch that provides consistent error handling
 */
export async function apiFetch<T>(
    url: string,
    options?: RequestInit
): Promise<ApiResult<T>> {
    try {
        const response = await fetch(url, options)

        if (!response.ok) {
            const error = await parseApiError(response)
            return {
                data: null,
                error,
                status: response.status
            }
        }

        const data = await response.json()
        return {
            data,
            error: null,
            status: response.status
        }
    } catch (err) {
        // Network error or other fetch failure
        return {
            data: null,
            error: {
                error: 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR',
                message: err instanceof Error ? err.message : 'Unknown error'
            },
            status: 0
        }
    }
}

/**
 * Type guard to check if a response is an API error
 */
export function isApiError<T>(result: ApiResult<T>): result is ApiResult<T> & { error: ApiError } {
    return result.error !== null
}
