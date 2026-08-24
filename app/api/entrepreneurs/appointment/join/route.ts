import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const requestedMeetingId = String(
      body.meetingId ?? ""
    ).trim();

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select(`
          id,
          user_id,
          full_name,
          phone,
          business_name,
          assigned_coach_id,
          assigned_coach_name,
          coach_name
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    if (!application.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A registered phone number is required for a Phone Meeting.",
        },
        { status: 409 }
      );
    }

    let meetingQuery = supabaseAdmin
      .from("epew_coach_meetings")
      .select(`
        id,
        application_id,
        meeting_status,
        meeting_provider,
        scheduled_at,
        started_at,
        twilio_call_sid,
        twilio_call_status
      `)
      .eq("application_id", application.id)
      .eq("meeting_type", "entrepreneur_first_meeting");

    if (requestedMeetingId) {
      meetingQuery = meetingQuery.eq("id", requestedMeetingId);
    }

    const {
      data: meeting,
      error: meetingError,
    } = await meetingQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!meeting) {
      return NextResponse.json(
        {
          success: false,
          message: "Establishment Meeting not found.",
        },
        { status: 404 }
      );
    }

    const meetingProvider = String(
      meeting.meeting_provider ?? ""
    ).toLowerCase();

    if (meetingProvider !== "phone") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This appointment is not scheduled as a Phone Meeting.",
        },
        { status: 409 }
      );
    }

    const meetingStatus = String(
      meeting.meeting_status ?? ""
    ).toLowerCase();

    if (
      !["scheduled", "ready_to_start"].includes(
        meetingStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This Phone Meeting is not currently available to join.",
        },
        { status: 409 }
      );
    }

    if (
      meeting.twilio_call_sid &&
      ["queued", "ringing", "in-progress"].includes(
        String(meeting.twilio_call_status ?? "").toLowerCase()
      )
    ) {
      return NextResponse.json({
        success: true,
        alreadyStarted: true,
        message:
          "Your EPEW Phone Meeting call is already being connected.",
      });
    }

    const accountSid =
      requireEnvironment("TWILIO_ACCOUNT_SID");

    const authToken =
      requireEnvironment("TWILIO_AUTH_TOKEN");

    const fromNumber =
      requireEnvironment("TWILIO_PHONE_NUMBER");

    const publicBaseUrl =
      requireEnvironment("EPEW_PUBLIC_BASE_URL");

    const client = twilio(accountSid, authToken);

    const voiceUrl =
      new URL(
        "/api/twilio/voice/establishment-meeting",
        publicBaseUrl
      );

    voiceUrl.searchParams.set(
      "meetingId",
      meeting.id
    );

    const statusCallbackUrl =
      new URL(
        "/api/twilio/voice/status",
        publicBaseUrl
      );

    statusCallbackUrl.searchParams.set(
      "meetingId",
      meeting.id
    );

    const call = await client.calls.create({
      to: application.phone,
      from: fromNumber,
      url: voiceUrl.toString(),
      method: "POST",
      statusCallback: statusCallbackUrl.toString(),
      statusCallbackMethod: "POST",
      statusCallbackEvent: [
        "initiated",
        "ringing",
        "answered",
        "completed",
      ],
    });

    const now = new Date().toISOString();

    const { error: updateError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .update({
          twilio_call_sid: call.sid,
          twilio_call_status:
            call.status ?? "queued",
          twilio_call_started_at: now,
          updated_at: now,
        })
        .eq("id", meeting.id);

    if (updateError) {
      throw updateError;
    }

    /*
     * Enterprise Voice Call History
     *
     * Twilio is the transport provider.
     * epew_voice_calls is the permanent EPEW operational
     * record of who was contacted, why, and by which agent.
     *
     * This write is intentionally idempotent on Call SID.
     */
    const assignedCoachName = String(
      application.assigned_coach_name ??
      application.coach_name ??
      ""
    ).trim();

    const assignedCoachId = String(
      application.assigned_coach_id ?? ""
    ).trim();

    const {
      error: voiceHistoryError,
    } = await supabaseAdmin
      .from("epew_voice_calls")
      .upsert(
        {
          twilio_call_sid: call.sid,
          direction: "outbound",
          from_number: fromNumber,
          to_number: application.phone,
          application_id: application.id,
          meeting_id: meeting.id,
          agent_role: "personal_coach",
          agent_id:
            assignedCoachId || null,
          agent_name:
            assignedCoachName || null,
          department:
            "entrepreneur_coaching",
          purpose:
            "establishment_meeting",
          call_status:
            call.status ?? "queued",
          initiated_at: now,
          verification_status:
            "unverified",
          metadata: {
            provider: "twilio",
            source:
              "entrepreneur_appointment_join",
            business_name:
              application.business_name ?? null,
            entrepreneur_name:
              application.full_name ?? null,
          },
        },
        {
          onConflict: "twilio_call_sid",
        }
      );

    if (voiceHistoryError) {
      /*
       * Do not tell the entrepreneur that the phone
       * connection failed after Twilio has already
       * successfully created the call.
       *
       * The operational error is logged for recovery.
       */
      console.error(
        "Unable to record EPEW outbound voice history:",
        voiceHistoryError
      );
    }

    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      provider: "phone",
      callStatus:
        call.status ?? "queued",
      message:
        "Your phone is ringing. Answer the call to begin your EPEW Establishment Meeting.",
    });
  } catch (error) {
    console.error(
      "Unable to start EPEW Phone Meeting:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to start your Phone Meeting.",
      },
      { status: 500 }
    );
  }
}