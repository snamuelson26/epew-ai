import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/app/components/enterprise/language";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPEW",
  description:
    "Entrepreneur Development Ecosystem — Build Your Community. Build Your Business. Build Your Wealth.",
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
      <body className="min-h-full flex flex-col">
        <LanguageProvider
          initialLocale="en"
          namespaces={[
            "common",
            "navigation",
            "homepage",
          ]}
          detectBrowserLanguage
          useStoredPreference
          persistPreference
        >
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}