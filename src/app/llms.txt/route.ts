import { buildLlmsDoc } from '@/lib/llms-doc'

/**
 * `/llms.txt` — the concise Markdown brief for AI agents and coding assistants,
 * following the emerging llms.txt convention.
 *
 * Static, so it is cached at the edge like any other build output.
 */
export const dynamic = 'force-static'

export async function GET() {
    return new Response(buildLlmsDoc(), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        },
    })
}
