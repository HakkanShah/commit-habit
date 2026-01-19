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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>New User Signup</title>
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse;}
    </style>
    <![endif]-->
    <style>
        /* Mobile-responsive styles */
        @media only screen and (max-width: 600px) {
            .main-card { 
                border-radius: 0 !important; 
                border-left: none !important; 
                border-right: none !important; 
                max-width: 100% !important;
            }
            .content-cell { 
                padding-left: 16px !important; 
                padding-right: 16px !important; 
            }
            .header-cell { 
                padding: 24px 16px !important; 
            }
            .info-card-table {
                width: auto !important;
                margin: 0 auto !important;
            }
            .info-card-table td {
                text-align: center !important;
            }
            .info-icon-cell {
                display: block !important;
                width: 100% !important;
                padding-bottom: 8px !important;
            }
            .info-text-cell {
                display: block !important;
                width: 100% !important;
                padding-left: 0 !important;
                text-align: center !important;
            }
            .avatar-img {
                width: 64px !important;
                height: 64px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; -webkit-font-smoothing: antialiased;">
    
    <!-- Outer Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 16px 8px;">
                
                <!-- Main Card -->
                <table role="presentation" cellpadding="0" cellspacing="0" class="main-card" style="width: 100%; max-width: 560px; background-color: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td class="header-cell" style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #238636 0%, #2ea043 100%);">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                <tr>
                                    <td align="center">
                                        <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
                                        <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">New User Signup!</h1>
                                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Someone just joined CommitHabit</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Avatar Section -->
                    <tr>
                        <td class="content-cell" style="padding: 24px 24px 16px; text-align: center;">
                            <img src="${userData.avatarUrl || 'https://github.com/identicons/default.png'}" 
                                 alt="User Avatar" 
                                 class="avatar-img"
                                 style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #30363d; display: inline-block;">
                            <h2 style="margin: 16px 0 4px; color: white; font-size: 20px; font-weight: 600;">
                                ${userData.name || userData.githubUsername}
                            </h2>
                            <a href="https://github.com/${userData.githubUsername}" 
                               style="color: #58a6ff; font-size: 15px; text-decoration: none;">
                                @${userData.githubUsername}
                            </a>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td class="content-cell" style="padding: 0 24px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, #30363d, transparent);"></div>
                        </td>
                    </tr>

                    <!-- User Info Cards -->
                    <tr>
                        <td class="content-cell" style="padding: 20px 24px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                
                                <!-- Email -->
                                <tr>
                                    <td style="padding: 12px 16px; background-color: #0d1117; border-radius: 10px; margin-bottom: 8px; text-align: center;">
                                        <table role="presentation" class="info-card-table" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td class="info-icon-cell" style="width: 32px; vertical-align: middle;">
                                                    <div style="width: 28px; height: 28px; background-color: #238636; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px; margin: 0 auto;">📧</div>
                                                </td>
                                                <td class="info-text-cell" style="padding-left: 12px; vertical-align: middle;">
                                                    <div style="color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Email</div>
                                                    <div style="color: white; font-size: 15px; font-weight: 500; word-break: break-all;">${userData.email || 'Private'}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr><td style="height: 8px;"></td></tr>

                                <!-- GitHub ID -->
                                <tr>
                                    <td style="padding: 12px 16px; background-color: #0d1117; border-radius: 10px; text-align: center;">
                                        <table role="presentation" class="info-card-table" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td class="info-icon-cell" style="width: 32px; vertical-align: middle;">
                                                    <div style="width: 28px; height: 28px; background-color: #58a6ff; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px; margin: 0 auto;">🆔</div>
                                                </td>
                                                <td class="info-text-cell" style="padding-left: 12px; vertical-align: middle;">
                                                    <div style="color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">GitHub ID</div>
                                                    <div style="color: white; font-size: 15px; font-weight: 500;">${userData.githubId}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr><td style="height: 8px;"></td></tr>

                                <!-- Signup Time -->
                                <tr>
                                    <td style="padding: 12px 16px; background-color: #0d1117; border-radius: 10px; text-align: center;">
                                        <table role="presentation" class="info-card-table" cellpadding="0" cellspacing="0" style="width: 100%;">
                                            <tr>
                                                <td class="info-icon-cell" style="width: 32px; vertical-align: middle;">
                                                    <div style="width: 28px; height: 28px; background-color: #39d353; border-radius: 8px; text-align: center; line-height: 28px; font-size: 14px; margin: 0 auto;">🕐</div>
                                                </td>
                                                <td class="info-text-cell" style="padding-left: 12px; vertical-align: middle;">
                                                    <div style="color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Signed Up</div>
                                                    <div style="color: #39d353; font-size: 15px; font-weight: 500;">${timestamp}</div>
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
                        <td class="content-cell" style="padding: 8px 24px 28px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                <tr>
                                    <td style="background-color: #21262d; border-radius: 12px; border: 1px solid #30363d;">
                                        <a href="https://github.com/${userData.githubUsername}" 
                                           style="display: block; color: white; text-decoration: none; padding: 14px 24px; font-weight: 600; font-size: 15px; text-align: center;">
                                            👤 View GitHub Profile
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="content-cell" style="padding: 16px 24px; text-align: center; background-color: #0d1117; border-top: 1px solid #21262d;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
                                CommitHabit Admin Notification<br>
                                <span style="color: #4b5563;">This is an automated message</span>
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

// ============================================================================
// Admin Testimonial Notification 
// ============================================================================

interface NewTestimonialData {
    userName: string
    userEmail: string | null
    githubUsername: string | null
    avatarUrl: string | null
    content: string
    rating: number
    isUpdate: boolean
}

/**
 * Send notification email to admins when a new testimonial is submitted
 */
export async function sendAdminNewTestimonialNotification(data: NewTestimonialData): Promise<boolean> {
    const transporter = createTransporter()

    if (!transporter) {
        console.log('[EMAIL] Skipping testimonial notification - SMTP not configured')
        return false
    }

    // Get admin emails from env
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [ADMIN_EMAIL]

    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    })

    const stars = '⭐'.repeat(data.rating)
    const actionType = data.isUpdate ? 'Updated' : 'New'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${actionType} Testimonial Submitted</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 16px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; background-color: #161b22; border-radius: 16px; border: 1px solid #30363d;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #1f6feb 100%); border-radius: 16px 16px 0 0;">
                            <div style="font-size: 28px; margin-bottom: 8px;">💬</div>
                            <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">${actionType} Testimonial Submitted!</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Requires your review</p>
                        </td>
                    </tr>

                    <!-- User Info -->
                    <tr>
                        <td style="padding: 24px; text-align: center;">
                            <img src="${data.avatarUrl || 'https://github.com/identicons/default.png'}" 
                                 alt="User Avatar" 
                                 style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid #30363d;">
                            <h2 style="margin: 12px 0 4px; color: white; font-size: 18px;">${data.userName}</h2>
                            ${data.githubUsername ? `<a href="https://github.com/${data.githubUsername}" style="color: #58a6ff; font-size: 14px; text-decoration: none;">@${data.githubUsername}</a>` : ''}
                        </td>
                    </tr>

                    <!-- Testimonial Content -->
                    <tr>
                        <td style="padding: 0 24px 24px;">
                            <div style="background-color: #0d1117; border-radius: 12px; padding: 20px; border: 1px solid #30363d;">
                                <div style="color: #f0883e; font-size: 18px; margin-bottom: 8px;">${stars}</div>
                                <p style="color: white; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">"${data.content}"</p>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 24px 24px; text-align: center;">
                            <a href="${appUrl}/admin/feedback" 
                               style="display: inline-block; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white; text-decoration: none; padding: 14px 32px; font-weight: 600; font-size: 15px; border-radius: 12px;">
                                Review in Admin Panel →
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 16px 24px; text-align: center; background-color: #0d1117; border-top: 1px solid #21262d; border-radius: 0 0 16px 16px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                Submitted: ${timestamp}
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

    const textContent = `
${actionType} Testimonial Submitted!

From: ${data.userName}${data.githubUsername ? ` (@${data.githubUsername})` : ''}
Rating: ${stars} (${data.rating}/5)

"${data.content}"

Review: ${appUrl}/admin/feedback

Submitted: ${timestamp}
`

    try {
        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to: adminEmails.join(', '),
            subject: `💬 ${actionType} Testimonial from ${data.userName} - Review Required`,
            text: textContent,
            html: htmlContent,
        })

        console.log('[EMAIL] Admin testimonial notification sent:', info.messageId)
        return true
    } catch (error) {
        console.error('[EMAIL] Failed to send testimonial notification:', error)
        return false
    }
}

// ============================================================================
// Admin Custom Email
// ============================================================================

export interface CustomEmailResult {
    success: boolean
    error?: string
}

/**
 * Send a custom email to a user (for admin broadcast)
 */
export async function sendCustomEmail(
    to: string,
    subject: string,
    body: string,
    isHtml: boolean = true
): Promise<CustomEmailResult> {
    const transporter = createTransporter()

    if (!transporter) {
        return { success: false, error: 'SMTP not configured' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'

    const htmlContent = isHtml ? `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <!-- Main Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 0;">
                
                <!-- Content Table (Full Width) -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #161b22; border-bottom: 1px solid #30363d;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 24px; text-align: center; border-bottom: 1px solid #30363d;">
                            <div style="font-size: 24px; font-weight: 900; color: white;">
                                C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 20px;">
                            <div style="color: #c9d1d9; font-size: 16px; line-height: 1.6; width: 100%; max-width: 100%;">
                                ${body}
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 20px; text-align: center; background-color: #0d1117;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                © 2026 CommitHabit • <a href="${appUrl}" style="color: #58a6ff; text-decoration: none;">CommitHabit</a>
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>
</html>
` : undefined

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            text: isHtml ? body.replace(/<[^>]*>/g, '') : body, // Strip HTML for text version
            html: htmlContent,
        })

        return { success: true }
    } catch (error) {
        console.error('[EMAIL] Failed to send custom email:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

