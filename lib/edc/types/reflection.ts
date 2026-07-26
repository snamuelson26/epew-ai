/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: reflection.ts
 *
 * Enterprise Reflection Domain Model
 *
 * Reflection Philosophy
 *
 * Activity
 *      ↓
 * Evidence
 *      ↓
 * Reflection
 *      ↓
 * Learning
 *      ↓
 * Growth
 *      ↓
 * Readiness
 *      ↓
 * Assessment
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Reflection Status
 * ================================================================ */

export enum EDCReflectionStatus {

  DRAFT = "DRAFT",

  PENDING = "PENDING",

  IN_PROGRESS = "IN_PROGRESS",

  SUBMITTED = "SUBMITTED",

  AI_REVIEWED = "AI_REVIEWED",

  COACH_REVIEWED = "COACH_REVIEWED",

  APPROVED = "APPROVED",

  ARCHIVED = "ARCHIVED"

}

/* ================================================================
 * Reflection Type
 * ================================================================ */

export enum EDCReflectionType {

  ACTIVITY = "ACTIVITY",

  INTERVIEW = "INTERVIEW",

  ASSESSMENT = "ASSESSMENT",

  READINESS = "READINESS",

  DEVELOPMENT_PLAN = "DEVELOPMENT_PLAN",

  BUSINESS_EVENT = "BUSINESS_EVENT",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  QUARTERLY = "QUARTERLY",

  CUSTOM = "CUSTOM"

}

/* ================================================================
 * Reflection Trigger
 * ================================================================ */

export enum EDCReflectionTrigger {

  ACTIVITY_COMPLETED = "ACTIVITY_COMPLETED",

  MILESTONE_COMPLETED = "MILESTONE_COMPLETED",

  INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED",

  ASSESSMENT_COMPLETED = "ASSESSMENT_COMPLETED",

  MANUAL = "MANUAL",

  SYSTEM = "SYSTEM"

}

/* ================================================================
 * Reflection Category
 * ================================================================ */

export enum EDCReflectionCategory {

  LEARNING = "LEARNING",

  CUSTOMER = "CUSTOMER",

  PRODUCT = "PRODUCT",

  MARKET = "MARKET",

  SALES = "SALES",

  MARKETING = "MARKETING",

  FINANCIAL = "FINANCIAL",

  OPERATIONS = "OPERATIONS",

  LEADERSHIP = "LEADERSHIP",

  COMMUNICATION = "COMMUNICATION",

  DECISION_MAKING = "DECISION_MAKING",

  CONFIDENCE = "CONFIDENCE",

  COMMUNITY = "COMMUNITY",

  PERSONAL_GROWTH = "PERSONAL_GROWTH",

  OTHER = "OTHER"

}

/* ================================================================
 * Reflection Priority
 * ================================================================ */

export enum EDCReflectionPriority {

  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"

}

/* ================================================================
 * Reflection Question
 * ================================================================ */

export interface EDCReflectionQuestion {

  readonly id: UUID;

  readonly category: EDCReflectionCategory;

  readonly question: string;

  readonly required: boolean;

  readonly order: number;

  readonly aiGenerated: boolean;

}

/* ================================================================
 * Reflection Response
 * ================================================================ */

export interface EDCReflectionResponse {

  readonly questionId: UUID;

  readonly response: string;

  readonly submittedAt: ISODateString;

}

/* ================================================================
 * Lesson Learned
 * ================================================================ */

export interface EDCLessonLearned {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly category: EDCReflectionCategory;

}

/* ================================================================
 * Challenge
 * ================================================================ */

export interface EDCReflectionChallenge {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly resolved: boolean;

}

/* ================================================================
 * Success
 * ================================================================ */

export interface EDCReflectionSuccess {

  readonly id: UUID;

  readonly title: string;

  readonly description: string;

}

/* ================================================================
 * Behavior Change
 * ================================================================ */

export interface EDCBehaviorChange {

  readonly id: UUID;

  readonly previousBehavior: string;

  readonly newBehavior: string;

  readonly reason: string;

}

/* ================================================================
 * Mindset Change
 * ================================================================ */

export interface EDCMindsetChange {

  readonly id: UUID;

  readonly previousMindset: string;

  readonly newMindset: string;

  readonly reason: string;

}

/* ================================================================
 * Confidence Change
 * ================================================================ */

export interface EDCConfidenceChange {

  readonly previousScore: number;

  readonly currentScore: number;

  readonly reason: string;

}
/* ================================================================
 * AI Reflection Analysis
 * ================================================================ */

export interface EDCAIReflectionAnalysis {
  readonly executiveSummary: string;

  readonly overallLearningScore: number;

  readonly confidenceScore: number;

  readonly emotionalSentiment:
    | "VERY_NEGATIVE"
    | "NEGATIVE"
    | "NEUTRAL"
    | "POSITIVE"
    | "VERY_POSITIVE";

  readonly growthMindsetScore: number;

  readonly resilienceScore: number;

  readonly selfAwarenessScore: number;

  readonly coachabilityScore: number;

  readonly communicationScore: number;

  readonly criticalThinkingScore: number;

  readonly keyStrengths: readonly string[];

  readonly improvementAreas: readonly string[];

  readonly lessonsExtracted: readonly string[];

  readonly opportunitiesIdentified: readonly string[];

  readonly risksIdentified: readonly string[];

  readonly aiRecommendations: readonly string[];

  readonly confidence: number;

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Coach Feedback
 * ================================================================ */

export interface EDCReflectionCoachFeedback {
  readonly coachId: UUID;

  readonly summary: string;

  readonly strengths: readonly string[];

  readonly recommendations: readonly string[];

  readonly nextFocusAreas: readonly string[];

  readonly score: number;

  readonly submittedAt: ISODateString;
}

/* ================================================================
 * Reflection Insight
 * ================================================================ */

export interface EDCReflectionInsight {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly importance:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly generatedBy:
    | "AI"
    | "COACH"
    | "SYSTEM";

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Reflection Development Impact
 * ================================================================ */

export interface EDCReflectionDevelopmentImpact {
  readonly developmentPlanUpdated: boolean;

  readonly prioritiesChanged: boolean;

  readonly newActivitiesRecommended: number;

  readonly goalsUpdated: number;

  readonly milestonesUpdated: number;

  readonly summary: string;
}

/* ================================================================
 * Reflection Readiness Impact
 * ================================================================ */

export interface EDCReflectionReadinessImpact {
  readonly readinessUpdated: boolean;

  readonly previousScore?: number;

  readonly newScore?: number;

  readonly affectedDimensions:
    readonly string[];

  readonly summary: string;
}

/* ================================================================
 * Reflection Assessment Impact
 * ================================================================ */

export interface EDCReflectionAssessmentImpact {
  readonly assessmentUpdated: boolean;

  readonly assessmentId?: UUID;

  readonly competenciesAffected:
    readonly string[];

  readonly summary: string;
}

/* ================================================================
 * Reflection Summary
 * ================================================================ */

export interface EDCReflectionSummary {
  readonly executiveSummary: string;

  readonly topLessons:
    readonly string[];

  readonly biggestChallenge: string;

  readonly biggestSuccess: string;

  readonly mindsetShift: string;

  readonly overallGrowthLevel:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "EXCEPTIONAL";
}

/* ================================================================
 * Reflection Recommendation
 * ================================================================ */

export interface EDCReflectionRecommendation {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority:
    EDCReflectionPriority;

  readonly expectedImpact: string;

  readonly estimatedDays?: number;

  readonly relatedActivityId?: UUID;
}

/* ================================================================
 * Reflection Competency Improvement
 * ================================================================ */

export interface EDCReflectionCompetencyImprovement {
  readonly competencyId: UUID;

  readonly competencyName: string;

  readonly previousLevel: number;

  readonly currentLevel: number;

  readonly improvement: number;
}

/* ================================================================
 * Reflection Next Best Action
 * ================================================================ */

export interface EDCReflectionNextBestAction {
  readonly title: string;

  readonly description: string;

  readonly reason: string;

  readonly priority:
    EDCReflectionPriority;

  readonly estimatedMinutes?: number;

  readonly relatedActivityId?: UUID;
}

/* ================================================================
 * Reflection AI Prediction
 * ================================================================ */

export interface EDCReflectionPrediction {
  readonly predictedOutcome: string;

  readonly confidence: number;

  readonly assumptions:
    readonly string[];

  readonly risks:
    readonly string[];

  readonly opportunities:
    readonly string[];
}

/* ================================================================
 * Reflection Metrics
 * ================================================================ */

export interface EDCReflectionMetrics {
  readonly wordCount: number;

  readonly completionPercentage: number;

  readonly questionsAnswered: number;

  readonly requiredQuestions: number;

  readonly optionalQuestionsAnswered: number;

  readonly evidenceReferenced: number;

  readonly lessonsExtracted: number;

  readonly behaviorChangesIdentified: number;

  readonly mindsetChangesIdentified: number;
}
/* ================================================================
 * Reflection
 * ================================================================ */

export interface EDCReflection {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly developmentPlanId?: UUID;

  readonly activityId?: UUID;

  readonly assessmentId?: UUID;

  readonly readinessId?: UUID;

  readonly interviewId?: UUID;

  readonly title: string;

  readonly description?: string;

  readonly status: EDCReflectionStatus;

  readonly type: EDCReflectionType;

  readonly trigger: EDCReflectionTrigger;

  readonly category: EDCReflectionCategory;

  readonly priority: EDCReflectionPriority;

  readonly questions:
    readonly EDCReflectionQuestion[];

  readonly responses:
    readonly EDCReflectionResponse[];

  readonly lessonsLearned:
    readonly EDCLessonLearned[];

  readonly challenges:
    readonly EDCReflectionChallenge[];

  readonly successes:
    readonly EDCReflectionSuccess[];

  readonly behaviorChanges:
    readonly EDCBehaviorChange[];

  readonly mindsetChanges:
    readonly EDCMindsetChange[];

  readonly confidenceChange?:
    EDCConfidenceChange;

  readonly aiAnalysis?:
    EDCAIReflectionAnalysis;

  readonly coachFeedback?:
    EDCReflectionCoachFeedback;

  readonly insights:
    readonly EDCReflectionInsight[];

  readonly developmentImpact?:
    EDCReflectionDevelopmentImpact;

  readonly readinessImpact?:
    EDCReflectionReadinessImpact;

  readonly assessmentImpact?:
    EDCReflectionAssessmentImpact;

  readonly competencyImprovements:
    readonly EDCReflectionCompetencyImprovement[];

  readonly recommendations:
    readonly EDCReflectionRecommendation[];

  readonly nextBestAction?:
    EDCReflectionNextBestAction;

  readonly prediction?:
    EDCReflectionPrediction;

  readonly summary?:
    EDCReflectionSummary;

  readonly metrics?:
    EDCReflectionMetrics;

  readonly submittedAt?: ISODateString;

  readonly approvedAt?: ISODateString;

  readonly archivedAt?: ISODateString;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID;
}

/* ================================================================
 * Create DTO
 * ================================================================ */

export interface CreateEDCReflectionDTO {
  readonly entrepreneurId: UUID;

  readonly activityId?: UUID;

  readonly assessmentId?: UUID;

  readonly readinessId?: UUID;

  readonly interviewId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly title: string;

  readonly description?: string;

  readonly type: EDCReflectionType;

  readonly trigger: EDCReflectionTrigger;

  readonly category: EDCReflectionCategory;

  readonly priority?: EDCReflectionPriority;
}

/* ================================================================
 * Update DTO
 * ================================================================ */

export interface UpdateEDCReflectionDTO {
  readonly title?: string;

  readonly description?: string;

  readonly status?: EDCReflectionStatus;

  readonly priority?: EDCReflectionPriority;

  readonly questions?:
    readonly EDCReflectionQuestion[];

  readonly responses?:
    readonly EDCReflectionResponse[];

  readonly lessonsLearned?:
    readonly EDCLessonLearned[];

  readonly challenges?:
    readonly EDCReflectionChallenge[];

  readonly successes?:
    readonly EDCReflectionSuccess[];

  readonly behaviorChanges?:
    readonly EDCBehaviorChange[];

  readonly mindsetChanges?:
    readonly EDCMindsetChange[];
}

/* ================================================================
 * Reflection Search Filter
 * ================================================================ */

export interface EDCReflectionSearchFilter {
  readonly entrepreneurId?: UUID;

  readonly coachId?: UUID;

  readonly activityId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly assessmentId?: UUID;

  readonly readinessId?: UUID;

  readonly status?: EDCReflectionStatus;

  readonly type?: EDCReflectionType;

  readonly category?: EDCReflectionCategory;

  readonly priority?: EDCReflectionPriority;

  readonly createdAfter?: ISODateString;

  readonly createdBefore?: ISODateString;

  readonly keyword?: string;
}

/* ================================================================
 * Reflection Dashboard Summary
 * ================================================================ */

export interface EDCReflectionDashboardSummary {
  readonly totalReflections: number;

  readonly pending: number;

  readonly submitted: number;

  readonly approved: number;

  readonly archived: number;

  readonly averageLearningScore: number;

  readonly averageGrowthMindset: number;

  readonly averageCoachability: number;

  readonly averageResilience: number;

  readonly averageConfidence: number;
}

/* ================================================================
 * Reflection Timeline Entry
 * ================================================================ */

export interface EDCReflectionTimelineEntry {
  readonly reflectionId: UUID;

  readonly title: string;

  readonly type: EDCReflectionType;

  readonly status: EDCReflectionStatus;

  readonly submittedAt?: ISODateString;

  readonly summary?: string;
}

/* ================================================================
 * Archive DTO
 * ================================================================ */

export interface ArchiveEDCReflectionDTO {
  readonly archivedBy: UUID;

  readonly reason: string;

  readonly archivedAt: ISODateString;
}

/* ================================================================
 * Restore DTO
 * ================================================================ */

export interface RestoreEDCReflectionDTO {
  readonly restoredBy: UUID;

  readonly restoredAt: ISODateString;

  readonly reason?: string;
}

/* ================================================================
 * Reflection Statistics
 * ================================================================ */

export interface EDCReflectionStatistics {
  readonly total: number;

  readonly byStatus:
    Record<EDCReflectionStatus, number>;

  readonly byType:
    Partial<Record<EDCReflectionType, number>>;

  readonly byCategory:
    Partial<Record<EDCReflectionCategory, number>>;

  readonly averageLearningScore: number;

  readonly averageConfidence: number;

  readonly averageGrowthMindset: number;

  readonly averageCoachability: number;
}

/* ================================================================
 * Reflection Snapshot
 * ================================================================ */

export interface EDCReflectionSnapshot {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly status: EDCReflectionStatus;

  readonly type: EDCReflectionType;

  readonly category: EDCReflectionCategory;

  readonly submittedAt?: ISODateString;
}