import {
  BusinessLaunchPlan,
  ComplianceStatus,
  EnterpriseStatus,
} from "./types";

/**
 * Official KPI categories tracked by the Growth Engine.
 */
export enum GrowthMetricType {
  REVENUE = "REVENUE",
  EXPENSES = "EXPENSES",
  NET_INCOME = "NET_INCOME",
  CUSTOMERS_SERVED = "CUSTOMERS_SERVED",
  JOBS_CREATED = "JOBS_CREATED",
  EMPLOYEES = "EMPLOYEES",
  COACH_MEETINGS = "COACH_MEETINGS",
  MOTIVATION_SCORE = "MOTIVATION_SCORE",
  FUNDING_READINESS = "FUNDING_READINESS",
  EXPANSION_READINESS = "EXPANSION_READINESS",
  BUSINESS_HEALTH = "BUSINESS_HEALTH",
}

/**
 * Growth performance direction.
 */
export enum GrowthTrend {
  STRONG_GROWTH = "STRONG_GROWTH",
  GROWTH = "GROWTH",
  STABLE = "STABLE",
  DECLINE = "DECLINE",
  STRONG_DECLINE = "STRONG_DECLINE",
  NOT_ENOUGH_DATA = "NOT_ENOUGH_DATA",
}

/**
 * Business health classifications.
 */
export enum BusinessHealthStatus {
  EXCELLENT = "EXCELLENT",
  HEALTHY = "HEALTHY",
  WATCH = "WATCH",
  AT_RISK = "AT_RISK",
  CRITICAL = "CRITICAL",
}

/**
 * Growth milestone status.
 */
export enum GrowthMilestoneStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
  CANCELLED = "CANCELLED",
}

/**
 * One recorded KPI value.
 */
export interface GrowthMetricRecord {
  id: string;

  businessId: string;

  type: GrowthMetricType;

  value: number;

  periodStart: string;
  periodEnd: string;

  quarter?: number | null;

  source?: string | null;
  notes?: string | null;

  recordedBy: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * One coach meeting record.
 */
export interface CoachMeetingRecord {
  id: string;

  businessId: string;
  coachId: string | null;

  meetingDate: string;

  durationMinutes: number;

  attended: boolean;

  entrepreneurPrepared: boolean;

  actionItemsCompleted: boolean;

  progressScore: number;

  notes: string | null;

  recordedBy: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * One growth milestone.
 */
export interface GrowthMilestone {
  id: string;

  businessId: string;

  title: string;
  description: string | null;

  targetMetric: GrowthMetricType | null;
  targetValue: number | null;

  targetDate: string;

  status: GrowthMilestoneStatus;

  completedAt: string | null;
  completedBy: string | null;

  notes: string | null;

  createdBy: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Input used to record one KPI.
 */
export interface RecordGrowthMetricInput {
  type: GrowthMetricType;

  value: number;

  periodStart: string;
  periodEnd: string;

  quarter?: number | null;

  source?: string | null;
  notes?: string | null;

  recordedBy: string;
}

/**
 * Input used to record a coach meeting.
 */
export interface RecordCoachMeetingInput {
  coachId?: string | null;

  meetingDate: string;

  durationMinutes: number;

  attended: boolean;

  entrepreneurPrepared?: boolean;
  actionItemsCompleted?: boolean;

  progressScore?: number;

  notes?: string | null;

  recordedBy: string;
}

/**
 * Input used to create a growth milestone.
 */
export interface CreateGrowthMilestoneInput {
  title: string;
  description?: string | null;

  targetMetric?: GrowthMetricType | null;
  targetValue?: number | null;

  targetDate: string;

  notes?: string | null;

  createdBy: string;
}

/**
 * KPI trend result.
 */
export interface GrowthMetricTrend {
  type: GrowthMetricType;

  currentValue: number;
  previousValue: number | null;

  changeAmount: number | null;
  changePercentage: number | null;

  trend: GrowthTrend;
}

/**
 * Business health evaluation.
 */
export interface BusinessHealthEvaluation {
  score: number;

  status: BusinessHealthStatus;

  revenueScore: number;
  profitabilityScore: number;
  reportingScore: number;
  complianceScore: number;
  coachingScore: number;
  motivationScore: number;

  strengths: string[];
  concerns: string[];

  evaluatedAt: string;
}

/**
 * Funding-readiness evaluation.
 */
export interface FundingReadinessEvaluation {
  score: number;

  ready: boolean;

  complianceReady: boolean;
  reportingReady: boolean;
  revenueReady: boolean;
  coachingReady: boolean;
  motivationReady: boolean;

  blockers: string[];

  evaluatedAt: string;
}

/**
 * Expansion-readiness evaluation.
 */
export interface ExpansionReadinessEvaluation {
  score: number;

  ready: boolean;

  profitable: boolean;
  revenueGrowing: boolean;
  compliant: boolean;
  reportingCurrent: boolean;
  operationallyStable: boolean;

  blockers: string[];

  evaluatedAt: string;
}

/**
 * Overall Growth Engine dashboard.
 */
export interface GrowthDashboard {
  businessId: string;
  businessName: string;

  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;

  currentEmployees: number;
  totalJobsCreated: number;
  totalCustomersServed: number;

  coachMeetingsCompleted: number;
  coachAttendanceRate: number;

  motivationScore: number;

  businessHealth: BusinessHealthEvaluation;
  fundingReadiness: FundingReadinessEvaluation;
  expansionReadiness: ExpansionReadinessEvaluation;

  revenueTrend: GrowthMetricTrend;
  netIncomeTrend: GrowthMetricTrend;
  customerTrend: GrowthMetricTrend;

  completedMilestones: number;
  pendingMilestones: number;
  overdueMilestones: number;

  generatedAt: string;
}

/**
 * GrowthEngine
 *
 * The strategic intelligence layer of EPEW EOS.
 *
 * Responsibilities:
 * - record business KPIs,
 * - track revenue and profitability,
 * - track jobs and customers,
 * - track coach meetings,
 * - calculate motivation score,
 * - calculate growth trends,
 * - evaluate business health,
 * - evaluate funding readiness,
 * - evaluate expansion readiness,
 * - manage growth milestones,
 * - generate KPI dashboards.
 *
 * This engine does not:
 * - write to Supabase,
 * - send communications,
 * - process payments,
 * - modify Stripe,
 * - render UI,
 * - or call external AI services.
 */
export class GrowthEngine {
  private readonly plan: BusinessLaunchPlan;

  private metrics: GrowthMetricRecord[];

  private coachMeetings: CoachMeetingRecord[];

  private milestones: GrowthMilestone[];

  constructor(
    plan: BusinessLaunchPlan,
    metrics: GrowthMetricRecord[] = [],
    coachMeetings: CoachMeetingRecord[] = [],
    milestones: GrowthMilestone[] = [],
  ) {
    this.plan = this.clone(plan);
    this.metrics = this.clone(metrics);
    this.coachMeetings = this.clone(coachMeetings);
    this.milestones = this.clone(milestones);
  }

  /**
   * Returns a protected copy of the Business Launch Plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clone(this.plan);
  }

  /**
   * Returns all KPI records.
   */
  public getMetrics(): GrowthMetricRecord[] {
    return this.clone(this.metrics);
  }

  /**
   * Returns all coach meeting records.
   */
  public getCoachMeetings(): CoachMeetingRecord[] {
    return this.clone(this.coachMeetings);
  }

  /**
   * Returns all growth milestones.
   */
  public getMilestones(): GrowthMilestone[] {
    return this.clone(this.milestones);
  }

  /**
   * Records one business KPI.
   */
  public recordMetric(
    input: RecordGrowthMetricInput,
  ): GrowthMetricRecord {
    this.assertPlanIsOperational();
    this.validateMetricInput(input);

    const createdAt = new Date().toISOString();

    const record: GrowthMetricRecord = {
      id: this.generateId("GROWTH-METRIC"),

      businessId: String(this.plan.businessId),

      type: input.type,

      value: this.normalizeMetricValue(
        input.type,
        input.value,
      ),

      periodStart: this.toDateString(
        this.parseDate(input.periodStart),
      ),

      periodEnd: this.toDateString(
        this.parseDate(input.periodEnd),
      ),

      quarter: input.quarter ?? null,

      source: input.source?.trim() || null,
      notes: input.notes?.trim() || null,

      recordedBy: input.recordedBy.trim(),

      createdAt,
      updatedAt: createdAt,
    };

    if (
      this.parseDate(record.periodEnd).getTime() <
      this.parseDate(record.periodStart).getTime()
    ) {
      throw new Error(
        "The KPI period end date cannot be earlier than the period start date.",
      );
    }

    this.metrics = [
      ...this.metrics,
      record,
    ];

    return {
      ...record,
    };
  }

  /**
   * Records a coach meeting.
   */
  public recordCoachMeeting(
    input: RecordCoachMeetingInput,
  ): CoachMeetingRecord {
    this.assertPlanIsOperational();

    if (!input.recordedBy.trim()) {
      throw new Error(
        "The person recording the coach meeting is required.",
      );
    }

    if (
      !Number.isInteger(input.durationMinutes) ||
      input.durationMinutes < 0
    ) {
      throw new Error(
        "Coach meeting duration must be a non-negative integer.",
      );
    }

    const progressScore =
      input.progressScore ?? 0;

    if (
      !Number.isFinite(progressScore) ||
      progressScore < 0 ||
      progressScore > 100
    ) {
      throw new Error(
        "Coach meeting progress score must be between 0 and 100.",
      );
    }

    const createdAt = new Date().toISOString();

    const record: CoachMeetingRecord = {
      id: this.generateId("COACH-MEETING"),

      businessId: String(this.plan.businessId),

      coachId: input.coachId ?? null,

      meetingDate: this.parseDate(
        input.meetingDate,
      ).toISOString(),

      durationMinutes: input.durationMinutes,

      attended: input.attended,

      entrepreneurPrepared:
        input.entrepreneurPrepared ?? false,

      actionItemsCompleted:
        input.actionItemsCompleted ?? false,

      progressScore,

      notes: input.notes?.trim() || null,

      recordedBy: input.recordedBy.trim(),

      createdAt,
      updatedAt: createdAt,
    };

    this.coachMeetings = [
      ...this.coachMeetings,
      record,
    ];

    return {
      ...record,
    };
  }

  /**
   * Creates one growth milestone.
   */
  public createMilestone(
    input: CreateGrowthMilestoneInput,
  ): GrowthMilestone {
    this.assertPlanIsOperational();

    if (!input.title.trim()) {
      throw new Error(
        "A growth milestone title is required.",
      );
    }

    if (!input.createdBy.trim()) {
      throw new Error(
        "The person creating the milestone is required.",
      );
    }

    if (
      input.targetValue !== undefined &&
      input.targetValue !== null &&
      (!Number.isFinite(input.targetValue) ||
        input.targetValue < 0)
    ) {
      throw new Error(
        "Growth milestone target value must be a non-negative number.",
      );
    }

    const createdAt = new Date().toISOString();

    const milestone: GrowthMilestone = {
      id: this.generateId("GROWTH-MILESTONE"),

      businessId: String(this.plan.businessId),

      title: input.title.trim(),

      description:
        input.description?.trim() || null,

      targetMetric:
        input.targetMetric ?? null,

      targetValue:
        input.targetValue ?? null,

      targetDate: this.toDateString(
        this.parseDate(input.targetDate),
      ),

      status:
        GrowthMilestoneStatus.PENDING,

      completedAt: null,
      completedBy: null,

      notes: input.notes?.trim() || null,

      createdBy: input.createdBy.trim(),

      createdAt,
      updatedAt: createdAt,
    };

    this.milestones = [
      ...this.milestones,
      milestone,
    ];

    return {
      ...milestone,
    };
  }

  /**
   * Marks one milestone in progress.
   */
  public startMilestone(
    milestoneId: string,
  ): GrowthMilestone {
    this.assertPlanIsOperational();

    const milestone =
      this.findMilestone(milestoneId);

    if (
      milestone.status !==
      GrowthMilestoneStatus.PENDING
    ) {
      throw new Error(
        "Only a pending growth milestone can be started.",
      );
    }

    const updatedAt =
      new Date().toISOString();

    const updatedMilestone: GrowthMilestone = {
      ...milestone,

      status:
        GrowthMilestoneStatus.IN_PROGRESS,

      updatedAt,
    };

    this.replaceMilestone(updatedMilestone);

    return {
      ...updatedMilestone,
    };
  }

  /**
   * Completes one milestone.
   */
  public completeMilestone(
    milestoneId: string,
    completedBy: string,
    notes?: string,
  ): GrowthMilestone {
    this.assertPlanIsOperational();

    if (!completedBy.trim()) {
      throw new Error(
        "The person completing the milestone is required.",
      );
    }

    const milestone =
      this.findMilestone(milestoneId);

    if (
      milestone.status ===
        GrowthMilestoneStatus.COMPLETED ||
      milestone.status ===
        GrowthMilestoneStatus.CANCELLED
    ) {
      throw new Error(
        "A completed or cancelled milestone cannot be completed again.",
      );
    }

    const completedAt =
      new Date().toISOString();

    const updatedMilestone: GrowthMilestone = {
      ...milestone,

      status:
        GrowthMilestoneStatus.COMPLETED,

      completedAt,
      completedBy: completedBy.trim(),

      notes:
        notes?.trim() ||
        milestone.notes ||
        null,

      updatedAt: completedAt,
    };

    this.replaceMilestone(updatedMilestone);

    return {
      ...updatedMilestone,
    };
  }

  /**
   * Cancels one incomplete milestone.
   */
  public cancelMilestone(
    milestoneId: string,
    cancelledBy: string,
    reason: string,
  ): GrowthMilestone {
    this.assertPlanIsOperational();

    if (!cancelledBy.trim()) {
      throw new Error(
        "The person cancelling the milestone is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A milestone cancellation reason is required.",
      );
    }

    const milestone =
      this.findMilestone(milestoneId);

    if (
      milestone.status ===
      GrowthMilestoneStatus.COMPLETED
    ) {
      throw new Error(
        "A completed milestone cannot be cancelled.",
      );
    }

    const updatedAt =
      new Date().toISOString();

    const updatedMilestone: GrowthMilestone = {
      ...milestone,

      status:
        GrowthMilestoneStatus.CANCELLED,

      notes: `${reason.trim()} — Cancelled by ${cancelledBy.trim()}`,

      updatedAt,
    };

    this.replaceMilestone(updatedMilestone);

    return {
      ...updatedMilestone,
    };
  }

  /**
   * Returns all KPI records of one type.
   */
  public getMetricsByType(
    type: GrowthMetricType,
  ): GrowthMetricRecord[] {
    return this.metrics
      .filter((metric) => metric.type === type)
      .sort(
        (first, second) =>
          this.parseDate(first.periodEnd).getTime() -
          this.parseDate(second.periodEnd).getTime(),
      )
      .map((metric) => ({
        ...metric,
      }));
  }

  /**
   * Returns the most recently recorded value for a KPI.
   */
  public getLatestMetricValue(
    type: GrowthMetricType,
  ): number {
    const records =
      this.getMetricsByType(type);

    if (records.length === 0) {
      return 0;
    }

    return records[records.length - 1].value;
  }

  /**
   * Returns the sum of all values for a KPI.
   */
  public getMetricTotal(
    type: GrowthMetricType,
  ): number {
    return this.normalizeNumber(
      this.metrics
        .filter((metric) => metric.type === type)
        .reduce(
          (total, metric) =>
            total + metric.value,
          0,
        ),
    );
  }

  /**
   * Calculates a KPI trend using the two most recent records.
   */
  public getMetricTrend(
    type: GrowthMetricType,
  ): GrowthMetricTrend {
    const records =
      this.getMetricsByType(type);

    if (records.length === 0) {
      return {
        type,
        currentValue: 0,
        previousValue: null,
        changeAmount: null,
        changePercentage: null,
        trend:
          GrowthTrend.NOT_ENOUGH_DATA,
      };
    }

    const current =
      records[records.length - 1];

    if (records.length === 1) {
      return {
        type,
        currentValue: current.value,
        previousValue: null,
        changeAmount: null,
        changePercentage: null,
        trend:
          GrowthTrend.NOT_ENOUGH_DATA,
      };
    }

    const previous =
      records[records.length - 2];

    const changeAmount =
      this.normalizeNumber(
        current.value - previous.value,
      );

    const changePercentage =
      previous.value === 0
        ? current.value === 0
          ? 0
          : 100
        : this.normalizeNumber(
            (changeAmount /
              Math.abs(previous.value)) *
              100,
          );

    return {
      type,

      currentValue: current.value,
      previousValue: previous.value,

      changeAmount,
      changePercentage,

      trend: this.determineTrend(
        changePercentage,
      ),
    };
  }

  /**
   * Calculates the official EOS motivation score.
   *
   * Inputs:
   * - coach meeting attendance,
   * - preparation,
   * - action-item completion,
   * - reporting completion,
   * - milestone completion,
   * - direct motivation-score records.
   */
  public calculateMotivationScore(): number {
    const directScore =
      this.getLatestMetricValue(
        GrowthMetricType.MOTIVATION_SCORE,
      );

    const meetingScore =
      this.calculateCoachMeetingScore();

    const reportScore =
      this.calculateReportingScore();

    const milestoneScore =
      this.calculateMilestoneScore();

    const values = [
      directScore,
      meetingScore,
      reportScore,
      milestoneScore,
    ].filter((value) => value > 0);

    if (values.length === 0) {
      return 0;
    }

    return this.clampScore(
      values.reduce(
        (total, value) => total + value,
        0,
      ) / values.length,
    );
  }

  /**
   * Evaluates overall business health.
   */
  public evaluateBusinessHealth(): BusinessHealthEvaluation {
    const evaluatedAt =
      new Date().toISOString();

    const revenueTrend =
      this.getMetricTrend(
        GrowthMetricType.REVENUE,
      );

    const totalRevenue =
      this.getMetricTotal(
        GrowthMetricType.REVENUE,
      );

    const totalExpenses =
      this.getMetricTotal(
        GrowthMetricType.EXPENSES,
      );

    const totalNetIncome =
      this.calculateTotalNetIncome();

    const revenueScore =
      this.calculateRevenueScore(
        totalRevenue,
        revenueTrend,
      );

    const profitabilityScore =
      this.calculateProfitabilityScore(
        totalRevenue,
        totalExpenses,
        totalNetIncome,
      );

    const reportingScore =
      this.calculateReportingScore();

    const complianceScore =
      this.plan.complianceStatus ===
      ComplianceStatus.COMPLIANT
        ? 100
        : this.plan.complianceStatus ===
            ComplianceStatus.ACTION_REQUIRED
          ? 60
          : 20;

    const coachingScore =
      this.calculateCoachMeetingScore();

    const motivationScore =
      this.calculateMotivationScore();

    const score = this.clampScore(
      revenueScore * 0.2 +
        profitabilityScore * 0.25 +
        reportingScore * 0.15 +
        complianceScore * 0.15 +
        coachingScore * 0.1 +
        motivationScore * 0.15,
    );

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (revenueScore >= 75) {
      strengths.push(
        "Revenue performance is strong.",
      );
    } else if (revenueScore < 50) {
      concerns.push(
        "Revenue growth requires attention.",
      );
    }

    if (profitabilityScore >= 75) {
      strengths.push(
        "The business demonstrates healthy profitability.",
      );
    } else if (profitabilityScore < 50) {
      concerns.push(
        "Expenses or profitability require corrective action.",
      );
    }

    if (reportingScore >= 90) {
      strengths.push(
        "Quarterly reporting is current.",
      );
    } else {
      concerns.push(
        "Quarterly reporting is incomplete or overdue.",
      );
    }

    if (
      this.plan.complianceStatus ===
      ComplianceStatus.COMPLIANT
    ) {
      strengths.push(
        "The business is compliant.",
      );
    } else {
      concerns.push(
        "Compliance requirements remain unresolved.",
      );
    }

    if (coachingScore >= 75) {
      strengths.push(
        "Coach engagement is strong.",
      );
    } else {
      concerns.push(
        "Coach engagement should improve.",
      );
    }

    if (motivationScore >= 75) {
      strengths.push(
        "Entrepreneur motivation is strong.",
      );
    } else if (motivationScore < 50) {
      concerns.push(
        "Entrepreneur motivation requires support.",
      );
    }

    return {
      score,

      status:
        this.determineBusinessHealthStatus(
          score,
        ),

      revenueScore,
      profitabilityScore,
      reportingScore,
      complianceScore,
      coachingScore,
      motivationScore,

      strengths,
      concerns,

      evaluatedAt,
    };
  }

  /**
   * Evaluates readiness for additional funding.
   */
  public evaluateFundingReadiness(): FundingReadinessEvaluation {
    const complianceReady =
      this.plan.complianceStatus ===
      ComplianceStatus.COMPLIANT;

    const reportingReady =
      this.calculateReportingScore() >= 90;

    const revenueReady =
      this.getMetricTotal(
        GrowthMetricType.REVENUE,
      ) > 0;

    const coachingReady =
      this.calculateCoachMeetingScore() >= 70;

    const motivationReady =
      this.calculateMotivationScore() >= 70;

    const checks = [
      complianceReady,
      reportingReady,
      revenueReady,
      coachingReady,
      motivationReady,
    ];

    const score = this.clampScore(
      (checks.filter(Boolean).length /
        checks.length) *
        100,
    );

    const blockers: string[] = [];

    if (!complianceReady) {
      blockers.push(
        "The business is not fully compliant.",
      );
    }

    if (!reportingReady) {
      blockers.push(
        "Quarterly reporting is incomplete.",
      );
    }

    if (!revenueReady) {
      blockers.push(
        "Revenue performance has not been demonstrated.",
      );
    }

    if (!coachingReady) {
      blockers.push(
        "Coach participation is below the readiness threshold.",
      );
    }

    if (!motivationReady) {
      blockers.push(
        "The motivation score is below the readiness threshold.",
      );
    }

    return {
      score,

      ready:
        score >= 80 &&
        complianceReady &&
        reportingReady,

      complianceReady,
      reportingReady,
      revenueReady,
      coachingReady,
      motivationReady,

      blockers,

      evaluatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Evaluates readiness for expansion.
   */
  public evaluateExpansionReadiness(): ExpansionReadinessEvaluation {
    const totalRevenue =
      this.getMetricTotal(
        GrowthMetricType.REVENUE,
      );

    const totalNetIncome =
      this.calculateTotalNetIncome();

    const profitable =
      totalNetIncome > 0;

    const revenueTrend =
      this.getMetricTrend(
        GrowthMetricType.REVENUE,
      );

    const revenueGrowing =
      revenueTrend.trend ===
        GrowthTrend.GROWTH ||
      revenueTrend.trend ===
        GrowthTrend.STRONG_GROWTH;

    const compliant =
      this.plan.complianceStatus ===
      ComplianceStatus.COMPLIANT;

    const reportingCurrent =
      this.calculateReportingScore() >= 90;

    const operationallyStable =
      this.evaluateBusinessHealth().score >=
        70 &&
      totalRevenue > 0;

    const checks = [
      profitable,
      revenueGrowing,
      compliant,
      reportingCurrent,
      operationallyStable,
    ];

    const score = this.clampScore(
      (checks.filter(Boolean).length /
        checks.length) *
        100,
    );

    const blockers: string[] = [];

    if (!profitable) {
      blockers.push(
        "The business has not demonstrated positive net income.",
      );
    }

    if (!revenueGrowing) {
      blockers.push(
        "Revenue is not showing a consistent growth trend.",
      );
    }

    if (!compliant) {
      blockers.push(
        "The business is not fully compliant.",
      );
    }

    if (!reportingCurrent) {
      blockers.push(
        "Quarterly reporting is not current.",
      );
    }

    if (!operationallyStable) {
      blockers.push(
        "The business health score is below the expansion threshold.",
      );
    }

    return {
      score,

      ready:
        score >= 80 &&
        profitable &&
        compliant &&
        reportingCurrent,

      profitable,
      revenueGrowing,
      compliant,
      reportingCurrent,
      operationallyStable,

      blockers,

      evaluatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Returns overdue growth milestones.
   */
  public getOverdueMilestones(
    asOf: Date = new Date(),
  ): GrowthMilestone[] {
    this.validateDate(
      asOf,
      "growth milestone review date",
    );

    return this.milestones
      .filter((milestone) => {
        if (
          milestone.status ===
            GrowthMilestoneStatus.COMPLETED ||
          milestone.status ===
            GrowthMilestoneStatus.CANCELLED
        ) {
          return false;
        }

        return (
          this.endOfUtcDay(
            this.parseDate(
              milestone.targetDate,
            ),
          ).getTime() <
          this.startOfUtcDay(
            asOf,
          ).getTime()
        );
      })
      .map((milestone) => ({
        ...milestone,
        status:
          GrowthMilestoneStatus.MISSED,
      }));
  }

  /**
   * Generates the complete EOS Growth Dashboard.
   */
  public getDashboard(): GrowthDashboard {
    const totalRevenue =
      this.getMetricTotal(
        GrowthMetricType.REVENUE,
      );

    const totalExpenses =
      this.getMetricTotal(
        GrowthMetricType.EXPENSES,
      );

    const totalNetIncome =
      this.calculateTotalNetIncome();

    const totalJobsCreated =
      this.getMetricTotal(
        GrowthMetricType.JOBS_CREATED,
      );

    const totalCustomersServed =
      this.getMetricTotal(
        GrowthMetricType.CUSTOMERS_SERVED,
      );

    const currentEmployees =
      this.getLatestMetricValue(
        GrowthMetricType.EMPLOYEES,
      );

    const attendedMeetings =
      this.coachMeetings.filter(
        (meeting) => meeting.attended,
      ).length;

    const coachAttendanceRate =
      this.coachMeetings.length === 0
        ? 0
        : this.clampScore(
            (attendedMeetings /
              this.coachMeetings.length) *
              100,
          );

    const completedMilestones =
      this.milestones.filter(
        (milestone) =>
          milestone.status ===
          GrowthMilestoneStatus.COMPLETED,
      ).length;

    const pendingMilestones =
      this.milestones.filter(
        (milestone) =>
          milestone.status ===
            GrowthMilestoneStatus.PENDING ||
          milestone.status ===
            GrowthMilestoneStatus.IN_PROGRESS,
      ).length;

    return {
      businessId: String(
        this.plan.businessId,
      ),

      businessName:
        this.plan.businessName,

      totalRevenue,
      totalExpenses,
      totalNetIncome,

      currentEmployees,
      totalJobsCreated,
      totalCustomersServed,

      coachMeetingsCompleted:
        attendedMeetings,

      coachAttendanceRate,

      motivationScore:
        this.calculateMotivationScore(),

      businessHealth:
        this.evaluateBusinessHealth(),

      fundingReadiness:
        this.evaluateFundingReadiness(),

      expansionReadiness:
        this.evaluateExpansionReadiness(),

      revenueTrend:
        this.getMetricTrend(
          GrowthMetricType.REVENUE,
        ),

      netIncomeTrend:
        this.getMetricTrend(
          GrowthMetricType.NET_INCOME,
        ),

      customerTrend:
        this.getMetricTrend(
          GrowthMetricType.CUSTOMERS_SERVED,
        ),

      completedMilestones,
      pendingMilestones,

      overdueMilestones:
        this.getOverdueMilestones().length,

      generatedAt:
        new Date().toISOString(),
    };
  }

  /**
   * Calculates net income from explicit records when available.
   * Otherwise, it calculates revenue minus expenses.
   */
  private calculateTotalNetIncome(): number {
    const explicitNetIncome =
      this.getMetricTotal(
        GrowthMetricType.NET_INCOME,
      );

    if (explicitNetIncome !== 0) {
      return explicitNetIncome;
    }

    return this.normalizeNumber(
      this.getMetricTotal(
        GrowthMetricType.REVENUE,
      ) -
        this.getMetricTotal(
          GrowthMetricType.EXPENSES,
        ),
    );
  }

  private calculateRevenueScore(
    totalRevenue: number,
    trend: GrowthMetricTrend,
  ): number {
    if (totalRevenue <= 0) {
      return 0;
    }

    switch (trend.trend) {
      case GrowthTrend.STRONG_GROWTH:
        return 100;

      case GrowthTrend.GROWTH:
        return 85;

      case GrowthTrend.STABLE:
        return 70;

      case GrowthTrend.DECLINE:
        return 45;

      case GrowthTrend.STRONG_DECLINE:
        return 20;

      case GrowthTrend.NOT_ENOUGH_DATA:
      default:
        return 60;
    }
  }

  private calculateProfitabilityScore(
    totalRevenue: number,
    totalExpenses: number,
    totalNetIncome: number,
  ): number {
    if (totalRevenue <= 0) {
      return 0;
    }

    const margin =
      (totalNetIncome / totalRevenue) *
      100;

    if (margin >= 20) {
      return 100;
    }

    if (margin >= 10) {
      return 85;
    }

    if (margin >= 5) {
      return 70;
    }

    if (margin >= 0) {
      return 55;
    }

    if (
      totalExpenses >
      totalRevenue * 1.25
    ) {
      return 15;
    }

    return 30;
  }

  private calculateReportingScore(): number {
    const reporting = this.readArrayValue(
      this.plan,
      "reporting",
    );

    if (reporting.length === 0) {
      return 0;
    }

    const completed = reporting.filter(
      (report) => {
        if (
          typeof report !== "object" ||
          report === null
        ) {
          return false;
        }

        const record =
          report as Record<
            string,
            unknown
          >;

        return Boolean(
          record.approvedAt ??
            record.submittedAt,
        );
      },
    ).length;

    return this.clampScore(
      (completed / reporting.length) *
        100,
    );
  }

  private calculateCoachMeetingScore(): number {
    if (
      this.coachMeetings.length === 0
    ) {
      return 0;
    }

    const scores =
      this.coachMeetings.map(
        (meeting) => {
          let score = 0;

          if (meeting.attended) {
            score += 40;
          }

          if (
            meeting.entrepreneurPrepared
          ) {
            score += 20;
          }

          if (
            meeting.actionItemsCompleted
          ) {
            score += 20;
          }

          score +=
            meeting.progressScore * 0.2;

          return score;
        },
      );

    return this.clampScore(
      scores.reduce(
        (total, score) =>
          total + score,
        0,
      ) / scores.length,
    );
  }

  private calculateMilestoneScore(): number {
    const activeMilestones =
      this.milestones.filter(
        (milestone) =>
          milestone.status !==
          GrowthMilestoneStatus.CANCELLED,
      );

    if (
      activeMilestones.length === 0
    ) {
      return 0;
    }

    const completed =
      activeMilestones.filter(
        (milestone) =>
          milestone.status ===
          GrowthMilestoneStatus.COMPLETED,
      ).length;

    return this.clampScore(
      (completed /
        activeMilestones.length) *
        100,
    );
  }

  private determineTrend(
    changePercentage: number,
  ): GrowthTrend {
    if (changePercentage >= 20) {
      return GrowthTrend.STRONG_GROWTH;
    }

    if (changePercentage >= 5) {
      return GrowthTrend.GROWTH;
    }

    if (changePercentage > -5) {
      return GrowthTrend.STABLE;
    }

    if (changePercentage > -20) {
      return GrowthTrend.DECLINE;
    }

    return GrowthTrend.STRONG_DECLINE;
  }

  private determineBusinessHealthStatus(
    score: number,
  ): BusinessHealthStatus {
    if (score >= 90) {
      return BusinessHealthStatus.EXCELLENT;
    }

    if (score >= 75) {
      return BusinessHealthStatus.HEALTHY;
    }

    if (score >= 60) {
      return BusinessHealthStatus.WATCH;
    }

    if (score >= 40) {
      return BusinessHealthStatus.AT_RISK;
    }

    return BusinessHealthStatus.CRITICAL;
  }

  private validateMetricInput(
    input: RecordGrowthMetricInput,
  ): void {
    if (!input.recordedBy.trim()) {
      throw new Error(
        "The person recording the KPI is required.",
      );
    }

    if (
      !Number.isFinite(input.value)
    ) {
      throw new Error(
        "The KPI value must be a valid number.",
      );
    }

    if (
      input.quarter !== undefined &&
      input.quarter !== null &&
      ![1, 2, 3, 4].includes(
        input.quarter,
      )
    ) {
      throw new Error(
        "Quarter must be 1, 2, 3, or 4.",
      );
    }
  }

  private normalizeMetricValue(
    type: GrowthMetricType,
    value: number,
  ): number {
    const nonNegativeTypes: GrowthMetricType[] = [
      GrowthMetricType.REVENUE,
      GrowthMetricType.EXPENSES,
      GrowthMetricType.CUSTOMERS_SERVED,
      GrowthMetricType.JOBS_CREATED,
      GrowthMetricType.EMPLOYEES,
      GrowthMetricType.COACH_MEETINGS,
      GrowthMetricType.MOTIVATION_SCORE,
      GrowthMetricType.FUNDING_READINESS,
      GrowthMetricType.EXPANSION_READINESS,
      GrowthMetricType.BUSINESS_HEALTH,
    ];

    if (
      nonNegativeTypes.includes(type) &&
      value < 0
    ) {
      throw new Error(
        `${type} cannot be negative.`,
      );
    }

    if (
      [
        GrowthMetricType.MOTIVATION_SCORE,
        GrowthMetricType.FUNDING_READINESS,
        GrowthMetricType.EXPANSION_READINESS,
        GrowthMetricType.BUSINESS_HEALTH,
      ].includes(type) &&
      value > 100
    ) {
      throw new Error(
        `${type} must be between 0 and 100.`,
      );
    }

    return this.normalizeNumber(value);
  }

  private findMilestone(
    milestoneId: string,
  ): GrowthMilestone {
    const milestone =
      this.milestones.find(
        (item) =>
          item.id === milestoneId,
      );

    if (!milestone) {
      throw new Error(
        `Growth milestone "${milestoneId}" was not found.`,
      );
    }

    return {
      ...milestone,
    };
  }

  private replaceMilestone(
    updatedMilestone: GrowthMilestone,
  ): void {
    this.milestones =
      this.milestones.map(
        (milestone) =>
          milestone.id ===
          updatedMilestone.id
            ? {
                ...updatedMilestone,
              }
            : {
                ...milestone,
              },
      );
  }

  private assertPlanIsOperational(): void {
    if (
      this.plan.status ===
      EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "The Business Launch Plan is closed and cannot record growth activity.",
      );
    }

    if (
      this.plan.status ===
      EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot record growth activity.",
      );
    }
  }

  private readArrayValue(
    source: unknown,
    property: string,
  ): unknown[] {
    if (
      typeof source !== "object" ||
      source === null
    ) {
      return [];
    }

    const value = (
      source as Record<
        string,
        unknown
      >
    )[property];

    return Array.isArray(value)
      ? [...value]
      : [];
  }

  private normalizeNumber(
    value: number,
  ): number {
    return Number(
      value.toFixed(2),
    );
  }

  private clampScore(
    value: number,
  ): number {
    return Number(
      Math.min(
        100,
        Math.max(0, value),
      ).toFixed(2),
    );
  }

  private parseDate(
    value: string,
  ): Date {
    const normalizedValue =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value,
      )
        ? `${value}T00:00:00.000Z`
        : value;

    const date =
      new Date(normalizedValue);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `Invalid date: "${value}".`,
      );
    }

    return date;
  }

  private validateDate(
    date: Date,
    label: string,
  ): void {
    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        `GrowthEngine received an invalid ${label}.`,
      );
    }
  }

  private startOfUtcDay(
    date: Date,
  ): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private endOfUtcDay(
    date: Date,
  ): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private toDateString(
    date: Date,
  ): string {
    this.validateDate(
      date,
      "date",
    );

    return date
      .toISOString()
      .split("T")[0];
  }

  private generateId(
    prefix: string,
  ): string {
    const year =
      new Date().getUTCFullYear();

    const randomCode =
      this.generateRandomCode(8);

    return `${prefix}-${year}-${randomCode}`;
  }

  private generateRandomCode(
    length: number,
  ): string {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const position =
        Math.floor(
          Math.random() *
            characters.length,
        );

      result +=
        characters[position];
    }

    return result;
  }

  private clone<T>(
    value: T,
  ): T {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(value);
    }

    return JSON.parse(
      JSON.stringify(value),
    ) as T;
  }
}