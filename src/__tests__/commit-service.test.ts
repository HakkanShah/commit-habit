import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

// Stub the GitHub layer so these tests exercise the engine's decisions, not the network.
vi.mock('@/lib/github', async () => {
    const actual = await vi.importActual<typeof import('@/lib/github')>('@/lib/github')
    return {
        ...actual,
        getInstallationOctokit: vi.fn(async () => ({}) as never),
        getRepoMeta: vi.fn(async () => ({
            defaultBranch: 'main',
            isFork: false,
            isPrivate: false,
            fullName: 'octocat/demo',
        })),
        hasUserCommitsToday: vi.fn(async () => false),
        getReadmeContent: vi.fn(async () => ({
            content: '# Demo\nSome text\n',
            sha: 'readme-sha',
            path: 'README.md',
        })),
        commitReadmeUpdate: vi.fn(async () => 'abcdef1234567890'),
    }
})

import {
    runCommitForInstallation,
    resolveCommitAuthor,
    nextEligibleAfterFailure,
    getErrorAction,
    type InstallationForCommit,
} from '@/lib/commit-service'
import {
    getRepoMeta,
    hasUserCommitsToday,
    getReadmeContent,
    commitReadmeUpdate,
} from '@/lib/github'
import { GitHubError } from '@/lib/errors'
import { MAX_COMMITS_PER_DAY } from '@/lib/limits'

const NOW = new Date('2026-03-14T06:07:00.000Z')
const TODAY = '2026-03-14'
const TOMORROW = new Date('2026-03-15T00:00:00.000Z')

function makeInstallation(overrides: Partial<InstallationForCommit> = {}): InstallationForCommit {
    return {
        id: 'inst-1',
        installationId: 42,
        repoFullName: 'octocat/demo',
        active: true,
        commitsToday: 0,
        commitDayUtc: null,
        readmePath: null,
        defaultBranch: null,
        isFork: false,
        isPrivate: false,
        failureCount: 0,
        user: {
            name: 'Octo Cat',
            deletedAt: null,
            accounts: [
                {
                    provider: 'github',
                    providerAccountId: '583231',
                    providerUsername: 'octocat',
                },
            ],
        },
        ...overrides,
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.activityLog.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as never)
    vi.mocked(prisma.installation.update).mockResolvedValue({} as never)
    vi.mocked(getRepoMeta).mockResolvedValue({
        defaultBranch: 'main',
        isFork: false,
        isPrivate: false,
        fullName: 'octocat/demo',
    })
    vi.mocked(hasUserCommitsToday).mockResolvedValue(false)
    vi.mocked(getReadmeContent).mockResolvedValue({
        content: '# Demo\nSome text\n',
        sha: 'readme-sha',
        path: 'README.md',
    })
    vi.mocked(commitReadmeUpdate).mockResolvedValue('abcdef1234567890')
})

describe('resolveCommitAuthor', () => {
    // The noreply form is the only identity guaranteed to reach the contribution
    // graph. The admin path used to use the profile email instead, which silently
    // produced commits that counted for nobody.
    it('builds the GitHub noreply identity from the account id and login', () => {
        const author = resolveCommitAuthor(makeInstallation())
        expect(author).toEqual({
            name: 'Octo Cat',
            email: '583231+octocat@users.noreply.github.com',
            login: 'octocat',
        })
    })

    it('falls back to the login when the user has no display name', () => {
        const installation = makeInstallation()
        installation.user.name = null
        expect(resolveCommitAuthor(installation)?.name).toBe('octocat')
    })

    it('returns null when the GitHub username is missing', () => {
        const installation = makeInstallation()
        installation.user.accounts[0].providerUsername = null
        expect(resolveCommitAuthor(installation)).toBeNull()
    })

    it('returns null when there is no GitHub account at all', () => {
        const installation = makeInstallation()
        installation.user.accounts = []
        expect(resolveCommitAuthor(installation)).toBeNull()
    })

    it('returns null for a non-numeric account id, which cannot form a valid noreply address', () => {
        const installation = makeInstallation()
        installation.user.accounts[0].providerAccountId = 'dev-admin'
        expect(resolveCommitAuthor(installation)).toBeNull()
    })
})

describe('runCommitForInstallation', () => {
    it('commits and records the result', async () => {
        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome.status).toBe('committed')
        expect(outcome).toMatchObject({ sha: 'abcdef1234567890', repo: 'octocat/demo' })

        // The commit must carry the user's identity, never the app's bot identity.
        expect(vi.mocked(commitReadmeUpdate).mock.calls[0][5]).toEqual({
            name: 'Octo Cat',
            email: '583231+octocat@users.noreply.github.com',
            login: 'octocat',
        })

        // And the counter has to be keyed to the UTC day it belongs to.
        expect(prisma.installation.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'inst-1' },
                data: expect.objectContaining({
                    commitsToday: 1,
                    commitDayUtc: TODAY,
                    nextEligibleAt: TOMORROW,
                    failureCount: 0,
                    readmePath: 'README.md',
                }),
            })
        )
    })

    it('commits to the README path GitHub actually resolved, not a hardcoded README.md', async () => {
        vi.mocked(getReadmeContent).mockResolvedValue({
            content: '# Lower\nbody\n',
            sha: 'sha2',
            path: 'readme.md',
        })

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome.status).toBe('committed')
        expect(vi.mocked(commitReadmeUpdate).mock.calls[0][6]).toMatchObject({ path: 'readme.md' })
    })

    it('skips without touching GitHub when the user has no linked identity', async () => {
        const installation = makeInstallation()
        installation.user.accounts = []

        const outcome = await runCommitForInstallation(installation, { now: NOW })

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'no_identity' })
        // Crucially: no bot-authored commit is made as a consolation prize.
        expect(commitReadmeUpdate).not.toHaveBeenCalled()
        expect(getRepoMeta).not.toHaveBeenCalled()
    })

    it("skips when today's quota is already used, without spending API calls", async () => {
        const installation = makeInstallation({
            commitsToday: MAX_COMMITS_PER_DAY,
            commitDayUtc: TODAY,
        })

        const outcome = await runCommitForInstallation(installation, { now: NOW })

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'daily_limit' })
        expect(getRepoMeta).not.toHaveBeenCalled()
        expect(commitReadmeUpdate).not.toHaveBeenCalled()
    })

    it("ignores a counter left over from a previous day", async () => {
        // The old reset depended on lastRunAt and could leave a stale count in
        // place, locking the user out of commits.
        const installation = makeInstallation({
            commitsToday: 99,
            commitDayUtc: '2026-03-13',
        })

        const outcome = await runCommitForInstallation(installation, { now: NOW })

        expect(outcome.status).toBe('committed')
        expect(prisma.installation.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ commitsToday: 1, commitDayUtc: TODAY }),
            })
        )
    })

    it('skips when the user already committed today for real', async () => {
        vi.mocked(hasUserCommitsToday).mockResolvedValue(true)

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'has_real_commits' })
        expect(commitReadmeUpdate).not.toHaveBeenCalled()
    })

    it('scopes the commit check to the user, not the whole repository', async () => {
        await runCommitForInstallation(makeInstallation(), { now: NOW })

        // A collaborator's or Dependabot's commit must not count as the user's.
        expect(hasUserCommitsToday).toHaveBeenCalledWith(
            expect.anything(),
            'octocat',
            'demo',
            'octocat',
            NOW
        )
    })

    it('commits anyway when the user pressed the button themselves', async () => {
        vi.mocked(hasUserCommitsToday).mockResolvedValue(true)

        const outcome = await runCommitForInstallation(makeInstallation(), {
            now: NOW,
            ignoreExistingCommits: true,
        })

        expect(outcome.status).toBe('committed')
        expect(hasUserCommitsToday).not.toHaveBeenCalled()
    })

    it('still enforces the daily cap for a manual request', async () => {
        const installation = makeInstallation({
            commitsToday: MAX_COMMITS_PER_DAY,
            commitDayUtc: TODAY,
        })

        const outcome = await runCommitForInstallation(installation, {
            now: NOW,
            ignoreExistingCommits: true,
        })

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'daily_limit' })
    })

    it('skips cleanly when the repository has no README', async () => {
        vi.mocked(getReadmeContent).mockResolvedValue(null)

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'no_readme' })
        expect(commitReadmeUpdate).not.toHaveBeenCalled()
    })

    it('warns that commits in a fork will never show on the graph', async () => {
        vi.mocked(getRepoMeta).mockResolvedValue({
            defaultBranch: 'main',
            isFork: true,
            isPrivate: false,
            fullName: 'octocat/demo',
        })

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome.status).toBe('committed')
        expect(outcome.warnings.join(' ')).toMatch(/fork/i)
    })

    it('warns about private repositories needing the private-contributions setting', async () => {
        vi.mocked(getRepoMeta).mockResolvedValue({
            defaultBranch: 'main',
            isFork: false,
            isPrivate: true,
            fullName: 'octocat/demo',
        })

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome.warnings.join(' ')).toMatch(/private/i)
    })

    it('uses cached repository facts instead of re-fetching them every run', async () => {
        const installation = makeInstallation({ defaultBranch: 'develop' })

        const outcome = await runCommitForInstallation(installation, { now: NOW })

        expect(outcome.status).toBe('committed')
        expect(getRepoMeta).not.toHaveBeenCalled()
        expect(vi.mocked(commitReadmeUpdate).mock.calls[0][6]).toMatchObject({ branch: 'develop' })
    })

    it('refuses to report success when the README content would not change', async () => {
        // Guard against the no-op commit: GitHub records nothing, we must not
        // claim a commit.
        vi.mocked(getReadmeContent).mockResolvedValue({
            content: '[a](b)\n',
            sha: 'sha',
            path: 'README.md',
        })
        const githubModule = await import('@/lib/github')
        const spy = vi
            .spyOn(githubModule, 'toggleReadmeWhitespace')
            .mockReturnValue('[a](b)\n')

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        // Assert the spy really intercepted, so this cannot pass for another reason.
        expect(spy).toHaveBeenCalled()
        expect(outcome).toMatchObject({ status: 'failed', errorCode: 'GITHUB_004' })
        expect(commitReadmeUpdate).not.toHaveBeenCalled()
        spy.mockRestore()
    })

    it('reports a failure instead of throwing, so a batch survives one bad repo', async () => {
        vi.mocked(getReadmeContent).mockRejectedValue(
            GitHubError.rateLimited(60_000, { owner: 'octocat' })
        )

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome).toMatchObject({ status: 'failed', errorCode: 'GITHUB_001' })
    })

    it('deactivates an installation that lost repository access', async () => {
        vi.mocked(getRepoMeta).mockRejectedValue(
            GitHubError.permissionDenied('update README', { owner: 'octocat' })
        )

        const outcome = await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(outcome.status).toBe('failed')
        expect(prisma.installation.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ active: false }),
            })
        )
    })

    it('clears cached repo facts after a not-found error so a rename can recover', async () => {
        vi.mocked(getReadmeContent).mockRejectedValue(
            GitHubError.notFound('README', { owner: 'octocat' })
        )

        await runCommitForInstallation(makeInstallation({ defaultBranch: 'main' }), { now: NOW })

        expect(prisma.installation.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ defaultBranch: null, readmePath: null }),
            })
        )
    })

    it('does nothing for a paused installation', async () => {
        const outcome = await runCommitForInstallation(
            makeInstallation({ active: false }),
            { now: NOW }
        )

        expect(outcome).toMatchObject({ status: 'skipped', reason: 'paused' })
        expect(getRepoMeta).not.toHaveBeenCalled()
    })

    it('does not write the same skip reason twice in one day', async () => {
        vi.mocked(prisma.activityLog.findFirst).mockResolvedValue({ id: 'existing' } as never)
        vi.mocked(hasUserCommitsToday).mockResolvedValue(true)

        await runCommitForInstallation(makeInstallation(), { now: NOW })

        expect(prisma.activityLog.create).not.toHaveBeenCalled()
    })
})

describe('nextEligibleAfterFailure', () => {
    // A transient GitHub problem must not cost the user their day.
    it('retries a retryable failure within the same day', () => {
        const retryAt = nextEligibleAfterFailure(1, true, NOW)
        expect(retryAt.getTime()).toBeGreaterThan(NOW.getTime())
        expect(retryAt.getTime()).toBeLessThan(TOMORROW.getTime())
    })

    it('backs off further with each consecutive failure', () => {
        const first = nextEligibleAfterFailure(0, true, NOW)
        const second = nextEligibleAfterFailure(1, true, NOW)
        expect(second.getTime()).toBeGreaterThan(first.getTime())
    })

    it('never schedules past the end of the day', () => {
        const lateInDay = new Date('2026-03-14T23:50:00.000Z')
        expect(nextEligibleAfterFailure(5, true, lateInDay).getTime()).toBeLessThanOrEqual(
            TOMORROW.getTime()
        )
    })

    it('waits for tomorrow on a permanent failure instead of hammering the API', () => {
        expect(nextEligibleAfterFailure(1, false, NOW).toISOString()).toBe(TOMORROW.toISOString())
    })
})

describe('getErrorAction', () => {
    it.each([
        ['GITHUB_003', 'error_permission'],
        ['GITHUB_002', 'error_not_found'],
        ['GITHUB_001', 'error_rate_limited'],
        ['GITHUB_007', 'error_conflict'],
    ] as const)('maps %s to %s', (_code, expected) => {
        const error =
            _code === 'GITHUB_003' ? GitHubError.permissionDenied('x')
                : _code === 'GITHUB_002' ? GitHubError.notFound('x')
                    : _code === 'GITHUB_001' ? GitHubError.rateLimited(1000)
                        : GitHubError.conflict('x')
        expect(getErrorAction(error)).toBe(expected)
    })

    it('falls back to error_unknown for anything else', () => {
        expect(getErrorAction(new Error('boom'))).toBe('error_unknown')
    })
})
