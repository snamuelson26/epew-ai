"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import {
  LanguageSelector,
  useLanguage,
} from "@/app/components/enterprise/language";

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const loginMenuRef = useRef<HTMLDivElement>(null);

  function closeAllMenus() {
    setMobileMenuOpen(false);
    setLoginOpen(false);
  }

  // Close menus after navigation completes.
  useEffect(() => {
    closeAllMenus();
  }, [pathname]);

  // Desktop only: close the Login dropdown after clicking outside it.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        loginMenuRef.current &&
        !loginMenuRef.current.contains(event.target as Node)
      ) {
        setLoginOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <>
    <header className="sticky top-0 z-50 bg-[#06245c] shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            aria-label="EPEW Home"
            className="relative z-[60] shrink-0"
          >
            <Image
              src="/images/epew-logo.png"
              alt="EPEW Logo"
              width={220}
              height={90}
              className="h-auto w-[150px] sm:w-[180px] xl:w-[220px]"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 text-base font-semibold text-white xl:flex xl:gap-8 xl:text-lg">
            <Link
              href="/"
              className="transition hover:text-green-400"
            >
              {t("navigation.home")}
            </Link>

            {/* About */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 transition hover:text-green-400"
                aria-haspopup="menu"
              >
                <span>{t("navigation.about")}</span>
                <span className="text-xs">▼</span>
              </button>

              <div className="invisible absolute left-0 top-full z-50 w-80 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl">
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
            </div>

            <Link
              href="/how-it-works"
              className="transition hover:text-green-400"
            >
              {t("navigation.how")}
            </Link>

            {/* EPEW Team */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 transition hover:text-green-400"
                aria-haspopup="menu"
              >
                <span>{t("navigation.epewTeam")}</span>
                <span className="text-xs">▼</span>
              </button>

              <div className="invisible absolute left-0 top-full z-50 w-64 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl">
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
            </div>

            <Link
              href="/videos"
              className="transition hover:text-green-400"
            >
              {t("navigation.videos")}
            </Link>

            <Link
              href="/blogs"
              className="transition hover:text-green-400"
            >
              {t("navigation.blogs")}
            </Link>
          </nav>

          {/* Desktop Controls */}
          <div className="hidden items-center gap-3 xl:flex">
            <div className="rounded-xl bg-white px-2 py-1">
              <LanguageSelector
                compact
                showLabel
                showNativeName
                showEnglishName={false}
                className="text-[#06245c]"
              />
            </div>

            {/* Desktop Login */}
            <div ref={loginMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setLoginOpen((current) => !current)}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-bold text-[#06245c] transition hover:bg-green-500 hover:text-white xl:px-7 xl:text-lg"
                aria-expanded={loginOpen}
                aria-haspopup="menu"
              >
                {t("navigation.login")}

                <span
                  className={`text-xs transition-transform ${
                    loginOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {loginOpen && (
                <div className="absolute right-0 top-full z-[100] w-72 pt-3">
                  <div className="overflow-hidden rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl ring-1 ring-black/10">
                    <Link
                      href="/entrepreneurs/login"
                      className="block px-6 py-4 font-semibold hover:bg-green-100"
                    >
                      {t("navigation.entrepreneurLogin")}
                    </Link>

                    <Link
                      href="/supporters/login"
                      className="block px-6 py-4 font-semibold hover:bg-green-100"
                    >
                      {t("navigation.supporterLogin")}
                    </Link>

                    <Link
                      href="/coaches/login"
                      className="block px-6 py-4 font-semibold hover:bg-green-100"
                    >
                      {t("navigation.coachLogin")}
                    </Link>

                    <Link
                      href="/partners/login"
                      className="block px-6 py-4 font-semibold hover:bg-green-100"
                    >
                      {t("navigation.partnerLogin")}
                    </Link>

                    <Link
                      href="/admin/login"
                      className="block border-t border-gray-200 px-6 py-4 font-semibold hover:bg-green-100"
                    >
                      {t("navigation.adminLogin")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => {
  setMobileMenuOpen((current) => !current);
}}
            className="relative z-[60] flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/40 text-3xl text-white transition active:bg-white/20 xl:hidden"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile and Tablet Navigation */}
        {mobileMenuOpen && (
          <div className="relative z-[100] mt-4 max-h-[calc(100dvh-110px)] touch-manipulation overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl pointer-events-auto xl:hidden">
            <div className="mb-4 rounded-xl border border-gray-200 p-2">
              <LanguageSelector
                compact
                showLabel
                showNativeName
                showEnglishName={false}
                className="w-full text-[#06245c]"
              />
            </div>

            <nav className="relative z-[110] space-y-5 text-[#06245c] pointer-events-auto">
              <Link
                href="/"
                className="relative z-[120] block cursor-pointer touch-manipulation rounded-xl px-4 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
              >
                {t("navigation.home")}
              </Link>

              {/* About */}
              <section className="relative z-[120] rounded-2xl border border-gray-200 p-3 pointer-events-auto">
                <h2 className="mb-2 px-3 text-lg font-extrabold text-[#06245c]">
                  {t("navigation.about")}
                </h2>

                <div className="space-y-1">
                  <a
  href="/about"
  style={{
    display: "block",
    padding: "16px",
    background: "#dcfce7",
    color: "#06245c",
    fontWeight: "bold",
    borderRadius: "12px",
  }}
>
 About EPEW
</a>
                  <Link
                    href="/professional-support"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.professionalSupportCenter")}
                  </Link>

                  <Link
                    href="/how-it-works"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.howEPEWWorks")}
                  </Link>
                </div>
              </section>

              <Link
                href="/how-it-works"
                className="relative z-[120] block cursor-pointer touch-manipulation rounded-xl px-4 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
              >
                {t("navigation.how")}
              </Link>

              {/* EPEW Team */}
              <section className="relative z-[120] rounded-2xl border border-gray-200 p-3 pointer-events-auto">
                <h2 className="mb-2 px-3 text-lg font-extrabold text-[#06245c]">
                  {t("navigation.epewTeam")}
                </h2>

                <div className="space-y-1">
                  <Link
                    href="/entrepreneurs"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.entrepreneurs")}
                  </Link>

                  <Link
                    href="/supporters"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.supporters")}
                  </Link>

                  <Link
                    href="/coaches"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.coaches")}
                  </Link>

                  <Link
                    href="/partners"
                    className="relative z-[130] block cursor-pointer touch-manipulation rounded-xl px-4 py-3 font-semibold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.partners")}
                  </Link>
                </div>
              </section>

              <Link
                href="/videos"
                className="relative z-[120] block cursor-pointer touch-manipulation rounded-xl px-4 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
              >
                {t("navigation.videos")}
              </Link>

              <Link
                href="/blogs"
                className="relative z-[120] block cursor-pointer touch-manipulation rounded-xl px-4 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
              >
                {t("navigation.blogs")}
              </Link>

              {/* Login */}
              <section className="relative z-[120] overflow-hidden rounded-2xl border-2 border-[#06245c] pointer-events-auto">
                <h2 className="bg-[#06245c] px-5 py-4 text-lg font-extrabold text-white">
                  {t("navigation.login")}
                </h2>

                <div className="divide-y divide-gray-200">
                  <Link
                    href="/entrepreneurs/login"
                    className="relative z-[130] block cursor-pointer touch-manipulation px-5 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.entrepreneurLogin")}
                  </Link>

                  <Link
                    href="/supporters/login"
                    className="relative z-[130] block cursor-pointer touch-manipulation px-5 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.supporterLogin")}
                  </Link>

                  <Link
                    href="/coaches/login"
                    className="relative z-[130] block cursor-pointer touch-manipulation px-5 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.coachLogin")}
                  </Link>

                  <Link
                    href="/partners/login"
                    className="relative z-[130] block cursor-pointer touch-manipulation px-5 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.partnerLogin")}
                  </Link>

                  <Link
                    href="/admin/login"
                    className="relative z-[130] block cursor-pointer touch-manipulation px-5 py-4 text-lg font-bold pointer-events-auto active:bg-green-100"
                  >
                    {t("navigation.adminLogin")}
                  </Link>
                </div>
              </section>
            </nav>
          </div>
        )}
      </div>
   </header>
</>
);

}