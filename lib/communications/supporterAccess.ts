import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function communicationAccess() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  const staff = await supabaseAdmin.from("epew_supporter_staff").select("email,display_name,role,user_id").eq("email", user.email?.toLowerCase() || "").eq("active", true).maybeSingle();
  if (staff.error) throw staff.error;
  if (staff.data && (!staff.data.user_id || staff.data.user_id === user.id)) return { user, staff: staff.data, supporter: null };
  const profile = await supabaseAdmin.from("supporters").select("id,full_name").eq("user_id", user.id).maybeSingle();
  if (profile.error) throw profile.error;
  return profile.data ? { user, staff: null, supporter: profile.data } : null;
}
export async function accessibleThread(id: string, access: NonNullable<Awaited<ReturnType<typeof communicationAccess>>>) {
  let query = supabaseAdmin.from("epew_supporter_threads").select("*").eq("id", id);
  if (access.supporter) query = query.eq("supporter_id", access.supporter.id).eq("internal", false);
  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}
export async function communicationLog(userId: string, action: string, entityId: string) {
  const result = await supabaseAdmin.from("epew_supporter_activity").insert({ actor_user_id: userId, action, entity_id: entityId });
  if (result.error) throw result.error;
}
