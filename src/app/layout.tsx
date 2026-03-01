import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/layout/theme-script";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://trainingcoach.app"),
  title: {
    default: "TrainingCoach — Endurance Training Intelligence",
    template: "%s | TrainingCoach",
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
    siteName: "TrainingCoach",
    title: "TrainingCoach — Endurance Training Intelligence",
    description:
      "Science-backed training plans for cycling, running, and swimming. No AI hype — just peer-reviewed research and proven coaching principles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrainingCoach — Endurance Training Intelligence",
    description:
      "Science-backed training plans for cycling, running, and swimming.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
