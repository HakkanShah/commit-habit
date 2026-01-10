import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://commithabit.vercel.app'),
  title: {
    default: "Commit Habit - Build Your GitHub Activity Streak",
    template: "%s | Commit Habit"
  },
  description: "Automate your GitHub contributions safely and ethically. Build consistent coding habits with daily commits using secure GitHub App authentication. No PAT required, open source, and free.",
  keywords: [
    "GitHub automation",
    "daily commits",
    "contribution streak",
    "GitHub activity",
    "coding habit",
    "commit bot",
    "GitHub App",
    "developer tools",
    "open source",
    "free GitHub automation"
  ],
  authors: [{ name: "Commit Habit", url: "https://commithabit.vercel.app" }],
  creator: "Commit Habit",
  publisher: "Commit Habit",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://commithabit.vercel.app",
    siteName: "Commit Habit",
    title: "Commit Habit - Build Your GitHub Activity Streak",
    description: "Automate your GitHub contributions safely. Build consistent coding habits with daily commits using secure GitHub App authentication.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Commit Habit Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Commit Habit - Build Your GitHub Activity Streak",
    description: "Automate your GitHub contributions safely. No PAT required, open source, and free.",
    images: ["/logo.png"],
    creator: "@commithabit",
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d1117' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

