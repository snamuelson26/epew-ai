/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: readiness.ts
 *
 * Enterprise Evidence-Based Readiness Model
 *
 * This file defines the evidence-driven readiness framework used
 * throughout the Entrepreneur Development Coach Enterprise
 * Operating System.
 *
 * Philosophy:
 *
 * Evidence
 *      ↓
 * Observation
 *      ↓
 * Analysis
 *      ↓
 * Recommendation
 *      ↓
 * Development
 *      ↓
 * Readiness
 *
 * No business logic.
 * Domain model only.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Readiness Dimensions
 * ================================================================ */

export enum EDCReadinessDimension {

  CUSTOMER = "CUSTOMER",

  VALUE_PROPOSITION = "VALUE_PROPOSITION",

  MARKET = "MARKET",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  FINANCIAL = "FINANCIAL",

  OPERATIONS = "OPERATIONS",

  LEGAL = "LEGAL",

  LEADERSHIP = "LEADERSHIP",

  COMMUNICATION = "COMMUNICATION",

  COMMUNITY = "COMMUNITY",

  COMMITMENT = "COMMITMENT",

  COACHABILITY = "COACHABILITY",

  DECISION_MAKING = "DECISION_MAKING",

  OVERALL = "OVERALL"

}

/* ================================================================
 * Readiness Level
 * ================================================================ */

export enum EDCReadinessLevel {

  NOT_STARTED = "NOT_STARTED",

  DEVELOPING = "DEVELOPING",

  EMERGING = "EMERGING",

  READY = "READY",

  ADVANCED = "ADVANCED"

}

/* ================================================================
 * Trend
 * ================================================================ */

export enum EDCReadinessTrend {

  STRONGLY_DECLINING = "STRONGLY_DECLINING",

  DECLINING = "DECLINING",

  STABLE = "STABLE",

  IMPROVING = "IMPROVING",

  STRONGLY_IMPROVING = "STRONGLY_IMPROVING"

}

/* ================================================================
 * Confidence
 * ================================================================ */

export enum EDCConfidenceLevel {

  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  VERY_HIGH = "VERY_HIGH"

}

/* ================================================================
 * Evidence Source
 * ================================================================ */

export enum EDCEvidenceSource {

  INTERVIEW = "INTERVIEW",

  DEVELOPMENT_ACTIVITY = "DEVELOPMENT_ACTIVITY",

  REFLECTION = "REFLECTION",

  OBSERVATION = "OBSERVATION",

  DOCUMENT = "DOCUMENT",

  BUSINESS_PLAN = "BUSINESS_PLAN",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  FINANCIAL_PLAN = "FINANCIAL_PLAN",

  CUSTOMER_FEEDBACK = "CUSTOMER_FEEDBACK",

  PRESENTATION = "PRESENTATION",

  COACH_NOTE = "COACH_NOTE",

  SYSTEM = "SYSTEM"

}

/* ================================================================
 * Evidence Status
 * ================================================================ */

export enum EDCEvidenceStatus {

  PENDING = "PENDING",

  VERIFIED = "VERIFIED",

  REJECTED = "REJECTED"

}

/* ================================================================
 * Recommendation Priority
 * ================================================================ */

export enum EDCRecommendationPriority {

  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"

}

/* ================================================================
 * Development Impact
 * ================================================================ */

export enum EDCDevelopmentImpact {

  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  TRANSFORMATIONAL = "TRANSFORMATIONAL"

}

/* ================================================================
 * Evidence Record
 * ================================================================ */

export interface EDCEvidence {

  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly source: EDCEvidenceSource;

  readonly status: EDCEvidenceStatus;

  readonly title: string;

  readonly description: string;

  readonly submittedBy?: UUID | null;

  readonly verifiedBy?: UUID | null;

  readonly collectedAt: ISODateString;

  readonly verifiedAt?: ISODateString | null;

  readonly attachments?: readonly string[];

}

/* ================================================================
 * Observation
 * ================================================================ */

export interface EDCObservation {

  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly summary: string;

  readonly observations: readonly string[];

  readonly recordedBy?: UUID | null;

  readonly recordedAt: ISODateString;

}

/* ================================================================
 * Strength
 * ================================================================ */

export interface EDCReadinessStrength {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly evidenceIds?: readonly UUID[];

}

/* ================================================================
 * Growth Area
 * ================================================================ */

export interface EDCReadinessGrowthArea {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority: EDCRecommendationPriority;

  readonly evidenceIds?: readonly UUID[];

}
/* ================================================================
 * Readiness Recommendation
 * ================================================================ */

/**
 * Recommended action to improve a readiness dimension.
 */
export interface EDCReadinessRecommendation {
  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly title: string;

  readonly description: string;

  readonly priority: EDCRecommendationPriority;

  readonly expectedImpact: EDCDevelopmentImpact;

  readonly estimatedCompletionDays?: number;

  readonly evidenceIds?: readonly UUID[];

  readonly generatedBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Development Activity Recommendation
 * ================================================================ */

/**
 * Concrete development activity generated from readiness analysis.
 */
export interface EDCDevelopmentActivityRecommendation {
  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly title: string;

  readonly objective: string;

  readonly instructions: readonly string[];

  readonly expectedOutcome: string;

  readonly estimatedHours?: number;

  readonly expectedImpact: EDCDevelopmentImpact;

  readonly requiredEvidence?: readonly string[];

  readonly generatedBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Reflection Note
 * ================================================================ */

/**
 * Reflection after completing activities.
 */
export interface EDCReflectionNote {
  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly entrepreneurReflection: string;

  readonly coachReflection?: string | null;

  readonly lessonsLearned?: readonly string[];

  readonly nextImprovements?: readonly string[];

  readonly reflectionDate: ISODateString;
}

/* ================================================================
 * Readiness Score
 * ================================================================ */

/**
 * Numerical readiness score with confidence.
 */
export interface EDCReadinessScore {
  readonly score: number;

  readonly level: EDCReadinessLevel;

  readonly confidence: EDCConfidenceLevel;

  readonly trend: EDCReadinessTrend;

  readonly calculatedAt: ISODateString;
}

/* ================================================================
 * Readiness Dimension Assessment
 * ================================================================ */

/**
 * Complete evidence-backed assessment for one dimension.
 */
export interface EDCReadinessDimensionAssessment {
  readonly dimension: EDCReadinessDimension;

  readonly score: EDCReadinessScore;

  readonly evidence: readonly EDCEvidence[];

  readonly observations: readonly EDCObservation[];

  readonly strengths: readonly EDCReadinessStrength[];

  readonly growthAreas: readonly EDCReadinessGrowthArea[];

  readonly recommendations:
    readonly EDCReadinessRecommendation[];

  readonly developmentActivities:
    readonly EDCDevelopmentActivityRecommendation[];

  readonly reflections:
    readonly EDCReflectionNote[];

  readonly coachSummary?: string | null;

  readonly aiSummary?: string | null;

  readonly lastReviewedAt: ISODateString;

  readonly nextReviewAt?: ISODateString | null;
}

/* ================================================================
 * Readiness History
 * ================================================================ */

/**
 * Historical snapshot for auditing and trend analysis.
 */
export interface EDCReadinessHistoryRecord {
  readonly id: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly previousScore: number;

  readonly newScore: number;

  readonly trend: EDCReadinessTrend;

  readonly changeReason: string;

  readonly evidenceIds?: readonly UUID[];

  readonly updatedBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly updatedAt: ISODateString;
}

/* ================================================================
 * AI Readiness Analysis
 * ================================================================ */

/**
 * AI-generated explanation of readiness.
 */
export interface EDCAIReadinessAnalysis {
  readonly summary: string;

  readonly strengths: readonly string[];

  readonly weaknesses: readonly string[];

  readonly opportunities: readonly string[];

  readonly risks: readonly string[];

  readonly recommendedNextSteps:
    readonly string[];

  readonly confidence: EDCConfidenceLevel;

  readonly generatedAt: ISODateString;
}
/* ================================================================
 * Overall Readiness
 * ================================================================ */

/**
 * Master readiness object for an entrepreneur.
 * This is the central readiness record used throughout EDC-EOS.
 */
export interface EDCOverallReadiness {
  readonly entrepreneurId: UUID;

  readonly dimensions:
    readonly EDCReadinessDimensionAssessment[];

  readonly overallScore: EDCReadinessScore;

  readonly aiAnalysis: EDCAIReadinessAnalysis;

  readonly marketplaceReady: boolean;

  readonly fundingReady: boolean;

  readonly launchReady: boolean;

  readonly overallStrengths: readonly string[];

  readonly overallGrowthAreas: readonly string[];

  readonly highestPriorityRecommendations:
    readonly EDCReadinessRecommendation[];

  readonly generatedAt: ISODateString;

  readonly lastReviewedAt: ISODateString;

  readonly nextReviewAt?: ISODateString | null;
}

/* ================================================================
 * Dashboard Summary
 * ================================================================ */

export interface EDCReadinessDashboardSummary {

  readonly entrepreneursAssessed: number;

  readonly entrepreneursReady: number;

  readonly marketplaceReady: number;

  readonly fundingReady: number;

  readonly launchReady: number;

  readonly averageReadinessScore: number;

  readonly averageConfidence: EDCConfidenceLevel;

  readonly strongestDimension?: EDCReadinessDimension;

  readonly weakestDimension?: EDCReadinessDimension;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Search Filters
 * ================================================================ */

export interface EDCReadinessSearchFilters {

  readonly entrepreneurIds?: readonly UUID[];

  readonly dimensions?: readonly EDCReadinessDimension[];

  readonly readinessLevels?: readonly EDCReadinessLevel[];

  readonly confidenceLevels?: readonly EDCConfidenceLevel[];

  readonly minimumScore?: number;

  readonly maximumScore?: number;

  readonly fundingReady?: boolean;

  readonly marketplaceReady?: boolean;

  readonly launchReady?: boolean;
}

/* ================================================================
 * Create Assessment
 * ================================================================ */

export interface CreateEDCReadinessAssessmentInput {

  readonly entrepreneurId: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly evidence?: readonly EDCEvidence[];

  readonly observations?: readonly EDCObservation[];

  readonly strengths?: readonly EDCReadinessStrength[];

  readonly growthAreas?: readonly EDCReadinessGrowthArea[];

  readonly recommendations?:
    readonly EDCReadinessRecommendation[];

  readonly developmentActivities?:
    readonly EDCDevelopmentActivityRecommendation[];

  readonly reflections?:
    readonly EDCReflectionNote[];

}

/* ================================================================
 * Update Assessment
 * ================================================================ */

export interface UpdateEDCReadinessAssessmentInput {

  readonly entrepreneurId: UUID;

  readonly dimension: EDCReadinessDimension;

  readonly score?: number;

  readonly confidence?: EDCConfidenceLevel;

  readonly trend?: EDCReadinessTrend;

  readonly recommendations?:
    readonly EDCReadinessRecommendation[];

  readonly developmentActivities?:
    readonly EDCDevelopmentActivityRecommendation[];

  readonly reflections?:
    readonly EDCReflectionNote[];

}

/* ================================================================
 * Search Result
 * ================================================================ */

export interface EDCReadinessSearchResult {

  readonly items:
    readonly EDCOverallReadiness[];

  readonly totalItems: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;
}

/* ================================================================
 * Readiness Profile Response
 * ================================================================ */

export interface EDCReadinessProfileResponse {

  readonly readiness:
    EDCOverallReadiness;

  readonly permissions: {

    readonly canView: boolean;

    readonly canAssess: boolean;

    readonly canApprove: boolean;

    readonly canRecommendFunding: boolean;

    readonly canAdvanceStage: boolean;

    readonly canGenerateReport: boolean;

  };

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * AI Workflow
 * ================================================================ */

/**
 * AI-first assessment workflow.
 */
export interface EDCAIReadinessWorkflow {

  readonly collectEvidence: boolean;

  readonly analyzeEvidence: boolean;

  readonly generateRecommendations: boolean;

  readonly recommendActivities: boolean;

  readonly calculateScore: boolean;

  readonly recommendQualification: boolean;

  readonly requiresHumanReview: boolean;

  readonly finalDecisionMadeBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

}

/* ================================================================
 * Projection Types
 * ================================================================ */

export type EDCReadinessSummary = Pick<
  EDCOverallReadiness,
  | "entrepreneurId"
  | "overallScore"
  | "marketplaceReady"
  | "fundingReady"
  | "launchReady"
>;

export type EDCDimensionSummary = Pick<
  EDCReadinessDimensionAssessment,
  | "dimension"
  | "score"
  | "lastReviewedAt"
>;

export type EDCRecommendationSummary = Pick<
  EDCReadinessRecommendation,
  | "title"
  | "priority"
  | "expectedImpact"
>;

export type EDCEvidenceSummary = Pick<
  EDCEvidence,
  | "title"
  | "source"
  | "status"
  | "collectedAt"
>;

/* ================================================================
 * End Readiness Domain Model
 * ================================================================ */