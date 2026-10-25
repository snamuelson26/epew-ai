export const SMS_DISCLOSURE_VERSION = "epew-application-sms-2026-10-25-v1";
export const SMS_SOURCE = "https://epew.us/entrepreneurs/communication-preferences";
export const SMS_DISCLOSURE = "I agree to receive SMS messages from Ekero Partners Empower Wealth (EPEW) about my application, reminders, entrepreneurship information, and program updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. SMS consent is optional.";

export function normalizeSmsPhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const normalized = /^\d{10}$/.test(compact) ? `+1${compact}` : /^1\d{10}$/.test(compact) ? `+${compact}` : compact;
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : "";
}

export function consentRecord(granted: boolean, phone: string, now = new Date().toISOString()) {
  return {
    sms_consent: granted,
    sms_consent_phone: granted ? phone : null,
    sms_consented_at: granted ? now : null,
    sms_consent_source: SMS_SOURCE,
    // This version of the checkbox is displayed in English; preferred language is stored separately.
    sms_consent_language: "en",
    sms_disclosure_version: SMS_DISCLOSURE_VERSION,
    sms_disclosure: SMS_DISCLOSURE,
    sms_preference_updated_at: now,
  };
}

export const SMS_STOP_REPLY = "EPEW: You are unsubscribed and will receive no more SMS messages. For help, contact support@epew.us.";
export const SMS_HELP_REPLY = "EPEW application updates: For help, contact support@epew.us or visit https://epew.us. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out.";
export function smsKeyword(body: string) {
  const word = body.trim().toUpperCase();
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT"].includes(word)) return "stop";
  if (["HELP", "INFO"].includes(word)) return "help";
  return null;
}
