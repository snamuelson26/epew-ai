import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getNextIBOSStage,
  getPreviousIBOSStage,
  IBOS_STAGE_LABELS,
  IBOS_STAGES,
  type IBOSStage,
} from "@/lib/ibos/stages";
import {
  getModulesForStage,
  MODULE_STATUS,
} from "@/lib/ibos/modules";

interface AdvanceStageBody {
  entrepreneurId?: string;
  requestedStage?: IBOSStage;
  requestedBy?: string;
  notes?: string;
}

const AUTHORIZED_TRANSITIONS: Record<string, IBOSStage[]> = {
  "Professional Qualification Center": [
    IBOS_STAGES.APPLICATION_REVIEWED,
    IBOS_STAGES.ORIENTATION_SCHEDULED,
    IBOS_STAGES.ORIENTATION_COMPLETED,
    IBOS_STAGES.QUALIFIED,
    IBOS_STAGES.APPROVED,
  ],
  "Annual Meeting Center": [
    IBOS_STAGES.ANNUAL_MEETING_COMPLETED,
  ],
  "Funding Management Center": [
    IBOS_STAGES.FUNDING_QUEUE,
    IBOS_STAGES.FUNDING_APPROVED,
    IBOS_STAGES.BUSINESS_PREPARATION,
  ],
  "Business Opening Center": [
    IBOS_STAGES.BUSINESS_OPENING,
    IBOS_STAGES.BUSINESS_OPENED,
    IBOS_STAGES.ACTIVE_BUSINESS,
    IBOS_STAGES.QUARTERLY_REPORTING,
  ],
  Admin: Object.values(IBOS_STAGES),
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdvanceStageBody;

    const entrepreneurId = body.entrepreneurId?.trim();
    const requestedStage = body.requestedStage;
    const requestedBy = body.requestedBy?.trim();
    const notes = body.notes?.trim();

    if (!entrepreneurId || !requestedStage || !requestedBy) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entrepreneur ID, requested stage, and requested by are required.",
        },
        { status: 400 }
      );
    }

    const allowedStages =
      AUTHORIZED_TRANSITIONS[requestedBy] ?? [];

    if (!allowedStages.includes(requestedStage)) {
      return NextResponse.json(
        {
          success: false,
          message: `${requestedBy} is not authorized to move this entrepreneur to ${IBOS_STAGE_LABELS[requestedStage]}.`,
        },
        { status: 403 }
      );
    }

    const {
      data: entrepreneur,
      error: fetchError,
    } = await supabaseAdmin
      .from("entrepreneurs")
      .select("id, current_stage")
      .eq("id", entrepreneurId)
      .single();

    if (fetchError || !entrepreneur) {
      return NextResponse.json(
        {
          success: false,
          message:
            fetchError?.message || "Entrepreneur not found.",
        },
        { status: 404 }
      );
    }

    const previousStage =
      (entrepreneur.current_stage as IBOSStage) ||
      getPreviousIBOSStage(requestedStage);

    const nextStage = getNextIBOSStage(requestedStage);
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("entrepreneurs")
      .update({
        previous_stage: previousStage,
        current_stage: requestedStage,
        next_stage: nextStage,
        ibos_status:
          requestedStage === IBOS_STAGES.APPROVED
            ? "Limited Portal"
            : requestedStage ===
                IBOS_STAGES.ANNUAL_MEETING_COMPLETED
              ? "Funding Queue Active"
              : requestedStage ===
                  IBOS_STAGES.BUSINESS_OPENED
                ? "Fully Operational Business"
                : "In Progress",
        funding_queue_active:
          requestedStage ===
            IBOS_STAGES.ANNUAL_MEETING_COMPLETED ||
          requestedStage === IBOS_STAGES.FUNDING_QUEUE ||
          requestedStage === IBOS_STAGES.FUNDING_APPROVED,
        updated_at: now,
      })
      .eq("id", entrepreneurId);

    if (updateError) {
      throw updateError;
    }

    const activeModules =
      getModulesForStage(requestedStage);

    for (const moduleName of activeModules) {
      const { error: moduleError } =
        await supabaseAdmin
          .from("ibos_module_access")
          .upsert(
            {
              entrepreneur_id: entrepreneurId,
              module_name: moduleName,
              module_status: MODULE_STATUS.ACTIVE,
              activated_at: now,
            },
            {
              onConflict:
                "entrepreneur_id,module_name",
            }
          );

      if (moduleError) {
        throw moduleError;
      }
    }

    const { error: timelineError } =
      await supabaseAdmin
        .from("ibos_timeline")
        .insert({
          entrepreneur_id: entrepreneurId,
          event_title:
            IBOS_STAGE_LABELS[requestedStage],
          event_description:
            notes ||
            `Stage advanced to ${IBOS_STAGE_LABELS[requestedStage]} by ${requestedBy}.`,
          previous_stage: previousStage,
          current_stage: requestedStage,
          next_stage: nextStage,
          created_by: requestedBy,
          created_at: now,
        });

    if (timelineError) {
      throw timelineError;
    }

    return NextResponse.json({
      success: true,
      message: `IBOS stage advanced to ${IBOS_STAGE_LABELS[requestedStage]}.`,
      previousStage,
      currentStage: requestedStage,
      nextStage,
    });
  } catch (error: unknown) {
    console.error("IBOS stage advancement error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "IBOS stage advancement failed.",
      },
      { status: 500 }
    );
  }
}