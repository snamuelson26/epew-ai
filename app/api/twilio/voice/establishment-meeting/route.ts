import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
        const {
      valid,
    } = await validateTwilioWebhook(request);

    if (!valid) {
      const forbidden =
        new twilio.twiml.VoiceResponse();

      forbidden.say(
        "This request could not be verified."
      );

      return new NextResponse(
        forbidden.toString(),
        {
          status: 403,
          headers: {
            "Content-Type": "text/xml",
          },
        }
      );
    }
    const url = new URL(request.url);
    const meetingId = String(
      url.searchParams.get("meetingId") ?? ""
    ).trim();

    if (!meetingId) {
      return new NextResponse(
        new twilio.twiml.VoiceResponse()
          .say("This EPEW meeting could not be identified.")
          .toString(),
        {
          status: 400,
          headers: {
            "Content-Type": "text/xml",
          },
        }
      );
    }

    const { data: meeting, error: meetingError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select(`
          id,
          application_id,
          meeting_status,
          meeting_provider,
          started_at
        `)
        .eq("id", meetingId)
        .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    const response =
      new twilio.twiml.VoiceResponse();

    if (!meeting) {
      response.say(
        "This EPEW Establishment Meeting could not be found."
      );

      return new NextResponse(response.toString(), {
        status: 404,
        headers: {
          "Content-Type": "text/xml",
        },
      });
    }

    if (
      String(meeting.meeting_provider ?? "").toLowerCase() !==
      "phone"
    ) {
      response.say(
        "This meeting is not scheduled as a phone meeting."
      );

      return new NextResponse(response.toString(), {
        status: 409,
        headers: {
          "Content-Type": "text/xml",
        },
      });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("epew_coach_meetings")
      .update({
        meeting_status: "in_progress",
        started_at: meeting.started_at ?? now,
        coach_session_status: "active",
        coach_session_started_at:
          meeting.started_at ?? now,
        twilio_call_status: "in-progress",
        twilio_call_answered_at: now,
        updated_at: now,
      })
      .eq("id", meeting.id);

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "Hello. This is Daniel Pierre, your EPEW Personal Coach. Welcome to your Establishment Meeting."
    );

    response.pause({
      length: 1,
    });

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "We will begin by discussing the business you are building, its current condition, and what needs to be completed before your next meeting."
    );

    return new NextResponse(response.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error(
      "EPEW Twilio Establishment Meeting voice error:",
      error
    );

    const response =
      new twilio.twiml.VoiceResponse();

    response.say(
      "EPEW is unable to begin the meeting right now. Please try again shortly."
    );

    return new NextResponse(response.toString(), {
      status: 500,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}