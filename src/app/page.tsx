'use client'

import { motion } from 'framer-motion'
import { Github, Terminal, Shield, Zap, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { HeroSequence } from '@/components/hero-sequence'
import { TerminalWindow, TerminalLine } from '@/components/terminal-window'
import { ErrorBanner } from '@/components/error-banner'
import { Particles } from '@/components/particles'

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10%' }, // Better mobile trigger
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } // Custom bezier for "cool" smooth stop
}

const cardContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}


const cardHover = {
  hover: {
    y: -5,
    borderColor: 'rgba(88, 166, 255, 0.5)',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white overflow-x-hidden selection:bg-[#39d353]/30 selection:text-[#39d353]">
      {/* Global Fixed Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] animate-grid pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d1117] via-transparent to-[#050505] pointer-events-none z-0" />

      <div className="relative z-10">
        <ErrorBanner />

        {/* Hero Section */}
        <HeroSequence />

        {/* Features Section - Glassmorphism & Hover Effects */}
        <section className="relative pt-20 pb-8 lg:pt-32 lg:pb-12 overflow-hidden">
          <div className="relative max-w-6xl mx-auto px-4 z-10">
            <motion.div className="text-center mb-16 lg:mb-24" {...fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#238636]/10 border border-[#238636]/20 text-[#39d353] text-xs font-mono mb-6 backdrop-blur-sm">
                <Sparkles size={12} />
                How It Works
              </span>
              <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
                Your Streak, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39d353] to-[#58a6ff]">Protected.</span>
              </h2>
              <p className="text-[#8b949e] max-w-xl mx-auto text-lg">
                Automated peace of mind for developers who code everyday but sometimes forget to commit.
              </p>
            </motion.div>

            {/* Feature Cards - Interactive & Glass */}
            <motion.div
              variants={cardContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: <Shield className="text-[#58a6ff]" size={28} />,
                  title: 'Secure by Design',
                  desc: 'Official GitHub App integration. No personal access tokens, no passwords, zero risk.',
                  gradient: 'from-[#58a6ff]/10 to-transparent'
                },
                {
                  icon: <Zap className="text-[#d29922]" size={28} />,
                  title: 'Daily Automation',
                  desc: 'Our cron job checks your activity at midnight UTC. If you coded, we stay silent.',
                  gradient: 'from-[#d29922]/10 to-transparent'
                },
                {
                  icon: <Terminal className="text-[#39d353]" size={28} />,
                  title: '100% Transparent',
                  desc: 'We only update your README timestamp. Your actual code logic is never touched.',
                  gradient: 'from-[#39d353]/10 to-transparent'
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover="hover"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  variants={cardHover}
                  className="group relative p-8 glass-card rounded-2xl overflow-hidden"
                >
                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{f.title}</h3>
                    <p className="text-[#8b949e] leading-relaxed group-hover:text-[#a3b3bc] transition-colors">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="relative pt-8 pb-20 lg:pt-12 lg:pb-32 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#39d353]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Terminal */}
              <motion.div
                {...fadeInUp}
                className="w-full order-1 lg:order-2 perspective-1000"
              >
                <motion.div
                  whileHover={{ rotateY: -5, rotateX: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <TerminalWindow title="automation.service">
                    <TerminalLine prompt={false}><span className="text-[#8b949e]"># 00:00 UTC - Daily Check</span></TerminalLine>
                    <TerminalLine prompt={false}>Searching for user activity...</TerminalLine>
                    <TerminalLine prompt={false}><span className="text-[#f85149]">⚠ Partial outage detected: No commits found</span></TerminalLine>
                    <TerminalLine prompt={false}><span className="text-[#d29922]">→ Initiating backup protocol...</span></TerminalLine>
                    <TerminalLine prompt={false}>git commit -m "docs: maintain streak"</TerminalLine>
                    <TerminalLine prompt={false}><span className="text-[#39d353]">✓ Streak successfully protected!</span></TerminalLine>
                  </TerminalWindow>
                </motion.div>
              </motion.div>

              {/* Content */}
              <motion.div {...fadeInUp} className="order-2 lg:order-1">
                <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight">
                  Code seamlessly.<br />
                  <span className="text-[#8b949e]">We handle the rest.</span>
                </h2>
                <div className="space-y-6">
                  <p className="text-[#8b949e] text-lg leading-relaxed">
                    Life happens. You might merge a PR at 11:59 PM or just forget.
                    CommitHabit acts as your safety net, ensuring your green squares stay green.
                  </p>
                  <ul className="space-y-4">
                    {['Open Source & Auditable', 'One-click Revocation', 'Privacy First Architecture'].map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-[#c9d1d9]"
                        whileHover={{ x: 5 }}
                      >
                        <span className="w-6 h-6 rounded-full bg-[#238636]/20 flex items-center justify-center text-[#39d353] border border-[#238636]/30">✓</span>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-[600px] bg-gradient-to-t from-[#238636]/10 via-[#238636]/5 to-transparent pointer-events-none" />


          {/* Floating Particles/Stars - Client Only */}
          <Particles />

          <div className="relative max-w-xl mx-auto px-4 text-center z-10">
            <motion.div {...fadeInUp}>
              <h2 className="text-4xl lg:text-6xl font-black mb-6">
                Ready to <span className="text-[#39d353]">start?</span>
              </h2>
              <p className="text-[#8b949e] text-lg mb-10">
                Join thousands of developers keeping their streaks alive.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <motion.a
                  href="/api/auth/github"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#238636] hover:bg-[#2ea043] text-white py-4 px-8 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(57,211,83,0.3)] hover:shadow-[0_0_50px_rgba(57,211,83,0.5)] transition-all"
                >
                  <Github size={22} />
                  <span>Connect GitHub</span>
                  <ArrowRight size={20} />
                </motion.a>

                <motion.a
                  href="https://github.com/HakkanShah/commit-habit"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:text-white hover:border-[#8b949e] py-4 px-8 rounded-xl font-bold text-lg transition-all"
                >
                  <Terminal size={20} />
                  <span>Source Code</span>
                  <ExternalLink size={16} />
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-[#30363d] bg-[#0d1117] relative z-10">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#8b949e]">
            <p>© 2024 CommitHabit. Open Source.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-[#39d353] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#39d353] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#39d353] transition-colors">Status</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
