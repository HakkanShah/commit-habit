import { DashboardSkeleton } from '@/components/skeleton'
import { Skeleton } from '@/components/skeleton'

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Background effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#39d353]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header Skeleton */}
            <header className="sticky top-0 z-50">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#39d353]/30 to-transparent" />
                <div className="bg-[#0d1117]/80 backdrop-blur-xl">
                    <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
                        {/* Logo skeleton */}
                        <div className="flex items-center gap-1">
                            <Skeleton className="w-28 h-7 rounded" />
                        </div>

                        {/* Profile skeleton */}
                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-1.5">
                            <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
                            <div className="hidden sm:block">
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-2 w-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <DashboardSkeleton />
            </main>
        </div>
    )
}
