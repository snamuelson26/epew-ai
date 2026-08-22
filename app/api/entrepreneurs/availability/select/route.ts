import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ZoomMeetingService } from "@/lib/zoom/ZoomMeetingService";
import { sendCoachIntroductionEmail } from "@/lib/email/sendCoachIntroductionEmail";

const MEETING_DURATION_MINUTES = 60;
const MEETING_BUFFER_MINUTES = 10;
const MEETING_OCCUPANCY_MINUTES =
  MEETING_DURATION_MINUTES + MEETING_BUFFER_MINUTES;

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
    const requestedStartAt = String(
      body.requestedStartAt ?? ""
    ).trim();

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0 ||
      !requestedStartAt
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please choose the date and time you want for your appointment.",
        },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(requestedStartAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected appointment date or time is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      scheduledDate.getMinutes() % 5 !== 0 ||
      scheduledDate.getSeconds() !== 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Appointments must begin on a 5-minute scheduling interval.",
        },
        { status: 400 }
      );
    }

    const nowDate = new Date();

    if (scheduledDate <= nowDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please choose an appointment date and time in the future.",
        },
        { status: 400 }
      );
    }

    const scheduledEnd = new Date(
      scheduledDate.getTime() +
        MEETING_DURATION_MINUTES * 60 * 1000
    );

    // =====================================================
    // Confirm the signed-in entrepreneur owns the application.
    // =====================================================

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select(
          "id, user_id, full_name, email, business_name"
        )
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

    // =====================================================
    // Temporary official Establishment Meeting opening.
    //
    // General scheduling opens:
    // Tuesday, August 18, 2026 at 1:00 PM Eastern.
    //
    // Samuel Nelson / Food Fans Restaurant has temporary early scheduling access
    // while general Establishment Meeting scheduling is not yet open.
    // =====================================================

    const isSamuelFoodFansEarlyAccess =
      application.full_name?.trim().toLowerCase() ===
        "samuel nelson" &&
      application.business_name?.trim().toLowerCase() ===
        "food fans restaurant";

    const officialSchedulingOpening =
      new Date("2026-08-18T13:00:00-04:00");

    if (
      !isSamuelFoodFansEarlyAccess &&
      scheduledDate < officialSchedulingOpening
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Establishment Meeting appointments officially begin Tuesday, August 18, 2026 at 1:00 PM Eastern. Please choose Tuesday at 1:00 PM or later.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Load the entrepreneur's current Personal Coach.
    // =====================================================

    const { data: assignment, error: assignmentError } =
      await supabaseAdmin
        .from("coach_assignments")
        .select(
          `
            id,
            coach_id,
            coach_name,
            coach_email,
            assignment_status,
            assigned_at
          `
        )
        .eq("application_id", applicationId)
        .not(
          "assignment_status",
          "in",
          '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
        )
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your Personal Coach assignment could not be confirmed.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // Load the current Establishment Meeting record.
    // =====================================================

    const { data: meeting, error: meetingError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select("*")
        .eq("application_id", applicationId)
        .eq(
          "meeting_type",
          "entrepreneur_first_meeting"
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your Establishment Meeting record could not be found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // Check the requested 60-minute period privately.
    //
    // Example:
    // Requested appointment: 3:00 PM - 4:00 PM
    //
    // Any other active meeting that begins after 2:00 PM
    // and before 4:00 PM creates a scheduling conflict.
    // =====================================================

    const conflictWindowStart = new Date(
      scheduledDate.getTime() -
        MEETING_OCCUPANCY_MINUTES * 60 * 1000
    );

    const conflictWindowEnd = new Date(
      scheduledDate.getTime() +
        MEETING_OCCUPANCY_MINUTES * 60 * 1000
    );

    const {
      data: conflictingMeetings,
      error: conflictError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select("id, coach_id, scheduled_at, meeting_status")
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
      .lt("scheduled_at", conflictWindowEnd.toISOString());

    if (conflictError) {
      throw conflictError;
    }

    if (
      conflictingMeetings &&
      conflictingMeetings.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          message:
            "That date and time is not available. Please choose another date or time.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // The requested time is available.
    // Create the Zoom meeting.
    // =====================================================

    const zoomMeeting =
      await ZoomMeetingService.createEstablishmentMeeting({
        entrepreneurName: application.full_name,
        businessName: application.business_name,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes: MEETING_DURATION_MINUTES,
      });

    const now = new Date().toISOString();
    const previousMeetingStatus =
      meeting.meeting_status ?? null;

    // =====================================================
    // Schedule the Establishment Meeting.
    // =====================================================

    const {
      data: updatedMeeting,
      error: meetingUpdateError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .update({
        coach_id: assignment.coach_id,
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

    // =====================================================
    // Store Zoom host credentials privately.
    // =====================================================

    const { error: zoomSecretError } =
      await supabaseAdmin.rpc(
        "epew_store_zoom_meeting_secret",
        {
          p_meeting_id: meeting.id,
          p_zoom_host_url: zoomMeeting.startUrl,
          p_zoom_start_url: zoomMeeting.startUrl,
          p_zoom_passcode: zoomMeeting.passcode,
          p_rtms_access_context: {},
        }
      );

    if (zoomSecretError) {
      console.error(
        "Zoom private secret storage warning:",
        JSON.stringify({
          code: zoomSecretError.code ?? null,
          message: zoomSecretError.message ?? null,
          details: zoomSecretError.details ?? null,
          hint: zoomSecretError.hint ?? null,
        })
      );
    }

    // =====================================================
    // Update the Coach assignment.
    // =====================================================

    const { error: assignmentUpdateError } =
      await supabaseAdmin
        .from("coach_assignments")
        .update({
          first_interview_status: "scheduled",
          first_interview_date:
            scheduledDate.toISOString(),
        })
        .eq("id", assignment.id);

    if (assignmentUpdateError) {
      throw assignmentUpdateError;
    }

    // =====================================================
    // If this appointment follows a no-show, close the
    // recovery process as successfully rescheduled.
    // =====================================================

    await supabaseAdmin
      .from("epew_no_show_recovery_cases")
      .update({
        status: "rescheduled",
        next_required_action:
          "attend_rescheduled_meeting",
        rescheduled_at: now,
        updated_at: now,
      })
      .eq("application_id", applicationId)
      .in("status", ["active", "responded"]);

    // =====================================================
    // Prepare human-readable appointment information.
    // =====================================================

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

    // =====================================================
    // Send the appointment confirmation.
    // =====================================================

    if (
      application.email &&
      updatedMeeting.zoom_join_url &&
      updatedMeeting.zoom_meeting_id
    ) {
      try {
        await sendCoachIntroductionEmail({
          applicationId,
          assignmentId: assignment.id,
          zoomMeetingId:
            updatedMeeting.zoom_meeting_id,
          entrepreneurEmail: application.email,
          entrepreneurName: application.full_name,
          businessName:
            application.business_name ??
            "your business",
          coachName:
            assignment.coach_name ??
            "Your EPEW Personal Coach",
          coachEmail:
            assignment.coach_email ??
            "welcome@epew.us",
          proposedMeetingDate,
          proposedMeetingTime,
          zoomJoinUrl:
            updatedMeeting.zoom_join_url,
        });
      } catch (emailError) {
        console.error(
          "Appointment confirmation email failed:",
          emailError
        );
      }
    }

    // =====================================================
    // Permanent operational history.
    // =====================================================

    const wasNoShow =
      previousMeetingStatus === "no_show";

    await supabaseAdmin
      .from("epew_operational_history")
      .insert({
        application_id: applicationId,
        entrepreneur_user_id: user.id,
        event_type: wasNoShow
          ? "meeting_rescheduled"
          : "meeting_scheduled",
        event_name: wasNoShow
          ? "Establishment Meeting Rescheduled"
          : "Establishment Meeting Scheduled",
        event_description: wasNoShow
          ? "Entrepreneur selected the desired date and time. EPEW verified the requested 60-minute period was available and rescheduled the Establishment Meeting."
          : "Entrepreneur selected the desired date and time. EPEW verified the requested 60-minute period was available and scheduled the Establishment Meeting.",
        previous_status: previousMeetingStatus,
        new_status: "scheduled",
        occurred_at: now,
        actor_user_id: user.id,
        actor_role: "entrepreneur",
        actor_type: "participant",
        actor_name: application.full_name,
        decision_made_by_user_id: user.id,
        decision_made_by_role: "entrepreneur",
        decision_made_by_type: "participant",
        decision_made_by_name:
          application.full_name,
        decision_organization: "EPEW",
        decision_reason:
          "Entrepreneur requested this exact appointment date and time. EPEW automatically verified that the 60-minute appointment period was available.",
        decision_at: now,
        executed_by:
          "EMCC Direct Scheduling Engine",
        recorded_by: "EPEW EDE / IBOS",
        source_system: "EMCC Scheduling Engine",
        communication_channel: "web",
        reference_type: "coach_meeting",
        reference_id: meeting.id,
        metadata: {
          schedulingMethod:
            "participant_exact_date_time",
          coachId: assignment.coach_id,
          coachAssignmentId: assignment.id,
          requestedStartAt:
            scheduledDate.toISOString(),
          scheduledAt:
            scheduledDate.toISOString(),
          reservedUntil:
            scheduledEnd.toISOString(),
          reservationMinutes:
            MEETING_DURATION_MINUTES,
          meetingProvider: "zoom",
        },
      });

    return NextResponse.json({
      success: true,
      available: true,
      message:
        "Your requested appointment time is available and has been approved.",
      appointment: {
        scheduledAt: scheduledDate.toISOString(),
        reservedUntil:
          scheduledEnd.toISOString(),
        status: "scheduled",
        coachName:
          assignment.coach_name ??
          "Your EPEW Personal Coach",
        zoomJoinUrl:
          updatedMeeting.zoom_join_url,
      },
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : {
            code:
              typeof error === "object" && error !== null && "code" in error
                ? String(error.code)
                : null,
            message:
              typeof error === "object" && error !== null && "message" in error
                ? String(error.message)
                : String(error),
            details:
              typeof error === "object" && error !== null && "details" in error
                ? String(error.details)
                : null,
            hint:
              typeof error === "object" && error !== null && "hint" in error
                ? String(error.hint)
                : null,
          };

    console.error(
      "Entrepreneur direct appointment scheduling error:",
      JSON.stringify(errorDetails)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to schedule your appointment.",
      },
      { status: 500 }
    );
  }
}
