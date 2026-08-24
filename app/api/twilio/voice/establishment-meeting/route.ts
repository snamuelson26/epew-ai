import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  EstablishmentMeetingRuntimeService,
} from "@/lib/services/establishment-meeting/EstablishmentMeetingRuntimeService";

import type {
  EstablishmentMeetingMessage,
  EstablishmentMeetingStage,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingCoach";

const VALID_STAGES = new Set<EstablishmentMeetingStage>([
  "opening",
  "meeting_purpose",
  "entrepreneur_discovery",
  "epew_philosophy",
  "business_discovery",
  "document_assessment",
  "meeting_2_readiness",
  "coach_evaluation",
  "development_plan",
  "closing",
]);

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

function getSavedConversation(
  value: unknown
): EstablishmentMeetingMessage[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return [];
  }

  const state = value as {
    messages?: unknown;
  };

  if (!Array.isArray(state.messages)) {
    return [];
  }

  return state.messages
    .filter(
      (
        message
      ): message is EstablishmentMeetingMessage =>
        Boolean(
          message &&
          typeof message === "object" &&
          !Array.isArray(message) &&
          (
            (message as EstablishmentMeetingMessage)
              .role === "coach" ||
            (message as EstablishmentMeetingMessage)
              .role === "entrepreneur"
          ) &&
          typeof (
            message as EstablishmentMeetingMessage
          ).content === "string" &&
          (
            message as EstablishmentMeetingMessage
          ).content.trim()
        )
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

function getSavedStage(
  value: unknown
): EstablishmentMeetingStage {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const candidate = String(
      (
        value as {
          stage?: unknown;
        }
      ).stage ?? ""
    ).trim() as EstablishmentMeetingStage;

    if (VALID_STAGES.has(candidate)) {
      return candidate;
    }
  }

  return "opening";
}

function speechLanguage(
  preferredLanguage: unknown
) {
  const language = String(
    preferredLanguage ?? ""
  )
    .trim()
    .toLowerCase();

  if (
    language.includes("spanish") ||
    language.includes("español")
  ) {
    return "es-US";
  }

  if (
    language.includes("french") ||
    language.includes("français")
  ) {
    return "fr-FR";
  }

  /*
   * Haitian Creole speech recognition will be
   * refined separately. Keep the current safe
   * fallback until the selected Twilio STT model
   * is confirmed for Kreyòl.
   */
  return "en-US";
}

export async function POST(
  request: NextRequest
) {
  try {
    const {
      valid,
      params,
    } = await validateTwilioWebhook(
      request
    );

    const response =
      new twilio.twiml.VoiceResponse();

    if (!valid) {
      response.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        "This request could not be verified."
      );

      return twimlResponse(
        response,
        403
      );
    }

    const url = new URL(request.url);

    const meetingId = String(
      url.searchParams.get(
        "meetingId"
      ) ?? ""
    ).trim();

    const turn = String(
      url.searchParams.get("turn") ??
        "initial"
    )
      .trim()
      .toLowerCase();

    const speechResult = String(
      params.SpeechResult ?? ""
    ).trim();

    if (!meetingId) {
      response.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        "This EPEW meeting could not be identified."
      );

      return twimlResponse(
        response,
        400
      );
    }

    const {
      data: meeting,
      error: meetingError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select(`
        id,
        application_id,
        meeting_status,
        meeting_provider,
        started_at,
        preferred_language,
        meeting_conversation_state
      `)
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!meeting) {
      response.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        "This EPEW Establishment Meeting could not be found."
      );

      return twimlResponse(
        response,
        404
      );
    }

    if (
      String(
        meeting.meeting_provider ?? ""
      )
        .trim()
        .toLowerCase() !== "phone"
    ) {
      response.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        "This meeting is not scheduled as a phone meeting."
      );

      return twimlResponse(
        response,
        409
      );
    }

    const applicationId = Number(
      meeting.application_id
    );

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      throw new Error(
        "The EPEW phone meeting does not have a valid entrepreneur application."
      );
    }

    const now =
      new Date().toISOString();

    if (
      !meeting.started_at ||
      meeting.meeting_status !==
        "in_progress"
    ) {
      const {
        error: startError,
      } = await supabaseAdmin
        .from("epew_coach_meetings")
        .update({
          meeting_status:
            "in_progress",
          started_at:
            meeting.started_at ??
            now,
          coach_session_status:
            "active",
          coach_session_started_at:
            meeting.started_at ??
            now,
          twilio_call_status:
            "in-progress",
          twilio_call_answered_at:
            now,
          updated_at:
            now,
        })
        .eq("id", meeting.id);

      if (startError) {
        throw startError;
      }
    }

    let conversation =
      getSavedConversation(
        meeting.meeting_conversation_state
      );

    /*
     * Twilio posts here with no SpeechResult
     * when the speech Gather times out.
     * Do not ask Daniel to generate another
     * substantive turn until the entrepreneur
     * actually speaks.
     */
    if (
      turn === "listen" &&
      !speechResult
    ) {
      const gather =
        response.gather({
          input: ["speech"],
          action:
            `${
              process.env
                .EPEW_PUBLIC_BASE_URL
            }/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
              meeting.id
            )}&turn=listen`,
          method: "POST",
          language:
            speechLanguage(
              meeting.preferred_language
            ),
          speechTimeout: "auto",
          timeout: 8,
          actionOnEmptyResult: true,
        });

      gather.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        "I am still here. Please go ahead when you are ready."
      );

      return twimlResponse(response);
    }

    if (speechResult) {
      conversation = [
        ...conversation,
        {
          role: "entrepreneur",
          content: speechResult,
        },
      ];
    }

    const stage =
      getSavedStage(
        meeting.meeting_conversation_state
      );

    const result =
      await EstablishmentMeetingRuntimeService.runTurn(
        {
          applicationId,
          stage,
          conversation,
          isAdmin: true,
          stageNotes: {
            communicationChannel:
              "phone",
            twilioCallSid:
              String(
                params.CallSid ?? ""
              ).trim() || null,
          },
        }
      );

    const publicBaseUrl =
      process.env
        .EPEW_PUBLIC_BASE_URL
        ?.trim();

    if (!publicBaseUrl) {
      throw new Error(
        "EPEW_PUBLIC_BASE_URL is not configured."
      );
    }

    /*
     * Daniel speaks his generated turn while
     * Twilio simultaneously begins listening
     * for the entrepreneur's natural response.
     */
    const gather =
      response.gather({
        input: ["speech"],
        action:
          `${publicBaseUrl}/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
            meeting.id
          )}&turn=listen`,
        method: "POST",
        language:
          speechLanguage(
            meeting.preferred_language
          ),
        speechTimeout: "auto",
        timeout: 8,
        actionOnEmptyResult: true,
      });

    gather.say(
      {
        voice: "Polly.Gregory-Neural",
        language: "en-US",
      },
      result.message.content
    );

    return twimlResponse(response);
  } catch (error) {
    console.error(
      "EPEW Twilio Establishment Meeting voice error:",
      error
    );

    const response =
      new twilio.twiml.VoiceResponse();

    response.say(
      {
        voice: "Polly.Gregory-Neural",
        language: "en-US",
      },
      "I am sorry. I am having trouble continuing the EPEW meeting right now. Please remain available while this issue is recorded."
    );

    return twimlResponse(
      response,
      500
    );
  }
}
