import { buildLlmsDoc } from '@/lib/llms-doc'

/**
 * `/llms-full.txt` — the long-form variant of the convention.
 *
 * CommitHabit is a single-page product: its full documentation and its concise
 * brief are the same document. Serving the same generated Markdown is better
 * than maintaining a second copy that would drift out of date.
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
