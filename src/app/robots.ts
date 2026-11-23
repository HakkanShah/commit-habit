import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-content'

/**
 * Crawl rules.
 *
 * AI answer engines are named explicitly rather than left to the `*` rule.
 * Several of them — notably `Google-Extended` and `Applebot-Extended` — are
 * opt-out controls that only read a rule addressed to them by name, and being
 * silent is not the same as being allowed for the crawlers that treat an
 * unnamed agent conservatively. Since the goal is to be cited by these
 * engines, each one is welcomed by name.
 *
 * `/api/` and `/admin/` stay out of the index for everyone: they are
 * authenticated or machine-only and have nothing to rank.
 */
const AI_AGENTS = [
    // OpenAI: training, search index, and live user-initiated fetches.
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    // Anthropic.
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'anthropic-ai',
    // Perplexity.
    'PerplexityBot',
    'Perplexity-User',
    // Google and Apple AI surfaces (opt-out controls, hence explicit).
    'Google-Extended',
    'Applebot-Extended',
    // Others worth being present in.
    'CCBot',
    'cohere-ai',
    'Meta-ExternalAgent',
    'Bytespider',
    'Amazonbot',
    'DuckAssistBot',
]

export default function robots(): MetadataRoute.Robots {
    const disallow = ['/api/', '/admin/', '/dashboard/']

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow,
            },
            ...AI_AGENTS.map(userAgent => ({
                userAgent,
                allow: '/',
                disallow,
            })),
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
