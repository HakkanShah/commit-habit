<div align="center"> 

<img src="public/banner.png" alt="Commit Habit" width="600" />

<p align="center">
  <strong>Build Your GitHub Activity Streak — Securely & Ethically</strong>
</p>

<p align="center">
  A free, open-source GitHub App that helps developers maintain daily GitHub habits without Personal Access Tokens.
</p>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

<br />

[**Live Demo**](https://commithabit.vercel.app) · [**Report Bug**](https://github.com/HakkanShah/commit-habit/issues) · [**Request Feature**](https://github.com/HakkanShah/commit-habit/issues)

</div>

---

> ⚠️ **Ethics Disclaimer**: Automated commits do **NOT** represent real development work. This tool is designed for learning and habit-building purposes only. Always be transparent about your contributions.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Quick Start (Users)](#-quick-start-for-users)
- [Installation (Developers)](#-installation-for-developers)
- [Environment Variables](#-environment-variables)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Deployment](#-deployment)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔒 **Secure Authentication** | GitHub App OAuth — no PATs or passwords required |
| 🔐 **Google OAuth Support** | Alternative sign-in with Google account |
| 📝 **Non-destructive Changes** | Only modifies README formatting (whitespace) |
| ⏰ **Smart Scheduling** | Automatically skips days when you have real commits |
| 🎯 **Daily Limits** | Maximum 5 automated commits per day per repository |
| 🔄 **Full Control** | Pause, resume, or uninstall anytime |
| 📊 **Activity Dashboard** | Track automation history with beautiful UI |
| 📧 **Email Notifications** | Get notified about important events |
| 📈 **Analytics** | Discord webhook integration for visitor analytics |
| 🌱 **Beginner-Friendly** | Learn GitHub automation safely |

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center"><strong>Frontend</strong></td>
<td align="center"><strong>Backend</strong></td>
<td align="center"><strong>Database</strong></td>
<td align="center"><strong>Infrastructure</strong></td>
</tr>
<tr>
<td>

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Framer Motion

</td>
<td>

- Next.js API Routes
- GitHub App SDK (Octokit)
- JWT Authentication
- Webhook Handlers

</td>
<td>

- PostgreSQL
- Prisma ORM
- Supabase

</td>
<td>

- Vercel (Hosting)
- Vercel Cron Jobs
- GitHub Actions (CI/CD)

</td>
</tr>
</table>

---

## 🚀 Quick Start (For Users)

Getting started with Commit Habit takes less than 2 minutes:

### Step 1: Visit the App
Go to [commithabit.vercel.app](https://commithabit.vercel.app)

### Step 2: Sign In
Click **"Get Started"** and authenticate with your GitHub or Google account.

### Step 3: Install the GitHub App
Click **"Add Repository"** and install the Commit Habit app on your selected repositories.

### Step 4: Enable Automation
Toggle automation **ON** for any connected repository. That's it! 🎉

---

## 💻 Installation (For Developers)

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** database ([Supabase](https://supabase.com) recommended)
- **GitHub Account** for creating a GitHub App

### 1. Clone the Repository

```bash
git clone https://github.com/HakkanShah/commit-habit.git
cd commit-habit
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Create a GitHub App

1. Navigate to **[GitHub Settings → Developer settings → GitHub Apps](https://github.com/settings/apps)**
2. Click **"New GitHub App"**
3. Configure the following:

| Field | Value |
|-------|-------|
| **App Name** | `commit-habit` (must be unique) |
| **Homepage URL** | `https://your-app.vercel.app` |
| **Callback URL** | `https://your-app.vercel.app/api/auth/callback` |
| **Setup URL** | `https://your-app.vercel.app/api/auth/callback` |
| **Webhook URL** | `https://your-app.vercel.app/api/github/webhook` |
| **Webhook Secret** | Generate with `openssl rand -hex 32` |

4. Set **Permissions**:
   | Permission | Access Level |
   |------------|--------------|
   | Repository contents | Read & Write |
   | Metadata | Read |

5. Subscribe to **Events**:
   - ✅ Installation
   - ✅ Installation repositories

6. Click **"Create GitHub App"**
7. **Generate and download** a Private Key (`.pem` file)
8. Note your **App ID**, **Client ID**, and **Client Secret**

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values (see [Environment Variables](#-environment-variables) section).

### 5. Set Up Database

```bash
# Initialize Prisma and run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GITHUB_APP_ID` | Your GitHub App ID | `123456` |
| `GITHUB_APP_CLIENT_ID` | OAuth Client ID | `Iv1.xxxxxxxxxx` |
| `GITHUB_APP_CLIENT_SECRET` | OAuth Client Secret | `xxxxxxxxxxxxxxxx` |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret | `openssl rand -hex 32` |
| `GITHUB_APP_PRIVATE_KEY` | RSA Private Key content | `-----BEGIN RSA...` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_GITHUB_APP_NAME` | GitHub App name | `commit-habit` |
| `CRON_SECRET` | Secret for cron endpoint | `openssl rand -hex 32` |
| `SESSION_SECRET` | Session encryption secret | `openssl rand -hex 32` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email app password | Gmail App Password |
| `SMTP_FROM` | From email address | `CommitHabit <noreply@example.com>` |
| `DISCORD_WEBHOOK_URL` | Discord webhook for analytics | Webhook URL |
| `ADMIN_EMAIL` | Admin notification email | `admin@example.com` |

### Private Key Formatting

The private key must be converted to a single-line format:

```bash
# Linux/macOS
cat private-key.pem | tr '\n' '~' | sed 's/~/\\n/g'

# Or copy directly with newlines in the .env file (inside quotes)
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User's Browser                                 │
│  ┌────────────────┐   ┌─────────────────┐   ┌────────────────────────┐  │
│  │  Landing Page  │──▶│  OAuth Install  │──▶│      Dashboard         │  │
│  │                │   │  (GitHub/Google)│   │  (Manage Repos)        │  │
│  └────────────────┘   └─────────────────┘   └────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Next.js Application (Vercel)                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                          API Routes                                │  │
│  │  ┌───────────────┐  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │ /api/auth/*   │  │ /api/github/*    │  │ /api/cron/daily    │  │  │
│  │  │ OAuth Flows   │  │ Webhook Handler  │  │ Scheduled Jobs     │  │  │
│  │  └───────────────┘  └──────────────────┘  └────────────────────┘  │  │
│  │  ┌───────────────┐  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │ /api/install* │  │ /api/analytics   │  │ /api/health        │  │  │
│  │  │ Manage Repos  │  │ Visitor Tracking │  │ Health Check       │  │  │
│  │  └───────────────┘  └──────────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                  ┌───────────────────┴───────────────────┐
                  ▼                                       ▼
┌────────────────────────────────┐     ┌────────────────────────────────┐
│     Supabase PostgreSQL        │     │         GitHub API             │
│  ┌──────────────────────────┐  │     │  • Check user commits          │
│  │ Users                    │  │     │  • Read README content         │
│  │ Accounts (Multi-Provider)│  │     │  • Create automated commit     │
│  │ Installations            │  │     │  • Manage app installations    │
│  │ ActivityLogs             │  │     │                                │
│  └──────────────────────────┘  │     └────────────────────────────────┘
└────────────────────────────────┘
```

---

## 📁 Project Structure

```
commit-habit/
├── 📂 prisma/
│   └── schema.prisma               # Database schema (User, Account, Installation, ActivityLog)
│
├── 📂 public/
│   ├── icon.png                    # App favicon
│   ├── logo.png                    # App logo
│   ├── manifest.json               # PWA manifest
│   ├── robots.txt                  # SEO robots file
│   └── sitemap.xml                 # SEO sitemap
│
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   ├── 📂 auth/
│   │   │   │   ├── callback/       # OAuth callback handler
│   │   │   │   ├── logout/         # Logout handler
│   │   │   │   ├── me/             # Current user endpoint
│   │   │   │   └── google/         # Google OAuth
│   │   │   ├── 📂 cron/
│   │   │   │   └── daily/          # Daily automation cron job
│   │   │   ├── 📂 github/
│   │   │   │   └── webhook/        # GitHub webhook handler
│   │   │   ├── 📂 installations/   # Repository management
│   │   │   ├── 📂 analytics/       # Visitor analytics
│   │   │   └── 📂 health/          # Health check endpoint
│   │   │
│   │   ├── 📂 dashboard/
│   │   │   ├── page.tsx            # Dashboard page
│   │   │   ├── dashboard-client.tsx
│   │   │   └── installation-card.tsx
│   │   │
│   │   ├── favicon.ico
│   │   ├── globals.css             # Global styles & Tailwind
│   │   ├── layout.tsx              # Root layout with SEO
│   │   ├── page.tsx                # Landing page
│   │   └── providers.tsx           # React providers
│   │
│   ├── 📂 components/
│   │   ├── animated-terminal.tsx   # Terminal animation
│   │   ├── contribution-demo.tsx   # Contribution graph demo
│   │   ├── contribution-graph.tsx  # GitHub contribution graph
│   │   ├── hero-comparison.tsx     # Before/after comparison
│   │   ├── hero-sequence.tsx       # Hero animation sequence
│   │   ├── skeleton.tsx            # Loading skeletons
│   │   ├── toast.tsx               # Toast notifications
│   │   ├── workflow-animation.tsx  # Workflow demo
│   │   └── ...                     # Other UI components
│   │
│   └── 📂 lib/
│       ├── analytics.ts            # Analytics & Discord webhook
│       ├── api-client.ts           # Frontend API client
│       ├── auth.ts                 # Session management
│       ├── email.ts                # Email service
│       ├── errors.ts               # Error handling utilities
│       ├── github.ts               # GitHub API utilities
│       ├── prisma.ts               # Database client
│       ├── sounds.ts               # Sound effects
│       └── utils.ts                # Helper functions
│
├── .env.example                    # Environment variables template
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── vercel.json                     # Vercel cron configuration
```

---

## 📡 API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback` | GET | GitHub OAuth callback handler |
| `/api/auth/google` | GET | Google OAuth initiation |
| `/api/auth/google/callback` | GET | Google OAuth callback |
| `/api/auth/logout` | POST | Logout and clear session |
| `/api/auth/me` | GET | Get current authenticated user |

### Installation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/installations` | GET | List user's connected repositories |
| `/api/installations/[id]` | PATCH | Toggle automation for a repository |
| `/api/installations/[id]` | DELETE | Remove a repository |

### System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/webhook` | POST | GitHub webhook receiver |
| `/api/cron/daily` | GET | Daily automation job (protected) |
| `/api/health` | GET | Health check endpoint |
| `/api/analytics` | POST | Visitor analytics |

---

## 🔐 Security

Commit Habit implements enterprise-grade security practices:

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | GitHub App OAuth (no PAT exposure) |
| **Token Storage** | Access tokens are never stored — generated on-demand via JWT |
| **Private Keys** | Stored only as environment variables, never in code |
| **Webhooks** | HMAC-SHA256 signature verification |
| **Sessions** | HTTP-only secure cookies with encryption |
| **Cron Protection** | Secret header validation for scheduled jobs |
| **Revocation** | Users can uninstall anytime from GitHub settings |
| **Data Privacy** | Minimal data collection, GDPR-friendly |

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push** your repository to GitHub
2. **Import** the project at [vercel.com/new](https://vercel.com/new)
3. **Add** all environment variables from `.env.example`
4. **Deploy** — Vercel handles the rest!

### Configure Cron Job

The `vercel.json` includes a cron job running daily at 6 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Post-Deployment Checklist

- [ ] Update GitHub App URLs to your Vercel domain
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Verify webhook delivery in GitHub App settings
- [ ] Test the OAuth flow end-to-end

---

## ❓ FAQ

<details>
<summary><strong>Why use a GitHub App instead of Personal Access Tokens?</strong></summary>

- **More Secure**: No long-lived tokens stored in the database
- **User Control**: Can be uninstalled anytime from GitHub settings
- **Transparent**: Clear permissions displayed during installation
- **Learning Opportunity**: Teaches real-world authentication patterns

</details>

<details>
<summary><strong>What exactly does the automation do?</strong></summary>

It toggles trailing whitespace in your `README.md` file. This creates a minimal, non-destructive commit that maintains your activity streak without modifying actual code.

</details>



<details>
<summary><strong>How do I uninstall Commit Habit?</strong></summary>

1. Go to [GitHub Settings → Applications](https://github.com/settings/installations)
2. Find "Commit Habit"
3. Click **"Configure"** → **"Uninstall"**

Your data will be automatically cleaned up.

</details>

<details>
<summary><strong>Can I self-host this?</strong></summary>

Absolutely! Follow the [Installation](#-installation-for-developers) guide to deploy your own instance. You'll need to create your own GitHub App and database.

</details>

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/commit-habit.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

### Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[⬆ Back to Top](#-commit-habit)**

<br />

Crafted by [Hakkan](https://github.com/HakkanShah) for lazy devs who want green squares without the grind 🟩

<br />

[![GitHub](https://img.shields.io/badge/GitHub-HakkanShah-181717?logo=github)](https://github.com/HakkanShah)

</div>
