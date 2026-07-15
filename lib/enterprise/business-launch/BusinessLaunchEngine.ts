import { BusinessLifeCycle } from "./BusinessLifeCycle";
import { LaunchPlanner } from "./LaunchPlanner";

import {
  Allocation,
  Business,
  BusinessLaunchPlan,
  BusinessLifeCycleStage,
  ComplianceStatus,
  EnterpriseStatus,
  FundingApproval,
  StageResult,
} from "./types";

/**
 * BusinessLaunchEngine
 *
 * Enterprise orchestrator for the complete EPEW business-launch process.
 *
 * Responsibilities:
 * - create launch plans,
 * - coordinate lifecycle transitions,
 * - update compliance requirements,
 * - release approved allocations,
 * - verify business readiness,
 * - activate the business,
 * - submit quarterly reports,
 * - close or cancel launch plans,
 * - preserve the operational history.
 *
 * This engine does not directly:
 * - write to Supabase,
 * - send emails,
 * - process Stripe payments,
 * - render UI components,
 * - or call external vendors.
 *
 * Persistence and external integrations belong to service adapters.
 */
export class BusinessLaunchEngine {
  private plan: BusinessLaunchPlan;

  constructor(plan: BusinessLaunchPlan) {
    this.plan = this.clonePlan(plan);
  }

  /**
   * Creates a new Business Launch Plan from an approved business.
   */
  public static createLaunchPlan(
    business: Business,
    approval: FundingApproval,
  ): BusinessLaunchPlan {
    const planner = new LaunchPlanner(business, approval);

    return planner.build();
  }

  /**
   * Returns a protected copy of the current launch plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clonePlan(this.plan);
  }

  /**
   * Returns the current lifecycle stage.
   */
  public getCurrentStage(): BusinessLifeCycleStage {
    return this.plan.currentStage;
  }

  /**
   * Returns the current enterprise status.
   */
  public getStatus(): EnterpriseStatus {
    return this.plan.status;
  }

  /**
   * Returns the current compliance status.
   */
  public getComplianceStatus(): ComplianceStatus {
    return this.plan.complianceStatus;
  }

  /**
   * Advances the launch plan to the next lifecycle stage.
   *
   * The BusinessLifeCycle class remains the single source of truth
   * for stage-transition rules.
   */
  public advanceStage(result: StageResult): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const lifeCycle = new BusinessLifeCycle(
      this.clonePlan(this.plan),
    );

    this.plan = lifeCycle.advance(result);

    return this.getPlan();
  }

  /**
   * Marks one compliance requirement as completed.
   *
   * The overall compliance status is recalculated automatically.
   */
  public approveCompliance(
    requirementId: string,
    approvedBy?: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const compliance = this.plan.compliance;

    if (!compliance) {
      throw new Error(
        "The Business Launch Plan does not contain a compliance record.",
      );
    }

    const requirementExists = compliance.requirements.some(
      (requirement) => requirement.id === requirementId,
    );

    if (!requirementExists) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    const completedAt = new Date().toISOString();

    const updatedRequirements = compliance.requirements.map(
      (requirement) => {
        if (requirement.id !== requirementId) {
          return { ...requirement };
        }

        return {
          ...requirement,
          completed: true,
          completedAt,
          approvedBy:
            approvedBy ??
            ("approvedBy" in requirement
              ? requirement.approvedBy
              : null),
          notes:
            notes ??
            ("notes" in requirement
              ? requirement.notes
              : null),
        };
      },
    );

    const complianceStatus =
      this.calculateComplianceStatus(updatedRequirements);

    this.plan = {
      ...this.plan,
      complianceStatus,
      compliance: {
        ...compliance,
        status: complianceStatus,
        requirements: updatedRequirements,
        lastReviewedAt: completedAt,
        updatedAt: completedAt,
      },
      updatedAt: completedAt,
    };

    return this.getPlan();
  }

  /**
   * Reopens a compliance requirement.
   *
   * This supports reversible administrative corrections while
   * preserving the requirement inside the launch plan.
   */
  public reopenCompliance(
    requirementId: string,
    reason?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const compliance = this.plan.compliance;

    if (!compliance) {
      throw new Error(
        "The Business Launch Plan does not contain a compliance record.",
      );
    }

    const requirementExists = compliance.requirements.some(
      (requirement) => requirement.id === requirementId,
    );

    if (!requirementExists) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    const updatedAt = new Date().toISOString();

    const updatedRequirements = compliance.requirements.map(
      (requirement) => {
        if (requirement.id !== requirementId) {
          return { ...requirement };
        }

        return {
          ...requirement,
          completed: false,
          completedAt: null,
          notes:
            reason ??
            ("notes" in requirement
              ? requirement.notes
              : null),
        };
      },
    );

    const complianceStatus =
      this.calculateComplianceStatus(updatedRequirements);

    this.plan = {
      ...this.plan,
      complianceStatus,
      compliance: {
        ...compliance,
        status: complianceStatus,
        requirements: updatedRequirements,
        lastReviewedAt: updatedAt,
        updatedAt,
      },
      updatedAt,
    };

    return this.getPlan();
  }

  /**
   * Releases an approved allocation.
   *
   * This method records an authorized release only.
   * The actual payment must be performed by the Financial Engine
   * or a payment-service adapter.
   */
  public releaseAllocation(
    allocationId: string,
    amount: number,
    releasedBy?: string,
    reference?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "The allocation release amount must be greater than zero.",
      );
    }

    const allocation = this.plan.allocations.find(
      (item) => item.id === allocationId,
    );

    if (!allocation) {
      throw new Error(
        `Allocation "${allocationId}" was not found.`,
      );
    }

    const approvedAmount = this.toMoney(
      allocation.approvedAmount,
    );

    const releasedAmount = this.toMoney(
      allocation.releasedAmount ?? 0,
    );

    const remainingAmount = this.toMoney(
      approvedAmount - releasedAmount,
    );

    if (amount > remainingAmount) {
      throw new Error(
        `The release amount exceeds the remaining approved allocation of ${remainingAmount.toFixed(
          2,
        )}.`,
      );
    }

    const updatedReleasedAmount = this.toMoney(
      releasedAmount + amount,
    );

    const updatedRemainingAmount = this.toMoney(
      approvedAmount - updatedReleasedAmount,
    );

    const releasedAt = new Date().toISOString();

    const updatedAllocations = this.plan.allocations.map(
      (item) => {
        if (item.id !== allocationId) {
          return { ...item };
        }

        return {
          ...item,
          releasedAmount: updatedReleasedAmount,
          remainingAmount: updatedRemainingAmount,
          status:
            updatedRemainingAmount === 0
              ? EnterpriseStatus.COMPLETED
              : EnterpriseStatus.ACTIVE,
          releasedAt,
          releasedBy:
            releasedBy ??
            ("releasedBy" in item
              ? item.releasedBy
              : null),
          paymentReference:
            reference ??
            ("paymentReference" in item
              ? item.paymentReference
              : null),
          updatedAt: releasedAt,
        };
      },
    );

    this.plan = {
      ...this.plan,
      allocations: updatedAllocations,
      updatedAt: releasedAt,
    };

    return this.getPlan();
  }

  /**
   * Marks a launch deliverable as completed.
   */
  public completeDeliverable(
    deliverableId: string,
    verifiedBy?: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const deliverableExists = this.plan.deliverables.some(
      (deliverable) => deliverable.id === deliverableId,
    );

    if (!deliverableExists) {
      throw new Error(
        `Deliverable "${deliverableId}" was not found.`,
      );
    }

    const completedAt = new Date().toISOString();

    const deliverables = this.plan.deliverables.map(
      (deliverable) => {
        if (deliverable.id !== deliverableId) {
          return { ...deliverable };
        }

        return {
          ...deliverable,
          completed: true,
          completedAt,
          verifiedBy: verifiedBy ?? null,
          verifiedAt: verifiedBy ? completedAt : null,
          notes:
            notes ??
            ("notes" in deliverable
              ? deliverable.notes
              : null),
          status: EnterpriseStatus.COMPLETED,
          updatedAt: completedAt,
        };
      },
    );

    this.plan = {
      ...this.plan,
      deliverables,
      updatedAt: completedAt,
    };

    return this.getPlan();
  }

  /**
   * Verifies that all mandatory launch requirements are complete.
   *
   * Successful verification:
   * - marks the verification milestone complete,
   * - marks the readiness deliverable complete,
   * - updates compliance,
   * - and returns the revised plan.
   *
   * Stage advancement remains controlled by advanceStage().
   */
  public verifyBusinessReady(
    verifiedBy: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    if (
      this.plan.currentStage !==
      BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION
    ) {
      throw new Error(
        "Business Ready Verification can only be completed during the BUSINESS_READY_VERIFICATION stage.",
      );
    }

    const incompleteDeliverables =
      this.plan.deliverables.filter(
        (deliverable) =>
          deliverable.required &&
          !deliverable.completed &&
          deliverable.stage !==
            BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION,
      );

    if (incompleteDeliverables.length > 0) {
      const titles = incompleteDeliverables
        .map((deliverable) => deliverable.title)
        .join(", ");

      throw new Error(
        `Business Ready Verification failed. Incomplete deliverables: ${titles}.`,
      );
    }

    const unreleasedVendorAllocations =
      this.plan.allocations.filter((allocation) => {
        const approvedAmount = this.toMoney(
          allocation.approvedAmount,
        );

        const releasedAmount = this.toMoney(
          allocation.releasedAmount ?? 0,
        );

        return (
          approvedAmount > 0 &&
          releasedAmount < approvedAmount &&
          this.isVendorAllocation(allocation)
        );
      });

    if (unreleasedVendorAllocations.length > 0) {
      throw new Error(
        "Business Ready Verification failed because one or more vendor allocations remain unreleased.",
      );
    }

    const verifiedAt = new Date().toISOString();

    const deliverables = this.plan.deliverables.map(
      (deliverable) => {
        if (
          deliverable.stage !==
          BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION
        ) {
          return { ...deliverable };
        }

        return {
          ...deliverable,
          completed: true,
          completedAt: verifiedAt,
          verifiedBy,
          verifiedAt,
          notes:
            notes ??
            ("notes" in deliverable
              ? deliverable.notes
              : null),
          status: EnterpriseStatus.COMPLETED,
          updatedAt: verifiedAt,
        };
      },
    );

    const timeline = this.plan.timeline.map((milestone) => {
      if (
        milestone.stage !==
        BusinessLifeCycleStage.BUSINESS_READY_VERIFICATION
      ) {
        return { ...milestone };
      }

      return {
        ...milestone,
        actualCompletionDate: this.toDateString(
          new Date(verifiedAt),
        ),
        status: EnterpriseStatus.COMPLETED,
        updatedAt: verifiedAt,
      };
    });

    const complianceRequirements =
      this.plan.compliance.requirements.map((requirement) => {
        const normalizedTitle =
          requirement.title.toLowerCase();

        if (
          !normalizedTitle.includes(
            "business ready verification",
          )
        ) {
          return { ...requirement };
        }

        return {
          ...requirement,
          completed: true,
          completedAt: verifiedAt,
          approvedBy: verifiedBy,
          notes:
            notes ??
            ("notes" in requirement
              ? requirement.notes
              : null),
        };
      });

    const complianceStatus =
      this.calculateComplianceStatus(
        complianceRequirements,
      );

    this.plan = {
      ...this.plan,
      complianceStatus,
      deliverables,
      timeline,
      compliance: {
        ...this.plan.compliance,
        status: complianceStatus,
        requirements: complianceRequirements,
        lastReviewedAt: verifiedAt,
        updatedAt: verifiedAt,
      },
      businessReadyVerifiedAt: verifiedAt,
      businessReadyVerifiedBy: verifiedBy,
      businessReadyVerificationNotes: notes ?? null,
      updatedAt: verifiedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Activates the business at Grand Opening.
   *
   * This method records the opening.
   * The caller must then advance the lifecycle to Quarterly Reporting
   * using advanceStage().
   */
  public openBusiness(
    openedBy: string,
    openingDate?: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    if (
      this.plan.currentStage !==
      BusinessLifeCycleStage.GRAND_OPENING
    ) {
      throw new Error(
        "The business can only be opened during the GRAND_OPENING stage.",
      );
    }

    if (!this.plan.businessReadyVerifiedAt) {
      throw new Error(
        "The business cannot open before Business Ready Verification is completed.",
      );
    }

    const resolvedOpeningDate = openingDate
      ? new Date(openingDate)
      : new Date();

    if (Number.isNaN(resolvedOpeningDate.getTime())) {
      throw new Error(
        "The provided business opening date is invalid.",
      );
    }

    const openedAt = new Date().toISOString();
    const businessOpeningDate =
      this.toDateString(resolvedOpeningDate);

    const timeline = this.plan.timeline.map((milestone) => {
      if (
        milestone.stage !==
        BusinessLifeCycleStage.GRAND_OPENING
      ) {
        return { ...milestone };
      }

      return {
        ...milestone,
        actualCompletionDate: businessOpeningDate,
        status: EnterpriseStatus.COMPLETED,
        updatedAt: openedAt,
      };
    });

    this.plan = {
      ...this.plan,
      status: EnterpriseStatus.ACTIVE,
      businessOpeningDate,
      openedAt,
      openedBy,
      openingNotes: notes ?? null,
      timeline,
      reporting: this.recalculateReportingSchedule(
        businessOpeningDate,
      ),
      updatedAt: openedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Submits one quarterly business report.
   */
  public submitQuarterlyReport(
    quarter: number,
    submittedBy: string,
    reportReference?: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    if (![1, 2, 3, 4].includes(quarter)) {
      throw new Error(
        "Quarter must be 1, 2, 3, or 4.",
      );
    }

    if (
      this.plan.currentStage !==
        BusinessLifeCycleStage.QUARTERLY_REPORTING &&
      this.plan.currentStage !==
  BusinessLifeCycleStage.BUSINESS_GROWTH
    ) {
      throw new Error(
        "Quarterly reports can only be submitted during the QUARTERLY_REPORTING or COMPLETED stage.",
      );
    }

    const reportExists = this.plan.reporting.some(
      (report) => report.quarter === quarter,
    );

    if (!reportExists) {
      throw new Error(
        `Quarter ${quarter} report was not found.`,
      );
    }

    const submittedAt = new Date().toISOString();

    const reporting = this.plan.reporting.map((report) => {
      if (report.quarter !== quarter) {
        return { ...report };
      }

      if (report.submittedAt) {
        throw new Error(
          `Quarter ${quarter} has already been submitted.`,
        );
      }

      return {
        ...report,
        submittedAt,
        submittedBy,
        reportReference: reportReference ?? null,
        notes: notes ?? null,
        status: EnterpriseStatus.COMPLETED,
        updatedAt: submittedAt,
      };
    });

    const allReportsSubmitted = reporting.every(
      (report) => Boolean(report.submittedAt),
    );

    this.plan = {
      ...this.plan,
      reporting,
      updatedAt: submittedAt,
      allQuarterlyReportsSubmittedAt:
        allReportsSubmitted
          ? submittedAt
          : this.plan.allQuarterlyReportsSubmittedAt ??
            null,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Closes a completed launch plan.
   */
  public closeLaunchPlan(
    reason: string,
  ): BusinessLaunchPlan {
    if (
      this.plan.currentStage !==
      BusinessLifeCycleStage.SUCCESS_STORY
    ) {
      throw new Error(
        "A Business Launch Plan can only be closed after reaching the COMPLETED stage.",
      );
    }

    const lifeCycle = new BusinessLifeCycle(
      this.clonePlan(this.plan),
    );

    this.plan = lifeCycle.close(reason);

    return this.getPlan();
  }

  /**
   * Cancels an active or pending launch plan.
   */
  public cancelLaunchPlan(
    reason: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    if (!reason.trim()) {
      throw new Error(
        "A cancellation reason is required.",
      );
    }

    const lifeCycle = new BusinessLifeCycle(
      this.clonePlan(this.plan),
    );

    this.plan = lifeCycle.cancel(reason);

    return this.getPlan();
  }

  /**
   * Returns true when all mandatory compliance requirements
   * have been completed.
   */
  public isCompliant(): boolean {
    return (
      this.plan.complianceStatus ===
      ComplianceStatus.COMPLIANT
    );
  }

  /**
   * Returns true when all required deliverables are completed.
   */
  public areRequiredDeliverablesComplete(): boolean {
    return this.plan.deliverables
      .filter((deliverable) => deliverable.required)
      .every((deliverable) => deliverable.completed);
  }

  /**
   * Returns true when all approved allocations have been released.
   */
  public areAllocationsFullyReleased(): boolean {
    return this.plan.allocations.every((allocation) => {
      const approvedAmount = this.toMoney(
        allocation.approvedAmount,
      );

      const releasedAmount = this.toMoney(
        allocation.releasedAmount ?? 0,
      );

      return releasedAmount >= approvedAmount;
    });
  }

  /**
   * Returns true when all quarterly reports have been submitted.
   */
  public areQuarterlyReportsComplete(): boolean {
    return this.plan.reporting.every(
      (report) => Boolean(report.submittedAt),
    );
  }

  /**
   * Calculates compliance from all mandatory requirements.
   */
  private calculateComplianceStatus(
    requirements: Array<{
      required: boolean;
      completed: boolean;
    }>,
  ): ComplianceStatus {
    const requiredItems = requirements.filter(
      (requirement) => requirement.required,
    );

    if (requiredItems.length === 0) {
      return ComplianceStatus.COMPLIANT;
    }

    const allCompleted = requiredItems.every(
      (requirement) => requirement.completed,
    );

    if (allCompleted) {
      return ComplianceStatus.COMPLIANT;
    }

    return ComplianceStatus.ACTION_REQUIRED;
  }

  /**
   * Rebuilds quarterly due dates from the actual opening date.
   */
  private recalculateReportingSchedule(
    businessOpeningDate: string,
  ) {
    const openingDate = new Date(
      `${businessOpeningDate}T00:00:00.000Z`,
    );

    return this.plan.reporting.map((report) => {
      const quarter = report.quarter;

      const periodStart =
        quarter === 1
          ? openingDate
          : this.addMonths(
              openingDate,
              (quarter - 1) * 3,
            );

      const periodEnd = this.addMonths(
        openingDate,
        quarter * 3,
      );

      return {
        ...report,
        reportingPeriodStart:
          this.toDateString(periodStart),
        reportingPeriodEnd:
          this.toDateString(periodEnd),
        dueDate: this.toDateString(periodEnd),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Detects allocations intended for direct vendor payment.
   */
  private isVendorAllocation(
    allocation: Allocation,
  ): boolean {
    const type = String(
      allocation.type ?? "",
    ).toUpperCase();

    return (
      type.includes("VENDOR") ||
      Boolean(allocation.vendorId) ||
      Boolean(allocation.recipient?.name)
    );
  }

  /**
   * Prevents changes to closed or cancelled launch plans.
   */
  private assertPlanIsOperational(): void {
    if (
      this.plan.status === EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "The Business Launch Plan is closed and cannot be modified.",
      );
    }

    if (
      this.plan.status === EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot be modified.",
      );
    }
  }

  /**
   * Normalizes currency calculations to two decimal places.
   */
  private toMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private addMonths(
    date: Date,
    months: number,
  ): Date {
    const result = new Date(date);

    result.setUTCMonth(
      result.getUTCMonth() + months,
    );

    return result;
  }

  private toDateString(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        "BusinessLaunchEngine received an invalid date.",
      );
    }

    return date.toISOString().split("T")[0];
  }

  /**
   * Prevents external callers from mutating the internal plan.
   */
  private clonePlan(
    plan: BusinessLaunchPlan,
  ): BusinessLaunchPlan {
    if (
      typeof structuredClone === "function"
    ) {
      return structuredClone(plan);
    }

    return JSON.parse(
      JSON.stringify(plan),
    ) as BusinessLaunchPlan;
  }
}