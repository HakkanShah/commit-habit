import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import {
    WebhookError,
    DatabaseError,
    ValidationError,
    logError,
    createErrorResponse,
} from '@/lib/errors'

// ============================================================================
// Configuration
// ============================================================================

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET
const REQUEST_TIMEOUT_MS = 25000 // 25 seconds

if (!WEBHOOK_SECRET) {
    console.warn('[WEBHOOK] GITHUB_WEBHOOK_SECRET is not configured - webhooks will fail')
}

// ============================================================================
// Types
// ============================================================================

interface GitHubSender {
    id: number
    login: string
    avatar_url?: string
}

interface GitHubInstallation {
    id: number
    account?: { id: number; login: string; avatar_url?: string }
}

interface GitHubRepository {
    id: number
    full_name: string
}

interface InstallationEventPayload {
    action: 'created' | 'deleted' | 'suspend' | 'unsuspend'
    installation: GitHubInstallation
    repositories?: GitHubRepository[]
    sender: GitHubSender
}

interface InstallationRepositoriesEventPayload {
    action: 'added' | 'removed'
    installation: { id: number }
    repositories_added?: GitHubRepository[]
    repositories_removed?: GitHubRepository[]
    sender: GitHubSender
}

// ============================================================================
// Security Functions
// ============================================================================

/**
 * Verify GitHub webhook signature using timing-safe comparison
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
    if (!WEBHOOK_SECRET) {
        logError(new WebhookError(
            'WEBHOOK_001',
            'GITHUB_WEBHOOK_SECRET is not configured'
        ))
        return false
    }

    if (!signature) {
        logError(new WebhookError(
            'WEBHOOK_001',
            'Missing x-hub-signature-256 header'
        ))
        return false
    }

    if (!signature.startsWith('sha256=')) {
        logError(new WebhookError(
            'WEBHOOK_001',
            'Invalid signature format - must start with sha256='
        ))
        return false
    }

    try {
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(payload)
            .digest('hex')

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature)
        const expectedBuffer = Buffer.from(expectedSignature)

        // Buffers must be same length for timingSafeEqual
        if (signatureBuffer.length !== expectedBuffer.length) {
            return false
        }

        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    } catch (error) {
        logError(error, { action: 'verify webhook signature' })
        return false
    }
}

/**
 * Validate webhook event type
 */
function validateEventType(event: string | null): event is 'installation' | 'installation_repositories' | 'ping' {
    const supportedEvents = ['installation', 'installation_repositories', 'ping']
    return event !== null && supportedEvents.includes(event)
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Find or create user based on GitHub account
 */
async function findOrCreateGitHubUser(sender: GitHubSender) {
    // Validate sender data
    if (!sender.id || typeof sender.id !== 'number') {
        throw ValidationError.invalidValue('sender.id', sender.id, 'must be a valid number')
    }
    if (!sender.login || typeof sender.login !== 'string') {
        throw ValidationError.invalidValue('sender.login', sender.login, 'must be a valid string')
    }

    try {
        // Check if account exists
        const existingAccount = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'github',
                    providerAccountId: String(sender.id),
                },
            },
            include: { user: true },
        })

        if (existingAccount) {
            return existingAccount.user
        }

        // Create new user with GitHub account
        const user = await prisma.user.create({
            data: {
                name: sender.login,
                avatarUrl: sender.avatar_url || '',
                accounts: {
                    create: {
                        provider: 'github',
                        providerAccountId: String(sender.id),
                        providerUsername: sender.login,
                    },
                },
            },
        })

        console.log(`[WEBHOOK] Created new user ${user.id} for GitHub user ${sender.login}`)
        return user
    } catch (error) {
        logError(error, { action: 'find or create user', senderId: sender.id })
        throw DatabaseError.queryError('find or create user', { senderId: sender.id }, error instanceof Error ? error : undefined)
    }
}

/**
 * Create or update installation record
 * Returns 'created' if new, 'reactivated' if was inactive, 'exists' if already active
 */
async function upsertInstallation(
    installationId: number,
    userId: string,
    repo: GitHubRepository
): Promise<'created' | 'reactivated' | 'exists'> {
    try {
        // Check if installation already exists
        const existing = await prisma.installation.findUnique({
            where: {
                installationId_repoId: {
                    installationId,
                    repoId: repo.id,
                },
            },
        })

        if (existing) {
            if (existing.active) {
                // Already exists and active - just log it
                console.log(`[WEBHOOK] Repo ${repo.full_name} already added and active`)
                return 'exists'
            } else {
                // Exists but inactive - reactivate it
                await prisma.installation.update({
                    where: { id: existing.id },
                    data: { active: true, repoFullName: repo.full_name },
                })
                console.log(`[WEBHOOK] Reactivated repo ${repo.full_name}`)
                return 'reactivated'
            }
        }

        // Create new installation
        await prisma.installation.create({
            data: {
                installationId,
                userId,
                repoFullName: repo.full_name,
                repoId: repo.id,
                active: true,
            },
        })
        return 'created'
    } catch (error) {
        logError(error, {
            action: 'upsert installation',
            installationId,
            repoId: repo.id,
            repoFullName: repo.full_name,
        })
        throw DatabaseError.queryError('upsert installation', { installationId, repoId: repo.id }, error instanceof Error ? error : undefined)
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleInstallationEvent(data: InstallationEventPayload): Promise<void> {
    const { action, installation, repositories, sender } = data

    console.log(`[WEBHOOK] Installation event: ${action} by ${sender.login}`)

    switch (action) {
        case 'created': {
            const user = await findOrCreateGitHubUser(sender)

            if (repositories && repositories.length > 0) {
                let newCount = 0
                let existingCount = 0
                let reactivatedCount = 0
                let failCount = 0

                for (const repo of repositories) {
                    try {
                        const result = await upsertInstallation(installation.id, user.id, repo)
                        if (result === 'created') newCount++
                        else if (result === 'reactivated') reactivatedCount++
                        else existingCount++
                    } catch (error) {
                        failCount++
                        logError(error, {
                            action: 'add repository in batch',
                            repo: repo.full_name,
                            installationId: installation.id,
                        })
                        // Continue processing other repos
                    }
                }

                const parts = []
                if (newCount > 0) parts.push(`${newCount} new`)
                if (reactivatedCount > 0) parts.push(`${reactivatedCount} reactivated`)
                if (existingCount > 0) parts.push(`${existingCount} already existed`)
                if (failCount > 0) parts.push(`${failCount} failed`)

                console.log(`[WEBHOOK] Processed ${repositories.length} repos for user ${user.id}: ${parts.join(', ')}`)
            } else {
                console.log('[WEBHOOK] Installation created with no repositories')
            }
            break
        }

        case 'deleted': {
            try {
                // Delete all activity logs first
                await prisma.activityLog.deleteMany({
                    where: {
                        installation: {
                            installationId: installation.id,
                        },
                    },
                })

                // Delete all installations
                const result = await prisma.installation.deleteMany({
                    where: { installationId: installation.id },
                })

                console.log(`[WEBHOOK] Deleted ${result.count} installation(s) for installation ID ${installation.id}`)
            } catch (error) {
                logError(error, { action: 'delete installations', installationId: installation.id })
                throw DatabaseError.queryError('delete installations', { installationId: installation.id }, error instanceof Error ? error : undefined)
            }
            break
        }

        case 'suspend': {
            try {
                const result = await prisma.installation.updateMany({
                    where: { installationId: installation.id },
                    data: { active: false },
                })

                console.log(`[WEBHOOK] Suspended ${result.count} installation(s)`)
            } catch (error) {
                logError(error, { action: 'suspend installations', installationId: installation.id })
                throw DatabaseError.queryError('suspend installations', {}, error instanceof Error ? error : undefined)
            }
            break
        }

        case 'unsuspend': {
            try {
                const result = await prisma.installation.updateMany({
                    where: { installationId: installation.id },
                    data: { active: true },
                })

                console.log(`[WEBHOOK] Unsuspended ${result.count} installation(s)`)
            } catch (error) {
                logError(error, { action: 'unsuspend installations', installationId: installation.id })
                throw DatabaseError.queryError('unsuspend installations', {}, error instanceof Error ? error : undefined)
            }
            break
        }

        default:
            console.log(`[WEBHOOK] Unhandled installation action: ${action}`)
    }
}

async function handleInstallationRepositoriesEvent(data: InstallationRepositoriesEventPayload): Promise<void> {
    const { action, installation, repositories_added, repositories_removed, sender } = data

    console.log(`[WEBHOOK] Installation repositories event: ${action} by ${sender.login}`)

    if (action === 'added' && repositories_added && repositories_added.length > 0) {
        const user = await findOrCreateGitHubUser(sender)

        let newCount = 0
        let existingCount = 0
        let reactivatedCount = 0
        let failCount = 0

        for (const repo of repositories_added) {
            try {
                const result = await upsertInstallation(installation.id, user.id, repo)
                if (result === 'created') newCount++
                else if (result === 'reactivated') reactivatedCount++
                else existingCount++
            } catch (error) {
                failCount++
                logError(error, {
                    action: 'add repository',
                    repo: repo.full_name,
                    installationId: installation.id,
                })
            }
        }

        const parts = []
        if (newCount > 0) parts.push(`${newCount} new`)
        if (reactivatedCount > 0) parts.push(`${reactivatedCount} reactivated`)
        if (existingCount > 0) parts.push(`${existingCount} already existed`)
        if (failCount > 0) parts.push(`${failCount} failed`)

        console.log(`[WEBHOOK] Processed repos: ${parts.join(', ')}`)
    }

    if (action === 'removed' && repositories_removed && repositories_removed.length > 0) {
        let successCount = 0
        let failCount = 0

        for (const repo of repositories_removed) {
            try {
                await prisma.installation.updateMany({
                    where: {
                        installationId: installation.id,
                        repoId: repo.id,
                    },
                    data: { active: false },
                })
                successCount++
            } catch (error) {
                failCount++
                logError(error, {
                    action: 'remove repository',
                    repo: repo.full_name,
                    installationId: installation.id,
                })
                // Continue processing other repos
            }
        }

        if (failCount > 0) {
            console.warn(`[WEBHOOK] Removed ${successCount}/${repositories_removed.length} repos, ${failCount} failed`)
        } else {
            console.log(`[WEBHOOK] Removed ${successCount} repository(ies): ${repositories_removed.map(r => r.full_name).join(', ')}`)
        }
    }
}

// ============================================================================
// Main Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Get headers
        const signature = request.headers.get('x-hub-signature-256')
        const event = request.headers.get('x-github-event')
        const deliveryId = request.headers.get('x-github-delivery')

        console.log(`[WEBHOOK] Received ${event} event (delivery: ${deliveryId})`)

        // Validate event type
        if (!validateEventType(event)) {
            console.log(`[WEBHOOK] Ignoring unsupported event type: ${event}`)
            return NextResponse.json({
                success: true,
                message: `Event type '${event}' is not handled`,
            })
        }

        // Handle ping event (no payload verification needed)
        if (event === 'ping') {
            console.log('[WEBHOOK] Received ping event')
            return NextResponse.json({
                success: true,
                message: 'pong',
            })
        }

        // Get payload
        let payload: string
        try {
            payload = await request.text()
        } catch (error) {
            logError(error, { action: 'read webhook payload' })
            return NextResponse.json(
                { error: 'Failed to read request body', code: 'WEBHOOK_002' },
                { status: 400 }
            )
        }

        // Verify signature
        if (!verifyWebhookSignature(payload, signature)) {
            console.warn(`[WEBHOOK] Invalid signature for delivery ${deliveryId}`)
            return NextResponse.json(
                { error: 'Invalid signature', code: 'WEBHOOK_001' },
                { status: 401 }
            )
        }

        // Parse payload
        let data: Record<string, unknown>
        try {
            data = JSON.parse(payload)
        } catch (error) {
            logError(error, { action: 'parse webhook payload' })
            return NextResponse.json(
                { error: 'Invalid JSON payload', code: 'WEBHOOK_002' },
                { status: 400 }
            )
        }

        // Handle events
        switch (event) {
            case 'installation':
                await handleInstallationEvent(data as unknown as InstallationEventPayload)
                break

            case 'installation_repositories':
                await handleInstallationRepositoriesEvent(data as unknown as InstallationRepositoriesEventPayload)
                break
        }

        const duration = Date.now() - startTime
        console.log(`[WEBHOOK] Processed ${event} in ${duration}ms`)

        return NextResponse.json({
            success: true,
            event,
            deliveryId,
            durationMs: duration,
        })

    } catch (error) {
        logError(error, { action: 'process webhook', durationMs: Date.now() - startTime })
        const { body, status } = createErrorResponse(error)
        return NextResponse.json(body, { status })
    }
}
