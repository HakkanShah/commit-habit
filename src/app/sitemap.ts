import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-content'

/**
 * Sitemap.
 *
 * Only the landing page is listed. `/dashboard` and `/admin` are behind
 * authentication and would be soft-404s to a crawler, so including them would
 * cost crawl budget and earn nothing. The in-page anchors are listed as part of
 * the landing page rather than as separate URLs, because they are not separate
 * documents.
 *
 * `lastModified` uses the build time: the page is statically rendered, so the
 * build is genuinely the last moment its content could have changed. Sending
 * `new Date()` at request time, as this did before, claims the page changes on
 * every crawl and teaches crawlers to ignore the signal.
 */
const LAST_MODIFIED = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: SITE_URL,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'weekly',
            priority: 1,
        },
    ]
}
