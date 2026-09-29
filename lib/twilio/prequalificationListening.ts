import twilio from "twilio";
import { sayCoach, type CoachLanguage } from "./coachLanguage";

/** Preserve a historical correction appended after the structured interview. */
export function readInterviewNotes(value: unknown): { data: Record<string, unknown> | null; annotation?: string } {
  if (typeof value !== "string" || !value.trim()) return { data: null };
  try {
    const data = JSON.parse(value);
    return { data: data && typeof data === "object" && !Array.isArray(data) ? data : null };
  } catch {
    const newline = value.indexOf("\n");
    if (newline > 0) {
      try {
        const data = JSON.parse(value.slice(0, newline));
        if (data && typeof data === "object" && !Array.isArray(data)) return { data, annotation: value.slice(newline + 1) };
      } catch { /* Retain unstructured historical notes below. */ }
    }
    return { data: null, annotation: value };
  }
}

export function isNewInterviewCall(savedCallSid: string | undefined, callSid: string, isListeningCallback: boolean): boolean {
  return !isListeningCallback || Boolean(savedCallSid && savedCallSid !== callSid);
}

export async function appendInterviewGather(
  response: twilio.twiml.VoiceResponse,
  options: { origin: string; applicationId: number; prompt: string; hints: string; retry?: boolean; language?: CoachLanguage },
): Promise<void> {
  const language = options.language ?? "en";
  if (language === "ht") {
    await sayCoach(response, options.origin, options.prompt + " Answer after the beep. Press the star key to change language.", language);
    response.record({
      action: `${options.origin}/api/twilio/voice/prequalification-establishment?applicationId=${options.applicationId}&turn=recorded`,
      method: "POST", timeout: 5, maxLength: 90, finishOnKey: "*#", playBeep: true, transcribe: false,
      recordingStatusCallback: `${options.origin}/api/twilio/voice/prequalification-recording?applicationId=${options.applicationId}`,
      recordingStatusCallbackMethod: "POST", recordingStatusCallbackEvent: ["completed", "absent"],
    });
    return;
  }
  const gather = response.gather({
    input: ["speech", "dtmf"],
    numDigits: 1,
    action: `${options.origin}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(options.applicationId))}&turn=listen`,
    method: "POST",
    timeout: 15,
    speechTimeout: "5",
    // Let Twilio select its default recognizer on retries rather than pinning
    // every failed attempt to the same provider/model.
    speechModel: language !== "en" || options.retry ? "default" : "googlev2_telephony",
    language: language === "fr" ? "fr-FR" : language === "es" ? "es-MX" : "en-US",
    hints: options.hints,
    profanityFilter: false,
    actionOnEmptyResult: true,
  });
  await sayCoach(gather, options.origin, options.prompt, language);
}
