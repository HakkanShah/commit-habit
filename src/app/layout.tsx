import type { Metadata } from "next";
import Script from "next/script";
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
  applicationName: 'Commit Habit',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'google-site-verification-placeholder',
    yandex: 'yandex-verification-placeholder',
    other: {
      'msvalidate.01': 'bing-verification-placeholder',
    },
  },
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
        width: 1200,
        height: 630,
        alt: "Commit Habit Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Commit Habit",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Automate your GitHub contributions safely and ethically. Build consistent coding habits with daily commits using secure GitHub App authentication.",
  "publisher": {
    "@type": "Organization",
    "name": "Commit Habit",
    "logo": "https://commithabit.vercel.app/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preload LCP image */}
        <link rel="preload" href="/logo.webp" as="image" type="image/webp" fetchPriority="high" />

        {/* DNS Prefetch & Preconnect for external resources */}
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://github.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/*
          Analytics runs on `lazyOnload` rather than `afterInteractive`.

          gtag.js is ~90KB of third-party JavaScript that parses and executes on
          the main thread. On `afterInteractive` that work lands right after
          hydration, competing with the hero animation for the main thread on
          exactly the devices that can least afford it. `lazyOnload` waits for the
          window load event instead.

          Trade-off: a visitor who leaves within the first second or two may not
          be counted. Change both strategies back to "afterInteractive" if that
          accuracy matters more than the mobile main-thread time.
        */}
        <Script
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-MWC3K30RK2"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-MWC3K30RK2');
          `}
        </Script>
        <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

