import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
    if (!date) return 'Never'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function getStartOfDay(date: Date = new Date()): Date {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    return start
}

export function getEndOfDay(date: Date = new Date()): Date {
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return end
}
