// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Assignment Types
// =======================================================

import { AssignmentMethod } from "./coach";

// =======================================================
// Assignment Status
//
// Supports both the legacy permanent-entrepreneur lifecycle
// and the application / EMCC First Meeting lifecycle.
// =======================================================

export type AssignmentStatus =
  | "assigned"
  | "active"
  | "accepted"
  | "paused"
  | "reassignment_required"
  | "reassigned"
  | "completed"
  | "cancelled"
  | "declined"
  | "ended"
  | "inactive";

export type InterviewStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "cancelled";

export type CommunicationThreadStatus =
  | "not_started"
  | "open"
  | "waiting_for_entrepreneur"
  | "waiting_for_coach"
  | "closed";

// =======================================================
// Coach Assignment
//
// applicationId:
//   Used during Application → Coach Assignment → EMCC
//   First Meeting.
//
// entrepreneurId:
//   Used after the permanent public.entrepreneurs record
//   exists.
//
// During the application stage entrepreneurId may be null.
// =======================================================

export interface CoachAssignment {
  id: string;

  applicationId: number | null;

  entrepreneurId: string | null;

  coachId: string | null;

  coachName: string | null;

  coachEmail: string | null;

  coachPhone: string | null;

  assignmentStatus: AssignmentStatus;

  assignmentMethod: AssignmentMethod;

  assignmentReason: string | null;

  reassignmentReason: string | null;

  assignedBy: string | null;

  assignedAt: string;

  acceptedAt: string | null;

  endedAt: string | null;

  firstInterviewStatus: InterviewStatus;

  firstInterviewDate: string | null;

  firstContactDueAt: string | null;

  firstContactCompletedAt: string | null;

  communicationThreadStatus: CommunicationThreadStatus;

  notes: string | null;

  createdAt: string;

  updatedAt: string;
}

// =======================================================
// Assignment History
//
// Existing assignment history remains tied to the permanent
// entrepreneur lifecycle. Application-stage activity is
// handled separately until a permanent entrepreneur exists.
// =======================================================

export interface AssignmentHistory {
  id: string;

  assignmentId: string | null;

  entrepreneurId: string;

  coachId: string | null;

  previousCoachId: string | null;

  eventType: string;

  previousStatus: string | null;

  newStatus: string | null;

  reason: string | null;

  performedBy: string | null;

  eventData: Record<string, unknown>;

  createdAt: string;
}

// =======================================================
// Assignment Request
//
// At least one identity must be supplied:
//
// applicationId
// OR
// entrepreneurId
//
// The service enforces this at runtime.
// =======================================================

export interface AssignmentRequest {
  applicationId?: number;

  entrepreneurId?: string;

  coachId?: string;

  assignmentMethod: AssignmentMethod;

  assignmentReason?: string;

  /**
   * Auth user UUID when the assignment was performed
   * by a specific authenticated user.
   *
   * System labels such as
   * "EntrepreneurLifecycleOrchestrator" must not be written
   * into the UUID database column.
   */
  assignedBy?: string;
}

// =======================================================
// Reassignment Request
// =======================================================

export interface ReassignmentRequest {
  assignmentId: string;

  newCoachId: string;

  reason: string;

  applicationId?: number;

  entrepreneurId?: string;
}

// =======================================================
// Assignment Summary
// =======================================================

export interface AssignmentSummary {
  totalAssignments: number;

  activeAssignments: number;

  pendingInterviews: number;

  completedInterviews: number;

  completedAssignments: number;
}
