import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateHelpInput } from "@/lib/applicant-help/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
async function identity(request: Request) {
  const authorization = request.headers.get("authorization");
  const client = authorization ? supabaseAdmin : await createClient();
  if (authorization && !authorization.startsWith("Bearer ")) return null;
  const { data, error } = await client.auth.getUser(authorization ? authorization.slice(7) : undefined);
  return !error && data.user?.email_confirmed_at ? data.user : null;
}
async function operation(request: Request, action: string, input: Record<string, unknown> = {}) {
  try {
    const user = await identity(request);
    if (!user) return NextResponse.json({ error: "verified_login_required" }, { status: 401, headers });
    const { data, error } = await supabaseAdmin.rpc("epew_applicant_help_operation", {
      p_actor: user.id, p_action: action, p_input: { ...input, _verified_email: user.email },
    });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "P0001" ? 429 : ["22023", "22P02", "23514", "23502"].includes(error.code) ? 400 : 503;
      return NextResponse.json({ error: status === 403 ? "access_denied" : status === 429 ? "too_many_requests" : "unable_to_save" }, { status, headers });
    }
    if (!data || (action !== "list" && action !== "staff_list" && data.saved !== true)) {
      return NextResponse.json({ error: "unable_to_save" }, { status: 503, headers });
    }
    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers });
  }
}
export async function GET(request: Request) {
  return operation(request, new URL(request.url).searchParams.get("scope") === "staff" ? "staff_list" : "list");
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers });
  }
  let input;
  try { input = validateHelpInput(await request.json()); } catch { input = null; }
  if (!input) return NextResponse.json({ error: "invalid_request" }, { status: 400, headers });
  return operation(request, input.action, input.values);
}
