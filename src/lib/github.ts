import jwt from 'jsonwebtoken'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'

// Environment variables validation
const GITHUB_APP_ID = process.env.GITHUB_APP_ID
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n')
const GITHUB_APP_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID
const GITHUB_APP_CLIENT_SECRET = process.env.GITHUB_APP_CLIENT_SECRET

if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY || !GITHUB_APP_CLIENT_ID || !GITHUB_APP_CLIENT_SECRET) {
    console.warn('GitHub App environment variables not configured')
}

/**
 * Generate a JWT for authenticating as the GitHub App
 */
export function generateAppJWT(): string {
    if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
        throw new Error('GitHub App credentials not configured')
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        iat: now - 60, // issued at time, 60 seconds in the past to allow for clock drift
        exp: now + 600, // JWT expiration time (10 minutes maximum)
        iss: GITHUB_APP_ID,
    }

    return jwt.sign(payload, GITHUB_APP_PRIVATE_KEY, { algorithm: 'RS256' })
}

/**
 * Create an Octokit instance authenticated as an installation
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
    if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
        throw new Error('GitHub App credentials not configured')
    }

    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: GITHUB_APP_ID,
            privateKey: GITHUB_APP_PRIVATE_KEY,
            installationId,
        },
    })

    return octokit
}

/**
 * Get authenticated Octokit for the GitHub App itself
 */
export function getAppOctokit(): Octokit {
    const appJwt = generateAppJWT()
    return new Octokit({ auth: appJwt })
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
    if (!GITHUB_APP_CLIENT_ID || !GITHUB_APP_CLIENT_SECRET) {
        throw new Error('GitHub App OAuth credentials not configured')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
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
    })

    const tokenData = await tokenResponse.json()
    console.log('GitHub token response:', JSON.stringify(tokenData, null, 2))

    if (tokenData.error) {
        throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`)
    }

    // Get user info
    const userOctokit = new Octokit({ auth: tokenData.access_token })
    const { data: user } = await userOctokit.users.getAuthenticated()

    return {
        accessToken: tokenData.access_token,
        user: {
            id: user.id,
            login: user.login,
            avatar_url: user.avatar_url,
        },
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const since = today.toISOString()

    try {
        const { data: commits } = await octokit.repos.listCommits({
            owner,
            repo,
            since,
            per_page: 100,
        })

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
        console.error('Error checking commits:', error)
        return true // Assume has commits if error (fail-safe)
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
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'README.md',
        })

        if ('content' in data && 'sha' in data) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8')
            return { content, sha: data.sha }
        }
        return null
    } catch {
        return null
    }
}

/**
 * Toggle whitespace in README (add/remove trailing space on a line)
 */
export function toggleReadmeWhitespace(content: string): string {
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

    const { data } = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'README.md',
        message,
        content: Buffer.from(newContent).toString('base64'),
        sha: oldSha,
    })

    return data.commit.sha || ''
}

/**
 * Get installation details for a user
 */
export async function getUserInstallations(accessToken: string): Promise<Array<{
    id: number
    account: { login: string; avatar_url: string }
    repositories_url: string
}>> {
    const octokit = new Octokit({ auth: accessToken })

    const { data } = await octokit.apps.listInstallationsForAuthenticatedUser()

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
    const octokit = await getInstallationOctokit(installationId)

    const { data } = await octokit.apps.listReposAccessibleToInstallation({
        per_page: 100,
    })

    return data.repositories.map(repo => ({
        id: repo.id,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
    }))
}
