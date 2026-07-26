/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: development-plan.ts
 *
 * Enterprise Development Plan Domain Model
 *
 * Development Philosophy
 *
 * Assessment
 *      ↓
 * Priorities
 *      ↓
 * Goals
 *      ↓
 * Milestones
 *      ↓
 * Activities
 *      ↓
 * Evidence
 *      ↓
 * Reflection
 *      ↓
 * Reassessment
 *
 * The development plan is a living, evidence-based roadmap that
 * evolves as the entrepreneur progresses.
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Development Plan Status
 * ================================================================ */

export enum EDCDevelopmentPlanStatus {
  DRAFT = "DRAFT",

  GENERATED = "GENERATED",

  REVIEW_PENDING = "REVIEW_PENDING",

  APPROVED = "APPROVED",

  ACTIVE = "ACTIVE",

  PAUSED = "PAUSED",

  COMPLETED = "COMPLETED",

  CANCELLED = "CANCELLED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Development Plan Type
 * ================================================================ */

export enum EDCDevelopmentPlanType {
  INITIAL = "INITIAL",

  READINESS = "READINESS",

  QUALIFICATION = "QUALIFICATION",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  GROWTH = "GROWTH",

  CORRECTIVE = "CORRECTIVE",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Development Plan Mode
 * ================================================================ */

export enum EDCDevelopmentPlanMode {
  AI_GENERATED = "AI_GENERATED",

  HUMAN_CREATED = "HUMAN_CREATED",

  HYBRID = "HYBRID"
}

/* ================================================================
 * Development Priority
 * ================================================================ */

export enum EDCDevelopmentPriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"
}

/* ================================================================
 * Development Impact
 * ================================================================ */

export enum EDCDevelopmentPlanImpact {
  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  TRANSFORMATIONAL = "TRANSFORMATIONAL"
}

/* ================================================================
 * Goal Status
 * ================================================================ */

export enum EDCDevelopmentGoalStatus {
  NOT_STARTED = "NOT_STARTED",

  IN_PROGRESS = "IN_PROGRESS",

  BLOCKED = "BLOCKED",

  AT_RISK = "AT_RISK",

  COMPLETED = "COMPLETED",

  CANCELLED = "CANCELLED"
}

/* ================================================================
 * Development Category
 * ================================================================ */

export enum EDCDevelopmentCategory {
  ENTREPRENEUR_IDENTITY = "ENTREPRENEUR_IDENTITY",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  VALUE_PROPOSITION = "VALUE_PROPOSITION",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  FINANCIAL_READINESS = "FINANCIAL_READINESS",

  OPERATIONS = "OPERATIONS",

  LEGAL_AND_COMPLIANCE = "LEGAL_AND_COMPLIANCE",

  LEADERSHIP = "LEADERSHIP",

  COMMUNICATION = "COMMUNICATION",

  SALES = "SALES",

  MARKETING = "MARKETING",

  COMMUNITY_BUILDING = "COMMUNITY_BUILDING",

  COMMITMENT = "COMMITMENT",

  COACHABILITY = "COACHABILITY",

  DECISION_MAKING = "DECISION_MAKING",

  FUNDING_PREPARATION = "FUNDING_PREPARATION",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  OTHER = "OTHER"
}

/* ================================================================
 * Success Metric Type
 * ================================================================ */

export enum EDCSuccessMetricType {
  BOOLEAN = "BOOLEAN",

  NUMBER = "NUMBER",

  PERCENTAGE = "PERCENTAGE",

  CURRENCY = "CURRENCY",

  COUNT = "COUNT",

  SCORE = "SCORE",

  DATE = "DATE",

  TEXT = "TEXT"
}

/* ================================================================
 * Evidence Requirement
 * ================================================================ */

export enum EDCDevelopmentEvidenceRequirement {
  NONE = "NONE",

  OPTIONAL = "OPTIONAL",

  REQUIRED = "REQUIRED",

  VERIFIED_REQUIRED = "VERIFIED_REQUIRED"
}

/* ================================================================
 * Development Priority Item
 * ================================================================ */

export interface EDCDevelopmentPriorityItem {
  readonly id: UUID;

  readonly category: EDCDevelopmentCategory;

  readonly title: string;

  readonly description: string;

  readonly priority: EDCDevelopmentPriority;

  readonly expectedImpact: EDCDevelopmentPlanImpact;

  readonly sourceAssessmentIds?: readonly UUID[];

  readonly sourceReadinessDimensions?: readonly string[];

  readonly evidenceIds?: readonly UUID[];

  readonly sequence: number;
}

/* ================================================================
 * Learning Objective
 * ================================================================ */

export interface EDCLearningObjective {
  readonly id: UUID;

  readonly category: EDCDevelopmentCategory;

  readonly title: string;

  readonly description: string;

  readonly expectedKnowledge?: readonly string[];

  readonly expectedSkills?: readonly string[];

  readonly expectedBehaviors?: readonly string[];

  readonly completionCriteria: readonly string[];
}

/* ================================================================
 * Competency
 * ================================================================ */

export interface EDCDevelopmentCompetency {
  readonly id: UUID;

  readonly category: EDCDevelopmentCategory;

  readonly name: string;

  readonly description: string;

  readonly currentLevel: number;

  readonly targetLevel: number;

  readonly maximumLevel: number;

  readonly evidenceIds?: readonly UUID[];

  readonly lastAssessedAt?: ISODateString | null;
}

/* ================================================================
 * Success Metric
 * ================================================================ */

export interface EDCDevelopmentSuccessMetric {
  readonly id: UUID;

  readonly name: string;

  readonly description?: string | null;

  readonly type: EDCSuccessMetricType;

  readonly currentValue?: unknown;

  readonly targetValue: unknown;

  readonly unit?: string | null;

  readonly achieved: boolean;

  readonly evidenceRequirement:
    EDCDevelopmentEvidenceRequirement;

  readonly evidenceIds?: readonly UUID[];

  readonly measuredAt?: ISODateString | null;
}

/* ================================================================
 * Development Goal
 * ================================================================ */

export interface EDCDevelopmentGoal {
  readonly id: UUID;

  readonly category: EDCDevelopmentCategory;

  readonly title: string;

  readonly description: string;

  readonly objective: string;

  readonly status: EDCDevelopmentGoalStatus;

  readonly priority: EDCDevelopmentPriority;

  readonly expectedImpact: EDCDevelopmentPlanImpact;

  readonly startDate?: ISODateString | null;

  readonly targetCompletionDate?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly progressPercentage: number;

  readonly learningObjectives:
    readonly EDCLearningObjective[];

  readonly competencies:
    readonly EDCDevelopmentCompetency[];

  readonly successMetrics:
    readonly EDCDevelopmentSuccessMetric[];

  readonly milestoneIds?: readonly UUID[];

  readonly activityIds?: readonly UUID[];

  readonly evidenceIds?: readonly UUID[];

  readonly reflectionIds?: readonly UUID[];

  readonly recommendationIds?: readonly UUID[];

  readonly blockers?: readonly string[];

  readonly notes?: readonly string[];
}
/* ================================================================
 * Development Resource
 * ================================================================ */

export interface EDCDevelopmentResource {

  readonly id: UUID;

  readonly title: string;

  readonly description?: string;

  readonly type:
    | "ARTICLE"
    | "VIDEO"
    | "COURSE"
    | "DOCUMENT"
    | "CHECKLIST"
    | "TEMPLATE"
    | "WEBSITE"
    | "BOOK"
    | "OTHER";

  readonly url?: string;

  readonly required: boolean;

}

/* ================================================================
 * Expected Outcome
 * ================================================================ */

export interface EDCDevelopmentExpectedOutcome {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly measurable: boolean;

  readonly successMetricIds?: readonly UUID[];

}

/* ================================================================
 * Development Risk
 * ================================================================ */

export interface EDCDevelopmentRisk {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly severity:

    | "LOW"

    | "MEDIUM"

    | "HIGH"

    | "CRITICAL";

  readonly mitigationActions:
    readonly string[];

}

/* ================================================================
 * Development Blocker
 * ================================================================ */

export interface EDCDevelopmentBlocker {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly resolved: boolean;

  readonly resolvedAt?: ISODateString | null;

}

/* ================================================================
 * Development Review Schedule
 * ================================================================ */

export interface EDCDevelopmentReviewSchedule {

  readonly frequency:

    | "DAILY"

    | "WEEKLY"

    | "BIWEEKLY"

    | "MONTHLY"

    | "QUARTERLY";

  readonly nextReviewDate: ISODateString;

  readonly automaticReview: boolean;

}

/* ================================================================
 * Progress Summary
 * ================================================================ */

export interface EDCDevelopmentProgress {

  readonly totalGoals: number;

  readonly completedGoals: number;

  readonly totalMilestones: number;

  readonly completedMilestones: number;

  readonly totalActivities: number;

  readonly completedActivities: number;

  readonly overallProgressPercentage: number;

  readonly estimatedCompletionDate?: ISODateString;

}

/* ================================================================
 * AI Plan Analysis
 * ================================================================ */

export interface EDCAIDevelopmentPlanAnalysis {

  readonly executiveSummary: string;

  readonly strengths:
    readonly string[];

  readonly highestPriorities:
    readonly string[];

  readonly recommendedSequence:
    readonly string[];

  readonly predictedRisks:
    readonly string[];

  readonly successFactors:
    readonly string[];

  readonly recommendedAdjustments:
    readonly string[];

  readonly confidence: number;

  readonly generatedAt: ISODateString;

}

/* ================================================================
 * Dynamic Plan Adjustment
 * ================================================================ */

export interface EDCDevelopmentPlanAdjustment {

  readonly id: UUID;

  readonly reason: string;

  readonly description: string;

  readonly adjustedBy:

    | "AI"

    | "HUMAN"

    | "HYBRID";

  readonly previousVersion: number;

  readonly newVersion: number;

  readonly effectiveDate: ISODateString;

}

/* ================================================================
 * Development Timeline
 * ================================================================ */

export interface EDCDevelopmentTimeline {

  readonly startDate: ISODateString;

  readonly targetCompletionDate: ISODateString;

  readonly estimatedDurationDays: number;

  readonly reviewSchedule:
    EDCDevelopmentReviewSchedule;

}

/* ================================================================
 * Development Plan Summary
 * ================================================================ */

export interface EDCDevelopmentPlanSummary {

  readonly entrepreneurId: UUID;

  readonly planId: UUID;

  readonly activeGoals: number;

  readonly completedGoals: number;

  readonly overallProgressPercentage: number;

  readonly estimatedCompletionDate?: ISODateString;

  readonly executiveSummary: string;

  readonly generatedAt: ISODateString;

}