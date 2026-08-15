// =======================================================
// EPEW – EDE – EMCC
// Entrepreneur First Meeting API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ZoomMeetingService } from "@/lib/zoom/ZoomMeetingService";
import { sendCoachIntroductionEmail } from "@/lib/email/sendCoachIntroductionEmail";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type MeetingUpdateRequest = {
  action?:
    | "prepare"
    | "schedule"
    | "start"
    | "save"
    | "complete";

  scheduledAt?: string | null;

  missionPresented?: boolean;
  unitySupportExplained?: boolean;
  missionAcknowledged?: boolean;

  entrepreneurSummary?: string;
  businessSummary?: string;
  primaryGoal?: string;
  businessStatusSummary?: string;
  marketCustomerSummary?: string;
  revenueStatusSummary?: string;
  fundingNeedSummary?: string;

  majorObstacles?: string[];
  businessNeeds?: string[];
  missingDocuments?: string[];
  complianceIssues?: string[];
  risksAndConcerns?: string[];
  verificationItems?: string[];
  potentialTasks?: string[];

  coachNotes?: string;
  meetingSummary?: string;
  nextRequiredAction?: string;
  followUpAt?: string | null;

  commitmentScore?: number | null;
  preparationScore?: number | null;
  organizationScore?: number | null;
  communicationScore?: number | null;
  businessPotentialScore?: number | null;
  readinessScore?: number | null;

  assessmentNotes?: Record<string, unknown>;
};

type AuthorizedCoachContext = {
  userId: string;
  email: string;
  role: string;
  coach: {
    id: string;
    full_name: string;
    email: string | null;
    status: string;
  } | null;
  isAdmin: boolean;
};

function normalizeRole(role: string | null | undefined) {
  return role?.trim().toLowerCase() ?? "";
}

function isCoachRole(role: string) {
  return (
    role === "coach" ||
    role === "personal coach" ||
    role === "personal_coach"
  );
}

function isAdminRole(role: string) {
  return role === "admin" || role === "administrator";
}

function scoreOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0 ||
    numberValue > 100
  ) {
    throw new Error(
      "Meeting assessment scores must be between 0 and 100."
    );
  }

  return Math.round(numberValue);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

async function authorizeCoachOrAdmin(): Promise<
  | {
      ok: true;
      context: AuthorizedCoachContext;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "The authenticated account does not have an email address.",
        },
        { status: 400 }
      ),
    };
  }

  const { data: roleRows, error: roleError } =
    await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

  if (roleError) {
    throw roleError;
  }

  const roles = (roleRows ?? [])
    .map((row) => normalizeRole(row.role))
    .filter(Boolean);

  const adminRole = roles.find(isAdminRole);
  const coachRole = roles.find(isCoachRole);

  if (!adminRole && !coachRole) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Coach or administrator access is required.",
        },
        { status: 403 }
      ),
    };
  }

  const isAdmin = Boolean(adminRole);

  let coach: AuthorizedCoachContext["coach"] = null;

  if (!isAdmin || coachRole) {
    const {
      data: coachRecord,
      error: coachError,
    } = await supabaseAdmin
      .from("epew_coaches")
      .select("id, full_name, email, status")
      .ilike("email", email)
      .maybeSingle();

    if (coachError) {
      throw coachError;
    }

    if (!isAdmin && !coachRecord) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "No EPEW Coach profile is connected to this account.",
          },
          { status: 404 }
        ),
      };
    }

    if (
      !isAdmin &&
      coachRecord &&
      coachRecord.status !== "active" &&
      coachRecord.status !== "available"
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "This Coach profile is not currently active or available.",
          },
          { status: 403 }
        ),
      };
    }

    coach = coachRecord ?? null;
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      email,
      role: adminRole ?? coachRole ?? "",
      coach,
      isAdmin,
    },
  };
}

async function loadApplication(applicationId: number) {
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

async function loadCommunicationPreference(
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

async function loadAssignment(
  applicationId: number,
  auth: AuthorizedCoachContext
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

  if (!auth.isAdmin) {
    if (!auth.coach) {
      return null;
    }

    query = query.eq("coach_id", auth.coach.id);
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
    !auth.isAdmin &&
    data.coach_email &&
    data.coach_email.trim().toLowerCase() !==
      auth.email
  ) {
    return null;
  }

  return data;
}

async function loadMeeting(applicationId: number) {
  const { data, error } = await supabaseAdmin
    .from("epew_coach_meetings")
    .select("*")
    .eq("application_id", applicationId)
    .eq("meeting_type", "entrepreneur_first_meeting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function buildInitialPreparation(
  application: Record<string, any>,
  communication: Record<string, any> | null
) {
  const answers = Array.isArray(
    application.questionnaire_answers
  )
    ? application.questionnaire_answers
    : [];

  const missingInformation: string[] = [];

  if (!application.phone) {
    missingInformation.push("Entrepreneur phone number");
  }

  if (!application.business_name) {
    missingInformation.push("Business name");
  }

  if (!application.business_type) {
    missingInformation.push("Business type / industry");
  }

  if (!application.business_description) {
    missingInformation.push("Business description");
  }

  if (
    !application.questionnaire_answers ||
    application.questionnaire_status !== "Completed"
  ) {
    missingInformation.push(
      "Completed Entrepreneur Questionnaire"
    );
  }

  const entrepreneurGoals: string[] = [];

  if (answers[3]) {
    entrepreneurGoals.push(
      `Five-year vision: ${String(answers[3])}`
    );
  }

  if (answers[9]) {
    entrepreneurGoals.push(
      `Funding need: ${String(answers[9])}`
    );
  }

  const recommendedQuestions = [
    "What is the most important result you want to accomplish with EPEW?",
    "What is the biggest obstacle preventing your business from moving forward today?",
    "What would greater financial stability and business success change for you, your family, or your community?",
    "What support do you believe you need first?",
    "What information or documents do we still need to verify before creating your development plan?",
  ];

  return {
    entrepreneurSnapshot: {
      applicationId: application.id,
      name: application.full_name,
      email: application.email,
      phone: application.phone,
      applicationStatus: application.status,
      questionnaireStatus:
        application.questionnaire_status,
      preferredLanguage:
        communication?.communication_language ?? null,
      additionalPreferredLanguage:
        communication?.additional_preferred_language ??
        null,
      preferredCommunicationChannel:
        communication?.priority_channel ?? null,
    },

    businessSnapshot: {
      businessName: application.business_name,
      businessType: application.business_type,
      description: application.business_description,
      statedFundingRequest:
        application.funding_request ?? null,
    },

    entrepreneurGoals,

    missingInformation,

    recommendedQuestions,

    aiPreparation: {
      version: "emcc-first-meeting-v1",
      purpose:
        "Prepare the Coach for the Entrepreneur Establishment Meeting using information already held by EPEW.",
      missionOpening: {
        povertyReduction:
          "EPEW exists to help reduce poverty and expand financial opportunity for people from all economic backgrounds.",
        unityAndSupport:
          "The US in EPEW.US means Unity and Support. EPEW promotes unity, mutual support, entrepreneurship, participation, and community financial growth.",
      },
      instructions: [
        "Do not ask the entrepreneur to repeat information already available unless clarification or verification is necessary.",
        "Identify missing, unclear, or contradictory information.",
        "Treat potential tasks as recommendations only until the Coach validates them.",
        "Do not promise funding or make final governance decisions.",
        "Do not tell the entrepreneur that EPEW has seven official Coach meetings or present the full internal meeting sequence.",
        "Guide the entrepreneur one stage at a time and discuss only the current stage and the immediate next stage.",
        "At the conclusion of the meeting, explain clearly what the entrepreneur should expect and do next.",
        "If the entrepreneur asks how long the overall process takes, explain that the timing depends on the entrepreneur's activity, preparation, responsiveness, and progress, but that the process usually takes about three months.",
        "Do not present the approximately three-month timeframe as a guarantee.",
      ],
    },
  };
}

async function createMeetingIfNeeded(
  application: Record<string, any>,
  communication: Record<string, any> | null,
  assignment: Record<string, any>,
  auth: AuthorizedCoachContext
) {
  const existing = await loadMeeting(application.id);

  if (existing) {
    return existing;
  }

  const preparation = buildInitialPreparation(
    application,
    communication
  );

  const meetingId =
    `EMCC-FIRST-${application.id}-${Date.now()}`;

  const coachId =
    assignment.coach_id ??
    auth.coach?.id ??
    null;

  const meetingDate =
    assignment.first_interview_date ??
    new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("epew_coach_meetings")
    .insert({
      id: meetingId,
      business_id: null,
      coach_id: coachId,
      attended: false,
      meeting_date: meetingDate,
      payload: {
        source: "EMCC",
        version: "v1",
        applicationId: application.id,
      },

      application_id: application.id,
      entrepreneur_user_id:
        application.user_id ?? null,
      coach_assignment_id: assignment.id,

      meeting_type:
        "entrepreneur_first_meeting",
      meeting_status: "ready_to_schedule",
      preparation_status: "ready",

      preferred_language:
        communication?.communication_language ?? "en",
      preferred_communication_channel:
        communication?.priority_channel ?? null,

      ai_preparation:
        preparation.aiPreparation,

      entrepreneur_snapshot:
        preparation.entrepreneurSnapshot,

      business_snapshot:
        preparation.businessSnapshot,

      entrepreneur_goals:
        preparation.entrepreneurGoals,

      missing_information:
        preparation.missingInformation,

      recommended_questions:
        preparation.recommendedQuestions,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const applicationId = Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid entrepreneur application ID.",
        },
        { status: 400 }
      );
    }

    const authorization =
      await authorizeCoachOrAdmin();

    if (!authorization.ok) {
      return authorization.response;
    }

    const auth = authorization.context;

    const application =
      await loadApplication(applicationId);

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    const assignment = await loadAssignment(
      applicationId,
      auth
    );

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: auth.isAdmin
            ? "No active Coach assignment exists for this application."
            : "This entrepreneur is not assigned to the authenticated Coach.",
        },
        { status: 403 }
      );
    }

    const communication =
      await loadCommunicationPreference(
        applicationId,
        application.user_id ?? null,
        application.email ?? null
      );

    const meeting =
      await createMeetingIfNeeded(
        application,
        communication,
        assignment,
        auth
      );

    return NextResponse.json({
      success: true,
      data: {
        application,
        assignment,
        communication,
        meeting,
        coach: auth.coach,
        accessRole: auth.role,
      },
    });
  } catch (error) {
    console.error(
      "EMCC First Meeting GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the First Meeting.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const applicationId = Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid entrepreneur application ID.",
        },
        { status: 400 }
      );
    }

    const authorization =
      await authorizeCoachOrAdmin();

    if (!authorization.ok) {
      return authorization.response;
    }

    const auth = authorization.context;

    const application =
      await loadApplication(applicationId);

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entrepreneur application not found.",
        },
        { status: 404 }
      );
    }

    const assignment = await loadAssignment(
      applicationId,
      auth
    );

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: auth.isAdmin
            ? "No active Coach assignment exists for this application."
            : "This entrepreneur is not assigned to the authenticated Coach.",
        },
        { status: 403 }
      );
    }

    const meeting = await loadMeeting(applicationId);

    if (!meeting) {
      return NextResponse.json(
        {
          success: false,
          message:
            "First Meeting record has not been prepared yet.",
        },
        { status: 404 }
      );
    }

    const body =
      (await request.json()) as MeetingUpdateRequest;

    const action = body.action ?? "save";

    const allowedActions = new Set([
      "prepare",
      "schedule",
      "start",
      "save",
      "complete",
    ]);

    if (!allowedActions.has(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid First Meeting action.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {};

    if (action === "prepare") {
      updates.preparation_status = "ready";
      updates.meeting_status = "ready_to_schedule";
    }

    if (action === "schedule") {
      if (!body.scheduledAt) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A scheduled date and time are required.",
          },
          { status: 400 }
        );
      }

      const scheduledDate =
        new Date(body.scheduledAt);

      if (
        Number.isNaN(scheduledDate.getTime())
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The scheduled date and time are invalid.",
          },
          { status: 400 }
        );
      }

      if (
        scheduledDate.getUTCMinutes() % 5 !== 0 ||
        scheduledDate.getUTCSeconds() !== 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Establishment Meetings must begin on a 5-minute scheduling interval.",
          },
          { status: 400 }
        );
      }

      const meetingDurationMinutes = 60;

      const scheduledEnd =
        new Date(
          scheduledDate.getTime() +
            meetingDurationMinutes * 60 * 1000
        );

      const conflictWindowStart =
        new Date(
          scheduledDate.getTime() -
            meetingDurationMinutes * 60 * 1000
        );

      const { data: conflictingMeetings, error: conflictError } =
        await supabaseAdmin
          .from("epew_coach_meetings")
          .select("id,scheduled_at,meeting_status")
          .eq("coach_id", assignment.coach_id)
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

      if (
        conflictingMeetings &&
        conflictingMeetings.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This Coach already has another meeting that overlaps this time. Please choose the next available 5-minute time slot.",
          },
          { status: 409 }
        );
      }

      const zoomMeeting =
        await ZoomMeetingService.createEstablishmentMeeting({
          entrepreneurName:
            application.full_name,
          businessName:
            application.business_name,
          scheduledAt:
            scheduledDate.toISOString(),
          durationMinutes:
            meetingDurationMinutes,
        });

      updates.scheduled_at =
        scheduledDate.toISOString();

      updates.meeting_date =
        scheduledDate.toISOString();

      updates.meeting_status =
        "scheduled";

      updates.meeting_provider =
        "zoom";

      updates.zoom_meeting_id =
        zoomMeeting.meetingId;

      updates.zoom_meeting_uuid =
        zoomMeeting.meetingUuid;

      updates.zoom_join_url =
        zoomMeeting.joinUrl;

      updates.zoom_meeting_status =
        "scheduled";

      const {
        error: zoomSecretError,
      } = await supabaseAdmin
        .schema("emcc_private")
        .from("zoom_meeting_secrets")
        .upsert(
          {
            meeting_id: meeting.id,
            zoom_host_url:
              zoomMeeting.startUrl,
            zoom_start_url:
              zoomMeeting.startUrl,
            zoom_passcode:
              zoomMeeting.passcode,
            rtms_access_context: {},
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "meeting_id",
          }
        );

      if (zoomSecretError) {
        throw zoomSecretError;
      }
    }

    if (action === "start") {
      updates.started_at =
        meeting.started_at ?? now;
      updates.meeting_status = "in_progress";
    }

    if (
      body.missionPresented !== undefined
    ) {
      updates.mission_presented =
        body.missionPresented;

      if (
        body.missionPresented &&
        !meeting.mission_presented_at
      ) {
        updates.mission_presented_at = now;
      }
    }

    if (
      body.unitySupportExplained !== undefined
    ) {
      updates.unity_support_explained =
        body.unitySupportExplained;
    }

    if (
      body.missionAcknowledged !== undefined
    ) {
      updates.mission_acknowledged =
        body.missionAcknowledged;

      if (
        body.missionAcknowledged &&
        !meeting.mission_acknowledged_at
      ) {
        updates.mission_acknowledged_at = now;
      }
    }

    if (
      body.entrepreneurSummary !== undefined
    ) {
      updates.entrepreneur_summary =
        body.entrepreneurSummary.trim();
    }

    if (body.businessSummary !== undefined) {
      updates.business_summary =
        body.businessSummary.trim();
    }

    if (body.primaryGoal !== undefined) {
      updates.primary_goal =
        body.primaryGoal.trim();
    }

    if (
      body.businessStatusSummary !== undefined
    ) {
      updates.business_status_summary =
        body.businessStatusSummary.trim();
    }

    if (
      body.marketCustomerSummary !== undefined
    ) {
      updates.market_customer_summary =
        body.marketCustomerSummary.trim();
    }

    if (
      body.revenueStatusSummary !== undefined
    ) {
      updates.revenue_status_summary =
        body.revenueStatusSummary.trim();
    }

    if (
      body.fundingNeedSummary !== undefined
    ) {
      updates.funding_need_summary =
        body.fundingNeedSummary.trim();
    }

    if (body.majorObstacles !== undefined) {
      updates.major_obstacles =
        asStringArray(body.majorObstacles);
    }

    if (body.businessNeeds !== undefined) {
      updates.business_needs =
        asStringArray(body.businessNeeds);
    }

    if (body.missingDocuments !== undefined) {
      updates.missing_documents =
        asStringArray(body.missingDocuments);
    }

    if (body.complianceIssues !== undefined) {
      updates.compliance_issues =
        asStringArray(body.complianceIssues);
    }

    if (
      body.risksAndConcerns !== undefined
    ) {
      updates.risks_and_concerns =
        asStringArray(body.risksAndConcerns);
    }

    if (
      body.verificationItems !== undefined
    ) {
      updates.verification_items =
        asStringArray(body.verificationItems);
    }

    if (body.potentialTasks !== undefined) {
      updates.potential_tasks =
        asStringArray(body.potentialTasks);
    }

    if (body.coachNotes !== undefined) {
      updates.coach_notes =
        body.coachNotes.trim();
    }

    if (body.meetingSummary !== undefined) {
      updates.meeting_summary =
        body.meetingSummary.trim();
    }

    if (
      body.nextRequiredAction !== undefined
    ) {
      updates.next_required_action =
        body.nextRequiredAction.trim();
    }

    if (body.followUpAt !== undefined) {
      updates.follow_up_at =
        body.followUpAt || null;
    }

    if (
      body.commitmentScore !== undefined
    ) {
      updates.commitment_score =
        scoreOrNull(body.commitmentScore);
    }

    if (
      body.preparationScore !== undefined
    ) {
      updates.preparation_score =
        scoreOrNull(body.preparationScore);
    }

    if (
      body.organizationScore !== undefined
    ) {
      updates.organization_score =
        scoreOrNull(body.organizationScore);
    }

    if (
      body.communicationScore !== undefined
    ) {
      updates.communication_score =
        scoreOrNull(body.communicationScore);
    }

    if (
      body.businessPotentialScore !== undefined
    ) {
      updates.business_potential_score =
        scoreOrNull(body.businessPotentialScore);
    }

    if (
      body.readinessScore !== undefined
    ) {
      updates.readiness_score =
        scoreOrNull(body.readinessScore);
    }

    if (body.assessmentNotes !== undefined) {
      updates.assessment_notes =
        body.assessmentNotes;
    }

    if (action === "complete") {
      const finalNextRequiredAction =
        typeof body.nextRequiredAction === "string"
          ? body.nextRequiredAction.trim()
          : String(meeting.next_required_action ?? "").trim();

      if (!finalNextRequiredAction) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The immediate next stage or required action must be recorded before completing the Establishment Meeting.",
          },
          { status: 400 }
        );
      }

      if (
        body.missionAcknowledged !== true &&
        meeting.mission_acknowledged !== true
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The EPEW mission and Unity and Support orientation must be acknowledged before completing the Establishment Meeting.",
          },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No First Meeting changes were provided.",
        },
        { status: 400 }
      );
    }

    const { data: updatedMeeting, error } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .update(updates)
        .eq("id", meeting.id)
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    if (action === "schedule") {
      const { error: scheduleAssignmentError } =
        await supabaseAdmin
          .from("coach_assignments")
          .update({
            first_interview_status:
              "scheduled",
            first_interview_date:
              updatedMeeting.scheduled_at,
          })
          .eq("id", assignment.id);

      if (scheduleAssignmentError) {
        throw scheduleAssignmentError;
      }

      if (
        updatedMeeting.zoom_join_url &&
        updatedMeeting.zoom_meeting_id &&
        application.email
      ) {
        const scheduledDate =
          new Date(updatedMeeting.scheduled_at);

        const proposedMeetingDate =
          new Intl.DateTimeFormat(
            "en-US",
            {
              timeZone: "America/New_York",
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ).format(scheduledDate);

        const proposedMeetingTime =
          new Intl.DateTimeFormat(
            "en-US",
            {
              timeZone: "America/New_York",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            }
          ).format(scheduledDate);

        try {
          await sendCoachIntroductionEmail({
            applicationId,
            assignmentId:
              assignment.id,
            zoomMeetingId:
              updatedMeeting.zoom_meeting_id,
            entrepreneurEmail:
              application.email,
            entrepreneurName:
              application.full_name,
            businessName:
              application.business_name ??
              "your business",
            coachName:
              assignment.coach_name ??
              auth.coach?.full_name ??
              "Your EPEW Personal Coach",
            coachEmail:
              assignment.coach_email ??
              auth.coach?.email ??
              "welcome@epew.us",
            proposedMeetingDate,
            proposedMeetingTime,
            zoomJoinUrl:
              updatedMeeting.zoom_join_url,
          });
        } catch (emailError) {
          console.error(
            "Coach introduction email failed after Zoom scheduling:",
            emailError
          );
        }
      }
    }

    let responseMeeting = updatedMeeting;

    if (action === "complete") {
      const { error: completionError } =
        await supabaseAdmin.rpc(
          "epew_complete_establishment_meeting",
          {
            p_meeting_id: updatedMeeting.id,
            p_assignment_id: assignment.id,
            p_application_id: applicationId,
          }
        );

      if (completionError) {
        throw completionError;
      }

      const {
        data: finalizedMeeting,
        error: finalizedMeetingError,
      } = await supabaseAdmin
        .from("epew_coach_meetings")
        .select("*")
        .eq("id", updatedMeeting.id)
        .single();

      if (finalizedMeetingError) {
        throw finalizedMeetingError;
      }

      responseMeeting = finalizedMeeting;
    }

    return NextResponse.json({
      success: true,
      message:
        action === "complete"
          ? "Establishment Meeting completed successfully."
          : "First Meeting saved successfully.",
      data: responseMeeting,
    });
  } catch (error) {
    console.error(
      "EMCC First Meeting PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update the First Meeting.",
      },
      { status: 500 }
    );
  }
}
