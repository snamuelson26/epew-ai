import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeSmsPhone } from "./smsConsentPolicy";

// Recheck immediately before sending; queues and legacy contact flags are not proof.
export async function canSendApplicationSms(phone: string) {
  const normalized = normalizeSmsPhone(phone);
  if (!normalized || normalized !== phone) return false;
  const { data, error } = await supabaseAdmin.rpc("epew_can_send_application_sms", { p_phone: normalized });
  if (error) throw new Error("SMS consent could not be verified; message blocked.");
  return data === true;
}
