// =======================================================
// EPEW – EDE – IBOS
// Coach Assignment Acknowledgment API
// =======================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EntrepreneurTimelineService } from "@/lib/services/EntrepreneurTimelineService";
import {
  CoachAssignmentAcknowledgmentError,
  CoachAssignmentAcknowledgmentService,
} from "@/lib/enterprise/coach-assignment/CoachAssignmentAcknowledgmentService";

type AcknowledgeRequest = {
  assignmentId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AcknowledgeRequest;

    const assignmentId = body.assignmentId?.trim();

    if (!assignmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment ID is required.",
        },
        { status: 400 }
      );
    }

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

    const coachEmail = user.email?.trim().toLowerCase();

    if (!coachEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The authenticated coach does not have an email address.",
        },
        { status: 400 }
      );
    }

    const { data: coach, error: coachError } =
      await supabase
        .from("epew_coaches")
        .select("id, email, full_name, status")
        .ilike("email", coachEmail)
        .maybeSingle();

    if (coachError) {
      throw coachError;
    }

    if (!coach) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No EPEW coach profile is connected to this authenticated account.",
        },
        { status: 404 }
      );
    }

    if (
      coach.status &&
      coach.status !== "available" &&
      coach.status !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This coach profile is not currently active or available.",
        },
        { status: 403 }
      );
    }

    const { data: assignment, error: assignmentError } =
      await supabase
        .from("coach_assignments")
        .select(`
          id,
          coach_id,
          coach_email,
          acknowledgment_status
        `)
        .eq("id", assignmentId)
        .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment not found.",
        },
        { status: 404 }
      );
    }

    if (assignment.coach_id !== coach.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to acknowledge this assignment.",
        },
        { status: 403 }
      );
    }

    if (
      assignment.coach_email &&
      assignment.coach_email.trim().toLowerCase() !== coachEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The assignment email does not match the authenticated coach.",
        },
        { status: 403 }
      );
    }

    if (assignment.acknowledgment_status === "acknowledged") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This assignment has already been acknowledged.",
        },
        { status: 409 }
      );
    }

    const timeline =
      new EntrepreneurTimelineService(supabase);

    const service =
      new CoachAssignmentAcknowledgmentService(
        supabase,
        timeline
      );

    const result =
      await service.acknowledgeAssignment({
        assignmentId,
        coachId: coach.id,
        acknowledgedBy: coachEmail,
        source: "CoachPortal",
      });

    return NextResponse.json({
      success: true,
      message:
        "Assignment acknowledged successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof CoachAssignmentAcknowledgmentError
    ) {
      const statusByCode: Record<string, number> = {
        ASSIGNMENT_NOT_FOUND: 404,
        INVALID_COACH: 403,
        ALREADY_ACKNOWLEDGED: 409,
      };

      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: error.code,
        },
        {
          status: statusByCode[error.code] ?? 400,
        }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to acknowledge assignment.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}