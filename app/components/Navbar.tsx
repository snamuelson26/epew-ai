"use client";

import Image from "next/image";
import Link from "next/link";

import {
  LanguageSelector,
  useLanguage,
} from "@/app/components/enterprise/language";

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-[#06245c] shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <Link href="/" aria-label="EPEW Home">
          <Image
            src="/images/epew-logo.png"
            alt="EPEW Logo"
            width={220}
            height={90}
            style={{
              width: "auto",
              height: "auto",
            }}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-white text-xl font-semibold">
          <Link href="/" className="hover:text-green-400 transition">
            {t("navigation.home")}
          </Link>

          <div className="relative group">
            <div className="flex items-center gap-1 cursor-default select-none hover:text-green-400 transition">
              <span>{t("navigation.about")}</span>
              <span className="text-sm">▼</span>
            </div>

            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-80 py-3 z-50">
              <Link
                href="/about"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.aboutEPEW")}
              </Link>

              <Link
                href="/professional-support"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.professionalSupportCenter")}
              </Link>

              <Link
                href="/how-it-works"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.howEPEWWorks")}
              </Link>
            </div>
          </div>

          <Link
            href="/how-it-works"
            className="hover:text-green-400 transition"
          >
            {t("navigation.how")}
          </Link>

          <div className="relative group">
            <div className="flex items-center gap-1 cursor-default select-none hover:text-green-400 transition">
              <span>{t("navigation.epewTeam")}</span>
              <span className="text-sm">▼</span>
            </div>

            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-64 py-3 z-50">
              <Link
                href="/entrepreneurs"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.entrepreneurs")}
              </Link>

              <Link
                href="/supporters"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.supporters")}
              </Link>

              <Link
                href="/coaches"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.coaches")}
              </Link>

              <Link
                href="/partners"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.partners")}
              </Link>
            </div>
          </div>

          <Link
            href="/videos"
            className="hover:text-green-400 transition"
          >
            {t("navigation.videos")}
          </Link>

          <Link
            href="/blogs"
            className="hover:text-green-400 transition"
          >
            {t("navigation.blogs")}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <div className="rounded-xl bg-white px-2 py-1">
            <LanguageSelector
              compact
              showLabel
              showNativeName
              showEnglishName={false}
              className="text-[#06245c]"
            />
          </div>

          <div className="relative group">
            <div className="bg-white text-[#06245c] px-7 py-3 rounded-xl text-xl font-bold hover:bg-green-500 hover:text-white transition cursor-default select-none">
              {t("navigation.login")}
            </div>

            <div className="absolute right-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-72 py-3 z-50">
              <Link
                href="/entrepreneurs/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.entrepreneurLogin")}
              </Link>

              <Link
                href="/supporters/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.supporterLogin")}
              </Link>

              <Link
                href="/coaches/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.coachLogin")}
              </Link>

              <Link
                href="/partners/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.partnerLogin")}
              </Link>

              <Link
                href="/admin/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                {t("navigation.adminLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}