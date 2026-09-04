"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LanguageSelector, useEpewLanguage } from "@/app/components/EpewLanguage";

const text = {
  en: { title: "EPEW Supporter", dashboard: "Dashboard", communication: "Communication", financial: "Financial Center", notifications: "Notifications", stories: "Success Stories", settings: "Settings" },
  ht: { title: "Sipòtè EPEW", dashboard: "Tablo Bò", communication: "Kominikasyon", financial: "Sant Finansye", notifications: "Notifikasyon", stories: "Istwa Siksè", settings: "Paramèt" },
  fr: { title: "Soutien EPEW", dashboard: "Tableau de Bord", communication: "Communication", financial: "Centre Financier", notifications: "Notifications", stories: "Histoires de Réussite", settings: "Paramètres" },
  es: { title: "Colaborador EPEW", dashboard: "Panel", communication: "Comunicación", financial: "Centro Financiero", notifications: "Notificaciones", stories: "Historias de Éxito", settings: "Configuración" },
};

export default function SupporterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useEpewLanguage();
  const t = text[language];

  const [supporter, setSupporter] = useState<any>(null);
  const [hasSupportedEntrepreneur, setHasSupportedEntrepreneur] = useState(false);

  const publicPages = [
    "/supporters",
    "/supporters/login",
    "/supporters/register",
    "/supporters/forgot-password",
    "/supporters/reset-password",
  ];

  useEffect(() => {
    loadSupporter();
  }, [pathname]);

  async function loadSupporter() {
    if (publicPages.includes(pathname)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/supporters/login");
      return;
    }

    const { data, error } = await supabase.from("supporters").select("*").eq("user_id", user.id).single();
    if (error || !data) {
      router.push("/supporters/login");
      return;
    }
    setSupporter(data);

    try {
      const response = await fetch("/api/supporters/annual-support/dashboard", { method: "GET", cache: "no-store" });
      if (response.ok) {
        const result = await response.json();
        setHasSupportedEntrepreneur(Array.isArray(result?.allocations) && result.allocations.length > 0);
      } else {
        setHasSupportedEntrepreneur(false);
      }
    } catch (error) {
      console.error("Unable to determine supporter allocation status:", error);
      setHasSupportedEntrepreneur(false);
    }
  }

  if (publicPages.includes(pathname)) return <>{children}</>;

  const menu = [
    { title: `🏠 ${t.dashboard}`, href: "/supporters/dashboard" },
    { title: `💬 ${t.communication}`, href: "/supporters/messages" },
    ...(hasSupportedEntrepreneur ? [
      { title: `💳 ${t.financial}`, href: "/supporters/payment-center" },
      { title: `🔔 ${t.notifications}`, href: "/supporters/notifications" },
      { title: `🌟 ${t.stories}`, href: "/supporters/success-stories" },
    ] : []),
    { title: `⚙️ ${t.settings}`, href: "/supporters/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] md:flex">
      <aside className="w-full bg-[#06245c] px-4 py-5 text-white md:flex md:min-h-screen md:w-80 md:shrink-0 md:flex-col md:p-8">
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="min-w-0 md:mb-6 md:text-center">
            <h1 className="text-2xl font-extrabold sm:text-3xl md:text-4xl">{t.title}</h1>
          </div>

          <div className="w-44 shrink-0 md:mb-6 md:w-auto">
            <LanguageSelector />
          </div>
        </div>

        <div className="mt-4 flex justify-center md:mb-10 md:mt-0">
          <div className="flex w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-lg sm:w-32 md:w-full md:rounded-3xl md:p-5 md:shadow-xl">
            <img src="/images/epew-ede-ibos-logo.png" alt="EPEW-EDE-IBOS" className="max-h-20 w-auto object-contain md:max-h-40" />
          </div>
        </div>

        <nav className="mt-4 grid grid-cols-2 gap-2 md:mt-0 md:flex-1 md:grid-cols-1 md:space-y-3 md:overflow-y-auto">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-3 text-center text-sm font-bold transition sm:text-base md:rounded-2xl md:px-5 md:py-4 md:text-left md:text-lg ${pathname === item.href ? "bg-green-600" : "bg-white/10 hover:bg-blue-800 md:bg-transparent"}`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="w-full min-w-0 px-3 py-4 sm:px-5 sm:py-6 md:flex-1 md:p-8">
        {children}
      </main>
    </div>
  );
}
