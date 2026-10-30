import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateWorkInput } from "@/lib/restaurant-operations/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ unit: string }> };
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
async function administrator() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  const user = data.user;
  if (error || !user?.email || !user.email_confirmed_at) return null;
  const { data: roles, error: roleError } = await supabaseAdmin.from("user_roles").select("user_id,email,role").eq("role", "administrator").ilike("email", user.email);
  return !roleError && roles?.some(r => r.user_id === user.id || (!r.user_id && r.email?.toLowerCase() === user.email!.toLowerCase())) ? user : null;
}
export async function GET(_request: Request, context: Context) {
  try {
    const user = await administrator();
    if (!user) return respond({ error: "Administrator sign-in required." }, 403);
    const { unit } = await context.params;
    if (!/^FFR-\d{3,}$/.test(unit)) return respond({ error: "Invalid restaurant unit." }, 400);
    const [master, campaigns, tasks, entries, audit, implementation] = await Promise.all([
      supabaseAdmin.from("epew_restaurant_units").select("*").eq("restaurant_unit_id", unit).maybeSingle(),
      supabaseAdmin.from("epew_restaurant_unit_campaigns").select("*").eq("restaurant_unit_id", unit),
      supabaseAdmin.from("epew_restaurant_work_items").select("*").eq("restaurant_unit_id", unit).order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("epew_restaurant_work_entries").select("*").eq("restaurant_unit_id", unit).order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("epew_restaurant_unit_audit").select("id,table_name,operation,old_record,new_record,actor_user_id,executor,reason,occurred_at").eq("restaurant_unit_id", unit).order("occurred_at", { ascending: false }).limit(200),
      supabaseAdmin.from("epew_operational_history").select("id,event_name,event_description,actor_name,executed_by,occurred_at,metadata").eq("reference_type", "restaurant_unit").eq("reference_id", unit).order("occurred_at", { ascending: false }).limit(200),
    ]);
    if ([master, campaigns, tasks, entries, audit, implementation].some(r => r.error)) return respond({ error: "Restaurant records could not be loaded." }, 503);
    if (!master.data) return respond({ error: "Restaurant unit not found." }, 404);
    return respond({ master: master.data, campaigns: campaigns.data, tasks: tasks.data, entries: entries.data, audit: audit.data, implementation: implementation.data, history_limit: 200 });
  } catch { return respond({ error: "Restaurant records are unavailable." }, 503); }
}
export async function POST(request: Request, context: Context) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return respond({ error: "Invalid request origin." }, 403);
  try {
    const user = await administrator();
    if (!user) return respond({ error: "Administrator sign-in required." }, 403);
    const { unit } = await context.params;
    if (!/^FFR-\d{3,}$/.test(unit)) return respond({ error: "Invalid restaurant unit." }, 400);
    const input = validateWorkInput(await request.json());
    if (!input) return respond({ error: "Check the required fields and reason." }, 400);
    const { data, error } = await supabaseAdmin.rpc("epew_restaurant_work_operation", {
      p_actor: user.id, p_actor_email: user.email, p_unit: unit, p_action: input.action, p_input: input.values,
    });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "40001" ? 409 : ["22023", "22P02", "23514", "23503"].includes(error.code) ? 400 : 503;
      return respond({ error: status === 409 ? "This task changed. Reload before saving again." : "The work entry could not be saved." }, status);
    }
    if (!data || data.saved !== true) return respond({ error: "The save was not confirmed." }, 503);
    return respond(data);
  } catch (error) { return respond({ error: error instanceof SyntaxError ? "Invalid request." : "The work entry could not be saved." }, error instanceof SyntaxError ? 400 : 503); }
}
