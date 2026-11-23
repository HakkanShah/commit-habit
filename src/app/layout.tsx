import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { SITE, SITE_URL, KEYWORDS } from "@/lib/site-content";
import { StructuredData } from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: KEYWORDS,
  authors: [{ name: SITE.author.name, url: SITE.author.github }],
  creator: SITE.author.name,
  publisher: SITE.name,
  applicationName: SITE.name,
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  // Search Console ownership proof. This value is public by design — it is
  // served in the HTML to every visitor — so it belongs in the source rather
  // than in an environment variable.
  //
  // Note this is the token from Search Console's *HTML tag* method. Google
  // issues a different token per method: the DNS TXT token is not
  // interchangeable with this one, and DNS verification is not available on a
  // .vercel.app subdomain anyway, since the DNS for vercel.app is Vercel's.
  // `public/googlea7ed2a49ca200a60.html` carries the HTML-file method as a
  // second, independent proof — Google accepts either, and keeping both means
  // ownership survives one of them being removed by accident.
  //
  // Only Google is listed. The previous version shipped literal strings like
  // "yandex-verification-placeholder" as real meta tags; a bogus token is worse
  // than none, because it occupies the tag the real one needs. Add Bing or
  // Yandex here only with genuine values from those consoles.
  verification: {
    google: '_RqZR5igVN4EnU7Ba6jr3TVlFQiuDPwqhutqyvr1KT0',
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
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.shortDescription,
    // Image, dimensions and alt come from `opengraph-image.tsx`. They used to be
    // declared here by hand as 1200x630 while pointing at a 512x512 logo, so
    // every social platform cropped or letterboxed a square into a wide card.
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.shortDescription,
    creator: '@commithabit',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  category: 'technology',
}

// `themeColor` belongs on the viewport export, not on metadata — Next.js warns
// about it on every build when it is in the wrong place.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d1117' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  colorScheme: 'dark',
}

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
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

