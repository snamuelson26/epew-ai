import { supabase } from "@/lib/supabase";
import {
  getNextIBOSStage,
  getPreviousIBOSStage,
  IBOS_STAGE_LABELS,
  IBOS_STAGES,
  type IBOSStage,
} from "./stages";
import { getModulesForStage, IBOS_MODULE_LABELS, MODULE_STATUS } from "./modules";
import type { IBOSStageRequest, IBOSEngineResult } from "./types";
import { createIBOSTimelineEvent } from "./timeline";

const AUTHORIZED_TRANSITIONS: Record<string, IBOSStage[]> = {
  "Professional Qualification Center": [
    IBOS_STAGES.APPLICATION_REVIEWED,
    IBOS_STAGES.ORIENTATION_SCHEDULED,
    IBOS_STAGES.ORIENTATION_COMPLETED,
    IBOS_STAGES.QUALIFIED,
    IBOS_STAGES.APPROVED,
  ],
  "Annual Meeting Center": [IBOS_STAGES.ANNUAL_MEETING_COMPLETED],
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
  "Admin": Object.values(IBOS_STAGES),
};

function isAuthorized(requestedBy: string, requestedStage: IBOSStage) {
  const allowed = AUTHORIZED_TRANSITIONS[requestedBy] || [];
  return allowed.includes(requestedStage);
}

async function updateModuleAccess(entrepreneurId: string, stage: IBOSStage) {
  const activeModules = getModulesForStage(stage);

  for (const moduleName of activeModules) {
    await supabase.from("ibos_module_access").upsert(
      {
        entrepreneur_id: entrepreneurId,
        module_name: moduleName,
        module_status: MODULE_STATUS.ACTIVE,
        activated_at: new Date().toISOString(),
      },
      {
        onConflict: "entrepreneur_id,module_name",
      }
    );
  }
}

async function createFundingQueueIfNeeded(entrepreneurId: string, stage: IBOSStage) {
  if (stage !== IBOS_STAGES.ANNUAL_MEETING_COMPLETED) return;

  const { data: existing } = await supabase
    .from("funding_queue")
    .select("id")
    .eq("entrepreneur_id", entrepreneurId)
    .maybeSingle();

  if (existing) return;

  const { count } = await supabase
    .from("funding_queue")
    .select("*", { count: "exact", head: true });

  const nextQueuePosition = (count || 0) + 1;

  const { error } = await supabase.from("funding_queue").insert({
    entrepreneur_id: entrepreneurId,
    queue_position: nextQueuePosition,
    queue_status: "Waiting for Funding",
    annual_meeting_group: "Pending",
    qualification_status: "Funding Readiness",
    estimated_funding_date: null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function activateBusinessOperationsIfNeeded(
  entrepreneurId: string,
  stage: IBOSStage
) {
  if (stage !== IBOS_STAGES.BUSINESS_OPENED) return;

  await supabase
    .from("entrepreneurs")
    .update({
      daily_transactions_active: true,
      quarterly_reporting_active: true,
      automation_active: true,
      business_intelligence_active: true,
      ibos_status: "Fully Operational Business",
    })
    .eq("id", entrepreneurId);
}

export async function advanceIBOSStage(
  request: IBOSStageRequest
): Promise<IBOSEngineResult> {
  try {
    const { entrepreneurId, requestedStage, requestedBy, notes } = request;

    if (!isAuthorized(requestedBy, requestedStage)) {
      return {
        success: false,
        message: `${requestedBy} is not authorized to move entrepreneur to ${IBOS_STAGE_LABELS[requestedStage]}.`,
      };
    }

    const { data: entrepreneur, error: fetchError } = await supabase
      .from("entrepreneurs")
      .select("id, current_stage")
      .eq("id", entrepreneurId)
      .single();

    if (fetchError || !entrepreneur) {
      return {
        success: false,
        message: fetchError?.message || "Entrepreneur not found.",
      };
    }

    const previousStage =
      (entrepreneur.current_stage as IBOSStage) ||
      getPreviousIBOSStage(requestedStage);

    const nextStage = getNextIBOSStage(requestedStage);

    const { error: updateError } = await supabase
      .from("entrepreneurs")
      .update({
        previous_stage: previousStage,
        current_stage: requestedStage,
        next_stage: nextStage,
        ibos_status:
          requestedStage === IBOS_STAGES.APPROVED
            ? "Limited Portal"
            : requestedStage === IBOS_STAGES.ANNUAL_MEETING_COMPLETED
            ? "Funding Queue Active"
            : requestedStage === IBOS_STAGES.BUSINESS_OPENED
            ? "Fully Operational Business"
            : "In Progress",
        funding_queue_active:
          requestedStage === IBOS_STAGES.ANNUAL_MEETING_COMPLETED ||
          requestedStage === IBOS_STAGES.FUNDING_QUEUE ||
          requestedStage === IBOS_STAGES.FUNDING_APPROVED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entrepreneurId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    await updateModuleAccess(entrepreneurId, requestedStage);
    await createFundingQueueIfNeeded(entrepreneurId, requestedStage);
    await activateBusinessOperationsIfNeeded(entrepreneurId, requestedStage);

    await createIBOSTimelineEvent({
      entrepreneurId,
      eventTitle: IBOS_STAGE_LABELS[requestedStage],
      eventDescription:
        notes ||
        `Stage advanced to ${IBOS_STAGE_LABELS[requestedStage]} by ${requestedBy}.`,
      previousStage,
      currentStage: requestedStage,
      nextStage,
      createdBy: requestedBy,
    });

    return {
      success: true,
      message: `IBOS stage advanced to ${IBOS_STAGE_LABELS[requestedStage]}.`,
      previousStage,
      currentStage: requestedStage,
      nextStage,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "IBOS Engine error.",
    };
  }
}