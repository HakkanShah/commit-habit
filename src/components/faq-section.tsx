import { ChevronDown } from 'lucide-react'
import { FAQS } from '@/lib/site-content'

/**
 * Visible FAQ.
 *
 * Built on native <details>/<summary> rather than React state for three
 * reasons: it is open-able before hydration (so it works in the HTML a crawler
 * or an AI fetcher receives), it needs no JavaScript at all, and the browser
 * gives correct expand/collapse semantics to screen readers for free.
 *
 * The text comes from the same module that feeds the FAQPage JSON-LD. Google
 * requires FAQ markup to match the visible page, and the only durable way to
 * guarantee that is to render both from one array.
 */
export function FaqSection() {
    return (
        <section id="faq" aria-labelledby="faq-heading" className="relative py-12 lg:py-20">
            <div className="max-w-3xl mx-auto px-4">
                <h2
                    id="faq-heading"
                    className="text-3xl lg:text-4xl font-black tracking-tight mb-3 text-center"
                >
                    Frequently Asked Questions
                </h2>
                <p className="text-[#8b949e] text-center mb-10">
                    Security, private repositories, timing, and how to turn it off.
                </p>

                <div className="flex flex-col gap-3">
                    {FAQS.map(faq => (
                        <details
                            key={faq.question}
                            className="group rounded-xl border border-[#30363d] bg-[#161b22] px-5 open:border-[#39d353]/30 transition-colors"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden">
                                <h3 className="text-base font-semibold">{faq.question}</h3>
                                <ChevronDown
                                    size={18}
                                    aria-hidden="true"
                                    className="shrink-0 text-[#8b949e] transition-transform duration-200 group-open:rotate-180"
                                />
                            </summary>
                            <p className="pb-5 pr-8 text-sm leading-relaxed text-[#8b949e]">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
