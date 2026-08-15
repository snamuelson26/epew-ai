import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AutomaticCoachAssignmentService } from "@/lib/services/AutomaticCoachAssignmentService";

type QuestionnaireRequest = {
  applicationId?: number;
  answers?: unknown;
  readinessScore?: number;
};

export async function POST(request: NextRequest) {
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

    let body: QuestionnaireRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "A valid questionnaire request is required.",
        },
        { status: 400 }
      );
    }

    const applicationId = Number(body.applicationId);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid Application ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.answers) ||
      !body.answers.every(
        (answer) => typeof answer === "string"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Questionnaire answers are invalid.",
        },
        { status: 400 }
      );
    }

    const readinessScore = Number(body.readinessScore);

    if (
      !Number.isFinite(readinessScore) ||
      readinessScore < 0 ||
      readinessScore > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Questionnaire readiness score is invalid.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Confirm this application belongs to authenticated user
    // =====================================================

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(
        "id, user_id, questionnaire_status"
      )
      .eq("id", applicationId)
      .eq("user_id", user.id)
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

    const previousStatus =
      application.questionnaire_status || null;

    const questionnaireStatus =
      readinessScore === 100
        ? "Completed"
        : "In Progress";

    // =====================================================
    // Save questionnaire
    // =====================================================

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("entrepreneur_applications")
      .update({
        questionnaire_answers:
          body.answers,

        readiness_score:
          readinessScore,

        questionnaire_status:
          questionnaireStatus,
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    // =====================================================
    // Trigger AI Admin Coach assignment when questionnaire
    // reaches Completed.
    //
    // assignApplication() is idempotent and will safely
    // reuse an existing active assignment.
    // =====================================================

    let assignmentResult = null;

    if (questionnaireStatus === "Completed") {
      const service =
        new AutomaticCoachAssignmentService(
          supabaseAdmin
        );

      assignmentResult =
        await service.assignApplication({
          applicationId,
        });
    }

    return NextResponse.json({
      success: true,

      message:
        questionnaireStatus === "Completed"
          ? "Questionnaire completed successfully."
          : "Questionnaire saved successfully.",

      questionnaireStatus,

      previousStatus,

      assignment:
        assignmentResult
          ? {
              success:
                assignmentResult.success,

              assignmentId:
                assignmentResult.assignmentId,

              coachName:
                assignmentResult.coach?.fullName,

              alreadyAssigned:
                assignmentResult.alreadyAssigned,

              welcomeEmailSent:
                assignmentResult.welcomeEmailSent,

              message:
                assignmentResult.message,
            }
          : null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save Entrepreneur Questionnaire.";

    console.error(
      "Entrepreneur Questionnaire API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
