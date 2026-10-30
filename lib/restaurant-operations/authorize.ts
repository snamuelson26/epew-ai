import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function restaurantAdministrator() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  const user = data.user;
  if (error || !user?.email || !user.email_confirmed_at) return null;
  const { data: roles, error: roleError } = await supabaseAdmin.from("user_roles").select("user_id,email,role").eq("role", "administrator").ilike("email", user.email);
  return !roleError && roles?.some(r => r.user_id === user.id || (!r.user_id && r.email?.toLowerCase() === user.email!.toLowerCase())) ? user : null;
}
