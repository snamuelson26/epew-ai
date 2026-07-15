import {
  BusinessLaunchPlan,
  BusinessLifeCycleStage,
  ComplianceStatus,
  EnterpriseStatus,
} from "./types";

/**
 * Quarterly report structure used by the Reporting Engine.
 *
 * This structural type works with the reporting records already stored
 * inside BusinessLaunchPlan.
 */
export interface QuarterlyReport {
  id: string;
  businessId: string;

  quarter: number;
  title: string;

  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  dueDate: string;

  submittedAt: string | null;
  submittedBy?: string | null;

  reviewedAt: string | null;
  reviewedBy?: string | null;

  approvedAt: string | null;
  approvedBy?: string | null;

  reportReference?: string | null;
  notes?: string | null;

  status: EnterpriseStatus;

  createdAt: string;
  updatedAt: string;

  revenue?: number | null;
  expenses?: number | null;
  netIncome?: number | null;

  employees?: number | null;
  customersServed?: number | null;
  jobsCreated?: number | null;

  challenges?: string | null;
  achievements?: string | null;
  supportNeeded?: string | null;

  rejectionReason?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
}

/**
 * Data submitted by the entrepreneur for a quarterly report.
 */
export interface QuarterlyReportSubmission {
  revenue: number;
  expenses: number;

  employees?: number;
  customersServed?: number;
  jobsCreated?: number;

  achievements?: string;
  challenges?: string;
  supportNeeded?: string;

  reportReference?: string;
  notes?: string;
}

/**
 * Summary of the complete first-year reporting cycle.
 */
export interface ReportingSummary {
  totalReports: number;
  submittedReports: number;
  approvedReports: number;
  pendingReports: number;
  overdueReports: number;

  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;

  totalJobsCreated: number;
  latestEmployeeCount: number;
  totalCustomersServed: number;

  completionPercentage: number;
  approvalPercentage: number;

  allReportsSubmitted: boolean;
  allReportsApproved: boolean;

  nextReportDueDate: string | null;
}

/**
 * Result of a reporting compliance evaluation.
 */
export interface ReportingComplianceEvaluation {
  status: ComplianceStatus;

  overdueReports: QuarterlyReport[];
  pendingReports: QuarterlyReport[];
  submittedReports: QuarterlyReport[];
  approvedReports: QuarterlyReport[];

  evaluatedAt: string;

  compliant: boolean;
}

/**
 * ReportingEngine
 *
 * Owns the quarterly reporting rules for businesses that have completed
 * the Business Launch process.
 *
 * Responsibilities:
 * - create and maintain quarterly reporting schedules,
 * - submit quarterly reports,
 * - review and approve reports,
 * - reject reports while preserving history,
 * - detect overdue reports,
 * - calculate reporting compliance,
 * - calculate business performance metrics,
 * - preserve immutable reporting records.
 *
 * This engine does not:
 * - write to Supabase,
 * - send reminders,
 * - call external accounting services,
 * - advance lifecycle stages,
 * - or render user-interface components.
 */
export class ReportingEngine {
  private plan: BusinessLaunchPlan;

  constructor(plan: BusinessLaunchPlan) {
    this.plan = this.clonePlan(plan);
  }

  /**
   * Returns a protected copy of the complete Business Launch Plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clonePlan(this.plan);
  }

  /**
   * Returns all quarterly reports.
   */
  public getReports(): QuarterlyReport[] {
    return this.getReportingRecords().map((report) => ({
      ...report,
    }));
  }

  /**
   * Returns one quarterly report.
   */
  public getReport(quarter: number): QuarterlyReport {
    this.validateQuarter(quarter);

    const report = this.getReportingRecords().find(
      (item) => item.quarter === quarter,
    );

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    return {
      ...report,
    };
  }

  /**
   * Submits a quarterly report.
   *
   * A submitted report becomes ready for administrative review.
   */
  public submitReport(
    quarter: number,
    submittedBy: string,
    submission: QuarterlyReportSubmission,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertReportingStage();
    this.validateQuarter(quarter);

    if (!submittedBy.trim()) {
      throw new Error(
        "The person submitting the quarterly report is required.",
      );
    }

    this.validateSubmission(submission);

    const reports = this.getReportingRecords();
    const report = reports.find((item) => item.quarter === quarter);

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    if (report.submittedAt && report.approvedAt) {
      throw new Error(
        `Quarter ${quarter} has already been submitted and approved.`,
      );
    }

    if (report.submittedAt && !report.rejectedAt) {
      throw new Error(
        `Quarter ${quarter} has already been submitted and is awaiting review.`,
      );
    }

    const submittedAt = new Date().toISOString();

    const revenue = this.toMoney(submission.revenue);
    const expenses = this.toMoney(submission.expenses);
    const netIncome = this.toMoney(revenue - expenses);

    const updatedReports = reports.map((item) => {
      if (item.quarter !== quarter) {
        return {
          ...item,
        };
      }

      return {
        ...item,

        revenue,
        expenses,
        netIncome,

        employees: submission.employees ?? 0,
        customersServed: submission.customersServed ?? 0,
        jobsCreated: submission.jobsCreated ?? 0,

        achievements: submission.achievements?.trim() || null,
        challenges: submission.challenges?.trim() || null,
        supportNeeded: submission.supportNeeded?.trim() || null,

        reportReference:
          submission.reportReference?.trim() || null,

        notes: submission.notes?.trim() || null,

        submittedAt,
        submittedBy,

        reviewedAt: null,
        reviewedBy: null,

        approvedAt: null,
        approvedBy: null,

        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,

        status: EnterpriseStatus.IN_PROGRESS,

        updatedAt: submittedAt,
      };
    });

    this.applyReports(updatedReports, submittedAt);

    return this.getPlan();
  }

  /**
   * Reviews a submitted quarterly report.
   *
   * Review does not approve the report. It records that an authorized
   * administrator or coach completed the first review.
   */
  public reviewReport(
    quarter: number,
    reviewedBy: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.validateQuarter(quarter);

    if (!reviewedBy.trim()) {
      throw new Error(
        "The person reviewing the quarterly report is required.",
      );
    }

    const reports = this.getReportingRecords();
    const report = reports.find((item) => item.quarter === quarter);

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    if (!report.submittedAt) {
      throw new Error(
        `Quarter ${quarter} cannot be reviewed before submission.`,
      );
    }

    if (report.approvedAt) {
      throw new Error(
        `Quarter ${quarter} is already approved.`,
      );
    }

    const reviewedAt = new Date().toISOString();

    const updatedReports = reports.map((item) => {
      if (item.quarter !== quarter) {
        return {
          ...item,
        };
      }

      return {
        ...item,

        reviewedAt,
        reviewedBy,

        notes: notes?.trim() || item.notes || null,

        status: EnterpriseStatus.IN_PROGRESS,

        updatedAt: reviewedAt,
      };
    });

    this.applyReports(updatedReports, reviewedAt);

    return this.getPlan();
  }

  /**
   * Approves a quarterly report.
   */
  public approveReport(
    quarter: number,
    approvedBy: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.validateQuarter(quarter);

    if (!approvedBy.trim()) {
      throw new Error(
        "The person approving the quarterly report is required.",
      );
    }

    const reports = this.getReportingRecords();
    const report = reports.find((item) => item.quarter === quarter);

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    if (!report.submittedAt) {
      throw new Error(
        `Quarter ${quarter} cannot be approved before submission.`,
      );
    }

    if (report.approvedAt) {
      throw new Error(
        `Quarter ${quarter} has already been approved.`,
      );
    }

    const approvedAt = new Date().toISOString();

    const updatedReports = reports.map((item) => {
      if (item.quarter !== quarter) {
        return {
          ...item,
        };
      }

      return {
        ...item,

        reviewedAt: item.reviewedAt ?? approvedAt,
        reviewedBy: item.reviewedBy ?? approvedBy,

        approvedAt,
        approvedBy,

        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null,

        notes: notes?.trim() || item.notes || null,

        status: EnterpriseStatus.COMPLETED,

        updatedAt: approvedAt,
      };
    });

    this.applyReports(updatedReports, approvedAt);

    return this.getPlan();
  }

  /**
   * Rejects a submitted quarterly report.
   *
   * The report remains in the operational history and may be
   * corrected and resubmitted.
   */
  public rejectReport(
    quarter: number,
    rejectedBy: string,
    reason: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.validateQuarter(quarter);

    if (!rejectedBy.trim()) {
      throw new Error(
        "The person rejecting the quarterly report is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A rejection reason is required.",
      );
    }

    const reports = this.getReportingRecords();
    const report = reports.find((item) => item.quarter === quarter);

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    if (!report.submittedAt) {
      throw new Error(
        `Quarter ${quarter} cannot be rejected before submission.`,
      );
    }

    if (report.approvedAt) {
      throw new Error(
        `Quarter ${quarter} cannot be rejected because it is already approved.`,
      );
    }

    const rejectedAt = new Date().toISOString();

    const updatedReports = reports.map((item) => {
      if (item.quarter !== quarter) {
        return {
          ...item,
        };
      }

      return {
        ...item,

        rejectedAt,
        rejectedBy,
        rejectionReason: reason.trim(),

        reviewedAt: item.reviewedAt ?? rejectedAt,
        reviewedBy: item.reviewedBy ?? rejectedBy,

        status: EnterpriseStatus.PENDING,

        updatedAt: rejectedAt,
      };
    });

    const existingHistory = this.readArrayValue(
      this.plan,
      "reportingHistory",
    );

    const reportingHistory = [
      ...existingHistory,
      {
        action: "REPORT_REJECTED",
        quarter,
        rejectedBy,
        reason: reason.trim(),
        rejectedAt,
        reportSnapshot: {
          ...report,
        },
      },
    ];

    this.plan = {
      ...this.plan,
      reporting: updatedReports,
      reportingHistory,
      complianceStatus: this.calculatePlanComplianceStatus(
        updatedReports,
        new Date(rejectedAt),
      ),
      updatedAt: rejectedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Reopens an approved report.
   *
   * This is an exceptional administrative action. The approved report
   * snapshot is preserved in reportingHistory.
   */
  public reopenApprovedReport(
    quarter: number,
    reopenedBy: string,
    reason: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.validateQuarter(quarter);

    if (!reopenedBy.trim()) {
      throw new Error(
        "The person reopening the report is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A reason is required to reopen an approved report.",
      );
    }

    const reports = this.getReportingRecords();
    const report = reports.find((item) => item.quarter === quarter);

    if (!report) {
      throw new Error(`Quarter ${quarter} report was not found.`);
    }

    if (!report.approvedAt) {
      throw new Error(
        `Quarter ${quarter} is not approved and cannot be reopened.`,
      );
    }

    const reopenedAt = new Date().toISOString();

    const updatedReports = reports.map((item) => {
      if (item.quarter !== quarter) {
        return {
          ...item,
        };
      }

      return {
        ...item,

        approvedAt: null,
        approvedBy: null,

        reviewedAt: null,
        reviewedBy: null,

        submittedAt: null,
        submittedBy: null,

        rejectionReason: reason.trim(),
        rejectedAt: reopenedAt,
        rejectedBy: reopenedBy,

        status: EnterpriseStatus.PENDING,

        updatedAt: reopenedAt,
      };
    });

    const existingHistory = this.readArrayValue(
      this.plan,
      "reportingHistory",
    );

    const reportingHistory = [
      ...existingHistory,
      {
        action: "APPROVED_REPORT_REOPENED",
        quarter,
        reopenedBy,
        reason: reason.trim(),
        reopenedAt,
        reportSnapshot: {
          ...report,
        },
      },
    ];

    this.plan = {
      ...this.plan,
      reporting: updatedReports,
      reportingHistory,
      allQuarterlyReportsSubmittedAt: null,
      allQuarterlyReportsApprovedAt: null,
      complianceStatus: this.calculatePlanComplianceStatus(
        updatedReports,
        new Date(reopenedAt),
      ),
      updatedAt: reopenedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Evaluates reporting compliance.
   *
   * Rules:
   *
   * COMPLIANT
   * Every due report is submitted.
   *
   * ACTION_REQUIRED
   * A report is pending but has not reached its due date.
   *
   * NON_COMPLIANT
   * One or more reports are overdue and unsubmitted.
   */
  public evaluateCompliance(
    evaluationDate: Date = new Date(),
  ): ReportingComplianceEvaluation {
    if (Number.isNaN(evaluationDate.getTime())) {
      throw new Error(
        "ReportingEngine received an invalid evaluation date.",
      );
    }

    const reports = this.getReportingRecords();

    const overdueReports = reports.filter((report) =>
      this.isReportOverdue(report, evaluationDate),
    );

    const pendingReports = reports.filter(
      (report) => !report.submittedAt && !report.approvedAt,
    );

    const submittedReports = reports.filter(
      (report) => Boolean(report.submittedAt),
    );

    const approvedReports = reports.filter(
      (report) => Boolean(report.approvedAt),
    );

    const status = this.determineReportingComplianceStatus(
      reports,
      overdueReports,
      evaluationDate,
    );

    return {
      status,

      overdueReports: overdueReports.map((report) => ({
        ...report,
      })),

      pendingReports: pendingReports.map((report) => ({
        ...report,
      })),

      submittedReports: submittedReports.map((report) => ({
        ...report,
      })),

      approvedReports: approvedReports.map((report) => ({
        ...report,
      })),

      evaluatedAt: evaluationDate.toISOString(),

      compliant: status === ComplianceStatus.COMPLIANT,
    };
  }

  /**
   * Applies the current reporting compliance result to the plan.
   */
  public refreshComplianceStatus(): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const evaluatedAt = new Date().toISOString();
    const evaluation = this.evaluateCompliance(
      new Date(evaluatedAt),
    );

    this.plan = {
      ...this.plan,
      complianceStatus: evaluation.status,
      reportingComplianceStatus: evaluation.status,
      reportingLastReviewedAt: evaluatedAt,
      updatedAt: evaluatedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Returns all overdue reports.
   */
  public getOverdueReports(
    asOf: Date = new Date(),
  ): QuarterlyReport[] {
    if (Number.isNaN(asOf.getTime())) {
      throw new Error(
        "ReportingEngine received an invalid overdue review date.",
      );
    }

    return this.getReportingRecords()
      .filter((report) => this.isReportOverdue(report, asOf))
      .map((report) => ({
        ...report,
      }));
  }

  /**
   * Returns reports due within a selected number of days.
   */
  public getReportsDueWithin(
    days: number,
    asOf: Date = new Date(),
  ): QuarterlyReport[] {
    if (!Number.isInteger(days) || days < 0) {
      throw new Error(
        "The number of days must be a non-negative integer.",
      );
    }

    if (Number.isNaN(asOf.getTime())) {
      throw new Error(
        "ReportingEngine received an invalid review date.",
      );
    }

    const startDate = this.startOfUtcDay(asOf);
    const deadline = this.endOfUtcDay(this.addDays(asOf, days));

    return this.getReportingRecords()
      .filter((report) => {
        if (report.submittedAt || report.approvedAt) {
          return false;
        }

        const dueDate = this.parseDate(report.dueDate);

        return (
          dueDate.getTime() >= startDate.getTime() &&
          dueDate.getTime() <= deadline.getTime()
        );
      })
      .map((report) => ({
        ...report,
      }));
  }

  /**
   * Returns the next unsubmitted report.
   */
  public getNextReport(): QuarterlyReport | null {
    const reports = this.getReportingRecords()
      .filter((report) => !report.submittedAt)
      .sort(
        (first, second) =>
          this.parseDate(first.dueDate).getTime() -
          this.parseDate(second.dueDate).getTime(),
      );

    if (reports.length === 0) {
      return null;
    }

    return {
      ...reports[0],
    };
  }

  /**
   * Returns the complete first-year reporting summary.
   */
  public getReportingSummary(
    asOf: Date = new Date(),
  ): ReportingSummary {
    const reports = this.getReportingRecords();

    const submittedReports = reports.filter((report) =>
      Boolean(report.submittedAt),
    );

    const approvedReports = reports.filter((report) =>
      Boolean(report.approvedAt),
    );

    const pendingReports = reports.filter(
      (report) => !report.submittedAt,
    );

    const overdueReports = reports.filter((report) =>
      this.isReportOverdue(report, asOf),
    );

    const totalRevenue = this.toMoney(
      reports.reduce(
        (total, report) => total + (report.revenue ?? 0),
        0,
      ),
    );

    const totalExpenses = this.toMoney(
      reports.reduce(
        (total, report) => total + (report.expenses ?? 0),
        0,
      ),
    );

    const totalNetIncome = this.toMoney(
      reports.reduce(
        (total, report) => total + (report.netIncome ?? 0),
        0,
      ),
    );

    const totalJobsCreated = reports.reduce(
      (total, report) => total + (report.jobsCreated ?? 0),
      0,
    );

    const totalCustomersServed = reports.reduce(
      (total, report) => total + (report.customersServed ?? 0),
      0,
    );

    const latestSubmittedReport = [...reports]
      .filter((report) => Boolean(report.submittedAt))
      .sort((first, second) => second.quarter - first.quarter)[0];

    const latestEmployeeCount =
      latestSubmittedReport?.employees ?? 0;

    const totalReports = reports.length;

    const nextReport = this.getNextReport();

    return {
      totalReports,

      submittedReports: submittedReports.length,
      approvedReports: approvedReports.length,
      pendingReports: pendingReports.length,
      overdueReports: overdueReports.length,

      totalRevenue,
      totalExpenses,
      totalNetIncome,

      totalJobsCreated,
      latestEmployeeCount,
      totalCustomersServed,

      completionPercentage:
        totalReports === 0
          ? 0
          : Number(
              (
                (submittedReports.length / totalReports) *
                100
              ).toFixed(2),
            ),

      approvalPercentage:
        totalReports === 0
          ? 0
          : Number(
              (
                (approvedReports.length / totalReports) *
                100
              ).toFixed(2),
            ),

      allReportsSubmitted:
        totalReports > 0 &&
        submittedReports.length === totalReports,

      allReportsApproved:
        totalReports > 0 &&
        approvedReports.length === totalReports,

      nextReportDueDate: nextReport?.dueDate ?? null,
    };
  }

  /**
   * Returns true when all four quarterly reports are submitted.
   */
  public areAllReportsSubmitted(): boolean {
    const reports = this.getReportingRecords();

    return (
      reports.length > 0 &&
      reports.every((report) => Boolean(report.submittedAt))
    );
  }

  /**
   * Returns true when all four quarterly reports are approved.
   */
  public areAllReportsApproved(): boolean {
    const reports = this.getReportingRecords();

    return (
      reports.length > 0 &&
      reports.every((report) => Boolean(report.approvedAt))
    );
  }

  /**
   * Applies reporting records and updates plan-level completion dates.
   */
  private applyReports(
    reports: QuarterlyReport[],
    updatedAt: string,
  ): void {
    const allReportsSubmitted =
      reports.length > 0 &&
      reports.every((report) => Boolean(report.submittedAt));

    const allReportsApproved =
      reports.length > 0 &&
      reports.every((report) => Boolean(report.approvedAt));

    this.plan = {
      ...this.plan,

      reporting: reports,

      allQuarterlyReportsSubmittedAt: allReportsSubmitted
        ? this.plan.allQuarterlyReportsSubmittedAt ?? updatedAt
        : null,

      allQuarterlyReportsApprovedAt: allReportsApproved
        ? this.readStringValue(
            this.plan,
            "allQuarterlyReportsApprovedAt",
          ) ?? updatedAt
        : null,

      complianceStatus: this.calculatePlanComplianceStatus(
        reports,
        new Date(updatedAt),
      ),

      updatedAt,
    } as BusinessLaunchPlan;
  }

  /**
   * Determines reporting compliance.
   */
  private determineReportingComplianceStatus(
    reports: QuarterlyReport[],
    overdueReports: QuarterlyReport[],
    evaluationDate: Date,
  ): ComplianceStatus {
    if (overdueReports.length > 0) {
      return ComplianceStatus.NON_COMPLIANT;
    }

    const dueReports = reports.filter((report) => {
      const dueDate = this.endOfUtcDay(
        this.parseDate(report.dueDate),
      );

      return dueDate.getTime() <= evaluationDate.getTime();
    });

    const allDueReportsSubmitted = dueReports.every((report) =>
      Boolean(report.submittedAt),
    );

    if (allDueReportsSubmitted) {
      return ComplianceStatus.COMPLIANT;
    }

    return ComplianceStatus.ACTION_REQUIRED;
  }

  /**
   * Calculates plan compliance while preserving unrelated
   * non-compliant conditions.
   */
  private calculatePlanComplianceStatus(
    reports: QuarterlyReport[],
    evaluationDate: Date,
  ): ComplianceStatus {
    const overdueReports = reports.filter((report) =>
      this.isReportOverdue(report, evaluationDate),
    );

    const reportingStatus =
      this.determineReportingComplianceStatus(
        reports,
        overdueReports,
        evaluationDate,
      );

    if (
      this.plan.complianceStatus ===
        ComplianceStatus.NON_COMPLIANT &&
      reportingStatus !== ComplianceStatus.NON_COMPLIANT
    ) {
      return ComplianceStatus.NON_COMPLIANT;
    }

    return reportingStatus;
  }

  /**
   * Determines whether a report is overdue.
   */
  private isReportOverdue(
    report: QuarterlyReport,
    asOf: Date,
  ): boolean {
    if (report.submittedAt || report.approvedAt) {
      return false;
    }

    const dueDate = this.endOfUtcDay(
      this.parseDate(report.dueDate),
    );

    return dueDate.getTime() < this.startOfUtcDay(asOf).getTime();
  }

  /**
   * Ensures quarterly reporting occurs only after the business opens.
   */
  private assertReportingStage(): void {
   const allowedStages: BusinessLifeCycleStage[] = [
  BusinessLifeCycleStage.QUARTERLY_REPORTING,
  BusinessLifeCycleStage.BUSINESS_GROWTH,
  BusinessLifeCycleStage.BUSINESS_EXPANSION,
  BusinessLifeCycleStage.SUCCESS_STORY,
];

    if (!allowedStages.includes(this.plan.currentStage)) {
      throw new Error(
        "Quarterly reports can only be submitted during the QUARTERLY_REPORTING or COMPLETED stage.",
      );
    }
  }

  /**
   * Prevents changes to closed or cancelled plans.
   */
  private assertPlanIsOperational(): void {
    if (this.plan.status === EnterpriseStatus.CLOSED) {
      throw new Error(
        "The Business Launch Plan is closed and cannot be modified.",
      );
    }

    if (this.plan.status === EnterpriseStatus.CANCELLED) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot be modified.",
      );
    }
  }

  /**
   * Validates quarterly report values.
   */
  private validateSubmission(
    submission: QuarterlyReportSubmission,
  ): void {
    this.validateNonNegativeNumber(
      submission.revenue,
      "Revenue",
    );

    this.validateNonNegativeNumber(
      submission.expenses,
      "Expenses",
    );

    if (submission.employees !== undefined) {
      this.validateNonNegativeInteger(
        submission.employees,
        "Employees",
      );
    }

    if (submission.customersServed !== undefined) {
      this.validateNonNegativeInteger(
        submission.customersServed,
        "Customers served",
      );
    }

    if (submission.jobsCreated !== undefined) {
      this.validateNonNegativeInteger(
        submission.jobsCreated,
        "Jobs created",
      );
    }
  }

  private validateQuarter(quarter: number): void {
    if (![1, 2, 3, 4].includes(quarter)) {
      throw new Error(
        "Quarter must be 1, 2, 3, or 4.",
      );
    }
  }

  private validateNonNegativeNumber(
    value: number,
    label: string,
  ): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `${label} must be a non-negative number.`,
      );
    }
  }

  private validateNonNegativeInteger(
    value: number,
    label: string,
  ): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(
        `${label} must be a non-negative integer.`,
      );
    }
  }

  private getReportingRecords(): QuarterlyReport[] {
    if (!Array.isArray(this.plan.reporting)) {
      throw new Error(
        "The Business Launch Plan does not contain a valid reporting schedule.",
      );
    }

    return (this.plan.reporting as QuarterlyReport[]).map(
      (report) => ({
        ...report,
      }),
    );
  }

  private parseDate(value: string): Date {
    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00.000Z`
      : value;

    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date: "${value}".`);
    }

    return date;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);

    result.setUTCDate(result.getUTCDate() + days);

    return result;
  }

  private startOfUtcDay(date: Date): Date {
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

  private endOfUtcDay(date: Date): Date {
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

  private toMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private readStringValue(
    source: unknown,
    property: string,
  ): string | null {
    if (
      typeof source !== "object" ||
      source === null
    ) {
      return null;
    }

    const value = (
      source as Record<string, unknown>
    )[property];

    return typeof value === "string" ? value : null;
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
      source as Record<string, unknown>
    )[property];

    return Array.isArray(value) ? [...value] : [];
  }

  /**
   * Prevents external mutation of the internal plan.
   */
  private clonePlan(
    plan: BusinessLaunchPlan,
  ): BusinessLaunchPlan {
    if (typeof structuredClone === "function") {
      return structuredClone(plan);
    }

    return JSON.parse(
      JSON.stringify(plan),
    ) as BusinessLaunchPlan;
  }
}