// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Assignment Service
// =======================================================

import { SupabaseClient } from "@supabase/supabase-js";
import {
  CoachAssignment,
  AssignmentRequest,
  ReassignmentRequest,
} from "@/lib/types/coachAssignment";

export class CoachAssignmentService {
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  // ======================================================
  // Get all assignments
  // ======================================================

  async getAll(): Promise<CoachAssignment[]> {
    const { data, error } = await this.supabase
      .from("coach_assignments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return (data ?? []).map((row) =>
      this.mapAssignment(row)
    );
  }

  // ======================================================
  // Get one assignment
  // ======================================================

  async getById(
    id: string
  ): Promise<CoachAssignment | null> {
    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data
      ? this.mapAssignment(data)
      : null;
  }

  // ======================================================
  // Get permanent entrepreneur assignment
  // ======================================================

  async getByEntrepreneur(
    entrepreneurId: string
  ): Promise<CoachAssignment | null> {
    const normalizedEntrepreneurId =
      entrepreneurId?.trim();

    if (!normalizedEntrepreneurId) {
      throw new Error(
        "Entrepreneur ID is required."
      );
    }

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .select("*")
        .eq(
          "entrepreneur_id",
          normalizedEntrepreneurId
        )
        .not(
          "assignment_status",
          "in",
          '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    return data
      ? this.mapAssignment(data)
      : null;
  }

  // ======================================================
  // Get application assignment
  //
  // Used during:
  // Application → Coach Assignment → EMCC First Meeting
  // ======================================================

  async getByApplication(
    applicationId: number
  ): Promise<CoachAssignment | null> {
    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      throw new Error(
        "A valid Application ID is required."
      );
    }

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .select("*")
        .eq(
          "application_id",
          applicationId
        )
        .not(
          "assignment_status",
          "in",
          '("ended","declined","reassigned","cancelled","inactive","reassignment_required","completed")'
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    return data
      ? this.mapAssignment(data)
      : null;
  }

  // ======================================================
  // Synchronize Coach Workload
  //
  // Workload represents assignments for which the Coach
  // still has operational responsibility.
  //
  // Counted statuses:
  // - assigned
  // - active
  // - accepted
  // - paused
  //
  // Reassignment-required and terminal assignments do not
  // count against the current Coach.
  // ======================================================

  async synchronizeCoachWorkload(
    coachId: string
  ): Promise<number> {
    const normalizedCoachId =
      coachId?.trim();

    if (!normalizedCoachId) {
      throw new Error(
        "Coach ID is required to synchronize workload."
      );
    }

    const {
      count,
      error: countError,
    } = await this.supabase
      .from("coach_assignments")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "coach_id",
        normalizedCoachId
      )
      .in("assignment_status", [
        "assigned",
        "active",
        "accepted",
        "paused",
      ]);

    if (countError) {
      throw countError;
    }

    const synchronizedCount =
      count ?? 0;

    const {
      data: updatedCoach,
      error: workloadError,
    } = await this.supabase
      .from("epew_coaches")
      .update({
        active_entrepreneur_count:
          synchronizedCount,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        normalizedCoachId
      )
      .select(
        "id, active_entrepreneur_count"
      )
      .maybeSingle();

    if (workloadError) {
      throw workloadError;
    }

    if (!updatedCoach) {
      throw new Error(
        "Coach workload synchronization did not find a Coach profile."
      );
    }

    return synchronizedCount;
  }

  // ======================================================
  // Create Assignment
  //
  // Supports either:
  // - applicationId
  // - entrepreneurId
  //
  // At least one identity is required.
  // ======================================================

  async assign(
    request: AssignmentRequest
  ): Promise<CoachAssignment> {
    const assignedAt =
      new Date().toISOString();

    const applicationId =
      request.applicationId ?? null;

    const entrepreneurId =
      request.entrepreneurId?.trim() ||
      null;

    if (
      applicationId === null &&
      entrepreneurId === null
    ) {
      throw new Error(
        "Either Application ID or Entrepreneur ID is required to create a coach assignment."
      );
    }

    if (
      applicationId !== null &&
      (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      )
    ) {
      throw new Error(
        "Application ID must be a positive integer."
      );
    }

    const coachId =
      request.coachId?.trim() ||
      null;

    if (!coachId) {
      throw new Error(
        "Coach ID is required to create a coach assignment."
      );
    }

    const coach =
      await this.getCoachSnapshot(
        coachId
      );

    const assignedBy =
      this.normalizeUuidOrNull(
        request.assignedBy
      );

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .insert({
          application_id:
            applicationId,

          entrepreneur_id:
            entrepreneurId,

          coach_id:
            coach.id,

          coach_name:
            coach.fullName,

          coach_email:
            coach.email,

          coach_phone:
            coach.phone,

          assignment_method:
            request.assignmentMethod,

          assignment_reason:
            request.assignmentReason?.trim() ||
            null,

          assignment_status:
            "assigned",

          assigned_by:
            assignedBy,

          assigned_at:
            assignedAt,

          first_contact_due_at:
            new Date(
              Date.now() +
                24 *
                  60 *
                  60 *
                  1000
            ).toISOString(),

          communication_thread_status:
            "not_started",
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    await this.synchronizeCoachWorkload(
      coach.id
    );

    return this.mapAssignment(data);
  }

  // ======================================================
  // Reassign Coach
  //
  // Preserves application and entrepreneur identity from
  // the original assignment unless explicitly supplied.
  // ======================================================

  async reassign(
    request: ReassignmentRequest
  ): Promise<CoachAssignment> {
    const assignedAt =
      new Date().toISOString();

    const original =
      await this.getById(
        request.assignmentId
      );

    if (!original) {
      throw new Error(
        "Coach assignment not found."
      );
    }

    const applicationId =
      request.applicationId ??
      original.applicationId;

    const entrepreneurId =
      request.entrepreneurId?.trim() ||
      original.entrepreneurId;

    if (
      applicationId === null &&
      entrepreneurId === null
    ) {
      throw new Error(
        "Unable to reassign because the assignment has no application or entrepreneur identity."
      );
    }

    const newCoachId =
      request.newCoachId?.trim();

    if (!newCoachId) {
      throw new Error(
        "New Coach ID is required."
      );
    }

    const newCoach =
      await this.getCoachSnapshot(
        newCoachId
      );

    // ------------------------------------------------------
    // Close the previous assignment first.
    // ------------------------------------------------------

    const {
      error: closeError,
    } = await this.supabase
      .from("coach_assignments")
      .update({
        assignment_status:
          "reassigned",

        reassignment_reason:
          request.reason?.trim() ||
          null,

        ended_at:
          assignedAt,
      })
      .eq(
        "id",
        request.assignmentId
      );

    if (closeError) {
      throw closeError;
    }

    // ------------------------------------------------------
    // Create the replacement assignment.
    // ------------------------------------------------------

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .insert({
          application_id:
            applicationId,

          entrepreneur_id:
            entrepreneurId,

          coach_id:
            newCoach.id,

          coach_name:
            newCoach.fullName,

          coach_email:
            newCoach.email,

          coach_phone:
            newCoach.phone,

          assignment_method:
            "reassignment",

          assignment_reason:
            request.reason?.trim() ||
            null,

          assignment_status:
            "assigned",

          assigned_by:
            null,

          assigned_at:
            assignedAt,

          first_contact_due_at:
            new Date(
              Date.now() +
                24 *
                  60 *
                  60 *
                  1000
            ).toISOString(),

          communication_thread_status:
            "not_started",
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    if (original.coachId) {
      await this.synchronizeCoachWorkload(
        original.coachId
      );
    }

    await this.synchronizeCoachWorkload(
      newCoach.id
    );

    return this.mapAssignment(data);
  }

  // ======================================================
  // Complete Assignment
  // ======================================================

  async complete(
    assignmentId: string
  ): Promise<void> {
    const assignment =
      await this.getById(
        assignmentId
      );

    if (!assignment) {
      throw new Error(
        "Coach assignment not found."
      );
    }

    const { error } =
      await this.supabase
        .from("coach_assignments")
        .update({
          assignment_status:
            "completed",

          ended_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          assignmentId
        );

    if (error) throw error;

    if (assignment.coachId) {
      await this.synchronizeCoachWorkload(
        assignment.coachId
      );
    }
  }

  // ======================================================
  // Mark First Contact Complete
  // ======================================================

  async markFirstContact(
    assignmentId: string
  ): Promise<void> {
    const { error } =
      await this.supabase
        .from("coach_assignments")
        .update({
          first_contact_completed_at:
            new Date().toISOString(),

          communication_thread_status:
            "open",
        })
        .eq(
          "id",
          assignmentId
        );

    if (error) throw error;
  }

  // ======================================================
  // Coach Snapshot
  //
  // Coach identity is resolved from public.epew_coaches.
  // Snapshot fields are copied into coach_assignments so
  // the assignment preserves the Coach details that were
  // valid when the assignment was created.
  // ======================================================

  private async getCoachSnapshot(
    coachId: string
  ): Promise<{
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  }> {
    const { data, error } =
      await this.supabase
        .from("epew_coaches")
        .select(
          `
            id,
            full_name,
            email,
            phone,
            status
          `
        )
        .eq("id", coachId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Coach profile not found."
      );
    }

    if (
      data.status === "inactive"
    ) {
      throw new Error(
        "Inactive coaches cannot receive new assignments."
      );
    }

    return {
      id:
        data.id,

      fullName:
        data.full_name,

      email:
        data.email ?? null,

      phone:
        data.phone ?? null,
    };
  }

  // ======================================================
  // UUID Normalization
  //
  // coach_assignments.assigned_by is UUID in the database.
  // System labels must never be written into that column.
  // ======================================================

  private normalizeUuidOrNull(
    value?: string
  ): string | null {
    const normalized =
      value?.trim();

    if (!normalized) {
      return null;
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidPattern.test(normalized)
      ? normalized
      : null;
  }

  // ======================================================
  // Mapping
  // ======================================================

  private mapAssignment(
    row: any
  ): CoachAssignment {
    return {
      id:
        row.id,

      applicationId:
        row.application_id ?? null,

      entrepreneurId:
        row.entrepreneur_id ?? null,

      coachId:
        row.coach_id ?? null,

      coachName:
        row.coach_name ?? null,

      coachEmail:
        row.coach_email ?? null,

      coachPhone:
        row.coach_phone ?? null,

      assignmentStatus:
        row.assignment_status,

      assignmentMethod:
        row.assignment_method,

      assignmentReason:
        row.assignment_reason ?? null,

      reassignmentReason:
        row.reassignment_reason ?? null,

      assignedBy:
        row.assigned_by ?? null,

      assignedAt:
        row.assigned_at,

      acceptedAt:
        row.accepted_at ?? null,

      endedAt:
        row.ended_at ?? null,

      firstInterviewStatus:
        row.first_interview_status,

      firstInterviewDate:
        row.first_interview_date ?? null,

      firstContactDueAt:
        row.first_contact_due_at ?? null,

      firstContactCompletedAt:
        row.first_contact_completed_at ?? null,

      communicationThreadStatus:
        row.communication_thread_status,

      notes:
        row.notes ?? null,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }
}
