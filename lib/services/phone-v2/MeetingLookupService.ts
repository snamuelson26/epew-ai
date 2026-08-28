import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type PhoneMeeting = {
  id: string;
  applicationId: number;
  meetingType: string | null;
  meetingStatus: string | null;
  meetingProvider: string | null;
  scheduledAt: string | null;
  twilioCallSid: string | null;
  twilioCallStatus: string | null;
  twilioCallStartedAt: string | null;
  twilioCallAnsweredAt: string | null;
  twilioCallEndedAt: string | null;
};

export type MeetingLookupResult = {
  meeting: PhoneMeeting | null;
  canConnectNow: boolean;
  reason:
    | "meeting_ready"
    | "meeting_not_found"
    | "meeting_not_connectable";
};

const CONNECTABLE_STATUSES = new Set([
  "scheduled",
  "ready_to_start",
  "in_progress",
]);

function mapMeeting(row: {
  id: string | number;
  application_id: number;
  meeting_type: string | null;
  meeting_status: string | null;
  meeting_provider: string | null;
  scheduled_at: string | null;
  twilio_call_sid: string | null;
  twilio_call_status: string | null;
  twilio_call_started_at: string | null;
  twilio_call_answered_at: string | null;
  twilio_call_ended_at: string | null;
}): PhoneMeeting {
  return {
    id: String(row.id),
    applicationId: row.application_id,
    meetingType: row.meeting_type,
    meetingStatus: row.meeting_status,
    meetingProvider: row.meeting_provider,
    scheduledAt: row.scheduled_at,
    twilioCallSid: row.twilio_call_sid,
    twilioCallStatus: row.twilio_call_status,
    twilioCallStartedAt:
      row.twilio_call_started_at,
    twilioCallAnsweredAt:
      row.twilio_call_answered_at,
    twilioCallEndedAt:
      row.twilio_call_ended_at,
  };
}

export class MeetingLookupService {
  static async findCurrentPhoneMeeting(
    applicationId: number
  ): Promise<MeetingLookupResult> {
    const { data, error } = await supabaseAdmin
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
      .eq("application_id", applicationId)
      .eq("meeting_provider", "phone")
      .order("scheduled_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        meeting: null,
        canConnectNow: false,
        reason: "meeting_not_found",
      };
    }

    const meeting = mapMeeting(data);

    const status = String(
      meeting.meetingStatus ?? ""
    )
      .trim()
      .toLowerCase();

    const canConnectNow =
      CONNECTABLE_STATUSES.has(status);

    return {
      meeting,
      canConnectNow,
      reason: canConnectNow
        ? "meeting_ready"
        : "meeting_not_connectable",
    };
  }
}
