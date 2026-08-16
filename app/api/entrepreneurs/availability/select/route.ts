import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ZoomMeetingService } from "@/lib/zoom/ZoomMeetingService";
import { sendCoachIntroductionEmail } from "@/lib/email/sendCoachIntroductionEmail";

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

    const body = await request.json();

    const applicationId = Number(body.applicationId);
    const matchId = String(body.matchId ?? "").trim();

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0 ||
      !matchId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Application and appointment selection are required.",
        },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select("id, user_id, full_name, email, business_name")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();

    if (applicationError || !application) {
      return NextResponse.json(
        {
          success: false,
          message: "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    const { data: match, error: matchError } =
      await supabaseAdmin
        .from("epew_private_schedule_matches")
        .select(
          `
          id,
          availability_id,
          application_id,
          coach_assignment_id,
          coach_id,
          proposed_start_at,
          reserved_until,
          reservation_minutes,
          status,
          exposed_to_participant
        `
        )
        .eq("id", matchId)
        .eq("application_id", applicationId)
        .eq("status", "available")
        .eq("exposed_to_participant", true)
        .single();

    if (matchError || !match) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This appointment option is no longer available. Please choose another time.",
        },
        { status: 409 }
      );
    }

    const scheduledDate = new Date(match.proposed_start_at);
    const scheduledEnd = new Date(match.reserved_until);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      Number.isNaN(scheduledEnd.getTime()) ||
      scheduledEnd <= scheduledDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected appointment time is invalid.",
        },
        { status: 400 }
      );
    }

    const { data: assignment, error: assignmentError } =
      await supabaseAdmin
        .from("coach_assignments")
        .select("id, coach_id, coach_name, coach_email")
        .eq("id", match.coach_assignment_id)
        .eq("application_id", applicationId)
        .eq("coach_id", match.coach_id)
        .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "Your Personal Coach assignment could not be confirmed.",
        },
        { status: 409 }
      );
    }

    const { data: meeting, error: meetingError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select("*")
        .eq("application_id", applicationId)
        .eq("meeting_type", "entrepreneur_first_meeting")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        {
          success: false,
          message: "Your Establishment Meeting record could not be found.",
        },
        { status: 404 }
      );
    }

    const conflictWindowStart = new Date(
      scheduledDate.getTime() - 60 * 60 * 1000
    );

    const { data: conflictingMeetings, error: conflictError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select("id, scheduled_at, meeting_status")
        .eq("coach_id", match.coach_id)
        .neq("id", meeting.id)
        .not("scheduled_at", "is", null)
        .in("meeting_status", [
          "scheduled",
          "ready_to_start",
          "in_progress",
        ])
        .gte(
          "scheduled_at",
          conflictWindowStart.toISOString()
        )
        .lt(
          "scheduled_at",
          scheduledEnd.toISOString()
        );

    if (conflictError) {
      throw conflictError;
    }

    if (conflictingMeetings && conflictingMeetings.length > 0) {
      await supabaseAdmin
        .from("epew_private_schedule_matches")
        .update({
          status: "conflict",
          exposed_to_participant: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id);

      return NextResponse.json(
        {
          success: false,
          message:
            "That appointment was just taken. Please choose another available time.",
        },
        { status: 409 }
      );
    }

    const zoomMeeting =
      await ZoomMeetingService.createEstablishmentMeeting({
        entrepreneurName: application.full_name,
        businessName: application.business_name,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes: 60,
      });

    const now = new Date().toISOString();

    const { data: updatedMeeting, error: meetingUpdateError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .update({
          scheduled_at: scheduledDate.toISOString(),
          meeting_date: scheduledDate.toISOString(),
          meeting_status: "scheduled",
          meeting_provider: "zoom",
          zoom_meeting_id: zoomMeeting.meetingId,
          zoom_meeting_uuid: zoomMeeting.meetingUuid,
          zoom_join_url: zoomMeeting.joinUrl,
          zoom_meeting_status: "scheduled",
          updated_at: now,
        })
        .eq("id", meeting.id)
        .select("*")
        .single();

    if (meetingUpdateError) {
      throw meetingUpdateError;
    }

    const { error: zoomSecretError } =
      await supabaseAdmin
        .schema("emcc_private")
        .from("zoom_meeting_secrets")
        .upsert(
          {
            meeting_id: meeting.id,
            zoom_host_url: zoomMeeting.startUrl,
            zoom_start_url: zoomMeeting.startUrl,
            zoom_passcode: zoomMeeting.passcode,
            rtms_access_context: {},
            updated_at: now,
          },
          {
            onConflict: "meeting_id",
          }
        );

    if (zoomSecretError) {
      throw zoomSecretError;
    }

    const { error: assignmentUpdateError } =
      await supabaseAdmin
        .from("coach_assignments")
        .update({
          first_interview_status: "scheduled",
          first_interview_date: scheduledDate.toISOString(),
        })
        .eq("id", assignment.id);

    if (assignmentUpdateError) {
      throw assignmentUpdateError;
    }

    const { error: matchSelectError } =
      await supabaseAdmin
        .from("epew_private_schedule_matches")
        .update({
          status: "scheduled",
          selected_by_user_id: user.id,
          selected_at: now,
          updated_at: now,
        })
        .eq("id", match.id)
        .eq("status", "available");

    if (matchSelectError) {
      throw matchSelectError;
    }

    await supabaseAdmin
      .from("epew_private_schedule_matches")
      .update({
        status: "withdrawn",
        exposed_to_participant: false,
        updated_at: now,
      })
      .eq("availability_id", match.availability_id)
      .neq("id", match.id)
      .eq("status", "available");

    await supabaseAdmin
      .from("epew_participant_availability")
      .update({
        status: "scheduled",
        scheduled_at: now,
        updated_at: now,
      })
      .eq("id", match.availability_id);

    await supabaseAdmin
      .from("epew_no_show_recovery_cases")
      .update({
        status: "rescheduled",
        next_required_action: "attend_rescheduled_meeting",
        rescheduled_at: now,
        updated_at: now,
      })
      .eq("application_id", applicationId)
      .in("status", ["active", "responded"]);

    const proposedMeetingDate =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(scheduledDate);

    const proposedMeetingTime =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(scheduledDate);

    if (
      application.email &&
      updatedMeeting.zoom_join_url &&
      updatedMeeting.zoom_meeting_id
    ) {
      try {
        await sendCoachIntroductionEmail({
          applicationId,
          assignmentId: assignment.id,
          zoomMeetingId: updatedMeeting.zoom_meeting_id,
          entrepreneurEmail: application.email,
          entrepreneurName: application.full_name,
          businessName:
            application.business_name ?? "your business",
          coachName:
            assignment.coach_name ??
            "Your EPEW Personal Coach",
          coachEmail:
            assignment.coach_email ??
            "welcome@epew.us",
          proposedMeetingDate,
          proposedMeetingTime,
          zoomJoinUrl: updatedMeeting.zoom_join_url,
        });
      } catch (emailError) {
        console.error(
          "Rescheduled meeting confirmation email failed:",
          emailError
        );
      }
    }

    await supabaseAdmin
      .from("epew_operational_history")
      .insert({
        application_id: applicationId,
        entrepreneur_user_id: user.id,
        event_type: "meeting_rescheduled",
        event_name: "Establishment Meeting Rescheduled",
        event_description:
          "Entrepreneur selected a privately matched appointment and rescheduled the Establishment Meeting.",
        previous_status: "no_show",
        new_status: "scheduled",
        occurred_at: now,
        actor_user_id: user.id,
        actor_role: "entrepreneur",
        actor_type: "participant",
        actor_name: application.full_name,
        decision_made_by_user_id: user.id,
        decision_made_by_role: "entrepreneur",
        decision_made_by_type: "participant",
        decision_made_by_name: application.full_name,
        decision_organization: "EPEW",
        decision_reason:
          "Entrepreneur selected one of the appointment times privately matched by EMCC.",
        decision_at: now,
        executed_by: "EMCC Private Scheduling Engine",
        recorded_by: "EPEW EDE / IBOS",
        source_system: "EMCC Scheduling Engine",
        communication_channel: "web",
        reference_type: "coach_meeting",
        reference_id: meeting.id,
        metadata: {
          matchId: match.id,
          availabilityId: match.availability_id,
          coachId: match.coach_id,
          coachAssignmentId: assignment.id,
          scheduledAt: scheduledDate.toISOString(),
          reservationMinutes: 60,
          meetingProvider: "zoom",
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Your Establishment Meeting has been rescheduled successfully.",
      appointment: {
        scheduledAt: scheduledDate.toISOString(),
        reservedUntil: scheduledEnd.toISOString(),
        zoomJoinUrl: updatedMeeting.zoom_join_url,
      },
    });
  } catch (error) {
    console.error(
      "Entrepreneur private appointment selection error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to schedule the selected appointment.",
      },
      { status: 500 }
    );
  }
}
