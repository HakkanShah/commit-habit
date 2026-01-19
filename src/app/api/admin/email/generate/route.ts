import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { findMatchingTemplate, replaceVariables, EMAIL_TEMPLATES } from '@/lib/email-templates'

// Types
interface GenerateRequest {
    prompt: string
    variables?: {
        user?: string
        appName?: string
        ctaLink?: string
    }
}

interface GenerateResponse {
    subject: string
    body: string
    source: 'gemini' | 'template'
    model?: string
    templateName?: string
    error?: string
}

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Free tier models in order of preference (fastest to slowest, with rate limit consideration)
const GEMINI_MODELS = [
    'gemini-2.0-flash',      // Primary: Fast, good quality
    'gemini-1.5-flash',      // Fallback 1: Stable, reliable
    'gemini-1.5-flash-8b',   // Fallback 2: Lightweight
    'gemini-1.5-pro',        // Fallback 3: Best quality but stricter limits
] as const

// System prompt for AI email generation
const SYSTEM_PROMPT = `You are an expert email copywriter for CommitHabit, a GitHub automation tool. Generate professional, engaging HTML emails.

REQUIREMENTS:
1. Return ONLY valid JSON with this exact structure: {"subject": "...", "body": "..."}
2. The "body" must be the INNER HTML content only (no DOCTYPE, html, head, body tags - those are added later)
3. Use inline CSS styles on each element
4. Use CommitHabit brand colors: primary green #39d353, background #161b22, text #c9d1d9
5. Include a prominent CTA button with gradient background and link to {ctaLink}
6. Keep emails concise, friendly, and action-oriented
7. Use emojis sparingly but effectively
8. Replace {user} with recipient name, {appName} with "CommitHabit", {ctaLink} with the action URL
9. Structure: Greeting → Main message → CTA button → Closing

BUTTON STYLE:
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
    <tr>
        <td style="background: linear-gradient(135deg, #39d353 0%, #2ea043 100%); border-radius: 8px;">
            <a href="{ctaLink}" style="display: inline-block; padding: 14px 28px; color: #0d1117; text-decoration: none; font-weight: 700; font-size: 16px;">
                Button Text →
            </a>
        </td>
    </tr>
</table>

TEXT STYLES:
- Headings: color: #f0f6fc; font-size: 24px; font-weight: 700;
- Body text: color: #c9d1d9; font-size: 16px; line-height: 1.6;
- Muted text: color: #8b949e; font-size: 14px;`

/**
 * Try to generate email using a specific Gemini model
 */
async function tryGeminiModel(
    model: string,
    prompt: string
): Promise<{ success: true; subject: string; body: string } | { success: false; error: string; statusCode?: number }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    console.log(`[AI-EMAIL] Trying Gemini model: ${model}`)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: `Generate an email for this request: ${prompt}` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        })

        // Handle rate limits and errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData?.error?.message || `HTTP ${response.status}`

            console.error(`[AI-EMAIL] ${model} failed:`, {
                status: response.status,
                message: errorMessage
            })

            // 429 = Rate limited, 503 = Service unavailable - try next model
            if (response.status === 429 || response.status === 503) {
                return { success: false, error: `Rate limited (${response.status})`, statusCode: response.status }
            }

            // 400 = Bad request, 401/403 = Auth issues - these won't be fixed by switching models
            if (response.status === 401 || response.status === 403) {
                return { success: false, error: 'Invalid API key', statusCode: response.status }
            }

            return { success: false, error: errorMessage, statusCode: response.status }
        }

        const data = await response.json()

        // Check for blocked content
        if (data.promptFeedback?.blockReason) {
            console.error(`[AI-EMAIL] ${model} blocked:`, data.promptFeedback.blockReason)
            return { success: false, error: `Content blocked: ${data.promptFeedback.blockReason}` }
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.error(`[AI-EMAIL] ${model} returned empty response`)
            return { success: false, error: 'Empty response from AI' }
        }

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/)
        if (!jsonMatch) {
            console.error(`[AI-EMAIL] ${model} returned invalid JSON format`)
            console.debug('[AI-EMAIL] Raw response:', text.substring(0, 500))
            return { success: false, error: 'Invalid response format from AI' }
        }

        const parsed = JSON.parse(jsonMatch[0])

        if (!parsed.subject || !parsed.body) {
            return { success: false, error: 'Missing subject or body in AI response' }
        }

        console.log(`[AI-EMAIL] ✅ ${model} success!`)
        return { success: true, subject: parsed.subject, body: parsed.body }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[AI-EMAIL] ${model} exception:`, errorMessage)
        return { success: false, error: errorMessage }
    }
}

/**
 * Try all Gemini models in sequence until one succeeds
 */
async function tryGeminiWithFallback(prompt: string): Promise<{
    result: { subject: string; body: string } | null
    model: string | null
    errors: string[]
}> {
    if (!GEMINI_API_KEY) {
        console.warn('[AI-EMAIL] ⚠️ GEMINI_API_KEY not configured in environment')
        return { result: null, model: null, errors: ['Gemini API key not configured'] }
    }

    const errors: string[] = []

    for (const model of GEMINI_MODELS) {
        const result = await tryGeminiModel(model, prompt)

        if (result.success) {
            return {
                result: { subject: result.subject, body: result.body },
                model,
                errors
            }
        }

        errors.push(`${model}: ${result.error}`)

        // Don't try other models if it's an auth error
        if (result.statusCode === 401 || result.statusCode === 403) {
            console.error('[AI-EMAIL] ❌ API key issue - skipping remaining models')
            break
        }

        // Small delay before trying next model to avoid rate limits
        if (model !== GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    }

    console.warn('[AI-EMAIL] ⚠️ All Gemini models failed, falling back to templates')
    return { result: null, model: null, errors }
}

/**
 * Fallback to template matching
 */
function useTemplate(prompt: string, variables: GenerateRequest['variables']): GenerateResponse {
    console.log('[AI-EMAIL] 📋 Using template fallback...')

    const template = findMatchingTemplate(prompt)
    const subject = replaceVariables(template.subject, variables || {})
    const body = replaceVariables(template.body, variables || {})

    console.log(`[AI-EMAIL] ✅ Matched template: "${template.name}"`)

    return {
        subject,
        body,
        source: 'template',
        templateName: template.name
    }
}

/**
 * POST /api/admin/email/generate
 * Generate an email using Gemini AI with multi-model fallback → template fallback
 */
export async function POST(request: NextRequest) {
    // Admin only
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body: GenerateRequest = await request.json()
        const { prompt, variables } = body

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
            return NextResponse.json(
                { error: 'Please provide a more detailed description (at least 5 characters).' },
                { status: 400 }
            )
        }

        console.log('[AI-EMAIL] 🚀 Starting generation for prompt:', prompt.substring(0, 100))

        // Try Gemini with multi-model fallback
        const { result: geminiResult, model, errors } = await tryGeminiWithFallback(prompt)

        if (geminiResult) {
            return NextResponse.json({
                subject: replaceVariables(geminiResult.subject, variables || {}),
                body: replaceVariables(geminiResult.body, variables || {}),
                source: 'gemini',
                model
            } as GenerateResponse)
        }

        // Final fallback: template
        const templateResult = useTemplate(prompt, variables)

        // Include warning about AI failure for transparency
        return NextResponse.json({
            ...templateResult,
            error: errors.length > 0
                ? `AI generation failed (${errors.length} attempts). Using template instead.`
                : undefined
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[AI-EMAIL] ❌ Fatal error:', errorMessage)

        return NextResponse.json(
            { error: `Generation failed: ${errorMessage}. Please try again.` },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/email/generate
 * Get available templates list and API status
 */
export async function GET() {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
        aiConfigured: !!GEMINI_API_KEY,
        models: GEMINI_MODELS,
        templates: EMAIL_TEMPLATES.map(t => ({
            id: t.id,
            name: t.name,
            keywords: t.keywords
        }))
    })
}
