'use client'

import { useEffect } from 'react'

/**
 * One delegated click listener for every `data-track` element on the page.
 *
 * Deliberately not per-button `onClick` handlers: those force each CTA to
 * become a client component and ship a closure, and they have to be remembered
 * every time someone adds a button. A single listener on the document means a
 * new conversion point is tracked by adding one HTML attribute.
 *
 * Fails silently and never blocks navigation — analytics must not be able to
 * break a CTA. gtag may genuinely be absent: it loads on `lazyOnload`, and ad
 * blockers remove it entirely.
 */
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

export function TrackEvents() {
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null
            const el = target?.closest<HTMLElement>('[data-track]')
            if (!el) return

            const name = el.dataset.track
            if (!name) return

            try {
                window.gtag?.('event', name, {
                    event_category: 'engagement',
                    event_label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 80),
                })
            } catch {
                // Never let a tracking failure interfere with the click.
            }
        }

        document.addEventListener('click', onClick, { passive: true })
        return () => document.removeEventListener('click', onClick)
    }, [])

    return null
}
