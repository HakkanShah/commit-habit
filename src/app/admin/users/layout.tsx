import type { Metadata } from 'next'

/**
 * The page itself is a client component, which cannot export `metadata`.
 * This thin layout supplies it so the browser tab is identifiable.
 */
export const metadata: Metadata = {
    title: 'Users',
    description: 'Manage CommitHabit users, repositories and access.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
