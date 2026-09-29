import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  whatsappNumber,
  whatsappReadiness,
  whatsappSender,
} from "@/lib/whatsapp/config";
async function ownedApplication(request: Request) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;
  const id = new URL(request.url).searchParams.get("applicationId");
  let query = supabaseAdmin
    .from("entrepreneur_applications")
    .select("id,business_name,questionnaire_status,interview_status")
    .eq("user_id", user.id);
  if (id) {
    if (!/^\d+$/.test(id)) return null;
    query = query.eq("id", Number(id));
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function GET(request: Request) {
  try {
    const app = await ownedApplication(request);
    if (!app)
      return NextResponse.json(
        { error: "Sign in to your entrepreneur account." },
        { status: 401 },
      );
    const { data, error } = await supabaseAdmin
      .from("epew_whatsapp_interviews")
      .select("phone,verified_at")
      .eq("application_id", app.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({
      application: app,
      connection: data,
      readiness: whatsappReadiness(),
      sender: whatsappSender(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load WhatsApp settings." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const app = await ownedApplication(request);
    if (!app)
      return NextResponse.json(
        { error: "Sign in to your entrepreneur account." },
        { status: 401 },
      );
    if (app.questionnaire_status !== "completed")
      return NextResponse.json(
        { error: "Complete your questionnaire before starting the interview." },
        { status: 409 },
      );
    const ready = whatsappReadiness();
    const sender = whatsappSender();
    if (!ready.messaging || !sender)
      return NextResponse.json(
        { error: "EPEW WhatsApp interviews are awaiting activation." },
        { status: 503 },
      );
    const body = await request.json();
    const phone = whatsappNumber(String(body.phone ?? ""));
    if (!phone || body.consent !== true)
      return NextResponse.json(
        {
          error:
            "Enter your international WhatsApp number and confirm that you want to use it for the interview.",
        },
        { status: 400 },
      );
    const token = randomBytes(18).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const { data: existing } = await supabaseAdmin
      .from("epew_whatsapp_interviews")
      .select("locked_until")
      .eq("application_id", app.id)
      .maybeSingle();
    if (existing?.locked_until && new Date(existing.locked_until) > new Date())
      return NextResponse.json(
        { error: "Please wait for the current answer to finish processing." },
        { status: 409 },
      );
    const { error } = await supabaseAdmin
      .from("epew_whatsapp_interviews")
      .upsert(
        {
          application_id: app.id,
          phone,
          token_hash: hash,
          token_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          verified_at: null,
          choosing_language: true,
        },
        { onConflict: "application_id" },
      );
    if (error)
      return NextResponse.json(
        {
          error:
            "This WhatsApp number could not be linked. Check whether it is connected to another application.",
        },
        { status: 409 },
      );
    return NextResponse.json({
      url: `https://wa.me/${sender.slice(1)}?text=${encodeURIComponent(`EPEW ${token}`)}`,
      expiresInMinutes: 30,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect WhatsApp." },
      { status: 500 },
    );
  }
}
