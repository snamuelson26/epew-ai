import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEstablishmentMeetingStartWindow,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingTiming";

export type MeetingDecisionOutcome =
  | "available_now"
  | "scheduled_later"
  | "reschedule_required"
  | "no_appointment"
  | "completed"
  | "unavailable";

export type MeetingDecision = {
  outcome: MeetingDecisionOutcome;
  meetingId: string | null;
  meetingStatus: string | null;
  scheduledAt: string | null;
  recoveryStatus: string | null;
  nextRequiredAction: string | null;
};

const ACTIVE_RECOVERY_STATUSES =
  new Set([
    "active",
    "responded",
  ]);

const COMPLETED_MEETING_STATUSES =
  new Set([
    "completed",
  ]);

const NON_CONNECTABLE_TERMINAL_STATUSES =
  new Set([
    "cancelled",
    "canceled",
  ]);

export class MeetingDecisionService {
  static async decide(
    applicationId: number,
    now = new Date()
  ): Promise<MeetingDecision> {
    const {
      data: meetingRow,
      error: meetingError,
    } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select(`
        id,
        meeting_status,
        scheduled_at
      `)
      .eq(
        "application_id",
        applicationId
      )
      .eq(
        "meeting_provider",
        "phone"
      )
      .order(
        "scheduled_at",
        {
          ascending: false,
          nullsFirst: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (meetingError) {
      throw meetingError;
    }

    if (!meetingRow) {
      return {
        outcome: "no_appointment",
        meetingId: null,
        meetingStatus: null,
        scheduledAt: null,
        recoveryStatus: null,
        nextRequiredAction: null,
      };
    }

    const meetingId =
      String(meetingRow.id);

    const rawStatus =
      String(
        meetingRow.meeting_status ?? ""
      )
        .trim()
        .toLowerCase();

    const scheduledAt =
      meetingRow.scheduled_at ??
      null;

    const {
      data: recoveryRow,
      error: recoveryError,
    } = await supabaseAdmin
      .from(
        "epew_no_show_recovery_cases"
      )
      .select(`
        status,
        next_required_action,
        created_at
      `)
      .eq(
        "meeting_id",
        meetingId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (recoveryError) {
      throw recoveryError;
    }

    const recoveryStatus =
      recoveryRow?.status
        ? String(
            recoveryRow.status
          )
            .trim()
            .toLowerCase()
        : null;

    const nextRequiredAction =
      recoveryRow?.next_required_action ??
      null;

    if (
      ACTIVE_RECOVERY_STATUSES.has(
        recoveryStatus ?? ""
      )
    ) {
      return {
        outcome:
          "reschedule_required",
        meetingId,
        meetingStatus:
          rawStatus || null,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction,
      };
    }

    if (
      COMPLETED_MEETING_STATUSES.has(
        rawStatus
      )
    ) {
      return {
        outcome: "completed",
        meetingId,
        meetingStatus: rawStatus,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction,
      };
    }

    if (
      NON_CONNECTABLE_TERMINAL_STATUSES
        .has(rawStatus)
    ) {
      return {
        outcome: "unavailable",
        meetingId,
        meetingStatus: rawStatus,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction,
      };
    }

    const startWindow =
      getEstablishmentMeetingStartWindow(
        scheduledAt,
        now
      );

    /*
     * A stale raw in_progress value on a
     * future meeting must behave like
     * scheduled_later, not connect now.
     */
    if (startWindow.isTooEarly) {
      return {
        outcome:
          "scheduled_later",
        meetingId,
        meetingStatus:
          rawStatus || "scheduled",
        scheduledAt,
        recoveryStatus,
        nextRequiredAction,
      };
    }

    if (
      startWindow
        .isWithinStartWindow &&
      (
        rawStatus === "scheduled" ||
        rawStatus ===
          "ready_to_start" ||
        rawStatus === "in_progress"
      )
    ) {
      return {
        outcome: "available_now",
        meetingId,
        meetingStatus: rawStatus,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction,
      };
    }

    if (
      startWindow.isPastStartWindow &&
      (
        rawStatus === "scheduled" ||
        rawStatus === "ready_to_start" ||
        rawStatus === "in_progress"
      )
    ) {
      return {
        outcome:
          "reschedule_required",
        meetingId,
        meetingStatus: rawStatus,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction:
          nextRequiredAction ??
          "submit_new_availability",
      };
    }

    if (
      rawStatus === "no_show"
    ) {
      return {
        outcome:
          "reschedule_required",
        meetingId,
        meetingStatus: rawStatus,
        scheduledAt,
        recoveryStatus,
        nextRequiredAction:
          nextRequiredAction ??
          "submit_new_availability",
      };
    }

    return {
      outcome: "unavailable",
      meetingId,
      meetingStatus:
        rawStatus || null,
      scheduledAt,
      recoveryStatus,
      nextRequiredAction,
    };
  }
}
