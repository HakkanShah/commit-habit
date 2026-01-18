'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gradient-to-r from-[#21262d] via-[#30363d] to-[#21262d] bg-[length:200%_100%]',
                className
            )}
            style={{
                animation: 'shimmer 1.5s ease-in-out infinite',
            }}
        />
    )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
        </div>
    )
}

// Installation Card Skeleton
export function InstallationCardSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 sm:p-5">
            {/* Status Icon */}
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />

            {/* Repo Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-32 sm:w-48" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16 hidden sm:block" />
                </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-1.5 w-24 rounded-full" />
            </div>

            {/* Menu button */}
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        </div>
    )
}

// Full Dashboard Skeleton - Matches actual dashboard layout
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Welcome & Quick Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                {/* Welcome Card */}
                <div className="relative bg-gradient-to-br from-[#161b22] via-[#1c2128] to-[#161b22] border border-white/5 rounded-2xl p-5 sm:p-6 overflow-hidden">
                    <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Skeleton className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl hidden xs:block" />
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-7 w-28 mb-2" />
                                <Skeleton className="h-3 w-40 hidden sm:block" />
                            </div>
                        </div>
                        <Skeleton className="w-16 h-16 rounded-xl" />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col-reverse lg:flex-col gap-2 lg:justify-between">
                    <Skeleton className="h-12 rounded-xl" />
                    <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Stats Row - 2x2 on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Repositories Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl divide-y divide-white/5">
                    <InstallationCardSkeleton />
                    <InstallationCardSkeleton />
                    <InstallationCardSkeleton />
                </div>
            </div>
        </div>
    )
}

// Export for backwards compatibility
export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
        </div>
    )
}

export function DashboardInstallationsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl divide-y divide-white/5">
            {Array.from({ length: count }).map((_, i) => (
                <InstallationCardSkeleton key={i} />
            ))}
        </div>
    )
}
