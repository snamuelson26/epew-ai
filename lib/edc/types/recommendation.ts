/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: recommendation.ts
 *
 * Enterprise Recommendation Domain Model
 *
 * Recommendation Philosophy
 *
 * Evidence
 *      ↓
 * Analysis
 *      ↓
 * Recommendation
 *      ↓
 * Prioritization
 *      ↓
 * Next Best Action
 *      ↓
 * Measurable Outcome
 *
 * Recommendations must be explainable, evidence-based, measurable,
 * and connected to the entrepreneur's development journey.
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Recommendation Status
 * ================================================================ */

export enum EDCRecommendationStatus {
  DRAFT = "DRAFT",

  GENERATED = "GENERATED",

  PENDING_REVIEW = "PENDING_REVIEW",

  APPROVED = "APPROVED",

  PUBLISHED = "PUBLISHED",

  ACCEPTED = "ACCEPTED",

  DECLINED = "DECLINED",

  IN_PROGRESS = "IN_PROGRESS",

  COMPLETED = "COMPLETED",

  DEFERRED = "DEFERRED",

  EXPIRED = "EXPIRED",

  CANCELLED = "CANCELLED",

  SUPERSEDED = "SUPERSEDED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Recommendation Type
 * ================================================================ */

export enum EDCRecommendationType {
  NEXT_BEST_ACTION = "NEXT_BEST_ACTION",

  LEARNING = "LEARNING",

  ACTIVITY = "ACTIVITY",

  INTERVIEW = "INTERVIEW",

  ASSESSMENT = "ASSESSMENT",

  REFLECTION = "REFLECTION",

  DEVELOPMENT_PLAN = "DEVELOPMENT_PLAN",

  READINESS = "READINESS",

  COACHING = "COACHING",

  RESOURCE = "RESOURCE",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  BUSINESS_PLANNING = "BUSINESS_PLANNING",

  FINANCIAL_PLANNING = "FINANCIAL_PLANNING",

  LEGAL_AND_COMPLIANCE = "LEGAL_AND_COMPLIANCE",

  OPERATIONS = "OPERATIONS",

  MARKETING = "MARKETING",

  SALES = "SALES",

  COMMUNITY_ENGAGEMENT = "COMMUNITY_ENGAGEMENT",

  MARKETPLACE = "MARKETPLACE",

  FUNDING_PREPARATION = "FUNDING_PREPARATION",

  FUNDING_ELIGIBILITY = "FUNDING_ELIGIBILITY",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  PARTNER_SERVICE = "PARTNER_SERVICE",

  RISK_MITIGATION = "RISK_MITIGATION",

  COMPLIANCE = "COMPLIANCE",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Recommendation Category
 * ================================================================ */

export enum EDCRecommendationCategory {
  ENTREPRENEUR_IDENTITY = "ENTREPRENEUR_IDENTITY",

  MINDSET = "MINDSET",

  COMMITMENT = "COMMITMENT",

  COACHABILITY = "COACHABILITY",

  LEADERSHIP = "LEADERSHIP",

  COMMUNICATION = "COMMUNICATION",

  DECISION_MAKING = "DECISION_MAKING",

  CUSTOMER = "CUSTOMER",

  MARKET = "MARKET",

  VALUE_PROPOSITION = "VALUE_PROPOSITION",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  PRODUCT_OR_SERVICE = "PRODUCT_OR_SERVICE",

  SALES = "SALES",

  MARKETING = "MARKETING",

  FINANCIAL = "FINANCIAL",

  OPERATIONS = "OPERATIONS",

  LEGAL = "LEGAL",

  COMPLIANCE = "COMPLIANCE",

  COMMUNITY = "COMMUNITY",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  RISK = "RISK",

  OTHER = "OTHER"
}

/* ================================================================
 * Recommendation Source
 * ================================================================ */

export enum EDCRecommendationSource {
  AI = "AI",

  COACH = "COACH",

  ADMINISTRATOR = "ADMINISTRATOR",

  SYSTEM_RULE = "SYSTEM_RULE",

  ENTREPRENEUR = "ENTREPRENEUR",

  INTERVIEW = "INTERVIEW",

  ASSESSMENT = "ASSESSMENT",

  READINESS = "READINESS",

  DEVELOPMENT_PLAN = "DEVELOPMENT_PLAN",

  ACTIVITY = "ACTIVITY",

  REFLECTION = "REFLECTION",

  MILESTONE = "MILESTONE",

  COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",

  FUNDING_REVIEW = "FUNDING_REVIEW",

  MARKETPLACE_REVIEW = "MARKETPLACE_REVIEW",

  BUSINESS_LAUNCH_REVIEW = "BUSINESS_LAUNCH_REVIEW",

  HYBRID = "HYBRID"
}

/* ================================================================
 * Recommendation Priority
 * ================================================================ */

export enum EDCRecommendationPriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",

  IMMEDIATE = "IMMEDIATE"
}

/* ================================================================
 * Recommendation Urgency
 * ================================================================ */

export enum EDCRecommendationUrgency {
  NOT_URGENT = "NOT_URGENT",

  ROUTINE = "ROUTINE",

  TIME_SENSITIVE = "TIME_SENSITIVE",

  URGENT = "URGENT",

  IMMEDIATE = "IMMEDIATE"
}

/* ================================================================
 * Recommendation Impact
 * ================================================================ */

export enum EDCRecommendationImpact {
  NONE = "NONE",

  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  TRANSFORMATIONAL = "TRANSFORMATIONAL"
}

/* ================================================================
 * Recommendation Difficulty
 * ================================================================ */

export enum EDCRecommendationDifficulty {
  VERY_EASY = "VERY_EASY",

  EASY = "EASY",

  MODERATE = "MODERATE",

  DIFFICULT = "DIFFICULT",

  VERY_DIFFICULT = "VERY_DIFFICULT"
}

/* ================================================================
 * Recommendation Risk Level
 * ================================================================ */

export enum EDCRecommendationRiskLevel {
  NONE = "NONE",

  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"
}

/* ================================================================
 * Recommendation Review Requirement
 * ================================================================ */

export enum EDCRecommendationReviewRequirement {
  NONE = "NONE",

  AI_VALIDATION = "AI_VALIDATION",

  COACH_REVIEW = "COACH_REVIEW",

  ADMIN_REVIEW = "ADMIN_REVIEW",

  COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",

  FUNDING_REVIEW = "FUNDING_REVIEW",

  LEGAL_REVIEW = "LEGAL_REVIEW",

  MULTI_LEVEL_REVIEW = "MULTI_LEVEL_REVIEW"
}

/* ================================================================
 * Recommendation Decision
 * ================================================================ */

export enum EDCRecommendationDecision {
  PENDING = "PENDING",

  ACCEPTED = "ACCEPTED",

  DECLINED = "DECLINED",

  DEFERRED = "DEFERRED",

  MODIFIED = "MODIFIED",

  SUPERSEDED = "SUPERSEDED"
}

/* ================================================================
 * Recommendation Action Type
 * ================================================================ */

export enum EDCRecommendationActionType {
  COMPLETE_ACTIVITY = "COMPLETE_ACTIVITY",

  SCHEDULE_INTERVIEW = "SCHEDULE_INTERVIEW",

  COMPLETE_ASSESSMENT = "COMPLETE_ASSESSMENT",

  SUBMIT_REFLECTION = "SUBMIT_REFLECTION",

  REVIEW_DEVELOPMENT_PLAN = "REVIEW_DEVELOPMENT_PLAN",

  UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT",

  WATCH_VIDEO = "WATCH_VIDEO",

  READ_RESOURCE = "READ_RESOURCE",

  ATTEND_SESSION = "ATTEND_SESSION",

  CONTACT_COACH = "CONTACT_COACH",

  CONTACT_PARTNER = "CONTACT_PARTNER",

  CONDUCT_RESEARCH = "CONDUCT_RESEARCH",

  INTERVIEW_CUSTOMERS = "INTERVIEW_CUSTOMERS",

  UPDATE_PROFILE = "UPDATE_PROFILE",

  UPDATE_BUSINESS_PLAN = "UPDATE_BUSINESS_PLAN",

  UPDATE_FINANCIAL_PLAN = "UPDATE_FINANCIAL_PLAN",

  COMPLETE_COMPLIANCE_REQUIREMENT =
    "COMPLETE_COMPLIANCE_REQUIREMENT",

  PREPARE_MARKETPLACE_PROFILE =
    "PREPARE_MARKETPLACE_PROFILE",

  PREPARE_FUNDING_APPLICATION =
    "PREPARE_FUNDING_APPLICATION",

  PREPARE_BUSINESS_LAUNCH =
    "PREPARE_BUSINESS_LAUNCH",

  RESOLVE_RISK = "RESOLVE_RISK",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Recommendation Evidence Type
 * ================================================================ */

export enum EDCRecommendationEvidenceType {
  INTERVIEW_RESPONSE = "INTERVIEW_RESPONSE",

  ASSESSMENT_RESULT = "ASSESSMENT_RESULT",

  READINESS_SCORE = "READINESS_SCORE",

  ACTIVITY_RESULT = "ACTIVITY_RESULT",

  ACTIVITY_EVIDENCE = "ACTIVITY_EVIDENCE",

  REFLECTION_RESPONSE = "REFLECTION_RESPONSE",

  COACH_OBSERVATION = "COACH_OBSERVATION",

  SYSTEM_EVENT = "SYSTEM_EVENT",

  COMPLIANCE_RECORD = "COMPLIANCE_RECORD",

  FINANCIAL_RECORD = "FINANCIAL_RECORD",

  MARKETPLACE_RECORD = "MARKETPLACE_RECORD",

  DOCUMENT = "DOCUMENT",

  PERFORMANCE_METRIC = "PERFORMANCE_METRIC",

  HISTORICAL_PATTERN = "HISTORICAL_PATTERN",

  OTHER = "OTHER"
}

/* ================================================================
 * Recommendation Dependency Type
 * ================================================================ */

export enum EDCRecommendationDependencyType {
  RECOMMENDATION = "RECOMMENDATION",

  ACTIVITY = "ACTIVITY",

  MILESTONE = "MILESTONE",

  GOAL = "GOAL",

  ASSESSMENT = "ASSESSMENT",

  INTERVIEW = "INTERVIEW",

  REFLECTION = "REFLECTION",

  DOCUMENT = "DOCUMENT",

  APPROVAL = "APPROVAL",

  COMPLIANCE_REQUIREMENT = "COMPLIANCE_REQUIREMENT",

  FUNDING_REQUIREMENT = "FUNDING_REQUIREMENT",

  MARKETPLACE_REQUIREMENT = "MARKETPLACE_REQUIREMENT",

  BUSINESS_LAUNCH_REQUIREMENT =
    "BUSINESS_LAUNCH_REQUIREMENT",

  EXTERNAL_EVENT = "EXTERNAL_EVENT",

  OTHER = "OTHER"
}

/* ================================================================
 * Recommendation Success Metric Type
 * ================================================================ */

export enum EDCRecommendationMetricType {
  BOOLEAN = "BOOLEAN",

  NUMBER = "NUMBER",

  COUNT = "COUNT",

  SCORE = "SCORE",

  PERCENTAGE = "PERCENTAGE",

  CURRENCY = "CURRENCY",

  DURATION = "DURATION",

  DATE = "DATE",

  TEXT = "TEXT"
}

/* ================================================================
 * Supporting Evidence
 * ================================================================ */

export interface EDCRecommendationEvidence {
  readonly id: UUID;

  readonly type: EDCRecommendationEvidenceType;

  readonly sourceId?: UUID | null;

  readonly title: string;

  readonly description: string;

  readonly strength: number;

  readonly relevance: number;

  readonly verified: boolean;

  readonly verifiedBy?: UUID | null;

  readonly verifiedAt?: ISODateString | null;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Recommendation Dependency
 * ================================================================ */

export interface EDCRecommendationDependency {
  readonly id: UUID;

  readonly type: EDCRecommendationDependencyType;

  readonly referenceId?: UUID | null;

  readonly title: string;

  readonly description?: string | null;

  readonly required: boolean;

  readonly satisfied: boolean;

  readonly satisfiedAt?: ISODateString | null;
}

/* ================================================================
 * Recommendation Action
 * ================================================================ */

export interface EDCRecommendationAction {
  readonly id: UUID;

  readonly type: EDCRecommendationActionType;

  readonly title: string;

  readonly description: string;

  readonly instructions: readonly string[];

  readonly sequence: number;

  readonly required: boolean;

  readonly estimatedMinutes?: number | null;

  readonly dueAt?: ISODateString | null;

  readonly relatedEntityId?: UUID | null;

  readonly completed: boolean;

  readonly completedAt?: ISODateString | null;
}

/* ================================================================
 * Recommendation Benefit
 * ================================================================ */

export interface EDCRecommendationBenefit {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly impact: EDCRecommendationImpact;

  readonly measurable: boolean;
}

/* ================================================================
 * Recommendation Risk
 * ================================================================ */

export interface EDCRecommendationRisk {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly level: EDCRecommendationRiskLevel;

  readonly likelihood: number;

  readonly impact: EDCRecommendationImpact;

  readonly mitigation?: string | null;
}

/* ================================================================
 * Recommendation Success Metric
 * ================================================================ */

export interface EDCRecommendationSuccessMetric {
  readonly id: UUID;

  readonly name: string;

  readonly description?: string | null;

  readonly type: EDCRecommendationMetricType;

  readonly currentValue?: unknown;

  readonly targetValue: unknown;

  readonly unit?: string | null;

  readonly achieved: boolean;

  readonly measuredAt?: ISODateString | null;

  readonly evidenceIds?: readonly UUID[];
}

/* ================================================================
 * Recommendation Expected Outcome
 * ================================================================ */

export interface EDCRecommendationExpectedOutcome {
  readonly title: string;

  readonly description: string;

  readonly expectedImpact: EDCRecommendationImpact;

  readonly expectedReadinessChange?: number | null;

  readonly expectedAssessmentChange?: number | null;

  readonly expectedCompletionDate?: ISODateString | null;

  readonly successMetricIds: readonly UUID[];
}
/* ================================================================
 * AI Recommendation Analysis
 * ================================================================ */

export interface EDCAIRecommendationAnalysis {
  readonly executiveSummary: string;

  readonly reasoning: string;

  readonly confidence: number;

  readonly evidenceStrength: number;

  readonly expectedSuccessProbability: number;

  readonly urgencyScore: number;

  readonly priorityScore: number;

  readonly readinessImpactScore: number;

  readonly assessmentImpactScore: number;

  readonly fundingImpactScore: number;

  readonly businessLaunchImpactScore: number;

  readonly risks: readonly string[];

  readonly assumptions: readonly string[];

  readonly alternativesConsidered: readonly string[];

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Recommendation Score
 * ================================================================ */

export interface EDCRecommendationScore {
  readonly overallScore: number;

  readonly priorityScore: number;

  readonly urgencyScore: number;

  readonly impactScore: number;

  readonly difficultyScore: number;

  readonly confidenceScore: number;

  readonly evidenceScore: number;

  readonly businessValueScore: number;

  readonly readinessScore: number;

  readonly launchScore: number;
}

/* ================================================================
 * Recommendation Ranking
 * ================================================================ */

export interface EDCRecommendationRanking {
  readonly rank: number;

  readonly totalRecommendations: number;

  readonly percentile: number;

  readonly nextBestAction: boolean;
}

/* ================================================================
 * Next Best Action
 * ================================================================ */

export interface EDCNextBestAction {
  readonly recommendationId: UUID;

  readonly title: string;

  readonly description: string;

  readonly reason: string;

  readonly expectedBenefit: string;

  readonly estimatedMinutes?: number;

  readonly confidence: number;
}

/* ================================================================
 * Recommendation Review
 * ================================================================ */

export interface EDCRecommendationReview {
  readonly reviewerId: UUID;

  readonly reviewerType:
    | "AI"
    | "COACH"
    | "ADMIN"
    | "COMPLIANCE";

  readonly approved: boolean;

  readonly comments?: string;

  readonly reviewedAt: ISODateString;
}

/* ================================================================
 * Recommendation Decision
 * ================================================================ */

export interface EDCRecommendationDecisionRecord {
  readonly decision: EDCRecommendationDecision;

  readonly decidedBy: UUID;

  readonly reason?: string;

  readonly decidedAt: ISODateString;
}

/* ================================================================
 * Recommendation Completion
 * ================================================================ */

export interface EDCRecommendationCompletion {
  readonly completed: boolean;

  readonly completedAt?: ISODateString;

  readonly completionNotes?: string;

  readonly objectivesMet: boolean;

  readonly successScore?: number;
}

/* ================================================================
 * Readiness Impact
 * ================================================================ */

export interface EDCRecommendationReadinessImpact {
  readonly previousScore?: number;

  readonly projectedScore?: number;

  readonly expectedImprovement?: number;

  readonly impactedDimensions:
    readonly string[];
}

/* ================================================================
 * Assessment Impact
 * ================================================================ */

export interface EDCRecommendationAssessmentImpact {
  readonly assessmentId?: UUID;

  readonly competencies:
    readonly string[];

  readonly expectedImprovement: string;
}

/* ================================================================
 * Funding Impact
 * ================================================================ */

export interface EDCRecommendationFundingImpact {
  readonly improvesFundingEligibility: boolean;

  readonly estimatedEligibilityIncrease?: number;

  readonly requiredBeforeFunding: boolean;
}

/* ================================================================
 * Business Launch Impact
 * ================================================================ */

export interface EDCRecommendationLaunchImpact {
  readonly improvesLaunchReadiness: boolean;

  readonly estimatedLaunchImprovement?: number;

  readonly requiredBeforeLaunch: boolean;
}

/* ================================================================
 * Follow-up Recommendation
 * ================================================================ */

export interface EDCFollowUpRecommendation {
  readonly recommendationType:
    EDCRecommendationType;

  readonly title: string;

  readonly description: string;

  readonly generatedWhenCompleted: boolean;
}

/* ================================================================
 * Recommendation Timeline
 * ================================================================ */

export interface EDCRecommendationTimeline {
  readonly estimatedStartDate?: ISODateString;

  readonly estimatedCompletionDate?: ISODateString;

  readonly estimatedDurationDays?: number;
}

/* ================================================================
 * Recommendation Analytics
 * ================================================================ */

export interface EDCRecommendationAnalytics {
  readonly viewed: boolean;

  readonly viewedAt?: ISODateString;

  readonly accepted: boolean;

  readonly acceptedAt?: ISODateString;

  readonly completed: boolean;

  readonly completionRate?: number;

  readonly effectivenessScore?: number;
}

/* ================================================================
 * Recommendation Explanation
 * ================================================================ */

export interface EDCRecommendationExplanation {
  readonly whyRecommended: string;

  readonly supportingEvidence:
    readonly string[];

  readonly expectedBenefits:
    readonly string[];

  readonly possibleRisks:
    readonly string[];

  readonly successIndicators:
    readonly string[];
}
/* ================================================================
 * Recommendation
 * ================================================================ */

export interface EDCRecommendation {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly activityId?: UUID;

  readonly assessmentId?: UUID;

  readonly readinessId?: UUID;

  readonly reflectionId?: UUID;

  readonly interviewId?: UUID;

  readonly title: string;

  readonly description: string;

  readonly status: EDCRecommendationStatus;

  readonly type: EDCRecommendationType;

  readonly category: EDCRecommendationCategory;

  readonly source: EDCRecommendationSource;

  readonly priority: EDCRecommendationPriority;

  readonly urgency: EDCRecommendationUrgency;

  readonly impact: EDCRecommendationImpact;

  readonly difficulty: EDCRecommendationDifficulty;

  readonly riskLevel: EDCRecommendationRiskLevel;

  readonly reviewRequirement:
    EDCRecommendationReviewRequirement;

  readonly score?:
    EDCRecommendationScore;

  readonly ranking?:
    EDCRecommendationRanking;

  readonly nextBestAction?:
    EDCNextBestAction;

  readonly aiAnalysis?:
    EDCAIRecommendationAnalysis;

  readonly explanation?:
    EDCRecommendationExplanation;

  readonly evidence:
    readonly EDCRecommendationEvidence[];

  readonly dependencies:
    readonly EDCRecommendationDependency[];

  readonly actions:
    readonly EDCRecommendationAction[];

  readonly benefits:
    readonly EDCRecommendationBenefit[];

  readonly risks:
    readonly EDCRecommendationRisk[];

  readonly successMetrics:
    readonly EDCRecommendationSuccessMetric[];

  readonly expectedOutcome?:
    EDCRecommendationExpectedOutcome;

  readonly readinessImpact?:
    EDCRecommendationReadinessImpact;

  readonly assessmentImpact?:
    EDCRecommendationAssessmentImpact;

  readonly fundingImpact?:
    EDCRecommendationFundingImpact;

  readonly launchImpact?:
    EDCRecommendationLaunchImpact;

  readonly reviews:
    readonly EDCRecommendationReview[];

  readonly decisions:
    readonly EDCRecommendationDecisionRecord[];

  readonly completion?:
    EDCRecommendationCompletion;

  readonly followUps:
    readonly EDCFollowUpRecommendation[];

  readonly analytics?:
    EDCRecommendationAnalytics;

  readonly timeline?:
    EDCRecommendationTimeline;

  readonly expiresAt?: ISODateString;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID;

  readonly archivedAt?: ISODateString;
}

/* ================================================================
 * Create DTO
 * ================================================================ */

export interface CreateEDCRecommendationDTO {
  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly description: string;

  readonly type: EDCRecommendationType;

  readonly category: EDCRecommendationCategory;

  readonly priority?: EDCRecommendationPriority;

  readonly source: EDCRecommendationSource;
}

/* ================================================================
 * Update DTO
 * ================================================================ */

export interface UpdateEDCRecommendationDTO {
  readonly title?: string;

  readonly description?: string;

  readonly status?: EDCRecommendationStatus;

  readonly priority?: EDCRecommendationPriority;

  readonly urgency?: EDCRecommendationUrgency;

  readonly actions?:
    readonly EDCRecommendationAction[];

  readonly benefits?:
    readonly EDCRecommendationBenefit[];

  readonly risks?:
    readonly EDCRecommendationRisk[];

  readonly successMetrics?:
    readonly EDCRecommendationSuccessMetric[];
}

/* ================================================================
 * Search Filter
 * ================================================================ */

export interface EDCRecommendationSearchFilter {
  readonly entrepreneurId?: UUID;

  readonly coachId?: UUID;

  readonly status?: EDCRecommendationStatus;

  readonly type?: EDCRecommendationType;

  readonly category?: EDCRecommendationCategory;

  readonly priority?: EDCRecommendationPriority;

  readonly source?: EDCRecommendationSource;

  readonly createdAfter?: ISODateString;

  readonly createdBefore?: ISODateString;

  readonly keyword?: string;
}

/* ================================================================
 * Dashboard Summary
 * ================================================================ */

export interface EDCRecommendationDashboardSummary {
  readonly totalRecommendations: number;

  readonly nextBestActions: number;

  readonly pending: number;

  readonly accepted: number;

  readonly completed: number;

  readonly deferred: number;

  readonly averageConfidence: number;

  readonly averageBusinessValue: number;

  readonly averageReadinessImpact: number;
}

/* ================================================================
 * Timeline Entry
 * ================================================================ */

export interface EDCRecommendationTimelineEntry {
  readonly recommendationId: UUID;

  readonly title: string;

  readonly type: EDCRecommendationType;

  readonly status: EDCRecommendationStatus;

  readonly priority: EDCRecommendationPriority;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Archive DTO
 * ================================================================ */

export interface ArchiveEDCRecommendationDTO {
  readonly archivedBy: UUID;

  readonly archivedAt: ISODateString;

  readonly reason: string;
}

/* ================================================================
 * Restore DTO
 * ================================================================ */

export interface RestoreEDCRecommendationDTO {
  readonly restoredBy: UUID;

  readonly restoredAt: ISODateString;

  readonly reason?: string;
}

/* ================================================================
 * Recommendation Statistics
 * ================================================================ */

export interface EDCRecommendationStatistics {
  readonly total: number;

  readonly byStatus:
    Record<EDCRecommendationStatus, number>;

  readonly byType:
    Partial<Record<EDCRecommendationType, number>>;

  readonly byPriority:
    Partial<Record<EDCRecommendationPriority, number>>;

  readonly acceptanceRate: number;

  readonly completionRate: number;

  readonly averageConfidence: number;

  readonly averagePriorityScore: number;

  readonly averageBusinessValue: number;
}

/* ================================================================
 * Snapshot
 * ================================================================ */

export interface EDCRecommendationSnapshot {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly status: EDCRecommendationStatus;

  readonly priority: EDCRecommendationPriority;

  readonly type: EDCRecommendationType;

  readonly createdAt: ISODateString;
}