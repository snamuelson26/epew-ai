/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: coach.ts
 * Description:
 * Enterprise domain model for Entrepreneur Development Coaches.
 *
 * Supports AI-first coaching with optional human coach
 * participation.
 *
 * Domain Model Only
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Record Status
 * ================================================================ */

export enum EDCCoachStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

/* ================================================================
 * Coach Type
 * ================================================================ */

export enum EDCCoachType {
  AI = "AI",
  HUMAN = "HUMAN",
  HYBRID = "HYBRID",
}

/* ================================================================
 * Assignment Mode
 * ================================================================ */

export enum EDCAssignmentMode {
  AI_FIRST = "AI_FIRST",
  HUMAN_REQUIRED = "HUMAN_REQUIRED",
  HUMAN_OPTIONAL = "HUMAN_OPTIONAL",
}

/* ================================================================
 * Coach Specialization
 * ================================================================ */

export enum EDCCoachSpecialization {
  GENERAL = "GENERAL",

  DISCOVERY = "DISCOVERY",

  CUSTOMER = "CUSTOMER",

  VALUE_PROPOSITION = "VALUE_PROPOSITION",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  FINANCIAL = "FINANCIAL",

  OPERATIONS = "OPERATIONS",

  REGULATORY = "REGULATORY",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  GROWTH = "GROWTH",

  COMMUNITY = "COMMUNITY",
}

/* ================================================================
 * Coaching Style
 * ================================================================ */

export enum EDCCoachingStyle {
  STRATEGIC = "STRATEGIC",

  ANALYTICAL = "ANALYTICAL",

  PRACTICAL = "PRACTICAL",

  ENCOURAGING = "ENCOURAGING",

  MOTIVATIONAL = "MOTIVATIONAL",

  EDUCATIONAL = "EDUCATIONAL",

  COLLABORATIVE = "COLLABORATIVE",

  ADAPTIVE = "ADAPTIVE",

  DIRECT = "DIRECT",

  VISIONARY = "VISIONARY",
}

/* ================================================================
 * Interview Style
 * ================================================================ */

export enum EDCInterviewStyle {
  CONVERSATIONAL = "CONVERSATIONAL",

  STRUCTURED = "STRUCTURED",

  QUESTION_BASED = "QUESTION_BASED",

  DISCOVERY_BASED = "DISCOVERY_BASED",

  COACHING_BASED = "COACHING_BASED",
}

/* ================================================================
 * Feedback Style
 * ================================================================ */

export enum EDCFeedbackStyle {
  SUPPORTIVE = "SUPPORTIVE",

  BALANCED = "BALANCED",

  DIRECT = "DIRECT",

  CHALLENGING = "CHALLENGING",
}

/* ================================================================
 * Teaching Style
 * ================================================================ */

export enum EDCTeachingStyle {
  VISUAL = "VISUAL",

  EXAMPLE_DRIVEN = "EXAMPLE_DRIVEN",

  DISCUSSION = "DISCUSSION",

  CASE_STUDY = "CASE_STUDY",

  ACTIVITY_BASED = "ACTIVITY_BASED",

  REFLECTION_BASED = "REFLECTION_BASED",
}

/* ================================================================
 * Coach Capacity
 * ================================================================ */

export enum EDCCapacityStatus {
  AVAILABLE = "AVAILABLE",

  LIMITED = "LIMITED",

  FULL = "FULL",

  UNAVAILABLE = "UNAVAILABLE",
}

/* ================================================================
 * Coach Identity
 * ================================================================ */

export interface EDCCoachIdentity {
  readonly coachId: UUID;

  readonly userId?: UUID | null;

  readonly coachCode: string;

  readonly displayName: string;

  readonly firstName?: string | null;

  readonly lastName?: string | null;

  readonly avatarUrl?: string | null;

  readonly coachType: EDCCoachType;

  readonly assignmentMode: EDCAssignmentMode;

  readonly status: EDCCoachStatus;
}

/* ================================================================
 * Professional Profile
 * ================================================================ */

export interface EDCCoachProfessionalProfile {
  readonly title: string;

  readonly biography?: string | null;

  readonly yearsExperience?: number;

  readonly certifications?: readonly string[];

  readonly specializations: readonly EDCCoachSpecialization[];

  readonly industries?: readonly string[];

  readonly languages?: readonly string[];
}
/* ================================================================
 * Coaching Methodology
 * ================================================================ */

/**
 * Defines how a coach develops entrepreneurs.
 * Used by the Coach Matching Engine.
 */
export interface EDCCoachingMethodology {
  readonly coachingStyles: readonly EDCCoachingStyle[];

  readonly interviewStyle: EDCInterviewStyle;

  readonly feedbackStyle: EDCFeedbackStyle;

  readonly teachingStyles: readonly EDCTeachingStyle[];

  readonly preferredDevelopmentActivities: readonly string[];

  readonly preferredReflectionMethods: readonly string[];

  readonly preferredAssessmentApproach:
    | "EVIDENCE_BASED"
    | "OBSERVATION_BASED"
    | "HYBRID";

  readonly encouragesSelfReflection: boolean;

  readonly encouragesCommunityLeadership: boolean;

  readonly encouragesContinuousLearning: boolean;
}

/* ================================================================
 * Coaching Personality
 * ================================================================ */

/**
 * Personality characteristics used by the
 * Coach Recommendation Engine.
 */
export interface EDCCoachingPersonality {
  readonly analytical: number;
  readonly encouraging: number;
  readonly visionary: number;
  readonly strategic: number;
  readonly practical: number;
  readonly motivational: number;
  readonly patient: number;
  readonly direct: number;
  readonly collaborative: number;
  readonly adaptive: number;

  readonly overallPersonalitySummary?: string | null;
}

/* ================================================================
 * Coaching Preferences
 * ================================================================ */

/**
 * Preferred entrepreneur characteristics.
 * These are NOT restrictions.
 * They improve matching quality.
 */
export interface EDCCoachingPreferences {
  readonly preferredBusinessStages?: readonly string[];

  readonly preferredIndustries?: readonly string[];

  readonly preferredDevelopmentStages?: readonly string[];

  readonly preferredLanguages?: readonly string[];

  readonly preferredSessionLengthMinutes?: number;

  readonly preferredMeetingTypes?: readonly (
    | "VIDEO"
    | "PHONE"
    | "IN_PERSON"
    | "PLATFORM"
  )[];

  readonly acceptsReassignments: boolean;

  readonly acceptsHighRiskEntrepreneurs: boolean;

  readonly acceptsStartupIdeas: boolean;

  readonly acceptsGrowthBusinesses: boolean;
}

/* ================================================================
 * Coach Capacity
 * ================================================================ */

/**
 * Operational workload.
 */
export interface EDCCoachCapacity {
  readonly maximumEntrepreneurs: number;

  readonly activeEntrepreneurs: number;

  readonly pendingAssignments: number;

  readonly completedEntrepreneurs: number;

  readonly availableCapacity: number;

  readonly utilizationPercentage: number;

  readonly capacityStatus: EDCCapacityStatus;
}

/* ================================================================
 * Coach Availability
 * ================================================================ */

/**
 * Working schedule.
 */
export interface EDCCoachAvailability {
  readonly availableMonday: boolean;

  readonly availableTuesday: boolean;

  readonly availableWednesday: boolean;

  readonly availableThursday: boolean;

  readonly availableFriday: boolean;

  readonly availableSaturday: boolean;

  readonly availableSunday: boolean;

  readonly availableTimeZones?: readonly string[];

  readonly availableHoursStart?: string;

  readonly availableHoursEnd?: string;

  readonly vacationMode: boolean;

  readonly availableForEmergencyAssignments: boolean;
}

/* ================================================================
 * Coach Performance
 * ================================================================ */

/**
 * Performance indicators.
 */
export interface EDCCoachPerformance {
  readonly entrepreneurSatisfaction: number;

  readonly averageReadinessImprovement: number;

  readonly averageDevelopmentCompletion: number;

  readonly entrepreneurRetentionRate: number;

  readonly entrepreneurLaunchRate: number;

  readonly fundingQualificationRate: number;

  readonly averageResponseTimeHours: number;

  readonly completedSessions: number;

  readonly cancelledSessions: number;

  readonly missedSessions: number;

  readonly overallPerformanceScore: number;
}

/* ================================================================
 * Coach Permissions
 * ================================================================ */

/**
 * Coach operational permissions.
 */
export interface EDCCoachPermissions {
  readonly canInterview: boolean;

  readonly canCreateDevelopmentPlans: boolean;

  readonly canAssignActivities: boolean;

  readonly canApproveActivities: boolean;

  readonly canRecordReflections: boolean;

  readonly canAssessReadiness: boolean;

  readonly canRecommendQualification: boolean;

  readonly canAdvanceDevelopmentStage: boolean;

  readonly canReferToFundingCommittee: boolean;

  readonly canGenerateReports: boolean;
}
/* ================================================================
 * Coach Audit
 * ================================================================ */

export interface EDCCoachAudit {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;

  readonly createdBy?: UUID | null;
  readonly updatedBy?: UUID | null;

  readonly version: number;

  readonly archivedAt?: ISODateString | null;
  readonly archivedBy?: UUID | null;
}

/* ================================================================
 * Main Coach Model
 * ================================================================ */

export interface EDCCoach {
  readonly id: UUID;

  readonly identity: EDCCoachIdentity;

  readonly professional: EDCCoachProfessionalProfile;

  readonly methodology: EDCCoachingMethodology;

  readonly personality: EDCCoachingPersonality;

  readonly preferences: EDCCoachingPreferences;

  readonly capacity: EDCCoachCapacity;

  readonly availability: EDCCoachAvailability;

  readonly performance: EDCCoachPerformance;

  readonly permissions: EDCCoachPermissions;

  readonly audit: EDCCoachAudit;
}

/* ================================================================
 * Create Coach
 * ================================================================ */

export interface CreateEDCCoachInput {
  readonly identity: Omit<
    EDCCoachIdentity,
    "coachId" | "status"
  >;

  readonly professional: EDCCoachProfessionalProfile;

  readonly methodology?: Partial<EDCCoachingMethodology>;

  readonly personality?: Partial<EDCCoachingPersonality>;

  readonly preferences?: Partial<EDCCoachingPreferences>;

  readonly availability?: Partial<EDCCoachAvailability>;

  readonly createdBy?: UUID | null;
}

/* ================================================================
 * Update Coach
 * ================================================================ */

export interface UpdateEDCCoachInput {
  readonly professional?: Partial<EDCCoachProfessionalProfile>;

  readonly methodology?: Partial<EDCCoachingMethodology>;

  readonly personality?: Partial<EDCCoachingPersonality>;

  readonly preferences?: Partial<EDCCoachingPreferences>;

  readonly availability?: Partial<EDCCoachAvailability>;

  readonly permissions?: Partial<EDCCoachPermissions>;

  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Coach Search
 * ================================================================ */

export interface EDCCoachSearchFilters {
  readonly query?: string;

  readonly coachTypes?: readonly EDCCoachType[];

  readonly statuses?: readonly EDCCoachStatus[];

  readonly specializations?: readonly EDCCoachSpecialization[];

  readonly industries?: readonly string[];

  readonly languages?: readonly string[];

  readonly capacityStatus?: readonly EDCCapacityStatus[];

  readonly assignmentModes?: readonly EDCAssignmentMode[];

  readonly availableOnly?: boolean;

  readonly acceptsHighRiskEntrepreneurs?: boolean;

  readonly acceptsStartupIdeas?: boolean;
}

/* ================================================================
 * Coach List Item
 * ================================================================ */

export interface EDCCoachListItem {
  readonly id: UUID;

  readonly coachCode: string;

  readonly displayName: string;

  readonly avatarUrl?: string | null;

  readonly coachType: EDCCoachType;

  readonly status: EDCCoachStatus;

  readonly specializations: readonly EDCCoachSpecialization[];

  readonly activeEntrepreneurs: number;

  readonly availableCapacity: number;

  readonly utilizationPercentage: number;

  readonly performanceScore: number;

  readonly nextAvailability?: ISODateString | null;
}

/* ================================================================
 * Coach Dashboard Summary
 * ================================================================ */

export interface EDCCoachDashboardSummary {
  readonly totalCoaches: number;

  readonly activeCoaches: number;

  readonly aiCoaches: number;

  readonly humanCoaches: number;

  readonly hybridCoaches: number;

  readonly availableCoaches: number;

  readonly fullCapacityCoaches: number;

  readonly averageUtilization: number;

  readonly averagePerformanceScore: number;

  readonly entrepreneursAssigned: number;

  readonly entrepreneursWaitingAssignment: number;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Coach Search Result
 * ================================================================ */

export interface EDCCoachSearchResult {
  readonly items: readonly EDCCoachListItem[];

  readonly totalItems: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;
}

/* ================================================================
 * Coach Profile Response
 * ================================================================ */

export interface EDCCoachProfileResponse {
  readonly coach: EDCCoach;

  readonly permissions: {
    readonly canView: boolean;

    readonly canEdit: boolean;

    readonly canArchive: boolean;

    readonly canAssignEntrepreneurs: boolean;

    readonly canCreateSessions: boolean;

    readonly canAssessReadiness: boolean;

    readonly canGenerateReports: boolean;
  };

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Helper Types
 * ================================================================ */

export type EDCCoachSummary = Pick<
  EDCCoachIdentity,
  | "coachId"
  | "coachCode"
  | "displayName"
  | "coachType"
>;

export type EDCCoachAssignmentSummary = Pick<
  EDCCoachCapacity,
  | "activeEntrepreneurs"
  | "availableCapacity"
  | "capacityStatus"
>;

export type EDCCoachPerformanceSummary = Pick<
  EDCCoachPerformance,
  | "overallPerformanceScore"
  | "entrepreneurLaunchRate"
  | "fundingQualificationRate"
>;

export type EDCCoachAvailabilitySummary = Pick<
  EDCCoachAvailability,
  | "vacationMode"
  | "availableForEmergencyAssignments"
>;

/* ================================================================
 * End Coach Domain Model
 * ================================================================ */