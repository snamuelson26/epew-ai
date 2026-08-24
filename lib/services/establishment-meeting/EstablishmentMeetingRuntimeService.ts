import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  generateEstablishmentMeetingTurn,
  type EstablishmentMeetingMessage,
  type EstablishmentMeetingStage,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingCoach";

export type EstablishmentMeetingRuntimeInput = {
  applicationId: number;
  stage: EstablishmentMeetingStage;
  conversation?: EstablishmentMeetingMessage[];
  stageNotes?: Record<string, unknown>;
  coachId?: string | null;
  coachName?: string | null;
  coachEmail?: string | null;
  isAdmin?: boolean;
};

export type EstablishmentMeetingRuntimeResult = {
  stage: EstablishmentMeetingStage;
  message: EstablishmentMeetingMessage;
  responseId: string;
  conversationState: Record<string, unknown>;
  meetingStartedAt: string;
  meetingStatus: "in_progress";
};

export class EstablishmentMeetingRuntimeService {

  private static async loadApplication(applicationId: number) {
    const { data, error } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        business_name,
        business_type,
        business_description,
        funding_request,
        questionnaire_answers,
        questionnaire_status,
        status,
        created_at
      `)
      .eq("id", applicationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  private static async loadCommunicationPreference(
    applicationId: number,
    entrepreneurUserId: string | null,
    applicantEmail?: string | null
  ) {
    const selectFields = `
      communication_language,
      additional_preferred_language,
      priority_channel,
      email,
      phone
    `;

    if (entrepreneurUserId) {
      const { data, error } = await supabaseAdmin
        .from("entrepreneur_reminder_contacts")
        .select(selectFields)
        .eq("user_id", entrepreneurUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    }

    const { data: byApplication, error: applicationError } =
      await supabaseAdmin
        .from("entrepreneur_reminder_contacts")
        .select(selectFields)
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (byApplication) {
      return byApplication;
    }

    const normalizedEmail =
      applicantEmail?.trim().toLowerCase();

    if (normalizedEmail) {
      const { data: byEmail, error: emailError } =
        await supabaseAdmin
          .from("entrepreneur_reminder_contacts")
          .select(selectFields)
          .ilike("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (emailError) {
        throw emailError;
      }

      if (byEmail) {
        return byEmail;
      }
    }

    return null;
  }

  private static async loadAssignment(
    applicationId: number,
    coachId?: string | null,
    coachEmail?: string | null,
    isAdmin = false
  ) {
    let query = supabaseAdmin
      .from("coach_assignments")
      .select(`
        id,
        application_id,
        entrepreneur_id,
        coach_id,
        coach_name,
        coach_email,
        assignment_status,
        acknowledgment_status,
        assigned_at,
        accepted_at,
        first_interview_status,
        first_interview_date
      `)
      .eq("application_id", applicationId)
      .not(
        "assignment_status",
        "in",
        '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
      );

    if (!isAdmin && coachId) {
      query = query.eq("coach_id", coachId);
    }

    const { data, error } = await query
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (
      data &&
      !isAdmin &&
      coachEmail &&
      data.coach_email &&
      data.coach_email.trim().toLowerCase() !==
        coachEmail.trim().toLowerCase()
    ) {
      return null;
    }

    return data;
  }

  private static async loadMeeting(applicationId: number) {
    const { data, error } = await supabaseAdmin
      .from("epew_coach_meetings")
      .select("*")
      .eq("application_id", applicationId)
      .eq(
        "meeting_type",
        "entrepreneur_first_meeting"
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  static async runTurn(
    input: EstablishmentMeetingRuntimeInput
  ): Promise<EstablishmentMeetingRuntimeResult> {
    const application = await this.loadApplication(
      input.applicationId
    );

    if (!application) {
      throw new Error(
        "Entrepreneur application not found."
      );
    }

    const assignment = await this.loadAssignment(
      input.applicationId,
      input.coachId ?? null,
      input.coachEmail ?? null,
      Boolean(input.isAdmin)
    );

    if (!assignment) {
      throw new Error(
        "No active Coach assignment exists for this application."
      );
    }

    const meeting = await this.loadMeeting(
      input.applicationId
    );

    if (!meeting) {
      throw new Error(
        "Establishment Meeting record has not been prepared yet."
      );
    }

    const meetingProvider = String(
      meeting.meeting_provider ?? "zoom"
    )
      .trim()
      .toLowerCase();

    if (meetingProvider === "phone") {
      const phoneSessionActive = Boolean(
        meeting.twilio_call_started_at ||
        meeting.twilio_call_answered_at ||
        ["queued", "ringing", "in-progress"].includes(
          String(meeting.twilio_call_status ?? "")
            .trim()
            .toLowerCase()
        )
      );

      if (!phoneSessionActive) {
        throw new Error(
          "The EPEW phone meeting has not started yet."
        );
      }
    } else if (!meeting.zoom_coach_joined_at) {
      /*
       * Preserve the existing Zoom requirement for
       * Zoom and legacy meeting records.
       */
      throw new Error(
        "The EPEW Personal Coach has not joined the Zoom meeting yet."
      );
    }

    if (meeting.started_at) {
      const meetingStartedAt =
        new Date(meeting.started_at).getTime();

      const meetingEndsAt =
        meetingStartedAt + 60 * 60 * 1000;

      if (
        !Number.isNaN(meetingStartedAt) &&
        Date.now() >= meetingEndsAt
      ) {
        throw new Error(
          "This EPEW Coach meeting has reached the 60-minute limit. The meeting is closed and must continue in a scheduled continuation session."
        );
      }
    }

    const communication =
      await this.loadCommunicationPreference(
        input.applicationId,
        application.user_id ?? null,
        application.email ?? null
      );

    const conversation =
      Array.isArray(input.conversation)
        ? input.conversation
            .filter(
              (
                message
              ): message is EstablishmentMeetingMessage =>
                Boolean(
                  message &&
                    (message.role === "coach" ||
                      message.role === "entrepreneur") &&
                    typeof message.content === "string" &&
                    message.content.trim()
                )
            )
            .map((message) => ({
              role: message.role,
              content: message.content.trim(),
            }))
        : [];

    const coachName =
      assignment.coach_name ??
      input.coachName ??
      "Your EPEW Personal Coach";

    const preferredLanguage =
      communication?.communication_language ??
      meeting.preferred_language ??
      "English";

    const result =
      await generateEstablishmentMeetingTurn({
        stage: input.stage,
        participant: {
          applicationId: input.applicationId,
          entrepreneurName:
            application.full_name ?? "Entrepreneur",
          businessName:
            application.business_name ?? null,
          businessType:
            application.business_type ?? null,
          businessDescription:
            application.business_description ?? null,
          preferredLanguage:
            String(preferredLanguage),
          coachName,
          applicationStatus:
            application.status ?? null,
          questionnaireStatus:
            application.questionnaire_status ?? null,
          questionnaireAnswers:
            application.questionnaire_answers ?? null,
          fundingRequest:
            application.funding_request ?? null,
          knownInformation: {
            entrepreneurSnapshot:
              meeting.entrepreneur_snapshot ?? {},
            businessSnapshot:
              meeting.business_snapshot ?? {},
            entrepreneurGoals:
              meeting.entrepreneur_goals ?? [],
            meetingSummary:
              meeting.meeting_summary ?? null,
            entrepreneurSummary:
              meeting.entrepreneur_summary ?? null,
            businessSummary:
              meeting.business_summary ?? null,
            majorObstacles:
              meeting.major_obstacles ?? [],
            businessNeeds:
              meeting.business_needs ?? [],
            missingDocuments:
              meeting.missing_documents ?? [],
            verificationItems:
              meeting.verification_items ?? [],
          },
          missingInformation:
            Array.isArray(meeting.missing_information)
              ? meeting.missing_information.map(String)
              : [],
        },
        conversation,
        stageNotes: {
          savedRuntimeContext:
            meeting.meeting_runtime_context &&
            typeof meeting.meeting_runtime_context ===
              "object" &&
            !Array.isArray(
              meeting.meeting_runtime_context
            )
              ? meeting.meeting_runtime_context
              : {},
          savedConversationState:
            meeting.meeting_conversation_state &&
            typeof meeting.meeting_conversation_state ===
              "object" &&
            !Array.isArray(
              meeting.meeting_conversation_state
            )
              ? meeting.meeting_conversation_state
              : {},
          ...(
            input.stageNotes &&
            typeof input.stageNotes === "object"
              ? input.stageNotes
              : {}
          ),
        },
      });

    const coachMessage: EstablishmentMeetingMessage = {
      role: "coach",
      content: result.text,
    };

    const persistedMessages: EstablishmentMeetingMessage[] = [
      ...conversation,
      coachMessage,
    ];

    const existingRuntimeContext =
      meeting.meeting_runtime_context &&
      typeof meeting.meeting_runtime_context ===
        "object" &&
      !Array.isArray(
        meeting.meeting_runtime_context
      )
        ? meeting.meeting_runtime_context
        : {};

    const existingActionLog =
      Array.isArray(meeting.meeting_action_log)
        ? meeting.meeting_action_log
        : [];

    const now = new Date().toISOString();

    const conversationState = {
      version:
        "establishment-meeting-conversation-v1",
      stage: input.stage,
      messages: persistedMessages,
      responseId: result.responseId,
      updatedAt: now,
    };

    const runtimeContext = {
      ...existingRuntimeContext,
      establishmentMeeting: {
        stage: input.stage,
        preferredLanguage: String(
          preferredLanguage
        ),
        lastResponseId: result.responseId,
        lastSavedAt: now,
        messageCount: persistedMessages.length,
      },
    };

    if (
      !meeting.started_at ||
      meeting.meeting_status !== "in_progress"
    ) {
      if (meetingProvider === "phone") {
        throw new Error(
          "The EPEW Establishment Meeting is not currently active by phone."
        );
      }

      throw new Error(
        "The EPEW Establishment Meeting is not currently active in Zoom."
      );
    }

    const meetingUpdate: Record<
      string,
      unknown
    > = {
      meeting_conversation_state:
        conversationState,
      meeting_runtime_context:
        runtimeContext,
      meeting_action_log: [
        ...existingActionLog,
        {
          event:
            "personal_coach_conversation_saved",
          stage: input.stage,
          responseId: result.responseId,
          messageCount:
            persistedMessages.length,
          actor: "EPEW Personal Coach",
          authority:
            "EPEW Establishment Meeting Engine",
          recordedAt: now,
        },
      ],
    };

    const { error: persistenceError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .update(meetingUpdate)
        .eq("id", meeting.id);

    if (persistenceError) {
      throw persistenceError;
    }

    return {
      stage: input.stage,
      message: coachMessage,
      responseId: result.responseId,
      conversationState,
      meetingStartedAt:
        meeting.started_at,
      meetingStatus: "in_progress",
    };
  }
}
