/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * timeline.ts
 *
 * Enterprise Timeline Engine
 *
 * The Timeline is the immutable chronological history of an
 * entrepreneur's development journey.
 *
 * Every meaningful event becomes a timeline event.
 *
 * Domain models only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Timeline Status
 * ================================================================ */

export enum EDCTimelineStatus {
  ACTIVE = "ACTIVE",

  HIDDEN = "HIDDEN",

  ARCHIVED = "ARCHIVED",

  RESTORED = "RESTORED",

  SYSTEM_ONLY = "SYSTEM_ONLY"
}

/* ================================================================
 * Timeline Visibility
 * ================================================================ */

export enum EDCTimelineVisibility {
  PUBLIC = "PUBLIC",

  ENTREPRENEUR = "ENTREPRENEUR",

  COACH = "COACH",

  ADMINISTRATOR = "ADMINISTRATOR",

  SYSTEM = "SYSTEM",

  PRIVATE = "PRIVATE"
}

/* ================================================================
 * Timeline Importance
 * ================================================================ */

export enum EDCTimelineImportance {
  LOW = "LOW",

  NORMAL = "NORMAL",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",

  HISTORIC = "HISTORIC"
}

/* ================================================================
 * Timeline Source
 * ================================================================ */

export enum EDCTimelineSource {
  AI = "AI",

  COACH = "COACH",

  ENTREPRENEUR = "ENTREPRENEUR",

  ADMINISTRATOR = "ADMINISTRATOR",

  PARTNER = "PARTNER",

  SYSTEM = "SYSTEM",

  IMPORT = "IMPORT"
}

/* ================================================================
 * Timeline Event Type
 * ================================================================ */

export enum EDCTimelineEventType {
  PROFILE_CREATED = "PROFILE_CREATED",

  REGISTRATION_COMPLETED = "REGISTRATION_COMPLETED",

  COACH_ASSIGNED = "COACH_ASSIGNED",

  INTERVIEW_CREATED = "INTERVIEW_CREATED",

  INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED",

  READINESS_UPDATED = "READINESS_UPDATED",

  ASSESSMENT_CREATED = "ASSESSMENT_CREATED",

  ASSESSMENT_COMPLETED = "ASSESSMENT_COMPLETED",

  DEVELOPMENT_PLAN_CREATED = "DEVELOPMENT_PLAN_CREATED",

  DEVELOPMENT_PLAN_UPDATED = "DEVELOPMENT_PLAN_UPDATED",

  SESSION_SCHEDULED = "SESSION_SCHEDULED",

  SESSION_COMPLETED = "SESSION_COMPLETED",

  ACTIVITY_ASSIGNED = "ACTIVITY_ASSIGNED",

  ACTIVITY_COMPLETED = "ACTIVITY_COMPLETED",

  REFLECTION_SUBMITTED = "REFLECTION_SUBMITTED",

  RECOMMENDATION_CREATED = "RECOMMENDATION_CREATED",

  RECOMMENDATION_COMPLETED = "RECOMMENDATION_COMPLETED",

  MILESTONE_CREATED = "MILESTONE_CREATED",

  MILESTONE_COMPLETED = "MILESTONE_COMPLETED",

  GOAL_COMPLETED = "GOAL_COMPLETED",

  BUSINESS_PLAN_COMPLETED = "BUSINESS_PLAN_COMPLETED",

  FUNDING_READY = "FUNDING_READY",

  BUSINESS_LAUNCHED = "BUSINESS_LAUNCHED",

  COACH_NOTE = "COACH_NOTE",

  SYSTEM_EVENT = "SYSTEM_EVENT",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Timeline Category
 * ================================================================ */

export enum EDCTimelineCategory {
  PROFILE = "PROFILE",

  ONBOARDING = "ONBOARDING",

  INTERVIEW = "INTERVIEW",

  READINESS = "READINESS",

  ASSESSMENT = "ASSESSMENT",

  DEVELOPMENT_PLAN = "DEVELOPMENT_PLAN",

  SESSION = "SESSION",

  ACTIVITY = "ACTIVITY",

  REFLECTION = "REFLECTION",

  RECOMMENDATION = "RECOMMENDATION",

  MILESTONE = "MILESTONE",

  BUSINESS = "BUSINESS",

  FUNDING = "FUNDING",

  LAUNCH = "LAUNCH",

  COMPLIANCE = "COMPLIANCE",

  SYSTEM = "SYSTEM",

  OTHER = "OTHER"
}

/* ================================================================
 * Timeline Actor
 * ================================================================ */

export interface EDCTimelineActor {
  readonly id?: UUID;

  readonly type:
    | "ENTREPRENEUR"
    | "COACH"
    | "ADMINISTRATOR"
    | "PARTNER"
    | "SYSTEM"
    | "AI";

  readonly name: string;
}

/* ================================================================
 * Timeline Attachment
 * ================================================================ */

export interface EDCTimelineAttachment {
  readonly id: UUID;

  readonly fileId?: UUID;

  readonly title: string;

  readonly description?: string;

  readonly fileType: string;

  readonly url?: string;

  readonly uploadedAt: ISODateString;
}

/* ================================================================
 * Timeline Tag
 * ================================================================ */

export interface EDCTimelineTag {
  readonly name: string;

  readonly color?: string;
}

/* ================================================================
 * Timeline Reaction
 * ================================================================ */

export interface EDCTimelineReaction {
  readonly userId: UUID;

  readonly reaction:
    | "ACKNOWLEDGED"
    | "APPROVED"
    | "LIKE"
    | "IMPORTANT";

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Timeline Comment
 * ================================================================ */

export interface EDCTimelineComment {
  readonly id: UUID;

  readonly authorId: UUID;

  readonly authorType:
    | "ENTREPRENEUR"
    | "COACH"
    | "ADMINISTRATOR"
    | "AI";

  readonly comment: string;

  readonly private: boolean;

  readonly createdAt: ISODateString;

  readonly updatedAt?: ISODateString;
}

/* ================================================================
 * Timeline Link
 * ================================================================ */

export interface EDCTimelineLink {
  readonly entityId: UUID;

  readonly entityType:
    | "INTERVIEW"
    | "ASSESSMENT"
    | "SESSION"
    | "MILESTONE"
    | "ACTIVITY"
    | "REFLECTION"
    | "RECOMMENDATION"
    | "READINESS"
    | "DEVELOPMENT_PLAN"
    | "BUSINESS"
    | "OTHER";
}

/* ================================================================
 * Timeline Metadata
 * ================================================================ */

export interface EDCTimelineMetadata {
  readonly ipAddress?: string;

  readonly device?: string;

  readonly platform?: string;

  readonly browser?: string;

  readonly location?: string;

  readonly automation: boolean;
}

/* ================================================================
 * Timeline Event
 * ================================================================ */

export interface EDCTimelineEvent {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly description: string;

  readonly status: EDCTimelineStatus;

  readonly visibility: EDCTimelineVisibility;

  readonly importance: EDCTimelineImportance;

  readonly source: EDCTimelineSource;

  readonly eventType: EDCTimelineEventType;

  readonly category: EDCTimelineCategory;

  readonly actor: EDCTimelineActor;

  readonly links:
    readonly EDCTimelineLink[];

  readonly tags:
    readonly EDCTimelineTag[];

  readonly attachments:
    readonly EDCTimelineAttachment[];

  readonly comments:
    readonly EDCTimelineComment[];

  readonly reactions:
    readonly EDCTimelineReaction[];

  readonly metadata?: EDCTimelineMetadata;

  readonly occurredAt: ISODateString;

  readonly createdAt: ISODateString;
}
/* ================================================================
 * AI Timeline Summary
 * ================================================================ */

export interface EDCAITimelineSummary {
  readonly executiveSummary: string;

  readonly journeySummary: string;

  readonly currentStageSummary: string;

  readonly majorAchievements:
    readonly string[];

  readonly unresolvedChallenges:
    readonly string[];

  readonly keyTransitions:
    readonly string[];

  readonly recommendedPriorities:
    readonly string[];

  readonly confidence: number;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Timeline Progress Snapshot
 * ================================================================ */

export interface EDCTimelineProgressSnapshot {
  readonly entrepreneurId: UUID;

  readonly snapshotDate: ISODateString;

  readonly totalEvents: number;

  readonly completedActivities: number;

  readonly completedMilestones: number;

  readonly completedSessions: number;

  readonly completedAssessments: number;

  readonly submittedReflections: number;

  readonly completedRecommendations: number;

  readonly readinessScore?: number | null;

  readonly developmentProgressPercentage: number;

  readonly businessProgressPercentage: number;

  readonly currentJourneyStage: string;

  readonly summary: string;
}

/* ================================================================
 * Timeline Journey Stage
 * ================================================================ */

export interface EDCTimelineJourneyStage {
  readonly id: UUID;

  readonly name: string;

  readonly description: string;

  readonly startedAt: ISODateString;

  readonly completedAt?: ISODateString | null;

  readonly status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "BLOCKED"
    | "SKIPPED";

  readonly relatedEventIds:
    readonly UUID[];

  readonly completionPercentage: number;

  readonly summary?: string | null;
}

/* ================================================================
 * Timeline Journey Analytics
 * ================================================================ */

export interface EDCTimelineJourneyAnalytics {
  readonly totalJourneyDays: number;

  readonly activeJourneyDays: number;

  readonly inactivityDays: number;

  readonly averageEventsPerWeek: number;

  readonly averageProgressPerMonth: number;

  readonly completionVelocity: number;

  readonly consistencyScore: number;

  readonly engagementScore: number;

  readonly momentumScore: number;

  readonly readinessTrend:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING";

  readonly journeyTrend:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING";

  readonly currentStage: string;

  readonly longestInactivePeriodDays: number;
}

/* ================================================================
 * Timeline Pattern
 * ================================================================ */

export interface EDCTimelinePattern {
  readonly id: UUID;

  readonly type:
    | "PROGRESS"
    | "INACTIVITY"
    | "DELAY"
    | "ENGAGEMENT"
    | "COMPLETION"
    | "REPEATED_CHALLENGE"
    | "REPEATED_SUCCESS"
    | "READINESS_CHANGE"
    | "BEHAVIOR"
    | "OTHER";

  readonly title: string;

  readonly description: string;

  readonly confidence: number;

  readonly eventIds:
    readonly UUID[];

  readonly detectedAt: ISODateString;

  readonly recommendedResponse?: string | null;
}

/* ================================================================
 * Timeline Achievement
 * ================================================================ */

export interface EDCTimelineAchievement {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly category:
    | "ENTREPRENEUR_DEVELOPMENT"
    | "BUSINESS_DEVELOPMENT"
    | "READINESS"
    | "MILESTONE"
    | "ACTIVITY"
    | "SESSION"
    | "FUNDING"
    | "LAUNCH"
    | "COMPLIANCE"
    | "COMMUNITY"
    | "OTHER";

  readonly importance:
    EDCTimelineImportance;

  readonly relatedEventIds:
    readonly UUID[];

  readonly recognizedAt: ISODateString;

  readonly recognizedBy:
    EDCTimelineSource;

  readonly certificateEligible: boolean;

  readonly publicRecognitionEligible: boolean;
}

/* ================================================================
 * Timeline Risk
 * ================================================================ */

export interface EDCTimelineRisk {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly level:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly probability: number;

  readonly potentialImpact: number;

  readonly evidenceEventIds:
    readonly UUID[];

  readonly indicators:
    readonly string[];

  readonly recommendedIntervention: string;

  readonly requiresHumanReview: boolean;

  readonly detectedAt: ISODateString;

  readonly resolvedAt?: ISODateString | null;
}

/* ================================================================
 * Timeline Insight
 * ================================================================ */

export interface EDCTimelineInsight {
  readonly id: UUID;

  readonly type:
    | "PROGRESS"
    | "RISK"
    | "OPPORTUNITY"
    | "ACHIEVEMENT"
    | "READINESS"
    | "ENGAGEMENT"
    | "BUSINESS"
    | "FUNDING"
    | "LAUNCH"
    | "COMPLIANCE"
    | "OTHER";

  readonly title: string;

  readonly description: string;

  readonly importance:
    EDCTimelineImportance;

  readonly confidence: number;

  readonly supportingEventIds:
    readonly UUID[];

  readonly recommendedAction?: string | null;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Entrepreneur Story
 * ================================================================ */

export interface EDCEntrepreneurTimelineStory {
  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly introduction: string;

  readonly journeyNarrative: string;

  readonly definingMoments:
    readonly EDCEntrepreneurStoryMoment[];

  readonly achievements:
    readonly string[];

  readonly challengesOvercome:
    readonly string[];

  readonly currentPosition: string;

  readonly futureDirection: string;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Entrepreneur Story Moment
 * ================================================================ */

export interface EDCEntrepreneurStoryMoment {
  readonly eventId: UUID;

  readonly title: string;

  readonly narrative: string;

  readonly occurredAt: ISODateString;

  readonly significance:
    EDCTimelineImportance;
}

/* ================================================================
 * Coach Timeline Highlight
 * ================================================================ */

export interface EDCCoachTimelineHighlight {
  readonly id: UUID;

  readonly coachId: UUID;

  readonly entrepreneurId: UUID;

  readonly title: string;

  readonly summary: string;

  readonly importance:
    EDCTimelineImportance;

  readonly relatedEventIds:
    readonly UUID[];

  readonly actionRequired: boolean;

  readonly recommendedAction?: string | null;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Milestone Timeline History
 * ================================================================ */

export interface EDCMilestoneTimelineHistory {
  readonly milestoneId: UUID;

  readonly milestoneTitle: string;

  readonly createdAt: ISODateString;

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly totalDurationDays?: number | null;

  readonly statusChanges:
    readonly EDCTimelineStatusChange[];

  readonly evidenceEventIds:
    readonly UUID[];

  readonly relatedActivityIds:
    readonly UUID[];

  readonly summary: string;
}

/* ================================================================
 * Timeline Status Change
 * ================================================================ */

export interface EDCTimelineStatusChange {
  readonly previousStatus?: string | null;

  readonly newStatus: string;

  readonly changedBy:
    EDCTimelineActor;

  readonly reason?: string | null;

  readonly changedAt: ISODateString;
}

/* ================================================================
 * Business Lifecycle History
 * ================================================================ */

export interface EDCBusinessLifecycleHistory {
  readonly entrepreneurId: UUID;

  readonly businessId?: UUID | null;

  readonly currentStage: string;

  readonly stages:
    readonly EDCBusinessLifecycleStageHistory[];

  readonly totalJourneyDays: number;

  readonly startedAt: ISODateString;

  readonly lastUpdatedAt: ISODateString;
}

/* ================================================================
 * Business Lifecycle Stage History
 * ================================================================ */

export interface EDCBusinessLifecycleStageHistory {
  readonly stage: string;

  readonly status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "BLOCKED"
    | "CANCELLED";

  readonly enteredAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly durationDays?: number | null;

  readonly relatedEventIds:
    readonly UUID[];

  readonly summary?: string | null;
}

/* ================================================================
 * Predictive Timeline Analysis
 * ================================================================ */

export interface EDCPredictiveTimelineAnalysis {
  readonly projectedNextStage?: string | null;

  readonly projectedNextMilestone?: string | null;

  readonly projectedMilestoneCompletionAt?: ISODateString | null;

  readonly projectedFundingReadinessAt?: ISODateString | null;

  readonly projectedBusinessLaunchAt?: ISODateString | null;

  readonly completionProbability: number;

  readonly delayProbability: number;

  readonly dropoutProbability: number;

  readonly assumptions:
    readonly string[];

  readonly blockers:
    readonly string[];

  readonly confidence: number;

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Timeline Momentum Analysis
 * ================================================================ */

export interface EDCTimelineMomentumAnalysis {
  readonly currentMomentumScore: number;

  readonly previousMomentumScore?: number | null;

  readonly scoreChange?: number | null;

  readonly direction:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING";

  readonly positiveDrivers:
    readonly string[];

  readonly negativeDrivers:
    readonly string[];

  readonly recommendedActions:
    readonly string[];

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Timeline Inactivity Analysis
 * ================================================================ */

export interface EDCTimelineInactivityAnalysis {
  readonly inactive: boolean;

  readonly daysSinceLastMeaningfulEvent: number;

  readonly lastMeaningfulEventId?: UUID | null;

  readonly inactivityRiskLevel:
    | "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly likelyCauses:
    readonly string[];

  readonly recommendedInterventions:
    readonly string[];

  readonly followUpRequired: boolean;

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Timeline Readiness History
 * ================================================================ */

export interface EDCTimelineReadinessHistory {
  readonly entrepreneurId: UUID;

  readonly currentScore?: number | null;

  readonly previousScore?: number | null;

  readonly scoreChange?: number | null;

  readonly trend:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING";

  readonly entries:
    readonly EDCTimelineReadinessEntry[];

  readonly updatedAt: ISODateString;
}

/* ================================================================
 * Timeline Readiness Entry
 * ================================================================ */

export interface EDCTimelineReadinessEntry {
  readonly eventId: UUID;

  readonly readinessId?: UUID | null;

  readonly score: number;

  readonly previousScore?: number | null;

  readonly change?: number | null;

  readonly affectedDimensions:
    readonly string[];

  readonly reason: string;

  readonly recordedAt: ISODateString;
}

/* ================================================================
 * Timeline Intelligence Bundle
 * ================================================================ */

export interface EDCTimelineIntelligence {
  readonly aiSummary?:
    EDCAITimelineSummary | null;

  readonly progressSnapshot?:
    EDCTimelineProgressSnapshot | null;

  readonly journeyAnalytics?:
    EDCTimelineJourneyAnalytics | null;

  readonly patterns:
    readonly EDCTimelinePattern[];

  readonly achievements:
    readonly EDCTimelineAchievement[];

  readonly risks:
    readonly EDCTimelineRisk[];

  readonly insights:
    readonly EDCTimelineInsight[];

  readonly coachHighlights:
    readonly EDCCoachTimelineHighlight[];

  readonly predictiveAnalysis?:
    EDCPredictiveTimelineAnalysis | null;

  readonly momentumAnalysis?:
    EDCTimelineMomentumAnalysis | null;

  readonly inactivityAnalysis?:
    EDCTimelineInactivityAnalysis | null;

  readonly readinessHistory?:
    EDCTimelineReadinessHistory | null;

  readonly generatedAt: ISODateString;
}
