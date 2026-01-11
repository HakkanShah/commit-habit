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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to CommitHabit!</title>
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse;}
        .button {padding: 14px 32px !important;}
    </style>
    <![endif]-->
    <style>
        /* Mobile-responsive styles */
        @media only screen and (max-width: 600px) {
            .main-card { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
            .content-cell { padding-left: 16px !important; padding-right: 16px !important; }
            .header-cell { padding: 32px 16px 24px !important; }
            .feature-cell { padding: 16px 14px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; -webkit-font-smoothing: antialiased;">
    
    <!-- Outer Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 16px 8px;">
                
                <!-- Main Card -->
                <table role="presentation" cellpadding="0" cellspacing="0" class="main-card" style="width: 100%; max-width: 800px; background-color: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td class="header-cell" style="padding: 36px 24px 28px; text-align: center; background: linear-gradient(180deg, #1f2937 0%, #161b22 100%);">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                <tr>
                                    <td align="center">
                                        <div style="font-size: 36px; font-weight: 900; color: white; letter-spacing: -0.5px;">
                                            C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                                        </div>
                                        <p style="color: #8b949e; font-size: 15px; margin: 12px 0 0 0;">Your GitHub streak guardian</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td class="content-cell" style="padding: 24px 24px 20px;">
                            <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0 0 16px; text-align: center; line-height: 1.3;">
                                Welcome, ${userName}! 🎉
                            </h1>
                            <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">
                                You've successfully connected your GitHub account.<br>
                                Your commit streak is now protected!
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td class="content-cell" style="padding: 0 24px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, #30363d, transparent);"></div>
                        </td>
                    </tr>

                    <!-- How It Works Section -->
                    <tr>
                        <td class="content-cell" style="padding: 24px 24px;">
                            <p style="color: #58a6ff; font-weight: 600; margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">How It Works</p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                
                                <!-- Step 1 -->
                                <tr>
                                    <td class="feature-cell" style="padding: 16px 18px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td style="width: 36px; vertical-align: top;">
                                                    <div style="width: 28px; height: 28px; background-color: #238636; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: white; font-weight: 700;">1</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 12px;">
                                                    <p style="color: white; font-weight: 600; margin: 0 0 2px; font-size: 15px;">Connect a Repository</p>
                                                    <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.4;">Add any repo from your dashboard</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr><td style="height: 12px;"></td></tr>
                                
                                <!-- Step 2 -->
                                <tr>
                                    <td class="feature-cell" style="padding: 16px 18px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td style="width: 36px; vertical-align: top;">
                                                    <div style="width: 28px; height: 28px; background-color: #238636; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: white; font-weight: 700;">2</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 12px;">
                                                    <p style="color: white; font-weight: 600; margin: 0 0 2px; font-size: 15px;">We Monitor Daily</p>
                                                    <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.4;">We check if you've committed today</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr><td style="height: 12px;"></td></tr>
                                
                                <!-- Step 3 -->
                                <tr>
                                    <td class="feature-cell" style="padding: 16px 18px; background-color: #0d1117; border-radius: 12px; border: 1px solid #30363d;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td style="width: 36px; vertical-align: top;">
                                                    <div style="width: 28px; height: 28px; background-color: #238636; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; color: white; font-weight: 700;">3</div>
                                                </td>
                                                <td style="vertical-align: top; padding-left: 12px;">
                                                    <p style="color: white; font-weight: 600; margin: 0 0 2px; font-size: 15px;">Streak Protected</p>
                                                    <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.4;">If needed, we make a tiny README update</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td class="content-cell" style="padding: 8px 24px 32px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #238636 0%, #2ea043 100%); border-radius: 12px;">
                                        <a href="${appUrl}/dashboard" 
                                           style="display: inline-block; color: white; text-decoration: none; padding: 16px 40px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                                            Go to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Promo Section -->
                    <tr>
                        <td class="content-cell" style="padding: 0 24px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(88,166,255,0.08) 0%, rgba(57,211,83,0.08) 100%); border-radius: 12px; border: 1px solid rgba(88,166,255,0.2);">
                                <tr>
                                    <td style="padding: 28px 32px; text-align: center;">
                                        <p style="color: #58a6ff; font-weight: 600; margin: 0 0 8px; font-size: 16px;">⭐ Love CommitHabit?</p>
                                        <p style="color: #9ca3af; margin: 0 0 20px; font-size: 14px;">Star us on GitHub and help us grow!</p>
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="background-color: #21262d; border-radius: 8px; border: 1px solid #30363d;">
                                                    <a href="https://github.com/HakkanShah/commit-habit" 
                                                       style="display: inline-block; color: #e5e7eb; text-decoration: none; padding: 12px 24px; font-weight: 500; font-size: 14px;">
                                                        ⭐ Star on GitHub
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="content-cell" style="padding: 20px 24px 24px; text-align: center; border-top: 1px solid #21262d; background-color: #0d1117;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px; line-height: 1.6;">
                                You're receiving this because you signed up for CommitHabit.
                            </p>
                            <p style="color: #4b5563; font-size: 12px; margin: 0;">
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

// ============================================================================
// Admin Notification
// ============================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hakkanparbej@gmail.com'

interface NewUserData {
    email: string | null
    githubUsername: string
    name: string | null
    avatarUrl: string | null
    githubId: number
}

/**
 * Send notification email to admin when a new user signs up
 */
export async function sendAdminNewUserNotification(userData: NewUserData): Promise<boolean> {
    const transporter = createTransporter()

    if (!transporter) {
        console.log('[EMAIL] Skipping admin notification - SMTP not configured')
        return false
    }

    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long'
    })

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New User Signup</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden;">
        <tr>
            <td style="padding: 24px; text-align: center; background: linear-gradient(135deg, #238636 0%, #2ea043 100%);">
                <h1 style="margin: 0; color: white; font-size: 24px;">🎉 New User Signup!</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px;">
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                            <img src="${userData.avatarUrl || 'https://github.com/identicons/default.png'}" 
                                 alt="Avatar" 
                                 style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #30363d;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                            <strong style="color: #8b949e;">👤 Name:</strong>
                            <span style="color: white; float: right;">${userData.name || 'Not provided'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                            <strong style="color: #8b949e;">🐙 GitHub Username:</strong>
                            <span style="color: #58a6ff; float: right;">@${userData.githubUsername}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                            <strong style="color: #8b949e;">📧 Email:</strong>
                            <span style="color: white; float: right;">${userData.email || 'Private'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                            <strong style="color: #8b949e;">🆔 GitHub ID:</strong>
                            <span style="color: #8b949e; float: right;">${userData.githubId}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0;">
                            <strong style="color: #8b949e;">🕐 Signed up at:</strong>
                            <span style="color: #39d353; float: right;">${timestamp}</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 24px; text-align: center; background-color: #0d1117; border-top: 1px solid #30363d;">
                <a href="https://github.com/${userData.githubUsername}" 
                   style="display: inline-block; background-color: #21262d; color: #c9d1d9; text-decoration: none; padding: 10px 20px; border-radius: 6px; border: 1px solid #30363d;">
                    View GitHub Profile →
                </a>
            </td>
        </tr>
    </table>
</body>
</html>
`

    const textContent = `
🎉 New User Signup on CommitHabit!

👤 Name: ${userData.name || 'Not provided'}
🐙 GitHub: @${userData.githubUsername}
📧 Email: ${userData.email || 'Private'}
🆔 GitHub ID: ${userData.githubId}
🕐 Time: ${timestamp}

GitHub Profile: https://github.com/${userData.githubUsername}
`

    try {
        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to: ADMIN_EMAIL,
            subject: `🆕 New User: @${userData.githubUsername} signed up!`,
            text: textContent,
            html: htmlContent,
        })

        console.log('[EMAIL] Admin notification sent:', info.messageId)
        return true
    } catch (error) {
        console.error('[EMAIL] Failed to send admin notification:', error)
        return false
    }
}
