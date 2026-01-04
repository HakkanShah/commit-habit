import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET

/**
 * Verify GitHub webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
    if (!WEBHOOK_SECRET || !signature) return false

    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    )
}

/**
 * Find or create user based on GitHub account
 */
async function findOrCreateGitHubUser(sender: { id: number; login: string; avatar_url?: string }) {
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

    return user
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text()
        const signature = request.headers.get('x-hub-signature-256')
        const event = request.headers.get('x-github-event')

        // Verify webhook signature
        if (!verifyWebhookSignature(payload, signature)) {
            console.error('Invalid webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const data = JSON.parse(payload)

        // Handle different webhook events
        switch (event) {
            case 'installation':
                await handleInstallationEvent(data)
                break
            case 'installation_repositories':
                await handleInstallationRepositoriesEvent(data)
                break
            default:
                console.log(`Unhandled webhook event: ${event}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

async function handleInstallationEvent(data: {
    action: string
    installation: {
        id: number
        account: { id: number; login: string; avatar_url: string }
    }
    repositories?: Array<{ id: number; full_name: string }>
    sender: { id: number; login: string; avatar_url: string }
}) {
    const { action, installation, repositories, sender } = data

    if (action === 'created') {
        // Find or create user
        const user = await findOrCreateGitHubUser(sender)

        // Create installation records for each repository
        if (repositories) {
            for (const repo of repositories) {
                await prisma.installation.upsert({
                    where: {
                        installationId_repoId: {
                            installationId: installation.id,
                            repoId: repo.id,
                        },
                    },
                    update: {
                        repoFullName: repo.full_name,
                        active: true,
                    },
                    create: {
                        installationId: installation.id,
                        userId: user.id,
                        repoFullName: repo.full_name,
                        repoId: repo.id,
                        active: true,
                    },
                })
            }
        }

        console.log(`Installation created: ${installation.id} by ${sender.login}`)
    } else if (action === 'deleted') {
        // Remove all installations for this installation ID
        await prisma.installation.deleteMany({
            where: { installationId: installation.id },
        })

        console.log(`Installation deleted: ${installation.id}`)
    } else if (action === 'suspend') {
        // Suspend all installations
        await prisma.installation.updateMany({
            where: { installationId: installation.id },
            data: { active: false },
        })

        console.log(`Installation suspended: ${installation.id}`)
    } else if (action === 'unsuspend') {
        // Reactivate installations
        await prisma.installation.updateMany({
            where: { installationId: installation.id },
            data: { active: true },
        })

        console.log(`Installation unsuspended: ${installation.id}`)
    }
}

async function handleInstallationRepositoriesEvent(data: {
    action: string
    installation: { id: number }
    repositories_added?: Array<{ id: number; full_name: string }>
    repositories_removed?: Array<{ id: number; full_name: string }>
    sender: { id: number; login: string; avatar_url?: string }
}) {
    const { action, installation, repositories_added, repositories_removed, sender } = data

    if (action === 'added' && repositories_added) {
        // Find or create user
        const user = await findOrCreateGitHubUser(sender)

        // Add new repositories
        for (const repo of repositories_added) {
            await prisma.installation.upsert({
                where: {
                    installationId_repoId: {
                        installationId: installation.id,
                        repoId: repo.id,
                    },
                },
                update: {
                    repoFullName: repo.full_name,
                    active: true,
                },
                create: {
                    installationId: installation.id,
                    userId: user.id,
                    repoFullName: repo.full_name,
                    repoId: repo.id,
                    active: true,
                },
            })
        }

        console.log(`Repositories added: ${repositories_added.map(r => r.full_name).join(', ')}`)
    }

    if (action === 'removed' && repositories_removed) {
        // We don't delete, just deactivate (user might want to see history)
        for (const repo of repositories_removed) {
            await prisma.installation.updateMany({
                where: {
                    installationId: installation.id,
                    repoId: repo.id,
                },
                data: { active: false },
            })
        }

        console.log(`Repositories removed: ${repositories_removed.map(r => r.full_name).join(', ')}`)
    }
}
