// =======================================================
// EPEW – EDE – IBOS
// Automatic Coach Assignment Service
// =======================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { CoachService } from "@/lib/services/CoachService";
import { CoachAssignmentService } from "@/lib/services/CoachAssignmentService";
import { CoachWorkloadService } from "@/lib/services/CoachWorkloadService";
import { Coach } from "@/lib/types/coach";
import { sendCoachAssignmentWelcomeEmail } from "@/lib/email/sendCoachAssignmentWelcomeEmail";

export interface AssignmentResult {
  success: boolean;

  coach?: Coach;

  assignmentId?: string;

  assignedAt?: string;

  alreadyAssigned?: boolean;

  welcomeEmailSent?: boolean;

  message: string;
}

export interface AutomaticApplicationAssignmentInput {
  applicationId: number;
  entrepreneurId?: string | null;
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

  async assignApplication(
    input: AutomaticApplicationAssignmentInput
  ): Promise<AssignmentResult> {
    const applicationId = Number(
      input.applicationId
    );

    const entrepreneurId =
      input.entrepreneurId?.trim() || null;

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      throw new Error(
        "A valid Application ID is required for automatic Coach assignment."
      );
    }

    // =====================================================
    // Load application
    // =====================================================

    const {
      data: application,
      error: applicationError,
    } = await this.supabase
      .from("entrepreneur_applications")
      .select(
        "id, user_id, full_name, email, business_name, questionnaire_status"
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      throw new Error(
        "Entrepreneur application not found."
      );
    }

    if (
      application.questionnaire_status !==
      "Completed"
    ) {
      return {
        success: false,
        message:
          "Automatic Coach assignment requires a completed Entrepreneur Questionnaire.",
      };
    }

    // =====================================================
    // Prevent duplicate application assignments
    //
    // Return the existing assignment as a successful,
    // idempotent result so downstream onboarding can safely
    // continue to meeting creation without assigning twice.
    // =====================================================

    const existing =
      await this.assignmentService.getByApplication(
        applicationId
      );

    if (existing) {
      const existingCoach =
        existing.coachId
          ? await this.coachService.getById(
              existing.coachId
            )
          : null;

      return {
        success: true,
        coach: existingCoach ?? undefined,
        assignmentId: existing.id,
        assignedAt: existing.assignedAt,
        alreadyAssigned: true,
        welcomeEmailSent: false,
        message:
          "Application already has an active Coach assignment.",
      };
    }

    // =====================================================
    // Load eligible Coaches and select best workload match
    // =====================================================

    const coaches =
      await this.coachService.getAvailable();

    const selectedCoach =
      CoachWorkloadService.bestCoach(coaches);

    if (!selectedCoach) {
      return {
        success: false,
        message:
          "No Coach is currently available for automatic assignment.",
      };
    }

    // =====================================================
    // Create application-centered automatic assignment
    //
    // AI Admin is a decision authority, not an auth UUID.
    // Therefore assignedBy is intentionally omitted.
    // =====================================================

    const assignment =
      await this.assignmentService.assign({
        applicationId,

        entrepreneurId:
          entrepreneurId || undefined,

        coachId: selectedCoach.id,

        assignmentMethod:
          "automatic",

        assignmentReason:
          "Automatic AI Admin assignment after Entrepreneur Questionnaire completion.",
      });

    // =====================================================
    // Update Coach assignment timestamp
    // =====================================================

    const {
      error: workloadError,
    } = await this.supabase
      .from("epew_coaches")
      .update({
        last_assignment_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", selectedCoach.id);

    if (workloadError) {
      throw workloadError;
    }

    // =====================================================
    // Record permanent enterprise operational history
    // =====================================================

    const decisionAt =
      assignment.assignedAt ||
      new Date().toISOString();

    const {
      error: historyError,
    } = await this.supabase
      .from("epew_operational_history")
      .insert({
        application_id:
          applicationId,

        entrepreneur_user_id:
          application.user_id || null,

        event_type:
          "coach_assignment",

        event_name:
          "Personal Coach Assigned",

        event_description:
          `${selectedCoach.fullName} was automatically assigned as the EPEW Personal Coach.`,

        new_status:
          "coach_assigned",

        occurred_at:
          decisionAt,

        actor_role:
          "system",

        actor_type:
          "system_automation",

        actor_name:
          "Automatic Coach Assignment Service",

        decision_made_by_role:
          "ai_admin",

        decision_made_by_type:
          "ai_admin",

        decision_made_by_name:
          "AI Admin",

        decision_organization:
          "EPEW",

        decision_reason:
          "Entrepreneur Questionnaire completed and an eligible Coach was available.",

        decision_at:
          decisionAt,

        executed_by:
          "AutomaticCoachAssignmentService",

        recorded_by:
          "EPEW EDE / IBOS",

        source_system:
          "Coach Assignment Engine",

        reference_type:
          "coach_assignment",

        reference_id:
          assignment.id,

        metadata: {
          coachId:
            selectedCoach.id,

          coachName:
            selectedCoach.fullName,

          assignmentMethod:
            "automatic",

          questionnaireStatus:
            application.questionnaire_status,
        },
      });

    if (historyError) {
      throw historyError;
    }

    // =====================================================
    // Send institutional Coach Assignment Welcome
    //
    // Email delivery failure must not create a duplicate
    // Coach assignment. sendEpewEmail records delivery
    // status independently.
    // =====================================================

    let welcomeEmailSent = false;

    if (application.email) {
      try {
        const emailResult =
          await sendCoachAssignmentWelcomeEmail({
            applicationId,

            assignmentId:
              assignment.id,

            entrepreneurEmail:
              application.email,

            entrepreneurName:
              application.full_name ||
              "Entrepreneur",

            businessName:
              application.business_name,

            coachName:
              selectedCoach.fullName,
          });

        welcomeEmailSent =
          emailResult?.status === "sent";
      } catch (emailError) {
        console.error(
          "Coach assignment welcome email failed:",
          emailError
        );
      }
    }

    return {
      success: true,

      coach:
        selectedCoach,

      assignmentId:
        assignment.id,

      assignedAt:
        assignment.assignedAt,

      alreadyAssigned:
        false,

      welcomeEmailSent,

      message:
        `${selectedCoach.fullName} assigned successfully by AI Admin.`,
    };
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
    // Record automatic assignment timestamp
    // =====================================================

    const {
      data: updatedCoach,
      error: workloadError,
    } = await this.supabase
      .from("epew_coaches")
      .update({
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
        "Coach assignment timestamp update did not return a coach record."
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