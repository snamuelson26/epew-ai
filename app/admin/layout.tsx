import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminShell from "./AdminShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // No valid Supabase session
  if (userError || !user || !user.email) {
    redirect("/admin/login");
  }

  // Confirm the authenticated email has the administrator role
  const { data: adminRole, error: roleError } = await supabase
    .from("user_roles")
    .select("role, email")
    .eq("email", user.email)
    .eq("role", "admin")
    .maybeSingle();

  // Authenticated, but not authorized as an administrator
  if (roleError || !adminRole) {
    redirect("/admin/login?error=unauthorized");
  }

  return <AdminShell>{children}</AdminShell>;
}