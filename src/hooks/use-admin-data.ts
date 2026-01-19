'use client'

import useSWR from 'swr'

// Global fetcher function
const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.')
        throw error
    }
    return res.json()
}

// SWR configuration for admin pages - cache for 5 minutes
const swrConfig = {
    revalidateOnFocus: false,      // Don't refetch on window focus
    revalidateOnReconnect: false,  // Don't refetch on reconnect
    dedupingInterval: 60000,       // Dedupe requests within 1 minute
    keepPreviousData: true,        // Keep previous data while revalidating
}

// Dashboard Stats Hook
export function useAdminStats() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/stats', fetcher, swrConfig)
    return {
        stats: data,
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Dashboard Activity Hook
export function useAdminActivity() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/activity', fetcher, swrConfig)
    return {
        activity: data,
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Users List Hook
export function useAdminUsers() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/users', fetcher, swrConfig)
    return {
        users: data,
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Testimonials/Feedback Hook
export function useAdminFeedback() {
    const { data, error, isLoading, mutate } = useSWR('/api/feedback/all', fetcher, swrConfig)
    return {
        testimonials: data,
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Email Users Hook (for recipients)
export function useEmailUsers() {
    const { data, error, isLoading, mutate } = useSWR('/api/admin/users', fetcher, swrConfig)
    return {
        users: data,
        isLoading,
        isError: error,
        refresh: mutate
    }
}
