// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Official Coach Types
// =======================================================

export type CoachStatus =
  | "available"
  | "busy"
  | "away"
  | "inactive";

export type AssignmentMethod =
  | "legacy"
  | "automatic"
  | "manual"
  | "reassignment"
  | "administrative";

export interface Coach {

  id: string;

  coachCode: string;

  fullName: string;

  professionalTitle: string;

  secondaryTitle: string;

  organizationName: string;

  email: string | null;

  phone: string | null;

  photoUrl: string | null;

  languages: string[];

  specialties: string[];

  status: CoachStatus;

  maximumCapacity: number;

  activeEntrepreneurCount: number;

  acceptsAutomaticAssignments: boolean;

  timezone: string;

  averageCommunicationScore: number | null;

  averageRelationshipScore: number | null;

  lastAssignmentAt: string | null;

  createdAt: string;

  updatedAt: string;

}

export interface CoachCard {

  id: string;

  coachCode: string;

  fullName: string;

  email: string | null;

  photoUrl: string | null;

  status: CoachStatus;

  activeEntrepreneurCount: number;

  maximumCapacity: number;

  workloadPercentage: number;

}

export interface CoachCapacity {

  coachId: string;

  fullName: string;

  active: number;

  capacity: number;

  remaining: number;

  percentage: number;

}

export interface CoachStatistics {

  totalCoaches: number;

  available: number;

  busy: number;

  away: number;

  inactive: number;

  totalAssignments: number;

  activeAssignments: number;

  completedAssignments: number;

  averageCommunicationScore: number;

  averageRelationshipScore: number;

}

export interface CoachPerformance {

  coachId: string;

  fullName: string;

  interviewsCompleted: number;

  entrepreneursQualified: number;

  businessesLaunched: number;

  communicationScore: number;

  relationshipScore: number;

  averageResponseHours: number;

}

export interface CoachAvailability {

  coachId: string;

  available: boolean;

  remainingCapacity: number;

  workloadPercentage: number;

}