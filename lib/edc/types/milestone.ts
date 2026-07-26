/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: milestone.ts
 *
 * Enterprise Milestone Domain Model
 *
 * Milestone Philosophy
 *
 * Development Plan
 *      ↓
 * Goal
 *      ↓
 * Milestone
 *      ↓
 * Activities
 *      ↓
 * Evidence
 *      ↓
 * Completion
 *
 * A milestone represents a measurable achievement in an
 * entrepreneur's development journey.
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Milestone Status
 * ================================================================ */

export enum EDCMilestoneStatus {
  DRAFT = "DRAFT",

  PLANNED = "PLANNED",

  ACTIVE = "ACTIVE",

  IN_PROGRESS = "IN_PROGRESS",

  BLOCKED = "BLOCKED",

  READY_FOR_REVIEW = "READY_FOR_REVIEW",

  APPROVED = "APPROVED",

  COMPLETED = "COMPLETED",

  FAILED = "FAILED",

  CANCELLED = "CANCELLED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Milestone Type
 * ================================================================ */

export enum EDCMilestoneType {
  ONBOARDING = "ONBOARDING",

  INTERVIEW = "INTERVIEW",

  ASSESSMENT = "ASSESSMENT",

  READINESS = "READINESS",

  LEARNING = "LEARNING",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  BUSINESS_PLAN = "BUSINESS_PLAN",

  FINANCIAL_PLAN = "FINANCIAL_PLAN",

  MARKETING = "MARKETING",

  SALES = "SALES",

  LEGAL = "LEGAL",

  COMPLIANCE = "COMPLIANCE",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  BUSINESS_OPERATIONS = "BUSINESS_OPERATIONS",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  CERTIFICATION = "CERTIFICATION",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Milestone Category
 * ================================================================ */

export enum EDCMilestoneCategory {
  FOUNDATION = "FOUNDATION",

  ENTREPRENEUR_DEVELOPMENT = "ENTREPRENEUR_DEVELOPMENT",

  BUSINESS_DEVELOPMENT = "BUSINESS_DEVELOPMENT",

  FINANCIAL_READINESS = "FINANCIAL_READINESS",

  MARKET_READINESS = "MARKET_READINESS",

  FUNDING_READINESS = "FUNDING_READINESS",

  LAUNCH_READINESS = "LAUNCH_READINESS",

  GROWTH = "GROWTH",

  COMPLIANCE = "COMPLIANCE",

  COMMUNITY = "COMMUNITY",

  OTHER = "OTHER"
}

/* ================================================================
 * Milestone Priority
 * ================================================================ */

export enum EDCMilestonePriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"
}

/* ================================================================
 * Completion Method
 * ================================================================ */

export enum EDCMilestoneCompletionMethod {
  AUTOMATIC = "AUTOMATIC",

  AI_APPROVAL = "AI_APPROVAL",

  COACH_APPROVAL = "COACH_APPROVAL",

  ADMIN_APPROVAL = "ADMIN_APPROVAL",

  HYBRID = "HYBRID"
}

/* ================================================================
 * Milestone Dependency Type
 * ================================================================ */

export enum EDCMilestoneDependencyType {
  NONE = "NONE",

  MILESTONE = "MILESTONE",

  ACTIVITY = "ACTIVITY",

  ASSESSMENT = "ASSESSMENT",

  INTERVIEW = "INTERVIEW",

  REFLECTION = "REFLECTION",

  DOCUMENT = "DOCUMENT",

  APPROVAL = "APPROVAL"
}

/* ================================================================
 * Milestone Success Metric Type
 * ================================================================ */

export enum EDCMilestoneMetricType {
  BOOLEAN = "BOOLEAN",

  NUMBER = "NUMBER",

  PERCENTAGE = "PERCENTAGE",

  SCORE = "SCORE",

  COUNT = "COUNT",

  DATE = "DATE",

  CURRENCY = "CURRENCY"
}

/* ================================================================
 * Milestone Dependency
 * ================================================================ */

export interface EDCMilestoneDependency {
  readonly id: UUID;

  readonly type: EDCMilestoneDependencyType;

  readonly referenceId?: UUID;

  readonly title: string;

  readonly required: boolean;

  readonly completed: boolean;

  readonly completedAt?: ISODateString;
}

/* ================================================================
 * Milestone Success Metric
 * ================================================================ */

export interface EDCMilestoneSuccessMetric {
  readonly id: UUID;

  readonly name: string;

  readonly description?: string;

  readonly metricType: EDCMilestoneMetricType;

  readonly currentValue?: unknown;

  readonly targetValue: unknown;

  readonly unit?: string;

  readonly achieved: boolean;

  readonly measuredAt?: ISODateString;
}

/* ================================================================
 * Milestone Evidence
 * ================================================================ */

export interface EDCMilestoneEvidence {
  readonly id: UUID;

  readonly title: string;

  readonly description?: string;

  readonly sourceId?: UUID;

  readonly sourceType:
    | "ACTIVITY"
    | "ASSESSMENT"
    | "REFLECTION"
    | "DOCUMENT"
    | "INTERVIEW"
    | "SYSTEM";

  readonly verified: boolean;

  readonly verifiedBy?: UUID;

  readonly verifiedAt?: ISODateString;
}

/* ================================================================
 * Milestone Completion Criteria
 * ================================================================ */

export interface EDCMilestoneCompletionCriterion {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly required: boolean;

  readonly completed: boolean;

  readonly completedAt?: ISODateString;
}
/* ================================================================
 * AI Milestone Analysis
 * ================================================================ */

export interface EDCAIMilestoneAnalysis {
  readonly executiveSummary: string;

  readonly confidence: number;

  readonly completionProbability: number;

  readonly readinessScore: number;

  readonly evidenceStrength: number;

  readonly qualityScore: number;

  readonly consistencyScore: number;

  readonly strengths: readonly string[];

  readonly weaknesses: readonly string[];

  readonly risks: readonly string[];

  readonly recommendations: readonly string[];

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Milestone Progress
 * ================================================================ */

export interface EDCMilestoneProgress {
  readonly completionPercentage: number;

  readonly completedActivities: number;

  readonly totalActivities: number;

  readonly completedCriteria: number;

  readonly totalCriteria: number;

  readonly completedEvidence: number;

  readonly requiredEvidence: number;

  readonly lastUpdatedAt: ISODateString;
}

/* ================================================================
 * Milestone Score
 * ================================================================ */

export interface EDCMilestoneScore {
  readonly overallScore: number;

  readonly activityScore: number;

  readonly evidenceScore: number;

  readonly qualityScore: number;

  readonly readinessScore: number;

  readonly assessmentScore: number;

  readonly confidenceScore: number;
}

/* ================================================================
 * Milestone Readiness Impact
 * ================================================================ */

export interface EDCMilestoneReadinessImpact {
  readonly previousReadinessScore?: number;

  readonly projectedReadinessScore?: number;

  readonly improvement?: number;

  readonly affectedDimensions:
    readonly string[];

  readonly summary: string;
}

/* ================================================================
 * Milestone Assessment Impact
 * ================================================================ */

export interface EDCMilestoneAssessmentImpact {
  readonly assessmentUpdated: boolean;

  readonly competenciesImproved:
    readonly string[];

  readonly summary: string;
}

/* ================================================================
 * Development Plan Impact
 * ================================================================ */

export interface EDCMilestoneDevelopmentImpact {
  readonly developmentPlanUpdated: boolean;

  readonly goalCompleted: boolean;

  readonly nextGoalUnlocked: boolean;

  readonly summary: string;
}

/* ================================================================
 * Coach Review
 * ================================================================ */

export interface EDCMilestoneCoachReview {
  readonly coachId: UUID;

  readonly approved: boolean;

  readonly score: number;

  readonly comments: string;

  readonly recommendations:
    readonly string[];

  readonly reviewedAt: ISODateString;
}

/* ================================================================
 * Milestone Risk
 * ================================================================ */

export interface EDCMilestoneRisk {
  readonly title: string;

  readonly description: string;

  readonly probability: number;

  readonly impact: number;

  readonly mitigation: string;
}

/* ================================================================
 * Predicted Completion
 * ================================================================ */

export interface EDCPredictedMilestoneCompletion {
  readonly predictedCompletionDate?: ISODateString;

  readonly confidence: number;

  readonly blockers:
    readonly string[];

  readonly assumptions:
    readonly string[];
}

/* ================================================================
 * Next Milestone Recommendation
 * ================================================================ */

export interface EDCNextMilestoneRecommendation {
  readonly milestoneType:
    EDCMilestoneType;

  readonly title: string;

  readonly description: string;

  readonly reason: string;

  readonly priority:
    EDCMilestonePriority;
}

/* ================================================================
 * Milestone Analytics
 * ================================================================ */

export interface EDCMilestoneAnalytics {
  readonly started: boolean;

  readonly completed: boolean;

  readonly completionRate: number;

  readonly averageTimeToCompletion?: number;

  readonly successRate?: number;

  readonly qualityTrend?:
    "DECLINING"
    | "STABLE"
    | "IMPROVING";
}

/* ================================================================
 * Milestone Executive Summary
 * ================================================================ */

export interface EDCMilestoneSummary {
  readonly executiveSummary: string;

  readonly keyAchievements:
    readonly string[];

  readonly remainingWork:
    readonly string[];

  readonly nextSteps:
    readonly string[];

  readonly overallEvaluation:
    | "BELOW_EXPECTATIONS"
    | "MEETS_EXPECTATIONS"
    | "EXCEEDS_EXPECTATIONS";
}
/* ================================================================
 * Milestone
 * ================================================================ */

export interface EDCMilestone {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly developmentPlanId: UUID;

  readonly goalId?: UUID;

  readonly parentMilestoneId?: UUID;

  readonly title: string;

  readonly description: string;

  readonly status: EDCMilestoneStatus;

  readonly type: EDCMilestoneType;

  readonly category: EDCMilestoneCategory;

  readonly priority: EDCMilestonePriority;

  readonly completionMethod:
    EDCMilestoneCompletionMethod;

  readonly dependencies:
    readonly EDCMilestoneDependency[];

  readonly completionCriteria:
    readonly EDCMilestoneCompletionCriterion[];

  readonly evidence:
    readonly EDCMilestoneEvidence[];

  readonly successMetrics:
    readonly EDCMilestoneSuccessMetric[];

  readonly progress?:
    EDCMilestoneProgress;

  readonly score?:
    EDCMilestoneScore;

  readonly aiAnalysis?:
    EDCAIMilestoneAnalysis;

  readonly readinessImpact?:
    EDCMilestoneReadinessImpact;

  readonly assessmentImpact?:
    EDCMilestoneAssessmentImpact;

  readonly developmentImpact?:
    EDCMilestoneDevelopmentImpact;

  readonly coachReview?:
    EDCMilestoneCoachReview;

  readonly risks:
    readonly EDCMilestoneRisk[];

  readonly prediction?:
    EDCPredictedMilestoneCompletion;

  readonly nextMilestone?:
    EDCNextMilestoneRecommendation;

  readonly analytics?:
    EDCMilestoneAnalytics;

  readonly summary?:
    EDCMilestoneSummary;

  readonly targetDate?: ISODateString;

  readonly completedAt?: ISODateString;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID;

  readonly archivedAt?: ISODateString;
}

/* ================================================================
 * Create DTO
 * ================================================================ */

export interface CreateEDCMilestoneDTO {
  readonly entrepreneurId: UUID;

  readonly developmentPlanId: UUID;

  readonly goalId?: UUID;

  readonly title: string;

  readonly description: string;

  readonly type: EDCMilestoneType;

  readonly category: EDCMilestoneCategory;

  readonly priority?: EDCMilestonePriority;

  readonly targetDate?: ISODateString;
}

/* ================================================================
 * Update DTO
 * ================================================================ */

export interface UpdateEDCMilestoneDTO {
  readonly title?: string;

  readonly description?: string;

  readonly status?: EDCMilestoneStatus;

  readonly priority?: EDCMilestonePriority;

  readonly completionCriteria?:
    readonly EDCMilestoneCompletionCriterion[];

  readonly evidence?:
    readonly EDCMilestoneEvidence[];

  readonly successMetrics?:
    readonly EDCMilestoneSuccessMetric[];
}

/* ================================================================
 * Search Filter
 * ================================================================ */

export interface EDCMilestoneSearchFilter {
  readonly entrepreneurId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly goalId?: UUID;

  readonly status?: EDCMilestoneStatus;

  readonly type?: EDCMilestoneType;

  readonly category?: EDCMilestoneCategory;

  readonly priority?: EDCMilestonePriority;

  readonly createdAfter?: ISODateString;

  readonly createdBefore?: ISODateString;

  readonly keyword?: string;
}

/* ================================================================
 * Dashboard Summary
 * ================================================================ */

export interface EDCMilestoneDashboardSummary {
  readonly totalMilestones: number;

  readonly active: number;

  readonly completed: number;

  readonly blocked: number;

  readonly overdue: number;

  readonly averageCompletionRate: number;

  readonly averageQualityScore: number;

  readonly averageReadinessScore: number;
}

/* ================================================================
 * Timeline Entry
 * ================================================================ */

export interface EDCMilestoneTimelineEntry {
  readonly milestoneId: UUID;

  readonly title: string;

  readonly type: EDCMilestoneType;

  readonly status: EDCMilestoneStatus;

  readonly targetDate?: ISODateString;

  readonly completedAt?: ISODateString;
}

/* ================================================================
 * Archive DTO
 * ================================================================ */

export interface ArchiveEDCMilestoneDTO {
  readonly archivedBy: UUID;

  readonly archivedAt: ISODateString;

  readonly reason: string;
}

/* ================================================================
 * Restore DTO
 * ================================================================ */

export interface RestoreEDCMilestoneDTO {
  readonly restoredBy: UUID;

  readonly restoredAt: ISODateString;

  readonly reason?: string;
}

/* ================================================================
 * Milestone Statistics
 * ================================================================ */

export interface EDCMilestoneStatistics {
  readonly total: number;

  readonly byStatus:
    Record<EDCMilestoneStatus, number>;

  readonly byType:
    Partial<Record<EDCMilestoneType, number>>;

  readonly byCategory:
    Partial<Record<EDCMilestoneCategory, number>>;

  readonly completionRate: number;

  readonly averageCompletionDays: number;

  readonly averageReadinessImpact: number;

  readonly averageQualityScore: number;
}

/* ================================================================
 * Snapshot
 * ================================================================ */

export interface EDCMilestoneSnapshot {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly status: EDCMilestoneStatus;

  readonly type: EDCMilestoneType;

  readonly priority: EDCMilestonePriority;

  readonly targetDate?: ISODateString;
}