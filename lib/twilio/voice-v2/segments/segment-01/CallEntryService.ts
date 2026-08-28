import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  VoiceSessionEngine,
} from "@/lib/twilio/voice-v2/VoiceSessionEngine";

import type {
  VoiceLanguage,
} from "@/lib/twilio/voice-v2/VoiceState";

import type {
  Segment01EntryInput,
  Segment01Handoff,
} from "./Segment01Types";

/**
 * =========================================================
 * EPEW PHONE V2
 * SEGMENT #1 — CALL ENTRY SERVICE
 * =========================================================
 *
 * Persistence boundary for Segment #1.
 *
 * Responsibilities:
 *
 * 1. Establish or recover the voice session.
 * 2. Preserve CallSid and caller phone.
 * 3. Explicitly confirm the caller's language.
 * 4. Record language_confirmed_at.
 * 5. Transition to identify_caller.
 * 6. Return the formal handoff to Segment #2.
 *
 * This service does NOT execute Segment #2.
 */

export class CallEntryService {
  static async establishSession(
    input: Segment01EntryInput
  ) {
    if (!input.callSid.trim()) {
      throw new Error(
        "Segment #1 requires a Twilio CallSid."
      );
    }

    return VoiceSessionEngine.getOrCreate({
      callSid: input.callSid.trim(),
      callerPhone:
        input.callerPhone ?? null,
    });
  }

  static async confirmLanguage(params: {
    callSid: string;
    callerPhone: string | null;
    language: VoiceLanguage;
  }): Promise<Segment01Handoff> {
    const callSid =
      String(params.callSid ?? "").trim();

    if (!callSid) {
      throw new Error(
        "Segment #1 cannot confirm language without a CallSid."
      );
    }

    /*
     * The language choice and confirmation timestamp
     * are written atomically with the handoff state.
     *
     * This prevents the technical database default
     * language of "en" from being mistaken for an
     * explicit caller selection.
     */
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("epew_voice_sessions")
      .update({
        state: "identify_caller",
        language: params.language,
        language_confirmed_at:
          new Date().toISOString(),
        caller_phone:
          params.callerPhone ?? null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("call_sid", callSid)
      .select("call_sid")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `Segment #1 voice session not found for ${callSid}.`
      );
    }

    return {
      nextSegment: 2,
      nextState: "identify_caller",
      language: params.language,
    };
  }
}
