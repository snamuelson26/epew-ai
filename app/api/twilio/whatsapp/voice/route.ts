import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  whatsappNumber,
  whatsappReadiness,
  whatsappSender,
} from "@/lib/whatsapp/config";
export async function POST(request: NextRequest) {
  const response = new twilio.twiml.VoiceResponse();
  const { valid, params } = await validateTwilioWebhook(request);
  if (!valid) return new NextResponse("Forbidden", { status: 403 });
  const phone = whatsappNumber(params.From ?? "");
  if (
    !whatsappReadiness().calling ||
    !phone ||
    !String(params.From).startsWith("whatsapp:") ||
    whatsappNumber(params.To ?? "") !== whatsappSender()
  ) {
    response.say("WhatsApp interviews are not available on this number yet.");
    response.hangup();
  } else {
    const { data, error } = await supabaseAdmin
      .from("epew_whatsapp_interviews")
      .select("application_id,verified_at")
      .eq("phone", phone)
      .not("verified_at", "is", null)
      .maybeSingle();
    if (error) return new NextResponse("Unavailable", { status: 503 });
    if (!data) {
      response.say(
        "Please sign in to your EPEW entrepreneur portal and connect your WhatsApp number before calling. Tanpri konekte nimewo WhatsApp ou nan pòtay EPEW la anvan ou rele.",
      );
      response.hangup();
    } else
      response.redirect(
        { method: "POST" },
        `${new URL(request.url).origin}/api/twilio/voice/prequalification-establishment?applicationId=${data.application_id}`,
      );
  }
  return new NextResponse(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
