import jwt from 'jsonwebtoken'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import {
    ConfigurationError,
    GitHubError,
    AuthenticationError,
    ValidationError,
    toAppError,
    logError,
    isRetryableError,
} from './errors'

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_APP_ID = process.env.GITHUB_APP_ID
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n')
const GITHUB_APP_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID
const GITHUB_APP_CLIENT_SECRET = process.env.GITHUB_APP_CLIENT_SECRET

// Request configuration
const DEFAULT_TIMEOUT_MS = 30000 // 30 seconds
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

// Validate configuration at module load
const configErrors: string[] = []
if (!GITHUB_APP_ID) configErrors.push('GITHUB_APP_ID')
if (!GITHUB_APP_PRIVATE_KEY) configErrors.push('GITHUB_APP_PRIVATE_KEY')
if (!GITHUB_APP_CLIENT_ID) configErrors.push('GITHUB_APP_CLIENT_ID')
if (!GITHUB_APP_CLIENT_SECRET) configErrors.push('GITHUB_APP_CLIENT_SECRET')

if (configErrors.length > 0) {
    console.warn(`[WARN] Missing GitHub App environment variables: ${configErrors.join(', ')}`)
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that GitHub App credentials are configured
 */
function validateAppCredentials(): void {
    if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
        throw new ConfigurationError(
            'GitHub App credentials (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY) are not configured',
            { missingVars: ['GITHUB_APP_ID', 'GITHUB_APP_PRIVATE_KEY'].filter(v => !process.env[v]) }
        )
    }
}

/**
 * Validate that GitHub OAuth credentials are configured
 */
function validateOAuthCredentials(): void {
    if (!GITHUB_APP_CLIENT_ID || !GITHUB_APP_CLIENT_SECRET) {
        throw new ConfigurationError(
            'GitHub OAuth credentials (GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET) are not configured',
            { missingVars: ['GITHUB_APP_CLIENT_ID', 'GITHUB_APP_CLIENT_SECRET'].filter(v => !process.env[v]) }
        )
    }
}

/**
 * Validate installation ID
 */
function validateInstallationId(installationId: unknown): asserts installationId is number {
    if (typeof installationId !== 'number' || !Number.isInteger(installationId) || installationId <= 0) {
        throw ValidationError.invalidValue('installationId', installationId, 'must be a positive integer')
    }
}

/**
 * Validate repository name format (owner/repo)
 */
function validateRepoName(repoFullName: string): { owner: string; repo: string } {
    if (!repoFullName || typeof repoFullName !== 'string') {
        throw ValidationError.missingField('repoFullName')
    }

    const parts = repoFullName.split('/')
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw ValidationError.invalidFormat('repoFullName', 'owner/repo')
    }

    return { owner: parts[0], repo: parts[1] }
}

/**
 * Validate OAuth code
 */
function validateOAuthCode(code: unknown): asserts code is string {
    if (typeof code !== 'string' || code.trim().length === 0) {
        throw ValidationError.missingField('code')
    }
}

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryOptions {
    maxRetries?: number
    initialDelayMs?: number
    shouldRetry?: (error: unknown) => boolean
}

/**
 * Execute a function with exponential backoff retry
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = MAX_RETRIES,
        initialDelayMs = INITIAL_RETRY_DELAY_MS,
        shouldRetry = isRetryableError,
    } = options

    let lastError: unknown

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            // Check if we should retry
            if (attempt >= maxRetries || !shouldRetry(error)) {
                throw error
            }

            // Calculate exponential backoff delay
            const delay = initialDelayMs * Math.pow(2, attempt)
            console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`)

            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw lastError
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        })
        return response
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw GitHubError.timeout({ url, timeoutMs })
        }
        throw GitHubError.networkError({ url }, error instanceof Error ? error : undefined)
    } finally {
        clearTimeout(timeoutId)
    }
}

// ============================================================================
// GitHub API Error Handling
// ============================================================================

/**
 * Parse GitHub API error response and throw appropriate error
 */
function handleGitHubApiError(
    statusCode: number,
    responseBody: Record<string, unknown>,
    context: Record<string, unknown>
): never {
    const message = String(responseBody.message || 'Unknown error')

    // Rate limit exceeded
    if (statusCode === 403 && message.toLowerCase().includes('rate limit')) {
        const retryAfter = Number(responseBody['retry-after']) || 60
        throw GitHubError.rateLimited(retryAfter * 1000, context)
    }

    // Secondary rate limit (abuse detection)
    if (statusCode === 403 && message.toLowerCase().includes('abuse')) {
        throw GitHubError.rateLimited(60000, { ...context, reason: 'abuse detection' })
    }

    // Not found
    if (statusCode === 404) {
        throw GitHubError.notFound(String(context.resource || 'resource'), context)
    }

    // Permission denied / forbidden
    if (statusCode === 403) {
        throw GitHubError.permissionDenied(String(context.action || 'access resource'), context)
    }

    // Conflict (e.g., SHA mismatch)
    if (statusCode === 409) {
        throw GitHubError.conflict(message, context)
    }

    // Authentication failed
    if (statusCode === 401) {
        throw new AuthenticationError(
            'AUTH_005',
            'GitHub authentication failed. Please try logging in again.',
            `GitHub API returned 401: ${message}`,
            context
        )
    }

    // Server errors (retryable)
    if (statusCode >= 500) {
        const error = GitHubError.apiError(message, statusCode, context)
        // Mark as retryable
        Object.defineProperty(error, 'retryable', { value: true, writable: false })
        throw error
    }

    // Generic error
    throw GitHubError.apiError(message, statusCode, context)
}

/**
 * Wrap Octokit errors with our custom error types
 */
function handleOctokitError(error: unknown, context: Record<string, unknown>): never {
    if (error instanceof GitHubError) {
        throw error
    }

    // Handle Octokit-specific errors
    if (error && typeof error === 'object' && 'status' in error) {
        const octokitError = error as { status: number; message?: string; response?: { data?: Record<string, unknown> } }
        handleGitHubApiError(
            octokitError.status,
            octokitError.response?.data || { message: octokitError.message },
            context
        )
    }

    // Network errors
    if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('ENOTFOUND')) {
            throw GitHubError.networkError(context, error)
        }
    }

    throw toAppError(error, 'An error occurred while communicating with GitHub')
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a JWT for authenticating as the GitHub App
 */
export function generateAppJWT(): string {
    validateAppCredentials()

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        iat: now - 60, // issued at time, 60 seconds in the past to allow for clock drift
        exp: now + 600, // JWT expiration time (10 minutes maximum)
        iss: GITHUB_APP_ID,
    }

    try {
        return jwt.sign(payload, GITHUB_APP_PRIVATE_KEY!, { algorithm: 'RS256' })
    } catch (error) {
        throw new ConfigurationError(
            'Failed to sign JWT - check GITHUB_APP_PRIVATE_KEY format',
            { error: error instanceof Error ? error.message : String(error) },
            error instanceof Error ? error : undefined
        )
    }
}

/**
 * Create an Octokit instance authenticated as an installation
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
    validateAppCredentials()
    validateInstallationId(installationId)

    try {
        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: GITHUB_APP_ID,
                privateKey: GITHUB_APP_PRIVATE_KEY,
                installationId,
            },
            request: {
                timeout: DEFAULT_TIMEOUT_MS,
            },
        })

        return octokit
    } catch (error) {
        logError(error, { installationId })
        throw new ConfigurationError(
            `Failed to create installation Octokit for installation ${installationId}`,
            { installationId },
            error instanceof Error ? error : undefined
        )
    }
}

/**
 * Get authenticated Octokit for the GitHub App itself
 */
export function getAppOctokit(): Octokit {
    const appJwt = generateAppJWT()
    return new Octokit({
        auth: appJwt,
        request: {
            timeout: DEFAULT_TIMEOUT_MS,
        },
    })
}

/**
 * Exchange OAuth code for user access token and get user info
 */
export async function exchangeCodeForUser(code: string): Promise<{
    accessToken: string
    user: {
        id: number
        login: string
        avatar_url: string
    }
}> {
    validateOAuthCredentials()
    validateOAuthCode(code)

    // Exchange code for access token
    const tokenResponse = await withRetry(
        async () => {
            const response = await fetchWithTimeout(
                'https://github.com/login/oauth/access_token',
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        client_id: GITHUB_APP_CLIENT_ID,
                        client_secret: GITHUB_APP_CLIENT_SECRET,
                        code,
                    }),
                }
            )

            if (!response.ok) {
                throw GitHubError.apiError(
                    `Token exchange failed with status ${response.status}`,
                    response.status,
                    { endpoint: 'oauth/access_token' }
                )
            }

            return response.json()
        },
        {
            maxRetries: 2,
            shouldRetry: (error) => {
                // Only retry on network/timeout errors, not auth errors
                return error instanceof GitHubError &&
                    (error.code === 'GITHUB_005' || error.code === 'GITHUB_006')
            },
        }
    )

    // Handle OAuth-specific errors
    if (tokenResponse.error) {
        const errorDescription = tokenResponse.error_description || tokenResponse.error

        if (tokenResponse.error === 'bad_verification_code') {
            throw AuthenticationError.codeExpired({ code: code.substring(0, 8) + '...' })
        }

        throw AuthenticationError.oauthFailed(errorDescription, {
            error: tokenResponse.error,
            description: errorDescription,
        })
    }

    if (!tokenResponse.access_token) {
        throw AuthenticationError.oauthFailed('No access token received', { response: tokenResponse })
    }

    // Get user info with retry
    try {
        const userOctokit = new Octokit({
            auth: tokenResponse.access_token,
            request: { timeout: DEFAULT_TIMEOUT_MS },
        })

        const { data: user } = await withRetry(
            () => userOctokit.users.getAuthenticated(),
            { maxRetries: 2 }
        )

        return {
            accessToken: tokenResponse.access_token,
            user: {
                id: user.id,
                login: user.login,
                avatar_url: user.avatar_url,
            },
        }
    } catch (error) {
        handleOctokitError(error, { action: 'get authenticated user' })
    }
}

/**
 * Check if a user has made any commits today (excluding automated commits)
 */
export async function hasUserCommitsToday(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<boolean> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const since = today.toISOString()

    try {
        const { data: commits } = await withRetry(
            () => octokit.repos.listCommits({
                owner: validOwner,
                repo: validRepo,
                since,
                per_page: 100,
            }),
            { maxRetries: 2 }
        )

        // Filter out automated commits (our commits have specific messages)
        const automatedMessages = [
            'fix: normalize whitespace in README',
            'chore: format README.md',
            'style: clean up README formatting',
            'docs: fix trailing whitespace in README',
            'fix: remove extra blank lines in README',
        ]

        const realCommits = commits.filter(
            commit => !automatedMessages.some(msg => commit.commit.message.startsWith(msg))
        )

        return realCommits.length > 0
    } catch (error) {
        // Log the error but return true as fail-safe (don't create commits if uncertain)
        logError(error, { owner: validOwner, repo: validRepo, action: 'check commits today' })

        // If it's a permission error, rethrow it
        if (error instanceof GitHubError &&
            (error.code === 'GITHUB_003' || error.code === 'GITHUB_002')) {
            throw error
        }

        // For other errors, assume has commits (fail-safe to prevent unwanted commits)
        console.warn(`[WARN] Error checking commits for ${validOwner}/${validRepo}, assuming has commits (fail-safe)`)
        return true
    }
}

/**
 * Get the current README content
 */
export async function getReadmeContent(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<{ content: string; sha: string } | null> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    try {
        const { data } = await withRetry(
            () => octokit.repos.getContent({
                owner: validOwner,
                repo: validRepo,
                path: 'README.md',
            }),
            { maxRetries: 2 }
        )

        if ('content' in data && 'sha' in data) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8')
            return { content, sha: data.sha }
        }

        // It's a directory or symlink, not a file
        console.warn(`[WARN] README.md in ${validOwner}/${validRepo} is not a file`)
        return null
    } catch (error) {
        // Handle 404 specifically - README doesn't exist
        if (error instanceof GitHubError && error.code === 'GITHUB_002') {
            return null
        }

        // Check for Octokit 404
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            return null
        }

        // Log and rethrow other errors
        logError(error, { owner: validOwner, repo: validRepo, action: 'get README' })
        handleOctokitError(error, { owner: validOwner, repo: validRepo, resource: 'README.md' })
    }
}

/**
 * Toggle whitespace in README (add/remove trailing space on a line)
 */
export function toggleReadmeWhitespace(content: string): string {
    if (!content || typeof content !== 'string') {
        throw ValidationError.invalidValue('content', content, 'must be a non-empty string')
    }

    const lines = content.split('\n')

    // Find a suitable line to modify (non-empty, not a code block, not a link)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Skip empty lines, code blocks, links, and headers with special characters
        if (!line.trim() ||
            line.startsWith('```') ||
            line.includes('](') ||
            line.startsWith('|')) {
            continue
        }

        // Toggle trailing whitespace
        if (line.endsWith('  ')) {
            // Remove trailing spaces
            lines[i] = line.trimEnd()
        } else if (line.trim().length > 0) {
            // Add trailing spaces (markdown line break)
            lines[i] = line.trimEnd() + '  '
        }

        break // Only modify one line
    }

    return lines.join('\n')
}

/**
 * Commit the updated README
 */
export async function commitReadmeUpdate(
    octokit: Octokit,
    owner: string,
    repo: string,
    newContent: string,
    oldSha: string
): Promise<string> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    if (!newContent || typeof newContent !== 'string') {
        throw ValidationError.invalidValue('newContent', newContent, 'must be a non-empty string')
    }

    if (!oldSha || typeof oldSha !== 'string') {
        throw ValidationError.missingField('oldSha')
    }

    const messages = [
        'fix: normalize whitespace in README',
        'chore: format README.md',
        'style: clean up README formatting',
        'docs: fix trailing whitespace in README',
        'fix: remove extra blank lines in README',
    ]

    // Pick a varied message based on the day
    const messageIndex = new Date().getDay() % messages.length
    const message = messages[messageIndex]

    try {
        const { data } = await withRetry(
            () => octokit.repos.createOrUpdateFileContents({
                owner: validOwner,
                repo: validRepo,
                path: 'README.md',
                message,
                content: Buffer.from(newContent).toString('base64'),
                sha: oldSha,
            }),
            {
                maxRetries: 2,
                shouldRetry: (error) => {
                    // Don't retry on conflict (SHA mismatch)
                    if (error instanceof GitHubError && error.code === 'GITHUB_007') {
                        return false
                    }
                    return isRetryableError(error)
                },
            }
        )

        return data.commit.sha || ''
    } catch (error) {
        logError(error, { owner: validOwner, repo: validRepo, action: 'commit README' })
        handleOctokitError(error, {
            owner: validOwner,
            repo: validRepo,
            action: 'update README.md',
            oldSha,
        })
    }
}

/**
 * Get installation details for a user
 */
export async function getUserInstallations(accessToken: string): Promise<Array<{
    id: number
    account: { login: string; avatar_url: string }
    repositories_url: string
}>> {
    if (!accessToken || typeof accessToken !== 'string') {
        throw ValidationError.missingField('accessToken')
    }

    try {
        const octokit = new Octokit({
            auth: accessToken,
            request: { timeout: DEFAULT_TIMEOUT_MS },
        })

        const { data } = await withRetry(
            () => octokit.apps.listInstallationsForAuthenticatedUser(),
            { maxRetries: 2 }
        )

        return data.installations.map(installation => {
            const account = installation.account as { login?: string; avatar_url?: string } | null
            return {
                id: installation.id,
                account: {
                    login: account?.login || 'unknown',
                    avatar_url: account?.avatar_url || '',
                },
                repositories_url: installation.repositories_url,
            }
        })
    } catch (error) {
        logError(error, { action: 'get user installations' })
        handleOctokitError(error, { action: 'list installations' })
    }
}

/**
 * Get repositories accessible by an installation
 */
export async function getInstallationRepositories(
    installationId: number
): Promise<Array<{
    id: number
    full_name: string
    private: boolean
    description: string | null
}>> {
    validateInstallationId(installationId)

    try {
        const octokit = await getInstallationOctokit(installationId)

        const { data } = await withRetry(
            () => octokit.apps.listReposAccessibleToInstallation({
                per_page: 100,
            }),
            { maxRetries: 2 }
        )

        return data.repositories.map(repo => ({
            id: repo.id,
            full_name: repo.full_name,
            private: repo.private,
            description: repo.description,
        }))
    } catch (error) {
        logError(error, { installationId, action: 'get installation repositories' })
        handleOctokitError(error, { installationId, action: 'list repositories' })
    }
}
