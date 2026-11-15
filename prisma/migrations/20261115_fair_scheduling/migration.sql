-- Fair scheduling + repository facts for the commit engine.
--
-- Before this change the daily cron fetched every active installation in
-- unspecified order and broke out of its loop when it ran low on time, so the
-- same tail of the table never got processed. These columns let the scheduler
-- pick the stalest installations first and skip the ones already handled today.

ALTER TABLE "Installation"
    ADD COLUMN IF NOT EXISTS "nextEligibleAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "commitDayUtc"   TEXT,
    ADD COLUMN IF NOT EXISTS "lastCommitAt"   TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "failureCount"   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lastError"      TEXT,
    ADD COLUMN IF NOT EXISTS "readmePath"     TEXT,
    ADD COLUMN IF NOT EXISTS "defaultBranch"  TEXT,
    ADD COLUMN IF NOT EXISTS "isFork"         BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "isPrivate"      BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing rows that already ran today keep their counter, everything
-- else becomes immediately eligible so nobody waits an extra day for a commit.
UPDATE "Installation"
SET "commitDayUtc" = to_char("lastRunAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
    "lastCommitAt" = "lastRunAt"
WHERE "lastRunAt" IS NOT NULL
  AND "commitDayUtc" IS NULL;

-- Drives the scheduler query: active rows ordered by nextEligibleAt.
CREATE INDEX IF NOT EXISTS "Installation_active_nextEligibleAt_idx"
    ON "Installation" ("active", "nextEligibleAt");

-- Supports "what did we already log for this repo today".
CREATE INDEX IF NOT EXISTS "ActivityLog_installationId_createdAt_idx"
    ON "ActivityLog" ("installationId", "createdAt");
