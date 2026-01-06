'use client'

import { motion } from 'framer-motion'
import { Github, Terminal, Shield, Zap, ArrowRight, ExternalLink } from 'lucide-react'
import { HeroSequence } from '@/components/hero-sequence'
import { TerminalWindow, TerminalLine } from '@/components/terminal-window'
import { ErrorBanner } from '@/components/error-banner'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white overflow-x-hidden">
      <ErrorBanner />

      {/* Hero */}
      <HeroSequence />

      {/* Features - Mobile: Single Column, Stacked */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-[#0d1117] to-[#050505]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div className="text-center mb-10 lg:mb-16" {...fadeIn}>
            <span className="inline-block px-3 py-1 rounded-full bg-[#238636]/20 border border-[#238636]/30 text-[#39d353] text-xs font-mono mb-4">
              How It Works
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold">
              Your Streak, Protected.
            </h2>
          </motion.div>

          {/* Feature Cards - Full Width on Mobile */}
          <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {[
              {
                icon: <Shield className="text-[#58a6ff]" size={22} />,
                title: 'Secure',
                desc: 'Official GitHub App. No passwords or tokens.',
              },
              {
                icon: <Zap className="text-[#d29922]" size={22} />,
                title: 'Automatic',
                desc: 'Daily monitoring at midnight UTC.',
              },
              {
                icon: <Terminal className="text-[#39d353]" size={22} />,
                title: 'Transparent',
                desc: 'Only touches README. Never your code.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 lg:p-6 bg-[#161b22] border border-[#30363d] rounded-xl"
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-[#0d1117] flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base lg:text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-[#8b949e]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Demo - Mobile: Terminal on Top */}
      <section className="py-16 lg:py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Terminal First on Mobile */}
            <motion.div {...fadeIn} className="w-full order-1 lg:order-2">
              <TerminalWindow title="automation.log">
                <TerminalLine prompt={false}>
                  <span className="text-[#8b949e]"># 00:00 UTC</span>
                </TerminalLine>
                <TerminalLine prompt={false}>Checking activity...</TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#f85149]">⚠ No commits</span>
                </TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#d29922]">→ Backup commit...</span>
                </TerminalLine>
                <TerminalLine prompt={false}>
                  <span className="text-[#39d353]">✓ Streak saved!</span>
                </TerminalLine>
              </TerminalWindow>
            </motion.div>

            {/* Text Content */}
            <motion.div {...fadeIn} className="order-2 lg:order-1">
              <h2 className="text-2xl lg:text-4xl font-bold mb-4">
                100% Transparent
              </h2>
              <p className="text-[#8b949e] mb-6 text-sm lg:text-base">
                Every action is logged. We only update your README timestamp.
                Your code is never touched.
              </p>
              <ul className="space-y-3">
                {['Open source', 'Revoke anytime', 'No hidden fees'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#238636]/20 flex items-center justify-center text-[#39d353] text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width Buttons */}
      <section className="py-20 lg:py-32 bg-gradient-to-t from-[#0d1117] to-[#050505]">
        <div className="max-w-lg mx-auto px-4 text-center">
          <motion.div {...fadeIn}>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Ready?
            </h2>
            <p className="text-[#8b949e] mb-8 text-sm lg:text-base">
              Join developers who never break their streak again.
            </p>

            {/* Stacked Buttons - Full Width */}
            <div className="space-y-3">
              <a
                href="/api/auth/github"
                className="flex items-center justify-center gap-2 w-full bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] text-white py-4 rounded-xl font-bold transition-colors touch-manipulation"
              >
                <Github size={20} />
                <span>Connect GitHub</span>
                <ArrowRight size={18} />
              </a>
              <a
                href="https://github.com/HakkanShah/commit-habit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-[#30363d] hover:border-[#8b949e] text-[#8b949e] hover:text-white py-4 rounded-xl font-bold transition-colors touch-manipulation"
              >
                <Terminal size={18} />
                <span>View Source</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="py-6 border-t border-[#30363d]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8b949e]">
          <span>Made with ❤️ for developers</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
