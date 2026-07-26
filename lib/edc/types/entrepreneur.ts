/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * (EDC-EOS)
 * ----------------------------------------------------------------
 * File: entrepreneur.ts
 * Description:
 * Enterprise domain model for entrepreneurs participating in the
 * Entrepreneur Development Coach Enterprise Operating System.
 *
 * This file contains ONLY domain types, interfaces, enums, and
 * helper types. No business logic belongs here.
 *
 * Architecture:
 * Domain Model Layer
 *
 * Author:
 * EPEW Enterprise Architecture
 * ================================================================
 */

/* ================================================================
 * Base Types
 * ================================================================ */

export type UUID = string;

export type ISODateString = string;

/* ================================================================
 * Common Status
 * ================================================================ */

export enum EDCStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  ARCHIVED = "ARCHIVED",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

/* ================================================================
 * Entrepreneur Status
 * ================================================================ */

export enum EDCEntrepreneurStatus {
  APPLICANT = "APPLICANT",
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  MARKETPLACE_READY = "MARKETPLACE_READY",
  FUNDING_READY = "FUNDING_READY",
  BUSINESS_LAUNCHED = "BUSINESS_LAUNCHED",
  GRADUATED = "GRADUATED",
  INACTIVE = "INACTIVE",
}

/* ================================================================
 * Development Stage
 * ================================================================ */

export enum EDCDevelopmentStage {
  ENROLLMENT = "ENROLLMENT",

  DISCOVERY = "DISCOVERY",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  FINANCIAL_PLANNING = "FINANCIAL_PLANNING",

  OPERATIONS = "OPERATIONS",

  REGULATORY_READINESS = "REGULATORY_READINESS",

  MARKETPLACE_PREPARATION = "MARKETPLACE_PREPARATION",

  FUNDING_PREPARATION = "FUNDING_PREPARATION",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  GROWTH = "GROWTH",
}

/* ================================================================
 * Business Stage
 * ================================================================ */

export enum EDCBusinessStage {
  IDEA = "IDEA",

  CONCEPT = "CONCEPT",

  VALIDATION = "VALIDATION",

  PLANNING = "PLANNING",

  STARTUP = "STARTUP",

  OPERATING = "OPERATING",

  GROWTH = "GROWTH",

  EXPANSION = "EXPANSION",
}

/* ================================================================
 * Learning Style
 * ================================================================ */

export enum EDCLearningStyle {
  VISUAL = "VISUAL",

  AUDITORY = "AUDITORY",

  READING = "READING",

  HANDS_ON = "HANDS_ON",

  DISCUSSION = "DISCUSSION",

  MIXED = "MIXED",
}

/* ================================================================
 * Communication Preference
 * ================================================================ */

export enum EDCCommunicationPreference {
  EMAIL = "EMAIL",

  PHONE = "PHONE",

  SMS = "SMS",

  VIDEO = "VIDEO",

  IN_PERSON = "IN_PERSON",

  PLATFORM_MESSAGE = "PLATFORM_MESSAGE",
}

/* ================================================================
 * Readiness Level
 * ================================================================ */

export enum EDCReadinessLevel {
  NOT_STARTED = "NOT_STARTED",

  DEVELOPING = "DEVELOPING",

  EMERGING = "EMERGING",

  READY = "READY",

  ADVANCED = "ADVANCED",
}

/* ================================================================
 * Motivation Level
 * ================================================================ */

export enum EDCMotivationLevel {
  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  EXCEPTIONAL = "EXCEPTIONAL",
}

/* ================================================================
 * Coachability
 * ================================================================ */

export enum EDCCoachabilityLevel {
  DEVELOPING = "DEVELOPING",

  GOOD = "GOOD",

  VERY_GOOD = "VERY_GOOD",

  EXCELLENT = "EXCELLENT",
}

/* ================================================================
 * Leadership Level
 * ================================================================ */

export enum EDCLeadershipLevel {
  EMERGING = "EMERGING",

  DEVELOPING = "DEVELOPING",

  ESTABLISHED = "ESTABLISHED",

  ADVANCED = "ADVANCED",
}
/* ================================================================
 * Entrepreneur Identity
 * ================================================================ */

/**
 * Core identity information for an entrepreneur.
 */
export interface EDCEntrepreneurIdentity {
  readonly entrepreneurId: UUID;
  readonly userId: UUID;
  readonly entrepreneurCode: string;

  readonly firstName: string;
  readonly middleName?: string | null;
  readonly lastName: string;
  readonly displayName: string;

  readonly dateOfBirth?: ISODateString | null;
  readonly profilePhotoUrl?: string | null;

  readonly preferredLanguage?: string | null;
  readonly timeZone?: string | null;
}

/* ================================================================
 * Contact Information
 * ================================================================ */

/**
 * Primary contact and location information.
 */
export interface EDCContactInformation {
  readonly email: string;
  readonly phone?: string | null;
  readonly alternatePhone?: string | null;

  readonly communicationPreference:
    | EDCCommunicationPreference
    | readonly EDCCommunicationPreference[];

  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateOrProvince?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;

  readonly emergencyContactName?: string | null;
  readonly emergencyContactPhone?: string | null;
  readonly emergencyContactRelationship?: string | null;
}

/* ================================================================
 * Business Profile
 * ================================================================ */

/**
 * Structured description of the entrepreneur's business.
 */
export interface EDCBusinessProfile {
  readonly businessId?: UUID | null;
  readonly businessCode?: string | null;

  readonly businessName?: string | null;
  readonly businessIdea: string;
  readonly businessDescription?: string | null;

  readonly industry: string;
  readonly businessCategory?: string | null;
  readonly businessStage: EDCBusinessStage;

  readonly mission?: string | null;
  readonly vision?: string | null;

  readonly primaryProductOrService?: string | null;
  readonly additionalProductsOrServices?: readonly string[];

  readonly targetCustomers?: readonly string[];
  readonly customerProblem?: string | null;
  readonly proposedSolution?: string | null;
  readonly valueProposition?: string | null;

  readonly revenueModel?: string | null;
  readonly pricingStrategy?: string | null;

  readonly businessLocation?: string | null;
  readonly serviceArea?: readonly string[];

  readonly startupCostEstimate?: number | null;
  readonly currentMonthlyRevenue?: number | null;
  readonly projectedMonthlyRevenue?: number | null;

  readonly numberOfCurrentEmployees?: number | null;
  readonly projectedJobsCreated?: number | null;

  readonly websiteUrl?: string | null;
  readonly businessLogoUrl?: string | null;

  readonly legalStructure?: string | null;
  readonly registrationStatus?: string | null;
  readonly licenseStatus?: string | null;
  readonly insuranceStatus?: string | null;

  readonly communityNeedAddressed?: string | null;
  readonly intendedCommunityImpact?: string | null;
}

/* ================================================================
 * Entrepreneur Strength
 * ================================================================ */

/**
 * A documented strength demonstrated by the entrepreneur.
 */
export interface EDCEntrepreneurStrength {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;

  readonly evidence?: readonly string[];
  readonly identifiedAt: ISODateString;
  readonly identifiedBy?: UUID | null;
}

/* ================================================================
 * Growth Area
 * ================================================================ */

/**
 * An area where the entrepreneur requires further development.
 */
export interface EDCGrowthArea {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;

  readonly priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  readonly evidence?: readonly string[];
  readonly recommendedActions?: readonly string[];

  readonly identifiedAt: ISODateString;
  readonly identifiedBy?: UUID | null;
  readonly resolvedAt?: ISODateString | null;
}

/* ================================================================
 * Entrepreneur Goal
 * ================================================================ */

/**
 * A short-term or long-term development goal.
 */
export interface EDCEntrepreneurGoal {
  readonly id: UUID;
  readonly title: string;
  readonly description?: string | null;

  readonly category:
    | "PERSONAL_DEVELOPMENT"
    | "BUSINESS_DEVELOPMENT"
    | "FINANCIAL"
    | "CUSTOMER"
    | "MARKET"
    | "OPERATIONS"
    | "LEADERSHIP"
    | "COMMUNITY"
    | "LAUNCH"
    | "GROWTH";

  readonly targetDate?: ISODateString | null;
  readonly status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "DEFERRED"
    | "CANCELLED";

  readonly progressPercentage: number;
  readonly completedAt?: ISODateString | null;
}

/* ================================================================
 * Development Profile
 * ================================================================ */

/**
 * Evolving profile describing how the entrepreneur learns,
 * develops, communicates, and responds to coaching.
 */
export interface EDCDevelopmentProfile {
  readonly currentDevelopmentStage: EDCDevelopmentStage;
  readonly currentReadinessLevel: EDCReadinessLevel;

  readonly learningStyle?: EDCLearningStyle | null;
  readonly communicationPreference?:
    | EDCCommunicationPreference
    | readonly EDCCommunicationPreference[];

  readonly motivationLevel?: EDCMotivationLevel | null;
  readonly coachabilityLevel?: EDCCoachabilityLevel | null;
  readonly leadershipLevel?: EDCLeadershipLevel | null;

  readonly decisionMakingConfidence?: number | null;
  readonly communicationConfidence?: number | null;
  readonly businessKnowledgeScore?: number | null;
  readonly organizationScore?: number | null;
  readonly commitmentScore?: number | null;

  readonly strengths: readonly EDCEntrepreneurStrength[];
  readonly growthAreas: readonly EDCGrowthArea[];
  readonly goals: readonly EDCEntrepreneurGoal[];

  readonly preferredLearningMethods?: readonly string[];
  readonly developmentBarriers?: readonly string[];
  readonly supportNeeds?: readonly string[];

  readonly shortTermGoals?: readonly string[];
  readonly longTermGoals?: readonly string[];

  readonly currentFocus?: readonly string[];
  readonly nextRecommendedFocus?: readonly string[];

  readonly lastReviewedAt?: ISODateString | null;
  readonly nextReviewAt?: ISODateString | null;
}
/* ================================================================
 * Coaching Relationship
 * ================================================================ */

/**
 * Describes the entrepreneur's relationship with the assigned
 * Entrepreneur Development Coach.
 */
export interface EDCEntrepreneurCoachingProfile {
  readonly assignedCoachId?: UUID | null;
  readonly assignedCoachCode?: string | null;
  readonly assignedCoachDisplayName?: string | null;

  readonly assignmentStatus:
    | "UNASSIGNED"
    | "PENDING"
    | "ASSIGNED"
    | "ACTIVE"
    | "REASSIGNMENT_REQUIRED"
    | "COMPLETED";

  readonly assignedAt?: ISODateString | null;
  readonly coachingStartedAt?: ISODateString | null;
  readonly coachingCompletedAt?: ISODateString | null;

  readonly totalSessions: number;
  readonly completedSessions: number;
  readonly cancelledSessions: number;
  readonly missedSessions: number;

  readonly lastSessionId?: UUID | null;
  readonly lastSessionAt?: ISODateString | null;

  readonly nextSessionId?: UUID | null;
  readonly nextSessionAt?: ISODateString | null;

  readonly preferredSessionDurationMinutes?: number | null;
  readonly preferredSessionFormat?:
    | "PHONE"
    | "VIDEO"
    | "IN_PERSON"
    | "PLATFORM"
    | "HYBRID"
    | null;

  readonly coachingFrequency?:
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "MILESTONE_BASED"
    | "CUSTOM"
    | null;

  readonly engagementLevel?:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "EXCEPTIONAL"
    | null;

  readonly currentCoachingFocus?: readonly string[];
  readonly recurringChallenges?: readonly string[];
  readonly coachingPreferences?: readonly string[];

  readonly requiresImmediateAttention: boolean;
  readonly attentionReason?: string | null;
}

/* ================================================================
 * Development Milestone Summary
 * ================================================================ */

/**
 * Lightweight milestone summary displayed on entrepreneur profiles
 * and development dashboards.
 */
export interface EDCEntrepreneurMilestoneSummary {
  readonly milestoneId: UUID;
  readonly title: string;
  readonly category:
    | "CUSTOMER_DISCOVERY"
    | "VALUE_PROPOSITION"
    | "MARKET_RESEARCH"
    | "BUSINESS_MODEL"
    | "FINANCIAL"
    | "OPERATIONS"
    | "REGULATORY"
    | "LEADERSHIP"
    | "COMMUNITY"
    | "MARKETPLACE"
    | "FUNDING"
    | "LAUNCH"
    | "GROWTH";

  readonly status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "VERIFIED"
    | "DEFERRED";

  readonly progressPercentage: number;
  readonly achievedAt?: ISODateString | null;
  readonly verifiedAt?: ISODateString | null;
  readonly verifiedBy?: UUID | null;
}

/* ================================================================
 * Activity Progress Summary
 * ================================================================ */

/**
 * Aggregated progress information for development activities.
 */
export interface EDCActivityProgressSummary {
  readonly totalAssigned: number;
  readonly notStarted: number;
  readonly inProgress: number;
  readonly submitted: number;
  readonly underReview: number;
  readonly completed: number;
  readonly overdue: number;
  readonly deferred: number;

  readonly completionRate: number;
  readonly onTimeCompletionRate: number;

  readonly lastActivityCompletedAt?: ISODateString | null;
  readonly nextActivityDueAt?: ISODateString | null;
}

/* ================================================================
 * Readiness Summary
 * ================================================================ */

/**
 * Lightweight readiness snapshot for the entrepreneur profile.
 *
 * Detailed readiness evidence and scoring history are defined in
 * readiness.ts.
 */
export interface EDCEntrepreneurReadinessSummary {
  readonly overallScore: number;
  readonly overallLevel: EDCReadinessLevel;

  readonly previousScore?: number | null;
  readonly scoreChange?: number | null;

  readonly strongestDimensions?: readonly string[];
  readonly priorityDimensions?: readonly string[];

  readonly evidenceCount: number;
  readonly assessedAt?: ISODateString | null;
  readonly assessedBy?: UUID | null;

  readonly marketplaceReady: boolean;
  readonly fundingReady: boolean;
  readonly launchReady: boolean;

  readonly nextAssessmentAt?: ISODateString | null;
}

/* ================================================================
 * Qualification Summary
 * ================================================================ */

/**
 * Current qualification state of the entrepreneur.
 */
export interface EDCEntrepreneurQualificationSummary {
  readonly status:
    | "NOT_EVALUATED"
    | "IN_REVIEW"
    | "DEVELOPMENT_REQUIRED"
    | "CONDITIONALLY_QUALIFIED"
    | "QUALIFIED"
    | "NOT_QUALIFIED"
    | "REASSESSMENT_REQUIRED";

  readonly qualificationScore?: number | null;
  readonly recommendedStage?: EDCDevelopmentStage | null;

  readonly decisionId?: UUID | null;
  readonly decidedAt?: ISODateString | null;
  readonly decidedBy?: UUID | null;

  readonly conditions?: readonly string[];
  readonly reasons?: readonly string[];
  readonly nextReviewAt?: ISODateString | null;
}

/* ================================================================
 * Development Progress
 * ================================================================ */

/**
 * Aggregated view of the entrepreneur's current development progress.
 */
export interface EDCEntrepreneurProgress {
  readonly overallDevelopmentScore: number;
  readonly developmentCompletionPercentage: number;

  readonly activityProgress: EDCActivityProgressSummary;
  readonly readiness: EDCEntrepreneurReadinessSummary;
  readonly qualification: EDCEntrepreneurQualificationSummary;

  readonly milestones: readonly EDCEntrepreneurMilestoneSummary[];
  readonly completedMilestoneCount: number;
  readonly totalMilestoneCount: number;

  readonly currentDevelopmentPlanId?: UUID | null;
  readonly activeActivityIds?: readonly UUID[];

  readonly lastProgressReviewAt?: ISODateString | null;
  readonly nextProgressReviewAt?: ISODateString | null;

  readonly progressTrend:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING"
    | "STRONGLY_IMPROVING"
    | "NOT_ENOUGH_DATA";

  readonly progressSummary?: string | null;
}

/* ================================================================
 * Entrepreneur Risk Indicator
 * ================================================================ */

/**
 * Identifies a development, engagement, or operational risk that
 * may affect entrepreneur progress.
 */
export interface EDCEntrepreneurRiskIndicator {
  readonly id: UUID;

  readonly category:
    | "ENGAGEMENT"
    | "ATTENDANCE"
    | "ACTIVITY_COMPLETION"
    | "FINANCIAL"
    | "BUSINESS_MODEL"
    | "REGULATORY"
    | "COMMUNICATION"
    | "COMMITMENT"
    | "COACHABILITY"
    | "OTHER";

  readonly severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  readonly title: string;
  readonly description: string;

  readonly evidence?: readonly string[];
  readonly recommendedResponse?: readonly string[];

  readonly identifiedAt: ISODateString;
  readonly identifiedBy?: UUID | null;

  readonly status:
    | "OPEN"
    | "MONITORING"
    | "ACTION_REQUIRED"
    | "RESOLVED"
    | "DISMISSED";

  readonly resolvedAt?: ISODateString | null;
  readonly resolvedBy?: UUID | null;
}

/* ================================================================
 * Coaching Memory Summary
 * ================================================================ */

/**
 * Structured long-term coaching insights retained for continuity.
 *
 * Detailed coaching memory records will be defined in the dedicated
 * coaching memory domain model.
 */
export interface EDCEntrepreneurCoachingMemory {
  readonly learningInsights?: readonly string[];
  readonly demonstratedStrengths?: readonly string[];
  readonly recurringChallenges?: readonly string[];
  readonly importantDecisions?: readonly string[];
  readonly commitments?: readonly string[];
  readonly preferredApproaches?: readonly string[];
  readonly motivationalFactors?: readonly string[];
  readonly barriersToProgress?: readonly string[];

  readonly latestSummary?: string | null;
  readonly lastUpdatedAt?: ISODateString | null;
}

/* ================================================================
 * Audit Metadata
 * ================================================================ */

/**
 * Standard immutable audit metadata for entrepreneur records.
 */
export interface EDCEntrepreneurAudit {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;

  readonly createdBy?: UUID | null;
  readonly updatedBy?: UUID | null;

  readonly version: number;

  readonly archivedAt?: ISODateString | null;
  readonly archivedBy?: UUID | null;
  readonly archiveReason?: string | null;
}

/* ================================================================
 * Main Entrepreneur Domain Model
 * ================================================================ */

/**
 * Master entrepreneur record for the Entrepreneur Development Coach
 * Enterprise Operating System.
 *
 * This interface acts as the central source of truth for the
 * entrepreneur's identity, business, development, coaching,
 * readiness, qualification, and progress.
 */
export interface EDCEntrepreneur {
  readonly id: UUID;

  readonly status: EDCEntrepreneurStatus;
  readonly recordStatus: EDCStatus;

  readonly identity: EDCEntrepreneurIdentity;
  readonly contact: EDCContactInformation;
  readonly business: EDCBusinessProfile;
  readonly development: EDCDevelopmentProfile;
  readonly coaching: EDCEntrepreneurCoachingProfile;
  readonly progress: EDCEntrepreneurProgress;
  readonly coachingMemory: EDCEntrepreneurCoachingMemory;

  readonly riskIndicators: readonly EDCEntrepreneurRiskIndicator[];

  readonly enrollmentDate: ISODateString;
  readonly activationDate?: ISODateString | null;
  readonly graduationDate?: ISODateString | null;

  readonly currentDevelopmentStage: EDCDevelopmentStage;
  readonly currentBusinessStage: EDCBusinessStage;

  readonly tags?: readonly string[];
  readonly internalNotes?: readonly string[];

  readonly audit: EDCEntrepreneurAudit;
}
/* ================================================================
 * Entrepreneur Creation Payload
 * ================================================================ */

/**
 * Payload used when creating a new entrepreneur development record.
 *
 * System-generated fields such as IDs, audit metadata, scores, and
 * progress summaries are intentionally excluded.
 */
export interface CreateEDCEntrepreneurInput {
  readonly identity: Omit<
    EDCEntrepreneurIdentity,
    "entrepreneurId" | "entrepreneurCode" | "displayName"
  > & {
    readonly entrepreneurCode?: string;
    readonly displayName?: string;
  };

  readonly contact: EDCContactInformation;
  readonly business: EDCBusinessProfile;

  readonly development?: Partial<EDCDevelopmentProfile>;
  readonly coaching?: Partial<EDCEntrepreneurCoachingProfile>;

  readonly enrollmentDate?: ISODateString;
  readonly currentDevelopmentStage?: EDCDevelopmentStage;
  readonly currentBusinessStage?: EDCBusinessStage;

  readonly tags?: readonly string[];
  readonly createdBy?: UUID | null;
}

/* ================================================================
 * Entrepreneur Update Payload
 * ================================================================ */

/**
 * General update payload for editable entrepreneur information.
 *
 * Historical, finalized, and audit-sensitive records should be
 * updated through dedicated workflows rather than direct mutation.
 */
export interface UpdateEDCEntrepreneurInput {
  readonly status?: EDCEntrepreneurStatus;
  readonly recordStatus?: EDCStatus;

  readonly identity?: Partial<
    Omit<EDCEntrepreneurIdentity, "entrepreneurId" | "userId">
  >;

  readonly contact?: Partial<EDCContactInformation>;
  readonly business?: Partial<EDCBusinessProfile>;
  readonly development?: Partial<EDCDevelopmentProfile>;
  readonly coaching?: Partial<EDCEntrepreneurCoachingProfile>;

  readonly currentDevelopmentStage?: EDCDevelopmentStage;
  readonly currentBusinessStage?: EDCBusinessStage;

  readonly tags?: readonly string[];
  readonly internalNotes?: readonly string[];

  readonly updatedBy?: UUID | null;
  readonly expectedVersion?: number;
}

/* ================================================================
 * Coach Assignment Payload
 * ================================================================ */

/**
 * Assigns or reassigns an Entrepreneur Development Coach.
 */
export interface AssignEDCCoachInput {
  readonly entrepreneurId: UUID;
  readonly coachId: UUID;

  readonly assignedAt?: ISODateString;
  readonly assignmentReason?: string | null;

  readonly preferredSessionDurationMinutes?: number | null;

  readonly preferredSessionFormat?:
    | "PHONE"
    | "VIDEO"
    | "IN_PERSON"
    | "PLATFORM"
    | "HYBRID"
    | null;

  readonly coachingFrequency?:
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "MILESTONE_BASED"
    | "CUSTOM"
    | null;

  readonly assignedBy?: UUID | null;
}

/**
 * Removes the current coach assignment.
 */
export interface UnassignEDCCoachInput {
  readonly entrepreneurId: UUID;
  readonly coachId?: UUID | null;

  readonly reason: string;
  readonly effectiveAt?: ISODateString;

  readonly unassignedBy?: UUID | null;
}

/* ================================================================
 * Development Stage Update
 * ================================================================ */

/**
 * Records advancement or movement between development stages.
 */
export interface UpdateEDCDevelopmentStageInput {
  readonly entrepreneurId: UUID;

  readonly fromStage: EDCDevelopmentStage;
  readonly toStage: EDCDevelopmentStage;

  readonly reason: string;
  readonly evidence?: readonly string[];

  readonly effectiveAt?: ISODateString;
  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Business Stage Update
 * ================================================================ */

/**
 * Records a verified change in the entrepreneur's business stage.
 */
export interface UpdateEDCBusinessStageInput {
  readonly entrepreneurId: UUID;

  readonly fromStage: EDCBusinessStage;
  readonly toStage: EDCBusinessStage;

  readonly reason: string;
  readonly evidence?: readonly string[];

  readonly effectiveAt?: ISODateString;
  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Strength and Growth Area Inputs
 * ================================================================ */

/**
 * Adds a documented entrepreneur strength.
 */
export interface AddEDCEntrepreneurStrengthInput {
  readonly entrepreneurId: UUID;

  readonly title: string;
  readonly description: string;
  readonly evidence?: readonly string[];

  readonly identifiedAt?: ISODateString;
  readonly identifiedBy?: UUID | null;
}

/**
 * Adds a documented growth area.
 */
export interface AddEDCGrowthAreaInput {
  readonly entrepreneurId: UUID;

  readonly title: string;
  readonly description: string;

  readonly priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  readonly evidence?: readonly string[];
  readonly recommendedActions?: readonly string[];

  readonly identifiedAt?: ISODateString;
  readonly identifiedBy?: UUID | null;
}

/**
 * Resolves an existing growth area.
 */
export interface ResolveEDCGrowthAreaInput {
  readonly entrepreneurId: UUID;
  readonly growthAreaId: UUID;

  readonly resolutionSummary: string;
  readonly evidence?: readonly string[];

  readonly resolvedAt?: ISODateString;
  readonly resolvedBy?: UUID | null;
}

/* ================================================================
 * Goal Inputs
 * ================================================================ */

/**
 * Creates a development or business goal.
 */
export interface CreateEDCEntrepreneurGoalInput {
  readonly entrepreneurId: UUID;

  readonly title: string;
  readonly description?: string | null;

  readonly category: EDCEntrepreneurGoal["category"];
  readonly targetDate?: ISODateString | null;

  readonly createdBy?: UUID | null;
}

/**
 * Updates goal status and measurable progress.
 */
export interface UpdateEDCEntrepreneurGoalInput {
  readonly entrepreneurId: UUID;
  readonly goalId: UUID;

  readonly title?: string;
  readonly description?: string | null;
  readonly targetDate?: ISODateString | null;

  readonly status?: EDCEntrepreneurGoal["status"];
  readonly progressPercentage?: number;

  readonly completedAt?: ISODateString | null;
  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Risk Indicator Inputs
 * ================================================================ */

/**
 * Creates a development or engagement risk indicator.
 */
export interface CreateEDCRiskIndicatorInput {
  readonly entrepreneurId: UUID;

  readonly category: EDCEntrepreneurRiskIndicator["category"];
  readonly severity: EDCEntrepreneurRiskIndicator["severity"];

  readonly title: string;
  readonly description: string;

  readonly evidence?: readonly string[];
  readonly recommendedResponse?: readonly string[];

  readonly identifiedAt?: ISODateString;
  readonly identifiedBy?: UUID | null;
}

/**
 * Updates the operational state of a risk indicator.
 */
export interface UpdateEDCRiskIndicatorInput {
  readonly entrepreneurId: UUID;
  readonly riskIndicatorId: UUID;

  readonly severity?: EDCEntrepreneurRiskIndicator["severity"];
  readonly status?: EDCEntrepreneurRiskIndicator["status"];

  readonly recommendedResponse?: readonly string[];

  readonly resolutionSummary?: string | null;
  readonly resolvedAt?: ISODateString | null;
  readonly resolvedBy?: UUID | null;
}

/* ================================================================
 * Coaching Memory Update
 * ================================================================ */

/**
 * Adds structured knowledge to the entrepreneur's coaching memory.
 */
export interface UpdateEDCCoachingMemoryInput {
  readonly entrepreneurId: UUID;

  readonly learningInsights?: readonly string[];
  readonly demonstratedStrengths?: readonly string[];
  readonly recurringChallenges?: readonly string[];
  readonly importantDecisions?: readonly string[];
  readonly commitments?: readonly string[];
  readonly preferredApproaches?: readonly string[];
  readonly motivationalFactors?: readonly string[];
  readonly barriersToProgress?: readonly string[];

  readonly latestSummary?: string | null;
  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Entrepreneur Search
 * ================================================================ */

/**
 * Search filters used by coach dashboards, entrepreneur queues,
 * reports, and administrative interfaces.
 */
export interface EDCEntrepreneurSearchFilters {
  readonly query?: string;

  readonly entrepreneurIds?: readonly UUID[];
  readonly userIds?: readonly UUID[];
  readonly coachIds?: readonly UUID[];

  readonly statuses?: readonly EDCEntrepreneurStatus[];
  readonly recordStatuses?: readonly EDCStatus[];

  readonly developmentStages?: readonly EDCDevelopmentStage[];
  readonly businessStages?: readonly EDCBusinessStage[];
  readonly readinessLevels?: readonly EDCReadinessLevel[];

  readonly industries?: readonly string[];
  readonly businessCategories?: readonly string[];

  readonly qualificationStatuses?: readonly EDCEntrepreneurQualificationSummary["status"][];

  readonly marketplaceReady?: boolean;
  readonly fundingReady?: boolean;
  readonly launchReady?: boolean;

  readonly requiresImmediateAttention?: boolean;
  readonly hasOpenRisks?: boolean;
  readonly hasOverdueActivities?: boolean;
  readonly hasUpcomingSession?: boolean;
  readonly isCoachAssigned?: boolean;

  readonly minimumReadinessScore?: number;
  readonly maximumReadinessScore?: number;

  readonly enrolledFrom?: ISODateString;
  readonly enrolledTo?: ISODateString;

  readonly lastSessionFrom?: ISODateString;
  readonly lastSessionTo?: ISODateString;

  readonly nextSessionFrom?: ISODateString;
  readonly nextSessionTo?: ISODateString;

  readonly tags?: readonly string[];
}

/* ================================================================
 * Sorting
 * ================================================================ */

export enum EDCEntrepreneurSortField {
  NAME = "NAME",
  ENROLLMENT_DATE = "ENROLLMENT_DATE",
  UPDATED_AT = "UPDATED_AT",
  DEVELOPMENT_STAGE = "DEVELOPMENT_STAGE",
  BUSINESS_STAGE = "BUSINESS_STAGE",
  READINESS_SCORE = "READINESS_SCORE",
  DEVELOPMENT_SCORE = "DEVELOPMENT_SCORE",
  NEXT_SESSION = "NEXT_SESSION",
  LAST_SESSION = "LAST_SESSION",
  ACTIVITY_COMPLETION = "ACTIVITY_COMPLETION",
  RISK_SEVERITY = "RISK_SEVERITY",
}

export enum EDCSortDirection {
  ASCENDING = "ASCENDING",
  DESCENDING = "DESCENDING",
}

export interface EDCEntrepreneurSort {
  readonly field: EDCEntrepreneurSortField;
  readonly direction: EDCSortDirection;
}

/* ================================================================
 * Pagination
 * ================================================================ */

export interface EDCPaginationInput {
  readonly page: number;
  readonly pageSize: number;
}

export interface EDCPaginationMetadata {
  readonly page: number;
  readonly pageSize: number;

  readonly totalItems: number;
  readonly totalPages: number;

  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

/* ================================================================
 * Search Request and Response
 * ================================================================ */

export interface EDCEntrepreneurSearchRequest {
  readonly filters?: EDCEntrepreneurSearchFilters;
  readonly sort?: EDCEntrepreneurSort;
  readonly pagination?: EDCPaginationInput;
}

/**
 * Lightweight entrepreneur projection for list pages and queues.
 */
export interface EDCEntrepreneurListItem {
  readonly id: UUID;
  readonly entrepreneurCode: string;

  readonly userId: UUID;

  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;

  readonly profilePhotoUrl?: string | null;

  readonly businessId?: UUID | null;
  readonly businessCode?: string | null;
  readonly businessName?: string | null;
  readonly businessIdea: string;
  readonly industry: string;

  readonly entrepreneurStatus: EDCEntrepreneurStatus;
  readonly recordStatus: EDCStatus;

  readonly developmentStage: EDCDevelopmentStage;
  readonly businessStage: EDCBusinessStage;

  readonly readinessScore: number;
  readonly readinessLevel: EDCReadinessLevel;
  readonly developmentScore: number;

  readonly coachId?: UUID | null;
  readonly coachDisplayName?: string | null;

  readonly lastSessionAt?: ISODateString | null;
  readonly nextSessionAt?: ISODateString | null;

  readonly activeActivityCount: number;
  readonly overdueActivityCount: number;
  readonly completedMilestoneCount: number;

  readonly marketplaceReady: boolean;
  readonly fundingReady: boolean;
  readonly launchReady: boolean;

  readonly requiresImmediateAttention: boolean;
  readonly highestOpenRiskSeverity?: EDCEntrepreneurRiskIndicator["severity"] | null;

  readonly enrollmentDate: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface EDCEntrepreneurSearchResult {
  readonly items: readonly EDCEntrepreneurListItem[];
  readonly pagination: EDCPaginationMetadata;
}

/* ================================================================
 * Entrepreneur Dashboard Summary
 * ================================================================ */

/**
 * Aggregated operational totals displayed on the EDC dashboard.
 */
export interface EDCEntrepreneurDashboardSummary {
  readonly totalEntrepreneurs: number;
  readonly activeEntrepreneurs: number;
  readonly unassignedEntrepreneurs: number;

  readonly entrepreneursRequiringAttention: number;
  readonly entrepreneursWithOverdueActivities: number;
  readonly entrepreneursWithUpcomingSessions: number;

  readonly entrepreneursInDiscovery: number;
  readonly entrepreneursInDevelopment: number;
  readonly entrepreneursMarketplaceReady: number;
  readonly entrepreneursFundingReady: number;
  readonly entrepreneursLaunchReady: number;
  readonly businessesLaunched: number;

  readonly averageReadinessScore: number;
  readonly averageDevelopmentScore: number;
  readonly averageActivityCompletionRate: number;

  readonly readinessImprovingCount: number;
  readonly readinessStableCount: number;
  readonly readinessDecliningCount: number;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Entrepreneur Profile Response
 * ================================================================ */

/**
 * Complete profile response used by the entrepreneur detail page.
 */
export interface EDCEntrepreneurProfileResponse {
  readonly entrepreneur: EDCEntrepreneur;

  readonly permissions: {
    readonly canView: boolean;
    readonly canEditProfile: boolean;
    readonly canAssignCoach: boolean;
    readonly canCreateSession: boolean;
    readonly canCreateDevelopmentPlan: boolean;
    readonly canAssignActivity: boolean;
    readonly canRecordReflection: boolean;
    readonly canAssessReadiness: boolean;
    readonly canRecommendQualification: boolean;
    readonly canAdvanceStage: boolean;
    readonly canArchive: boolean;
  };

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Archive and Restore Inputs
 * ================================================================ */

/**
 * Archives an entrepreneur without deleting historical records.
 */
export interface ArchiveEDCEntrepreneurInput {
  readonly entrepreneurId: UUID;
  readonly reason: string;

  readonly archivedAt?: ISODateString;
  readonly archivedBy?: UUID | null;
}

/**
 * Restores an archived entrepreneur record.
 */
export interface RestoreEDCEntrepreneurInput {
  readonly entrepreneurId: UUID;
  readonly reason: string;

  readonly restoredAt?: ISODateString;
  readonly restoredBy?: UUID | null;
}

/* ================================================================
 * Type Guards and Utility Type Contracts
 * ================================================================ */

/**
 * Nullable entrepreneur reference used by services and workflows.
 */
export type EDCEntrepreneurReference =
  | Pick<EDCEntrepreneur, "id" | "status" | "currentDevelopmentStage">
  | null;

/**
 * Entrepreneur identity projection.
 */
export type EDCEntrepreneurIdentitySummary = Pick<
  EDCEntrepreneurIdentity,
  | "entrepreneurId"
  | "userId"
  | "entrepreneurCode"
  | "firstName"
  | "lastName"
  | "displayName"
  | "profilePhotoUrl"
>;

/**
 * Entrepreneur business projection.
 */
export type EDCEntrepreneurBusinessSummary = Pick<
  EDCBusinessProfile,
  | "businessId"
  | "businessCode"
  | "businessName"
  | "businessIdea"
  | "industry"
  | "businessCategory"
  | "businessStage"
>;

/**
 * Coach assignment projection.
 */
export type EDCEntrepreneurCoachAssignment = Pick<
  EDCEntrepreneurCoachingProfile,
  | "assignedCoachId"
  | "assignedCoachCode"
  | "assignedCoachDisplayName"
  | "assignmentStatus"
  | "assignedAt"
  | "nextSessionAt"
>;

/**
 * Readiness projection for reporting and queue views.
 */
export type EDCEntrepreneurReadinessProjection = Pick<
  EDCEntrepreneurReadinessSummary,
  | "overallScore"
  | "overallLevel"
  | "scoreChange"
  | "marketplaceReady"
  | "fundingReady"
  | "launchReady"
  | "assessedAt"
>;

/* ================================================================
 * End of Entrepreneur Domain Model
 * ================================================================ */