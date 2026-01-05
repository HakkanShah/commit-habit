'use client'

import { motion } from 'framer-motion'
import { Github, Terminal, Shield, Command, Zap, ArrowRight, ChevronDown } from 'lucide-react'
import { HeroSequence } from '@/components/hero-sequence'
import { TerminalWindow, TerminalLine } from '@/components/terminal-window'
import { ErrorBanner } from '@/components/error-banner'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15 } },
  viewport: { once: true }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] selection:bg-[#39d353] selection:text-black font-sans text-white overflow-x-hidden">
      <ErrorBanner />

      {/* HERO SECTION */}
      <HeroSequence />

      {/* FEATURES SECTION */}
      <section className="relative py-32 bg-gradient-to-b from-[#0d1117] to-[#050505]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            {...fadeInUp}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-[#238636]/20 border border-[#238636]/30 text-[#39d353] font-mono text-sm mb-6">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your Streak,<br />
              <span className="text-[#8b949e]">Always Protected.</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-100px' }}
          >
            {[
              {
                icon: <Shield className="text-[#58a6ff]" size={28} />,
                title: 'Connect Securely',
                description: 'Authorize via official GitHub App. No passwords, no tokens, no risks.',
              },
              {
                icon: <Zap className="text-[#d29922]" size={28} />,
                title: 'We Monitor Daily',
                description: 'Our cron job checks your activity at midnight UTC. If you coded, we sleep.',
              },
              {
                icon: <Terminal className="text-[#39d353]" size={28} />,
                title: 'Auto-Commit Backup',
                description: 'If no commits detected, we make a small README update. Streak saved.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="group p-8 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 transition-all duration-300"
                variants={{
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                <div className="w-14 h-14 rounded-xl bg-[#0d1117] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#8b949e] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TERMINAL DEMO SECTION */}
      <section className="relative py-32 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp}>
              <span className="inline-block font-mono text-xs text-[#d29922] mb-4">
                [log] automation.service
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Transparent<br />
                <span className="text-[#8b949e]">& Ethical.</span>
              </h2>
              <p className="text-[#8b949e] text-lg leading-relaxed mb-8">
                Every action is logged and visible. We only touch your README file with a small timestamp update.
                Your code logic is never modified.
              </p>

              <ul className="space-y-4">
                {[
                  'Open source codebase',
                  'Official GitHub App identity',
                  'Revoke access anytime',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#238636]/20 flex items-center justify-center text-[#39d353]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <TerminalWindow title="daily-check.log">
                <TerminalLine prompt={false}>
                  <span className="text-[#8b949e]"># Cron Job - 00:00 UTC</span>
                </TerminalLine>
                <TerminalLine prompt={false}>Checking user/repo for activity...</TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#f85149]">⚠ No commits in last 24h</span>
                </TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#d29922]">→ Running backup protocol...</span>
                </TerminalLine>
                <TerminalLine prompt={false}>git add README.md</TerminalLine>
                <TerminalLine prompt={false}>git commit -m "docs: update timestamp"</TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#39d353]">✓ Streak protected!</span>
                </TerminalLine>
              </TerminalWindow>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-40 bg-gradient-to-t from-[#0d1117] to-[#050505]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              Ready to start?
            </h2>
            <p className="text-xl text-[#8b949e] mb-12 max-w-xl mx-auto">
              Join developers who never break their streak again. Free, open source, and privacy-first.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/api/auth/github"
                className="group relative inline-flex items-center gap-3 bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(57,211,83,0.3)]"
              >
                <Github size={22} />
                <span>Connect GitHub</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="https://github.com/HakkanShah/commit-habit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-lg border border-[#30363d] hover:border-[#8b949e] text-[#8b949e] hover:text-white font-bold transition-all"
              >
                <Terminal size={20} />
                <span>View Source</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#8b949e] font-mono">
          <div>
            user@commit-habit:~$ <span className="text-white">echo</span> "Made with <span className="text-[#f85149]">❤</span> for developers"
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">/privacy</a>
            <a href="#" className="hover:text-white transition-colors">/terms</a>
            <a href="#" className="hover:text-white transition-colors">/status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
