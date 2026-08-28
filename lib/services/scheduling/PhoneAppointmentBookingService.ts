import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MEETING_DURATION_MINUTES = 60;
const MEETING_BUFFER_MINUTES = 10;
const MEETING_OCCUPANCY_MINUTES =
  MEETING_DURATION_MINUTES + MEETING_BUFFER_MINUTES;

export class PhoneAppointmentBookingService {
  static async bookMatch(params: {
    applicationId: number;
    matchId: string;
    callSid?: string | null;
    language?: string | null;
  }) {
    const {
      applicationId,
      matchId,
      callSid,
      language,
    } = params;

    const {
      data: match,
      error: matchError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .select(`
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
      `)
      .eq("id", matchId)
      .eq("application_id", applicationId)
      .eq("status", "available")
      .eq("exposed_to_participant", true)
      .maybeSingle();

    if (matchError) {
      throw matchError;
    }

    if (!match) {
      throw new Error(
        "The selected appointment is no longer available."
      );
    }

    const scheduledDate =
      new Date(match.proposed_start_at);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date()
    ) {
      throw new Error(
        "The selected appointment time is no longer valid."
      );
    }

    const scheduledEnd = new Date(
      scheduledDate.getTime() +
        MEETING_DURATION_MINUTES * 60 * 1000
    );

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(
        "id, user_id, full_name, email, business_name"
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      throw new Error(
        "Entrepreneur application not found."
      );
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await supabaseAdmin
      .from("coach_assignments")
      .select(`
        id,
        coach_id,
        coach_name,
        coach_email,
        assignment_status
      `)
      .eq("id", match.coach_assignment_id)
      .eq("application_id", applicationId)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment?.coach_id) {
      throw new Error(
        "Personal Coach assignment could not be confirmed."
      );
    }

    if (assignment.coach_id !== match.coach_id) {
      throw new Error(
        "The selected appointment no longer matches the current Personal Coach."
      );
    }

    const {
      data: meeting,
      error: meetingError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select("*")
      .eq("application_id", applicationId)
      .eq(
        "meeting_type",
        "entrepreneur_first_meeting"
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!meeting) {
      throw new Error(
        "Establishment Meeting record could not be found."
      );
    }

    const conflictWindowStart = new Date(
      scheduledDate.getTime() -
        MEETING_OCCUPANCY_MINUTES *
          60 *
          1000
    );

    const conflictWindowEnd = new Date(
      scheduledDate.getTime() +
        MEETING_OCCUPANCY_MINUTES *
          60 *
          1000
    );

    const {
      data: conflictingMeetings,
      error: conflictError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select(
        "id, coach_id, scheduled_at, meeting_status"
      )
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
        conflictWindowEnd.toISOString()
      );

    if (conflictError) {
      throw conflictError;
    }

    if (
      conflictingMeetings &&
      conflictingMeetings.length > 0
    ) {
      throw new Error(
        "The selected appointment is no longer available."
      );
    }

    /*
     * Claim the scheduling match before changing the meeting.
     *
     * Only a match that is still "available" can become "selected".
     * If another request already consumed it, this update returns no row
     * and we stop instead of double-booking the same option.
     */
    const {
      data: claimedMatch,
      error: claimError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .update({
        status: "selected",
      })
      .eq("id", match.id)
      .eq("application_id", applicationId)
      .eq("status", "available")
      .select("id")
      .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (!claimedMatch) {
      throw new Error(
        "The selected appointment is no longer available."
      );
    }

    const now = new Date().toISOString();
    const previousMeetingStatus =
      meeting.meeting_status ?? null;

    const {
      data: updatedMeeting,
      error: meetingUpdateError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .update({
        coach_id: assignment.coach_id,
        scheduled_at:
          scheduledDate.toISOString(),
        meeting_date:
          scheduledDate.toISOString(),
        meeting_status: "scheduled",
        meeting_provider: "phone",

        zoom_meeting_id: null,
        zoom_meeting_uuid: null,
        zoom_join_url: null,
        zoom_meeting_status: null,

        started_at: null,
        completed_at: null,

        twilio_call_sid: null,
        twilio_call_status: null,
        twilio_call_started_at: null,
        twilio_call_answered_at: null,
        twilio_call_ended_at: null,

        zoom_participant_joined_at: null,
        zoom_coach_joined_at: null,
        coach_session_started_at: null,
        coach_session_ended_at: null,
        coach_session_status:
          "not_started",

        updated_at: now,
      })
      .eq("id", meeting.id)
      .select("*")
      .single();

    if (meetingUpdateError) {
      throw meetingUpdateError;
    }

    const {
      error: assignmentUpdateError,
    } = await supabaseAdmin
      .from("coach_assignments")
      .update({
        first_interview_status:
          "scheduled",
        first_interview_date:
          scheduledDate.toISOString(),
      })
      .eq("id", assignment.id);

    if (assignmentUpdateError) {
      throw assignmentUpdateError;
    }

    const {
      error: availabilityUpdateError,
    } = await supabaseAdmin
      .from("epew_participant_availability")
      .update({
        status: "scheduled",
        updated_at: now,
      })
      .eq("id", match.availability_id);

    if (availabilityUpdateError) {
      throw availabilityUpdateError;
    }

    const {
      error: withdrawMatchesError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .update({
        status: "withdrawn",
      })
      .eq(
        "availability_id",
        match.availability_id
      )
      .neq("id", match.id)
      .eq("status", "available");

    if (withdrawMatchesError) {
      console.error(
        "Unable to withdraw unused scheduling matches:",
        withdrawMatchesError
      );
    }

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
      .in("status", [
        "active",
        "responded",
      ]);

    const wasNoShow =
      previousMeetingStatus === "no_show";

    const {
      error: historyError,
    } = await supabaseAdmin
      .from("epew_operational_history")
      .insert({
        application_id: applicationId,
        entrepreneur_user_id:
          application.user_id ?? null,

        event_type: wasNoShow
          ? "meeting_rescheduled"
          : "meeting_scheduled",

        event_name: wasNoShow
          ? "Establishment Meeting Rescheduled"
          : "Establishment Meeting Scheduled",

        event_description: wasNoShow
          ? "Entrepreneur selected a matched appointment by telephone and EPEW rescheduled the Establishment Meeting."
          : "Entrepreneur selected a matched appointment by telephone and EPEW scheduled the Establishment Meeting.",

        previous_status:
          previousMeetingStatus,
        new_status: "scheduled",

        occurred_at: now,

        actor_user_id:
          application.user_id ?? null,
        actor_role: "entrepreneur",
        actor_type: "participant",
        actor_name:
          application.full_name,

        decision_made_by_user_id:
          application.user_id ?? null,
        decision_made_by_role:
          "entrepreneur",
        decision_made_by_type:
          "participant",
        decision_made_by_name:
          application.full_name,
        decision_organization: "EPEW",
        decision_reason:
          "Entrepreneur selected one of the real appointment options offered through the EPEW telephone scheduling system.",
        decision_at: now,

        executed_by:
          "EMCC Phone Scheduling Engine",
        recorded_by:
          "EPEW EDE / IBOS",
        source_system:
          "EMCC Scheduling Engine",
        communication_channel:
          "phone",

        reference_type:
          "coach_meeting",
        reference_id:
          meeting.id,

        metadata: {
          schedulingMethod:
            "phone_private_match_selection",
          coachId:
            assignment.coach_id,
          coachAssignmentId:
            assignment.id,
          availabilityId:
            match.availability_id,
          scheduleMatchId:
            match.id,
          scheduledAt:
            scheduledDate.toISOString(),
          reservedUntil:
            scheduledEnd.toISOString(),
          reservationMinutes:
            MEETING_DURATION_MINUTES,
          meetingProvider: "phone",
          twilioCallSid:
            callSid ?? null,
          preferredLanguage:
            language ?? null,
        },
      });

    if (historyError) {
      console.error(
        "Phone appointment history write failed:",
        historyError
      );
    }

    /*
     * The appointment is now permanently scheduled.
     * Consume the selected private match so it cannot be offered again.
     */
    const {
      error: selectedMatchScheduleError,
    } = await supabaseAdmin
      .from("epew_private_schedule_matches")
      .update({
        status: "scheduled",
      })
      .eq("id", match.id)
      .eq("status", "selected");

    if (selectedMatchScheduleError) {
      throw selectedMatchScheduleError;
    }

    return {
      success: true,
      meetingId: updatedMeeting.id,
      scheduledAt:
        scheduledDate.toISOString(),
      reservedUntil:
        scheduledEnd.toISOString(),
      coachName:
        assignment.coach_name ??
        "Your EPEW Personal Coach",
      meetingProvider: "phone",
    };
  }
}
