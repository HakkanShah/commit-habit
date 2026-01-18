'use client'

// Reusable skeleton components for admin panel loading states

export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-white/5 rounded ${className}`}
        />
    )
}

// Dashboard skeleton - shows stat cards and activity list
export function DashboardSkeleton() {
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="w-24 h-6" />
                </div>
                <Skeleton className="w-9 h-9 rounded-full sm:w-20 sm:rounded-lg" />
            </div>

            {/* Stats Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <Skeleton className="w-10 h-10 rounded-lg mb-2" />
                        <Skeleton className="w-16 h-8 mb-1" />
                        <Skeleton className="w-12 h-3" />
                    </div>
                ))}
            </div>

            {/* Quick Actions - Mobile */}
            <div className="flex gap-3 sm:hidden">
                <Skeleton className="flex-1 h-12 rounded-xl" />
                <Skeleton className="flex-1 h-12 rounded-xl" />
            </div>

            {/* Activity List */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <Skeleton className="w-28 h-4" />
                    <Skeleton className="w-6 h-5 rounded-full" />
                </div>
                <div className="divide-y divide-white/5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Skeleton className="w-32 h-4 mb-1" />
                                <Skeleton className="w-20 h-3" />
                            </div>
                            <Skeleton className="w-8 h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Users page skeleton - shows search and user cards
export function UsersSkeleton() {
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div>
                        <Skeleton className="w-16 h-6 mb-1" />
                        <Skeleton className="w-12 h-3" />
                    </div>
                </div>
                <Skeleton className="w-9 h-9 rounded-full" />
            </div>

            {/* Search */}
            <Skeleton className="w-full h-11 rounded-xl" />

            {/* User Cards */}
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Skeleton className="w-28 h-5" />
                                    <Skeleton className="w-16 h-4 rounded-full" />
                                </div>
                                <Skeleton className="w-40 h-3 mb-2" />
                                <div className="flex gap-4">
                                    <Skeleton className="w-16 h-3" />
                                    <Skeleton className="w-16 h-3" />
                                    <Skeleton className="w-16 h-3" />
                                </div>
                            </div>
                            <Skeleton className="w-12 h-4 hidden sm:block" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Feedback page skeleton - shows filter and testimonial cards
export function FeedbackSkeleton() {
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div>
                        <Skeleton className="w-20 h-6 mb-1" />
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
                <Skeleton className="w-9 h-9 rounded-full" />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-20 h-8 rounded-lg shrink-0" />
                ))}
            </div>

            {/* Testimonial Cards */}
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="w-28 h-4 mb-1" />
                                <Skeleton className="w-20 h-3" />
                            </div>
                            <Skeleton className="w-16 h-5 rounded-full" />
                        </div>
                        {/* Stars */}
                        <div className="flex gap-1 mb-3">
                            {[...Array(5)].map((_, j) => (
                                <Skeleton key={j} className="w-4 h-4 rounded" />
                            ))}
                        </div>
                        {/* Content */}
                        <Skeleton className="w-full h-16 rounded-lg mb-3" />
                        {/* Actions */}
                        <div className="flex gap-2">
                            <Skeleton className="flex-1 h-10 rounded-lg" />
                            <Skeleton className="flex-1 h-10 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Email page skeleton - shows user selection and compose area
export function EmailSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div>
                        <Skeleton className="w-32 h-6 mb-1" />
                        <Skeleton className="w-40 h-3 hidden sm:block" />
                    </div>
                </div>
                <Skeleton className="w-9 h-9 rounded-lg" />
            </div>

            {/* Mobile Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg sm:hidden">
                <Skeleton className="flex-1 h-9 rounded-md" />
                <Skeleton className="flex-1 h-9 rounded-md" />
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-12 gap-6 h-[500px] sm:h-[600px]">
                {/* Left: User Selection */}
                <div className="lg:col-span-4 bg-[#161b22] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                    {/* Search Header */}
                    <div className="p-4 border-b border-white/5 space-y-3">
                        <Skeleton className="w-full h-10 rounded-xl" />
                        <div className="flex gap-2">
                            <Skeleton className="flex-1 h-8 rounded-lg" />
                            <Skeleton className="flex-1 h-8 rounded-lg" />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="flex-1 p-2 space-y-1">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                                <Skeleton className="w-5 h-5 rounded" />
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="w-24 h-4 mb-1" />
                                    <Skeleton className="w-32 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Compose Area */}
                <div className="lg:col-span-8 bg-[#161b22] border border-white/5 rounded-2xl flex flex-col overflow-hidden hidden lg:flex">
                    <div className="flex-1 p-6 space-y-4">
                        {/* Subject */}
                        <Skeleton className="w-full h-10 rounded-lg" />

                        {/* Body */}
                        <Skeleton className="w-full flex-1 min-h-[200px] rounded-xl" />

                        {/* Warning */}
                        <Skeleton className="w-full h-12 rounded-xl" />
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 flex justify-between items-center">
                        <Skeleton className="w-32 h-4 hidden sm:block" />
                        <div className="flex gap-3">
                            <Skeleton className="w-24 h-10 rounded-xl" />
                            <Skeleton className="w-28 h-10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
