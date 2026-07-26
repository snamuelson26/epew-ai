/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: assessment.ts
 *
 * Enterprise Assessment Domain Model
 *
 * Assessment Philosophy
 *
 * Interview
 *      ↓
 * Evidence
 *      ↓
 * Readiness
 *      ↓
 * Assessment
 *      ↓
 * Qualification
 *      ↓
 * Development
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Assessment Status
 * ================================================================ */

export enum EDCAssessmentStatus {

  DRAFT = "DRAFT",

  IN_PROGRESS = "IN_PROGRESS",

  REVIEW_PENDING = "REVIEW_PENDING",

  APPROVED = "APPROVED",

  REJECTED = "REJECTED",

  ARCHIVED = "ARCHIVED"

}

/* ================================================================
 * Assessment Type
 * ================================================================ */

export enum EDCAssessmentType {

  INITIAL = "INITIAL",

  READINESS = "READINESS",

  QUALIFICATION = "QUALIFICATION",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  QUARTERLY = "QUARTERLY",

  ANNUAL = "ANNUAL",

  SPECIAL = "SPECIAL"

}

/* ================================================================
 * Assessment Decision
 * ================================================================ */

export enum EDCAssessmentDecision {

  APPROVED = "APPROVED",

  CONDITIONALLY_APPROVED = "CONDITIONALLY_APPROVED",

  DEVELOPMENT_REQUIRED = "DEVELOPMENT_REQUIRED",

  NOT_APPROVED = "NOT_APPROVED",

  ESCALATE_FOR_REVIEW = "ESCALATE_FOR_REVIEW"

}

/* ================================================================
 * Assessment Confidence
 * ================================================================ */

export enum EDCAssessmentConfidence {

  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  VERY_HIGH = "VERY_HIGH"

}

/* ================================================================
 * Assessment Dimension
 * ================================================================ */

export enum EDCAssessmentDimension {

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
 * Evidence Reference
 * ================================================================ */

export interface EDCAssessmentEvidenceReference {

  readonly evidenceId: UUID;

  readonly source: string;

  readonly description: string;

}

/* ================================================================
 * Finding
 * ================================================================ */

export interface EDCAssessmentFinding {

  readonly id: UUID;

  readonly dimension: EDCAssessmentDimension;

  readonly title: string;

  readonly description: string;

  readonly evidenceIds: readonly UUID[];

}

/* ================================================================
 * Strength
 * ================================================================ */

export interface EDCAssessmentStrength {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly evidenceIds?: readonly UUID[];

}

/* ================================================================
 * Growth Area
 * ================================================================ */

export interface EDCAssessmentGrowthArea {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "CRITICAL";

  readonly evidenceIds?: readonly UUID[];

}

/* ================================================================
 * Opportunity
 * ================================================================ */

export interface EDCAssessmentOpportunity {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly expectedImpact:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "TRANSFORMATIONAL";

}

/* ================================================================
 * Risk
 * ================================================================ */

export interface EDCAssessmentRisk {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly severity:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "CRITICAL";

  readonly mitigation: readonly string[];

}
/* ================================================================
 * Assessment Score
 * ================================================================ */

export interface EDCAssessmentScore {

  readonly dimension: EDCAssessmentDimension;

  readonly score: number;

  readonly confidence: EDCAssessmentConfidence;

  readonly rationale: string;

  readonly calculatedAt: ISODateString;

}

/* ================================================================
 * Assessment Recommendation
 * ================================================================ */

export interface EDCAssessmentRecommendation {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "CRITICAL";

  readonly expectedImpact:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "TRANSFORMATIONAL";

  readonly targetDimension: EDCAssessmentDimension;

  readonly estimatedCompletionDays?: number;

}

/* ================================================================
 * Dimension Assessment
 * ================================================================ */

export interface EDCAssessmentDimensionResult {

  readonly dimension: EDCAssessmentDimension;

  readonly score: EDCAssessmentScore;

  readonly findings:
    readonly EDCAssessmentFinding[];

  readonly strengths:
    readonly EDCAssessmentStrength[];

  readonly growthAreas:
    readonly EDCAssessmentGrowthArea[];

  readonly opportunities:
    readonly EDCAssessmentOpportunity[];

  readonly risks:
    readonly EDCAssessmentRisk[];

  readonly recommendations:
    readonly EDCAssessmentRecommendation[];

}

/* ================================================================
 * Qualification Decision
 * ================================================================ */

export interface EDCQualificationDecision {

  readonly decision: EDCAssessmentDecision;

  readonly reasoning: string;

  readonly requiredActions:
    readonly string[];

  readonly confidence:
    EDCAssessmentConfidence;

  readonly estimatedReadinessDays?: number;

}

/* ================================================================
 * Funding Recommendation
 * ================================================================ */

export interface EDCFundingRecommendation {

  readonly recommended: boolean;

  readonly recommendedAmount?: number;

  readonly reasoning: string;

  readonly conditions:
    readonly string[];

  readonly confidence:
    EDCAssessmentConfidence;

}

/* ================================================================
 * Marketplace Recommendation
 * ================================================================ */

export interface EDCMarketplaceRecommendation {

  readonly approved: boolean;

  readonly reasoning: string;

  readonly requiredActions:
    readonly string[];

  readonly confidence:
    EDCAssessmentConfidence;

}

/* ================================================================
 * Business Launch Recommendation
 * ================================================================ */

export interface EDCBusinessLaunchRecommendation {

  readonly launchReady: boolean;

  readonly reasoning: string;

  readonly prerequisites:
    readonly string[];

  readonly recommendedLaunchDate?:
    ISODateString;

  readonly confidence:
    EDCAssessmentConfidence;

}

/* ================================================================
 * AI Assessment Analysis
 * ================================================================ */

export interface EDCAIAssessmentAnalysis {

  readonly executiveSummary: string;

  readonly overallStrengths:
    readonly string[];

  readonly overallGrowthAreas:
    readonly string[];

  readonly keyRisks:
    readonly string[];

  readonly opportunities:
    readonly string[];

  readonly nextPriorities:
    readonly string[];

  readonly confidence:
    EDCAssessmentConfidence;

  readonly generatedAt:
    ISODateString;

}

/* ================================================================
 * Assessment Summary
 * ================================================================ */

export interface EDCAssessmentSummary {

  readonly entrepreneurId: UUID;

  readonly assessmentId: UUID;

  readonly overallScore: number;

  readonly confidence:
    EDCAssessmentConfidence;

  readonly qualification:
    EDCQualificationDecision;

  readonly funding:
    EDCFundingRecommendation;

  readonly marketplace:
    EDCMarketplaceRecommendation;

  readonly businessLaunch:
    EDCBusinessLaunchRecommendation;

  readonly executiveSummary: string;

  readonly completedAt:
    ISODateString;

}
/* ================================================================
 * Assessment Audit
 * ================================================================ */

export interface EDCAssessmentAudit {

  readonly createdBy: UUID | null;

  readonly updatedBy?: UUID | null;

  readonly reviewedBy?: UUID | null;

  readonly approvedBy?: UUID | null;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly reviewedAt?: ISODateString | null;

  readonly approvedAt?: ISODateString | null;

}

/* ================================================================
 * Master Assessment
 * ================================================================ */

export interface EDCAssessment {

  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly interviewId?: UUID | null;

  readonly readinessId?: UUID | null;

  readonly type: EDCAssessmentType;

  readonly status: EDCAssessmentStatus;

  readonly title: string;

  readonly description?: string | null;

  readonly dimensions:
    readonly EDCAssessmentDimensionResult[];

  readonly overallScore: number;

  readonly confidence:
    EDCAssessmentConfidence;

  readonly findings:
    readonly EDCAssessmentFinding[];

  readonly strengths:
    readonly EDCAssessmentStrength[];

  readonly growthAreas:
    readonly EDCAssessmentGrowthArea[];

  readonly opportunities:
    readonly EDCAssessmentOpportunity[];

  readonly risks:
    readonly EDCAssessmentRisk[];

  readonly recommendations:
    readonly EDCAssessmentRecommendation[];

  readonly qualification:
    EDCQualificationDecision;

  readonly funding:
    EDCFundingRecommendation;

  readonly marketplace:
    EDCMarketplaceRecommendation;

  readonly businessLaunch:
    EDCBusinessLaunchRecommendation;

  readonly aiAnalysis:
    EDCAIAssessmentAnalysis;

  readonly summary:
    EDCAssessmentSummary;

  readonly reviewRequired: boolean;

  readonly reviewReason?: string | null;

  readonly audit:
    EDCAssessmentAudit;

  readonly archivedAt?: ISODateString | null;

}

/* ================================================================
 * Create Assessment
 * ================================================================ */

export interface CreateEDCAssessmentInput {

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly interviewId?: UUID | null;

  readonly readinessId?: UUID | null;

  readonly type: EDCAssessmentType;

  readonly title: string;

  readonly description?: string | null;

}

/* ================================================================
 * Update Assessment
 * ================================================================ */

export interface UpdateEDCAssessmentInput {

  readonly assessmentId: UUID;

  readonly status?: EDCAssessmentStatus;

  readonly title?: string;

  readonly description?: string | null;

  readonly dimensions?:
    readonly EDCAssessmentDimensionResult[];

  readonly findings?:
    readonly EDCAssessmentFinding[];

  readonly strengths?:
    readonly EDCAssessmentStrength[];

  readonly growthAreas?:
    readonly EDCAssessmentGrowthArea[];

  readonly opportunities?:
    readonly EDCAssessmentOpportunity[];

  readonly risks?:
    readonly EDCAssessmentRisk[];

  readonly recommendations?:
    readonly EDCAssessmentRecommendation[];

  readonly qualification?:
    EDCQualificationDecision;

  readonly funding?:
    EDCFundingRecommendation;

  readonly marketplace?:
    EDCMarketplaceRecommendation;

  readonly businessLaunch?:
    EDCBusinessLaunchRecommendation;

  readonly aiAnalysis?:
    EDCAIAssessmentAnalysis;

  readonly summary?:
    EDCAssessmentSummary;

  readonly reviewRequired?: boolean;

  readonly reviewReason?: string | null;

}

/* ================================================================
 * Search Filters
 * ================================================================ */

export interface EDCAssessmentSearchFilters {

  readonly entrepreneurIds?: readonly UUID[];

  readonly coachIds?: readonly UUID[];

  readonly types?: readonly EDCAssessmentType[];

  readonly statuses?: readonly EDCAssessmentStatus[];

  readonly minimumScore?: number;

  readonly maximumScore?: number;

  readonly reviewRequired?: boolean;

  readonly search?: string;

}

/* ================================================================
 * Pagination
 * ================================================================ */

export interface EDCAssessmentPagination {

  readonly page: number;

  readonly pageSize: number;

  readonly totalItems: number;

  readonly totalPages: number;

}

/* ================================================================
 * Assessment List Item
 * ================================================================ */

export interface EDCAssessmentListItem {

  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly type: EDCAssessmentType;

  readonly status: EDCAssessmentStatus;

  readonly overallScore: number;

  readonly confidence:
    EDCAssessmentConfidence;

  readonly qualificationDecision:
    EDCAssessmentDecision;

  readonly fundingRecommended: boolean;

  readonly launchReady: boolean;

  readonly createdAt:
    ISODateString;

}

/* ================================================================
 * Search Result
 * ================================================================ */

export interface EDCAssessmentSearchResult {

  readonly items:
    readonly EDCAssessmentListItem[];

  readonly pagination:
    EDCAssessmentPagination;

}

/* ================================================================
 * Dashboard Summary
 * ================================================================ */

export interface EDCAssessmentDashboardSummary {

  readonly totalAssessments: number;

  readonly approvedAssessments: number;

  readonly pendingReview: number;

  readonly rejectedAssessments: number;

  readonly fundingRecommended: number;

  readonly launchReady: number;

  readonly averageScore: number;

  readonly averageConfidence:
    EDCAssessmentConfidence;

  readonly generatedAt:
    ISODateString;

}

/* ================================================================
 * Assessment Profile Response
 * ================================================================ */

export interface EDCAssessmentProfileResponse {

  readonly assessment:
    EDCAssessment;

  readonly permissions: {

    readonly canView: boolean;

    readonly canEdit: boolean;

    readonly canReview: boolean;

    readonly canApprove: boolean;

    readonly canArchive: boolean;

    readonly canRecommendFunding: boolean;

    readonly canApproveLaunch: boolean;

  };

  readonly generatedAt:
    ISODateString;

}

/* ================================================================
 * AI Assessment Workflow
 * ================================================================ */

export interface EDCAIAssessmentWorkflow {

  readonly assessmentId: UUID;

  readonly collectEvidence: boolean;

  readonly evaluateInterview: boolean;

  readonly evaluateReadiness: boolean;

  readonly evaluateActivities: boolean;

  readonly generateScores: boolean;

  readonly generateRecommendations: boolean;

  readonly generateQualification: boolean;

  readonly generateFundingRecommendation: boolean;

  readonly generateLaunchRecommendation: boolean;

  readonly requiresHumanReview: boolean;

  readonly finalDecisionMadeBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly processedAt?: ISODateString | null;

}

/* ================================================================
 * Archive / Restore
 * ================================================================ */

export interface ArchiveEDCAssessmentInput {

  readonly assessmentId: UUID;

  readonly archivedBy: UUID;

  readonly reason: string;

}

export interface RestoreEDCAssessmentInput {

  readonly assessmentId: UUID;

  readonly restoredBy: UUID;

  readonly reason?: string;

}

/* ================================================================
 * Projection Types
 * ================================================================ */

export type EDCAssessmentIdentity = Pick<
  EDCAssessment,
  | "id"
  | "entrepreneurId"
  | "coachId"
  | "type"
  | "status"
>;

export type EDCAssessmentScoreSummary = Pick<
  EDCAssessment,
  | "overallScore"
  | "confidence"
>;

export type EDCAssessmentDecisionSummary = Pick<
  EDCAssessment,
  | "qualification"
  | "funding"
  | "marketplace"
  | "businessLaunch"
>;

export type EDCAssessmentAIAnalysisSummary = Pick<
  EDCAIAssessmentAnalysis,
  | "executiveSummary"
  | "overallStrengths"
  | "overallGrowthAreas"
  | "confidence"
>;

export type EDCAssessmentRecommendationSummary = Pick<
  EDCAssessmentRecommendation,
  | "title"
  | "priority"
  | "expectedImpact"
>;

/* ================================================================
 * End Assessment Domain Model
 * ================================================================ */