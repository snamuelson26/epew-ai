// =======================================================
// EPEW – EDE – IBOS
// Automatic Coach Assignment Service
// =======================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { CoachService } from "@/lib/services/CoachService";
import { CoachAssignmentService } from "@/lib/services/CoachAssignmentService";
import { CoachWorkloadService } from "@/lib/services/CoachWorkloadService";
import { Coach } from "@/lib/types/coach";

export interface AssignmentResult {
  success: boolean;

  coach?: Coach;

  assignmentId?: string;

  assignedAt?: string;

  message: string;
}

export class AutomaticCoachAssignmentService {
  private coachService: CoachService;
  private assignmentService: CoachAssignmentService;

  constructor(
    private readonly supabase: SupabaseClient
  ) {
    this.coachService = new CoachService(supabase);
    this.assignmentService =
      new CoachAssignmentService(supabase);
  }

  async assignEntrepreneur(
    entrepreneurId: string
  ): Promise<AssignmentResult> {
    // =====================================================
    // Prevent duplicate assignments
    // =====================================================

    const existing =
      await this.assignmentService.getByEntrepreneur(
        entrepreneurId
      );

    if (existing) {
      return {
        success: false,
        message:
          "Entrepreneur already has a coach assignment.",
      };
    }

    // =====================================================
    // Load eligible coaches
    // =====================================================

    const coaches =
      await this.coachService.getAvailable();

    const selectedCoach =
      CoachWorkloadService.bestCoach(coaches);

    if (!selectedCoach) {
      return {
        success: false,
        message:
          "No coach is currently available.",
      };
    }

    // =====================================================
    // Create assignment
    // =====================================================

    const assignment =
      await this.assignmentService.assign({
        entrepreneurId,

        coachId: selectedCoach.id,

        assignmentMethod:
          "automatic",

        assignmentReason:
          "Automatic assignment after qualification",

        assignedBy:
          "EntrepreneurLifecycleOrchestrator",
      });

    // =====================================================
    // Synchronize coach workload
    // =====================================================

    const {
      count: activeAssignmentCount,
      error: assignmentCountError,
    } = await this.supabase
      .from("coach_assignments")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("coach_id", selectedCoach.id)
      .in("assignment_status", [
        "assigned",
        "accepted",
        "paused",
      ]);

    if (assignmentCountError) {
      throw assignmentCountError;
    }

    const synchronizedCount =
      activeAssignmentCount ?? 0;

    const {
      data: updatedCoach,
      error: workloadError,
    } = await this.supabase
      .from("epew_coaches")
      .update({
        active_entrepreneur_count:
          synchronizedCount,

        last_assignment_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", selectedCoach.id)
      .select(
        "id, full_name, active_entrepreneur_count"
      )
      .single();

    if (workloadError) {
      throw workloadError;
    }

    if (!updatedCoach) {
      throw new Error(
        "Coach workload update did not return a coach record."
      );
    }

    // =====================================================
    // Success
    // =====================================================

    return {
      success: true,

      coach: selectedCoach,

      assignmentId: assignment.id,

      assignedAt: assignment.assignedAt,

      message:
        `${selectedCoach.fullName} assigned successfully.`,
    };
  }
}