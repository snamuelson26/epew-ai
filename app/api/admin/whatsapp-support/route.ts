import { NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supportAdministrator } from "@/lib/whatsapp/support-admin";
import { whatsappSender } from "@/lib/whatsapp/config";
import { withinSupportWindow } from "@/lib/whatsapp/support-inbox";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers });

export async function GET() {
  if (!await supportAdministrator()) return response({ error: "administrator_required" }, 403);
  const [inbox, replies] = await Promise.all([
    supabaseAdmin.from("epew_whatsapp_support_messages").select("message_sid,phone,body,media_count,received_at").order("received_at", { ascending: false }).limit(100),
    supabaseAdmin.from("epew_whatsapp_support_replies").select("request_key,inbound_sid,body,status,provider_sid,created_at").order("created_at", { ascending: false }).limit(300),
  ]);
  if (inbox.error || replies.error) return response({ error: "inbox_unavailable" }, 503);
  return response({ messages: inbox.data, replies: replies.data });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return response({ error: "invalid_origin" }, 403);
  const actor = await supportAdministrator();
  if (!actor) return response({ error: "administrator_required" }, 403);
  let input;
  try { input = await request.json(); } catch { return response({ error: "invalid_request" }, 400); }
  const { inbound_sid, request_key } = input;
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!/^(SM|MM)[0-9a-f]{32}$/i.test(inbound_sid || "") || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request_key || "") || !body || body.length > 3000) return response({ error: "invalid_request" }, 400);
  const { data: message, error } = await supabaseAdmin.from("epew_whatsapp_support_messages").select("phone,received_at").eq("message_sid", inbound_sid).maybeSingle();
  if (error) return response({ error: "inbox_unavailable" }, 503);
  if (!message) return response({ error: "message_unavailable" }, 404);
  const previous = await supabaseAdmin.from("epew_whatsapp_support_replies").select("inbound_sid,body,status,provider_sid").eq("request_key", request_key).maybeSingle();
  if (previous.error) return response({ error: "inbox_unavailable" }, 503);
  if (previous.data) {
    if (previous.data.inbound_sid !== inbound_sid || previous.data.body !== body) return response({ error: "request_key_conflict" }, 409);
    return response({ ...previous.data, duplicate: true });
  }
  // Use the most recent inbound support message; never trust a client-supplied phone or timestamp.
  const latest = await supabaseAdmin.from("epew_whatsapp_support_messages").select("received_at").eq("phone", message.phone).order("received_at", { ascending: false }).limit(1).maybeSingle();
  if (latest.error) return response({ error: "inbox_unavailable" }, 503);
  if (!latest.data || !withinSupportWindow(latest.data.received_at)) return response({ error: "conversation_window_closed" }, 409);
  const optout = await supabaseAdmin.from("epew_appointment_message_optouts").select("phone").eq("phone", message.phone).eq("channel", "whatsapp").maybeSingle();
  if (optout.error) return response({ error: "permission_check_unavailable" }, 503);
  if (optout.data) return response({ error: "recipient_opted_out" }, 409);
  const sender = whatsappSender();
  if (!sender || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return response({ error: "sender_unavailable" }, 503);
  const base = new URL(process.env.EPEW_PUBLIC_BASE_URL || "https://www.epew.us");
  if (base.protocol !== "https:" || !["www.epew.us", "epew.us"].includes(base.hostname)) return response({ error: "sender_unavailable" }, 503);
  // A persisted unique reservation prevents duplicate sends, including after ambiguous timeouts.
  const reservation = await supabaseAdmin.from("epew_whatsapp_support_replies").insert({ request_key, inbound_sid, actor_user_id: actor.id, body, status: "unknown" });
  if (reservation.error) return response({ error: reservation.error.code === "23505" ? "already_processing" : "inbox_unavailable" }, reservation.error.code === "23505" ? 409 : 503);
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, { timeout: 10000, autoRetry: false });
    const callback = new URL("/api/twilio/whatsapp/support-status", base);
    callback.searchParams.set("request_key", request_key);
    const sent = await client.messages.create({ from: `whatsapp:${sender}`, to: `whatsapp:${message.phone}`, body: `EPEW Support: ${body}`, statusCallback: callback.toString() });
    const persisted = await supabaseAdmin.from("epew_whatsapp_support_replies").update({ provider_sid: sent.sid, status: sent.status }).eq("request_key", request_key).eq("status", "unknown");
    if (persisted.error) return response({ error: "send_result_unconfirmed_do_not_retry" }, 503);
    return response({ status: sent.status, provider_sid: sent.sid });
  } catch {
    // Provider may have accepted the request. Never retry an ambiguous send automatically.
    return response({ error: "send_result_unknown_check_provider_logs" }, 503);
  }
}
