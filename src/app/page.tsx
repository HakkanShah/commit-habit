import Link from 'next/link'
import { Github, Shield, Zap, Clock, CheckCircle, XCircle, ArrowRight, Heart } from 'lucide-react'

export default function HomePage() {
  const githubAppUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'commit-habit'}/installations/new`

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">📊</span>
            <span className="gradient-text">Commit Habit</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="btn btn-ghost text-sm">
              Dashboard
            </Link>
            <a href="/api/auth/github" className="btn btn-primary text-sm">
              <Github size={18} />
              Login with GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block px-4 py-2 rounded-full bg-[var(--secondary)] text-sm font-medium mb-6">
            🎓 Built for beginners • 100% Open Source
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Build Consistent <span className="gradient-text">GitHub Habits</span>
            <br />Without the Stress
          </h1>

          <p className="text-lg md:text-xl text-[var(--muted)] mb-8 max-w-2xl mx-auto">
            A transparent automation tool that helps you maintain your GitHub activity streak
            while learning about GitHub Apps, automation, and ethical coding practices.
          </p>

          {/* Login Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a href="/api/auth/github" className="btn btn-primary text-lg px-8 py-4">
              <Github size={20} />
              Login with GitHub
              <ArrowRight size={18} />
            </a>
            <Link href="#how-it-works" className="btn btn-secondary text-lg px-8 py-4">
              Learn How It Works
            </Link>
          </div>

          <p className="text-sm text-[var(--muted)] mb-8">
            Sign in with GitHub to get started • No password required
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--accent)]" />
              No PAT Required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[var(--accent)]" />
              Fully Revocable
            </div>
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[var(--danger)]" />
              Open Source
            </div>
          </div>
        </div>
      </section>

      {/* Ethics Banner */}
      <section className="bg-[var(--warning)]/10 border-y border-[var(--warning)]/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[var(--foreground)] font-medium">
            ⚠️ <strong>Important:</strong> Automated commits do NOT represent real development work.
            This tool is for learning and habit-building only.
          </p>
        </div>
      </section>

      {/* What This Does / Doesn't Do */}
      <section className="section" id="features">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Complete Transparency
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* What it does */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <CheckCircle className="text-[var(--accent)]" size={20} />
                </div>
                <h3 className="text-xl font-semibold">What This Does</h3>
              </div>
              <ul className="space-y-3 text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Uses official GitHub App authentication (no PATs)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Makes minor README formatting changes only
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Maximum 5 automated commits per day
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Skips days when you have real commits
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Clear commit messages like &quot;fix: format README&quot;
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[var(--accent)] mt-1 flex-shrink-0" />
                  Can be paused, resumed, or uninstalled anytime
                </li>
              </ul>
            </div>

            {/* What it doesn't do */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--danger)]/10 flex items-center justify-center">
                  <XCircle className="text-[var(--danger)]" size={20} />
                </div>
                <h3 className="text-xl font-semibold">What This Does NOT Do</h3>
              </div>
              <ul className="space-y-3 text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT ask for your GitHub password
                </li>
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT require Personal Access Tokens
                </li>
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT modify your source code
                </li>
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT represent real development work
                </li>
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT store long-lived tokens
                </li>
                <li className="flex items-start gap-2">
                  <XCircle size={16} className="text-[var(--danger)] mt-1 flex-shrink-0" />
                  Does NOT access private data beyond selected repos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-[var(--secondary)]/30" id="how-it-works">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-2xl mx-auto">
            Learn about GitHub Apps, OAuth, and automation the safe way
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <Github size={24} />,
                title: "Login",
                description: "Sign in with your GitHub account - no password needed"
              },
              {
                step: "2",
                icon: <Shield size={24} />,
                title: "Install App",
                description: "Install the GitHub App on your chosen repositories"
              },
              {
                step: "3",
                icon: <Clock size={24} />,
                title: "Daily Check",
                description: "Our system checks daily if you've made any real commits"
              },
              {
                step: "4",
                icon: <Zap size={24} />,
                title: "Auto Format",
                description: "If no real commits, we make a small README formatting change"
              }
            ].map((item, index) => (
              <div key={index} className="card text-center relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-[var(--primary)] text-white text-sm font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4 mt-2 text-[var(--primary)]">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Section */}
      <section className="section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Learn From This Project
          </h2>
          <p className="text-center text-[var(--muted)] mb-12">
            This open-source project teaches you valuable skills
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "GitHub App Authentication",
              "JWT Token Generation",
              "Webhook Handling",
              "OAuth 2.0 Flows",
              "Next.js API Routes",
              "PostgreSQL with Prisma",
              "Vercel Cron Jobs",
              "Security Best Practices",
              "Ethical Automation"
            ].map((topic, index) => (
              <div key={index} className="card py-4 text-center">
                <span className="font-medium">{topic}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://github.com/yourusername/commit-habit"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Github size={18} />
              View Source Code
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Better Habits?
          </h2>
          <p className="text-white/80 mb-8">
            Start learning GitHub automation today with a tool that respects your security and privacy.
          </p>
          <a href="/api/auth/github" className="btn bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-4">
            <Github size={20} />
            Get Started with GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="font-semibold">Commit Habit</span>
              <span className="text-[var(--muted)]">• Open Source</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
              <a href="https://github.com/yourusername/commit-habit" className="hover:text-[var(--foreground)]">
                GitHub
              </a>
              <Link href="/dashboard" className="hover:text-[var(--foreground)]">
                Dashboard
              </Link>
              <span>Made with ❤️ for beginners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
