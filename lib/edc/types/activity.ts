/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem (EDE)
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * File: activity.ts
 *
 * Enterprise Development Activity Domain Model
 *
 * Activity Philosophy
 *
 * Development Plan
 *      ↓
 * Goal
 *      ↓
 * Activity
 *      ↓
 * Evidence
 *      ↓
 * Evaluation
 *      ↓
 * Reflection
 *      ↓
 * Readiness Improvement
 *
 * Activities are the smallest measurable units of entrepreneur
 * development. Completion alone is not sufficient. Every activity
 * may require evidence, evaluation, reflection, and measurable
 * development impact.
 *
 * Domain model only.
 * No business logic.
 * ================================================================
 */

export type UUID = string;
export type ISODateString = string;

/* ================================================================
 * Activity Status
 * ================================================================ */

export enum EDCActivityStatus {
  DRAFT = "DRAFT",

  CREATED = "CREATED",

  ASSIGNED = "ASSIGNED",

  ACCEPTED = "ACCEPTED",

  IN_PROGRESS = "IN_PROGRESS",

  PAUSED = "PAUSED",

  EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED",

  AI_REVIEW_PENDING = "AI_REVIEW_PENDING",

  HUMAN_REVIEW_PENDING = "HUMAN_REVIEW_PENDING",

  REVISION_REQUIRED = "REVISION_REQUIRED",

  APPROVED = "APPROVED",

  COMPLETED = "COMPLETED",

  CANCELLED = "CANCELLED",

  EXPIRED = "EXPIRED",

  ARCHIVED = "ARCHIVED"
}

/* ================================================================
 * Activity Type
 * ================================================================ */

export enum EDCActivityType {
  LEARNING = "LEARNING",

  RESEARCH = "RESEARCH",

  CUSTOMER_INTERVIEW = "CUSTOMER_INTERVIEW",

  MARKET_RESEARCH = "MARKET_RESEARCH",

  BUSINESS_PLANNING = "BUSINESS_PLANNING",

  FINANCIAL_PLANNING = "FINANCIAL_PLANNING",

  OPERATIONS_PLANNING = "OPERATIONS_PLANNING",

  LEGAL_PREPARATION = "LEGAL_PREPARATION",

  MARKETING = "MARKETING",

  SALES = "SALES",

  COMMUNITY_ENGAGEMENT = "COMMUNITY_ENGAGEMENT",

  PRESENTATION = "PRESENTATION",

  BUSINESS_PITCH = "BUSINESS_PITCH",

  DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD",

  VIDEO_SUBMISSION = "VIDEO_SUBMISSION",

  REFLECTION_EXERCISE = "REFLECTION_EXERCISE",

  BUSINESS_VISIT = "BUSINESS_VISIT",

  COACHING_EXERCISE = "COACHING_EXERCISE",

  MARKETPLACE_PREPARATION = "MARKETPLACE_PREPARATION",

  FUNDING_PREPARATION = "FUNDING_PREPARATION",

  BUSINESS_LAUNCH_PREPARATION = "BUSINESS_LAUNCH_PREPARATION",

  COMPLIANCE = "COMPLIANCE",

  ASSESSMENT = "ASSESSMENT",

  CUSTOM = "CUSTOM"
}

/* ================================================================
 * Activity Category
 * ================================================================ */

export enum EDCActivityCategory {
  ENTREPRENEUR_IDENTITY = "ENTREPRENEUR_IDENTITY",

  CUSTOMER_DISCOVERY = "CUSTOMER_DISCOVERY",

  VALUE_PROPOSITION = "VALUE_PROPOSITION",

  MARKET = "MARKET",

  BUSINESS_MODEL = "BUSINESS_MODEL",

  FINANCIAL = "FINANCIAL",

  OPERATIONS = "OPERATIONS",

  LEGAL_AND_COMPLIANCE = "LEGAL_AND_COMPLIANCE",

  LEADERSHIP = "LEADERSHIP",

  COMMUNICATION = "COMMUNICATION",

  SALES = "SALES",

  MARKETING = "MARKETING",

  COMMUNITY = "COMMUNITY",

  COMMITMENT = "COMMITMENT",

  COACHABILITY = "COACHABILITY",

  DECISION_MAKING = "DECISION_MAKING",

  MARKETPLACE = "MARKETPLACE",

  FUNDING = "FUNDING",

  BUSINESS_LAUNCH = "BUSINESS_LAUNCH",

  BUSINESS_GROWTH = "BUSINESS_GROWTH",

  OTHER = "OTHER"
}

/* ================================================================
 * Activity Priority
 * ================================================================ */

export enum EDCActivityPriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL"
}

/* ================================================================
 * Activity Difficulty
 * ================================================================ */

export enum EDCActivityDifficulty {
  INTRODUCTORY = "INTRODUCTORY",

  BASIC = "BASIC",

  INTERMEDIATE = "INTERMEDIATE",

  ADVANCED = "ADVANCED",

  EXPERT = "EXPERT"
}

/* ================================================================
 * Activity Assignment Mode
 * ================================================================ */

export enum EDCActivityAssignmentMode {
  AI_ASSIGNED = "AI_ASSIGNED",

  HUMAN_ASSIGNED = "HUMAN_ASSIGNED",

  HYBRID_ASSIGNED = "HYBRID_ASSIGNED",

  SELF_SELECTED = "SELF_SELECTED",

  SYSTEM_REQUIRED = "SYSTEM_REQUIRED"
}

/* ================================================================
 * Activity Delivery Mode
 * ================================================================ */

export enum EDCActivityDeliveryMode {
  ONLINE = "ONLINE",

  IN_PERSON = "IN_PERSON",

  PHONE = "PHONE",

  VIDEO_CALL = "VIDEO_CALL",

  SELF_GUIDED = "SELF_GUIDED",

  HYBRID = "HYBRID"
}

/* ================================================================
 * Activity Evidence Requirement
 * ================================================================ */

export enum EDCActivityEvidenceRequirement {
  NONE = "NONE",

  OPTIONAL = "OPTIONAL",

  REQUIRED = "REQUIRED",

  VERIFIED_REQUIRED = "VERIFIED_REQUIRED"
}

/* ================================================================
 * Activity Evidence Status
 * ================================================================ */

export enum EDCActivityEvidenceStatus {
  NOT_REQUIRED = "NOT_REQUIRED",

  NOT_SUBMITTED = "NOT_SUBMITTED",

  SUBMITTED = "SUBMITTED",

  UNDER_REVIEW = "UNDER_REVIEW",

  VERIFIED = "VERIFIED",

  REJECTED = "REJECTED",

  REVISION_REQUIRED = "REVISION_REQUIRED"
}

/* ================================================================
 * Activity Evaluation Result
 * ================================================================ */

export enum EDCActivityEvaluationResult {
  NOT_EVALUATED = "NOT_EVALUATED",

  INCOMPLETE = "INCOMPLETE",

  NEEDS_IMPROVEMENT = "NEEDS_IMPROVEMENT",

  SATISFACTORY = "SATISFACTORY",

  STRONG = "STRONG",

  EXCELLENT = "EXCELLENT"
}

/* ================================================================
 * Activity Impact
 * ================================================================ */

export enum EDCActivityImpact {
  NONE = "NONE",

  LOW = "LOW",

  MODERATE = "MODERATE",

  HIGH = "HIGH",

  TRANSFORMATIONAL = "TRANSFORMATIONAL"
}

/* ================================================================
 * Activity Resource Type
 * ================================================================ */

export enum EDCActivityResourceType {
  ARTICLE = "ARTICLE",

  VIDEO = "VIDEO",

  COURSE = "COURSE",

  DOCUMENT = "DOCUMENT",

  CHECKLIST = "CHECKLIST",

  TEMPLATE = "TEMPLATE",

  WORKSHEET = "WORKSHEET",

  WEBSITE = "WEBSITE",

  BOOK = "BOOK",

  AUDIO = "AUDIO",

  TOOL = "TOOL",

  OTHER = "OTHER"
}

/* ================================================================
 * Activity Deliverable Type
 * ================================================================ */

export enum EDCActivityDeliverableType {
  TEXT_RESPONSE = "TEXT_RESPONSE",

  DOCUMENT = "DOCUMENT",

  SPREADSHEET = "SPREADSHEET",

  PRESENTATION = "PRESENTATION",

  IMAGE = "IMAGE",

  VIDEO = "VIDEO",

  AUDIO = "AUDIO",

  FORM = "FORM",

  LINK = "LINK",

  CHECKLIST = "CHECKLIST",

  OBSERVATION = "OBSERVATION",

  OTHER = "OTHER"
}

/* ================================================================
 * Activity Resource
 * ================================================================ */

export interface EDCActivityResource {
  readonly id: UUID;

  readonly type: EDCActivityResourceType;

  readonly title: string;

  readonly description?: string | null;

  readonly url?: string | null;

  readonly fileId?: UUID | null;

  readonly required: boolean;

  readonly sequence: number;
}

/* ================================================================
 * Activity Instruction
 * ================================================================ */

export interface EDCActivityInstruction {
  readonly id: UUID;

  readonly title?: string | null;

  readonly instruction: string;

  readonly sequence: number;

  readonly required: boolean;

  readonly estimatedMinutes?: number | null;

  readonly resourceIds?: readonly UUID[];
}

/* ================================================================
 * Activity Completion Criterion
 * ================================================================ */

export interface EDCActivityCompletionCriterion {
  readonly id: UUID;

  readonly title: string;

  readonly description: string;

  readonly required: boolean;

  readonly achieved: boolean;

  readonly evidenceIds?: readonly UUID[];

  readonly verifiedAt?: ISODateString | null;

  readonly verifiedBy?: UUID | null;
}

/* ================================================================
 * Activity Deliverable
 * ================================================================ */

export interface EDCActivityDeliverable {
  readonly id: UUID;

  readonly type: EDCActivityDeliverableType;

  readonly title: string;

  readonly description?: string | null;

  readonly required: boolean;

  readonly submitted: boolean;

  readonly submissionValue?: unknown;

  readonly fileIds?: readonly UUID[];

  readonly submittedAt?: ISODateString | null;
}

/* ================================================================
 * Activity Success Metric
 * ================================================================ */

export interface EDCActivitySuccessMetric {
  readonly id: UUID;

  readonly name: string;

  readonly description?: string | null;

  readonly metricType:
    | "BOOLEAN"
    | "NUMBER"
    | "PERCENTAGE"
    | "CURRENCY"
    | "COUNT"
    | "SCORE"
    | "DATE"
    | "TEXT";

  readonly currentValue?: unknown;

  readonly targetValue: unknown;

  readonly unit?: string | null;

  readonly achieved: boolean;

  readonly measuredAt?: ISODateString | null;

  readonly evidenceIds?: readonly UUID[];
}

/* ================================================================
 * Activity Evidence
 * ================================================================ */

export interface EDCActivityEvidence {
  readonly id: UUID;

  readonly activityId: UUID;

  readonly title: string;

  readonly description?: string | null;

  readonly type:
    | "DOCUMENT"
    | "IMAGE"
    | "VIDEO"
    | "AUDIO"
    | "LINK"
    | "TEXT"
    | "SYSTEM_RECORD"
    | "COACH_OBSERVATION"
    | "OTHER";

  readonly status: EDCActivityEvidenceStatus;

  readonly fileIds?: readonly UUID[];

  readonly url?: string | null;

  readonly textValue?: string | null;

  readonly submittedBy: UUID;

  readonly submittedAt: ISODateString;

  readonly reviewedBy?: UUID | null;

  readonly reviewedAt?: ISODateString | null;

  readonly rejectionReason?: string | null;
}
/* ================================================================
 * Activity Evaluation
 * ================================================================ */

export interface EDCActivityEvaluation {

  readonly result: EDCActivityEvaluationResult;

  readonly score: number;

  readonly confidence: number;

  readonly strengths: readonly string[];

  readonly improvementAreas: readonly string[];

  readonly completedCriteria: number;

  readonly totalCriteria: number;

  readonly evaluatedAt: ISODateString;

}

/* ================================================================
 * AI Activity Analysis
 * ================================================================ */

export interface EDCAIActivityAnalysis {

  readonly executiveSummary: string;

  readonly evidenceQuality: number;

  readonly completionQuality: number;

  readonly readinessImpact: EDCActivityImpact;

  readonly assessmentImpact: EDCActivityImpact;

  readonly competencyImprovement:
    readonly string[];

  readonly nextRecommendations:
    readonly string[];

  readonly confidence: number;

  readonly generatedAt: ISODateString;

}

/* ================================================================
 * Coach Feedback
 * ================================================================ */

export interface EDCActivityCoachFeedback {

  readonly coachId: UUID;

  readonly summary: string;

  readonly positiveFeedback:
    readonly string[];

  readonly improvementSuggestions:
    readonly string[];

  readonly overallScore: number;

  readonly submittedAt: ISODateString;

}

/* ================================================================
 * Entrepreneur Reflection Trigger
 * ================================================================ */

export interface EDCActivityReflectionTrigger {

  readonly required: boolean;

  readonly reflectionQuestions:
    readonly string[];

  readonly minimumWords?: number;

  readonly dueDate?: ISODateString;

}

/* ================================================================
 * Readiness Impact
 * ================================================================ */

export interface EDCActivityReadinessImpact {

  readonly affectedDimensions:
    readonly string[];

  readonly previousScore?: number;

  readonly newScore?: number;

  readonly impact: EDCActivityImpact;

}

/* ================================================================
 * Assessment Impact
 * ================================================================ */

export interface EDCActivityAssessmentImpact {

  readonly assessmentId?: UUID;

  readonly requiresAssessmentUpdate: boolean;

  readonly reason: string;

}

/* ================================================================
 * Competency Improvement
 * ================================================================ */

export interface EDCActivityCompetencyImprovement {

  readonly competencyId: UUID;

  readonly competencyName: string;

  readonly previousLevel: number;

  readonly newLevel: number;

  readonly improvement: number;

}

/* ================================================================
 * Activity Progress
 * ================================================================ */

export interface EDCActivityProgress {

  readonly percentageCompleted: number;

  readonly startedAt?: ISODateString;

  readonly lastUpdatedAt: ISODateString;

  readonly estimatedCompletionDate?:
    ISODateString;

}

/* ================================================================
 * Next Activity Recommendation
 * ================================================================ */

export interface EDCNextActivityRecommendation {

  readonly activityType:
    EDCActivityType;

  readonly category:
    EDCActivityCategory;

  readonly title: string;

  readonly reason: string;

  readonly priority:
    EDCActivityPriority;

}

/* ================================================================
 * Activity Assignment
 * ================================================================ */

export interface EDCActivityAssignment {

  readonly assignedBy: UUID | null;

  readonly assignmentMode:
    EDCActivityAssignmentMode;

  readonly assignedAt: ISODateString;

  readonly acceptedAt?: ISODateString;

  readonly dueDate?: ISODateString;

}

/* ================================================================
 * Activity Outcome
 * ================================================================ */

export interface EDCActivityOutcome {

  readonly objectivesMet: boolean;

  readonly successMetricIds:
    readonly UUID[];

  readonly evidenceIds:
    readonly UUID[];

  readonly reflectionCompleted: boolean;

  readonly overallImpact:
    EDCActivityImpact;

}