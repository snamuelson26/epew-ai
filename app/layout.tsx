import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/app/components/enterprise/language";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EPEW",
    template: "%s | EPEW",
  },

  description:
    "Entrepreneur Development Ecosystem — Build Your Community. Build Your Business. Build Your Wealth.",

  applicationName: "EPEW",

  keywords: [
    "Entrepreneur",
    "Business Funding",
    "Community",
    "EPEW",
    "EDE",
    "IBOS",
    "Business Launch",
  ],

  authors: [
    {
      name: "EPEW",
    },
  ],

  creator: "EPEW",

  robots: {
    index: true,
    follow: true,
  },

  metadataBase: new URL("https://epew.us"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-white text-black">
        <LanguageProvider
          initialLocale="en"
         namespaces={[
  "common",
  "navigation",
  "homepage",
  "about",
  "login",
]}
          detectBrowserLanguage
          useStoredPreference
          persistPreference
        >
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}