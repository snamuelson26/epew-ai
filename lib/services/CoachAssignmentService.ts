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

    return (data ?? []).map(this.mapAssignment);
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
        .single();

    if (error) return null;

    return this.mapAssignment(data);
  }

  // ======================================================
  // Get entrepreneur assignment
  // ======================================================

  async getByEntrepreneur(
    entrepreneurId: string
  ): Promise<CoachAssignment | null> {
    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .select("*")
        .eq(
          "entrepreneur_id",
          entrepreneurId
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
  // Create Assignment
  // ======================================================

  async assign(
    request: AssignmentRequest
  ): Promise<CoachAssignment> {
    const assignedAt =
      new Date().toISOString();

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .insert({
          entrepreneur_id:
            request.entrepreneurId,

          coach_id:
            request.coachId ?? null,

          assignment_method:
            request.assignmentMethod,

          assignment_reason:
            request.assignmentReason ??
            null,

          assignment_status:
            "assigned",

          assigned_by:
            request.assignedBy ??
            "EntrepreneurLifecycleOrchestrator",

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

    return this.mapAssignment(data);
  }

  // ======================================================
  // Reassign Coach
  // ======================================================

  async reassign(
    request: ReassignmentRequest
  ): Promise<CoachAssignment> {
    const assignedAt =
      new Date().toISOString();

    const entrepreneurId =
      (request as any)
        .entrepreneurId ??
      (request as any)
        .entrepreneur_id;

    const assignmentMethod =
      (request as any)
        .assignmentMethod ??
      (request as any)
        .assignment_method;

    const assignmentReason =
      (request as any)
        .assignmentReason ??
      (request as any)
        .assignment_reason;

    const coachId =
      (request as any).coachId ??
      (request as any).coach_id ??
      null;

    const { data, error } =
      await this.supabase
        .from("coach_assignments")
        .insert({
          entrepreneur_id:
            entrepreneurId,

          coach_id:
            coachId,

          assignment_method:
            assignmentMethod,

          assignment_reason:
            assignmentReason ??
            null,

          assignment_status:
            "assigned",

          assigned_by:
            "EntrepreneurLifecycleOrchestrator",

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

    return this.mapAssignment(data);
  }

  // ======================================================
  // Complete Assignment
  // ======================================================

  async complete(
    assignmentId: string
  ): Promise<void> {
    const { error } =
      await this.supabase
        .from("coach_assignments")
        .update({
          assignment_status:
            "completed",

          ended_at:
            new Date().toISOString(),
        })
        .eq("id", assignmentId);

    if (error) throw error;
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
        .eq("id", assignmentId);

    if (error) throw error;
  }

  // ======================================================
  // Mapping
  // ======================================================

  private mapAssignment(
    row: any
  ): CoachAssignment {
    return {
      id: row.id,

      entrepreneurId:
        row.entrepreneur_id,

      coachId:
        row.coach_id,

      coachName:
        row.coach_name,

      coachEmail:
        row.coach_email,

      coachPhone:
        row.coach_phone,

      assignmentStatus:
        row.assignment_status,

      assignmentMethod:
        row.assignment_method,

      assignmentReason:
        row.assignment_reason,

      reassignmentReason:
        row.reassignment_reason,

      assignedBy:
        row.assigned_by,

      assignedAt:
        row.assigned_at,

      acceptedAt:
        row.accepted_at,

      endedAt:
        row.ended_at,

      firstInterviewStatus:
        row.first_interview_status,

      firstInterviewDate:
        row.first_interview_date,

      firstContactDueAt:
        row.first_contact_due_at,

      firstContactCompletedAt:
        row.first_contact_completed_at,

      communicationThreadStatus:
        row.communication_thread_status,

      notes:
        row.notes,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }
}