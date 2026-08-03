"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from "lucide-react";

import {
  LanguageSelector,
  useTranslation,
} from "@/app/components/enterprise/language";

import {
  T,
} from "@/app/components/enterprise/language/TranslatedText";

type OpenDropdown =
  | "about"
  | "team"
  | "login"
  | null;

export default function Navbar() {
  const { t } = useTranslation();

  const [openDropdown, setOpenDropdown] =
    useState<OpenDropdown>(null);

  const navbarRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpenDropdown(null);
      }
    }

    function handleEscapeKey(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscapeKey,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscapeKey,
      );
    };
  }, []);

  function toggleDropdown(
    dropdown: Exclude<
      OpenDropdown,
      null
    >,
  ) {
    setOpenDropdown((current) =>
      current === dropdown
        ? null
        : dropdown,
    );
  }

  function closeDropdowns() {
    setOpenDropdown(null);
  }

  return (
    <header
      ref={navbarRef}
      className="sticky top-0 z-50 bg-[#06245c] shadow-lg"
    >
      {/* Main top row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8 xl:py-5">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeDropdowns}
          className="shrink-0"
        >
          <Image
            src="/images/epew-logo.png"
            alt="EPEW Logo"
            width={220}
            height={90}
            className="h-auto w-[135px] sm:w-[165px] xl:w-[220px]"
            priority
          />
        </Link>

        {/* Desktop public navigation */}
        <nav className="hidden items-center gap-6 text-lg font-semibold text-white xl:flex 2xl:gap-8 2xl:text-xl">
          <Link
            href="/"
            className="transition hover:text-green-400"
          >
            <T id="navigation.home" fallback="Home" />
          </Link>

          {/* Desktop About */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 transition hover:text-green-400"
            >
              <span>
                <T id="navigation.about" fallback="About" />
              </span>

              <ChevronDown className="h-4 w-4" />
            </button>

            <div className="invisible absolute left-0 top-full z-[70] w-80 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl">
                <Link
                  href="/about"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.aboutEpew" fallback="About EPEW" />
                </Link>

                <Link
                  href="/professional-support"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T
                    id="navigation.professionalSupportCenter"
                    fallback="Professional Support Center"
                  />
                </Link>

                <Link
                  href="/how-it-works"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T
                    id="navigation.howEpewWorks"
                    fallback="How EPEW Works"
                  />
                </Link>

                <Link
                  href="/partners"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.partners" fallback="Partners" />
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/how-it-works"
            className="transition hover:text-green-400"
          >
            <T id="navigation.how" fallback="How" />
          </Link>

          {/* Desktop EPEW Team */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 transition hover:text-green-400"
            >
              <span>
                <T id="navigation.epewTeam" fallback="EPEW Team" />
              </span>

              <ChevronDown className="h-4 w-4" />
            </button>

            <div className="invisible absolute left-0 top-full z-[70] w-64 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl">
                <Link
                  href="/entrepreneurs"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.entrepreneurs" fallback="Entrepreneurs" />
                </Link>

                <Link
                  href="/supporters"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.supporters" fallback="Supporters" />
                </Link>

                <Link
                  href="/coaches"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.coaches" fallback="Coaches" />
                </Link>

                <Link
                  href="/partners"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.partners" fallback="Partners" />
                </Link>

                <Link
                  href="/vendors"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.vendors" fallback="Vendors" />
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/videos"
            className="transition hover:text-green-400"
          >
            <T id="navigation.videos" fallback="Videos" />
          </Link>

          <Link
            href="/blogs"
            className="transition hover:text-green-400"
          >
            <T id="navigation.blogs" fallback="Blogs" />
          </Link>
        </nav>

        {/* Shared language selector and login controls */}
        <div className="relative flex shrink-0 items-center gap-2">
          {/* Existing enterprise language engine */}
          <LanguageSelector
            showLabel={false}
            showNativeName={false}
            showEnglishName={false}
            compact
            className="text-[#06245c]"
          />

          {/* Desktop Login */}
          <div className="group relative hidden xl:block">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-lg font-bold text-[#06245c] transition hover:bg-green-500 hover:text-white 2xl:px-7 2xl:text-xl"
            >
              <span>
                <T id="navigation.login" fallback="Login" />
              </span>

              <ChevronDown className="h-5 w-5" />
            </button>

            <div className="invisible absolute right-0 top-full z-[70] w-72 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl bg-white py-3 text-[#06245c] shadow-2xl">
                <Link
                  href="/entrepreneurs/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T
                    id="navigation.entrepreneurLogin"
                    fallback="Entrepreneur Login"
                  />
                </Link>

                <Link
                  href="/supporters/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T
                    id="navigation.supporterLogin"
                    fallback="Supporter Login"
                  />
                </Link>

                <Link
                  href="/coaches/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.coachLogin" fallback="Coach Login" />
                </Link>

                <Link
                  href="/partners/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T
                    id="navigation.partnerLogin"
                    fallback="Partner Login"
                  />
                </Link>

                <Link
                  href="/vendors/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.vendorLogin" fallback="Vendor Login" />
                </Link>

                <Link
                  href="/admin/login"
                  className="block px-6 py-3 hover:bg-green-100"
                >
                  <T id="navigation.adminLogin" fallback="Admin Login" />
                </Link>
              </div>
            </div>
          </div>

          {/* Phone, landscape phone, and tablet hamburger */}
          <button
            type="button"
            aria-label={
              openDropdown === "login"
                ? t("navigation.closeLoginMenu", {
                    defaultValue: "Close login menu",
                  })
                : t("navigation.openLoginMenu", {
                    defaultValue: "Open login menu",
                  })
            }
            aria-expanded={
              openDropdown === "login"
            }
            aria-controls="mobile-login-menu"
            onClick={() =>
              toggleDropdown("login")
            }
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 bg-white text-[#06245c] shadow-md transition hover:bg-green-400 xl:hidden"
          >
            {openDropdown === "login" ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>

          {/* Hamburger contains portal logins only */}
          {openDropdown === "login" && (
            <div
              id="mobile-login-menu"
              className="absolute right-0 top-[calc(100%+12px)] z-[90] flex max-h-[calc(100dvh-5.5rem)] w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-[#06245c] shadow-2xl xl:hidden"
            >
              <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <T id="navigation.portalAccess" fallback="Portal Access" />
                </p>

                <p className="mt-1 text-base font-bold">
                  <T
                    id="navigation.selectYourLogin"
                    fallback="Select your login"
                  />
                </p>
              </div>

              <div className="min-h-0 overflow-y-auto overscroll-contain py-1">
                <Link
                  href="/entrepreneurs/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T
                    id="navigation.entrepreneurLogin"
                    fallback="Entrepreneur Login"
                  />
                </Link>

                <Link
                  href="/supporters/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T
                    id="navigation.supporterLogin"
                    fallback="Supporter Login"
                  />
                </Link>

                <Link
                  href="/coaches/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T id="navigation.coachLogin" fallback="Coach Login" />
                </Link>

                <Link
                  href="/partners/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T
                    id="navigation.partnerLogin"
                    fallback="Partner Login"
                  />
                </Link>

                <Link
                  href="/vendors/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T id="navigation.vendorLogin" fallback="Vendor Login" />
                </Link>

                <Link
                  href="/admin/login"
                  onClick={closeDropdowns}
                  className="block px-5 py-3 font-semibold hover:bg-green-100"
                >
                  <T id="navigation.adminLogin" fallback="Admin Login" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile, landscape, and tablet public navbar */}
      <div className="relative border-t border-white/20 xl:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2 text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            onClick={closeDropdowns}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <T id="navigation.home" fallback="Home" />
          </Link>

          <button
            type="button"
            aria-expanded={
              openDropdown === "about"
            }
            aria-controls="mobile-about-menu"
            onClick={() =>
              toggleDropdown("about")
            }
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <span>
              <T id="navigation.about" fallback="About" />
            </span>

            {openDropdown === "about" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/how-it-works"
            onClick={closeDropdowns}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <T id="navigation.how" fallback="How" />
          </Link>

          <button
            type="button"
            aria-expanded={
              openDropdown === "team"
            }
            aria-controls="mobile-team-menu"
            onClick={() =>
              toggleDropdown("team")
            }
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <span>
              <T id="navigation.epewTeam" fallback="EPEW Team" />
            </span>

            {openDropdown === "team" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/videos"
            onClick={closeDropdowns}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <T id="navigation.videos" fallback="Videos" />
          </Link>

          <Link
            href="/blogs"
            onClick={closeDropdowns}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          >
            <T id="navigation.blogs" fallback="Blogs" />
          </Link>
        </nav>

        {/* Mobile About dropdown */}
        {openDropdown === "about" && (
          <div
            id="mobile-about-menu"
            className="absolute left-3 top-full z-[80] mt-2 max-h-[calc(100dvh-8rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 text-[#06245c] shadow-2xl"
          >
            <Link
              href="/about"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.aboutEpew" fallback="About EPEW" />
            </Link>

            <Link
              href="/professional-support"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T
                id="navigation.professionalSupportCenter"
                fallback="Professional Support Center"
              />
            </Link>

            <Link
              href="/how-it-works"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T
                id="navigation.howEpewWorks"
                fallback="How EPEW Works"
              />
            </Link>

            <Link
              href="/partners"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.partners" fallback="Partners" />
            </Link>
          </div>
        )}

        {/* Mobile EPEW Team dropdown */}
        {openDropdown === "team" && (
          <div
            id="mobile-team-menu"
            className="absolute right-3 top-full z-[80] mt-2 max-h-[calc(100dvh-8rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 text-[#06245c] shadow-2xl"
          >
            <Link
              href="/entrepreneurs"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.entrepreneurs" fallback="Entrepreneurs" />
            </Link>

            <Link
              href="/supporters"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.supporters" fallback="Supporters" />
            </Link>

            <Link
              href="/coaches"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.coaches" fallback="Coaches" />
            </Link>

            <Link
              href="/partners"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.partners" fallback="Partners" />
            </Link>

            <Link
              href="/vendors"
              onClick={closeDropdowns}
              className="block px-5 py-3 font-semibold hover:bg-green-100"
            >
              <T id="navigation.vendors" fallback="Vendors" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}