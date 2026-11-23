/**
 * X / Twitter reuses the OpenGraph card.
 *
 * Next.js looks for `twitter-image` separately from `opengraph-image`; without
 * this file it falls back to the OG tag, which works, but declaring it
 * explicitly keeps the `twitter:image` dimensions correct on every platform
 * that reads the Twitter tags in preference (Slack and Discord both do).
 */
export { default, alt, size, contentType } from './opengraph-image'
