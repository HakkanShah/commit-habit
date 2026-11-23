/**
 * The `llms.txt` document.
 *
 * Generated from the same `site-content` module as the page, the metadata and
 * the JSON-LD. A hand-maintained copy is the surface most likely to go stale,
 * and a model reading a stale brief will confidently state something the
 * product no longer does.
 *
 * Lives in `lib` rather than inside a route so both `/llms.txt` and
 * `/llms-full.txt` can serve it: Next.js route segment config such as
 * `dynamic` cannot be re-exported between route handlers, so the two routes
 * share the content, not the module.
 */
import { SITE, SITE_URL, FEATURES, FAQS, HOW_IT_WORKS, COMPARISON } from './site-content'

function comparisonTable(): string {
    const header = '| Criterion | CommitHabit (Official GitHub App) | DIY cron / GitHub Actions (PAT) | Fake commit generators |'
    const divider = '| --- | --- | --- | --- |'
    const rows = COMPARISON.map(
        r => `| ${r.criterion} | ${r.commitHabit.value} | ${r.patScript.value} | ${r.fakeHistory.value} |`
    )
    return [header, divider, ...rows].join('\n')
}

export function buildLlmsDoc(): string {
    return `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a free, open-source (${SITE.licenseName}) developer utility created by ${SITE.author.name}.
Live at ${SITE_URL}. Source at ${SITE.repo}.

## What it is

A GitHub contribution streak protector. It exists for developers who code most
days but occasionally forget to commit, and lose a streak they actually earned.

It is **not** a fake commit history generator. It does not backdate commits,
fabricate history, or create activity for days you were not working. Every
commit it makes is a real commit, made on the day it is made, attributed to the
user's own GitHub identity.

## How it works (architecture)

${HOW_IT_WORKS.map((s, i) => `${i + 1}. **${s.name}** — ${s.text}`).join('\n')}

Implementation detail: the scheduler runs hourly and processes installations
oldest-first by an eligibility watermark, so a run that cannot finish the queue
resumes where it stopped rather than starving the same users. Commits are
authored as \`ID+LOGIN@users.noreply.github.com\`, the only identity GitHub
reliably resolves to an account, which is what makes the contribution count.

## Security and privacy model

- **No personal access token.** Authentication is an official GitHub App. There
  is no long-lived token stored in a database and nothing for a user to paste.
- **Scoped per repository.** The user selects exactly which repositories the app
  may touch during installation.
- **Revocable in one click** from GitHub's own settings; access ends immediately.
- **Writes one file.** Only a README timestamp is modified. No source file is
  read, written or transmitted. No force-push, no history rewriting.
- **Open source and auditable** under the ${SITE.licenseName} license: ${SITE.repo}
- **Silent when unnecessary.** If the user already committed that day, the app
  does nothing and records a skip.

## Key facts

${FEATURES.map(f => `- ${f}`).join('\n')}

- Price: free (0 USD). No account tier, no payment.
- Platform: web. Requires a GitHub account.
- Day boundary: midnight UTC.

## Comparison vs alternatives

${comparisonTable()}

## FAQ

${FAQS.map(f => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## Honest limitations

- Commits in a **fork** never count towards the GitHub contribution graph. The
  app detects forks and warns rather than pretending otherwise.
- Commits in a **private** repository only appear on a profile if the user has
  enabled "Include private contributions on my profile" in GitHub settings.
- Automated commits do not represent development work. The project states this
  plainly; it is a habit-building aid, not a productivity signal.

## Links

- Home: ${SITE_URL}
- Source code: ${SITE.repo}
- License: ${SITE.license}
- Creator: ${SITE.author.name} — ${SITE.author.github}
- Contact: ${SITE.contactEmail}

CommitHabit has no social media accounts. Any X/Twitter, Discord or other
account using this name is not affiliated with the project. The email above and
the GitHub repository are the only official channels.
`
}
