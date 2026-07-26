/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * workflow.ts
 *
 * Enterprise Workflow Engine
 *
 * Purpose
 * -------
 * Defines enterprise workflow orchestration.
 *
 * No business logic.
 * Domain models only.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Workflow Status
 * ================================================================ */

export enum EDCWorkflowStatus {
  DRAFT = "DRAFT",

  PENDING = "PENDING",

  READY = "READY",

  ACTIVE = "ACTIVE",

  WAITING = "WAITING",

  PAUSED = "PAUSED",

  BLOCKED = "BLOCKED",

  ESCALATED = "ESCALATED",

  APPROVED = "APPROVED",

  REJECTED = "REJECTED",

  COMPLETED = "COMPLETED",

  CANCELLED = "CANCELLED",

  FAILED = "FAILED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Workflow Type
 * ================================================================ */

export enum EDCWorkflowType {
  ENTREPRENEUR_ONBOARDING = "ENTREPRENEUR_ONBOARDING",

  COACH_ASSIGNMENT = "COACH_ASSIGNMENT",

  INTERVIEW = "INTERVIEW",

  READINESS = "READINESS",

  ASSESSMENT = "ASSESSMENT",

  DEVELOPMENT_PLAN = "DEVELOPMENT_PLAN",

  SESSION = "SESSION",

  ACTIVITY = "ACTIVITY",

  REFLECTION = "REFLECTION",

  RECOMMENDATION = "RECOMMENDATION",

  MILESTONE = "MILESTONE",

  BUSINESS_PLAN = "BUSINESS_PLAN",

  FUNDING_READINESS = "FUNDING_READINESS",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  COMPLIANCE = "COMPLIANCE",

  PERFORMANCE_REVIEW = "PERFORMANCE_REVIEW",

  ESCALATION = "ESCALATION",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Workflow Priority
 * ================================================================ */

export enum EDCWorkflowPriority {
  LOW = "LOW",

  NORMAL = "NORMAL",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",

  EMERGENCY = "EMERGENCY"
}

/* ================================================================
 * Workflow Trigger
 * ================================================================ */

export enum EDCWorkflowTrigger {
  MANUAL = "MANUAL",

  SYSTEM = "SYSTEM",

  AI = "AI",

  SCHEDULE = "SCHEDULE",

  EVENT = "EVENT",

  API = "API",

  WEBHOOK = "WEBHOOK",

  TIMEOUT = "TIMEOUT"
}

/* ================================================================
 * Workflow Step Status
 * ================================================================ */

export enum EDCWorkflowStepStatus {
  NOT_STARTED = "NOT_STARTED",

  READY = "READY",

  ACTIVE = "ACTIVE",

  WAITING = "WAITING",

  COMPLETED = "COMPLETED",

  SKIPPED = "SKIPPED",

  FAILED = "FAILED",

  BLOCKED = "BLOCKED",

  CANCELLED = "CANCELLED"
}

/* ================================================================
 * Workflow Step Type
 * ================================================================ */

export enum EDCWorkflowStepType {
  INTERVIEW = "INTERVIEW",

  REVIEW = "REVIEW",

  APPROVAL = "APPROVAL",

  AI_ANALYSIS = "AI_ANALYSIS",

  READINESS_UPDATE = "READINESS_UPDATE",

  ASSESSMENT = "ASSESSMENT",

  SESSION = "SESSION",

  ACTIVITY = "ACTIVITY",

  MILESTONE = "MILESTONE",

  REFLECTION = "REFLECTION",

  RECOMMENDATION = "RECOMMENDATION",

  NOTIFICATION = "NOTIFICATION",

  DOCUMENT_COLLECTION = "DOCUMENT_COLLECTION",

  BUSINESS_PROCESS = "BUSINESS_PROCESS",

  COMPLIANCE = "COMPLIANCE",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Approval Requirement
 * ================================================================ */

export enum EDCApprovalRequirement {
  NONE = "NONE",

  AI = "AI",

  COACH = "COACH",

  ADMINISTRATOR = "ADMINISTRATOR",

  COMPLIANCE = "COMPLIANCE",

  FUNDING_COMMITTEE = "FUNDING_COMMITTEE",

  MULTI_LEVEL = "MULTI_LEVEL"
}

/* ================================================================
 * Escalation Level
 * ================================================================ */

export enum EDCEscalationLevel {
  NONE = "NONE",

  LEVEL_1 = "LEVEL_1",

  LEVEL_2 = "LEVEL_2",

  LEVEL_3 = "LEVEL_3",

  EXECUTIVE = "EXECUTIVE"
}

/* ================================================================
 * Workflow Owner Type
 * ================================================================ */

export enum EDCWorkflowOwnerType {
  ENTREPRENEUR = "ENTREPRENEUR",

  COACH = "COACH",

  ADMINISTRATOR = "ADMINISTRATOR",

  AI = "AI",

  SYSTEM = "SYSTEM",

  PARTNER = "PARTNER"
}

/* ================================================================
 * Workflow Step
 * ================================================================ */

export interface EDCWorkflowStep {
  readonly id: UUID;

  readonly workflowId: UUID;

  readonly sequence: number;

  readonly name: string;

  readonly description: string;

  readonly type: EDCWorkflowStepType;

  readonly status: EDCWorkflowStepStatus;

  readonly required: boolean;

  readonly approvalRequirement:
    EDCApprovalRequirement;

  readonly assignedTo?: UUID | null;

  readonly dependsOn:
    readonly UUID[];

  readonly relatedEntityId?: UUID | null;

  readonly estimatedDurationHours?: number | null;

  readonly actualDurationHours?: number | null;

  readonly dueAt?: ISODateString | null;

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;
}

/* ================================================================
 * Workflow Transition
 * ================================================================ */

export interface EDCWorkflowTransition {
  readonly fromStepId: UUID;

  readonly toStepId: UUID;

  readonly automatic: boolean;

  readonly condition?: string | null;

  readonly description?: string | null;
}

/* ================================================================
 * Workflow Participant
 * ================================================================ */

export interface EDCWorkflowParticipant {
  readonly userId?: UUID | null;

  readonly role:
    EDCWorkflowOwnerType;

  readonly required: boolean;

  readonly permissions:
    readonly string[];
}

/* ================================================================
 * Workflow Dependency
 * ================================================================ */

export interface EDCWorkflowDependency {
  readonly workflowId: UUID;

  readonly dependsOnWorkflowId: UUID;

  readonly required: boolean;

  readonly description?: string | null;
}

/* ================================================================
 * Workflow Approval
 * ================================================================ */

export interface EDCWorkflowApproval {
  readonly id: UUID;

  readonly stepId: UUID;

  readonly requirement:
    EDCApprovalRequirement;

  readonly approved: boolean;

  readonly approvedBy?: UUID | null;

  readonly comments?: string | null;

  readonly approvedAt?: ISODateString | null;
}

/* ================================================================
 * Workflow Escalation
 * ================================================================ */

export interface EDCWorkflowEscalation {
  readonly id: UUID;

  readonly level:
    EDCEscalationLevel;

  readonly reason: string;

  readonly assignedTo?: UUID | null;

  readonly openedAt: ISODateString;

  readonly resolvedAt?: ISODateString | null;

  readonly resolution?: string | null;
}

/* ================================================================
 * Workflow Notification
 * ================================================================ */

export interface EDCWorkflowNotification {
  readonly id: UUID;

  readonly recipientId: UUID;

  readonly channel:
    | "EMAIL"
    | "SMS"
    | "WHATSAPP"
    | "IN_APP";

  readonly subject: string;

  readonly message: string;

  readonly sent: boolean;

  readonly sentAt?: ISODateString | null;
}
/* ================================================================
 * Workflow SLA
 * ================================================================ */

export interface EDCWorkflowSLA {
  readonly targetHours: number;

  readonly warningHours: number;

  readonly escalationHours: number;

  readonly automaticProcessingHours: number;

  readonly breachAt?: ISODateString | null;

  readonly breached: boolean;
}

/* ================================================================
 * AI Workflow Decision
 * ================================================================ */

export interface EDCAIWorkflowDecision {
  readonly decisionId: UUID;

  readonly decision: string;

  readonly reasoning: string;

  readonly confidence: number;

  readonly recommendedAction: string;

  readonly requiresHumanApproval: boolean;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Workflow Recommendation
 * ================================================================ */

export interface EDCWorkflowRecommendation {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly priority: EDCWorkflowPriority;

  readonly expectedBenefit: string;

  readonly estimatedHoursSaved?: number | null;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Workflow Bottleneck
 * ================================================================ */

export interface EDCWorkflowBottleneck {
  readonly stepId: UUID;

  readonly workflowId: UUID;

  readonly reason: string;

  readonly durationHours: number;

  readonly severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly recommendedResolution: string;

  readonly detectedAt: ISODateString;
}

/* ================================================================
 * Workflow Delay Risk
 * ================================================================ */

export interface EDCWorkflowDelayRisk {
  readonly probability: number;

  readonly estimatedDelayHours: number;

  readonly causes:
    readonly string[];

  readonly mitigationActions:
    readonly string[];

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Workflow Completion Forecast
 * ================================================================ */

export interface EDCWorkflowCompletionForecast {
  readonly estimatedCompletionAt:
    ISODateString;

  readonly completionProbability: number;

  readonly confidence: number;

  readonly blockers:
    readonly string[];

  readonly assumptions:
    readonly string[];

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Workflow Routing Recommendation
 * ================================================================ */

export interface EDCWorkflowRoutingRecommendation {
  readonly nextOwnerType:
    EDCWorkflowOwnerType;

  readonly nextOwnerId?: UUID | null;

  readonly reason: string;

  readonly automaticAssignment: boolean;

  readonly confidence: number;
}

/* ================================================================
 * Workflow Automation
 * ================================================================ */

export interface EDCWorkflowAutomation {
  readonly enabled: boolean;

  readonly automaticStepAdvancement: boolean;

  readonly automaticNotifications: boolean;

  readonly automaticEscalation: boolean;

  readonly automaticApproval: boolean;

  readonly automaticProcessing: boolean;

  readonly automationRuleIds:
    readonly UUID[];
}

/* ================================================================
 * Workflow Automation Execution
 * ================================================================ */

export interface EDCWorkflowAutomationExecution {
  readonly id: UUID;

  readonly workflowId: UUID;

  readonly ruleId: UUID;

  readonly action: string;

  readonly successful: boolean;

  readonly message?: string | null;

  readonly executedAt: ISODateString;
}

/* ================================================================
 * Workflow Performance
 * ================================================================ */

export interface EDCWorkflowPerformance {
  readonly averageCompletionHours: number;

  readonly averageWaitingHours: number;

  readonly averageApprovalHours: number;

  readonly completionRate: number;

  readonly failureRate: number;

  readonly automationRate: number;

  readonly escalationRate: number;

  readonly slaComplianceRate: number;
}

/* ================================================================
 * Workflow Health
 * ================================================================ */

export interface EDCWorkflowHealth {
  readonly overallScore: number;

  readonly workflowHealth:
    | "EXCELLENT"
    | "GOOD"
    | "FAIR"
    | "POOR"
    | "CRITICAL";

  readonly issues:
    readonly string[];

  readonly strengths:
    readonly string[];

  readonly recommendations:
    readonly string[];

  readonly analyzedAt: ISODateString;
}

/* ================================================================
 * Workflow Activity Summary
 * ================================================================ */

export interface EDCWorkflowActivitySummary {
  readonly activeSteps: number;

  readonly completedSteps: number;

  readonly blockedSteps: number;

  readonly waitingSteps: number;

  readonly overdueSteps: number;

  readonly escalatedSteps: number;

  readonly automaticActions: number;
}

/* ================================================================
 * Workflow AI Summary
 * ================================================================ */

export interface EDCAIWorkflowSummary {
  readonly executiveSummary: string;

  readonly currentState: string;

  readonly nextCriticalAction: string;

  readonly highestRisk: string;

  readonly predictedOutcome: string;

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Workflow Intelligence
 * ================================================================ */

export interface EDCWorkflowIntelligence {
  readonly sla?:
    EDCWorkflowSLA | null;

  readonly aiDecision?:
    EDCAIWorkflowDecision | null;

  readonly recommendations:
    readonly EDCWorkflowRecommendation[];

  readonly bottlenecks:
    readonly EDCWorkflowBottleneck[];

  readonly delayRisk?:
    EDCWorkflowDelayRisk | null;

  readonly completionForecast?:
    EDCWorkflowCompletionForecast | null;

  readonly routingRecommendation?:
    EDCWorkflowRoutingRecommendation | null;

  readonly automation?:
    EDCWorkflowAutomation | null;

  readonly automationExecutions:
    readonly EDCWorkflowAutomationExecution[];

  readonly performance?:
    EDCWorkflowPerformance | null;

  readonly health?:
    EDCWorkflowHealth | null;

  readonly activitySummary?:
    EDCWorkflowActivitySummary | null;

  readonly aiSummary?:
    EDCAIWorkflowSummary | null;

  readonly generatedAt: ISODateString;
}
/* ================================================================
 * Workflow Template Status
 * ================================================================ */

export enum EDCWorkflowTemplateStatus {
  DRAFT = "DRAFT",

  ACTIVE = "ACTIVE",

  INACTIVE = "INACTIVE",

  DEPRECATED = "DEPRECATED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Workflow Execution Status
 * ================================================================ */

export enum EDCWorkflowExecutionStatus {
  PENDING = "PENDING",

  RUNNING = "RUNNING",

  WAITING = "WAITING",

  SUCCEEDED = "SUCCEEDED",

  PARTIALLY_SUCCEEDED = "PARTIALLY_SUCCEEDED",

  FAILED = "FAILED",

  CANCELLED = "CANCELLED",

  TIMED_OUT = "TIMED_OUT"
}

/* ================================================================
 * Workflow Action Type
 * ================================================================ */

export enum EDCWorkflowActionType {
  CREATE_ENTITY = "CREATE_ENTITY",

  UPDATE_ENTITY = "UPDATE_ENTITY",

  ASSIGN_OWNER = "ASSIGN_OWNER",

  REQUEST_APPROVAL = "REQUEST_APPROVAL",

  APPROVE = "APPROVE",

  REJECT = "REJECT",

  SEND_NOTIFICATION = "SEND_NOTIFICATION",

  CREATE_SESSION = "CREATE_SESSION",

  CREATE_ACTIVITY = "CREATE_ACTIVITY",

  CREATE_MILESTONE = "CREATE_MILESTONE",

  CREATE_RECOMMENDATION = "CREATE_RECOMMENDATION",

  UPDATE_READINESS = "UPDATE_READINESS",

  ADVANCE_STAGE = "ADVANCE_STAGE",

  ESCALATE = "ESCALATE",

  PAUSE = "PAUSE",

  RESUME = "RESUME",

  COMPLETE = "COMPLETE",

  ARCHIVE = "ARCHIVE",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Workflow Condition Operator
 * ================================================================ */

export enum EDCWorkflowConditionOperator {
  EQUALS = "EQUALS",

  NOT_EQUALS = "NOT_EQUALS",

  GREATER_THAN = "GREATER_THAN",

  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",

  LESS_THAN = "LESS_THAN",

  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",

  CONTAINS = "CONTAINS",

  NOT_CONTAINS = "NOT_CONTAINS",

  IN = "IN",

  NOT_IN = "NOT_IN",

  EXISTS = "EXISTS",

  NOT_EXISTS = "NOT_EXISTS"
}

/* ================================================================
 * Workflow Logical Operator
 * ================================================================ */

export enum EDCWorkflowLogicalOperator {
  AND = "AND",

  OR = "OR"
}

/* ================================================================
 * Workflow Audit Action
 * ================================================================ */

export enum EDCWorkflowAuditAction {
  CREATED = "CREATED",

  UPDATED = "UPDATED",

  STARTED = "STARTED",

  STEP_STARTED = "STEP_STARTED",

  STEP_COMPLETED = "STEP_COMPLETED",

  STEP_SKIPPED = "STEP_SKIPPED",

  STEP_FAILED = "STEP_FAILED",

  OWNER_ASSIGNED = "OWNER_ASSIGNED",

  APPROVAL_REQUESTED = "APPROVAL_REQUESTED",

  APPROVED = "APPROVED",

  REJECTED = "REJECTED",

  PAUSED = "PAUSED",

  RESUMED = "RESUMED",

  BLOCKED = "BLOCKED",

  UNBLOCKED = "UNBLOCKED",

  ESCALATED = "ESCALATED",

  AUTO_PROCESSED = "AUTO_PROCESSED",

  COMPLETED = "COMPLETED",

  CANCELLED = "CANCELLED",

  FAILED = "FAILED",

  ARCHIVED = "ARCHIVED",

  RESTORED = "RESTORED"
}

/* ================================================================
 * Workflow Condition
 * ================================================================ */

export interface EDCWorkflowCondition {
  readonly id: UUID;

  readonly field: string;

  readonly operator: EDCWorkflowConditionOperator;

  readonly value?: unknown;

  readonly logicalOperator?: EDCWorkflowLogicalOperator | null;

  readonly description?: string | null;
}

/* ================================================================
 * Workflow Action
 * ================================================================ */

export interface EDCWorkflowAction {
  readonly id: UUID;

  readonly type: EDCWorkflowActionType;

  readonly name: string;

  readonly description?: string | null;

  readonly order: number;

  readonly automatic: boolean;

  readonly requiresApproval: boolean;

  readonly approvalRequirement:
    EDCApprovalRequirement;

  readonly conditions:
    readonly EDCWorkflowCondition[];

  readonly parameters:
    Readonly<Record<string, unknown>>;

  readonly retryLimit?: number | null;

  readonly timeoutMinutes?: number | null;
}

/* ================================================================
 * Workflow Step Template
 * ================================================================ */

export interface EDCWorkflowStepTemplate {
  readonly id: UUID;

  readonly sequence: number;

  readonly name: string;

  readonly description: string;

  readonly type: EDCWorkflowStepType;

  readonly required: boolean;

  readonly skippable: boolean;

  readonly approvalRequirement:
    EDCApprovalRequirement;

  readonly defaultOwnerType:
    EDCWorkflowOwnerType;

  readonly estimatedDurationHours?: number | null;

  readonly dueWithinHours?: number | null;

  readonly automaticProcessingHours?: number | null;

  readonly dependsOnStepTemplateIds:
    readonly UUID[];

  readonly entryConditions:
    readonly EDCWorkflowCondition[];

  readonly completionConditions:
    readonly EDCWorkflowCondition[];

  readonly actions:
    readonly EDCWorkflowAction[];

  readonly escalationLevel:
    EDCEscalationLevel;

  readonly metadata?:
    Readonly<Record<string, unknown>> | null;
}

/* ================================================================
 * Workflow Template
 * ================================================================ */

export interface EDCWorkflowTemplate {
  readonly id: UUID;

  readonly name: string;

  readonly description: string;

  readonly code: string;

  readonly version: string;

  readonly type: EDCWorkflowType;

  readonly status:
    EDCWorkflowTemplateStatus;

  readonly priority:
    EDCWorkflowPriority;

  readonly trigger:
    EDCWorkflowTrigger;

  readonly steps:
    readonly EDCWorkflowStepTemplate[];

  readonly defaultParticipants:
    readonly EDCWorkflowParticipant[];

  readonly defaultSLA?:
    EDCWorkflowSLA | null;

  readonly automation:
    EDCWorkflowAutomation;

  readonly tags:
    readonly string[];

  readonly effectiveFrom?: ISODateString | null;

  readonly effectiveUntil?: ISODateString | null;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID | null;
}

/* ================================================================
 * Workflow Context
 * ================================================================ */

export interface EDCWorkflowContext {
  readonly entrepreneurId?: UUID | null;

  readonly coachId?: UUID | null;

  readonly businessId?: UUID | null;

  readonly interviewId?: UUID | null;

  readonly readinessId?: UUID | null;

  readonly assessmentId?: UUID | null;

  readonly developmentPlanId?: UUID | null;

  readonly sessionId?: UUID | null;

  readonly activityId?: UUID | null;

  readonly reflectionId?: UUID | null;

  readonly recommendationId?: UUID | null;

  readonly milestoneId?: UUID | null;

  readonly fundingApplicationId?: UUID | null;

  readonly relatedEntityIds:
    readonly UUID[];

  readonly variables:
    Readonly<Record<string, unknown>>;
}

/* ================================================================
 * Workflow Step Execution
 * ================================================================ */

export interface EDCWorkflowStepExecution {
  readonly id: UUID;

  readonly workflowId: UUID;

  readonly stepId: UUID;

  readonly stepTemplateId?: UUID | null;

  readonly executionNumber: number;

  readonly status:
    EDCWorkflowExecutionStatus;

  readonly assignedOwnerType:
    EDCWorkflowOwnerType;

  readonly assignedOwnerId?: UUID | null;

  readonly input?:
    Readonly<Record<string, unknown>> | null;

  readonly output?:
    Readonly<Record<string, unknown>> | null;

  readonly actions:
    readonly EDCWorkflowActionExecution[];

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly failedAt?: ISODateString | null;

  readonly failureCode?: string | null;

  readonly failureMessage?: string | null;

  readonly retryCount: number;

  readonly createdAt: ISODateString;
}

/* ================================================================
 * Workflow Action Execution
 * ================================================================ */

export interface EDCWorkflowActionExecution {
  readonly id: UUID;

  readonly workflowId: UUID;

  readonly stepExecutionId: UUID;

  readonly actionId: UUID;

  readonly actionType:
    EDCWorkflowActionType;

  readonly status:
    EDCWorkflowExecutionStatus;

  readonly automatic: boolean;

  readonly input?:
    Readonly<Record<string, unknown>> | null;

  readonly output?:
    Readonly<Record<string, unknown>> | null;

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly failureMessage?: string | null;
}

/* ================================================================
 * Workflow History Entry
 * ================================================================ */

export interface EDCWorkflowHistoryEntry {
  readonly id: UUID;

  readonly workflowId: UUID;

  readonly stepId?: UUID | null;

  readonly action:
    EDCWorkflowAuditAction;

  readonly actorId?: UUID | null;

  readonly actorType:
    EDCWorkflowOwnerType;

  readonly description: string;

  readonly previousStatus?:
    EDCWorkflowStatus | EDCWorkflowStepStatus | null;

  readonly newStatus?:
    EDCWorkflowStatus | EDCWorkflowStepStatus | null;

  readonly previousValue?: unknown;

  readonly newValue?: unknown;

  readonly metadata?:
    Readonly<Record<string, unknown>> | null;

  readonly occurredAt: ISODateString;
}

/* ================================================================
 * Workflow Master Aggregate
 * ================================================================ */

export interface EDCWorkflow {
  readonly id: UUID;

  readonly templateId?: UUID | null;

  readonly templateVersion?: string | null;

  readonly code: string;

  readonly name: string;

  readonly description: string;

  readonly type:
    EDCWorkflowType;

  readonly status:
    EDCWorkflowStatus;

  readonly priority:
    EDCWorkflowPriority;

  readonly trigger:
    EDCWorkflowTrigger;

  readonly context:
    EDCWorkflowContext;

  readonly ownerType:
    EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly participants:
    readonly EDCWorkflowParticipant[];

  readonly steps:
    readonly EDCWorkflowStep[];

  readonly transitions:
    readonly EDCWorkflowTransition[];

  readonly dependencies:
    readonly EDCWorkflowDependency[];

  readonly approvals:
    readonly EDCWorkflowApproval[];

  readonly escalations:
    readonly EDCWorkflowEscalation[];

  readonly notifications:
    readonly EDCWorkflowNotification[];

  readonly stepExecutions:
    readonly EDCWorkflowStepExecution[];

  readonly history:
    readonly EDCWorkflowHistoryEntry[];

  readonly intelligence?:
    EDCWorkflowIntelligence | null;

  readonly currentStepId?: UUID | null;

  readonly progressPercentage: number;

  readonly startedAt?: ISODateString | null;

  readonly dueAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly cancelledAt?: ISODateString | null;

  readonly failedAt?: ISODateString | null;

  readonly failureReason?: string | null;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedBy?: UUID | null;

  readonly archivedAt?: ISODateString | null;
}

/* ================================================================
 * Create Workflow Template DTO
 * ================================================================ */

export interface CreateEDCWorkflowTemplateDTO {
  readonly name: string;

  readonly description: string;

  readonly code: string;

  readonly version: string;

  readonly type: EDCWorkflowType;

  readonly priority?: EDCWorkflowPriority;

  readonly trigger: EDCWorkflowTrigger;

  readonly steps:
    readonly EDCWorkflowStepTemplate[];

  readonly defaultParticipants?:
    readonly EDCWorkflowParticipant[];

  readonly defaultSLA?: EDCWorkflowSLA | null;

  readonly automation:
    EDCWorkflowAutomation;

  readonly tags?: readonly string[];

  readonly effectiveFrom?: ISODateString | null;

  readonly effectiveUntil?: ISODateString | null;
}

/* ================================================================
 * Update Workflow Template DTO
 * ================================================================ */

export interface UpdateEDCWorkflowTemplateDTO {
  readonly name?: string;

  readonly description?: string;

  readonly status?: EDCWorkflowTemplateStatus;

  readonly priority?: EDCWorkflowPriority;

  readonly trigger?: EDCWorkflowTrigger;

  readonly steps?:
    readonly EDCWorkflowStepTemplate[];

  readonly defaultParticipants?:
    readonly EDCWorkflowParticipant[];

  readonly defaultSLA?: EDCWorkflowSLA | null;

  readonly automation?: EDCWorkflowAutomation;

  readonly tags?: readonly string[];

  readonly effectiveFrom?: ISODateString | null;

  readonly effectiveUntil?: ISODateString | null;
}

/* ================================================================
 * Create Workflow DTO
 * ================================================================ */

export interface CreateEDCWorkflowDTO {
  readonly templateId?: UUID | null;

  readonly code: string;

  readonly name: string;

  readonly description: string;

  readonly type:
    EDCWorkflowType;

  readonly priority?: EDCWorkflowPriority;

  readonly trigger:
    EDCWorkflowTrigger;

  readonly context:
    EDCWorkflowContext;

  readonly ownerType:
    EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly participants?:
    readonly EDCWorkflowParticipant[];

  readonly dueAt?: ISODateString | null;

  readonly startImmediately: boolean;
}

/* ================================================================
 * Update Workflow DTO
 * ================================================================ */

export interface UpdateEDCWorkflowDTO {
  readonly name?: string;

  readonly description?: string;

  readonly status?: EDCWorkflowStatus;

  readonly priority?: EDCWorkflowPriority;

  readonly ownerType?: EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly participants?:
    readonly EDCWorkflowParticipant[];

  readonly dueAt?: ISODateString | null;

  readonly context?:
    EDCWorkflowContext;
}

/* ================================================================
 * Start Workflow DTO
 * ================================================================ */

export interface StartEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly startedBy?: UUID | null;

  readonly startedByType:
    EDCWorkflowOwnerType;

  readonly startedAt: ISODateString;

  readonly initialVariables?:
    Readonly<Record<string, unknown>> | null;
}

/* ================================================================
 * Advance Workflow DTO
 * ================================================================ */

export interface AdvanceEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly currentStepId: UUID;

  readonly completedBy?: UUID | null;

  readonly completedByType:
    EDCWorkflowOwnerType;

  readonly output?:
    Readonly<Record<string, unknown>> | null;

  readonly completionNotes?: string | null;

  readonly completedAt: ISODateString;
}

/* ================================================================
 * Execute Workflow Action DTO
 * ================================================================ */

export interface ExecuteEDCWorkflowActionDTO {
  readonly workflowId: UUID;

  readonly stepId: UUID;

  readonly actionId: UUID;

  readonly executedBy?: UUID | null;

  readonly executedByType:
    EDCWorkflowOwnerType;

  readonly input?:
    Readonly<Record<string, unknown>> | null;

  readonly executedAt: ISODateString;
}

/* ================================================================
 * Pause Workflow DTO
 * ================================================================ */

export interface PauseEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly pausedBy: UUID;

  readonly reason: string;

  readonly resumeAt?: ISODateString | null;

  readonly pausedAt: ISODateString;
}

/* ================================================================
 * Resume Workflow DTO
 * ================================================================ */

export interface ResumeEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly resumedBy: UUID;

  readonly reason?: string | null;

  readonly resumedAt: ISODateString;
}

/* ================================================================
 * Cancel Workflow DTO
 * ================================================================ */

export interface CancelEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly cancelledBy: UUID;

  readonly reason: string;

  readonly notifyParticipants: boolean;

  readonly cancelledAt: ISODateString;
}

/* ================================================================
 * Fail Workflow DTO
 * ================================================================ */

export interface FailEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly failedStepId?: UUID | null;

  readonly failureCode?: string | null;

  readonly failureReason: string;

  readonly recoverable: boolean;

  readonly failedAt: ISODateString;
}

/* ================================================================
 * Assign Workflow Owner DTO
 * ================================================================ */

export interface AssignEDCWorkflowOwnerDTO {
  readonly workflowId: UUID;

  readonly stepId?: UUID | null;

  readonly ownerType:
    EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly assignedBy?: UUID | null;

  readonly reason?: string | null;

  readonly assignedAt: ISODateString;
}

/* ================================================================
 * Submit Workflow Approval DTO
 * ================================================================ */

export interface SubmitEDCWorkflowApprovalDTO {
  readonly workflowId: UUID;

  readonly stepId: UUID;

  readonly requirement:
    EDCApprovalRequirement;

  readonly approved: boolean;

  readonly approvedBy: UUID;

  readonly comments?: string | null;

  readonly submittedAt: ISODateString;
}

/* ================================================================
 * Escalate Workflow DTO
 * ================================================================ */

export interface EscalateEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly stepId?: UUID | null;

  readonly level:
    EDCEscalationLevel;

  readonly reason: string;

  readonly assignedTo?: UUID | null;

  readonly escalatedBy?: UUID | null;

  readonly escalatedAt: ISODateString;
}

/* ================================================================
 * Resolve Workflow Escalation DTO
 * ================================================================ */

export interface ResolveEDCWorkflowEscalationDTO {
  readonly workflowId: UUID;

  readonly escalationId: UUID;

  readonly resolution: string;

  readonly resolvedBy: UUID;

  readonly resolvedAt: ISODateString;
}

/* ================================================================
 * Automatic 48-Hour Processing Request
 * ================================================================ */

export interface EDCAutomaticWorkflowProcessingRequest {
  readonly workflowId: UUID;

  readonly stepId: UUID;

  readonly pendingSince: ISODateString;

  readonly processingDeadline: ISODateString;

  readonly hoursPending: number;

  readonly humanActionDetected: boolean;

  readonly legalRestrictionDetected: boolean;

  readonly regulatoryRestrictionDetected: boolean;

  readonly governanceRestrictionDetected: boolean;

  readonly eligibleForAutomaticProcessing: boolean;

  readonly requestedAt: ISODateString;
}

/* ================================================================
 * Automatic Workflow Processing Result
 * ================================================================ */

export interface EDCAutomaticWorkflowProcessingResult {
  readonly workflowId: UUID;

  readonly stepId: UUID;

  readonly processed: boolean;

  readonly actionTaken?:
    EDCWorkflowActionType | null;

  readonly decision?:
    EDCAIWorkflowDecision | null;

  readonly previousStatus:
    EDCWorkflowStepStatus;

  readonly newStatus:
    EDCWorkflowStepStatus;

  readonly requiresHumanReview: boolean;

  readonly restrictionReason?: string | null;

  readonly failureReason?: string | null;

  readonly processedAt: ISODateString;
}

/* ================================================================
 * Workflow Queue Filter
 * ================================================================ */

export interface EDCWorkflowQueueFilter {
  readonly ownerId?: UUID;

  readonly ownerType?: EDCWorkflowOwnerType;

  readonly entrepreneurId?: UUID;

  readonly coachId?: UUID;

  readonly businessId?: UUID;

  readonly types?:
    readonly EDCWorkflowType[];

  readonly statuses?:
    readonly EDCWorkflowStatus[];

  readonly priorities?:
    readonly EDCWorkflowPriority[];

  readonly stepStatuses?:
    readonly EDCWorkflowStepStatus[];

  readonly approvalRequirements?:
    readonly EDCApprovalRequirement[];

  readonly escalationLevels?:
    readonly EDCEscalationLevel[];

  readonly overdueOnly?: boolean;

  readonly blockedOnly?: boolean;

  readonly escalatedOnly?: boolean;

  readonly pendingAutomaticProcessingOnly?: boolean;

  readonly dueAfter?: ISODateString;

  readonly dueBefore?: ISODateString;

  readonly keyword?: string;
}

/* ================================================================
 * Workflow Queue Item
 * ================================================================ */

export interface EDCWorkflowQueueItem {
  readonly workflowId: UUID;

  readonly entrepreneurId?: UUID | null;

  readonly coachId?: UUID | null;

  readonly businessId?: UUID | null;

  readonly name: string;

  readonly type:
    EDCWorkflowType;

  readonly status:
    EDCWorkflowStatus;

  readonly priority:
    EDCWorkflowPriority;

  readonly currentStepId?: UUID | null;

  readonly currentStepName?: string | null;

  readonly currentStepStatus?:
    EDCWorkflowStepStatus | null;

  readonly ownerType:
    EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly approvalRequirement?:
    EDCApprovalRequirement | null;

  readonly escalationLevel:
    EDCEscalationLevel;

  readonly progressPercentage: number;

  readonly pendingSince?: ISODateString | null;

  readonly dueAt?: ISODateString | null;

  readonly hoursPending?: number | null;

  readonly overdue: boolean;

  readonly automaticProcessingEligible: boolean;

  readonly requiresHumanReview: boolean;
}

/* ================================================================
 * Workflow Search Filter
 * ================================================================ */

export interface EDCWorkflowSearchFilter {
  readonly workflowId?: UUID;

  readonly templateId?: UUID;

  readonly entrepreneurId?: UUID;

  readonly coachId?: UUID;

  readonly businessId?: UUID;

  readonly ownerId?: UUID;

  readonly ownerType?: EDCWorkflowOwnerType;

  readonly types?:
    readonly EDCWorkflowType[];

  readonly statuses?:
    readonly EDCWorkflowStatus[];

  readonly priorities?:
    readonly EDCWorkflowPriority[];

  readonly triggers?:
    readonly EDCWorkflowTrigger[];

  readonly escalationLevels?:
    readonly EDCEscalationLevel[];

  readonly approvalRequirements?:
    readonly EDCApprovalRequirement[];

  readonly createdAfter?: ISODateString;

  readonly createdBefore?: ISODateString;

  readonly dueAfter?: ISODateString;

  readonly dueBefore?: ISODateString;

  readonly completedAfter?: ISODateString;

  readonly completedBefore?: ISODateString;

  readonly overdueOnly?: boolean;

  readonly blockedOnly?: boolean;

  readonly escalatedOnly?: boolean;

  readonly archivedOnly?: boolean;

  readonly automaticOnly?: boolean;

  readonly keyword?: string;
}

/* ================================================================
 * Workflow Sort Field
 * ================================================================ */

export type EDCWorkflowSortField =
  | "createdAt"
  | "updatedAt"
  | "startedAt"
  | "dueAt"
  | "completedAt"
  | "priority"
  | "status"
  | "progressPercentage";

/* ================================================================
 * Workflow Sort
 * ================================================================ */

export interface EDCWorkflowSort {
  readonly field:
    EDCWorkflowSortField;

  readonly direction:
    | "ASC"
    | "DESC";
}

/* ================================================================
 * Workflow Pagination
 * ================================================================ */

export interface EDCWorkflowPagination {
  readonly page: number;

  readonly pageSize: number;

  readonly cursor?: string | null;
}

/* ================================================================
 * Workflow Search Request
 * ================================================================ */

export interface EDCWorkflowSearchRequest {
  readonly filter?: EDCWorkflowSearchFilter;

  readonly sort?: EDCWorkflowSort;

  readonly pagination?: EDCWorkflowPagination;
}

/* ================================================================
 * Workflow Snapshot
 * ================================================================ */

export interface EDCWorkflowSnapshot {
  readonly id: UUID;

  readonly templateId?: UUID | null;

  readonly entrepreneurId?: UUID | null;

  readonly coachId?: UUID | null;

  readonly businessId?: UUID | null;

  readonly code: string;

  readonly name: string;

  readonly type:
    EDCWorkflowType;

  readonly status:
    EDCWorkflowStatus;

  readonly priority:
    EDCWorkflowPriority;

  readonly ownerType:
    EDCWorkflowOwnerType;

  readonly ownerId?: UUID | null;

  readonly currentStepId?: UUID | null;

  readonly currentStepName?: string | null;

  readonly progressPercentage: number;

  readonly escalationLevel:
    EDCEscalationLevel;

  readonly dueAt?: ISODateString | null;

  readonly startedAt?: ISODateString | null;

  readonly completedAt?: ISODateString | null;

  readonly createdAt: ISODateString;

  readonly updatedAt: ISODateString;
}

/* ================================================================
 * Workflow Search Result
 * ================================================================ */

export interface EDCWorkflowSearchResult {
  readonly workflows:
    readonly EDCWorkflowSnapshot[];

  readonly total: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;

  readonly nextCursor?: string | null;
}

/* ================================================================
 * Workflow Dashboard Summary
 * ================================================================ */

export interface EDCWorkflowDashboardSummary {
  readonly totalWorkflows: number;

  readonly activeWorkflows: number;

  readonly pendingWorkflows: number;

  readonly waitingWorkflows: number;

  readonly blockedWorkflows: number;

  readonly escalatedWorkflows: number;

  readonly completedWorkflows: number;

  readonly failedWorkflows: number;

  readonly overdueWorkflows: number;

  readonly pendingApprovals: number;

  readonly automaticProcessingEligible: number;

  readonly automaticallyProcessedToday: number;

  readonly humanReviewRequired: number;

  readonly averageProgressPercentage: number;

  readonly averageCompletionHours: number;

  readonly slaComplianceRate: number;
}

/* ================================================================
 * Entrepreneur Workflow Dashboard
 * ================================================================ */

export interface EDCEntrepreneurWorkflowDashboard {
  readonly entrepreneurId: UUID;

  readonly activeWorkflows:
    readonly EDCWorkflowSnapshot[];

  readonly pendingActions:
    readonly EDCWorkflowQueueItem[];

  readonly completedWorkflows:
    readonly EDCWorkflowSnapshot[];

  readonly blockedWorkflows:
    readonly EDCWorkflowSnapshot[];

  readonly nextRequiredAction?: string | null;

  readonly overallProgressPercentage: number;

  readonly overdueActionCount: number;
}

/* ================================================================
 * Coach Workflow Dashboard
 * ================================================================ */

export interface EDCCoachWorkflowDashboard {
  readonly coachId: UUID;

  readonly assignedWorkflows:
    readonly EDCWorkflowSnapshot[];

  readonly pendingCoachActions:
    readonly EDCWorkflowQueueItem[];

  readonly entrepreneurWorkflowsRequiringAttention:
    readonly EDCWorkflowQueueItem[];

  readonly pendingApprovals:
    readonly EDCWorkflowQueueItem[];

  readonly escalatedWorkflows:
    readonly EDCWorkflowQueueItem[];

  readonly workflowsDueToday: number;

  readonly overdueWorkflows: number;

  readonly averageCompletionHours: number;
}

/* ================================================================
 * Administrator Workflow Dashboard
 * ================================================================ */

export interface EDCAdministratorWorkflowDashboard {
  readonly summary:
    EDCWorkflowDashboardSummary;

  readonly pendingApprovals:
    readonly EDCWorkflowQueueItem[];

  readonly escalatedWorkflows:
    readonly EDCWorkflowQueueItem[];

  readonly blockedWorkflows:
    readonly EDCWorkflowQueueItem[];

  readonly automaticProcessingQueue:
    readonly EDCWorkflowQueueItem[];

  readonly failedWorkflows:
    readonly EDCWorkflowQueueItem[];

  readonly recentAutomationExecutions:
    readonly EDCWorkflowAutomationExecution[];

  readonly criticalBottlenecks:
    readonly EDCWorkflowBottleneck[];
}

/* ================================================================
 * Workflow Statistics
 * ================================================================ */

export interface EDCWorkflowStatistics {
  readonly total: number;

  readonly byStatus:
    Partial<Record<EDCWorkflowStatus, number>>;

  readonly byType:
    Partial<Record<EDCWorkflowType, number>>;

  readonly byPriority:
    Partial<Record<EDCWorkflowPriority, number>>;

  readonly byTrigger:
    Partial<Record<EDCWorkflowTrigger, number>>;

  readonly byOwnerType:
    Partial<Record<EDCWorkflowOwnerType, number>>;

  readonly byEscalationLevel:
    Partial<Record<EDCEscalationLevel, number>>;

  readonly completionRate: number;

  readonly failureRate: number;

  readonly cancellationRate: number;

  readonly escalationRate: number;

  readonly automationRate: number;

  readonly automaticProcessingRate: number;

  readonly slaComplianceRate: number;

  readonly averageCompletionHours: number;

  readonly averageWaitingHours: number;

  readonly averageApprovalHours: number;

  readonly averageProgressPercentage: number;
}

/* ================================================================
 * Workflow Period Statistics
 * ================================================================ */

export interface EDCWorkflowPeriodStatistics {
  readonly periodStart: ISODateString;

  readonly periodEnd: ISODateString;

  readonly created: number;

  readonly started: number;

  readonly completed: number;

  readonly failed: number;

  readonly cancelled: number;

  readonly escalated: number;

  readonly automaticallyProcessed: number;

  readonly approvalsCompleted: number;

  readonly uniqueEntrepreneurs: number;

  readonly averageCompletionHours: number;

  readonly slaComplianceRate: number;
}

/* ================================================================
 * Archive Workflow DTO
 * ================================================================ */

export interface ArchiveEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly archivedBy: UUID;

  readonly reason: string;

  readonly archivedAt: ISODateString;
}

/* ================================================================
 * Restore Workflow DTO
 * ================================================================ */

export interface RestoreEDCWorkflowDTO {
  readonly workflowId: UUID;

  readonly restoredBy: UUID;

  readonly reason?: string | null;

  readonly restoredAt: ISODateString;
}

/* ================================================================
 * Workflow Integrity Record
 * ================================================================ */

export interface EDCWorkflowIntegrityRecord {
  readonly workflowId: UUID;

  readonly version: number;

  readonly eventCount: number;

  readonly currentHash: string;

  readonly previousHash?: string | null;

  readonly hashAlgorithm: string;

  readonly verified: boolean;

  readonly verifiedAt?: ISODateString | null;

  readonly verificationFailure?: string | null;
}

/* ================================================================
 * Immutable Workflow Snapshot
 * ================================================================ */

export interface EDCImmutableWorkflowSnapshot {
  readonly snapshotId: UUID;

  readonly workflowId: UUID;

  readonly templateId?: UUID | null;

  readonly version: number;

  readonly status:
    EDCWorkflowStatus;

  readonly currentStepId?: UUID | null;

  readonly progressPercentage: number;

  readonly eventCount: number;

  readonly integrityHash: string;

  readonly data:
    Readonly<Record<string, unknown>>;

  readonly generatedBy:
    | "SYSTEM"
    | "AI"
    | "ADMINISTRATOR";

  readonly generatedAt: ISODateString;
}

/* ================================================================
 * Workflow Profile Response
 * ================================================================ */

export interface EDCWorkflowProfileResponse {
  readonly workflow:
    EDCWorkflow;

  readonly template?:
    EDCWorkflowTemplate | null;

  readonly queueItem?:
    EDCWorkflowQueueItem | null;

  readonly currentStep?:
    EDCWorkflowStep | null;

  readonly currentStepExecution?:
    EDCWorkflowStepExecution | null;

  readonly relatedWorkflows:
    readonly EDCWorkflowSnapshot[];

  readonly activeEscalations:
    readonly EDCWorkflowEscalation[];

  readonly pendingApprovals:
    readonly EDCWorkflowApproval[];

  readonly intelligence?:
    EDCWorkflowIntelligence | null;

  readonly integrity?:
    EDCWorkflowIntegrityRecord | null;
}