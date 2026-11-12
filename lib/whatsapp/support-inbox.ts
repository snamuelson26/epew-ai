import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const supportAcknowledgement = "EPEW Support: We received your message in our support inbox. Our team can review it and reply here. This is an automated receipt, not a live-agent response. Please describe the problem in a short text message. Do not send passwords, verification codes or banking details. For private account documents, use your signed-in entrepreneur portal.";

// Called only after Twilio signature, account, channel and sender validation.
// No phone-to-account lookup: a WhatsApp sender is not proof of portal ownership.
export async function saveSupportMessage(phone: string, params: Record<string, string>) {
  const body = String(params.Body || "").trim().slice(0, 10000);
  const mediaCount = Math.max(0, Math.min(10, Number(params.NumMedia) || 0));
  const { data, error } = await supabaseAdmin.from("epew_whatsapp_support_messages").upsert({
    message_sid: params.MessageSid,
    phone,
    body: body || (mediaCount ? "[Attachment received; please resend your question as text.]" : "[Empty message]"),
    media_count: mediaCount,
  }, { onConflict: "message_sid", ignoreDuplicates: true }).select("message_sid");
  if (error) throw new Error("Support inbox unavailable");
  // Do not send another acknowledgement for a retried webhook.
  return Boolean(data?.length);
}

export function withinSupportWindow(receivedAt: string, now = Date.now()) {
  const received = Date.parse(receivedAt);
  return Number.isFinite(received) && received <= now && now - received < 23.9 * 60 * 60 * 1000;
}
