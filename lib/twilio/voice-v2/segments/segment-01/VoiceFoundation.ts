import type {
  VoiceLanguage,
} from "@/lib/twilio/voice-v2/VoiceState";

import {
  SEGMENT_01_LANGUAGE_DIGITS,
  type Segment01LanguageDigit,
} from "./Segment01Types";

/**
 * =========================================================
 * EPEW PHONE V2
 * SEGMENT #1 — VOICE FOUNDATION
 * =========================================================
 *
 * Technical helpers owned only by Segment #1.
 */

export const SEGMENT_01_TIMEZONE =
  "America/New_York";

export const SEGMENT_01_LANGUAGE_TIMEOUT_SECONDS =
  8;

export function normalizeSegment01Phone(
  value: string | null | undefined
): string | null {
  const normalized = String(value ?? "")
    .replace(/[^\d+]/g, "")
    .trim();

  return normalized || null;
}

export function languageFromSegment01Digit(
  digit: string
): VoiceLanguage | null {
  const normalized =
    String(digit ?? "").trim();

  if (
    !Object.prototype.hasOwnProperty.call(
      SEGMENT_01_LANGUAGE_DIGITS,
      normalized
    )
  ) {
    return null;
  }

  return SEGMENT_01_LANGUAGE_DIGITS[
    normalized as Segment01LanguageDigit
  ];
}

export function voiceForSegment01Language(
  language: VoiceLanguage
) {
  switch (language) {
    case "es":
      return {
        voice: "Polly.Mia",
        language: "es-MX",
      } as const;

    case "fr":
      return {
        voice: "Polly.Lea",
        language: "fr-FR",
      } as const;

    default:
      return {
        voice: "Polly.Matthew",
        language: "en-US",
      } as const;
  }
}
