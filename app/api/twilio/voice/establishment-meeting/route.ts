import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEstablishmentMeetingStartWindow,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingTiming";

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
        scheduled_at,
        started_at,
        preferred_language
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

    const startWindow =
      getEstablishmentMeetingStartWindow(
        meeting.scheduled_at
      );

    if (!startWindow.isWithinStartWindow) {
      response.say(
        {
          voice: "Polly.Gregory-Neural",
          language: "en-US",
        },
        startWindow.isTooEarly
          ? "This EPEW meeting is scheduled for a later time."
          : "This EPEW meeting is no longer within the allowed start window."
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

    const voiceWorkerUrl =
      process.env
        .EPEW_TWILIO_VOICE_WS_URL
        ?.trim() ||
      "wss://epew-twilio-voice.onrender.com/twilio-media";

    const selectedLanguage =
      String(
        url.searchParams.get("lang") ??
          meeting.preferred_language ??
          "en"
      ).trim();

    /*
     * Realtime phone meetings use a
     * bidirectional Twilio Media Stream.
     *
     * Twilio sends the caller's μ-law audio
     * to the EPEW voice worker and the worker
     * sends Daniel's generated audio back into
     * the same phone call.
     */
    const connect =
      response.connect();

    const stream =
      connect.stream({
        url: voiceWorkerUrl,
      });

    stream.parameter({
      name: "applicationId",
      value: String(applicationId),
    });

    stream.parameter({
      name: "meetingId",
      value: String(meeting.id),
    });

    stream.parameter({
      name: "language",
      value: selectedLanguage,
    });

    stream.parameter({
      name: "callSid",
      value:
        String(
          params.CallSid ?? ""
        ).trim(),
    });

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
