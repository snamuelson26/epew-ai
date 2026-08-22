import { NextRequest, NextResponse } from "next/server";
import {
  authorizeEstablishmentMeetingAccess,
} from "@/lib/enterprise/establishment-meeting/authorizeEstablishmentMeetingAccess";
import {
  type EstablishmentMeetingMessage,
  type EstablishmentMeetingStage,
} from "@/lib/enterprise/establishment-meeting/EstablishmentMeetingCoach";
import {
  EstablishmentMeetingRuntimeService,
} from "@/lib/services/establishment-meeting/EstablishmentMeetingRuntimeService";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type ConversationRequest = {
  stage: EstablishmentMeetingStage;
  conversation?: EstablishmentMeetingMessage[];
  stageNotes?: Record<string, unknown>;
};

const ALLOWED_STAGES = new Set<EstablishmentMeetingStage>([
  "opening",
  "meeting_purpose",
  "entrepreneur_discovery",
  "epew_philosophy",
  "business_discovery",
  "document_assessment",
  "meeting_2_readiness",
  "coach_evaluation",
  "development_plan",
  "closing",
]);

function statusForRuntimeError(message: string) {
  if (
    message === "Entrepreneur application not found." ||
    message ===
      "Establishment Meeting record has not been prepared yet."
  ) {
    return 404;
  }

  if (
    message ===
    "No active Coach assignment exists for this application."
  ) {
    return 403;
  }

  if (
    message.includes(
      "has reached the 60-minute limit"
    )
  ) {
    return 409;
  }

  return 500;
}

export async function POST(
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
          message:
            "Invalid entrepreneur application ID.",
        },
        { status: 400 }
      );
    }

    const authorization =
      await authorizeEstablishmentMeetingAccess();

    if (!authorization.ok) {
      return authorization.response;
    }

    const auth = authorization.context;

    const body =
      (await request.json()) as ConversationRequest;

    if (!ALLOWED_STAGES.has(body.stage)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Establishment Meeting stage.",
        },
        { status: 400 }
      );
    }

    const result =
      await EstablishmentMeetingRuntimeService.runTurn({
        applicationId,
        stage: body.stage,
        conversation: body.conversation,
        stageNotes: body.stageNotes,
        coachId: auth.coach?.id ?? null,
        coachName:
          auth.coach?.full_name ??
          "Your EPEW Personal Coach",
        coachEmail:
          auth.coach?.email ??
          auth.email ??
          null,
        isAdmin: auth.isAdmin,
      });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "EPEW Personal Coach conversation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate the Personal Coach response.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: statusForRuntimeError(message),
      }
    );
  }
}
