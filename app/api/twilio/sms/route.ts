import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { normalizeSmsPhone, smsKeyword, SMS_STOP_REPLY, SMS_HELP_REPLY } from "@/lib/communications/smsConsentPolicy";

export async function POST(request: NextRequest) {
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid) return new NextResponse("Forbidden", { status: 403 });
  const phone = normalizeSmsPhone(params.From || "");
  if (!phone || String(params.From).startsWith("whatsapp:")) return new NextResponse("Invalid SMS sender", { status: 400 });
  const keyword = smsKeyword(params.Body || "");
  const response = new twilio.twiml.MessagingResponse();
  if (keyword === "stop" || String(params.OptOutType).toUpperCase() === "STOP") {
    const { error } = await supabaseAdmin.from("epew_appointment_message_optouts")
      .upsert({ phone, channel: "sms" }, { onConflict: "phone,channel" });
    if (error) return new NextResponse("Unavailable", { status: 503 });
    // Advanced Opt-Out may already have replied; never send a duplicate response.
    if (!params.OptOutType) response.message(SMS_STOP_REPLY);
  } else if (keyword === "help" && !params.OptOutType) {
    response.message(SMS_HELP_REPLY);
  }
  // START does not manufacture consent or clear application suppression.
  return new NextResponse(response.toString(), { headers: { "Content-Type": "text/xml" } });
}
