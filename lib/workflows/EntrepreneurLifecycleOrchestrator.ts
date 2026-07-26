// =======================================================
// EPEW – EDE – IBOS
// Entrepreneur Lifecycle Orchestrator
//
// Constitutional Principle #018
// Centralized Lifecycle Orchestration
// =======================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { AutomaticCoachAssignmentService } from "@/lib/services/AutomaticCoachAssignmentService";
import { EntrepreneurTimelineService } from "@/lib/services/EntrepreneurTimelineService";
import type { Coach } from "@/lib/types/coach";

// =======================================================
// Lifecycle stages
// =======================================================

export type EntrepreneurLifecycleStage =
  | "pending_review"
  | "coach_assigned"
  | "interview_scheduled"
  | "interview_completed"
  | "questionnaire_completed"
  | "qualified"
  | "marketplace_activated"
  | "annual_meeting_pending"
  | "annual_meeting_completed"
  | "funding_queue"
  | "funding_approved"
  | "business_preparation"
  | "business_opening"
  | "business_opened"
  | "active_business"
  | "quarterly_reporting";

// =======================================================
// Workflow result types
// =======================================================

export interface LifecycleCoachResult {
  assigned: boolean;
  coach: Coach | null;
  message: string;
}

export interface QualificationLifecycleResult {
  success: boolean;
  entrepreneurId: string;
  previousStatus: string | null;
  currentStatus: "qualified";
  coachAssignment: LifecycleCoachResult;
  completedAt: string;
  message: string;
}

export interface LifecycleTransitionResult {
  success: boolean;
  entrepreneurId: string;
  previousStage: string | null;
  currentStage: EntrepreneurLifecycleStage;
  nextStage: EntrepreneurLifecycleStage | null;
  completedAt: string;
  message: string;
}

// =======================================================
// Workflow errors
// =======================================================

export type LifecycleErrorCode =
  | "INVALID_ENTREPRENEUR_ID"
  | "ENTREPRENEUR_NOT_FOUND"
  | "ENTREPRENEUR_LOOKUP_FAILED"
  | "STATUS_UPDATE_FAILED"
  | "STAGE_UPDATE_FAILED"
  | "COACH_ASSIGNMENT_FAILED";

export class EntrepreneurLifecycleError extends Error {
  constructor(
    message: string,
    public readonly code: LifecycleErrorCode
  ) {
    super(message);

    this.name = "EntrepreneurLifecycleError";
  }
}

// =======================================================
// Entrepreneur Lifecycle Orchestrator
// =======================================================

export class EntrepreneurLifecycleOrchestrator {
  private readonly automaticCoachAssignment:
    AutomaticCoachAssignmentService;

  private readonly timeline:
    EntrepreneurTimelineService;

  private readonly ibos: {
    advanceStage: (
      entrepreneurId: string,
      stage: string
    ) => Promise<{
      success: boolean;
      message?: string;
    }>;
  };

  constructor(
    private readonly supabase: SupabaseClient
  ) {
    this.automaticCoachAssignment =
      new AutomaticCoachAssignmentService(
        supabase
      );

    this.timeline =
      new EntrepreneurTimelineService(
        supabase
      );

    // =====================================================
    // Minimal IBOS integration
    //
    // All official stage changes are executed through
    // the Entrepreneur Lifecycle Orchestrator.
    // =====================================================

    this.ibos = {
      advanceStage: async (
        entrepreneurId: string,
        stage: string
      ) => {
        const completedAt =
          new Date().toISOString();

        const { error } =
          await this.supabase
            .from("entrepreneurs")
            .update({
              current_stage: stage,
              next_stage: null,
              updated_at: completedAt,
            })
            .eq(
              "id",
              entrepreneurId
            );

        if (error) {
          return {
            success: false,
            message: error.message,
          };
        }

        return {
          success: true,
        };
      },
    };
  }

  // =====================================================
  // Qualify entrepreneur
  // =====================================================

  async qualify(
    entrepreneurId: string
  ): Promise<QualificationLifecycleResult> {
    const normalizedEntrepreneurId =
      entrepreneurId.trim();

    if (!normalizedEntrepreneurId) {
      throw new EntrepreneurLifecycleError(
        "Entrepreneur ID is required.",
        "INVALID_ENTREPRENEUR_ID"
      );
    }

    const completedAt =
      new Date().toISOString();

    // =====================================================
    // Step 1 — Confirm entrepreneur exists
    // =====================================================

    const {
      data: entrepreneur,
      error: entrepreneurLookupError,
    } = await this.supabase
      .from("entrepreneurs")
      .select(
        `
          id,
          status,
          current_stage,
          previous_stage,
          next_stage
        `
      )
      .eq(
        "id",
        normalizedEntrepreneurId
      )
      .maybeSingle();

    if (entrepreneurLookupError) {
      throw new EntrepreneurLifecycleError(
        entrepreneurLookupError.message,
        "ENTREPRENEUR_LOOKUP_FAILED"
      );
    }

    if (!entrepreneur) {
      throw new EntrepreneurLifecycleError(
        "Entrepreneur not found.",
        "ENTREPRENEUR_NOT_FOUND"
      );
    }

    const previousStatus =
      typeof entrepreneur.status === "string"
        ? entrepreneur.status
        : null;

    const previousStage =
      typeof entrepreneur.current_stage ===
      "string"
        ? entrepreneur.current_stage
        : null;

    // =====================================================
    // Step 2 — Advance the official IBOS lifecycle
    // =====================================================

    const ibosResult =
      await this.ibos.advanceStage(
        normalizedEntrepreneurId,
        "qualified"
      );

    if (!ibosResult.success) {
      throw new EntrepreneurLifecycleError(
        ibosResult.message ??
          "Failed to advance the entrepreneur through the IBOS lifecycle.",
        "STAGE_UPDATE_FAILED"
      );
    }

    // =====================================================
    // Step 3 — Mark entrepreneur qualified
    // =====================================================

    if (previousStatus !== "qualified") {
      const {
        error: qualificationError,
      } = await this.supabase
        .from("entrepreneurs")
        .update({
          status: "qualified",
          qualified_at: completedAt,
          previous_stage:
            previousStage,
          current_stage:
            "qualified",
          updated_at:
            completedAt,
        })
        .eq(
          "id",
          normalizedEntrepreneurId
        );

      if (qualificationError) {
        throw new EntrepreneurLifecycleError(
          qualificationError.message,
          "STATUS_UPDATE_FAILED"
        );
      }

      // ===================================================
      // Record qualification timeline event
      //
      // Only recorded when the entrepreneur is newly
      // qualified. This prevents duplicate events when
      // the workflow is safely retried.
      // ===================================================

      await this.timeline.recordEvent({
        entrepreneurId:
          normalizedEntrepreneurId,

        eventType:
          "qualified",

        eventTitle:
          "Entrepreneur Qualified",

        eventDescription:
          "The entrepreneur successfully completed the EPEW qualification process.",

        lifecycleStage:
          "qualified",

        performedBy:
          "EntrepreneurLifecycleOrchestrator",

        source:
          "QualificationWorkflowService",

        metadata: {
          previousStatus,
          previousStage,
          qualifiedAt:
            completedAt,
        },
      });
    }

    // =====================================================
    // Step 4 — Assign the best available coach
    // =====================================================

    const assignmentResult =
      await this.automaticCoachAssignment
        .assignEntrepreneur(
          normalizedEntrepreneurId
        );

    const alreadyAssigned =
      assignmentResult.message
        .toLowerCase()
        .includes("already has");

    const coachAssigned =
      assignmentResult.success ||
      alreadyAssigned;

    // =====================================================
    // Record a newly created coach assignment
    //
    // Existing assignments are not recorded again because
    // that would create a duplicate timeline event.
    // =====================================================

    if (
      assignmentResult.success &&
      assignmentResult.assignmentId &&
      assignmentResult.coach
    ) {
      await this.timeline.recordCoachAssigned({
        entrepreneurId:
          normalizedEntrepreneurId,

        coachId:
          assignmentResult.coach.id,

        coachName:
          assignmentResult.coach.fullName,

        assignmentId:
          assignmentResult.assignmentId,

        assignedAt:
          assignmentResult.assignedAt,
      });
    }

    // Qualification remains successful when no coach is
    // immediately available. The entrepreneur may later
    // be processed by the pending coach assignment system.

    const coachAssignment:
      LifecycleCoachResult = {
      assigned:
        coachAssigned,

      coach:
        assignmentResult.coach ??
        null,

      message:
        assignmentResult.message,
    };

    return {
      success: true,

      entrepreneurId:
        normalizedEntrepreneurId,

      previousStatus,

      currentStatus:
        "qualified",

      coachAssignment,

      completedAt,

      message:
        this.buildQualificationMessage(
          coachAssignment
        ),
    };
  }

  // =====================================================
  // Generic lifecycle stage transition
  //
  // Foundation for:
  // - Marketplace activation
  // - Annual meeting
  // - Funding Queue
  // - Fully funded non-queue path
  // - Funding approval
  // - Business opening
  // - Quarterly reporting
  // =====================================================

  async transitionStage(
    entrepreneurId: string,
    currentStage: EntrepreneurLifecycleStage,
    nextStage: EntrepreneurLifecycleStage | null,
    additionalUpdates: Record<
      string,
      unknown
    > = {}
  ): Promise<LifecycleTransitionResult> {
    const normalizedEntrepreneurId =
      entrepreneurId.trim();

    if (!normalizedEntrepreneurId) {
      throw new EntrepreneurLifecycleError(
        "Entrepreneur ID is required.",
        "INVALID_ENTREPRENEUR_ID"
      );
    }

    const completedAt =
      new Date().toISOString();

    const {
      data: entrepreneur,
      error: lookupError,
    } = await this.supabase
      .from("entrepreneurs")
      .select(
        "id, current_stage"
      )
      .eq(
        "id",
        normalizedEntrepreneurId
      )
      .maybeSingle();

    if (lookupError) {
      throw new EntrepreneurLifecycleError(
        lookupError.message,
        "ENTREPRENEUR_LOOKUP_FAILED"
      );
    }

    if (!entrepreneur) {
      throw new EntrepreneurLifecycleError(
        "Entrepreneur not found.",
        "ENTREPRENEUR_NOT_FOUND"
      );
    }

    const previousStage =
      typeof entrepreneur.current_stage ===
      "string"
        ? entrepreneur.current_stage
        : null;

    const {
      error: stageUpdateError,
    } = await this.supabase
      .from("entrepreneurs")
      .update({
        previous_stage:
          previousStage,

        current_stage:
          currentStage,

        next_stage:
          nextStage,

        updated_at:
          completedAt,

        ...additionalUpdates,
      })
      .eq(
        "id",
        normalizedEntrepreneurId
      );

    if (stageUpdateError) {
      throw new EntrepreneurLifecycleError(
        stageUpdateError.message,
        "STAGE_UPDATE_FAILED"
      );
    }

    return {
      success: true,

      entrepreneurId:
        normalizedEntrepreneurId,

      previousStage,

      currentStage,

      nextStage,

      completedAt,

      message:
        `Entrepreneur lifecycle advanced to ${this.formatStageLabel(
          currentStage
        )}.`,
    };
  }

  // =====================================================
  // Marketplace activation
  // =====================================================

  async activateMarketplace(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "marketplace_activated",
      "annual_meeting_pending",
      {
        marketplace_status:
          "Active",

        marketplace_visibility:
          true,
      }
    );
  }

  // =====================================================
  // Annual meeting registration
  // =====================================================

  async registerAnnualMeeting(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "annual_meeting_pending",
      "annual_meeting_completed",
      {
        annual_meeting_registered:
          true,
      }
    );
  }

  // =====================================================
  // Funding Queue path
  //
  // Used when the entrepreneur has not yet received all
  // 20 required annual funded units.
  // =====================================================

  async moveToFundingQueue(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "funding_queue",
      "funding_approved",
      {
        funding_queue_active:
          true,

        funding_status:
          "Waiting for Funding",
      }
    );
  }

  // =====================================================
  // Funding approval
  // =====================================================

  async approveFunding(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "funding_approved",
      "business_preparation",
      {
        funding_status:
          "Funding Approved",
      }
    );
  }

  // =====================================================
  // Business launch
  // =====================================================

  async launchBusiness(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "business_opening",
      "business_opened",
      {
        funding_status:
          "Business Opening",
      }
    );
  }

  // =====================================================
  // Activate operating business
  // =====================================================

  async activateBusiness(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "active_business",
      "quarterly_reporting",
      {
        ibos_status:
          "Fully Operational Business",

        daily_transactions_active:
          true,

        quarterly_reporting_active:
          true,

        automation_active:
          true,

        business_intelligence_active:
          true,
      }
    );
  }

  // =====================================================
  // Quarterly reporting
  // =====================================================

  async startQuarterlyReporting(
    entrepreneurId: string
  ): Promise<LifecycleTransitionResult> {
    return this.transitionStage(
      entrepreneurId,
      "quarterly_reporting",
      null,
      {
        quarterly_reporting_active:
          true,
      }
    );
  }

  // =====================================================
  // Helpers
  // =====================================================

  private buildQualificationMessage(
    coachAssignment: LifecycleCoachResult
  ): string {
    if (
      coachAssignment.assigned &&
      coachAssignment.coach
    ) {
      return (
        "Entrepreneur qualified successfully. " +
        `${coachAssignment.coach.fullName} was assigned as the entrepreneur's coach.`
      );
    }

    if (coachAssignment.assigned) {
      return (
        "Entrepreneur qualified successfully " +
        "and already has a coach assignment."
      );
    }

    return (
      "Entrepreneur qualified successfully. " +
      `Coach assignment is pending. ${coachAssignment.message}`
    );
  }

  private formatStageLabel(
    stage: EntrepreneurLifecycleStage
  ): string {
    return stage
      .split("_")
      .map(
        (word) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }
}