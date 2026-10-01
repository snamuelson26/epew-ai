import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMANON_DASHBOARD } from "@/lib/emanon/portalRouting";

export default async function StaffEntry() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/emanon/login");
  const { data: member } = await client.from("emanon_staff_members")
    .select("organization_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!member) redirect("/emanon/login");
  const { data: organization } = await client.from("emanon_organizations")
    .select("organization_code").eq("id", member.organization_id).maybeSingle();
  if (organization?.organization_code === "ORGDH-NETWORK") redirect("/orgdh/communication-center");
  if (organization?.organization_code !== "EMANON-INSTITUTE") redirect("/emanon/login");
  const { data: portal } = await client.from("organization_portal_profiles")
    .select("id").eq("auth_user_id", user.id).eq("profile_code", "EMANON-001").eq("status", "active").maybeSingle();
  redirect(portal ? EMANON_DASHBOARD : "/emanon/communication-center");
}
