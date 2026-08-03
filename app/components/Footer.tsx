"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  useLanguageNamespaces,
  useTranslation,
} from "@/app/components/enterprise/language";

export default function Footer() {
  const { t } = useTranslation();

  const {
    loadNamespaces,
  } = useLanguageNamespaces();

  useEffect(() => {
    void loadNamespaces(["footer"]);
  }, [loadNamespaces]);

  return (
    <footer className="bg-[#04163d] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-14">
        {/* CONTACT */}
<div>
  <h3 className="text-3xl font-bold mb-8">
    {t("contactUs", { namespace: "footer" })}
  </h3>

  <div className="space-y-4 text-xl text-gray-300">
    <p>
      {t("organizationName", { namespace: "footer" })}
    </p>

    <p>
      {t("phone", { namespace: "footer" })}: (866) 720-0014
    </p>

    <p>
      {t("email", { namespace: "footer" })}: support@epew.us
    </p>

    <p>
      {t("country", { namespace: "footer" })}
    </p>
  </div>
</div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            Quick Links
          </h3>

          <div className="flex flex-col gap-5 text-xl">
            <Link
              href="/"
              className="text-gray-300 hover:text-green-400 transition"
            >
              {t("home", { namespace: "footer" })}
            </Link>

            <Link
              href="/about"
              className="text-gray-300 hover:text-green-400 transition"
            >
              About
            </Link>

            <Link
              href="/how-it-works"
              className="text-gray-300 hover:text-green-400 transition"
            >
              How It Works
            </Link>

            <Link
              href="/videos"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Videos
            </Link>

            <Link
              href="/blogs"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Blogs
            </Link>
          </div>
        </div>

        {/* EPEW TEAM */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            EPEW Team
          </h3>

          <div className="flex flex-col gap-5 text-xl">
            <Link
              href="/entrepreneurs"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Entrepreneurs
            </Link>

            <Link
              href="/supporters"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Supporters
            </Link>

            <Link
              href="/coaches"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Coaches
            </Link>

            <Link
              href="/partners"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Partners
            </Link>
          </div>
        </div>

        {/* LEGAL */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            Legal
          </h3>

          <div className="flex flex-col gap-5 text-xl">
            <Link
              href="/legal"
              className="text-gray-300 hover:text-green-400 transition"
            >
              {t("legalCenter", { namespace: "footer" })}
            </Link>

            <Link
              href="/legal/privacy-policy"
              className="text-gray-300 hover:text-green-400 transition"
            >
             {t("privacyPolicy", { namespace: "footer" })}
            </Link>

            <Link
              href="/legal/terms-of-use"
              className="text-gray-300 hover:text-green-400 transition"
            >
              {t("termsOfUse", { namespace: "footer" })}
            </Link>

            <Link
              href="/legal/disclaimer"
              className="text-gray-300 hover:text-green-400 transition"
            >
              {t("platformDisclaimer", { namespace: "footer" })}
            </Link>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-lg">
        <p>
          © 2026 Ekero Partners Empower Wealth (EPEW). All Rights Reserved.
        </p>

        <p className="mt-2">
          Entrepreneur Development Ecosystem (EDE)
        </p>

        <p>
          Powered by the Intelligent Business Operating System (IBOS).
        </p>
      </div>
    </footer>
  );
}