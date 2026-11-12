import { NextRequest, NextResponse } from "next/server";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(request: NextRequest) {
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid || params.AccountSid !== process.env.TWILIO_ACCOUNT_SID) return new NextResponse("Forbidden", { status: 403 });
  const key = new URL(request.url).searchParams.get("request_key");
  if (!/^[0-9a-f-]{36}$/i.test(key || "")) return new NextResponse("Invalid reference", { status: 400 });
  const states = ["accepted", "queued", "sending", "sent", "delivered", "read"];
  const status = params.MessageStatus;
  const allowed = states.includes(status) ? ["unknown", ...states.slice(0, states.indexOf(status) + 1)] : ["unknown", "accepted", "queued", "sending", "sent"];
  if (!/^(SM|MM)[0-9a-f]{32}$/i.test(params.MessageSid || "") || ![...states, "failed", "undelivered"].includes(status)) return new NextResponse("Invalid status", { status: 400 });
  // The signed callback can arrive before messages.create returns its SID.
  const { error } = await supabaseAdmin.from("epew_whatsapp_support_replies").update({ status, provider_sid: params.MessageSid }).eq("request_key", key).or(`provider_sid.is.null,provider_sid.eq.${params.MessageSid}`).in("status", allowed);
  return new NextResponse(error ? "Unavailable" : "", { status: error ? 503 : 200 });
}
