/**
 * Sound Effects Utility for Notifications
 * 
 * Uses Web Audio API to generate subtle, pleasant notification sounds.
 * No external audio files required - sounds are synthesized in the browser.
 * 
 * Sound design principles:
 * - Subtle and non-intrusive
 * - Distinct but not jarring
 * - Short duration (< 500ms)
 * - Respects user preferences (reduced motion = reduced sound)
 */

// ============================================================================
// Types
// ============================================================================

export type SoundType = 'success' | 'error' | 'warning' | 'info' | 'click' | 'dismiss'

interface SoundConfig {
    frequencies: number[]
    durations: number[]
    gains: number[]
    waveform: OscillatorType
    fadeOut?: boolean
}

// ============================================================================
// Sound Configurations
// ============================================================================

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
    // Soft, pleasant "ding" for success - gentle major chord
    success: {
        frequencies: [880, 1108.73], // A5, C#6 - soft major third
        durations: [0.08, 0.12],
        gains: [0.06, 0.04], // Very soft
        waveform: 'sine',
        fadeOut: true,
    },
    // Gentle low hum for errors - non-alarming
    error: {
        frequencies: [330, 277.18], // E4, C#4 - soft descending
        durations: [0.1, 0.14],
        gains: [0.05, 0.04], // Very soft
        waveform: 'sine',
        fadeOut: true,
    },
    // Soft double-tap for warnings
    warning: {
        frequencies: [523.25, 493.88], // C5, B4 - gentle attention
        durations: [0.06, 0.1],
        gains: [0.04, 0.05],
        waveform: 'sine',
        fadeOut: true,
    },
    // Soft pop for info - single gentle note
    info: {
        frequencies: [698.46], // F5 - pleasant single tone
        durations: [0.08],
        gains: [0.04], // Very subtle
        waveform: 'sine',
        fadeOut: true,
    },
    // Barely audible click
    click: {
        frequencies: [1200],
        durations: [0.02],
        gains: [0.02], // Almost silent
        waveform: 'sine',
        fadeOut: false,
    },
    // Soft fade-out for dismiss
    dismiss: {
        frequencies: [523.25, 392], // C5, G4 - gentle descending
        durations: [0.04, 0.06],
        gains: [0.03, 0.02], // Very subtle
        waveform: 'sine',
        fadeOut: true,
    },
}

// ============================================================================
// Audio Context Management
// ============================================================================

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        } catch {
            console.warn('[Sound] Web Audio API not supported')
            return null
        }
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
            // Silent fail - user hasn't interacted with page yet
        })
    }

    return audioContext
}

// ============================================================================
// Sound Playback
// ============================================================================

/**
 * Check if sounds should be enabled based on user preferences
 */
function shouldPlaySound(): boolean {
    if (typeof window === 'undefined') return false

    // Respect reduced motion preference as indicator of reduced sensory input
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return false

    // Check localStorage for user preference
    try {
        const soundPref = localStorage.getItem('commit-habit-sounds')
        if (soundPref === 'disabled') return false
    } catch {
        // localStorage not available
    }

    return true
}

/**
 * Play a notification sound
 * @param type - Type of sound to play
 */
export function playSound(type: SoundType): void {
    if (!shouldPlaySound()) return

    const ctx = getAudioContext()
    if (!ctx) return

    const config = SOUND_CONFIGS[type]
    if (!config) return

    let currentTime = ctx.currentTime

    config.frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = config.waveform
        oscillator.frequency.setValueAtTime(freq, currentTime)

        const gain = config.gains[i] || 0.1
        const duration = config.durations[i] || 0.1

        gainNode.gain.setValueAtTime(gain, currentTime)

        if (config.fadeOut) {
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)
        }

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.start(currentTime)
        oscillator.stop(currentTime + duration)

        currentTime += duration * 0.7 // Slight overlap for smoother sound
    })
}

/**
 * Play success sound
 */
export function playSuccessSound(): void {
    playSound('success')
}

/**
 * Play error sound
 */
export function playErrorSound(): void {
    playSound('error')
}

/**
 * Play warning sound
 */
export function playWarningSound(): void {
    playSound('warning')
}

/**
 * Play info sound
 */
export function playInfoSound(): void {
    playSound('info')
}

/**
 * Play click sound
 */
export function playClickSound(): void {
    playSound('click')
}

/**
 * Play dismiss sound
 */
export function playDismissSound(): void {
    playSound('dismiss')
}

// ============================================================================
// Sound Preferences
// ============================================================================

/**
 * Enable sounds
 */
export function enableSounds(): void {
    try {
        localStorage.setItem('commit-habit-sounds', 'enabled')
    } catch {
        // Silent fail
    }
}

/**
 * Disable sounds
 */
export function disableSounds(): void {
    try {
        localStorage.setItem('commit-habit-sounds', 'disabled')
    } catch {
        // Silent fail
    }
}

/**
 * Toggle sounds on/off
 */
export function toggleSounds(): boolean {
    try {
        const current = localStorage.getItem('commit-habit-sounds')
        const newValue = current === 'disabled' ? 'enabled' : 'disabled'
        localStorage.setItem('commit-habit-sounds', newValue)
        return newValue === 'enabled'
    } catch {
        return true
    }
}

/**
 * Check if sounds are enabled
 */
export function areSoundsEnabled(): boolean {
    return shouldPlaySound()
}
