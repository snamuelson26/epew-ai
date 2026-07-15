"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CoachLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCoachAccess();
  }, [pathname]);

  async function checkCoachAccess() {
    if (pathname === "/coaches" || pathname === "/coaches/login") {
      setChecking(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/coaches/login");
      return;
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (!coach) {
      await supabase.auth.signOut();
      router.push("/coaches/login");
      return;
    }

    setChecking(false);
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Checking coach access...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}