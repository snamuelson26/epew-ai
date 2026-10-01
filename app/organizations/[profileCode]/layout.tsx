import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { organizationLoginPath } from "@/lib/emanon/portalRouting";

export default async function OrganizationLayout({ children, params }: {
  children: ReactNode; params: Promise<{ profileCode: string }>;
}) {
  const { profileCode } = await params;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(organizationLoginPath(profileCode));
  const { data: profile, error } = await client.from("organization_portal_profiles")
    .select("id").eq("auth_user_id", user.id).eq("profile_code", profileCode).eq("status", "active").maybeSingle();
  if (error || !profile) return <main className="p-8"><h1 className="text-2xl font-bold">Organization access unavailable</h1><p>Your account does not have active access to this organization.</p></main>;
  return children;
}
