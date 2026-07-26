// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Assignment Types
// =======================================================

import { AssignmentMethod } from "./coach";

export type AssignmentStatus =
  | "assigned"
  | "accepted"
  | "paused"
  | "reassigned"
  | "completed"
  | "cancelled";

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

export interface CoachAssignment {
  id: string;

  entrepreneurId: string;

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

export interface AssignmentRequest {
  entrepreneurId: string;

  coachId?: string;

  assignmentMethod: AssignmentMethod;

  assignmentReason?: string;

  // NEW
  assignedBy?: string;
}

export interface ReassignmentRequest {
  assignmentId: string;

  newCoachId: string;

  reason: string;
}

export interface AssignmentSummary {
  totalAssignments: number;

  activeAssignments: number;

  pendingInterviews: number;

  completedInterviews: number;

  completedAssignments: number;
}