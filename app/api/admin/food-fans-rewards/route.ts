import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { restaurantAdministrator } from "@/lib/restaurant-operations/authorize";
import { validateRewardsInput } from "@/lib/restaurant-operations/rewards-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers });
export async function GET(request: Request) {
  try {
    if (!await restaurantAdministrator()) return reply({ error: "Authorized manager sign-in required." }, 403);
    const member = new URL(request.url).searchParams.get("member_id");
    if (member && !/^FFRM-[a-f0-9]{32}$/i.test(member)) return reply({ error: "Invalid member ID." }, 400);
    const [members, rules, geography, profile, balance, ledger, grants] = await Promise.all([
      supabaseAdmin.from("epew_ffr_members").select("member_id,full_name,zip_code,membership_status,membership_date").eq("restaurant_unit_id", "FFR-001").order("membership_date", { ascending: false }).limit(100),
      supabaseAdmin.from("epew_ffr_program_rules").select("*").eq("restaurant_unit_id", "FFR-001").order("version", { ascending: false }).limit(1),
      supabaseAdmin.from("epew_ffr_member_geography").select("*").eq("restaurant_unit_id", "FFR-001"),
      member ? supabaseAdmin.from("epew_ffr_members").select("*").eq("restaurant_unit_id", "FFR-001").eq("member_id", member).maybeSingle() : Promise.resolve({ data: null, error: null }),
      member ? supabaseAdmin.from("epew_ffr_reward_balances").select("*").eq("restaurant_unit_id", "FFR-001").eq("member_id", member).maybeSingle() : Promise.resolve({ data: null, error: null }),
      member ? supabaseAdmin.from("epew_ffr_reward_ledger").select("*").eq("restaurant_unit_id", "FFR-001").eq("member_id", member).order("created_at", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
      member ? supabaseAdmin.from("epew_ffr_reward_grants").select("*").eq("restaurant_unit_id", "FFR-001").eq("member_id", member).order("cycle_number", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    ]);
    if ([members, rules, geography, profile, balance, ledger, grants].some(r => r.error)) return reply({ error: "Rewards records could not be loaded." }, 503);
    if (member && !profile.data) return reply({ error: "Member not found for this store." }, 404);
    return reply({ members: members.data, rules: rules.data?.[0], geography: geography.data, profile: profile.data, balance: balance.data, ledger: ledger.data, grants: grants.data?.map(g=>({...g,is_expired:Date.parse(g.expires_at)<=Date.now()})) });
  } catch { return reply({ error: "Rewards service unavailable." }, 503); }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Invalid request origin." }, 403);
  try {
    const actor = await restaurantAdministrator();
    if (!actor) return reply({ error: "Authorized manager sign-in required." }, 403);
    const input = validateRewardsInput(await request.json());
    if (!input) return reply({ error: "Check the required fields, consent record, and receipt details." }, 400);
    const { data, error } = await supabaseAdmin.rpc("epew_ffr_rewards_operation", { p_actor: actor.id, p_actor_email: actor.email, p_unit: "FFR-001", p_action: input.action, p_input: input.values });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "40001" ? 409 : ["22023", "22P02", "23514", "23502", "23503", "23505"].includes(error.code) ? 400 : 503;
      return reply({ error: status === 409 ? "The member record changed. Reload before saving." : status === 400 ? "The request conflicts with the reward rules or an existing receipt. Check dates, quantities and references." : "Rewards operation could not be saved." }, status);
    }
    if (!data?.saved) return reply({ error: "Save was not confirmed." }, 503);
    return reply(data);
  } catch (e) { return reply({ error: e instanceof SyntaxError ? "Invalid request." : "Rewards operation could not be saved." }, e instanceof SyntaxError ? 400 : 503); }
}
