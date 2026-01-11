import { DashboardSkeleton } from '@/components/skeleton'

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Header Skeleton */}
            <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#21262d] animate-pulse" />
                            <div className="h-5 w-24 bg-[#21262d] rounded animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#21262d] animate-pulse" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
                <DashboardSkeleton />
            </main>
        </div>
    )
}
