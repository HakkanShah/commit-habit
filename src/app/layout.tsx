import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Commit Habit - Build Your GitHub Activity Streak",
  description: "A safe, ethical tool to help beginners learn GitHub automation and maintain daily activity habits using GitHub App authentication.",
  keywords: ["GitHub", "automation", "commit", "habit", "learning", "beginner"],
  authors: [{ name: "Commit Habit" }],
  openGraph: {
    title: "Commit Habit - Build Your GitHub Activity Streak",
    description: "Learn GitHub automation the safe and ethical way",
    type: "website",
  },
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
        {children}
      </body>
    </html>
  );
}
