// Email Templates Library for AI Email Writer Fallback
// These templates are used when AI generation fails

export interface EmailTemplate {
    id: string
    name: string
    keywords: string[]
    subject: string
    body: string
}

// Dynamic variables supported in templates:
// {user} - Recipient name
// {appName} - Application name (CommitHabit)
// {ctaLink} - Call-to-action URL

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'feedback',
        name: 'Feedback Request',
        keywords: ['feedback', 'review', 'testimonial', 'opinion', 'experience', 'rate', 'survey'],
        subject: "We'd Love Your Feedback on {appName}! 💬",
        body: `
<h2 style="color: #f0f6fc; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">We'd Love Your Feedback ❤️</h2>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    Hey {user} 👋
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    Thanks for using <strong style="color: #39d353;">{appName}</strong>! Your experience matters a lot to us, and it helps improve the product for everyone.
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
    Can you please take a moment to share your honest feedback?
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 8px;">
            <a href="{ctaLink}" style="display: inline-block; padding: 14px 28px; color: #0d1117; text-decoration: none; font-weight: 700; font-size: 16px;">
                Give Feedback 🚀
            </a>
        </td>
    </tr>
</table>

<p style="color: #8b949e; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
    Thank you for being part of the {appName} community 💚<br/>
    Keep building. Keep committing.
</p>
`
    },
    {
        id: 'announcement',
        name: 'Announcement',
        keywords: ['announce', 'announcement', 'news', 'update', 'launch', 'release', 'introducing', 'new'],
        subject: "🎉 Exciting News from {appName}!",
        body: `
<h2 style="color: #f0f6fc; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">Big Announcement! 🎉</h2>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    Hey {user} 👋
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    We have some exciting news to share with you!
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
    [Your announcement content here]
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 8px;">
            <a href="{ctaLink}" style="display: inline-block; padding: 14px 28px; color: #0d1117; text-decoration: none; font-weight: 700; font-size: 16px;">
                Learn More →
            </a>
        </td>
    </tr>
</table>

<p style="color: #8b949e; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
    Thanks for being with us on this journey! 🚀
</p>
`
    },
    {
        id: 'feature_update',
        name: 'Feature Update',
        keywords: ['feature', 'improvement', 'upgrade', 'version', 'changelog', 'fix', 'enhance', 'better'],
        subject: "✨ New Feature Alert: {appName} Just Got Better!",
        body: `
<h2 style="color: #f0f6fc; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">New Feature Unlocked! ✨</h2>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    Hey {user} 👋
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    We've been working hard on making <strong style="color: #39d353;">{appName}</strong> even better for you!
</p>

<div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #f0f6fc; font-size: 18px; margin: 0 0 12px 0;">What's New:</h3>
    <ul style="color: #c9d1d9; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Feature improvement 1</li>
        <li>Feature improvement 2</li>
        <li>Bug fixes and performance boosts</li>
    </ul>
</div>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 8px;">
            <a href="{ctaLink}" style="display: inline-block; padding: 14px 28px; color: #0d1117; text-decoration: none; font-weight: 700; font-size: 16px;">
                Try It Now →
            </a>
        </td>
    </tr>
</table>
`
    },
    {
        id: 'promotion',
        name: 'Promotion / CTA',
        keywords: ['promo', 'promotion', 'offer', 'discount', 'deal', 'sale', 'limited', 'exclusive', 'free', 'trial'],
        subject: "🔥 Special Offer Inside - Don't Miss Out!",
        body: `
<h2 style="color: #f0f6fc; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">Special Offer Just For You! 🔥</h2>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    Hey {user} 👋
</p>

<p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
    We've got something special for our amazing {appName} users!
</p>

<div style="background: linear-gradient(135deg, rgba(57, 211, 83, 0.1) 0%, rgba(88, 166, 255, 0.1) 100%); border: 1px solid #39d353; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="color: #39d353; font-size: 28px; font-weight: 700; margin: 0;">
        [Your Offer Here]
    </p>
</div>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 8px;">
            <a href="{ctaLink}" style="display: inline-block; padding: 14px 28px; color: #0d1117; text-decoration: none; font-weight: 700; font-size: 16px;">
                Claim Now →
            </a>
        </td>
    </tr>
</table>

<p style="color: #8b949e; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
    Hurry, this offer won't last forever! ⏰
</p>
`
    },
    {
        id: 'general',
        name: 'General Purpose',
        keywords: [], // Fallback if no keywords match
        subject: "A Message from {appName} 💌",
        body: `
<!-- Decorative Header Accent -->
<div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; width: 60px; height: 4px; background: linear-gradient(90deg, #39d353 0%, #58a6ff 50%, #a371f7 100%); border-radius: 2px;"></div>
</div>

<h2 style="color: #f0f6fc; font-size: 26px; margin: 0 0 24px 0; font-weight: 800; text-align: center; letter-spacing: -0.5px;">
    Hello, {user}! 👋
</h2>

<div style="background: linear-gradient(135deg, rgba(57, 211, 83, 0.05) 0%, rgba(88, 166, 255, 0.05) 100%); border: 1px solid rgba(57, 211, 83, 0.15); border-radius: 16px; padding: 24px; margin: 24px 0;">
    <p style="color: #c9d1d9; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">
        We have something to share with you from <strong style="color: #39d353;">{appName}</strong>
    </p>
</div>

<p style="color: #8b949e; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
    [Your personalized message content goes here]
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 12px; box-shadow: 0 4px 14px rgba(57, 211, 83, 0.3);">
            <a href="{ctaLink}" style="display: inline-block; padding: 16px 36px; color: #0d1117; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: 0.3px;">
                Open {appName} →
            </a>
        </td>
    </tr>
</table>

<!-- Decorative Footer -->
<div style="text-align: center; margin-top: 32px;">
    <div style="display: inline-block; width: 40px; height: 2px; background: #30363d; border-radius: 1px;"></div>
</div>

<p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
    You're receiving this because you're part of the {appName} community 💚
</p>
`
    }
]

/**
 * Find the best matching template based on user prompt
 */
export function findMatchingTemplate(prompt: string): EmailTemplate {
    const lowerPrompt = prompt.toLowerCase()

    // Score each template based on keyword matches
    let bestMatch = EMAIL_TEMPLATES[EMAIL_TEMPLATES.length - 1] // Default to general
    let highestScore = 0

    for (const template of EMAIL_TEMPLATES) {
        if (template.keywords.length === 0) continue // Skip general for scoring

        let score = 0
        for (const keyword of template.keywords) {
            if (lowerPrompt.includes(keyword)) {
                score++
            }
        }

        if (score > highestScore) {
            highestScore = score
            bestMatch = template
        }
    }

    return bestMatch
}

/**
 * Replace template variables with actual values
 */
export function replaceVariables(
    text: string,
    variables: { user?: string; appName?: string; ctaLink?: string }
): string {
    const defaults = {
        user: 'there',
        appName: 'CommitHabit',
        ctaLink: process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'
    }

    const values = { ...defaults, ...variables }

    return text
        .replace(/\{user\}/g, values.user)
        .replace(/\{appName\}/g, values.appName)
        .replace(/\{ctaLink\}/g, values.ctaLink)
}

/**
 * Wrap email body in the CommitHabit branded template
 */
export function wrapInEmailTemplate(subject: string, bodyContent: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://commithabit.app'

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0d1117;">
        <tr>
            <td align="center" style="padding: 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #161b22;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 24px 20px; text-align: center; border-bottom: 1px solid #30363d;">
                            <div style="font-size: 24px; font-weight: 900; color: white;">
                                C<span style="color: #39d353;">●</span>mmit<span style="color: #39d353;">Habit</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            ${bodyContent}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px; text-align: center; background-color: #0d1117; border-top: 1px solid #21262d;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} CommitHabit • <a href="${appUrl}" style="color: #58a6ff; text-decoration: none;">CommitHabit</a>
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
