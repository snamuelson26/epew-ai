"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

const NAMESPACE = "legal";

export default function LegalCenterPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces([NAMESPACE]);
  }, [loadNamespaces]);

  const translate = (key: string) =>
    t(key, {
      namespace: NAMESPACE,
    });

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="mb-6 text-5xl font-extrabold text-[#06245c] md:text-6xl">
          {translate("landing.title")}
        </h1>

        <p className="mx-auto max-w-4xl text-2xl leading-relaxed text-gray-700">
          {translate("landing.description")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Privacy Policy */}
        <div className="rounded-3xl border bg-white p-10 shadow-lg">
          <div className="mb-5 text-5xl">🔒</div>

          <h2 className="mb-4 text-3xl font-bold text-[#06245c]">
            {translate("cards.privacy.title")}
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            {translate("cards.privacy.description")}
          </p>

          <Link
            href="/legal/privacy-policy"
            className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            {translate("cards.privacy.button")}
          </Link>
        </div>

        {/* Terms of Use */}
        <div className="rounded-3xl border bg-white p-10 shadow-lg">
          <div className="mb-5 text-5xl">📜</div>

          <h2 className="mb-4 text-3xl font-bold text-[#06245c]">
            {translate("cards.terms.title")}
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            {translate("cards.terms.description")}
          </p>

          <Link
            href="/legal/terms-of-use"
            className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            {translate("cards.terms.button")}
          </Link>
        </div>

        {/* Platform Disclaimer */}
        <div className="rounded-3xl border bg-white p-10 shadow-lg">
          <div className="mb-5 text-5xl">⚖️</div>

          <h2 className="mb-4 text-3xl font-bold text-[#06245c]">
            {translate("cards.disclaimer.title")}
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            {translate("cards.disclaimer.description")}
          </p>

          <Link
            href="/legal/disclaimer"
            className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            {translate("cards.disclaimer.button")}
          </Link>
        </div>
      </div>

      <div className="rounded-3xl bg-[#06245c] p-12 text-center text-white">
        <h2 className="mb-6 text-4xl font-bold">
          {translate("support.title")}
        </h2>

        <p className="mb-8 text-xl text-gray-200">
          {translate("support.description")}
        </p>

        <div className="space-y-3 text-2xl font-semibold">
          <p>📧 support@epew.us</p>
          <p>📞 (866) 720-0014</p>
        </div>
      </div>
    </div>
  );
}