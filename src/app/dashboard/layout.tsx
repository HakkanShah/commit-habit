import type { Metadata } from 'next'

/**
 * The dashboard is private: it must not be indexed, and the tab should say
 * what it is rather than repeating the marketing title.
 */
export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Your CommitHabit repositories, streak status and activity.',
    robots: { index: false, follow: false, nocache: true },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return children
}
