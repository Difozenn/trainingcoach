import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeScript } from "@/components/layout/theme-script";
import { getLocale } from "next-intl/server";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://paincave.io"),
  title: {
    default: "Paincave — Endurance Training Intelligence",
    template: "%s | Paincave",
  },
  description:
    "AI-free endurance training coach for cycling, running, and swimming. Science-backed workouts, nutrition targets, and fitness tracking.",
  keywords: [
    "endurance training",
    "cycling coach",
    "running coach",
    "swimming coach",
    "training plan",
    "FTP",
    "TSS",
    "CTL",
    "ATL",
    "TSB",
    "nutrition",
    "triathlon",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Paincave",
    title: "Paincave — Endurance Training Intelligence",
    description:
      "Science-backed training plans for cycling, running, and swimming. No AI hype — just peer-reviewed research and proven coaching principles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paincave — Endurance Training Intelligence",
    description:
      "Science-backed training plans for cycling, running, and swimming.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
