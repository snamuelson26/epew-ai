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
      title: "🚀 Available Entrepreneurs",
      href: "/supporters/entrepreneurs",
    },
    {
      title: "💰 Contribution Plans",
      href: "/supporters/contribution-plans",
    },
    {
      title: "📈 Impact Center",
      href: "/supporters/impact-center",
    },
    {
      title: "📊 Reports",
      href: "/supporters/reports",
    },
    {
      title: "💬 Messages",
      href: "/supporters/messages",
    },
    {
      title: "💳 Payment Center",
      href: "/supporters/payment-center",
    },
    {
      title: "🔔 Notifications",
      href: "/supporters/notifications",
    },
    {
      title: "🗓️ Quarterly Reports",
      href: "/supporters/quarterly-reports",
    },
    {
      title: "🌟 Success Stories",
      href: "/supporters/success-stories",
    },
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

        {/* PROFILE SECTION */}
        <div className="flex flex-col items-center mb-12">

          {supporter?.photo_url ? (
            <img
              src={supporter.photo_url}
              alt={supporter.full_name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-bold">
              SN
            </div>
          )}

          <h2 className="mt-4 text-2xl font-bold text-center">
            {supporter?.full_name || "Supporter"}
          </h2>

          <p className="text-sm text-gray-300 text-center mt-2">
            {supporter?.email}
          </p>

          <div className="mt-4 bg-green-600 px-5 py-3 rounded-2xl shadow-lg">
            <p className="text-sm font-bold">
              {supporter?.supporter_id}
            </p>
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

        {/* LOGOUT */}
        <div className="pt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl text-xl font-bold transition"
          >
            🚪 Logout
          </button>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>

    </div>
  );
}