import type {
  VoiceLanguage,
} from "@/lib/twilio/voice-v2/VoiceState";

/**
 * =========================================================
 * EPEW PHONE V2
 * SEGMENT #1 — CALL ENTRY & CORE VOICE FOUNDATION
 * =========================================================
 *
 * Segment responsibility:
 *
 * Incoming Call
 * → Twilio Verification
 * → Voice Session
 * → Language Selection
 * → Explicit Language Confirmation
 * → Handoff to Segment #2
 *
 * This segment does NOT perform caller identification,
 * account confirmation, meeting decisions, scheduling,
 * coach connection, or member assistance.
 */

export const SEGMENT_01_NAME =
  "Call Entry & Core Voice Foundation";

export const SEGMENT_01_VERSION =
  "1.0.0";

export const SEGMENT_01_LANGUAGE_DIGITS = {
  "1": "en",
  "2": "ht",
  "3": "es",
  "4": "fr",
} as const satisfies Record<
  string,
  VoiceLanguage
>;

export type Segment01LanguageDigit =
  keyof typeof SEGMENT_01_LANGUAGE_DIGITS;

export type Segment01EntryInput = {
  callSid: string;
  callerPhone: string | null;
};

export type Segment01LanguageInput = {
  callSid: string;
  callerPhone: string | null;
  digits: string;
  attempt: number;

  /**
   * true only when Segment #1 is presenting
   * the language menu for the first time.
   *
   * false for every Twilio Gather callback,
   * including callbacks caused by silence.
   */
  isInitialRequest: boolean;
};

export type Segment01LanguageDecision =
  | {
      outcome: "prompt";
      attempt: number;
    }
  | {
      outcome: "retry";
      attempt: number;
    }
  | {
      outcome: "confirmed";
      language: VoiceLanguage;
    }
  | {
      outcome: "failed";
    };

export type Segment01Handoff = {
  nextSegment: 2;
  nextState: "identify_caller";
  language: VoiceLanguage;
};

export const SEGMENT_01_MAX_LANGUAGE_RETRIES = 1;
