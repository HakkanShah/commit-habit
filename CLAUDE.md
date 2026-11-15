# commit-habit — working notes for Claude

## Commits

Author commits as:

```
HakkanShah <hakkanparbej@gmail.com>
```

Set both author and committer to that. Never substitute another name or
address, and never pick an identity yourself — if anything about the
authorship is unclear, ask first.

Do **not** add attribution trailers to commit messages or PR descriptions.
No `Co-Authored-By: Claude ...`, no `Claude-Session: ...`, no
"Generated with Claude Code" footer. These are tooling metadata, not part of
this project's history. Write the commit message and stop.

## Core invariant

This app exists to put commits on a user's GitHub contribution graph. A commit
that lands in a repository but not on the graph is a failure, not a success.
Three things break that, and all three are easy to reintroduce:

1. **Attribution.** Commits must be authored as
   `ID+LOGIN@users.noreply.github.com` (GitHub resolves it by account id, so it
   works even when the user hides their email). A profile email only counts
   while it is a *verified* address on the account. Never fall back to the
   GitHub App's bot identity — skip the run instead.
2. **Forks and private repos.** GitHub never counts commits in a fork, and
   private commits need the user's private-contributions setting. Surface these,
   do not paper over them.
3. **No-op commits.** If the file content does not actually change, GitHub
   records no commit. Always assert the content differs before reporting success.

All commit paths (cron, user button, admin button) must go through
`src/lib/commit-service.ts`. They were three divergent copies once and each copy
had its own bug.

## Scheduler

`src/app/api/cron/daily/route.ts` must stay starvation-free: work is ordered by
`nextEligibleAt` (oldest first) and each row is reserved atomically before
processing. Never process a plain unordered `findMany` and bail out partway —
that silently starves the same users every run, which is the bug this design
replaced.

## Limits

`MAX_COMMITS_PER_DAY` and `MAX_REPOS_PER_USER` live in `src/lib/limits.ts`.
Import them; do not hardcode the numbers in UI or route handlers.
