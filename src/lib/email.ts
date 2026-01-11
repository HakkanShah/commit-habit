'use server'

import nodemailer from 'nodemailer'

// ============================================================================
// Configuration
// ============================================================================

const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
}

const FROM_EMAIL = process.env.SMTP_FROM || 'CommitHabit <noreply@commithabit.app>'

// ============================================================================
// Transporter
// ============================================================================

function createTransporter() {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
        console.warn('[EMAIL] SMTP credentials not configured, emails will not be sent')
        return null
    }

    return nodemailer.createTransport(SMTP_CONFIG)
}

// ============================================================================
// Email Templates
// ============================================================================

function getWelcomeEmailHtml(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CommitHabit!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #161b22; border-radius: 16px; border: 1px solid #30363d;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 900; color: white; margin-bottom: 8px;">
                                C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                            </div>
                            <p style="color: #8b949e; font-size: 14px; margin: 0;">Your GitHub streak guardian</p>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h1 style="color: white; font-size: 28px; margin: 0 0 16px; text-align: center;">
                                Welcome, ${userName}! 🎉
                            </h1>
                            <p style="color: #8b949e; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                                You've successfully connected your GitHub account. Your commit streak is now protected!
                            </p>
                        </td>
                    </tr>

                    <!-- Features -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 16px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <div style="display: flex; align-items: flex-start;">
                                            <span style="font-size: 24px; margin-right: 12px;">🔒</span>
                                            <div>
                                                <p style="color: white; font-weight: 600; margin: 0 0 4px; font-size: 15px;">Secure by Design</p>
                                                <p style="color: #8b949e; margin: 0; font-size: 13px;">Official GitHub App - no passwords needed</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                <tr>
                                    <td style="padding: 16px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <div style="display: flex; align-items: flex-start;">
                                            <span style="font-size: 24px; margin-right: 12px;">⚡</span>
                                            <div>
                                                <p style="color: white; font-weight: 600; margin: 0 0 4px; font-size: 15px;">Daily Automation</p>
                                                <p style="color: #8b949e; margin: 0; font-size: 13px;">Automatic backup commits when you need them</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                <tr>
                                    <td style="padding: 16px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <div style="display: flex; align-items: flex-start;">
                                            <span style="font-size: 24px; margin-right: 12px;">💚</span>
                                            <div>
                                                <p style="color: white; font-weight: 600; margin: 0 0 4px; font-size: 15px;">100% Transparent</p>
                                                <p style="color: #8b949e; margin: 0; font-size: 13px;">Only updates your README timestamp</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 40px 30px; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'}/dashboard" 
                               style="display: inline-block; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                Go to Dashboard →
                            </a>
                        </td>
                    </tr>

                    <!-- Promo Section -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, rgba(88,166,255,0.1) 0%, rgba(57,211,83,0.1) 100%); border-radius: 12px; border: 1px solid #58a6ff30;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="color: #58a6ff; font-weight: 600; margin: 0 0 8px; font-size: 15px;">⭐ Love CommitHabit?</p>
                                        <p style="color: #8b949e; margin: 0 0 16px; font-size: 13px;">Star us on GitHub and help us grow!</p>
                                        <a href="https://github.com/HakkanShah/commit-habit" 
                                           style="display: inline-block; background-color: #21262d; color: #c9d1d9; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid #30363d;">
                                            ⭐ Star on GitHub
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid #30363d;">
                            <p style="color: #8b949e; font-size: 12px; margin: 0 0 8px;">
                                You're receiving this because you signed up for CommitHabit.
                            </p>
                            <p style="color: #484f58; font-size: 11px; margin: 0;">
                                © 2026 CommitHabit • Crafted by <a href="https://hakkan.is-a.dev" style="color: #58a6ff; text-decoration: none;">Hakkan</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

function getWelcomeEmailText(userName: string): string {
    return `
Welcome to CommitHabit, ${userName}! 🎉

You've successfully connected your GitHub account. Your commit streak is now protected!

What's included:
- 🔒 Secure by Design: Official GitHub App - no passwords needed
- ⚡ Daily Automation: Automatic backup commits when you need them
- 💚 100% Transparent: Only updates your README timestamp

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'}/dashboard

Love CommitHabit? Star us on GitHub: https://github.com/HakkanShah/commit-habit

---
© 2026 CommitHabit • Crafted by Hakkan
`
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const transporter = createTransporter()

    if (!transporter) {
        console.log('[EMAIL] Skipping welcome email - SMTP not configured')
        return false
    }

    try {
        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject: `Welcome to CommitHabit, ${userName}! 🎉`,
            text: getWelcomeEmailText(userName),
            html: getWelcomeEmailHtml(userName),
        })

        console.log('[EMAIL] Welcome email sent:', info.messageId)
        return true
    } catch (error) {
        console.error('[EMAIL] Failed to send welcome email:', error)
        return false
    }
}
