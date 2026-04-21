import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OFC Poker - Open Face Chinese Poker",
  description: "Play Open Face Chinese Poker with friends online",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 light:from-emerald-50 light:via-white light:to-emerald-50 text-white dark:text-white transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
