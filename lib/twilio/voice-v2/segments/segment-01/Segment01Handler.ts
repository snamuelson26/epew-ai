import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import {
  approvedHaitianAudioUrl,
} from "@/lib/twilio/voice-v2/ApprovedAudioRegistry";

import {
  CallEntryService,
} from "./CallEntryService";

import {
  LanguageSelectionService,
} from "./LanguageSelectionService";

import {
  normalizeSegment01Phone,
  SEGMENT_01_LANGUAGE_TIMEOUT_SECONDS,
} from "./VoiceFoundation";

/**
 * =========================================================
 * EPEW PHONE V2
 * SEGMENT #1 — CALL ENTRY & CORE VOICE FOUNDATION
 * VERSION 1.0.0
 * =========================================================
 *
 * Complete Segment #1 execution:
 *
 * Twilio Verification
 * → CallSid / Phone
 * → Voice Session
 * → Language Menu
 * → One Retry Maximum
 * → Explicit Language Confirmation
 * → Handoff to Segment #2
 */

function requireEnvironment(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function twimlResponse(
  response: twilio.twiml.VoiceResponse,
  status = 200
) {
  return new NextResponse(
    response.toString(),
    {
      status,
      headers: {
        "Content-Type": "text/xml",
      },
    }
  );
}

function renderLanguageMenu(params: {
  response: twilio.twiml.VoiceResponse;
  publicBaseUrl: string;
  attempt: number;
  retry: boolean;
}) {
  const {
    response,
    publicBaseUrl,
    attempt,
    retry,
  } = params;

  if (retry) {
    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "I did not receive a valid language selection. Please try one more time."
    );
  }

  const gather =
    response.gather({
      input: ["dtmf"],
      action:
        `${publicBaseUrl}/api/twilio/voice/v2/inbound` +
        `?step=language` +
        `&phase=response` +
        `&attempt=${attempt}`,
      method: "POST",
      numDigits: 1,
      timeout:
        SEGMENT_01_LANGUAGE_TIMEOUT_SECONDS,
      actionOnEmptyResult: true,
    });

  gather.say(
    {
      voice: "Polly.Matthew",
      language: "en-US",
    },
    "Welcome to E. P. E. W. For English, press 1."
  );

  gather.play(
    approvedHaitianAudioUrl(
      publicBaseUrl,
      "languageSelection"
    )
  );

  gather.say(
    {
      voice: "Polly.Mia",
      language: "es-MX",
    },
    "Para español, oprima 3."
  );

  gather.say(
    {
      voice: "Polly.Lea",
      language: "fr-FR",
    },
    "Pour le français, appuyez sur 4."
  );
}

export class Segment01Handler {
  static async handle(
    request: NextRequest
  ): Promise<NextResponse> {
    const response =
      new twilio.twiml.VoiceResponse();

    try {
      /*
       * SECURITY GATE
       *
       * No Segment #1 processing occurs
       * before Twilio verification succeeds.
       */
      const {
        valid,
        params,
      } =
        await validateTwilioWebhook(
          request
        );

      if (!valid) {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "This call could not be verified."
        );

        return twimlResponse(
          response,
          403
        );
      }

      const publicBaseUrl =
        requireEnvironment(
          "EPEW_PUBLIC_BASE_URL"
        );

      const callSid =
        String(
          params.CallSid ?? ""
        ).trim();

      const callerPhone =
        normalizeSegment01Phone(
          String(params.From ?? "")
        );

      const digits =
        String(
          params.Digits ?? ""
        ).trim();

      if (!callSid) {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "We could not establish a call session."
        );

        return twimlResponse(
          response
        );
      }

      /*
       * SESSION GATE
       */
      await CallEntryService
        .establishSession({
          callSid,
          callerPhone,
        });

      const url =
        new URL(request.url);

      const phase =
        String(
          url.searchParams.get(
            "phase"
          ) ?? "initial"
        )
          .trim()
          .toLowerCase();

      const attempt =
        Math.max(
          0,
          Number(
            url.searchParams.get(
              "attempt"
            ) ?? "0"
          ) || 0
        );

      const decision =
        LanguageSelectionService
          .decide({
            callSid,
            callerPhone,
            digits,
            attempt,
            isInitialRequest:
              phase !== "response",
          });

      /*
       * INITIAL LANGUAGE MENU
       */
      if (
        decision.outcome ===
        "prompt"
      ) {
        renderLanguageMenu({
          response,
          publicBaseUrl,
          attempt:
            decision.attempt,
          retry: false,
        });

        return twimlResponse(
          response
        );
      }

      /*
       * ONE CONTROLLED RETRY
       */
      if (
        decision.outcome ===
        "retry"
      ) {
        renderLanguageMenu({
          response,
          publicBaseUrl,
          attempt:
            decision.attempt,
          retry: true,
        });

        return twimlResponse(
          response
        );
      }

      /*
       * LANGUAGE SELECTION FAILED
       */
      if (
        decision.outcome ===
        "failed"
      ) {
        response.say(
          {
            voice: "Polly.Matthew",
            language: "en-US",
          },
          "I was unable to confirm your language selection. Please call EPEW again when you are ready."
        );

        response.hangup();

        return twimlResponse(
          response
        );
      }

      /*
       * LANGUAGE CONFIRMED
       *
       * Segment #1 ends immediately
       * after persistence and handoff.
       */
      await CallEntryService
        .confirmLanguage({
          callSid,
          callerPhone,
          language:
            decision.language,
        });

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/v2/inbound?step=identify`
      );

      return twimlResponse(
        response
      );
    } catch (error) {
      console.error(
        "[EPEW PHONE V2][SEGMENT 01]",
        error
      );

      /*
       * Controlled caller-safe failure.
       *
       * Internal error information is
       * never spoken to the caller.
       */
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "We are unable to continue this call right now. Please try again later."
      );

      response.hangup();

      return twimlResponse(
        response
      );
    }
  }
}
