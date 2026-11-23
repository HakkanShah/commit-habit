import { ImageResponse } from 'next/og'

/**
 * The social share card, rendered at request time by Satori.
 *
 * It replaces a broken setup: the metadata declared `og:image` as 1200x630 but
 * pointed at `/logo.png`, a 512x512 square. Every platform that trusts those
 * dimensions — X, LinkedIn, Slack, Discord — was letterboxing or cropping a
 * square logo into a wide card.
 *
 * Satori implements a subset of CSS: flexbox only (no grid, no float), every
 * element with more than one child needs an explicit `display: flex`, and there
 * is no `box-shadow` blur. The layout below is written to those limits.
 */

export const alt =
    'CommitHabit — protect your GitHub streak automatically with an official GitHub App, no personal access token required'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** GitHub's own contribution palette, darkest-to-brightest. */
const EMPTY = '#161b22'
const GREENS = ['#0e4429', '#006d32', '#26a641', '#39d353']

/**
 * A deterministic "before → after" heatmap.
 *
 * The left third is mostly empty with the odd grey square (a developer whose
 * streak is dying); it fills in and brightens towards the right. Deterministic
 * rather than random so the card is byte-identical across renders and can be
 * cached by every social platform.
 */
function heatmapCells(columns: number, rows: number) {
    const cells: string[][] = []

    for (let row = 0; row < rows; row++) {
        const column: string[] = []
        for (let col = 0; col < columns; col++) {
            // 0 at the far left, 1 at the far right.
            const progress = col / (columns - 1)
            // Stable pseudo-noise so some squares stay dim even on the right.
            const noise = ((row * 7 + col * 13) % 10) / 10
            const intensity = progress * 1.35 - noise * 0.5

            if (intensity <= 0.08) column.push(EMPTY)
            else if (intensity < 0.4) column.push(GREENS[0])
            else if (intensity < 0.7) column.push(GREENS[1])
            else if (intensity < 1.0) column.push(GREENS[2])
            else column.push(GREENS[3])
        }
        cells.push(column)
    }

    return cells
}

export default function OpengraphImage() {
    const COLS = 34
    const ROWS = 7
    const cells = heatmapCells(COLS, ROWS)

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#0d1117',
                    // Soft green glow behind the heatmap, the one effect Satori
                    // supports that carries the brand colour.
                    backgroundImage:
                        'radial-gradient(900px 400px at 50% 78%, rgba(57,211,83,0.16), transparent 70%)',
                    padding: '64px 72px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Wordmark */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{
                            display: 'flex',
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            backgroundColor: '#39d353',
                            marginRight: 16,
                        }}
                    />
                    <div style={{ display: 'flex', fontSize: 30, color: '#8b949e', letterSpacing: 2 }}>
                        commithabit.vercel.app
                    </div>
                </div>

                {/* Headline */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: -16 }}>
                    <div style={{ display: 'flex', fontSize: 92, fontWeight: 800, letterSpacing: -2 }}>
                        <span style={{ color: '#ffffff' }}>Commit</span>
                        <span style={{ color: '#39d353' }}>Habit</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 40,
                            color: '#c9d1d9',
                            marginTop: 14,
                            letterSpacing: -0.5,
                        }}
                    >
                        Protect Your GitHub Streak Automatically
                    </div>
                </div>

                {/* Before → after heatmap */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '22px 26px',
                        borderRadius: 16,
                        border: '1px solid #30363d',
                        backgroundColor: 'rgba(22,27,34,0.72)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 14,
                            fontSize: 20,
                            color: '#8b949e',
                        }}
                    >
                        <span>Before</span>
                        <span style={{ color: '#39d353' }}>After</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {cells.map((row, r) => (
                            <div key={r} style={{ display: 'flex' }}>
                                {row.map((colour, c) => (
                                    <div
                                        key={c}
                                        style={{
                                            display: 'flex',
                                            width: 26,
                                            height: 26,
                                            marginRight: 4,
                                            marginBottom: 4,
                                            borderRadius: 5,
                                            backgroundColor: colour,
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/*
                  Trust badges.

                  The tick is an inline SVG, not a "✓" character. Satori has no
                  glyph for it in the bundled font and falls back to downloading
                  one at render time — which failed outright in CI and would add
                  a network round trip to every social card render on Vercel.
                  Same reason the separator is a drawn dot rather than "•".
                */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 25, color: '#c9d1d9' }}>
                    {[
                        'Official GitHub App',
                        'No PAT Required',
                        '100% Free & Open Source',
                    ].map((label, i) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                            {i > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#30363d',
                                        margin: '0 22px',
                                    }}
                                />
                            )}
                            <svg
                                width="26"
                                height="26"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#39d353"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ marginRight: 10 }}
                            >
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    )
}
