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

// Stats Card Skeleton - Updated for new horizontal layout
export function StatsCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-7 w-10" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
        </div>
    )
}

// Installation Card Skeleton - Updated
export function InstallationCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl overflow-hidden">
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
        </div>
    )
}

// Header Skeleton
function HeaderSkeleton() {
    return (
        <header className="sticky top-0 z-50">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#39d353]/20 to-transparent" />
            <div className="bg-[#0d1117]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
                    {/* Logo */}
                    <Skeleton className="h-8 w-32" />

                    {/* Profile */}
                    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-1.5">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="hidden sm:block">
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-2 w-12" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

// Welcome Card Skeleton
function WelcomeCardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5">
            <Skeleton className="h-4 w-28 mb-2" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-7" />
            </div>
        </div>
    )
}

// Quick Actions Skeleton
function QuickActionsSkeleton() {
    return (
        <div className="flex flex-col-reverse lg:flex-col gap-2 lg:justify-between">
            <Skeleton className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
            </div>
        </div>
    )
}

// Dashboard Stats Skeleton (4 cards in row)
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

// Full Dashboard Skeleton - Updated to match new layout
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            {/* Subtle background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#39d353]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header Skeleton */}
            <HeaderSkeleton />

            {/* Main Content */}
            <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Welcome + Quick Actions Row */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
                    <WelcomeCardSkeleton />
                    <QuickActionsSkeleton />
                </div>

                {/* Stats Row */}
                <DashboardStatsSkeleton />

                {/* Repositories Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <DashboardInstallationsSkeleton count={2} />
                </div>

                {/* Bottom Cards Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-3 w-full mb-1" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#161b22] to-[#21262d] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-full mb-1" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
