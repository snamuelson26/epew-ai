"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";

import Navbar from "../components/Navbar";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

type LegalLayoutProps = {
  children: ReactNode;
};

export default function LegalLayout({
  children,
}: LegalLayoutProps) {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces(["legal"]);
  }, [loadNamespaces]);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100">
        {/* HERO HEADER */}
        <div className="bg-[#06245c] py-16 text-white shadow-lg">
          <div className="mx-auto max-w-6xl px-8">
            <h1 className="text-5xl font-extrabold md:text-6xl">
              {t("hero.title", {
                namespace: "legal",
              })}
            </h1>

            <p className="mt-5 max-w-4xl text-2xl leading-relaxed text-gray-200">
              {t("hero.description", {
                namespace: "legal",
              })}
            </p>
          </div>
        </div>

        {/* LEGAL NAVIGATION */}
        <div className="border-b bg-white shadow-md">
          <div className="mx-auto max-w-6xl px-8 py-5">
            <div className="flex flex-wrap gap-6 text-xl font-semibold">
              <Link
                href="/legal/privacy-policy"
                className="text-[#06245c] transition hover:text-green-600"
              >
                {t("navigation.privacyPolicy", {
                  namespace: "legal",
                })}
              </Link>

              <Link
                href="/legal/terms-of-use"
                className="text-[#06245c] transition hover:text-green-600"
              >
                {t("navigation.termsOfUse", {
                  namespace: "legal",
                })}
              </Link>

              <Link
                href="/legal/disclaimer"
                className="text-[#06245c] transition hover:text-green-600"
              >
                {t("navigation.platformDisclaimer", {
                  namespace: "legal",
                })}
              </Link>
            </div>
          </div>
        </div>

        {/* LEGAL PAGE CONTENT */}
        <main className="mx-auto max-w-6xl px-8 py-16">
          <div className="rounded-3xl bg-white p-10 shadow-xl md:p-16">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}