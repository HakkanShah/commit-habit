/**
 * Custom Error Classes for Commit Habit
 * 
 * Provides structured error handling with:
 * - User-friendly messages for the frontend
 * - Developer-detailed messages for logging
 * - Error codes for programmatic handling
 */

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCode = {
    // Configuration errors (1xx)
    CONFIG_MISSING_ENV: 'CONFIG_001',
    CONFIG_INVALID_ENV: 'CONFIG_002',

    // Authentication errors (2xx)
    AUTH_INVALID_TOKEN: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_OAUTH_FAILED: 'AUTH_003',
    AUTH_CODE_EXPIRED: 'AUTH_004',
    AUTH_UNAUTHORIZED: 'AUTH_005',

    // GitHub API errors (3xx)
    GITHUB_RATE_LIMITED: 'GITHUB_001',
    GITHUB_NOT_FOUND: 'GITHUB_002',
    GITHUB_PERMISSION_DENIED: 'GITHUB_003',
    GITHUB_API_ERROR: 'GITHUB_004',
    GITHUB_NETWORK_ERROR: 'GITHUB_005',
    GITHUB_TIMEOUT: 'GITHUB_006',
    GITHUB_CONFLICT: 'GITHUB_007',

    // Database errors (4xx)
    DB_CONNECTION_ERROR: 'DB_001',
    DB_QUERY_ERROR: 'DB_002',
    DB_NOT_FOUND: 'DB_003',

    // Validation errors (5xx)
    VALIDATION_INVALID_INPUT: 'VALIDATION_001',
    VALIDATION_MISSING_FIELD: 'VALIDATION_002',

    // Webhook errors (6xx)
    WEBHOOK_INVALID_SIGNATURE: 'WEBHOOK_001',
    WEBHOOK_PROCESSING_ERROR: 'WEBHOOK_002',

    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_001',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

// ============================================================================
// Base Error Class
// ============================================================================

export interface ErrorDetails {
    code: ErrorCodeType
    userMessage: string
    developerMessage: string
    statusCode: number
    context?: Record<string, unknown>
    cause?: Error
    retryable?: boolean
    retryAfterMs?: number
}

export class AppError extends Error {
    public readonly code: ErrorCodeType
    public readonly userMessage: string
    public readonly developerMessage: string
    public readonly statusCode: number
    public readonly context: Record<string, unknown>
    public readonly cause?: Error
    public readonly retryable: boolean
    public readonly retryAfterMs?: number
    public readonly timestamp: string

    constructor(details: ErrorDetails) {
        super(details.developerMessage)
        this.name = this.constructor.name
        this.code = details.code
        this.userMessage = details.userMessage
        this.developerMessage = details.developerMessage
        this.statusCode = details.statusCode
        this.context = details.context ?? {}
        this.cause = details.cause
        this.retryable = details.retryable ?? false
        this.retryAfterMs = details.retryAfterMs
        this.timestamp = new Date().toISOString()

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }

    /**
     * Serialize error for API responses (user-safe)
     */
    toUserResponse(): { error: string; code: string; message: string } {
        return {
            error: this.userMessage,
            code: this.code,
            message: this.userMessage,
        }
    }

    /**
     * Serialize error for logging (developer-detailed)
     */
    toLogObject(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            developerMessage: this.developerMessage,
            userMessage: this.userMessage,
            statusCode: this.statusCode,
            context: this.context,
            retryable: this.retryable,
            retryAfterMs: this.retryAfterMs,
            timestamp: this.timestamp,
            stack: this.stack,
            cause: this.cause?.message,
        }
    }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

export class ConfigurationError extends AppError {
    constructor(
        developerMessage: string,
        context?: Record<string, unknown>,
        cause?: Error
    ) {
        super({
            code: ErrorCode.CONFIG_MISSING_ENV,
            userMessage: 'Service is temporarily unavailable. Please try again later.',
            developerMessage,
            statusCode: 500,
            context,
            cause,
            retryable: false,
        })
    }
}

export class AuthenticationError extends AppError {
    constructor(
        code: ErrorCodeType,
        userMessage: string,
        developerMessage: string,
        context?: Record<string, unknown>,
        cause?: Error
    ) {
        super({
            code,
            userMessage,
            developerMessage,
            statusCode: 401,
            context,
            cause,
            retryable: false,
        })
    }

    static tokenExpired(context?: Record<string, unknown>): AuthenticationError {
        return new AuthenticationError(
            ErrorCode.AUTH_TOKEN_EXPIRED,
            'Your session has expired. Please log in again.',
            'JWT token has expired',
            context
        )
    }

    static invalidToken(context?: Record<string, unknown>): AuthenticationError {
        return new AuthenticationError(
            ErrorCode.AUTH_INVALID_TOKEN,
            'Invalid session. Please log in again.',
            'JWT token verification failed',
            context
        )
    }

    static oauthFailed(reason: string, context?: Record<string, unknown>): AuthenticationError {
        return new AuthenticationError(
            ErrorCode.AUTH_OAUTH_FAILED,
            'Login failed. Please try again.',
            `OAuth authentication failed: ${reason}`,
            context
        )
    }

    static codeExpired(context?: Record<string, unknown>): AuthenticationError {
        return new AuthenticationError(
            ErrorCode.AUTH_CODE_EXPIRED,
            'Login link expired. Please try logging in again.',
            'OAuth authorization code has expired',
            context
        )
    }

    static unauthorized(context?: Record<string, unknown>): AuthenticationError {
        return new AuthenticationError(
            ErrorCode.AUTH_UNAUTHORIZED,
            'You are not authorized to perform this action.',
            'User is not authorized',
            context
        )
    }
}

export class GitHubError extends AppError {
    constructor(
        code: ErrorCodeType,
        userMessage: string,
        developerMessage: string,
        statusCode: number,
        context?: Record<string, unknown>,
        cause?: Error,
        retryable?: boolean,
        retryAfterMs?: number
    ) {
        super({
            code,
            userMessage,
            developerMessage,
            statusCode,
            context,
            cause,
            retryable,
            retryAfterMs,
        })
    }

    static rateLimited(
        retryAfterMs: number,
        context?: Record<string, unknown>
    ): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_RATE_LIMITED,
            'Too many requests to GitHub. Please wait a moment and try again.',
            `GitHub API rate limit exceeded. Retry after ${retryAfterMs}ms`,
            429,
            context,
            undefined,
            true,
            retryAfterMs
        )
    }

    static notFound(resource: string, context?: Record<string, unknown>): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_NOT_FOUND,
            `The requested ${resource} could not be found.`,
            `GitHub resource not found: ${resource}`,
            404,
            context,
            undefined,
            false
        )
    }

    static permissionDenied(
        action: string,
        context?: Record<string, unknown>
    ): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_PERMISSION_DENIED,
            `The app no longer has permission to ${action}. Please reinstall the app.`,
            `GitHub permission denied for action: ${action}`,
            403,
            context,
            undefined,
            false
        )
    }

    static networkError(context?: Record<string, unknown>, cause?: Error): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_NETWORK_ERROR,
            'Unable to connect to GitHub. Please check your internet connection.',
            'Network error while connecting to GitHub API',
            503,
            context,
            cause,
            true,
            5000
        )
    }

    static timeout(context?: Record<string, unknown>): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_TIMEOUT,
            'Request to GitHub timed out. Please try again.',
            'GitHub API request timed out',
            504,
            context,
            undefined,
            true,
            3000
        )
    }

    static conflict(
        reason: string,
        context?: Record<string, unknown>
    ): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_CONFLICT,
            'The file was modified by someone else. Please refresh and try again.',
            `GitHub conflict: ${reason}`,
            409,
            context,
            undefined,
            true,
            1000
        )
    }

    static apiError(
        message: string,
        statusCode: number,
        context?: Record<string, unknown>,
        cause?: Error
    ): GitHubError {
        return new GitHubError(
            ErrorCode.GITHUB_API_ERROR,
            'An error occurred while communicating with GitHub.',
            `GitHub API error: ${message}`,
            statusCode,
            context,
            cause,
            statusCode >= 500
        )
    }
}

export class DatabaseError extends AppError {
    constructor(
        code: ErrorCodeType,
        developerMessage: string,
        context?: Record<string, unknown>,
        cause?: Error
    ) {
        super({
            code,
            userMessage: 'A database error occurred. Please try again later.',
            developerMessage,
            statusCode: 500,
            context,
            cause,
            retryable: true,
            retryAfterMs: 1000,
        })
    }

    static connectionError(context?: Record<string, unknown>, cause?: Error): DatabaseError {
        return new DatabaseError(
            ErrorCode.DB_CONNECTION_ERROR,
            'Failed to connect to database',
            context,
            cause
        )
    }

    static queryError(query: string, context?: Record<string, unknown>, cause?: Error): DatabaseError {
        return new DatabaseError(
            ErrorCode.DB_QUERY_ERROR,
            `Database query failed: ${query}`,
            context,
            cause
        )
    }

    static notFound(resource: string, context?: Record<string, unknown>): DatabaseError {
        const error = new DatabaseError(
            ErrorCode.DB_NOT_FOUND,
            `Record not found: ${resource}`,
            context
        )
        // Override statusCode for not found
        Object.defineProperty(error, 'statusCode', { value: 404, writable: false })
        return error
    }
}

export class ValidationError extends AppError {
    constructor(
        userMessage: string,
        developerMessage: string,
        context?: Record<string, unknown>
    ) {
        super({
            code: ErrorCode.VALIDATION_INVALID_INPUT,
            userMessage,
            developerMessage,
            statusCode: 400,
            context,
            retryable: false,
        })
    }

    static missingField(fieldName: string): ValidationError {
        return new ValidationError(
            `Missing required field: ${fieldName}`,
            `Validation failed: missing required field '${fieldName}'`,
            { field: fieldName }
        )
    }

    static invalidFormat(fieldName: string, expectedFormat: string): ValidationError {
        return new ValidationError(
            `Invalid format for ${fieldName}`,
            `Validation failed: '${fieldName}' does not match expected format '${expectedFormat}'`,
            { field: fieldName, expectedFormat }
        )
    }

    static invalidValue(fieldName: string, value: unknown, reason: string): ValidationError {
        return new ValidationError(
            `Invalid value for ${fieldName}`,
            `Validation failed: '${fieldName}' value '${value}' is invalid - ${reason}`,
            { field: fieldName, value, reason }
        )
    }
}

export class WebhookError extends AppError {
    constructor(
        code: ErrorCodeType,
        developerMessage: string,
        context?: Record<string, unknown>,
        cause?: Error
    ) {
        super({
            code,
            userMessage: 'Webhook processing failed.',
            developerMessage,
            statusCode: code === ErrorCode.WEBHOOK_INVALID_SIGNATURE ? 401 : 500,
            context,
            cause,
            retryable: false,
        })
    }

    static invalidSignature(context?: Record<string, unknown>): WebhookError {
        return new WebhookError(
            ErrorCode.WEBHOOK_INVALID_SIGNATURE,
            'Invalid webhook signature',
            context
        )
    }

    static processingError(reason: string, context?: Record<string, unknown>, cause?: Error): WebhookError {
        return new WebhookError(
            ErrorCode.WEBHOOK_PROCESSING_ERROR,
            `Webhook processing failed: ${reason}`,
            context,
            cause
        )
    }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown, defaultMessage = 'An unexpected error occurred'): AppError {
    if (error instanceof AppError) {
        return error
    }

    if (error instanceof Error) {
        return new AppError({
            code: ErrorCode.UNKNOWN_ERROR,
            userMessage: defaultMessage,
            developerMessage: error.message,
            statusCode: 500,
            cause: error,
        })
    }

    return new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        userMessage: defaultMessage,
        developerMessage: String(error),
        statusCode: 500,
    })
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof AppError) {
        return error.retryable
    }
    return false
}

/**
 * Log error with structured format
 */
export function logError(
    error: unknown,
    context?: Record<string, unknown>
): void {
    const appError = toAppError(error)
    const logData = {
        ...appError.toLogObject(),
        additionalContext: context,
    }

    // Use console.error for production logging
    // In a real app, you'd use a proper logging service
    console.error('[ERROR]', JSON.stringify(logData, null, 2))
}

/**
 * Create a safe error response for API routes
 */
export function createErrorResponse(
    error: unknown,
    defaultStatusCode = 500
): { body: { error: string; code: string; message: string }; status: number } {
    const appError = toAppError(error)
    return {
        body: appError.toUserResponse(),
        status: appError.statusCode || defaultStatusCode,
    }
}
