/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: interview.ts
 *
 * Enterprise Interview Domain Model
 *
 * This file defines the complete entrepreneur interview model used
 * by the Entrepreneur Development Coach.
 *
 * Philosophy
 *
 * Interview
 *      ↓
 * Evidence
 *      ↓
 * Observation
 *      ↓
 * Assessment
 *      ↓
 * Readiness
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
 * Interview Status
 * ================================================================ */

export enum EDCInterviewStatus {

  SCHEDULED = "SCHEDULED",

  IN_PROGRESS = "IN_PROGRESS",

  PAUSED = "PAUSED",

  COMPLETED = "COMPLETED",

  REVIEW_PENDING = "REVIEW_PENDING",

  APPROVED = "APPROVED",

  ARCHIVED = "ARCHIVED"

}

/* ================================================================
 * Interview Type
 * ================================================================ */

export enum EDCInterviewType {

  INITIAL = "INITIAL",

  DISCOVERY = "DISCOVERY",

  READINESS = "READINESS",

  QUALIFICATION = "QUALIFICATION",

  FOLLOW_UP = "FOLLOW_UP",

  BUSINESS_REVIEW = "BUSINESS_REVIEW",

  FUNDING_REVIEW = "FUNDING_REVIEW",

  MILESTONE_REVIEW = "MILESTONE_REVIEW",

  EXIT = "EXIT"

}

/* ================================================================
 * Interview Mode
 * ================================================================ */

export enum EDCInterviewMode {

  AI = "AI",

  HUMAN = "HUMAN",

  HYBRID = "HYBRID"

}

/* ================================================================
 * Question Type
 * ================================================================ */

export enum EDCQuestionType {

  OPEN_ENDED = "OPEN_ENDED",

  YES_NO = "YES_NO",

  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",

  SCALE = "SCALE",

  RANKING = "RANKING",

  DATE = "DATE",

  NUMBER = "NUMBER",

  TEXT = "TEXT",

  FILE_UPLOAD = "FILE_UPLOAD"

}

/* ================================================================
 * Question Category
 * ================================================================ */

export enum EDCQuestionCategory {

  PERSONAL = "PERSONAL",

  BUSINESS = "BUSINESS",

  CUSTOMERS = "CUSTOMERS",

  MARKET = "MARKET",

  PRODUCT = "PRODUCT",

  OPERATIONS = "OPERATIONS",

  FINANCE = "FINANCE",

  LEGAL = "LEGAL",

  LEADERSHIP = "LEADERSHIP",

  SALES = "SALES",

  MARKETING = "MARKETING",

  COMMUNITY = "COMMUNITY",

  COMMITMENT = "COMMITMENT",

  GOALS = "GOALS"

}

/* ================================================================
 * Interview Question
 * ================================================================ */

export interface EDCInterviewQuestion {

  readonly id: UUID;

  readonly category: EDCQuestionCategory;

  readonly type: EDCQuestionType;

  readonly question: string;

  readonly description?: string;

  readonly required: boolean;

  readonly order: number;

  readonly followUpEnabled: boolean;

}

/* ================================================================
 * Interview Response
 * ================================================================ */

export interface EDCInterviewResponse {

  readonly questionId: UUID;

  readonly answer: unknown;

  readonly answeredAt: ISODateString;

  readonly confidence?: number;

  readonly attachments?: readonly string[];

}

/* ================================================================
 * Follow-up Question
 * ================================================================ */

export interface EDCFollowUpQuestion {

  readonly id: UUID;

  readonly parentQuestionId: UUID;

  readonly question: string;

  readonly reason: string;

  readonly generatedBy:

    | "AI"

    | "HUMAN"

    | "HYBRID";

  readonly askedAt: ISODateString;

}

/* ================================================================
 * Interview Evidence
 * ================================================================ */

export interface EDCInterviewEvidence {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly sourceQuestionId: UUID;

  readonly confidence: number;

  readonly createdAt: ISODateString;

}
/* ================================================================
 * Interview Observation
 * ================================================================ */

/**
 * Structured observations recorded during an interview.
 */
export interface EDCInterviewObservation {

  readonly id: UUID;

  readonly category: EDCQuestionCategory;

  readonly summary: string;

  readonly details?: readonly string[];

  readonly evidenceIds?: readonly UUID[];

  readonly confidence: number;

  readonly recordedBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly recordedAt: ISODateString;

}

/* ================================================================
 * Interview Opportunity
 * ================================================================ */

export interface EDCInterviewOpportunity {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly potentialImpact:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "TRANSFORMATIONAL";

  readonly recommendedActions:
    readonly string[];

  readonly evidenceIds?: readonly UUID[];

}

/* ================================================================
 * Interview Risk
 * ================================================================ */

export interface EDCInterviewRisk {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly mitigationRecommendations:
    readonly string[];

  readonly evidenceIds?: readonly UUID[];

}

/* ================================================================
 * Missing Information
 * ================================================================ */

export interface EDCInterviewMissingInformation {

  readonly id: UUID;

  readonly title: string;

  readonly reason: string;

  readonly suggestedQuestion?: string;

  readonly priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

}

/* ================================================================
 * AI Interview Analysis
 * ================================================================ */

export interface EDCAIInterviewAnalysis {

  readonly executiveSummary: string;

  readonly entrepreneurStrengths:
    readonly string[];

  readonly entrepreneurGrowthAreas:
    readonly string[];

  readonly opportunities:
    readonly EDCInterviewOpportunity[];

  readonly risks:
    readonly EDCInterviewRisk[];

  readonly missingInformation:
    readonly EDCInterviewMissingInformation[];

  readonly confidence: number;

  readonly generatedAt: ISODateString;

}

/* ================================================================
 * Qualification Recommendation
 * ================================================================ */

export interface EDCQualificationRecommendation {

  readonly recommended:

    | "QUALIFIED"

    | "CONDITIONALLY_QUALIFIED"

    | "NOT_READY"

    | "REQUIRES_REVIEW";

  readonly reasoning: string;

  readonly requiredActions:
    readonly string[];

  readonly estimatedReadinessDays?: number;

}

/* ================================================================
 * Interview Summary
 * ================================================================ */

export interface EDCInterviewSummary {

  readonly entrepreneurId: UUID;

  readonly interviewId: UUID;

  readonly executiveSummary: string;

  readonly keyFindings:
    readonly string[];

  readonly observations:
    readonly EDCInterviewObservation[];

  readonly aiAnalysis:
    EDCAIInterviewAnalysis;

  readonly qualification:
    EDCQualificationRecommendation;

  readonly completedAt: ISODateString;

}

/* ================================================================
 * Interview Assessment Link
 * ================================================================ */

/**
 * References the downstream artifacts produced by the interview.
 */
export interface EDCInterviewOutputs {

  readonly assessmentId?: UUID;

  readonly readinessId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly activityIds?:
    readonly UUID[];

  readonly recommendationIds?:
    readonly UUID[];

}
/* ================================================================
 * Interview Audit
 * ================================================================ */

export interface EDCInterviewAudit {
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
 * Master Interview
 * ================================================================ */

/**
 * Complete entrepreneur interview record.
 */
export interface EDCInterview {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly type: EDCInterviewType;

  readonly mode: EDCInterviewMode;

  readonly status: EDCInterviewStatus;

  readonly title: string;

  readonly description?: string | null;

  readonly scheduledAt?: ISODateString | null;

  readonly startedAt?: ISODateString | null;

  readonly pausedAt?: ISODateString | null;

  readonly resumedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly durationMinutes?: number | null;

  readonly questions: readonly EDCInterviewQuestion[];

  readonly responses: readonly EDCInterviewResponse[];

  readonly followUpQuestions: readonly EDCFollowUpQuestion[];

  readonly evidence: readonly EDCInterviewEvidence[];

  readonly observations: readonly EDCInterviewObservation[];

  readonly opportunities: readonly EDCInterviewOpportunity[];

  readonly risks: readonly EDCInterviewRisk[];

  readonly missingInformation:
    readonly EDCInterviewMissingInformation[];

  readonly aiAnalysis?: EDCAIInterviewAnalysis | null;

  readonly qualificationRecommendation?:
    EDCQualificationRecommendation | null;

  readonly summary?: EDCInterviewSummary | null;

  readonly outputs?: EDCInterviewOutputs | null;

  readonly reviewRequired: boolean;

  readonly reviewReason?: string | null;

  readonly audit: EDCInterviewAudit;

  readonly archivedAt?: ISODateString | null;
}

/* ================================================================
 * Create Interview Input
 * ================================================================ */

export interface CreateEDCInterviewInput {
  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly type: EDCInterviewType;

  readonly mode?: EDCInterviewMode;

  readonly title: string;

  readonly description?: string | null;

  readonly scheduledAt?: ISODateString | null;

  readonly questions?: readonly EDCInterviewQuestion[];
}

/* ================================================================
 * Update Interview Input
 * ================================================================ */

export interface UpdateEDCInterviewInput {
  readonly interviewId: UUID;

  readonly coachId?: UUID | null;

  readonly status?: EDCInterviewStatus;

  readonly title?: string;

  readonly description?: string | null;

  readonly scheduledAt?: ISODateString | null;

  readonly startedAt?: ISODateString | null;

  readonly pausedAt?: ISODateString | null;

  readonly resumedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly durationMinutes?: number | null;

  readonly questions?: readonly EDCInterviewQuestion[];

  readonly responses?: readonly EDCInterviewResponse[];

  readonly followUpQuestions?: readonly EDCFollowUpQuestion[];

  readonly evidence?: readonly EDCInterviewEvidence[];

  readonly observations?: readonly EDCInterviewObservation[];

  readonly opportunities?: readonly EDCInterviewOpportunity[];

  readonly risks?: readonly EDCInterviewRisk[];

  readonly missingInformation?:
    readonly EDCInterviewMissingInformation[];

  readonly aiAnalysis?: EDCAIInterviewAnalysis | null;

  readonly qualificationRecommendation?:
    EDCQualificationRecommendation | null;

  readonly summary?: EDCInterviewSummary | null;

  readonly outputs?: EDCInterviewOutputs | null;

  readonly reviewRequired?: boolean;

  readonly reviewReason?: string | null;
}

/* ================================================================
 * Submit Interview Response
 * ================================================================ */

export interface SubmitEDCInterviewResponseInput {
  readonly interviewId: UUID;

  readonly questionId: UUID;

  readonly answer: unknown;

  readonly confidence?: number;

  readonly attachments?: readonly string[];
}

/* ================================================================
 * Add Follow-up Question
 * ================================================================ */

export interface AddEDCFollowUpQuestionInput {
  readonly interviewId: UUID;

  readonly parentQuestionId: UUID;

  readonly question: string;

  readonly reason: string;

  readonly generatedBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";
}

/* ================================================================
 * Complete Interview Input
 * ================================================================ */

export interface CompleteEDCInterviewInput {
  readonly interviewId: UUID;

  readonly executiveSummary: string;

  readonly observations:
    readonly EDCInterviewObservation[];

  readonly opportunities:
    readonly EDCInterviewOpportunity[];

  readonly risks:
    readonly EDCInterviewRisk[];

  readonly missingInformation:
    readonly EDCInterviewMissingInformation[];

  readonly aiAnalysis: EDCAIInterviewAnalysis;

  readonly qualificationRecommendation:
    EDCQualificationRecommendation;

  readonly outputs?: EDCInterviewOutputs;

  readonly reviewRequired?: boolean;

  readonly reviewReason?: string | null;
}

/* ================================================================
 * Interview Search Filters
 * ================================================================ */

export interface EDCInterviewSearchFilters {
  readonly interviewIds?: readonly UUID[];

  readonly entrepreneurIds?: readonly UUID[];

  readonly coachIds?: readonly UUID[];

  readonly types?: readonly EDCInterviewType[];

  readonly modes?: readonly EDCInterviewMode[];

  readonly statuses?: readonly EDCInterviewStatus[];

  readonly reviewRequired?: boolean;

  readonly scheduledFrom?: ISODateString;

  readonly scheduledTo?: ISODateString;

  readonly completedFrom?: ISODateString;

  readonly completedTo?: ISODateString;

  readonly search?: string;
}

/* ================================================================
 * Pagination
 * ================================================================ */

export interface EDCInterviewPagination {
  readonly page: number;

  readonly pageSize: number;

  readonly totalItems: number;

  readonly totalPages: number;
}

/* ================================================================
 * Interview List Item
 * ================================================================ */

export interface EDCInterviewListItem {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly title: string;

  readonly type: EDCInterviewType;

  readonly mode: EDCInterviewMode;

  readonly status: EDCInterviewStatus;

  readonly scheduledAt?: ISODateString | null;

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly responseCount: number;

  readonly questionCount: number;

  readonly reviewRequired: boolean;

  readonly qualificationRecommendation?:
    EDCQualificationRecommendation["recommended"] | null;
}

/* ================================================================
 * Interview Search Result
 * ================================================================ */

export interface EDCInterviewSearchResult {
  readonly items: readonly EDCInterviewListItem[];

  readonly pagination: EDCInterviewPagination;
}

/* ================================================================
 * Dashboard Summary
 * ================================================================ */

export interface EDCInterviewDashboardSummary {
  readonly totalInterviews: number;

  readonly scheduledInterviews: number;

  readonly interviewsInProgress: number;

  readonly pausedInterviews: number;

  readonly completedInterviews: number;

  readonly pendingReview: number;

  readonly approvedInterviews: number;

  readonly interviewsRequiringReview: number;

  readonly qualifiedRecommendations: number;

  readonly conditionalRecommendations: number;

  readonly notReadyRecommendations: number;

  readonly averageDurationMinutes: number;

  readonly averageAnalysisConfidence: number;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Interview Profile Response
 * ================================================================ */

export interface EDCInterviewProfileResponse {
  readonly interview: EDCInterview;

  readonly permissions: {
    readonly canView: boolean;

    readonly canEdit: boolean;

    readonly canStart: boolean;

    readonly canPause: boolean;

    readonly canResume: boolean;

    readonly canComplete: boolean;

    readonly canReview: boolean;

    readonly canApprove: boolean;

    readonly canArchive: boolean;

    readonly canGenerateAssessment: boolean;

    readonly canGenerateDevelopmentPlan: boolean;
  };

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * AI-First Interview Workflow
 * ================================================================ */

export interface EDCAIInterviewWorkflow {
  readonly interviewId: UUID;

  readonly collectResponses: boolean;

  readonly analyzeEachResponse: boolean;

  readonly generateFollowUpQuestions: boolean;

  readonly extractEvidence: boolean;

  readonly identifyObservations: boolean;

  readonly identifyOpportunities: boolean;

  readonly identifyRisks: boolean;

  readonly identifyMissingInformation: boolean;

  readonly generateExecutiveSummary: boolean;

  readonly generateQualificationRecommendation: boolean;

  readonly createDownstreamOutputs: boolean;

  readonly requiresHumanReview: boolean;

  readonly finalDecisionMadeBy:
    | "AI"
    | "HUMAN"
    | "HYBRID";

  readonly processedAt?: ISODateString | null;
}

/* ================================================================
 * Archive Interview
 * ================================================================ */

export interface ArchiveEDCInterviewInput {
  readonly interviewId: UUID;

  readonly reason: string;

  readonly archivedBy: UUID;
}

/* ================================================================
 * Restore Interview
 * ================================================================ */

export interface RestoreEDCInterviewInput {
  readonly interviewId: UUID;

  readonly restoredBy: UUID;

  readonly reason?: string;
}

/* ================================================================
 * Projection Types
 * ================================================================ */

export type EDCInterviewIdentity = Pick<
  EDCInterview,
  | "id"
  | "entrepreneurId"
  | "coachId"
  | "title"
  | "type"
  | "mode"
  | "status"
>;

export type EDCInterviewScheduleSummary = Pick<
  EDCInterview,
  | "id"
  | "entrepreneurId"
  | "coachId"
  | "title"
  | "scheduledAt"
  | "startedAt"
  | "completedAt"
>;

export type EDCInterviewAnalysisSummary = Pick<
  EDCAIInterviewAnalysis,
  | "executiveSummary"
  | "entrepreneurStrengths"
  | "entrepreneurGrowthAreas"
  | "confidence"
  | "generatedAt"
>;

export type EDCInterviewQualificationSummary = Pick<
  EDCQualificationRecommendation,
  | "recommended"
  | "reasoning"
  | "estimatedReadinessDays"
>;

export type EDCInterviewEvidenceSummary = Pick<
  EDCInterviewEvidence,
  | "id"
  | "title"
  | "sourceQuestionId"
  | "confidence"
  | "createdAt"
>;

/* ================================================================
 * End Interview Domain Model
 * ================================================================ */