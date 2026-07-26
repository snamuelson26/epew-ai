/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: session.ts
 *
 * Enterprise Coaching Session Domain Model
 *
 * Session Philosophy
 *
 * Entrepreneur Context
 *      ↓
 * Session Preparation
 *      ↓
 * Agenda
 *      ↓
 * Discussion
 *      ↓
 * Decisions
 *      ↓
 * Assignments
 *      ↓
 * Follow-Up
 *      ↓
 * Measurable Development
 *
 * A session is a structured development interaction that connects
 * interviews, assessments, milestones, activities, reflections,
 * recommendations, and readiness progression.
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Session Status
 * ================================================================ */

export enum EDCSessionStatus {
  DRAFT = "DRAFT",

  REQUESTED = "REQUESTED",

  SCHEDULING = "SCHEDULING",

  SCHEDULED = "SCHEDULED",

  CONFIRMED = "CONFIRMED",

  PREPARATION_IN_PROGRESS = "PREPARATION_IN_PROGRESS",

  READY = "READY",

  IN_PROGRESS = "IN_PROGRESS",

  PAUSED = "PAUSED",

  COMPLETED = "COMPLETED",

  FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED",

  RESCHEDULE_REQUESTED = "RESCHEDULE_REQUESTED",

  RESCHEDULED = "RESCHEDULED",

  CANCELLED = "CANCELLED",

  MISSED = "MISSED",

  EXPIRED = "EXPIRED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Session Type
 * ================================================================ */

export enum EDCSessionType {
  INITIAL_ORIENTATION = "INITIAL_ORIENTATION",

  INITIAL_INTERVIEW = "INITIAL_INTERVIEW",

  READINESS_REVIEW = "READINESS_REVIEW",

  ASSESSMENT_REVIEW = "ASSESSMENT_REVIEW",

  DEVELOPMENT_PLAN_REVIEW = "DEVELOPMENT_PLAN_REVIEW",

  GOAL_SETTING = "GOAL_SETTING",

  MILESTONE_REVIEW = "MILESTONE_REVIEW",

  ACTIVITY_REVIEW = "ACTIVITY_REVIEW",

  REFLECTION_REVIEW = "REFLECTION_REVIEW",

  PROGRESS_REVIEW = "PROGRESS_REVIEW",

  ACCOUNTABILITY = "ACCOUNTABILITY",

  BUSINESS_PLANNING = "BUSINESS_PLANNING",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  FINANCIAL_READINESS = "FINANCIAL_READINESS",

  LEGAL_AND_COMPLIANCE = "LEGAL_AND_COMPLIANCE",

  MARKETING = "MARKETING",

  SALES = "SALES",

  MARKETPLACE_PREPARATION = "MARKETPLACE_PREPARATION",

  FUNDING_PREPARATION = "FUNDING_PREPARATION",

  FUNDING_READINESS_REVIEW = "FUNDING_READINESS_REVIEW",

  BUSINESS_LAUNCH_PREPARATION = "BUSINESS_LAUNCH_PREPARATION",

  BUSINESS_LAUNCH_REVIEW = "BUSINESS_LAUNCH_REVIEW",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  RISK_INTERVENTION = "RISK_INTERVENTION",

  COMPLIANCE_INTERVENTION = "COMPLIANCE_INTERVENTION",

  SUPPORT = "SUPPORT",

  FOLLOW_UP = "FOLLOW_UP",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Session Category
 * ================================================================ */

export enum EDCSessionCategory {
  ONBOARDING = "ONBOARDING",

  ENTREPRENEUR_DEVELOPMENT = "ENTREPRENEUR_DEVELOPMENT",

  BUSINESS_DEVELOPMENT = "BUSINESS_DEVELOPMENT",

  READINESS = "READINESS",

  PLANNING = "PLANNING",

  PERFORMANCE = "PERFORMANCE",

  ACCOUNTABILITY = "ACCOUNTABILITY",

  FINANCIAL = "FINANCIAL",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  COMPLIANCE = "COMPLIANCE",

  RISK = "RISK",

  GROWTH = "GROWTH",

  SUPPORT = "SUPPORT",

  OTHER = "OTHER"
}

/* ================================================================
 * Session Delivery Mode
 * ================================================================ */

export enum EDCSessionDeliveryMode {
  AI_CHAT = "AI_CHAT",

  AI_VOICE = "AI_VOICE",

  PHONE = "PHONE",

  VIDEO_CALL = "VIDEO_CALL",

  IN_PERSON = "IN_PERSON",

  MESSAGING = "MESSAGING",

  EMAIL = "EMAIL",

  SELF_GUIDED = "SELF_GUIDED",

  HYBRID = "HYBRID"
}

/* ================================================================
 * Session Facilitation Mode
 * ================================================================ */

export enum EDCSessionFacilitationMode {
  AI_FACILITATED = "AI_FACILITATED",

  HUMAN_FACILITATED = "HUMAN_FACILITATED",

  HYBRID_FACILITATED = "HYBRID_FACILITATED",

  SYSTEM_GUIDED = "SYSTEM_GUIDED",

  SELF_DIRECTED = "SELF_DIRECTED"
}

/* ================================================================
 * Session Priority
 * ================================================================ */

export enum EDCSessionPriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",

  IMMEDIATE = "IMMEDIATE"
}

/* ================================================================
 * Session Urgency
 * ================================================================ */

export enum EDCSessionUrgency {
  ROUTINE = "ROUTINE",

  TIME_SENSITIVE = "TIME_SENSITIVE",

  URGENT = "URGENT",

  IMMEDIATE = "IMMEDIATE"
}

/* ================================================================
 * Session Attendance Status
 * ================================================================ */

export enum EDCSessionAttendanceStatus {
  INVITED = "INVITED",

  CONFIRMED = "CONFIRMED",

  TENTATIVE = "TENTATIVE",

  PRESENT = "PRESENT",

  LATE = "LATE",

  LEFT_EARLY = "LEFT_EARLY",

  ABSENT = "ABSENT",

  EXCUSED = "EXCUSED",

  DECLINED = "DECLINED"
}

/* ================================================================
 * Session Participant Role
 * ================================================================ */

export enum EDCSessionParticipantRole {
  ENTREPRENEUR = "ENTREPRENEUR",

  COACH = "COACH",

  ADMINISTRATOR = "ADMINISTRATOR",

  PARTNER = "PARTNER",

  COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER",

  FUNDING_REVIEWER = "FUNDING_REVIEWER",

  BUSINESS_ADVISOR = "BUSINESS_ADVISOR",

  INTERPRETER = "INTERPRETER",

  OBSERVER = "OBSERVER",

  SYSTEM = "SYSTEM",

  OTHER = "OTHER"
}

/* ================================================================
 * Session Agenda Item Status
 * ================================================================ */

export enum EDCSessionAgendaItemStatus {
  PLANNED = "PLANNED",

  IN_DISCUSSION = "IN_DISCUSSION",

  COMPLETED = "COMPLETED",

  DEFERRED = "DEFERRED",

  SKIPPED = "SKIPPED",

  CANCELLED = "CANCELLED"
}

/* ================================================================
 * Session Agenda Item Type
 * ================================================================ */

export enum EDCSessionAgendaItemType {
  WELCOME = "WELCOME",

  CHECK_IN = "CHECK_IN",

  PROGRESS_REVIEW = "PROGRESS_REVIEW",

  GOAL_REVIEW = "GOAL_REVIEW",

  MILESTONE_REVIEW = "MILESTONE_REVIEW",

  ACTIVITY_REVIEW = "ACTIVITY_REVIEW",

  EVIDENCE_REVIEW = "EVIDENCE_REVIEW",

  REFLECTION_REVIEW = "REFLECTION_REVIEW",

  ASSESSMENT_REVIEW = "ASSESSMENT_REVIEW",

  READINESS_REVIEW = "READINESS_REVIEW",

  RECOMMENDATION_REVIEW = "RECOMMENDATION_REVIEW",

  BUSINESS_DISCUSSION = "BUSINESS_DISCUSSION",

  CHALLENGE_RESOLUTION = "CHALLENGE_RESOLUTION",

  RISK_REVIEW = "RISK_REVIEW",

  COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",

  DECISION = "DECISION",

  ASSIGNMENT = "ASSIGNMENT",

  NEXT_STEPS = "NEXT_STEPS",

  CLOSING = "CLOSING",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Session Decision Type
 * ================================================================ */

export enum EDCSessionDecisionType {
  APPROVAL = "APPROVAL",

  REJECTION = "REJECTION",

  DEFERRAL = "DEFERRAL",

  REVISION_REQUIRED = "REVISION_REQUIRED",

  PLAN_UPDATE = "PLAN_UPDATE",

  GOAL_UPDATE = "GOAL_UPDATE",

  MILESTONE_UPDATE = "MILESTONE_UPDATE",

  ACTIVITY_ASSIGNMENT = "ACTIVITY_ASSIGNMENT",

  REFERRAL = "REFERRAL",

  ESCALATION = "ESCALATION",

  READINESS_UPDATE = "READINESS_UPDATE",

  ASSESSMENT_UPDATE = "ASSESSMENT_UPDATE",

  FUNDING_ACTION = "FUNDING_ACTION",

  BUSINESS_LAUNCH_ACTION = "BUSINESS_LAUNCH_ACTION",

  COMPLIANCE_ACTION = "COMPLIANCE_ACTION",

  NO_ACTION = "NO_ACTION",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Session Decision Status
 * ================================================================ */

export enum EDCSessionDecisionStatus {
  PROPOSED = "PROPOSED",

  PENDING_APPROVAL = "PENDING_APPROVAL",

  APPROVED = "APPROVED",

  REJECTED = "REJECTED",

  IMPLEMENTED = "IMPLEMENTED",

  SUPERSEDED = "SUPERSEDED",

  CANCELLED = "CANCELLED"
}

/* ================================================================
 * Session Assignment Status
 * ================================================================ */

export enum EDCSessionAssignmentStatus {
  DRAFT = "DRAFT",

  ASSIGNED = "ASSIGNED",

  ACCEPTED = "ACCEPTED",

  IN_PROGRESS = "IN_PROGRESS",

  SUBMITTED = "SUBMITTED",

  COMPLETED = "COMPLETED",

  OVERDUE = "OVERDUE",

  CANCELLED = "CANCELLED"
}

/* ================================================================
 * Session Outcome
 * ================================================================ */

export enum EDCSessionOutcome {
  NOT_DETERMINED = "NOT_DETERMINED",

  OBJECTIVES_NOT_MET = "OBJECTIVES_NOT_MET",

  OBJECTIVES_PARTIALLY_MET = "OBJECTIVES_PARTIALLY_MET",

  OBJECTIVES_MET = "OBJECTIVES_MET",

  OBJECTIVES_EXCEEDED = "OBJECTIVES_EXCEEDED",

  FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED",

  ESCALATION_REQUIRED = "ESCALATION_REQUIRED"
}

/* ================================================================
 * Session Sentiment
 * ================================================================ */

export enum EDCSessionSentiment {
  VERY_NEGATIVE = "VERY_NEGATIVE",

  NEGATIVE = "NEGATIVE",

  NEUTRAL = "NEUTRAL",

  POSITIVE = "POSITIVE",

  VERY_POSITIVE = "VERY_POSITIVE",

  MIXED = "MIXED"
}

/* ================================================================
 * Session Risk Level
 * ================================================================ */

export enum EDCSessionRiskLevel {
  NONE = "NONE",

  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"
}

/* ================================================================
 * Session Recording Status
 * ================================================================ */

export enum EDCSessionRecordingStatus {
  NOT_REQUIRED = "NOT_REQUIRED",

  CONSENT_PENDING = "CONSENT_PENDING",

  CONSENT_GRANTED = "CONSENT_GRANTED",

  RECORDING = "RECORDING",

  PROCESSING = "PROCESSING",

  AVAILABLE = "AVAILABLE",

  FAILED = "FAILED",

  DELETED = "DELETED"
}

/* ================================================================
 * Session Participant
 * ================================================================ */

export interface EDCSessionParticipant {
  readonly id: UUID;

  readonly userId?: UUID | null;

  readonly name: string;

  readonly email?: string | null;

  readonly phone?: string | null;

  readonly role: EDCSessionParticipantRole;

  readonly attendanceStatus: EDCSessionAttendanceStatus;

  readonly required: boolean;

  readonly invitedAt?: ISODateString | null;

  readonly respondedAt?: ISODateString | null;

  readonly joinedAt?: ISODateString | null;

  readonly leftAt?: ISODateString | null;

  readonly attendanceMinutes?: number | null;
}

/* ================================================================
 * Session Objective
 * ================================================================ */

export interface EDCSessionObjective {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority: EDCSessionPriority;

  readonly required: boolean;

  readonly achieved: boolean;

  readonly achievementNotes?: string | null;

  readonly achievedAt?: ISODateString | null;
}

/* ================================================================
 * Session Agenda Item
 * ================================================================ */

export interface EDCSessionAgendaItem {
  readonly id: UUID;

  readonly type: EDCSessionAgendaItemType;

  readonly title: string;

  readonly description?: string | null;

  readonly status: EDCSessionAgendaItemStatus;

  readonly sequence: number;

  readonly required: boolean;

  readonly estimatedMinutes?: number | null;

  readonly actualMinutes?: number | null;

  readonly presenterId?: UUID | null;

  readonly relatedEntityId?: UUID | null;

  readonly discussionNotes?: string | null;

  readonly outcome?: string | null;
}

/* ================================================================
 * Session Discussion Point
 * ================================================================ */

export interface EDCSessionDiscussionPoint {
  readonly id: UUID;

  readonly topic: string;

  readonly summary: string;

  readonly raisedBy?: UUID | null;

  readonly relatedAgendaItemId?: UUID | null;

  readonly relatedEntityId?: UUID | null;

  readonly concerns: readonly string[];

  readonly opportunities: readonly string[];

  readonly conclusions: readonly string[];

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Session Decision
 * ================================================================ */

export interface EDCSessionDecision {
  readonly id: UUID;

  readonly type: EDCSessionDecisionType;

  readonly status: EDCSessionDecisionStatus;

  readonly title: string;

  readonly description: string;

  readonly reason: string;

  readonly decidedBy: UUID;

  readonly approvedBy?: UUID | null;

  readonly relatedEntityId?: UUID | null;

  readonly requiresImplementation: boolean;

  readonly implementationDueAt?: ISODateString | null;

  readonly implementedAt?: ISODateString | null;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Session Assignment
 * ================================================================ */

export interface EDCSessionAssignment {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly status: EDCSessionAssignmentStatus;

  readonly assignedTo: UUID;

  readonly assignedBy: UUID;

  readonly relatedActivityId?: UUID | null;

  readonly relatedMilestoneId?: UUID | null;

  readonly priority: EDCSessionPriority;

  readonly required: boolean;

  readonly instructions: readonly string[];

  readonly dueAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly completionNotes?: string | null;
}

/* ================================================================
 * Session Resource
 * ================================================================ */

export interface EDCSessionResource {
  readonly id: UUID;

  readonly title: string;

  readonly description?: string | null;

  readonly type:
    | "DOCUMENT"
    | "VIDEO"
    | "AUDIO"
    | "ARTICLE"
    | "WORKSHEET"
    | "TEMPLATE"
    | "LINK"
    | "TOOL"
    | "OTHER";

  readonly url?: string | null;

  readonly fileId?: UUID | null;

  readonly required: boolean;

  readonly sharedAt?: ISODateString | null;
}

/* ================================================================
 * Session Note
 * ================================================================ */

export interface EDCSessionNote {
  readonly id: UUID;

  readonly authorId: UUID;

  readonly content: string;

  readonly private: boolean;

  readonly relatedAgendaItemId?: UUID | null;

  readonly createdAt: ISODateString;

  readonly updatedAt?: ISODateString | null;
}

/* ================================================================
 * Session Recording
 * ================================================================ */

export interface EDCSessionRecording {
  readonly status: EDCSessionRecordingStatus;

  readonly consentParticipantIds: readonly UUID[];

  readonly recordingUrl?: string | null;

  readonly transcriptUrl?: string | null;

  readonly transcriptText?: string | null;

  readonly durationSeconds?: number | null;

  readonly startedAt?: ISODateString | null;

  readonly endedAt?: ISODateString | null;

  readonly processedAt?: ISODateString | null;
}
/* ================================================================
 * AI Session Preparation
 * ================================================================ */

export interface EDCAISessionPreparation {
  readonly executiveBrief: string;

  readonly entrepreneurContextSummary: string;

  readonly recentProgressSummary: string;

  readonly priorityTopics: readonly string[];

  readonly unresolvedIssues: readonly string[];

  readonly recommendedQuestions: readonly string[];

  readonly recommendedResources:
    readonly EDCSessionResource[];

  readonly relatedMilestoneIds:
    readonly UUID[];

  readonly relatedActivityIds:
    readonly UUID[];

  readonly relatedRecommendationIds:
    readonly UUID[];

  readonly relatedReflectionIds:
    readonly UUID[];

  readonly preparationConfidence: number;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Adaptive Session Agenda
 * ================================================================ */

export interface EDCAdaptiveSessionAgenda {
  readonly generatedBy:
    | "AI"
    | "COACH"
    | "SYSTEM"
    | "HYBRID";

  readonly rationale: string;

  readonly agendaItems:
    readonly EDCSessionAgendaItem[];

  readonly estimatedDurationMinutes: number;

  readonly requiredReviewTopics:
    readonly string[];

  readonly optionalReviewTopics:
    readonly string[];

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Session Engagement Metrics
 * ================================================================ */

export interface EDCSessionEngagementMetrics {
  readonly overallEngagementScore: number;

  readonly participationScore: number;

  readonly attentivenessScore: number;

  readonly responsivenessScore: number;

  readonly preparationScore: number;

  readonly opennessScore: number;

  readonly coachabilityScore: number;

  readonly accountabilityScore: number;

  readonly questionsAsked: number;

  readonly commitmentsMade: number;

  readonly concernsRaised: number;

  readonly attendancePercentage: number;
}

/* ================================================================
 * Session Communication Analysis
 * ================================================================ */

export interface EDCSessionCommunicationAnalysis {
  readonly clarityScore: number;

  readonly confidenceScore: number;

  readonly listeningScore: number;

  readonly comprehensionScore: number;

  readonly emotionalTone:
    EDCSessionSentiment;

  readonly communicationStrengths:
    readonly string[];

  readonly communicationChallenges:
    readonly string[];

  readonly languageSupportRequired: boolean;

  readonly preferredLanguage?: string | null;

  readonly interpreterRecommended: boolean;
}

/* ================================================================
 * Session Risk Detection
 * ================================================================ */

export interface EDCSessionRiskDetection {
  readonly overallRiskLevel:
    EDCSessionRiskLevel;

  readonly disengagementRisk: number;

  readonly dropoutRisk: number;

  readonly missedDeadlineRisk: number;

  readonly businessFailureRisk: number;

  readonly complianceRisk: number;

  readonly fundingReadinessRisk: number;

  readonly launchReadinessRisk: number;

  readonly detectedRisks:
    readonly EDCSessionDetectedRisk[];

  readonly escalationRequired: boolean;

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Session Detected Risk
 * ================================================================ */

export interface EDCSessionDetectedRisk {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly level:
    EDCSessionRiskLevel;

  readonly probability: number;

  readonly potentialImpact: number;

  readonly evidence:
    readonly string[];

  readonly recommendedIntervention:
    string;

  readonly requiresHumanReview: boolean;
}

/* ================================================================
 * AI Session Analysis
 * ================================================================ */

export interface EDCAISessionAnalysis {
  readonly executiveSummary: string;

  readonly sessionOutcome:
    EDCSessionOutcome;

  readonly sentiment:
    EDCSessionSentiment;

  readonly confidence: number;

  readonly objectiveCompletionScore: number;

  readonly engagementScore: number;

  readonly progressScore: number;

  readonly readinessImpactScore: number;

  readonly developmentImpactScore: number;

  readonly keyAchievements:
    readonly string[];

  readonly unresolvedChallenges:
    readonly string[];

  readonly decisionsExtracted:
    readonly string[];

  readonly commitmentsExtracted:
    readonly string[];

  readonly followUpTopics:
    readonly string[];

  readonly recommendedActions:
    readonly string[];

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Session Progress Impact
 * ================================================================ */

export interface EDCSessionProgressImpact {
  readonly developmentPlanUpdated: boolean;

  readonly goalsUpdated: number;

  readonly milestonesUpdated: number;

  readonly activitiesUpdated: number;

  readonly activitiesCreated: number;

  readonly recommendationsUpdated: number;

  readonly recommendationsCreated: number;

  readonly reflectionsRequired: number;

  readonly summary: string;
}

/* ================================================================
 * Session Readiness Impact
 * ================================================================ */

export interface EDCSessionReadinessImpact {
  readonly readinessUpdated: boolean;

  readonly previousScore?: number | null;

  readonly currentScore?: number | null;

  readonly scoreChange?: number | null;

  readonly affectedDimensions:
    readonly string[];

  readonly positiveIndicators:
    readonly string[];

  readonly concernIndicators:
    readonly string[];

  readonly summary: string;
}

/* ================================================================
 * Session Assessment Impact
 * ================================================================ */

export interface EDCSessionAssessmentImpact {
  readonly assessmentUpdated: boolean;

  readonly assessmentId?: UUID | null;

  readonly competenciesImproved:
    readonly string[];

  readonly competenciesDeclined:
    readonly string[];

  readonly reassessmentRequired: boolean;

  readonly reassessmentReason?: string | null;

  readonly summary: string;
}

/* ================================================================
 * Session Milestone Impact
 * ================================================================ */

export interface EDCSessionMilestoneImpact {
  readonly milestonesReviewed:
    readonly UUID[];

  readonly milestonesAdvanced:
    readonly UUID[];

  readonly milestonesCompleted:
    readonly UUID[];

  readonly milestonesBlocked:
    readonly UUID[];

  readonly nextMilestoneId?: UUID | null;

  readonly summary: string;
}

/* ================================================================
 * Session Recommendation Impact
 * ================================================================ */

export interface EDCSessionRecommendationImpact {
  readonly recommendationsReviewed:
    readonly UUID[];

  readonly recommendationsAccepted:
    readonly UUID[];

  readonly recommendationsDeclined:
    readonly UUID[];

  readonly recommendationsCompleted:
    readonly UUID[];

  readonly nextBestActionId?: UUID | null;

  readonly summary: string;
}

/* ================================================================
 * Session Follow-Up Requirement
 * ================================================================ */

export interface EDCSessionFollowUpRequirement {
  readonly required: boolean;

  readonly reason?: string | null;

  readonly priority:
    EDCSessionPriority;

  readonly followUpType:
    | "SESSION"
    | "ACTIVITY"
    | "DOCUMENT"
    | "ASSESSMENT"
    | "REFLECTION"
    | "RECOMMENDATION"
    | "PARTNER_REFERRAL"
    | "ADMIN_REVIEW"
    | "COMPLIANCE_REVIEW"
    | "FUNDING_REVIEW"
    | "OTHER";

  readonly responsiblePartyId?: UUID | null;

  readonly dueAt?: ISODateString | null;

  readonly completed: boolean;

  readonly completedAt?: ISODateString | null;
}

/* ================================================================
 * Next Session Recommendation
 * ================================================================ */

export interface EDCNextSessionRecommendation {
  readonly type:
    EDCSessionType;

  readonly category:
    EDCSessionCategory;

  readonly title: string;

  readonly purpose: string;

  readonly reason: string;

  readonly priority:
    EDCSessionPriority;

  readonly recommendedDeliveryMode:
    EDCSessionDeliveryMode;

  readonly recommendedFacilitationMode:
    EDCSessionFacilitationMode;

  readonly recommendedDate?: ISODateString | null;

  readonly estimatedDurationMinutes?: number | null;

  readonly requiredBeforeProgression: boolean;
}

/* ================================================================
 * Session Coach Evaluation
 * ================================================================ */

export interface EDCSessionCoachEvaluation {
  readonly coachId: UUID;

  readonly entrepreneurPrepared: boolean;

  readonly objectivesMet: boolean;

  readonly engagementScore: number;

  readonly progressScore: number;

  readonly accountabilityScore: number;

  readonly strengths:
    readonly string[];

  readonly concerns:
    readonly string[];

  readonly recommendations:
    readonly string[];

  readonly privateNotes?: string | null;

  readonly submittedAt: ISODateString;
}

/* ================================================================
 * Entrepreneur Session Feedback
 * ================================================================ */

export interface EDCEntrepreneurSessionFeedback {
  readonly entrepreneurId: UUID;

  readonly helpfulnessScore: number;

  readonly clarityScore: number;

  readonly satisfactionScore: number;

  readonly confidenceAfterSession: number;

  readonly mostHelpfulTopic?: string | null;

  readonly remainingQuestions:
    readonly string[];

  readonly comments?: string | null;

  readonly submittedAt: ISODateString;
}

/* ================================================================
 * Session Quality Review
 * ================================================================ */

export interface EDCSessionQualityReview {
  readonly reviewerId?: UUID | null;

  readonly reviewerType:
    | "AI"
    | "COACH"
    | "ADMINISTRATOR"
    | "QUALITY_ASSURANCE";

  readonly structureScore: number;

  readonly facilitationScore: number;

  readonly relevanceScore: number;

  readonly outcomeScore: number;

  readonly documentationScore: number;

  readonly overallScore: number;

  readonly issues:
    readonly string[];

  readonly correctiveActions:
    readonly string[];

  readonly approved: boolean;

  readonly reviewedAt: ISODateString;
}

/* ================================================================
 * Session Summary
 * ================================================================ */

export interface EDCSessionSummary {
  readonly executiveSummary: string;

  readonly objectivesReviewed:
    readonly string[];

  readonly objectivesAchieved:
    readonly string[];

  readonly keyDiscussionPoints:
    readonly string[];

  readonly decisionsMade:
    readonly string[];

  readonly assignmentsCreated:
    readonly string[];

  readonly entrepreneurCommitments:
    readonly string[];

  readonly coachCommitments:
    readonly string[];

  readonly unresolvedItems:
    readonly string[];

  readonly nextSteps:
    readonly string[];

  readonly nextSessionPurpose?: string | null;
}

/* ================================================================
 * Session Analytics
 * ================================================================ */

export interface EDCSessionAnalytics {
  readonly scheduledDurationMinutes: number;

  readonly actualDurationMinutes?: number | null;

  readonly agendaCompletionPercentage: number;

  readonly objectiveCompletionPercentage: number;

  readonly attendancePercentage: number;

  readonly engagementScore: number;

  readonly outcomeScore: number;

  readonly followUpCompletionRate?: number | null;

  readonly assignmentsCreated: number;

  readonly decisionsCreated: number;

  readonly risksDetected: number;

  readonly recommendationsGenerated: number;
}

/* ================================================================
 * Session Automation Record
 * ================================================================ */

export interface EDCSessionAutomationRecord {
  readonly id: UUID;

  readonly action:
    | "SESSION_CREATED"
    | "AGENDA_GENERATED"
    | "REMINDER_SENT"
    | "SESSION_STARTED"
    | "TRANSCRIPT_PROCESSED"
    | "SUMMARY_GENERATED"
    | "ACTIVITY_CREATED"
    | "FOLLOW_UP_CREATED"
    | "READINESS_UPDATED"
    | "ASSESSMENT_UPDATED"
    | "MILESTONE_UPDATED"
    | "ESCALATION_CREATED"
    | "OTHER";

  readonly status:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "SKIPPED";

  readonly description: string;

  readonly initiatedBy:
    | "AI"
    | "SYSTEM"
    | "COACH"
    | "ADMINISTRATOR";

  readonly relatedEntityId?: UUID | null;

  readonly errorMessage?: string | null;

  readonly startedAt: ISODateString;

  readonly completedAt?: ISODateString | null;
}
/* ================================================================
 * Session Schedule
 * ================================================================ */

export interface EDCSessionSchedule {
  readonly scheduledStartAt: ISODateString;

  readonly scheduledEndAt: ISODateString;

  readonly timezone: string;

  readonly durationMinutes: number;

  readonly location?: string | null;

  readonly meetingUrl?: string | null;

  readonly calendarEventId?: string | null;

  readonly confirmationRequired: boolean;

  readonly confirmedAt?: ISODateString | null;

  readonly rescheduledFrom?: ISODateString | null;

  readonly rescheduleReason?: string | null;
}

/* ================================================================
 * Session Reminder
 * ================================================================ */

export interface EDCSessionReminder {
  readonly id: UUID;

  readonly channel:
    | "EMAIL"
    | "SMS"
    | "WHATSAPP"
    | "PUSH_NOTIFICATION"
    | "IN_APP"
    | "PHONE"
    | "OTHER";

  readonly recipientId: UUID;

  readonly scheduledAt: ISODateString;

  readonly sentAt?: ISODateString | null;

  readonly status:
    | "SCHEDULED"
    | "SENT"
    | "DELIVERED"
    | "FAILED"
    | "CANCELLED";

  readonly failureReason?: string | null;
}

/* ================================================================
 * Session Cancellation
 * ================================================================ */

export interface EDCSessionCancellation {
  readonly cancelledBy: UUID;

  readonly reason: string;

  readonly cancelledAt: ISODateString;

  readonly replacementSessionId?: UUID | null;

  readonly followUpRequired: boolean;
}

/* ================================================================
 * Session Reschedule Record
 * ================================================================ */

export interface EDCSessionRescheduleRecord {
  readonly id: UUID;

  readonly requestedBy: UUID;

  readonly previousStartAt: ISODateString;

  readonly previousEndAt: ISODateString;

  readonly newStartAt: ISODateString;

  readonly newEndAt: ISODateString;

  readonly reason: string;

  readonly approvedBy?: UUID | null;

  readonly approvedAt?: ISODateString | null;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Session Audit Entry
 * ================================================================ */

export interface EDCSessionAuditEntry {
  readonly id: UUID;

  readonly sessionId: UUID;

  readonly action:
    | "CREATED"
    | "UPDATED"
    | "SCHEDULED"
    | "CONFIRMED"
    | "STARTED"
    | "PAUSED"
    | "RESUMED"
    | "COMPLETED"
    | "RESCHEDULED"
    | "CANCELLED"
    | "MISSED"
    | "ARCHIVED"
    | "RESTORED"
    | "PARTICIPANT_ADDED"
    | "PARTICIPANT_REMOVED"
    | "DECISION_ADDED"
    | "ASSIGNMENT_ADDED"
    | "NOTE_ADDED"
    | "SUMMARY_GENERATED"
    | "OTHER";

  readonly actorId?: UUID | null;

  readonly actorType:
    | "ENTREPRENEUR"
    | "COACH"
    | "ADMINISTRATOR"
    | "AI"
    | "SYSTEM"
    | "PARTNER"
    | "OTHER";

  readonly description: string;

  readonly previousValue?: unknown;

  readonly newValue?: unknown;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Session Master Aggregate
 * ================================================================ */

export interface EDCSession {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly developmentPlanId?: UUID | null;

  readonly interviewId?: UUID | null;

  readonly assessmentId?: UUID | null;

  readonly readinessId?: UUID | null;

  readonly milestoneId?: UUID | null;

  readonly parentSessionId?: UUID | null;

  readonly followUpSessionId?: UUID | null;

  readonly title: string;

  readonly description?: string | null;

  readonly purpose: string;

  readonly status: EDCSessionStatus;

  readonly type: EDCSessionType;

  readonly category: EDCSessionCategory;

  readonly deliveryMode: EDCSessionDeliveryMode;

  readonly facilitationMode: EDCSessionFacilitationMode;

  readonly priority: EDCSessionPriority;

  readonly urgency: EDCSessionUrgency;

  readonly outcome:
    EDCSessionOutcome;

  readonly schedule?: EDCSessionSchedule | null;

  readonly participants:
    readonly EDCSessionParticipant[];

  readonly objectives:
    readonly EDCSessionObjective[];

  readonly agenda:
    readonly EDCSessionAgendaItem[];

  readonly discussionPoints:
    readonly EDCSessionDiscussionPoint[];

  readonly decisions:
    readonly EDCSessionDecision[];

  readonly assignments:
    readonly EDCSessionAssignment[];

  readonly resources:
    readonly EDCSessionResource[];

  readonly notes:
    readonly EDCSessionNote[];

  readonly reminders:
    readonly EDCSessionReminder[];

  readonly rescheduleHistory:
    readonly EDCSessionRescheduleRecord[];

  readonly recording?: EDCSessionRecording | null;

  readonly aiPreparation?:
    EDCAISessionPreparation | null;

  readonly adaptiveAgenda?:
    EDCAdaptiveSessionAgenda | null;

  readonly engagementMetrics?:
    EDCSessionEngagementMetrics | null;

  readonly communicationAnalysis?:
    EDCSessionCommunicationAnalysis | null;

  readonly riskDetection?:
    EDCSessionRiskDetection | null;

  readonly aiAnalysis?:
    EDCAISessionAnalysis | null;

  readonly progressImpact?:
    EDCSessionProgressImpact | null;

  readonly readinessImpact?:
    EDCSessionReadinessImpact | null;

  readonly assessmentImpact?:
    EDCSessionAssessmentImpact | null;

  readonly milestoneImpact?:
    EDCSessionMilestoneImpact | null;

  readonly recommendationImpact?:
    EDCSessionRecommendationImpact | null;

  readonly followUpRequirements:
    readonly EDCSessionFollowUpRequirement[];

  readonly nextSessionRecommendation?:
    EDCNextSessionRecommendation | null;

  readonly coachEvaluation?:
    EDCSessionCoachEvaluation | null;

  readonly entrepreneurFeedback?:
    EDCEntrepreneurSessionFeedback | null;

  readonly qualityReviews:
    readonly EDCSessionQualityReview[];

  readonly summary?:
    EDCSessionSummary | null;

  readonly analytics?:
    EDCSessionAnalytics | null;

  readonly automationHistory:
    readonly EDCSessionAutomationRecord[];

  readonly cancellation?:
    EDCSessionCancellation | null;

  readonly auditTrail:
    readonly EDCSessionAuditEntry[];

  readonly actualStartAt?: ISODateString | null;

  readonly actualEndAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID | null;

  readonly archivedAt?: ISODateString | null;
}

/* ================================================================
 * Create Session DTO
 * ================================================================ */

export interface CreateEDCSessionDTO {
  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly developmentPlanId?: UUID | null;

  readonly interviewId?: UUID | null;

  readonly assessmentId?: UUID | null;

  readonly readinessId?: UUID | null;

  readonly milestoneId?: UUID | null;

  readonly parentSessionId?: UUID | null;

  readonly title: string;

  readonly description?: string | null;

  readonly purpose: string;

  readonly type: EDCSessionType;

  readonly category: EDCSessionCategory;

  readonly deliveryMode: EDCSessionDeliveryMode;

  readonly facilitationMode: EDCSessionFacilitationMode;

  readonly priority?: EDCSessionPriority;

  readonly urgency?: EDCSessionUrgency;

  readonly schedule?: EDCSessionSchedule | null;

  readonly participantIds?: readonly UUID[];

  readonly objectives?:
    readonly EDCSessionObjective[];

  readonly agenda?:
    readonly EDCSessionAgendaItem[];
}

/* ================================================================
 * Update Session DTO
 * ================================================================ */

export interface UpdateEDCSessionDTO {
  readonly title?: string;

  readonly description?: string | null;

  readonly purpose?: string;

  readonly status?: EDCSessionStatus;

  readonly type?: EDCSessionType;

  readonly category?: EDCSessionCategory;

  readonly deliveryMode?: EDCSessionDeliveryMode;

  readonly facilitationMode?: EDCSessionFacilitationMode;

  readonly priority?: EDCSessionPriority;

  readonly urgency?: EDCSessionUrgency;

  readonly outcome?: EDCSessionOutcome;

  readonly schedule?: EDCSessionSchedule | null;

  readonly objectives?:
    readonly EDCSessionObjective[];

  readonly agenda?:
    readonly EDCSessionAgendaItem[];

  readonly participants?:
    readonly EDCSessionParticipant[];

  readonly resources?:
    readonly EDCSessionResource[];
}

/* ================================================================
 * Schedule Session DTO
 * ================================================================ */

export interface ScheduleEDCSessionDTO {
  readonly scheduledStartAt: ISODateString;

  readonly scheduledEndAt: ISODateString;

  readonly timezone: string;

  readonly deliveryMode:
    EDCSessionDeliveryMode;

  readonly location?: string | null;

  readonly meetingUrl?: string | null;

  readonly sendConfirmation: boolean;

  readonly reminderMinutesBefore?:
    readonly number[];
}

/* ================================================================
 * Start Session DTO
 * ================================================================ */

export interface StartEDCSessionDTO {
  readonly startedBy: UUID;

  readonly actualStartAt: ISODateString;

  readonly participantAttendance?:
    readonly Pick<
      EDCSessionParticipant,
      "id" | "attendanceStatus" | "joinedAt"
    >[];
}

/* ================================================================
 * Complete Session DTO
 * ================================================================ */

export interface CompleteEDCSessionDTO {
  readonly completedBy: UUID;

  readonly actualEndAt: ISODateString;

  readonly outcome: EDCSessionOutcome;

  readonly objectiveUpdates:
    readonly EDCSessionObjective[];

  readonly agendaUpdates:
    readonly EDCSessionAgendaItem[];

  readonly decisions?:
    readonly EDCSessionDecision[];

  readonly assignments?:
    readonly EDCSessionAssignment[];

  readonly followUpRequirements?:
    readonly EDCSessionFollowUpRequirement[];

  readonly completionNotes?: string | null;
}

/* ================================================================
 * Cancel Session DTO
 * ================================================================ */

export interface CancelEDCSessionDTO {
  readonly cancelledBy: UUID;

  readonly reason: string;

  readonly cancelledAt: ISODateString;

  readonly createReplacementSession: boolean;

  readonly followUpRequired: boolean;
}

/* ================================================================
 * Reschedule Session DTO
 * ================================================================ */

export interface RescheduleEDCSessionDTO {
  readonly requestedBy: UUID;

  readonly newStartAt: ISODateString;

  readonly newEndAt: ISODateString;

  readonly timezone: string;

  readonly reason: string;

  readonly notifyParticipants: boolean;
}

/* ================================================================
 * Add Session Participant DTO
 * ================================================================ */

export interface AddEDCSessionParticipantDTO {
  readonly userId?: UUID | null;

  readonly name: string;

  readonly email?: string | null;

  readonly phone?: string | null;

  readonly role: EDCSessionParticipantRole;

  readonly required: boolean;

  readonly sendInvitation: boolean;
}

/* ================================================================
 * Add Session Decision DTO
 * ================================================================ */

export interface AddEDCSessionDecisionDTO {
  readonly type: EDCSessionDecisionType;

  readonly title: string;

  readonly description: string;

  readonly reason: string;

  readonly decidedBy: UUID;

  readonly relatedEntityId?: UUID | null;

  readonly requiresImplementation: boolean;

  readonly implementationDueAt?: ISODateString | null;
}

/* ================================================================
 * Add Session Assignment DTO
 * ================================================================ */

export interface AddEDCSessionAssignmentDTO {
  readonly title: string;

  readonly description: string;

  readonly assignedTo: UUID;

  readonly assignedBy: UUID;

  readonly relatedActivityId?: UUID | null;

  readonly relatedMilestoneId?: UUID | null;

  readonly priority: EDCSessionPriority;

  readonly required: boolean;

  readonly instructions:
    readonly string[];

  readonly dueAt?: ISODateString | null;
}

/* ================================================================
 * Session Search Filter
 * ================================================================ */

export interface EDCSessionSearchFilter {
  readonly entrepreneurId?: UUID;

  readonly coachId?: UUID;

  readonly developmentPlanId?: UUID;

  readonly milestoneId?: UUID;

  readonly interviewId?: UUID;

  readonly assessmentId?: UUID;

  readonly status?: EDCSessionStatus;

  readonly statuses?:
    readonly EDCSessionStatus[];

  readonly type?: EDCSessionType;

  readonly types?:
    readonly EDCSessionType[];

  readonly category?: EDCSessionCategory;

  readonly priority?: EDCSessionPriority;

  readonly urgency?: EDCSessionUrgency;

  readonly deliveryMode?: EDCSessionDeliveryMode;

  readonly facilitationMode?:
    EDCSessionFacilitationMode;

  readonly outcome?: EDCSessionOutcome;

  readonly scheduledAfter?: ISODateString;

  readonly scheduledBefore?: ISODateString;

  readonly createdAfter?: ISODateString;

  readonly createdBefore?: ISODateString;

  readonly requiresFollowUp?: boolean;

  readonly hasDetectedRisk?: boolean;

  readonly keyword?: string;
}

/* ================================================================
 * Session Sort Field
 * ================================================================ */

export type EDCSessionSortField =
  | "createdAt"
  | "updatedAt"
  | "scheduledStartAt"
  | "completedAt"
  | "priority"
  | "status"
  | "type";

/* ================================================================
 * Session Sort
 * ================================================================ */

export interface EDCSessionSort {
  readonly field: EDCSessionSortField;

  readonly direction:
    | "ASC"
    | "DESC";
}

/* ================================================================
 * Session Pagination
 * ================================================================ */

export interface EDCSessionPagination {
  readonly page: number;

  readonly pageSize: number;
}

/* ================================================================
 * Session Search Request
 * ================================================================ */

export interface EDCSessionSearchRequest {
  readonly filter?: EDCSessionSearchFilter;

  readonly sort?: EDCSessionSort;

  readonly pagination?: EDCSessionPagination;
}

/* ================================================================
 * Session Search Result
 * ================================================================ */

export interface EDCSessionSearchResult {
  readonly sessions:
    readonly EDCSessionSnapshot[];

  readonly total: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;
}

/* ================================================================
 * Session Dashboard Summary
 * ================================================================ */

export interface EDCSessionDashboardSummary {
  readonly totalSessions: number;

  readonly draft: number;

  readonly scheduled: number;

  readonly confirmed: number;

  readonly inProgress: number;

  readonly completed: number;

  readonly followUpRequired: number;

  readonly missed: number;

  readonly cancelled: number;

  readonly overdueFollowUps: number;

  readonly highRiskSessions: number;

  readonly averageAttendanceRate: number;

  readonly averageEngagementScore: number;

  readonly averageOutcomeScore: number;

  readonly averageDurationMinutes: number;
}

/* ================================================================
 * Coach Session Dashboard
 * ================================================================ */

export interface EDCCoachSessionDashboard {
  readonly coachId: UUID;

  readonly upcomingSessions:
    readonly EDCSessionSnapshot[];

  readonly sessionsToday:
    readonly EDCSessionSnapshot[];

  readonly sessionsRequiringPreparation:
    readonly EDCSessionSnapshot[];

  readonly sessionsRequiringFollowUp:
    readonly EDCSessionSnapshot[];

  readonly missedSessions:
    readonly EDCSessionSnapshot[];

  readonly highRiskSessions:
    readonly EDCSessionSnapshot[];

  readonly completedThisWeek: number;

  readonly averageEngagementScore: number;

  readonly averageQualityScore: number;
}

/* ================================================================
 * Entrepreneur Session Dashboard
 * ================================================================ */

export interface EDCEntrepreneurSessionDashboard {
  readonly entrepreneurId: UUID;

  readonly nextSession?:
    EDCSessionSnapshot | null;

  readonly upcomingSessions:
    readonly EDCSessionSnapshot[];

  readonly completedSessions:
    readonly EDCSessionSnapshot[];

  readonly pendingAssignments:
    readonly EDCSessionAssignment[];

  readonly overdueAssignments:
    readonly EDCSessionAssignment[];

  readonly followUpRequirements:
    readonly EDCSessionFollowUpRequirement[];

  readonly totalSessionsCompleted: number;

  readonly attendanceRate: number;

  readonly averageEngagementScore: number;
}

/* ================================================================
 * Session Timeline Entry
 * ================================================================ */

export interface EDCSessionTimelineEntry {
  readonly sessionId: UUID;

  readonly title: string;

  readonly type: EDCSessionType;

  readonly category: EDCSessionCategory;

  readonly status: EDCSessionStatus;

  readonly deliveryMode:
    EDCSessionDeliveryMode;

  readonly scheduledStartAt?: ISODateString | null;

  readonly actualStartAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly outcome?: EDCSessionOutcome | null;

  readonly summary?: string | null;
}

/* ================================================================
 * Session Statistics
 * ================================================================ */

export interface EDCSessionStatistics {
  readonly total: number;

  readonly byStatus:
    Record<EDCSessionStatus, number>;

  readonly byType:
    Partial<Record<EDCSessionType, number>>;

  readonly byCategory:
    Partial<Record<EDCSessionCategory, number>>;

  readonly byDeliveryMode:
    Partial<Record<EDCSessionDeliveryMode, number>>;

  readonly byFacilitationMode:
    Partial<
      Record<EDCSessionFacilitationMode, number>
    >;

  readonly byOutcome:
    Partial<Record<EDCSessionOutcome, number>>;

  readonly completionRate: number;

  readonly cancellationRate: number;

  readonly missedSessionRate: number;

  readonly followUpRate: number;

  readonly averageDurationMinutes: number;

  readonly averageAttendanceRate: number;

  readonly averageEngagementScore: number;

  readonly averageOutcomeScore: number;

  readonly averageQualityScore: number;
}

/* ================================================================
 * Session Performance Trend
 * ================================================================ */

export interface EDCSessionPerformanceTrend {
  readonly periodStart: ISODateString;

  readonly periodEnd: ISODateString;

  readonly sessionsScheduled: number;

  readonly sessionsCompleted: number;

  readonly sessionsMissed: number;

  readonly averageEngagementScore: number;

  readonly averageOutcomeScore: number;

  readonly averageReadinessImpact: number;

  readonly trend:
    | "DECLINING"
    | "STABLE"
    | "IMPROVING";
}

/* ================================================================
 * Archive Session DTO
 * ================================================================ */

export interface ArchiveEDCSessionDTO {
  readonly archivedBy: UUID;

  readonly reason: string;

  readonly archivedAt: ISODateString;
}

/* ================================================================
 * Restore Session DTO
 * ================================================================ */

export interface RestoreEDCSessionDTO {
  readonly restoredBy: UUID;

  readonly restoredAt: ISODateString;

  readonly reason?: string | null;
}

/* ================================================================
 * Session Snapshot
 * ================================================================ */

export interface EDCSessionSnapshot {
  readonly id: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly title: string;

  readonly type: EDCSessionType;

  readonly category: EDCSessionCategory;

  readonly status: EDCSessionStatus;

  readonly priority: EDCSessionPriority;

  readonly deliveryMode:
    EDCSessionDeliveryMode;

  readonly facilitationMode:
    EDCSessionFacilitationMode;

  readonly scheduledStartAt?: ISODateString | null;

  readonly scheduledEndAt?: ISODateString | null;

  readonly outcome?: EDCSessionOutcome | null;

  readonly followUpRequired: boolean;

  readonly riskLevel?: EDCSessionRiskLevel | null;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Session Calendar Event
 * ================================================================ */

export interface EDCSessionCalendarEvent {
  readonly sessionId: UUID;

  readonly title: string;

  readonly startAt: ISODateString;

  readonly endAt: ISODateString;

  readonly timezone: string;

  readonly status: EDCSessionStatus;

  readonly deliveryMode:
    EDCSessionDeliveryMode;

  readonly location?: string | null;

  readonly meetingUrl?: string | null;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;
}

/* ================================================================
 * Session Queue Item
 * ================================================================ */

export interface EDCSessionQueueItem {
  readonly sessionId: UUID;

  readonly entrepreneurId: UUID;

  readonly coachId?: UUID | null;

  readonly title: string;

  readonly type: EDCSessionType;

  readonly priority: EDCSessionPriority;

  readonly urgency: EDCSessionUrgency;

  readonly status: EDCSessionStatus;

  readonly scheduledStartAt?: ISODateString | null;

  readonly waitingSince?: ISODateString | null;

  readonly requiresHumanReview: boolean;

  readonly escalationReason?: string | null;
}

/* ================================================================
 * Session Profile Response
 * ================================================================ */

export interface EDCSessionProfileResponse {
  readonly session: EDCSession;

  readonly relatedSessions:
    readonly EDCSessionSnapshot[];

  readonly relatedMilestoneIds:
    readonly UUID[];

  readonly relatedActivityIds:
    readonly UUID[];

  readonly relatedReflectionIds:
    readonly UUID[];

  readonly relatedRecommendationIds:
    readonly UUID[];
}