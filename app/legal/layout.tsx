import Link from "next/link";
import { ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "Legal | Ekero Partners Empower Wealth (EPEW)",
  description:
    "Official legal documents for Ekero Partners Empower Wealth (EPEW).",
};

export default function LegalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100">
        {/* HERO HEADER */}
      <div className="bg-[#06245c] text-white py-16 shadow-lg">
        <div className="max-w-6xl mx-auto px-8">

          <h1 className="text-5xl md:text-6xl font-extrabold">
            Legal Center
          </h1>

          <p className="text-2xl text-gray-200 mt-5 max-w-4xl leading-relaxed">
            Official legal documents governing the Entrepreneur Development
            Ecosystem (EDE), coordinated through the Intelligent Business
            Operating System (IBOS).
          </p>

        </div>
      </div>

      {/* LEGAL NAVIGATION */}

      <div className="bg-white shadow-md border-b">
        <div className="max-w-6xl mx-auto px-8 py-5">

          <div className="flex flex-wrap gap-6 text-xl font-semibold">

            <Link
              href="/legal/privacy-policy"
              className="text-[#06245c] hover:text-green-600 transition"
            >
              Privacy Policy
            </Link>

            <Link
              href="/legal/terms-of-use"
              className="text-[#06245c] hover:text-green-600 transition"
            >
              Terms of Use
            </Link>

            <Link
              href="/legal/disclaimer"
              className="text-[#06245c] hover:text-green-600 transition"
            >
              Platform Disclaimer
            </Link>

          </div>

        </div>
      </div>

      {/* DOCUMENT */}

      <main className="max-w-6xl mx-auto py-16 px-8">

        <div className="bg-white rounded-3xl shadow-xl p-12 md:p-16">

          {children}

        </div>

      </main>

    </div>
    </>
  );
}