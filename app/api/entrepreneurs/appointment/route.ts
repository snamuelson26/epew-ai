import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEstablishmentMeetingStartWindow,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingTiming";

export async function GET() {
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

    // =====================================================
    // Confirm that the signed-in user owns the application.
    // =====================================================

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_applications")
        .select(
          `
            id,
            user_id,
            full_name,
            business_name,
            email
          `
        )
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

    const applicationId = Number(application.id);

    // =====================================================
    // Load the current Establishment Meeting.
    // =====================================================

    const { data: meeting, error: meetingError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select(
          `
            id,
            application_id,
            coach_id,
            meeting_type,
            meeting_status,
            zoom_meeting_status,
            meeting_provider,
            scheduled_at,
            meeting_date,
            zoom_join_url,
            created_at,
            updated_at
          `
        )
        .eq("application_id", applicationId)
        .eq("meeting_type", "entrepreneur_first_meeting")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    // =====================================================
    // Load the active/current Coach assignment.
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

    if (assignmentError) {
      throw assignmentError;
    }

    // =====================================================
    // No meeting exists yet.
    // This is a normal onboarding state, not an API error.
    // =====================================================

    if (!meeting) {
      return NextResponse.json({
        success: true,
        applicationId,
        appointment: null,
        coach: assignment
          ? {
              id: assignment.coach_id ?? null,
              name: assignment.coach_name ?? null,
            }
          : null,
        recovery: null,
        action: {
          type: "waiting_for_appointment",
          label: "Appointment Being Prepared",
          href: null,
        },
      });
    }

    // =====================================================
    // Load no-show recovery state.
    //
    // This table is backend-only under RLS, so its contents
    // are filtered here before being returned to the user.
    // =====================================================

    const { data: recovery, error: recoveryError } =
      await supabaseAdmin
        .from("epew_no_show_recovery_cases")
        .select(
          `
            id,
            meeting_id,
            status,
            no_show_detected_at,
            recovery_started_at,
            recovery_deadline_at,
            next_required_action,
            rescheduled_at,
            closed_at
          `
        )
        .eq("application_id", applicationId)
        .eq("meeting_id", meeting.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (recoveryError) {
      throw recoveryError;
    }

    const meetingStatus = String(
      meeting.meeting_status ?? ""
    ).toLowerCase();

    const recoveryStatus = recovery
      ? String(recovery.status ?? "").toLowerCase()
      : null;

    const zoomMeetingStatus = String(
      meeting.zoom_meeting_status ?? ""
    ).toLowerCase();

    const zoomHasEnded =
      zoomMeetingStatus === "ended";

    const meetingProvider = String(
      meeting.meeting_provider ?? "zoom"
    ).toLowerCase();

    const providerHasEnded =
      meetingProvider === "zoom"
        ? zoomHasEnded
        : false;

    const startWindow =
      getEstablishmentMeetingStartWindow(
        meeting.scheduled_at
      );

    /*
     * Defensive lifecycle normalization:
     * a future appointment must never appear entrepreneur-facing
     * as already in progress.
     */
    const entrepreneurFacingMeetingStatus =
      meetingStatus === "in_progress" &&
      startWindow.isTooEarly
        ? "scheduled"
        : meetingStatus;

    // =====================================================
    // Determine the entrepreneur-facing action.
    // =====================================================

    let action: {
      type:
        | "join_meeting"
        | "meeting_in_progress"
        | "change_appointment"
        | "reschedule_appointment"
        | "scheduling_in_progress"
        | "appointment_completed"
        | "recovery_closed"
        | "choose_appointment"
        | "waiting_for_appointment";
      label: string;
      href: string | null;
    };

    if (
      entrepreneurFacingMeetingStatus === "no_show" &&
      recoveryStatus === "active"
    ) {
      action = {
        type: "reschedule_appointment",
        label: "Reschedule Appointment",
        href: `/entrepreneurs/availability?applicationId=${applicationId}`,
      };
    } else if (
      recoveryStatus === "responded"
    ) {
      action = {
        type: "scheduling_in_progress",
        label: "Scheduling in Progress",
        href: `/entrepreneurs/availability?applicationId=${applicationId}`,
      };
    } else if (
      recoveryStatus === "closed_due_to_inactivity"
    ) {
      action = {
        type: "recovery_closed",
        label: "Recovery Period Closed",
        href: null,
      };
    } else if (
      entrepreneurFacingMeetingStatus === "completed"
    ) {
      action = {
        type: "appointment_completed",
        label: "Meeting Completed",
        href: null,
      };
    } else if (
      entrepreneurFacingMeetingStatus === "ready_to_schedule"
    ) {
      action = {
        type: "choose_appointment",
        label: "Choose Appointment",
        href: `/entrepreneurs/availability?applicationId=${applicationId}`,
      };
    } else if (
      entrepreneurFacingMeetingStatus === "in_progress" &&
      !providerHasEnded
    ) {
      action = {
        type: "meeting_in_progress",
        label: "Meeting in Progress",
        href: null,
      };
    } else if (
      ["scheduled", "ready_to_start"].includes(
        entrepreneurFacingMeetingStatus
      ) &&
      startWindow.isWithinStartWindow &&
      !providerHasEnded
    ) {
      action = {
        type: "join_meeting",
        label: "Join Meeting",
        href:
          meetingProvider === "zoom"
            ? meeting.zoom_join_url ?? null
            : null,
      };
    } else if (providerHasEnded) {
      action = {
        type: "waiting_for_appointment",
        label: "Meeting Ended",
        href: null,
      };
    } else {
      action = {
        type: "waiting_for_appointment",
        label: "Appointment Being Prepared",
        href: null,
      };
    }

    const canJoin =
      ["scheduled", "ready_to_start"].includes(
        entrepreneurFacingMeetingStatus
      ) &&
      startWindow.isWithinStartWindow &&
      !providerHasEnded &&
      (
        meetingProvider === "phone" ||
        meetingProvider === "whatsapp" ||
        (
          meetingProvider === "zoom" &&
          Boolean(meeting.zoom_join_url)
        )
      ) &&
      recoveryStatus !== "active" &&
      recoveryStatus !== "responded";

    const canChange =
      entrepreneurFacingMeetingStatus === "scheduled" &&
      startWindow.isTooEarly &&
      (
        !recoveryStatus ||
        recoveryStatus === "rescheduled"
      );

    const canReschedule =
      entrepreneurFacingMeetingStatus === "no_show" &&
      recoveryStatus === "active";

    return NextResponse.json({
      success: true,

      applicationId,

      appointment: {
        id: meeting.id,
        type: "Establishment Meeting",
        status: entrepreneurFacingMeetingStatus,
        zoomStatus:
          meeting.zoom_meeting_status ?? null,
        scheduledAt:
          meeting.scheduled_at ?? null,
        provider: meetingProvider,
        joinUrl:
          meeting.zoom_join_url ?? null,
      },

      controls: {
        canJoin,
        joinUrl:
          canJoin && meetingProvider === "zoom"
            ? meeting.zoom_join_url ?? null
            : null,

        canChange,
        changeHref:
          canChange
            ? `/entrepreneurs/availability?applicationId=${applicationId}`
            : null,

        canReschedule,
        rescheduleHref:
          canReschedule
            ? `/entrepreneurs/availability?applicationId=${applicationId}`
            : null,
      },

      coach: assignment
        ? {
            id: assignment.coach_id ?? null,
            name: assignment.coach_name ?? null,
          }
        : null,

      recovery: recovery
        ? {
            status: recovery.status,
            noShowDetectedAt:
              recovery.no_show_detected_at,
            recoveryStartedAt:
              recovery.recovery_started_at,
            recoveryDeadlineAt:
              recovery.recovery_deadline_at,
            nextRequiredAction:
              recovery.next_required_action,
            rescheduledAt:
              recovery.rescheduled_at,
            closedAt:
              recovery.closed_at,
          }
        : null,

      action,
    });
  } catch (error) {
    console.error(
      "Unable to load entrepreneur appointment:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load your appointment.",
      },
      { status: 500 }
    );
  }
}
