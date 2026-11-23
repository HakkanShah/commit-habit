import { Check, X } from 'lucide-react'
import { COMPARISON } from '@/lib/site-content'

/**
 * Comparison against the two real alternatives.
 *
 * This is the highest information-gain block on the page. An answer engine
 * asked "what is the safest way to keep a GitHub streak" has to choose between
 * options, and a page that only describes itself gives it nothing to choose
 * with. A table that names the alternatives and compares them on stated
 * criteria is directly quotable, and the honest rows — where a DIY script is
 * also marked good — are what make the rest credible.
 *
 * Rendered as a real <table> with scope'd headers, not a grid of divs, so the
 * relationships survive extraction into a model's context and into a screen
 * reader's table mode.
 */

function Verdict({ value, good }: { value: string; good: boolean }) {
    return (
        <span className="flex items-start gap-2">
            {good ? (
                <Check size={15} className="mt-0.5 shrink-0 text-[#39d353]" aria-hidden="true" />
            ) : (
                <X size={15} className="mt-0.5 shrink-0 text-[#f85149]" aria-hidden="true" />
            )}
            <span className="sr-only">{good ? 'Yes:' : 'No:'}</span>
            <span>{value}</span>
        </span>
    )
}

export function ComparisonMatrix() {
    return (
        <section
            id="comparison"
            aria-labelledby="comparison-heading"
            className="relative py-12 lg:py-20"
        >
            <div className="max-w-6xl mx-auto px-4">
                <h2
                    id="comparison-heading"
                    className="text-3xl lg:text-4xl font-black tracking-tight mb-3 text-center"
                >
                    CommitHabit vs PAT Scripts vs Fake Commit Generators
                </h2>
                <p className="text-[#8b949e] text-center max-w-2xl mx-auto mb-10">
                    There are three common ways to keep a contribution graph alive. Only one of
                    them avoids handing out a write-scoped token, and only one of them is honest
                    about what it committed.
                </p>

                {/* Scroll affordance: at phone width only the first two columns
                    fit, and without a hint people do not discover the rest. */}
                <p className="mb-2 text-right text-xs text-[#8b949e] md:hidden" aria-hidden="true">
                    Scroll to compare &rarr;
                </p>

                {/*
                  A scrollable region needs to be focusable, otherwise a keyboard
                  user can reach neither the scrollbar nor the columns it hides.
                */}
                <div
                    role="region"
                    aria-label="Comparison table, scrollable horizontally"
                    tabIndex={0}
                    className="overflow-x-auto rounded-2xl border border-[#30363d] bg-[#0d1117] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39d353]/60"
                >
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <caption className="sr-only">
                            Comparison of CommitHabit, DIY cron or GitHub Actions scripts using a
                            personal access token, and fake commit history generators, across
                            credentials, setup time, source code safety, honesty, revocation and
                            cost.
                        </caption>
                        <thead>
                            <tr className="border-b border-[#30363d]">
                                <th scope="col" className="p-4 font-semibold text-[#8b949e]">
                                    Criterion
                                </th>
                                <th scope="col" className="p-4 font-bold text-[#39d353]">
                                    CommitHabit
                                    <span className="block text-xs font-normal text-[#8b949e]">
                                        Official GitHub App
                                    </span>
                                </th>
                                <th scope="col" className="p-4 font-semibold text-white">
                                    DIY cron / GitHub Actions
                                    <span className="block text-xs font-normal text-[#8b949e]">
                                        PAT-based
                                    </span>
                                </th>
                                <th scope="col" className="p-4 font-semibold text-white">
                                    Fake commit generators
                                    <span className="block text-xs font-normal text-[#8b949e]">
                                        Backdated history
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON.map(row => (
                                <tr
                                    key={row.criterion}
                                    className="border-b border-[#21262d] last:border-0 align-top"
                                >
                                    <th
                                        scope="row"
                                        className="p-4 font-medium text-[#c9d1d9] whitespace-nowrap"
                                    >
                                        {row.criterion}
                                    </th>
                                    <td className="p-4 text-[#c9d1d9] bg-[#39d353]/[0.03]">
                                        <Verdict {...row.commitHabit} />
                                    </td>
                                    <td className="p-4 text-[#8b949e]">
                                        <Verdict {...row.patScript} />
                                    </td>
                                    <td className="p-4 text-[#8b949e]">
                                        <Verdict {...row.fakeHistory} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
