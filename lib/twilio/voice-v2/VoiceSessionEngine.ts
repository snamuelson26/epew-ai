import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type {
  VoiceLanguage,
  VoiceSession,
  VoiceState,
} from "./VoiceState";

type VoiceSessionRow = {
  call_sid: string;
  state: VoiceState;
  language: VoiceLanguage;
  caller_phone: string | null;
  application_id: number | null;
  entrepreneur_name: string | null;
  coach_id: string | null;
  coach_name: string | null;
  meeting_id: string | null;
  scheduling_attempt: number;
  spoken_availability: string | null;
  scheduling_choices: VoiceSession["schedulingChoices"] | null;
  selected_choice_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function rowToSession(row: VoiceSessionRow): VoiceSession {
  return {
    callSid: row.call_sid,
    state: row.state,
    language: row.language,
    callerPhone: row.caller_phone,
    applicationId: row.application_id,
    entrepreneurName: row.entrepreneur_name,
    coachId: row.coach_id,
    coachName: row.coach_name,
    meetingId: row.meeting_id,
    schedulingAttempt: row.scheduling_attempt ?? 0,
    spokenAvailability: row.spoken_availability,
    schedulingChoices: row.scheduling_choices ?? [],
    selectedChoiceId: row.selected_choice_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class VoiceSessionEngine {
  static async get(
    callSid: string
  ): Promise<VoiceSession | null> {
    const { data, error } = await supabaseAdmin
      .from("epew_voice_sessions")
      .select("*")
      .eq("call_sid", callSid)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data
      ? rowToSession(data as VoiceSessionRow)
      : null;
  }

  static async create(params: {
    callSid: string;
    callerPhone?: string | null;
    language?: VoiceLanguage;
  }): Promise<VoiceSession> {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("epew_voice_sessions")
      .insert({
        call_sid: params.callSid,
        state: "language",
        language: params.language ?? "en",
        caller_phone: params.callerPhone ?? null,
        scheduling_attempt: 0,
        scheduling_choices: [],
        metadata: {},
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return rowToSession(data as VoiceSessionRow);
  }

  static async getOrCreate(params: {
    callSid: string;
    callerPhone?: string | null;
  }): Promise<VoiceSession> {
    const existing = await this.get(params.callSid);

    if (existing) {
      return existing;
    }

    return this.create(params);
  }

  static async transition(
    callSid: string,
    state: VoiceState,
    updates: {
      language?: VoiceLanguage;
      callerPhone?: string | null;
      applicationId?: number | null;
      entrepreneurName?: string | null;
      coachId?: string | null;
      coachName?: string | null;
      meetingId?: string | number | null;
      schedulingAttempt?: number;
      spokenAvailability?: string | null;
      schedulingChoices?: VoiceSession["schedulingChoices"];
      selectedChoiceId?: string | null;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<VoiceSession> {
    const payload: Record<string, unknown> = {
      state,
      updated_at: new Date().toISOString(),
    };

    if (updates.language !== undefined) {
      payload.language = updates.language;
    }

    if (updates.callerPhone !== undefined) {
      payload.caller_phone = updates.callerPhone;
    }

    if (updates.applicationId !== undefined) {
      payload.application_id = updates.applicationId;
    }

    if (updates.entrepreneurName !== undefined) {
      payload.entrepreneur_name =
        updates.entrepreneurName;
    }

    if (updates.coachId !== undefined) {
      payload.coach_id = updates.coachId;
    }

    if (updates.coachName !== undefined) {
      payload.coach_name = updates.coachName;
    }

    if (updates.meetingId !== undefined) {
      payload.meeting_id =
        updates.meetingId == null
          ? null
          : String(updates.meetingId);
    }

    if (updates.schedulingAttempt !== undefined) {
      payload.scheduling_attempt =
        updates.schedulingAttempt;
    }

    if (updates.spokenAvailability !== undefined) {
      payload.spoken_availability =
        updates.spokenAvailability;
    }

    if (updates.schedulingChoices !== undefined) {
      payload.scheduling_choices =
        updates.schedulingChoices;
    }

    if (updates.selectedChoiceId !== undefined) {
      payload.selected_choice_id =
        updates.selectedChoiceId;
    }

    if (updates.metadata !== undefined) {
      payload.metadata = updates.metadata;
    }

    const { data, error } = await supabaseAdmin
      .from("epew_voice_sessions")
      .update(payload)
      .eq("call_sid", callSid)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return rowToSession(data as VoiceSessionRow);
  }

  static async incrementSchedulingAttempt(
    callSid: string
  ): Promise<VoiceSession> {
    const session = await this.get(callSid);

    if (!session) {
      throw new Error(
        `Voice session not found for ${callSid}.`
      );
    }

    return this.transition(
      callSid,
      session.state,
      {
        schedulingAttempt:
          session.schedulingAttempt + 1,
      }
    );
  }

  static async complete(
    callSid: string
  ): Promise<VoiceSession> {
    return this.transition(callSid, "completed");
  }
}
