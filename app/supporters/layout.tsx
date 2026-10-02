"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LanguageSelector, useEpewLanguage } from "@/app/components/EpewLanguage";
import SupporterNavigation from "./SupporterNavigation";
import SupporterWebsitePatch from "./SupporterWebsitePatch";
import SupporterImageTranslations from "./SupporterImageTranslations";

const text = {
  en: { title: "EPEW Supporter", dashboard: "Dashboard", supportedBusinesses: "My Supported Businesses", communication: "Communication", financial: "Financial Center", notifications: "Notifications", stories: "Success Stories", settings: "Settings", returnMain: "Return to Main Page" },
  ht: { title: "Sipòtè EPEW", dashboard: "Tablo Bò", supportedBusinesses: "Biznis Mwen Sipòte", communication: "Kominikasyon", financial: "Sant Finansye", notifications: "Notifikasyon", stories: "Istwa Siksè", settings: "Paramèt", returnMain: "Retounen nan Paj Prensipal" },
  fr: { title: "Soutien EPEW", dashboard: "Tableau de Bord", supportedBusinesses: "Mes Entreprises Soutenues", communication: "Communication", financial: "Centre Financier", notifications: "Notifications", stories: "Histoires de Réussite", settings: "Paramètres", returnMain: "Retour à la Page Principale" },
  es: { title: "Colaborador EPEW", dashboard: "Panel", supportedBusinesses: "Mis Negocios Apoyados", communication: "Comunicación", financial: "Centro Financiero", notifications: "Notificaciones", stories: "Historias de Éxito", settings: "Configuración", returnMain: "Volver a la Página Principal" },
};

export default function SupporterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useEpewLanguage();
  const t = text[language];

  const [supporter, setSupporter] = useState<any>(null);

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


  }

  if (publicPages.includes(pathname)) {
    return (
      <>
        <SupporterNavigation />
        {pathname === "/supporters" && <SupporterWebsitePatch />}
        {pathname === "/supporters" && <SupporterImageTranslations />}
        {children}
      </>
    );
  }

  const menu = [
    { title: `🏠 ${t.dashboard}`, href: "/supporters/dashboard" },
    { title: ({ en: "Independent Support", ht: "Sipò Endepandan", fr: "Soutien indépendant", es: "Apoyo independiente" })[language], href: "/supporters/independent-support" },
    { title: `🏢 ${t.supportedBusinesses}`, href: "/supporters/my-supported-businesses" },
    { title: `💬 ${t.communication}`, href: "/supporters/messages" },
    ...([
      { title: `💳 ${t.financial}`, href: "/supporters/payment-center" },
      { title: `🔔 ${t.notifications}`, href: "/supporters/notifications" },
      { title: `🌟 ${t.stories}`, href: "/supporters/success-stories" },
    ]),
    { title: `⚙️ ${t.settings}`, href: "/supporters/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] md:flex md:items-start">
      <aside className="w-full bg-[#06245c] p-4 text-white md:sticky md:top-0 md:flex md:h-dvh md:w-72 md:shrink-0 md:flex-col md:overflow-hidden md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 md:block md:shrink-0">
          <div className="min-w-0 md:mb-3">
            <h1 className="text-xl font-extrabold sm:text-2xl">{t.title}</h1>
          </div>

          <div className="w-40 max-w-full shrink-0 md:w-full">
            <LanguageSelector />
          </div>
        </div>

        <div className="mt-3 hidden justify-center md:mb-4 md:flex md:shrink-0">
          <div className="flex w-full items-center justify-center rounded-xl bg-white p-2">
            <img src="/images/epew-ede-ibos-logo.png" alt="EPEW-EDE-IBOS" className="h-16 w-auto object-contain" />
          </div>
        </div>

        <nav aria-label={t.title} className="mt-4 grid grid-cols-2 content-start gap-2 md:mt-0 md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:overscroll-contain md:pr-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
              className={`block shrink-0 rounded-xl px-3 py-3 text-left text-sm font-semibold leading-snug transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base ${(pathname === item.href || pathname.startsWith(`${item.href}/`)) ? "bg-green-600" : "bg-white/10 hover:bg-blue-800 md:bg-transparent"}`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <button type="button" className="mt-4 w-full shrink-0 rounded-xl bg-white px-4 py-3 font-bold text-[#06245c] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={async () => {
          const { error } = await supabase.auth.signOut();
          if (error) { window.alert("Unable to sign out. Please try again."); return; }
          window.location.assign("/supporters/login");
        }}>{({ en: "Sign out", fr: "Déconnexion", ht: "Dekonekte", es: "Cerrar sesión" })[language]}</button>
      </aside>

      <main className="w-full min-w-0 px-3 py-4 sm:px-5 sm:py-6 md:flex-1 md:p-8">
        {pathname !== "/supporters/dashboard" && (
          <div className="mb-4 flex justify-start">
            <Link
              href="/supporters/dashboard"
              className="inline-flex items-center rounded-xl bg-[#06245c] px-4 py-2.5 font-bold text-white shadow hover:bg-blue-900"
            >
              ← {t.returnMain}
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
