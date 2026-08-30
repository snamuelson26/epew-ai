export type VoiceLanguage = "en" | "ht" | "es" | "fr";

export type VoiceState =
  | "language"
  | "identify_caller"
  | "confirm_account"
  | "check_meeting"
  | "meeting_menu"
  | "meeting_connect"
  | "main_menu"
  | "schedule_offer"
  | "schedule_capture"
  | "schedule_interpret"
  | "schedule_choices"
  | "schedule_confirm"
  | "member_assistance"
  | "member_assistance_followup"
  | "prospect_intake"
  | "completed"
  | "recovery";

export type VoiceSession = {
  callSid: string;
  state: VoiceState;
  language: VoiceLanguage;

  callerPhone?: string | null;

  applicationId?: number | null;
  entrepreneurName?: string | null;

  coachId?: string | null;
  coachName?: string | null;

  meetingId?: string | number | null;

  schedulingAttempt: number;

  spokenAvailability?: string | null;

  schedulingChoices?: Array<{
    id: string;
    proposedStartAt: string;
    reservedUntil?: string | null;
  }>;

  selectedChoiceId?: string | null;

  createdAt: string;
  updatedAt: string;
};
