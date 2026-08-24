import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

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
  return new NextResponse(response.toString(), {
    status,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

function meetingLabel(meetingType: string | null) {
  const type = String(meetingType ?? "")
    .trim()
    .toLowerCase();

  if (
    type.includes("establishment") ||
    type.includes("first")
  ) {
    return "your EPEW Establishment Meeting";
  }

  if (type.includes("marketing")) {
    return "your EPEW Business Marketing Meeting";
  }

  if (type.includes("support")) {
    return "your EPEW Support Preparation Meeting";
  }

  return "your EPEW meeting";
}

export async function POST(request: NextRequest) {
  try {
    const {
      valid,
      params,
    } = await validateTwilioWebhook(request);

    const response =
      new twilio.twiml.VoiceResponse();

    if (!valid) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "This call could not be verified."
      );

      return twimlResponse(response, 403);
    }

    const callerPhone = normalizePhone(
      String(params.From ?? "")
    );

    const digits = String(
      params.Digits ?? ""
    ).trim();

    if (!callerPhone) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you for calling EPEW. We could not identify the phone number you are calling from."
      );

      return twimlResponse(response);
    }

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(`
        id,
        full_name,
        phone,
        business_name,
        coach_name,
        assigned_coach_name
      `)
      .eq("phone", callerPhone)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you for calling EPEW. I am the EPEW Call Recovery Assistant. I could not automatically match this phone number to an EPEW account."
      );

      response.pause({
        length: 1,
      });

      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "For your privacy, I cannot provide information about recent EPEW calls until your identity is verified. Please call again from the phone number registered with your EPEW account or contact EPEW support."
      );

      return twimlResponse(response);
    }

    if (!digits) {
      const publicBaseUrl =
        requireEnvironment(
          "EPEW_PUBLIC_BASE_URL"
        );

      const gather = response.gather({
        action:
          `${publicBaseUrl}/api/twilio/voice/inbound`,
        method: "POST",
        numDigits: 1,
        timeout: 7,
      });

      gather.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you for calling EPEW. I am the EPEW Call Recovery Assistant. I found an EPEW account associated with the phone number you are calling from. To confirm that you are the account holder and allow me to check who recently contacted you, press 1."
      );

      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "I did not receive your confirmation. Please call again when you are ready."
      );

      return twimlResponse(response);
    }

    if (digits !== "1") {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Your identity was not confirmed. For your privacy, I cannot provide information about EPEW calls associated with this account."
      );

      return twimlResponse(response);
    }

    const {
      data: recentMeeting,
      error: meetingError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select(`
        id,
        application_id,
        meeting_type,
        meeting_status,
        meeting_provider,
        scheduled_at,
        twilio_call_sid,
        twilio_call_status,
        twilio_call_started_at,
        twilio_call_answered_at,
        twilio_call_ended_at
      `)
      .eq(
        "application_id",
        application.id
      )
      .eq(
        "meeting_provider",
        "phone"
      )
      .not(
        "twilio_call_started_at",
        "is",
        null
      )
      .order(
        "twilio_call_started_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!recentMeeting) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "Thank you. Your account has been confirmed. I could not find a recent EPEW phone call associated with this account."
      );

      return twimlResponse(response);
    }

    const coachName =
      String(
        application.assigned_coach_name ??
        application.coach_name ??
        ""
      ).trim();

    const purpose = meetingLabel(
      recentMeeting.meeting_type
    );

    if (coachName) {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        `Thank you. I found the recent call. Your EPEW Personal Coach, ${coachName}, was trying to reach you regarding ${purpose}.`
      );
    } else {
      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        `Thank you. I found the recent call. An EPEW representative was trying to reach you regarding ${purpose}.`
      );
    }

    const meetingStatus = String(
      recentMeeting.meeting_status ?? ""
    )
      .trim()
      .toLowerCase();

    const reconnectableStatuses = new Set([
      "scheduled",
      "ready_to_start",
      "in_progress",
    ]);

    if (
      reconnectableStatuses.has(
        meetingStatus
      )
    ) {
      const publicBaseUrl =
        requireEnvironment(
          "EPEW_PUBLIC_BASE_URL"
        );

      response.pause({
        length: 1,
      });

      response.say(
        {
          voice: "Polly.Matthew",
          language: "en-US",
        },
        "The meeting is still available. I will reconnect you now."
      );

      response.redirect(
        {
          method: "POST",
        },
        `${publicBaseUrl}/api/twilio/voice/establishment-meeting?meetingId=${encodeURIComponent(
          recentMeeting.id
        )}`
      );

      return twimlResponse(response);
    }

    response.pause({
      length: 1,
    });

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "That call is no longer available for automatic reconnection."
    );

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "EPEW will need to arrange another connection with the person who contacted you."
    );

    return twimlResponse(response);
  } catch (error) {
    console.error(
      "EPEW inbound call recovery error:",
      error
    );

    const response =
      new twilio.twiml.VoiceResponse();

    response.say(
      {
        voice: "Polly.Matthew",
        language: "en-US",
      },
      "Thank you for calling EPEW. We are unable to complete the call recovery process right now. Please try again shortly."
    );

    return twimlResponse(
      response,
      500
    );
  }
}
