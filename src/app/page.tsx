'use client'

import { useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Github, Terminal, Shield, Zap, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { HeroSequence } from '@/components/hero-sequence'
import { ErrorBanner } from '@/components/error-banner'

// Lazy load heavy components for better initial load performance
const TestimonialsSection = dynamic(() => import('@/components/testimonials-section').then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <div className="h-[600px] bg-[#0d1117] animate-pulse" />,
  ssr: false
})

// Lazy load heavy components for better initial load performance
const AnimatedTerminal = dynamic(() => import('@/components/animated-terminal').then(mod => ({ default: mod.AnimatedTerminal })), {
  loading: () => <div className="h-[300px] bg-[#161b22] rounded-xl animate-pulse" />,
  ssr: false
})

const WorkflowAnimation = dynamic(() => import('@/components/workflow-animation').then(mod => ({ default: mod.WorkflowAnimation })), {
  loading: () => <div className="h-[200px] bg-[#161b22]/50 rounded-xl animate-pulse" />,
  ssr: false
})

const Particles = dynamic(() => import('@/components/particles').then(mod => ({ default: mod.Particles })), {
  ssr: false
})

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
  // Track page visit
  useEffect(() => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: '/',
        referrer: document.referrer || null,
      }),
    }).catch(() => { }) // Silent fail
  }, [])

  return (
    <main role="main" aria-label="CommitHabit Landing Page" className="min-h-screen bg-[#0d1117] text-white overflow-x-hidden selection:bg-[#39d353]/30 selection:text-[#39d353]">
      {/* Global Fixed Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] animate-grid pointer-events-none z-0" aria-hidden="true" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d1117] via-transparent to-[#050505] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative z-10">
        <ErrorBanner />

        {/* Hero Section */}
        <HeroSequence />

        {/* Features Section - Glassmorphism & Hover Effects */}
        <section id="features" className="relative pt-8 pb-8 lg:pt-16 lg:pb-12 overflow-hidden content-auto">
          <div className="relative max-w-6xl mx-auto px-4 z-10">
            <motion.div className="text-center mb-8 lg:mb-10" {...fadeInUp}>
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

            {/* Visual Workflow Animation - above feature cards */}
            <motion.div {...fadeInUp} className="mb-10">
              <WorkflowAnimation />
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

        <section className="relative pt-8 pb-12 lg:pt-12 lg:pb-32 overflow-hidden content-auto">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#39d353]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Terminal */}
              <motion.div
                {...fadeInUp}
                className="w-full order-1 lg:order-2"
              >
                <AnimatedTerminal />
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

        {/* Testimonials Section */}
        <TestimonialsSection />

        <section className="relative py-12 lg:py-24 overflow-hidden content-auto">
          <div className="absolute inset-x-0 bottom-0 h-[600px] bg-gradient-to-t from-[#238636]/10 via-[#238636]/5 to-transparent pointer-events-none" />


          {/* Floating Particles/Stars - Client Only */}
          <Particles />

          <div className="relative max-w-2xl mx-auto px-4 text-center z-10">
            <motion.div {...fadeInUp}>
              <h2 className="text-4xl lg:text-6xl font-black mb-6">
                Ready to <span className="text-[#39d353]">start?</span>
              </h2>
              <p className="text-[#8b949e] text-lg mb-8">
                Join thousands of developers keeping their streaks alive.
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] rounded-full border border-[#30363d]">
                  <span className="text-[#39d353]">✓</span>
                  <span className="text-[#c9d1d9]">100% Free</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] rounded-full border border-[#30363d]">
                  <Shield size={14} className="text-[#58a6ff]" />
                  <span className="text-[#c9d1d9]">MIT License</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] rounded-full border border-[#30363d]">
                  <Zap size={14} className="text-[#d29922]" />
                  <span className="text-[#c9d1d9]">Active Development</span>
                </div>
              </div>

              {/* Main CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-8">
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

              {/* Star Button - Prominent */}
              <motion.a
                href="https://github.com/HakkanShah/commit-habit"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#161b22] to-[#1c2128] border border-[#30363d] hover:border-[#d29922]/50 rounded-full text-[#c9d1d9] hover:text-white transition-all group"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-[#d29922] group-hover:text-[#f0b800]"
                >
                  ⭐
                </motion.span>
                <span className="font-medium">Star this repo on GitHub</span>
                <span className="text-xs text-[#8b949e] group-hover:text-[#d29922] transition-colors hidden sm:inline">It helps a lot!</span>
              </motion.a>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-[#30363d] bg-[#0d1117] relative z-10">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#8b949e]">
            <div className="flex items-center gap-2">
              <span>Crafted by</span>
              <a
                href="https://hakkan.is-a.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-[#39d353] transition-colors underline decoration-[#39d353]/50 underline-offset-2"
              >
                Hakkan
              </a>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs">© 2026 CommitHabit</span>
              <span className="text-[#30363d]">•</span>
              <a href="https://github.com/HakkanShah/commit-habit" target="_blank" rel="noopener noreferrer" className="hover:text-[#39d353] transition-colors">Open Source</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
