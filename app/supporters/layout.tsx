"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SupporterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [supporter, setSupporter] = useState<any>(null);
  const [hasSupportedEntrepreneur, setHasSupportedEntrepreneur] =
    useState(false);

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
    // Allow public pages without authentication
    if (publicPages.includes(pathname)) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/supporters/login");
      return;
    }

    const { data, error } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      router.push("/supporters/login");
      return;
    }

    setSupporter(data);

    try {
      const response = await fetch(
        "/api/supporters/annual-support/dashboard",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.ok) {
        const result = await response.json();

        setHasSupportedEntrepreneur(
          Array.isArray(result?.allocations) &&
            result.allocations.length > 0
        );
      } else {
        setHasSupportedEntrepreneur(false);
      }
    } catch (error) {
      console.error(
        "Unable to determine supporter allocation status:",
        error
      );

      setHasSupportedEntrepreneur(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/supporters/login");
  }

  // PUBLIC PAGES
  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  const menu = [
    {
      title: "🏠 Dashboard",
      href: "/supporters/dashboard",
    },
    {
      title: "💬 Communication",
      href: "/supporters/messages",
    },

    ...(hasSupportedEntrepreneur
      ? [
          {
            title: "💳 Financial Center",
            href: "/supporters/payment-center",
          },
          {
            title: "🔔 Notifications",
            href: "/supporters/notifications",
          },
          {
            title: "🌟 Success Stories",
            href: "/supporters/success-stories",
          },
        ]
      : []),

    {
      title: "⚙️ Settings",
      href: "/supporters/settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">

      {/* SIDEBAR */}
      <div className="w-80 bg-[#06245c] text-white flex flex-col p-8">

        {/* TITLE */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold">
            EPEW Supporter
          </h1>
        </div>

        {/* EPEW-EDE-IBOS LOGO */}
        <div className="mb-10 flex justify-center">
          <div className="flex w-full items-center justify-center rounded-3xl bg-white p-5 shadow-xl">
            <img
              src="/images/epew-ede-ibos-logo.png"
              alt="EPEW-EDE-IBOS"
              className="max-h-40 w-auto object-contain"
            />
          </div>
        </div>

        {/* MENU */}
        <div className="space-y-3 flex-1 overflow-y-auto">

          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-4 rounded-2xl text-lg font-bold transition ${
                pathname === item.href
                  ? "bg-green-600"
                  : "hover:bg-blue-800"
              }`}
            >
              {item.title}
            </Link>
          ))}

        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>

    </div>
  );
}