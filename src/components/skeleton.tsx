'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-[#21262d]',
                className
            )}
        />
    )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg" />
                <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 sm:h-8 w-8 sm:w-12" />
        </div>
    )
}

// Installation Card Skeleton
export function InstallationCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 p-4 sm:p-5">
                {/* Status Icon */}
                <Skeleton className="w-12 h-12 rounded-xl" />

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
                <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
        </div>
    )
}

// Dashboard Stats Skeleton (4 cards)
export function DashboardStatsSkeleton() {
    return (
        <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>
        </div>
    )
}

// Dashboard Installations Skeleton (multiple cards)
export function DashboardInstallationsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <InstallationCardSkeleton key={i} />
            ))}
        </div>
    )
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
    return (
        <>
            {/* Welcome Section Skeleton */}
            <div className="mb-8 sm:mb-10">
                <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
                <Skeleton className="h-4 w-64 sm:w-96" />
            </div>

            {/* Stats Cards Skeleton */}
            <DashboardStatsSkeleton />

            {/* Repository List Skeleton */}
            <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            <DashboardInstallationsSkeleton count={2} />
        </>
    )
}
