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
const DEFAULT_TIMEOUT_MS = 8000 // 8 seconds (optimized for cron-job.org)
const MAX_RETRIES = 1 // Reduced retries to fit timeout constraints
const INITIAL_RETRY_DELAY_MS = 500 // Faster retry

/**
 * Commit messages this app uses for its automated commits.
 *
 * Automated commits are attributed to the user (that is the whole point - they
 * have to land on the contribution graph), which means they come back from the
 * GitHub API looking exactly like the user's own work. The message is the only
 * thing that distinguishes them, so this list is the single source of truth and
 * must stay in sync with the messages we actually write.
 */
export const AUTOMATED_COMMIT_MESSAGES = [
    'fix: normalize whitespace in README',
    'chore: format README.md',
    'style: clean up README formatting',
    'docs: fix trailing whitespace in README',
    'fix: remove extra blank lines in README',
] as const

/** True when a commit message is one this app generated. */
export function isAutomatedCommitMessage(message: string): boolean {
    if (!message) return false
    const firstLine = message.split('\n', 1)[0].trim()
    return AUTOMATED_COMMIT_MESSAGES.some(m => firstLine === m || firstLine.startsWith(m))
}

/**
 * Start of the current UTC day.
 *
 * Everything in the scheduler is in UTC on purpose. The previous code used
 * `new Date().setHours(0,0,0,0)`, which is the server's local midnight - that
 * silently changes meaning between a developer machine and the deployment, and
 * made "today" disagree between the cron job and the commit check.
 */
export function startOfUtcDay(now: Date = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** Start of the next UTC day - when a finished installation becomes eligible again. */
export function startOfNextUtcDay(now: Date = new Date()): Date {
    const start = startOfUtcDay(now)
    return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

/** The UTC calendar day as "YYYY-MM-DD", used to key the per-day commit counter. */
export function utcDayKey(now: Date = new Date()): string {
    return startOfUtcDay(now).toISOString().slice(0, 10)
}

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
        name: string
        email: string | null
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

        // Fetch user's primary email for contribution graph attribution
        let primaryEmail: string | null = user.email || null // Start with public profile email

        try {
            const { data: emails } = await userOctokit.users.listEmailsForAuthenticatedUser()
            const primary = emails.find(e => e.primary && e.verified)
            if (primary?.email) {
                primaryEmail = primary.email
            }
        } catch (emailError) {
            // Email fetch might fail if user hasn't granted email scope - that's ok
            console.warn('[GITHUB] Could not fetch user email via API:', emailError)
        }

        return {
            accessToken: tokenResponse.access_token,
            user: {
                id: user.id,
                login: user.login,
                avatar_url: user.avatar_url,
                name: user.name || user.login,
                email: primaryEmail,
            },
        }
    } catch (error) {
        handleOctokitError(error, { action: 'get authenticated user' })
    }
}

/**
 * Check whether the user already has a genuine commit in this repository today.
 *
 * Two bugs used to live here:
 *
 *  1. It listed *every* commit on the default branch, so a commit by a
 *     collaborator, a bot like Dependabot, or a merge of someone else's PR
 *     counted as "the user committed today" and the user's own commit was
 *     skipped. We now ask GitHub for commits by this author only, which is the
 *     same attribution the contribution graph uses.
 *
 *  2. Any failure (timeout, rate limit, 5xx, empty repository) returned `true`
 *     as a "fail-safe". That turned every transient GitHub hiccup into a
 *     permanent, silent skip that was then logged as "user already has commits
 *     today" - a log entry that was simply false. Errors now propagate so the
 *     caller can record a real error and retry with backoff.
 *
 * @param authorLogin GitHub login to scope the query to. Required: without it
 *                    the answer is about the repository, not about the user.
 */
export async function hasUserCommitsToday(
    octokit: Octokit,
    owner: string,
    repo: string,
    authorLogin: string,
    now: Date = new Date()
): Promise<boolean> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    if (!authorLogin || typeof authorLogin !== 'string') {
        throw ValidationError.missingField('authorLogin')
    }

    const since = startOfUtcDay(now).toISOString()

    try {
        const { data: commits } = await withRetry(
            () => octokit.repos.listCommits({
                owner: validOwner,
                repo: validRepo,
                author: authorLogin,
                since,
                per_page: 100,
            }),
            { maxRetries: 2 }
        )

        // Our own commits are attributed to the user, so they show up here too.
        // Only commits we did not write count as the user's real activity.
        return commits.some(commit => !isAutomatedCommitMessage(commit.commit.message))
    } catch (error) {
        // An empty repository answers 409 to listCommits. There is nothing to
        // skip for and nothing to commit against, so say so explicitly instead
        // of reporting it as "has commits".
        if (isEmptyRepositoryError(error)) {
            throw GitHubError.conflict(
                'Repository is empty - push at least one commit before enabling automation',
                { owner: validOwner, repo: validRepo, reason: 'empty repository' }
            )
        }

        logError(error, { owner: validOwner, repo: validRepo, action: 'check commits today' })
        handleOctokitError(error, {
            owner: validOwner,
            repo: validRepo,
            action: 'list commits',
            resource: `${validOwner}/${validRepo}`,
        })
    }
}

/**
 * True for the wrapped error this module raises when a repository has no commits.
 *
 * Separate from `isEmptyRepositoryError`, which inspects the raw Octokit error:
 * by the time the engine sees it, it has been converted to a `GitHubError`.
 */
export function isEmptyRepositoryConflict(error: unknown): boolean {
    return error instanceof GitHubError &&
        error.code === 'GITHUB_007' &&
        error.context?.reason === 'empty repository'
}

/** GitHub answers 409 Conflict for git operations against a repository with no commits. */
export function isEmptyRepositoryError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const status = (error as { status?: number }).status
    const message = String((error as { message?: string }).message ?? '')
    return status === 409 || /repository is empty/i.test(message)
}

/**
 * Fetch the facts about a repository that decide whether automation can work at
 * all, and whether the resulting commits will actually be visible.
 *
 * Commits in a **fork** never appear on the contribution graph, and commits in a
 * **private** repository only appear if the user turned on private contributions
 * in their GitHub profile. Both cases used to produce a perfectly successful
 * commit and a completely unchanged graph, which is the single most confusing
 * way for this app to fail.
 */
export async function getRepoMeta(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<{ defaultBranch: string; isFork: boolean; isPrivate: boolean; fullName: string }> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    try {
        const { data } = await withRetry(
            () => octokit.repos.get({ owner: validOwner, repo: validRepo }),
            { maxRetries: 2 }
        )

        return {
            defaultBranch: data.default_branch,
            isFork: Boolean(data.fork),
            isPrivate: Boolean(data.private),
            fullName: data.full_name,
        }
    } catch (error) {
        logError(error, { owner: validOwner, repo: validRepo, action: 'get repo metadata' })
        handleOctokitError(error, {
            owner: validOwner,
            repo: validRepo,
            resource: `${validOwner}/${validRepo}`,
            action: 'read repository',
        })
    }
}

/**
 * Read the repository's README.
 *
 * The old implementation asked for the literal path `README.md`. Repositories
 * that use `readme.md`, `Readme.md`, `README.markdown`, `docs/README.md` or
 * `README.rst` therefore 404'd and were skipped forever, which is a large part
 * of why automation worked for some users and not others. `repos.getReadme`
 * resolves whatever the repository actually uses, and we commit back to that
 * same path.
 */
export async function getReadmeContent(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<{ content: string; sha: string; path: string } | null> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    try {
        const { data } = await withRetry(
            () => octokit.repos.getReadme({ owner: validOwner, repo: validRepo }),
            { maxRetries: 2 }
        )

        if (!data || typeof data.path !== 'string' || typeof data.sha !== 'string') {
            console.warn(`[WARN] Unexpected README payload for ${validOwner}/${validRepo}`)
            return null
        }

        // The contents API omits the body for files over 1 MB (it returns an
        // empty string, which used to flow downstream and blow up in the
        // whitespace toggle). Fall back to the blob API for those.
        let content = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : ''

        if (!content) {
            content = await getBlobContent(octokit, validOwner, validRepo, data.sha)
        }

        if (!content) {
            console.warn(`[WARN] README in ${validOwner}/${validRepo} is empty or unreadable`)
            return null
        }

        return { content, sha: data.sha, path: data.path }
    } catch (error) {
        // No README at all - a legitimate "skip", not an error.
        if (error instanceof GitHubError && error.code === 'GITHUB_002') {
            return null
        }
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            return null
        }
        if (isEmptyRepositoryError(error)) {
            throw GitHubError.conflict(
                'Repository is empty - push at least one commit before enabling automation',
                { owner: validOwner, repo: validRepo, reason: 'empty repository' }
            )
        }

        logError(error, { owner: validOwner, repo: validRepo, action: 'get README' })
        handleOctokitError(error, { owner: validOwner, repo: validRepo, resource: 'README' })
    }
}

/** Read a blob by SHA, used for files the contents API refuses to inline. */
async function getBlobContent(
    octokit: Octokit,
    owner: string,
    repo: string,
    sha: string
): Promise<string> {
    try {
        const { data } = await withRetry(
            () => octokit.git.getBlob({ owner, repo, file_sha: sha }),
            { maxRetries: 1 }
        )
        return Buffer.from(data.content, (data.encoding as BufferEncoding) || 'base64').toString('utf-8')
    } catch (error) {
        logError(error, { owner, repo, sha, action: 'get README blob' })
        return ''
    }
}

/**
 * Produce a version of the README that differs from the input by exactly one
 * trailing-whitespace flip.
 *
 * This used to be able to return the input unchanged: every line that was
 * empty, fenced, a table row or contained a markdown link was skipped, so a
 * README made entirely of badges and tables fell through the loop untouched.
 * GitHub then accepted the "update" without creating a commit, while this app
 * counted a success - a commit the user could never find. The toggle now always
 * changes something and the caller asserts that it did.
 */
export function toggleReadmeWhitespace(content: string): string {
    if (typeof content !== 'string' || content.length === 0) {
        throw ValidationError.invalidValue('content', content, 'must be a non-empty string')
    }

    const lines = content.split('\n')
    let insideFence = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Track fenced code blocks so we never touch their contents: trailing
        // spaces inside a fence are significant in some languages.
        if (line.trimStart().startsWith('```')) {
            insideFence = !insideFence
            continue
        }
        if (insideFence) continue

        // Skip lines where trailing whitespace is meaningful or visible:
        // blank lines, table rows, and lines holding a markdown link or image.
        if (!line.trim() || line.startsWith('|') || line.includes('](')) {
            continue
        }

        lines[i] = line.endsWith('  ') ? line.trimEnd() : line.trimEnd() + '  '
        return lines.join('\n')
    }

    // Nothing eligible in the body. Flip the file's trailing newline instead,
    // which is invisible in every renderer and always a real change.
    return content.endsWith('\n') ? content.replace(/\n+$/, '') : content + '\n'
}

/**
 * The README written into a repository that has none.
 *
 * Two constraints shape this content:
 *
 *  - It has to be a *useful* starting point, not filler. This file lands in
 *    someone's public repository under their own name, so it should look like
 *    something they would plausibly have written and want to keep.
 *  - The first non-empty line must survive `toggleReadmeWhitespace`, which skips
 *    blank lines, fenced blocks, table rows and lines containing a markdown
 *    link. The `# Heading` below is deliberately plain so later runs always have
 *    something to toggle.
 */
export function buildInitialReadme(repoName: string): string {
    const title = repoName.trim() || 'Project'

    return `# ${title}

A short description of what this project does.

## Getting started

Describe how to install and run it here.

## Usage

Add examples once there is something to show.

<!--
This README was created automatically by Commit Habit because the repository
did not have one, so there is a file to keep up to date. It will not be
recreated or overwritten - edit or replace it however you like.
-->
`
}

/**
 * Create a file that does not exist yet.
 *
 * This is the same contents endpoint `commitReadmeUpdate` uses, with the `sha`
 * omitted - that omission is precisely what makes GitHub treat the request as a
 * creation. Passing a `sha` for a path that does not exist fails, and omitting
 * one for a path that *does* exist fails too, so creation and update cannot be
 * collapsed into a single call without knowing which case applies.
 */
export async function createReadmeFile(
    octokit: Octokit,
    owner: string,
    repo: string,
    content: string,
    author: { name: string; email: string },
    options: { path?: string; branch?: string } = {}
): Promise<string> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    if (!content || typeof content !== 'string') {
        throw ValidationError.invalidValue('content', content, 'must be a non-empty string')
    }

    if (!author || !author.name || !author.email) {
        throw ValidationError.missingField('author')
    }

    const path = options.path || 'README.md'

    try {
        const { data } = await withRetry(
            () => octokit.repos.createOrUpdateFileContents({
                owner: validOwner,
                repo: validRepo,
                path,
                message: 'docs: add README',
                content: Buffer.from(content, 'utf-8').toString('base64'),
                // No `sha`: this is a creation.
                ...(options.branch ? { branch: options.branch } : {}),
                author: { name: author.name, email: author.email },
                committer: { name: author.name, email: author.email },
            }),
            {
                maxRetries: 2,
                shouldRetry: (error) => {
                    // 422 here means the path already exists - something created it
                    // between our check and this write. Retrying cannot help.
                    if (error && typeof error === 'object' && 'status' in error &&
                        (error as { status?: number }).status === 422) {
                        return false
                    }
                    return isRetryableError(error)
                },
            }
        )

        const sha = data.commit?.sha
        if (!sha) {
            throw GitHubError.apiError(
                'GitHub accepted the new README but did not record a commit',
                502,
                { owner: validOwner, repo: validRepo, path }
            )
        }

        return sha
    } catch (error) {
        logError(error, { owner: validOwner, repo: validRepo, path, action: 'create README' })
        handleOctokitError(error, {
            owner: validOwner,
            repo: validRepo,
            action: `create ${path}`,
            resource: path,
        })
    }
}

/**
 * Commit an updated README.
 *
 * `author` is mandatory now. When it was optional and omitted, the commit was
 * authored by the GitHub App's bot identity, so it appeared in the repository
 * but never on the user's contribution graph - the exact complaint this app
 * exists to prevent. Callers must resolve a real identity or skip the run.
 */
export async function commitReadmeUpdate(
    octokit: Octokit,
    owner: string,
    repo: string,
    newContent: string,
    oldSha: string,
    author: { name: string; email: string },
    options: { path?: string; branch?: string; now?: Date } = {}
): Promise<string> {
    const { owner: validOwner, repo: validRepo } = validateRepoName(`${owner}/${repo}`)

    if (!newContent || typeof newContent !== 'string') {
        throw ValidationError.invalidValue('newContent', newContent, 'must be a non-empty string')
    }

    if (!oldSha || typeof oldSha !== 'string') {
        throw ValidationError.missingField('oldSha')
    }

    if (!author || !author.name || !author.email) {
        throw ValidationError.missingField('author')
    }

    const path = options.path || 'README.md'
    const now = options.now || new Date()

    // Vary the message by day *and* repository, so a user with several repos
    // does not get the same message everywhere on the same day.
    const seed = now.getUTCDate() + hashString(`${validOwner}/${validRepo}`)
    const message = AUTOMATED_COMMIT_MESSAGES[seed % AUTOMATED_COMMIT_MESSAGES.length]

    try {
        const { data } = await withRetry(
            () => octokit.repos.createOrUpdateFileContents({
                owner: validOwner,
                repo: validRepo,
                path,
                message,
                content: Buffer.from(newContent, 'utf-8').toString('base64'),
                sha: oldSha,
                ...(options.branch ? { branch: options.branch } : {}),
                author: { name: author.name, email: author.email },
                committer: { name: author.name, email: author.email },
            }),
            {
                maxRetries: 2,
                shouldRetry: (error) => {
                    // A SHA mismatch means someone else changed the file; retrying
                    // with the same stale SHA can only fail again.
                    if (error instanceof GitHubError && error.code === 'GITHUB_007') {
                        return false
                    }
                    return isRetryableError(error)
                },
            }
        )

        const sha = data.commit?.sha
        if (!sha) {
            // GitHub accepted the request without recording a commit. Treat it
            // as a failure rather than reporting a commit that does not exist.
            throw GitHubError.apiError(
                'GitHub accepted the update but did not create a commit',
                502,
                { owner: validOwner, repo: validRepo, path }
            )
        }

        return sha
    } catch (error) {
        logError(error, { owner: validOwner, repo: validRepo, path, action: 'commit README' })
        handleOctokitError(error, {
            owner: validOwner,
            repo: validRepo,
            action: `update ${path}`,
            oldSha,
        })
    }
}

/** Small stable string hash, used only to spread commit messages across repos. */
function hashString(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
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
