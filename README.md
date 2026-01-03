# 📊 Commit Habit

A free, open-source GitHub App-based automation tool that helps beginners maintain daily GitHub interaction habits **without using Personal Access Tokens (PATs)**.

> ⚠️ **Ethics Disclaimer**: Automated commits do NOT represent real development work. This tool is designed for learning and habit-building purposes only. Always be transparent about your contributions.

## ✨ Features

- 🔒 **Secure GitHub App Authentication** - No PATs or passwords required
- 📝 **Non-destructive Changes** - Only modifies README formatting (whitespace)
- ⏰ **Smart Scheduling** - Skips days when you have real commits
- 🎯 **Daily Limits** - Maximum 5 automated commits per day
- 🔄 **Full Control** - Pause, resume, or uninstall anytime
- 📊 **Activity Dashboard** - Track automation history
- 🌱 **Beginner-Friendly** - Learn GitHub automation safely

## 🎓 What You'll Learn

This project teaches valuable skills for any developer:

- GitHub App authentication (JWT, Installation tokens)
- OAuth 2.0 flows
- Webhook handling and signature verification
- Next.js API routes (App Router)
- PostgreSQL with Prisma ORM
- Scheduled tasks (Vercel Cron)
- Security best practices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- GitHub account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/commit-habit.git
cd commit-habit
npm install
```

### 2. Create a GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. Click **"New GitHub App"**
3. Fill in the required fields:

| Field | Value |
|-------|-------|
| **App Name** | `commit-habit` (or your unique name) |
| **Homepage URL** | `https://your-app.vercel.app` |
| **Callback URL** | `https://your-app.vercel.app/api/auth/callback` |
| **Setup URL** | `https://your-app.vercel.app/api/auth/callback` |
| **Webhook URL** | `https://your-app.vercel.app/api/github/webhook` |
| **Webhook Secret** | Generate with `openssl rand -hex 32` |

4. Set **Permissions**:
   - Repository contents: **Read & Write**
   - Metadata: **Read**

5. Subscribe to **Events**:
   - Installation
   - Installation repositories

6. Click **"Create GitHub App"**

7. Generate and download a **Private Key**

8. Note your **App ID**, **Client ID**, and **Client Secret**

### 3. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."

# GitHub App
GITHUB_APP_ID="123456"
GITHUB_APP_CLIENT_ID="Iv1.xxx"
GITHUB_APP_CLIENT_SECRET="xxx"
GITHUB_WEBHOOK_SECRET="xxx"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_GITHUB_APP_NAME="commit-habit"
CRON_SECRET="your-random-secret"
```

**Converting Private Key**: The private key must be a single line with `\n` for line breaks:
```bash
cat private-key.pem | tr '\n' '~' | sed 's/~/\\n/g'
```

### 4. Set Up Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ Landing Page│───▶│Install App  │───▶│   Dashboard     │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Application                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    API Routes                            ││
│  │  /api/auth/callback  - OAuth callback                   ││
│  │  /api/github/webhook - GitHub webhooks                  ││
│  │  /api/installations  - Manage repos                     ││
│  │  /api/cron/daily     - Scheduled automation             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Supabase PostgreSQL   │     │       GitHub API        │
│  ┌───────────────────┐  │     │  • Check commits        │
│  │ users             │  │     │  • Read README          │
│  │ installations     │  │     │  • Create commit        │
│  │ activity_logs     │  │     │                         │
│  └───────────────────┘  │     └─────────────────────────┘
└─────────────────────────┘
```

## 📁 Project Structure

```
commit-habit/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/route.ts    # OAuth callback
│   │   │   │   ├── logout/route.ts      # Logout handler
│   │   │   │   └── me/route.ts          # Current user
│   │   │   ├── github/
│   │   │   │   └── webhook/route.ts     # Webhook handler
│   │   │   ├── installations/
│   │   │   │   └── route.ts             # Manage repos
│   │   │   └── cron/
│   │   │       └── daily/route.ts       # Daily automation
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 # Dashboard page
│   │   │   └── installation-card.tsx    # Repo card component
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Landing page
│   │   └── globals.css
│   └── lib/
│       ├── github.ts                    # GitHub API utilities
│       ├── auth.ts                      # Session management
│       ├── prisma.ts                    # Database client
│       └── utils.ts                     # Helper functions
├── prisma/
│   └── schema.prisma                    # Database schema
├── vercel.json                          # Cron configuration
└── .env.example                         # Environment template
```

## 🔐 Security

This project follows security best practices:

| Aspect | Implementation |
|--------|---------------|
| **Authentication** | GitHub App (no PATs) |
| **Token Storage** | Never stored - generated on-demand |
| **Private Key** | Environment variable only |
| **Webhooks** | Signature verification |
| **Sessions** | HTTP-only secure cookies |
| **Cron** | Secret header validation |
| **Revocation** | Uninstall from GitHub |

## 🚀 Deployment

### Deploy to Vercel

1. Push repository to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Configure Cron Job

The `vercel.json` includes a cron job that runs daily at 6 AM UTC:

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

### Post-Deployment

1. Update GitHub App URLs to your Vercel domain
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

## ❓ FAQ

### Why use a GitHub App instead of PAT?

- **More secure**: No long-lived tokens stored
- **Revocable**: User can uninstall anytime from GitHub
- **Transparent**: Clear permissions displayed during install
- **Learning**: Teaches real-world authentication patterns

### What exactly does the automation do?

It toggles trailing whitespace in your README.md file. This creates a minimal, non-destructive commit that maintains your activity streak without modifying actual code.

### Will this help me get a job?

**No.** This tool does NOT represent real development work. It's designed to:
1. Help you learn about GitHub automation
2. Maintain visibility while you're between projects
3. Encourage consistent engagement with GitHub

Always prioritize real contributions over artificial activity.

### How do I uninstall?

1. Go to [GitHub Settings → Applications](https://github.com/settings/installations)
2. Find "Commit Habit"
3. Click "Configure" → "Uninstall"

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- ORM by [Prisma](https://prisma.io/)
- Deployed on [Vercel](https://vercel.com/)

---

<p align="center">
  Made with ❤️ for beginners learning GitHub automation
</p>
