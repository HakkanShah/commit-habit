import type { Prisma } from '@prisma/client'

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
    cursor?: string
    limit?: number
    direction?: 'forward' | 'backward'
}

export interface PaginatedResult<T> {
    items: T[]
    nextCursor: string | null
    prevCursor: string | null
    hasMore: boolean
    total?: number
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

// ============================================================================
// Utilities
// ============================================================================

/**
 * Parse and validate pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
    const cursor = searchParams.get('cursor') ?? undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam
        ? Math.min(Math.max(1, parseInt(limitParam, 10) || DEFAULT_LIMIT), MAX_LIMIT)
        : DEFAULT_LIMIT

    return { cursor, limit }
}

/**
 * Create Prisma cursor-based pagination args
 */
export function createCursorPaginationArgs(params: PaginationParams): {
    take: number
    skip?: number
    cursor?: { id: string }
} {
    const { cursor, limit = DEFAULT_LIMIT } = params

    // Take one extra to check if there are more items
    const takeWithExtra = limit + 1

    if (cursor) {
        return {
            take: takeWithExtra,
            skip: 1, // Skip the cursor item itself
            cursor: { id: cursor }
        }
    }

    return { take: takeWithExtra }
}

/**
 * Build paginated response from query results
 */
export function buildPaginatedResponse<T extends { id: string }>(
    items: T[],
    limit: number,
    total?: number
): PaginatedResult<T> {
    const hasMore = items.length > limit
    const resultItems = hasMore ? items.slice(0, limit) : items

    const lastItem = resultItems[resultItems.length - 1]
    const firstItem = resultItems[0]

    return {
        items: resultItems,
        nextCursor: hasMore && lastItem ? lastItem.id : null,
        prevCursor: firstItem ? firstItem.id : null,
        hasMore,
        total
    }
}

/**
 * Offset-based pagination helper (for simpler cases)
 */
export function parseOffsetPagination(searchParams: URLSearchParams): {
    skip: number
    take: number
} {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(
        Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)),
        MAX_LIMIT
    )

    return {
        skip: (page - 1) * limit,
        take: limit
    }
}

/**
 * Create select object to pick only needed fields (reduces data transfer)
 */
export function createSelectFields<T extends Record<string, boolean>>(
    fields: T
): Prisma.UserSelect {
    return fields as Prisma.UserSelect
}
