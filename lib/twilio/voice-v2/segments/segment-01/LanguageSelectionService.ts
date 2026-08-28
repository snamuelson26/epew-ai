import type {
  Segment01LanguageDecision,
  Segment01LanguageInput,
} from "./Segment01Types";

import {
  SEGMENT_01_MAX_LANGUAGE_RETRIES,
} from "./Segment01Types";

import {
  languageFromSegment01Digit,
} from "./VoiceFoundation";

/**
 * =========================================================
 * EPEW PHONE V2
 * SEGMENT #1 — LANGUAGE SELECTION SERVICE
 * =========================================================
 *
 * Final language-selection rules:
 *
 * Initial request
 * → prompt language menu
 *
 * Valid digit
 * → confirm language
 *
 * First invalid digit OR first silence
 * → retry once
 *
 * Second invalid digit OR second silence
 * → controlled failure
 *
 * This service does not write to the database,
 * create TwiML, identify callers, or route to
 * another segment.
 */

export class LanguageSelectionService {
  static decide(
    input: Segment01LanguageInput
  ): Segment01LanguageDecision {
    const digits =
      String(input.digits ?? "").trim();

    const attempt = Math.max(
      0,
      Number(input.attempt) || 0
    );

    if (input.isInitialRequest) {
      return {
        outcome: "prompt",
        attempt: 0,
      };
    }

    const language =
      languageFromSegment01Digit(digits);

    if (language) {
      return {
        outcome: "confirmed",
        language,
      };
    }

    if (
      attempt >=
      SEGMENT_01_MAX_LANGUAGE_RETRIES
    ) {
      return {
        outcome: "failed",
      };
    }

    return {
      outcome: "retry",
      attempt: attempt + 1,
    };
  }
}
