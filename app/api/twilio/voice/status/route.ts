import {
  validateTwilioWebhook,
} from "@/lib/twilio/validateTwilioWebhook";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const meetingId = String(
      url.searchParams.get("meetingId") ?? ""
    ).trim();

    if (!meetingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing meeting ID.",
        },
        { status: 400 }
      );
    }

    const {
      valid,
      params,
    } = await validateTwilioWebhook(request);

    if (!valid) {
      return new NextResponse("FORBIDDEN", {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const callSid = String(
      params.CallSid ?? ""
    ).trim();

    const callStatus = String(
      params.CallStatus ?? ""
    )
      .trim()
      .toLowerCase();

    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      twilio_call_status: callStatus || null,
      updated_at: now,
    };

    if (callSid) {
      updates.twilio_call_sid = callSid;
    }

    if (callStatus === "in-progress") {
      updates.twilio_call_answered_at = now;
    }

    if (
      [
        "completed",
        "busy",
        "failed",
        "no-answer",
        "canceled",
      ].includes(callStatus)
    ) {
      updates.twilio_call_ended_at = now;
    }

    if (callStatus === "completed") {
      updates.coach_session_ended_at = now;
    }

    const { error } = await supabaseAdmin
      .from("epew_coach_meetings")
      .update(updates)
      .eq("id", meetingId);

    if (error) {
      throw error;
    }

    return new NextResponse("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error(
      "EPEW Twilio call status error:",
      error
    );

    return new NextResponse("ERROR", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}