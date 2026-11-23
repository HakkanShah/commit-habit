import { describe, it, expect } from 'vitest'
import {
    buildInitialReadme,
    toggleReadmeWhitespace,
    isAutomatedCommitMessage,
    startOfUtcDay,
    startOfNextUtcDay,
    utcDayKey,
    AUTOMATED_COMMIT_MESSAGES,
} from '@/lib/github'

describe('toggleReadmeWhitespace', () => {
    it('adds trailing whitespace to the first eligible line', () => {
        const input = '# Title\nSome text\n'
        expect(toggleReadmeWhitespace(input)).toBe('# Title  \nSome text\n')
    })

    it('removes trailing whitespace when it is already there (so the change alternates)', () => {
        const input = '# Title  \nSome text\n'
        expect(toggleReadmeWhitespace(input)).toBe('# Title\nSome text\n')
    })

    it('is its own inverse, so the README never drifts over time', () => {
        const input = '# Title\nSome text\n'
        expect(toggleReadmeWhitespace(toggleReadmeWhitespace(input))).toBe(input)
    })

    it('skips lines holding markdown links or images', () => {
        const input = '[![badge](https://img.shields.io/x)](https://example.com)\nReal line\n'
        const result = toggleReadmeWhitespace(input)
        expect(result).toBe('[![badge](https://img.shields.io/x)](https://example.com)\nReal line  \n')
    })

    it('skips table rows', () => {
        const input = '| a | b |\n| - | - |\nText\n'
        expect(toggleReadmeWhitespace(input)).toBe('| a | b |\n| - | - |\nText  \n')
    })

    it('never touches the inside of a fenced code block', () => {
        const input = '```bash\nnpm install\n```\nAfter fence\n'
        const result = toggleReadmeWhitespace(input)
        expect(result).toBe('```bash\nnpm install\n```\nAfter fence  \n')
        expect(result).toContain('```bash\nnpm install\n```')
    })

    // This is the regression that produced "successful" commits that did not exist:
    // a README with no eligible line returned unchanged content, GitHub recorded
    // no commit, and the app still counted one.
    it('always returns different content, even when every line is ineligible', () => {
        const linkOnly = '[a](b)\n|x|\n\n```\ncode\n```\n'
        const result = toggleReadmeWhitespace(linkOnly)
        expect(result).not.toBe(linkOnly)
    })

    it('still changes something for a README that is a single link', () => {
        const input = '[only](link)'
        expect(toggleReadmeWhitespace(input)).not.toBe(input)
    })

    it('rejects empty input instead of producing an empty commit', () => {
        expect(() => toggleReadmeWhitespace('')).toThrow()
    })
})

describe('isAutomatedCommitMessage', () => {
    it('recognises every message this app writes', () => {
        for (const message of AUTOMATED_COMMIT_MESSAGES) {
            expect(isAutomatedCommitMessage(message)).toBe(true)
        }
    })

    it('recognises a message with a body appended', () => {
        expect(isAutomatedCommitMessage('chore: format README.md\n\nSigned-off-by: x')).toBe(true)
    })

    it('does not claim a genuine user commit', () => {
        expect(isAutomatedCommitMessage('feat: add login page')).toBe(false)
        expect(isAutomatedCommitMessage('Merge pull request #3')).toBe(false)
    })

    it('handles empty input', () => {
        expect(isAutomatedCommitMessage('')).toBe(false)
    })
})

describe('UTC day helpers', () => {
    // These exist because the old code used local-midnight (`setHours(0,0,0,0)`),
    // which gave different answers on a developer machine and in production.
    it('startOfUtcDay truncates to UTC midnight', () => {
        const d = new Date('2026-03-14T23:45:10.500Z')
        expect(startOfUtcDay(d).toISOString()).toBe('2026-03-14T00:00:00.000Z')
    })

    it('startOfUtcDay is stable just after UTC midnight', () => {
        const d = new Date('2026-03-15T00:00:00.000Z')
        expect(startOfUtcDay(d).toISOString()).toBe('2026-03-15T00:00:00.000Z')
    })

    it('startOfNextUtcDay moves to the following midnight', () => {
        const d = new Date('2026-03-14T23:45:10.500Z')
        expect(startOfNextUtcDay(d).toISOString()).toBe('2026-03-15T00:00:00.000Z')
    })

    it('startOfNextUtcDay crosses a month boundary', () => {
        const d = new Date('2026-01-31T12:00:00.000Z')
        expect(startOfNextUtcDay(d).toISOString()).toBe('2026-02-01T00:00:00.000Z')
    })

    it('utcDayKey formats the day as YYYY-MM-DD', () => {
        expect(utcDayKey(new Date('2026-03-14T23:45:10.500Z'))).toBe('2026-03-14')
    })
})

describe('buildInitialReadme', () => {
    it('titles the README after the repository', () => {
        expect(buildInitialReadme('my-project')).toMatch(/^# my-project\n/)
    })

    it('falls back to a generic title for a blank name', () => {
        expect(buildInitialReadme('   ')).toMatch(/^# Project\n/)
    })

    it('says where the file came from, so it is not an unexplained new file', () => {
        expect(buildInitialReadme('demo')).toMatch(/Commit Habit/)
    })

    // The whole point of creating this file is to have something to touch
    // tomorrow. If every line of it were one the toggle skips - a link, a table
    // row, a fenced block - the next run would produce no change, GitHub would
    // record no commit, and the repository would be right back where it started.
    it('produces content the whitespace toggle can actually change', () => {
        const readme = buildInitialReadme('demo')
        expect(toggleReadmeWhitespace(readme)).not.toBe(readme)
    })

    it('keeps toggling cleanly on later runs rather than drifting', () => {
        const readme = buildInitialReadme('demo')
        const once = toggleReadmeWhitespace(readme)
        expect(toggleReadmeWhitespace(once)).toBe(readme)
    })

    it('changes the heading line, not the explanatory comment', () => {
        const toggled = toggleReadmeWhitespace(buildInitialReadme('demo'))
        expect(toggled).toMatch(/^# demo {2}\n/)
    })
})
