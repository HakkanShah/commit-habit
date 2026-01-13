'use server'

// ============================================================================
// Discord Analytics - Visitor Tracking
// ============================================================================

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

interface VisitorData {
    page: string
    userAgent?: string
    ip?: string
    country?: string
    referrer?: string
    timestamp: string
    visitorNumber?: number // Total visitor count for this page
}

/**
 * Send visitor notification to Discord webhook
 */
export async function sendVisitorNotification(data: VisitorData): Promise<boolean> {
    if (!DISCORD_WEBHOOK_URL) {
        console.warn('[ANALYTICS] Discord webhook URL not configured')
        return false
    }

    // Parse user agent for browser/OS info
    const browserInfo = parseUserAgent(data.userAgent || '')

    // Detect localhost
    const isLocalhost = data.ip === '127.0.0.1' || data.ip === '::1' || !data.ip
    const displayLocation = isLocalhost ? '🏠 Localhost' : (data.country || 'Unknown')
    const displayIP = isLocalhost ? '127.0.0.1' : (data.ip || 'Unknown')

    // Page display name
    const pageName = data.page === '/dashboard' ? '📊 Dashboard' : '🏠 Homepage'

    // Create Discord embed
    const embed = {
        title: `👀 Visitor #${data.visitorNumber || '?'} — ${pageName}`,
        color: isLocalhost ? 0xfbbf24 : 0x39d353, // Yellow for localhost, green for production
        fields: [
            {
                name: '📄 Page',
                value: data.page || '/',
                inline: true,
            },
            {
                name: '🌍 Location',
                value: displayLocation,
                inline: true,
            },
            {
                name: '🌐 IP Address',
                value: `\`${displayIP}\``,
                inline: true,
            },
            {
                name: '🖥️ Browser',
                value: browserInfo.browser || 'Unknown',
                inline: true,
            },
            {
                name: '💻 OS',
                value: browserInfo.os || 'Unknown',
                inline: true,
            },
            {
                name: '📱 Device',
                value: browserInfo.device || 'Desktop',
                inline: true,
            },
            {
                name: '🔗 Referrer',
                value: data.referrer || 'Direct',
                inline: false,
            },
        ],
        footer: {
            text: isLocalhost ? 'CommitHabit Analytics (Dev)' : `CommitHabit Analytics • Total: ${data.visitorNumber || '?'} unique visitors`,
        },
        timestamp: data.timestamp,
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
            }),
        })

        if (!response.ok) {
            console.error('[ANALYTICS] Discord webhook failed:', response.status)
            return false
        }

        return true
    } catch (error) {
        console.error('[ANALYTICS] Failed to send Discord notification:', error)
        return false
    }
}

/**
 * Simple user agent parser
 */
function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
    let browser = 'Unknown'
    let os = 'Unknown'
    let device = 'Desktop'

    // Detect browser
    if (ua.includes('Firefox')) {
        browser = 'Firefox'
    } else if (ua.includes('Edg')) {
        browser = 'Edge'
    } else if (ua.includes('Chrome')) {
        browser = 'Chrome'
    } else if (ua.includes('Safari')) {
        browser = 'Safari'
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
        browser = 'Opera'
    }

    // Detect OS
    if (ua.includes('Windows')) {
        os = 'Windows'
    } else if (ua.includes('Mac OS')) {
        os = 'macOS'
    } else if (ua.includes('Linux')) {
        os = 'Linux'
    } else if (ua.includes('Android')) {
        os = 'Android'
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
        os = 'iOS'
    }

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
        device = '📱 Mobile'
    } else if (ua.includes('iPad') || ua.includes('Tablet')) {
        device = '📱 Tablet'
    } else {
        device = '🖥️ Desktop'
    }

    return { browser, os, device }
}
