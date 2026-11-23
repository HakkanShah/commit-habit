/**
 * One source of truth for the facts that appear in metadata, structured data,
 * `llms.txt` and the page itself.
 *
 * This file exists because those four surfaces drift. Google treats FAQPage
 * markup that does not match the visible page as spam, and an AI answer engine
 * that reads `llms.txt` saying one thing and the page saying another has no
 * reason to trust either. Everything that states a fact about CommitHabit is
 * defined once, here, and imported.
 */

/** Canonical origin. No trailing slash. */
export const SITE_URL = 'https://commithabit.vercel.app'

export const SITE = {
    url: SITE_URL,
    name: 'CommitHabit',
    /** Spaced form, used where the wordmark is rendered. */
    displayName: 'Commit Habit',
    tagline: 'Protect Your GitHub Streak Automatically',
    description:
        'CommitHabit is a free, open-source tool that protects your GitHub contribution streak using an official GitHub App — no personal access token required. It checks your activity daily and only commits a README timestamp if you did not commit that day.',
    shortDescription:
        'Protect your GitHub streak automatically. Official GitHub App, no PAT, open source, free.',
    repo: 'https://github.com/HakkanShah/commit-habit',
    license: 'https://opensource.org/licenses/MIT',
    licenseName: 'MIT',
    author: {
        name: 'Hakkan',
        github: 'https://github.com/HakkanShah',
        website: 'https://hakkan.is-a.dev',
    },
    /**
     * The project's only contact channel. There are no social accounts, so this
     * is what search and answer engines have to go on: an entity with no
     * reachable contact scores poorly on trustworthiness, and a wrong one
     * scores worse than none.
     */
    contactEmail: 'commithabit@gmail.com',
} as const

/** High-intent queries this page should answer. */
export const KEYWORDS = [
    'GitHub streak saver',
    'automate GitHub contributions safely',
    'keep GitHub green squares alive',
    'GitHub streak protector without PAT',
    'GitHub contribution streak tool',
    'protect GitHub streak',
    'GitHub App daily commit',
    'open source GitHub streak tool',
    'free GitHub contribution automation',
    'GitHub streak without personal access token',
]

export const FEATURES = [
    'Official GitHub App — no personal access token required',
    'Only commits when you have not committed that day',
    'Touches a README timestamp, never your source code',
    'Open source and auditable under the MIT license',
    'One-click revocation from GitHub settings',
    'Privacy-first — no code is read or stored',
    'Free, with no account or payment required',
]

// ============================================================================
// How it works
// ============================================================================

export interface HowToStep {
    name: string
    text: string
}

export const HOW_IT_WORKS: HowToStep[] = [
    {
        name: 'Connect the official GitHub App',
        text: 'Install the CommitHabit GitHub App and choose which repositories it may access. No personal access token is created, and you can revoke access from your GitHub settings at any time.',
    },
    {
        name: 'Code normally',
        text: 'Keep working as you always do. CommitHabit checks whether you authored a commit in the selected repository today, and stays completely silent if you did.',
    },
    {
        name: 'The daily safety net runs',
        text: 'If the day passes with no commit from you, CommitHabit updates a timestamp in the repository README and commits it under your GitHub identity, so the contribution appears on your graph.',
    },
]

// ============================================================================
// Comparison
// ============================================================================

export interface ComparisonRow {
    criterion: string
    commitHabit: { value: string; good: boolean }
    patScript: { value: string; good: boolean }
    fakeHistory: { value: string; good: boolean }
}

export const COMPARISON: ComparisonRow[] = [
    {
        criterion: 'Credential required',
        commitHabit: { value: 'Official GitHub App — no PAT', good: true },
        patScript: { value: 'Personal access token with write scope', good: false },
        fakeHistory: { value: 'Personal access token or local git config', good: false },
    },
    {
        criterion: 'Setup time',
        commitHabit: { value: 'About 30 seconds, two clicks', good: true },
        patScript: { value: '20–60 minutes of scripting and debugging', good: false },
        fakeHistory: { value: 'Minutes, but produces junk history', good: false },
    },
    {
        criterion: 'Modifies your source code',
        commitHabit: { value: 'No — only a README timestamp', good: true },
        patScript: { value: 'Depends entirely on your script', good: false },
        fakeHistory: { value: 'Yes — rewrites or fabricates history', good: false },
    },
    {
        criterion: 'Honest about what it did',
        commitHabit: { value: 'Yes — real commits, visible log of every action', good: true },
        patScript: { value: 'Yes, if you wrote it that way', good: true },
        fakeHistory: { value: 'No — backdates commits that never happened', good: false },
    },
    {
        criterion: 'Revoking access',
        commitHabit: { value: 'One click in GitHub settings', good: true },
        patScript: { value: 'Manually delete the token and the workflow', good: false },
        fakeHistory: { value: 'History already written; cannot be undone cleanly', good: false },
    },
    {
        criterion: 'Cost',
        commitHabit: { value: 'Free and open source (MIT)', good: true },
        patScript: { value: 'Free, but your time and maintenance', good: true },
        fakeHistory: { value: 'Often paid, and risks your credibility', good: false },
    },
]

// ============================================================================
// FAQ
// ============================================================================

export interface FaqItem {
    question: string
    /** Plain text. Rendered verbatim on the page and emitted verbatim in FAQPage JSON-LD. */
    answer: string
}

export const FAQS: FaqItem[] = [
    {
        question: 'Is CommitHabit safe, and does it need a personal access token?',
        answer:
            'No personal access token is required. CommitHabit uses an official GitHub App, which means access is scoped to only the repositories you pick, is granted through GitHub itself rather than a token you paste somewhere, and can be revoked in one click from your GitHub settings. The whole codebase is open source under the MIT license, so you can read exactly what it does before installing it.',
    },
    {
        question: 'Will it change my source code?',
        answer:
            'No. CommitHabit only adjusts a timestamp in the repository README. It never reads, writes or touches any other file, and it never force-pushes or rewrites history. If a repository has no README, it creates a simple starter one so there is a file to maintain, and tells you it did so.',
    },
    {
        question: 'What happens on days I already committed?',
        answer:
            'Nothing at all. Before doing anything, CommitHabit asks GitHub whether you authored a commit in that repository today. If you did, it stays silent and records a skip in your activity log. It only steps in on days you would otherwise have an empty square.',
    },
    {
        question: 'When exactly does the daily check run?',
        answer:
            'The schedule is based on UTC, and the day boundary is midnight UTC. Your contribution graph on GitHub also uses a fixed day boundary, so if your local timezone is far from UTC, a commit made late in your evening may land on the next day on your graph. CommitHabit runs throughout the day rather than once, so a repository missed by one run is picked up by a later one.',
    },
    {
        question: 'Does it work with private repositories?',
        answer:
            'Yes, but GitHub only shows private contributions on your profile if you enable "Include private contributions on my profile" in your GitHub profile settings. Without that setting the commit is still made, it simply will not be visible to others. CommitHabit shows a warning on your dashboard when a connected repository is private so this never surprises you.',
    },
    {
        question: 'How do I stop or remove it?',
        answer:
            'You can pause any repository from the CommitHabit dashboard, which stops all activity immediately while keeping your settings. To remove it entirely, uninstall the GitHub App from your GitHub settings under Applications. Access ends the moment you do — there is no token left behind to clean up.',
    },
    {
        question: 'Is this against GitHub rules, or dishonest?',
        answer:
            'CommitHabit makes real commits to real repositories you own, under your own identity, with no backdating or fabricated history. It is a maintenance commit, the same as fixing a typo in a README. It is not a fake history generator. That said, automated commits do not represent development work, and the project says so plainly — it is a habit-building aid, not a way to look more productive than you are.',
    },
]
