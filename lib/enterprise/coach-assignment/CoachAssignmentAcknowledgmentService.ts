import type { SupabaseClient } from "@supabase/supabase-js";

import { EntrepreneurTimelineService } from "@/lib/services/EntrepreneurTimelineService";

export type CoachAcknowledgmentStatus =
  | "pending"
  | "acknowledged"
  | "declined"
  | "expired"
  | "reassignment_required";

export interface AcknowledgeCoachAssignmentOptions {
  assignmentId: string;
  coachId: string;
  acknowledgedBy: string;
  source?: string;
}

export interface DeclineCoachAssignmentOptions {
  assignmentId: string;
  coachId: string;
  declinedBy: string;
  reason: string;
  source?: string;
}

export interface CoachAssignmentAcknowledgmentResult {
  success: boolean;
  assignmentId: string;
  entrepreneurId: string;
  coachId: string;
  status: CoachAcknowledgmentStatus;
  message: string;
  processedAt: string;
}

export class CoachAssignmentAcknowledgmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CoachAssignmentAcknowledgmentError";
  }
}

export class CoachAssignmentAcknowledgmentService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly timeline: EntrepreneurTimelineService
  ) {}

  public async acknowledgeAssignment(
    options: AcknowledgeCoachAssignmentOptions
  ): Promise<CoachAssignmentAcknowledgmentResult> {
    try {
      const now = new Date().toISOString();

      const { data: assignment, error } = await this.supabase
        .from("coach_assignments")
        .select("*")
        .eq("id", options.assignmentId)
        .single();

      if (error || !assignment) {
        throw new CoachAssignmentAcknowledgmentError(
          "Coach assignment not found.",
          "ASSIGNMENT_NOT_FOUND",
          error
        );
      }

      if (assignment.coach_id !== options.coachId) {
        throw new CoachAssignmentAcknowledgmentError(
          "Coach is not assigned to this entrepreneur.",
          "INVALID_COACH"
        );
      }

      if (assignment.acknowledgment_status === "acknowledged") {
        throw new CoachAssignmentAcknowledgmentError(
          "Assignment has already been acknowledged.",
          "ALREADY_ACKNOWLEDGED"
        );
      }

      const { error: updateError } = await this.supabase
        .from("coach_assignments")
        .update({
          acknowledgment_status: "acknowledged",
          acknowledged_at: now,
          accepted_at: now,
          assignment_status: "active",
        })
        .eq("id", options.assignmentId);

      if (updateError) {
        throw new CoachAssignmentAcknowledgmentError(
          updateError.message,
          "UPDATE_FAILED",
          updateError
        );
      }

      await this.timeline.recordEvent({
        entrepreneurId: assignment.entrepreneur_id,
        eventType: "coach_assigned",
        eventTitle: "Coach Assignment Acknowledged",
        eventDescription: `${assignment.coach_name} acknowledged the assignment.`,
        lifecycleStage: "coach_assigned",
        performedBy: options.acknowledgedBy,
        source: options.source ?? "CoachAssignmentAcknowledgmentService",
        metadata: {
          assignmentId: assignment.id,
          coachId: assignment.coach_id,
          acknowledgedAt: now,
        },
      });

      return {
        success: true,
        assignmentId: assignment.id,
        entrepreneurId: assignment.entrepreneur_id,
        coachId: assignment.coach_id,
        status: "acknowledged",
        message: "Coach assignment acknowledged successfully.",
        processedAt: now,
      };
    } catch (error) {
      if (error instanceof CoachAssignmentAcknowledgmentError) {
        throw error;
      }

      throw new CoachAssignmentAcknowledgmentError(
        error instanceof Error
          ? error.message
          : "Unable to acknowledge coach assignment.",
        "ACKNOWLEDGMENT_FAILED",
        error
      );
    }
  }
  public async declineAssignment(
  options: DeclineCoachAssignmentOptions
): Promise<CoachAssignmentAcknowledgmentResult> {
  try {
    const now = new Date().toISOString();

    const { data: assignment, error } = await this.supabase
      .from("coach_assignments")
      .select("*")
      .eq("id", options.assignmentId)
      .single();

    if (error || !assignment) {
      throw new CoachAssignmentAcknowledgmentError(
        "Coach assignment not found.",
        "ASSIGNMENT_NOT_FOUND",
        error
      );
    }

    if (assignment.coach_id !== options.coachId) {
      throw new CoachAssignmentAcknowledgmentError(
        "Coach is not assigned to this entrepreneur.",
        "INVALID_COACH"
      );
    }

    const { error: updateError } = await this.supabase
      .from("coach_assignments")
      .update({
        acknowledgment_status: "declined",
        declined_at: now,
        decline_reason: options.reason,
        reassignment_required_at: now,
        assignment_status: "reassignment_required",
      })
      .eq("id", options.assignmentId);

    if (updateError) {
      throw new CoachAssignmentAcknowledgmentError(
        updateError.message,
        "UPDATE_FAILED",
        updateError
      );
    }

    await this.timeline.recordEvent({
      entrepreneurId: assignment.entrepreneur_id,
      eventType: "coach_assigned",
      eventTitle: "Coach Assignment Declined",
      eventDescription: `${assignment.coach_name} declined the assignment.`,
      lifecycleStage: "coach_assigned",
      performedBy: options.declinedBy,
      source:
        options.source ??
        "CoachAssignmentAcknowledgmentService",
      metadata: {
        action: "coach_assignment_declined",
        assignmentId: assignment.id,
        coachId: assignment.coach_id,
        declinedAt: now,
        reason: options.reason,
      },
    });

    return {
      success: true,
      assignmentId: assignment.id,
      entrepreneurId: assignment.entrepreneur_id,
      coachId: assignment.coach_id,
      status: "declined",
      message: "Coach assignment declined successfully.",
      processedAt: now,
    };
  } catch (error) {
    if (error instanceof CoachAssignmentAcknowledgmentError) {
      throw error;
    }

    throw new CoachAssignmentAcknowledgmentError(
      error instanceof Error
        ? error.message
        : "Unable to decline coach assignment.",
      "DECLINE_FAILED",
      error
    );
  }
}
public async expireOverdueAssignments(
  performedBy = "system",
  source = "CoachAssignmentAcknowledgmentService"
): Promise<number> {
  try {
    const now = new Date().toISOString();

    const { data: assignments, error } = await this.supabase
      .from("coach_assignments")
      .select(
        `
          id,
          entrepreneur_id,
          coach_id,
          coach_name,
          acknowledgment_status,
          acknowledgment_deadline
        `
      )
      .eq("acknowledgment_status", "pending")
      .lt("acknowledgment_deadline", now);

    if (error) {
      throw new CoachAssignmentAcknowledgmentError(
        error.message,
        "OVERDUE_ASSIGNMENTS_QUERY_FAILED",
        error
      );
    }

    if (!assignments || assignments.length === 0) {
      return 0;
    }

    for (const assignment of assignments) {
      const { error: updateError } = await this.supabase
        .from("coach_assignments")
        .update({
          acknowledgment_status: "expired",
          assignment_status: "reassignment_required",
          reassignment_required_at: now,
        })
        .eq("id", assignment.id)
        .eq("acknowledgment_status", "pending");

      if (updateError) {
        throw new CoachAssignmentAcknowledgmentError(
          updateError.message,
          "ASSIGNMENT_EXPIRATION_UPDATE_FAILED",
          updateError
        );
      }

      await this.timeline.recordEvent({
        entrepreneurId: assignment.entrepreneur_id,
        eventType: "coach_assigned",
        eventTitle: "Coach Assignment Acknowledgment Expired",
        eventDescription: `${
          assignment.coach_name ?? "The assigned coach"
        } did not acknowledge the assignment before the deadline.`,
        lifecycleStage: "coach_assigned",
        performedBy,
        source,
        metadata: {
          action: "coach_assignment_acknowledgment_expired",
          assignmentId: assignment.id,
          coachId: assignment.coach_id,
          acknowledgmentDeadline:
            assignment.acknowledgment_deadline,
          expiredAt: now,
          reassignmentRequired: true,
        },
      });
    }

    return assignments.length;
  } catch (error) {
    if (error instanceof CoachAssignmentAcknowledgmentError) {
      throw error;
    }

    throw new CoachAssignmentAcknowledgmentError(
      error instanceof Error
        ? error.message
        : "Unable to expire overdue coach assignments.",
      "ASSIGNMENT_EXPIRATION_FAILED",
      error
    );
  }
}
public async markReassignmentRequired(
  assignmentId: string,
  performedBy = "system",
  source = "CoachAssignmentAcknowledgmentService"
): Promise<CoachAssignmentAcknowledgmentResult> {
  try {
    const now = new Date().toISOString();

    const { data: assignment, error } = await this.supabase
      .from("coach_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (error || !assignment) {
      throw new CoachAssignmentAcknowledgmentError(
        "Coach assignment not found.",
        "ASSIGNMENT_NOT_FOUND",
        error
      );
    }

    const { error: updateError } = await this.supabase
      .from("coach_assignments")
      .update({
        acknowledgment_status: "reassignment_required",
        assignment_status: "reassignment_required",
        reassignment_required_at: now,
      })
      .eq("id", assignmentId);

    if (updateError) {
      throw new CoachAssignmentAcknowledgmentError(
        updateError.message,
        "REASSIGNMENT_UPDATE_FAILED",
        updateError
      );
    }

    await this.timeline.recordEvent({
      entrepreneurId: assignment.entrepreneur_id,
      eventType: "coach_assigned",
      eventTitle: "Coach Reassignment Required",
      eventDescription:
        "The current coach assignment requires reassignment.",
      lifecycleStage: "coach_assigned",
      performedBy,
      source,
      metadata: {
        action: "coach_reassignment_required",
        assignmentId: assignment.id,
        coachId: assignment.coach_id,
        reassignmentRequiredAt: now,
      },
    });

    return {
      success: true,
      assignmentId: assignment.id,
      entrepreneurId: assignment.entrepreneur_id,
      coachId: assignment.coach_id,
      status: "reassignment_required",
      message: "Coach reassignment marked as required.",
      processedAt: now,
    };
  } catch (error) {
    if (error instanceof CoachAssignmentAcknowledgmentError) {
      throw error;
    }

    throw new CoachAssignmentAcknowledgmentError(
      error instanceof Error
        ? error.message
        : "Unable to mark coach reassignment as required.",
      "REASSIGNMENT_REQUIRED_FAILED",
      error
    );
  }
}
public async getPendingAcknowledgments() {
  try {
    const { data, error } = await this.supabase
      .from("coach_assignments")
      .select(`
        id,
        entrepreneur_id,
        coach_id,
        coach_name,
        assigned_at,
        acknowledgment_deadline,
        assignment_status,
        acknowledgment_status
      `)
      .eq("acknowledgment_status", "pending")
      .order("acknowledgment_deadline", {
        ascending: true,
      });

    if (error) {
      throw new CoachAssignmentAcknowledgmentError(
        error.message,
        "GET_PENDING_ACKNOWLEDGMENTS_FAILED",
        error
      );
    }

    return data ?? [];
  } catch (error) {
    if (error instanceof CoachAssignmentAcknowledgmentError) {
      throw error;
    }

    throw new CoachAssignmentAcknowledgmentError(
      error instanceof Error
        ? error.message
        : "Unable to retrieve pending coach acknowledgments.",
      "GET_PENDING_ACKNOWLEDGMENTS_FAILED",
      error
    );
  }
}
}
