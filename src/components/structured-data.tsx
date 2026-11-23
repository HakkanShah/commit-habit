import { SITE, SITE_URL, FEATURES, FAQS, HOW_IT_WORKS } from '@/lib/site-content'

/**
 * JSON-LD for the landing page, emitted as a single `@graph`.
 *
 * One graph rather than four loose blocks, because the entities are related and
 * saying so is the point: the application `isRelatedTo` nothing on its own, but
 * an application with a named `author` who has `sameAs` links, published on a
 * `WebSite` that also carries the FAQ and the how-to, is a connected set of
 * facts a search or answer engine can resolve into one subject. Each node has a
 * stable `@id` so they reference each other instead of duplicating.
 *
 * The FAQ and how-to content is imported from the same module the page renders
 * from. That is deliberate: FAQPage markup that does not match the visible page
 * is a manual-action risk with Google, and it can only match if there is one
 * copy of the text.
 */
export function StructuredData() {
    const graph = [
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE.name,
            description: SITE.description,
            inLanguage: 'en',
            publisher: { '@id': `${SITE_URL}/#person` },
        },
        {
            '@type': 'Person',
            '@id': `${SITE_URL}/#person`,
            name: SITE.author.name,
            url: SITE.author.github,
            sameAs: [SITE.author.github, SITE.author.website],
            email: `mailto:${SITE.contactEmail}`,
            jobTitle: 'Software Developer',
            description:
                'Developer and creator of CommitHabit, an open-source tool for protecting GitHub contribution streaks without personal access tokens.',
        },
        {
            '@type': 'SoftwareApplication',
            '@id': `${SITE_URL}/#software`,
            name: SITE.name,
            alternateName: SITE.displayName,
            url: SITE_URL,
            description: SITE.description,
            applicationCategory: 'DeveloperApplication',
            applicationSubCategory: 'Developer Utility',
            operatingSystem: 'Web',
            browserRequirements: 'Requires a modern web browser and a GitHub account',
            softwareVersion: '1.0',
            isAccessibleForFree: true,
            license: SITE.license,
            codeRepository: SITE.repo,
            featureList: FEATURES,
            screenshot: `${SITE_URL}/opengraph-image`,
            image: `${SITE_URL}/opengraph-image`,
            author: { '@id': `${SITE_URL}/#person` },
            creator: { '@id': `${SITE_URL}/#person` },
            maintainer: { '@id': `${SITE_URL}/#person` },
            // A reachable support channel. There are no social accounts for this
            // project, so this is the only contact signal available — and an
            // entity a search or answer engine cannot verify a contact for is
            // one it has less reason to recommend.
            provider: { '@id': `${SITE_URL}/#person` },
            contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: SITE.contactEmail,
                url: SITE_URL,
                availableLanguage: ['English'],
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                category: 'Free',
            },
            isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
            '@type': 'HowTo',
            '@id': `${SITE_URL}/#howto`,
            name: 'How to protect your GitHub contribution streak without a personal access token',
            description:
                'Connect the official CommitHabit GitHub App, keep coding as normal, and let the daily safety net cover the days you forget.',
            totalTime: 'PT1M',
            estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
            tool: [{ '@type': 'HowToTool', name: 'A GitHub account' }],
            step: HOW_IT_WORKS.map((step, index) => ({
                '@type': 'HowToStep',
                position: index + 1,
                name: step.name,
                text: step.text,
                url: `${SITE_URL}/#how-it-works`,
            })),
            isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
            '@type': 'FAQPage',
            '@id': `${SITE_URL}/#faq`,
            mainEntity: FAQS.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
            isPartOf: { '@id': `${SITE_URL}/#website` },
        },
    ]

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': graph,
    }

    return (
        <script
            type="application/ld+json"
            // JSON.stringify output is not HTML; the only character that can break
            // out of a <script> block is "<", so it is escaped.
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
            }}
        />
    )
}
