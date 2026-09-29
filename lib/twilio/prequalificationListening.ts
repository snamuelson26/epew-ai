import twilio from "twilio";

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

export function appendInterviewGather(
  response: twilio.twiml.VoiceResponse,
  options: { origin: string; applicationId: number; prompt: string; hints: string; retry?: boolean },
): void {
  const gather = response.gather({
    input: ["speech", "dtmf"],
    numDigits: 1,
    action: `${options.origin}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(options.applicationId))}&turn=listen`,
    method: "POST",
    timeout: 15,
    speechTimeout: "5",
    // Let Twilio select its default recognizer on retries rather than pinning
    // every failed attempt to the same provider/model.
    speechModel: options.retry ? "default" : "googlev2_telephony",
    language: "en-US",
    hints: options.hints,
    profanityFilter: false,
    actionOnEmptyResult: true,
  });
  gather.say({ voice: "Polly.Matthew", language: "en-US" }, options.prompt);
}
