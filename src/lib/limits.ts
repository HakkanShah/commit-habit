/**
 * Application limits configuration
 * Centralized place for all rate limits and quotas
 */

/** Maximum number of repositories a user can have */
export const MAX_REPOS_PER_USER = 3

/**
 * Maximum automated commits per repository per UTC day.
 *
 * This used to be three different numbers: the cron job capped at 4, the
 * dashboard and the installation card both rendered progress out of 5, and
 * because the cron only ran once a day the real ceiling was 1. Users saw
 * "0/5" and concluded the app was broken. One constant, used everywhere.
 */
export const MAX_COMMITS_PER_DAY = 1

/** Check if user is at repo limit */
export async function isUserAtRepoLimit(userId: string, prisma: import('@prisma/client').PrismaClient): Promise<{ atLimit: boolean; current: number; max: number }> {
    const count = await prisma.installation.count({
        where: {
            userId,
            active: true
        }
    })

    return {
        atLimit: count >= MAX_REPOS_PER_USER,
        current: count,
        max: MAX_REPOS_PER_USER
    }
}

/** Get remaining repo slots for user */
export async function getRemainingRepoSlots(userId: string, prisma: import('@prisma/client').PrismaClient): Promise<number> {
    const { current, max } = await isUserAtRepoLimit(userId, prisma)
    return Math.max(0, max - current)
}
