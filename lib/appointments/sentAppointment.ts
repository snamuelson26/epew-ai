import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canSendApplicationSms } from "@/lib/communications/canSendApplicationSms";
import { sendSentTemplate, SentRequestError } from "@/lib/sent/sendTemplate";
import { appointmentMessage } from "./messageText";

type Delivery = { id: string; source_key: string; starts_at: string; phone: string;
  channel: "sms" | "whatsapp"; hours_before: number; payload: { language: string } };

export async function sentAppointmentEligible(row: Delivery) {
  if (Date.parse(row.starts_at) <= Date.now()) return false;
  const { data, error } = await supabaseAdmin.from("epew_appointment_mobile_recipients")
    .select("source_key").eq("source_key", row.source_key).eq("starts_at", row.starts_at)
    .eq("channel", row.channel).eq("phone", row.phone);
  if (error) throw new SentRequestError("sent_consent_lookup_failed");
  if (!data?.length) return false;
  // Sent's opt-out is global. Do not move an incumbent channel's STOP to a
  // different Sent channel, or turn an SMS grant into WhatsApp permission.
  const { data: optouts, error: optoutError } = await supabaseAdmin.from("epew_appointment_message_optouts")
    .select("phone").eq("phone", row.phone).limit(1);
  if (optoutError) throw new SentRequestError("sent_suppression_lookup_failed");
  if (optouts?.length) return false;
  return row.channel !== "sms" || await canSendApplicationSms(row.phone);
}

export async function processSentAppointment(row: Delivery) {
  if (process.env.EPEW_SENT_APPOINTMENT_LIVE_ENABLED !== "true") throw new SentRequestError("sent_live_sending_disabled");
  const language = String(row.payload.language || "").trim().toLowerCase().split(/[-_]/)[0];
  if (!["en","english","fr","french","français","ht","haitian creole","kreyòl","kreyòl ayisyen","kreyol ayisyen","creole","es","spanish","español"].includes(language)) {
    throw new SentRequestError("sent_language_template_missing");
  }
  const message = appointmentMessage(row.payload.language, row.hours_before, row.starts_at);
  const { data: config, error } = await supabaseAdmin.from("epew_appointment_message_config")
    .select("value").eq("key", `sent:template:${message.lang}`).maybeSingle();
  if (error) throw new SentRequestError("sent_template_config_unavailable");
  const templateId = config?.value?.id;
  if (!templateId) throw new SentRequestError("sent_language_template_missing");
  const { data: reserved, error: reserveError } = await supabaseAdmin.rpc("epew_reserve_sent_appointment", { p_delivery_id: row.id });
  if (reserveError) throw new SentRequestError("sent_reservation_failed");
  if (!reserved) throw new SentRequestError("sent_provider_cutover_requires_reconciliation");
  const result = await sendSentTemplate({
    logicalId: `appointment_${row.id}`, phone: row.phone, channel: row.channel, templateId,
    parameters: { timeUntil: message.variables["1"], appointmentDate: message.variables["2"] }, sandbox: false,
  }, {
    apiKey: process.env.SENT_DM_API_KEY || "", liveEnabled: true,
    smsApproved: process.env.EPEW_SENT_SMS_APPROVED === "true",
    eligible: async () => sentAppointmentEligible(row),
  });
  const { error: bindError } = await supabaseAdmin.rpc("epew_bind_sent_appointment", {
    p_delivery_id: row.id, p_message_id: result.messageId,
  });
  if (bindError) throw new SentRequestError("sent_acceptance_persistence_unknown");
  return result;
}
