import { HOW_IT_WORKS } from '@/lib/site-content'

/**
 * The three-step explanation, in a direct-answer shape.
 *
 * The heading is phrased as the question a developer actually types, because
 * that is the string an answer engine matches against. The steps are an ordered
 * list of <article> elements so the sequence survives extraction, and the same
 * array feeds the HowTo JSON-LD.
 */
export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            aria-labelledby="how-it-works-heading"
            className="relative py-12 lg:py-20"
        >
            <div className="max-w-5xl mx-auto px-4">
                <h2
                    id="how-it-works-heading"
                    className="text-3xl lg:text-4xl font-black tracking-tight mb-3 text-center"
                >
                    How to Protect Your GitHub Streak Without a Personal Access Token
                </h2>
                <p className="text-[#8b949e] text-center max-w-2xl mx-auto mb-10">
                    Three steps, about thirty seconds, and no token to paste anywhere.
                </p>

                <ol className="grid gap-5 md:grid-cols-3 list-none p-0">
                    {HOW_IT_WORKS.map((step, i) => (
                        <li key={step.name}>
                            <article className="h-full rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
                                <span
                                    aria-hidden="true"
                                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#39d353]/10 font-mono text-sm font-bold text-[#39d353]"
                                >
                                    {i + 1}
                                </span>
                                <h3 className="mb-2 text-lg font-bold text-white">
                                    <span className="sr-only">Step {i + 1}: </span>
                                    {step.name}
                                </h3>
                                <p className="text-sm leading-relaxed text-[#8b949e]">{step.text}</p>
                            </article>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}
