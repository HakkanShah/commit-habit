/**
 * Performance utilities for throttling, debouncing, and optimization
 */

/**
 * Throttle function - limits how often a function can be called
 * @param fn Function to throttle
 * @param delay Minimum time between calls in ms
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (...args: Parameters<T>) => {
        const now = Date.now()

        if (now - lastCall >= delay) {
            lastCall = now
            fn(...args)
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCall = Date.now()
                timeoutId = null
                fn(...args)
            }, delay - (now - lastCall))
        }
    }
}

/**
 * Debounce function - delays execution until after wait period of inactivity
 * @param fn Function to debounce
 * @param wait Wait time in ms
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), wait)
    }
}

/**
 * Request Animation Frame throttle - for smooth scroll/resize handlers
 * @param fn Function to throttle with RAF
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
    fn: T
): (...args: Parameters<T>) => void {
    let rafId: number | null = null

    return (...args: Parameters<T>) => {
        if (rafId) return

        rafId = requestAnimationFrame(() => {
            fn(...args)
            rafId = null
        })
    }
}

/**
 * Check if element is in viewport
 * @param element Element to check
 * @param threshold Percentage of element that must be visible (0-1)
 */
export function isInViewport(element: Element, threshold = 0): boolean {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight

    if (threshold === 0) {
        return rect.top <= windowHeight && rect.bottom >= 0
    }

    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
    const elementHeight = rect.height

    return visibleHeight / elementHeight >= threshold
}

/**
 * Preload an image for faster rendering
 * @param src Image source URL
 */
export function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = src
    })
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Idle callback wrapper with fallback
 * @param callback Function to run when idle
 * @param timeout Maximum wait time in ms
 */
export function runWhenIdle(callback: () => void, timeout = 2000): void {
    if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
            .requestIdleCallback(callback, { timeout })
    } else {
        setTimeout(callback, 1)
    }
}
