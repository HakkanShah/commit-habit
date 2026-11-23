'use client'

import { ToastProvider } from '@/components/toast'
import { TrackEvents } from '@/components/track-events'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <TrackEvents />
            {children}
        </ToastProvider>
    )
}
