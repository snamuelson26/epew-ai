import {
  BusinessLaunchPlan,
  ComplianceStatus,
  EnterpriseStatus,
} from "./types";

/**
 * Compliance requirement structure used by the Compliance Engine.
 *
 * This local structural type allows the engine to work with the
 * compliance requirements already stored inside BusinessLaunchPlan.
 */
type ComplianceRequirement = {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
  completedAt?: string | null;
  approvedBy?: string | null;
  notes?: string | null;
  dueDate?: string | null;
  status?: EnterpriseStatus;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Compliance review result.
 *
 * Every evaluation returns a clear enterprise decision together with
 * the requirements that caused the decision.
 */
export type ComplianceEvaluation = {
  status: ComplianceStatus;
  totalRequirements: number;
  requiredRequirements: number;
  completedRequirements: number;
  incompleteRequirements: ComplianceRequirement[];
  overdueRequirements: ComplianceRequirement[];
  evaluatedAt: string;
  compliant: boolean;
};

/**
 * ComplianceEngine
 *
 * Evaluates and maintains the compliance state of an EPEW Business
 * Launch Plan.
 *
 * Responsibilities:
 * - evaluate required compliance items,
 * - complete or reopen requirements,
 * - detect overdue requirements,
 * - calculate the official compliance status,
 * - schedule the next compliance review,
 * - preserve existing compliance history.
 *
 * The engine does not:
 * - write to Supabase,
 * - send emails or reminders,
 * - process payments,
 * - advance lifecycle stages,
 * - or modify user-interface state.
 */
export class ComplianceEngine {
  private plan: BusinessLaunchPlan;

  constructor(plan: BusinessLaunchPlan) {
    this.plan = this.clonePlan(plan);
  }

  /**
   * Returns a protected copy of the current plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clonePlan(this.plan);
  }

  /**
   * Evaluates the complete compliance record.
   */
  public evaluate(
    evaluationDate: Date = new Date(),
  ): ComplianceEvaluation {
    this.assertComplianceRecordExists();

    if (Number.isNaN(evaluationDate.getTime())) {
      throw new Error(
        "ComplianceEngine received an invalid evaluation date.",
      );
    }

    const requirements =
      this.getRequirements();

    const requiredRequirements =
      requirements.filter(
        (requirement) => requirement.required,
      );

    const completedRequirements =
      requiredRequirements.filter(
        (requirement) => requirement.completed,
      );

    const incompleteRequirements =
      requiredRequirements.filter(
        (requirement) => !requirement.completed,
      );

    const overdueRequirements =
      incompleteRequirements.filter(
        (requirement) =>
          this.isRequirementOverdue(
            requirement,
            evaluationDate,
          ),
      );

    const status =
      this.determineComplianceStatus(
        requiredRequirements,
        overdueRequirements,
      );

    return {
      status,
      totalRequirements: requirements.length,
      requiredRequirements:
        requiredRequirements.length,
      completedRequirements:
        completedRequirements.length,
      incompleteRequirements:
        incompleteRequirements.map(
          (requirement) => ({
            ...requirement,
          }),
        ),
      overdueRequirements:
        overdueRequirements.map(
          (requirement) => ({
            ...requirement,
          }),
        ),
      evaluatedAt:
        evaluationDate.toISOString(),
      compliant:
        status === ComplianceStatus.COMPLIANT,
    };
  }

  /**
   * Evaluates compliance and applies the result to the launch plan.
   */
  public refreshStatus(
    evaluatedBy?: string,
    reviewNotes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();

    const evaluatedAt =
      new Date().toISOString();

    const evaluation = this.evaluate(
      new Date(evaluatedAt),
    );

    const compliance = this.plan.compliance;

    this.plan = {
      ...this.plan,
      complianceStatus: evaluation.status,
      compliance: {
        ...compliance,
        status: evaluation.status,
        lastReviewedAt: evaluatedAt,
        nextReviewDate:
          this.calculateNextReviewDate(
            new Date(evaluatedAt),
          ),
        evaluatedBy:
          evaluatedBy ??
          this.readOptionalValue(
            compliance,
            "evaluatedBy",
          ),
        reviewNotes:
          reviewNotes ??
          this.readOptionalValue(
            compliance,
            "reviewNotes",
          ),
        updatedAt: evaluatedAt,
      },
      updatedAt: evaluatedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Marks one compliance requirement complete.
   */
  public completeRequirement(
    requirementId: string,
    approvedBy: string,
    notes?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertComplianceRecordExists();

    if (!requirementId.trim()) {
      throw new Error(
        "A compliance requirement ID is required.",
      );
    }

    if (!approvedBy.trim()) {
      throw new Error(
        "The person approving the compliance requirement is required.",
      );
    }

    const requirements =
      this.getRequirements();

    const requirement =
      requirements.find(
        (item) =>
          item.id === requirementId,
      );

    if (!requirement) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    if (requirement.completed) {
      throw new Error(
        `Compliance requirement "${requirementId}" is already complete.`,
      );
    }

    const completedAt =
      new Date().toISOString();

    const updatedRequirements =
      requirements.map((item) => {
        if (item.id !== requirementId) {
          return { ...item };
        }

        return {
          ...item,
          completed: true,
          completedAt,
          approvedBy,
          notes:
            notes ??
            item.notes ??
            null,
          status:
            EnterpriseStatus.COMPLETED,
          updatedAt: completedAt,
        };
      });

    this.applyRequirements(
      updatedRequirements,
      completedAt,
      approvedBy,
    );

    return this.getPlan();
  }

  /**
   * Reopens a previously completed requirement.
   *
   * This is useful when:
   * - a license expires,
   * - insurance lapses,
   * - a document becomes invalid,
   * - or an administrative correction is required.
   */
  public reopenRequirement(
    requirementId: string,
    reopenedBy: string,
    reason: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertComplianceRecordExists();

    if (!reopenedBy.trim()) {
      throw new Error(
        "The person reopening the requirement is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A reason is required to reopen a compliance requirement.",
      );
    }

    const requirements =
      this.getRequirements();

    const requirement =
      requirements.find(
        (item) =>
          item.id === requirementId,
      );

    if (!requirement) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    if (!requirement.completed) {
      throw new Error(
        `Compliance requirement "${requirementId}" is already open.`,
      );
    }

    const reopenedAt =
      new Date().toISOString();

    const updatedRequirements =
      requirements.map((item) => {
        if (item.id !== requirementId) {
          return { ...item };
        }

        return {
          ...item,
          completed: false,
          completedAt: null,
          approvedBy: null,
          notes: reason,
          reopenedBy,
          reopenedAt,
          status:
            EnterpriseStatus.PENDING,
          updatedAt: reopenedAt,
        };
      });

    this.applyRequirements(
      updatedRequirements,
      reopenedAt,
      reopenedBy,
    );

    return this.getPlan();
  }

  /**
   * Updates the due date for a compliance requirement.
   */
  public setRequirementDueDate(
    requirementId: string,
    dueDate: string,
    updatedBy?: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertComplianceRecordExists();

    const parsedDueDate =
      this.parseDate(dueDate);

    const requirements =
      this.getRequirements();

    const requirementExists =
      requirements.some(
        (requirement) =>
          requirement.id ===
          requirementId,
      );

    if (!requirementExists) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    const updatedAt =
      new Date().toISOString();

    const normalizedDueDate =
      this.toDateString(parsedDueDate);

    const updatedRequirements =
      requirements.map((requirement) => {
        if (
          requirement.id !==
          requirementId
        ) {
          return { ...requirement };
        }

        return {
          ...requirement,
          dueDate: normalizedDueDate,
          dueDateUpdatedBy:
            updatedBy ?? null,
          status:
            requirement.completed
              ? EnterpriseStatus.COMPLETED
              : EnterpriseStatus.PENDING,
          updatedAt,
        };
      });

    this.applyRequirements(
      updatedRequirements,
      updatedAt,
      updatedBy,
    );

    return this.getPlan();
  }

  /**
   * Adds a new compliance requirement.
   */
  public addRequirement(input: {
    title: string;
    required?: boolean;
    dueDate?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  }): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertComplianceRecordExists();

    if (!input.title.trim()) {
      throw new Error(
        "A compliance requirement title is required.",
      );
    }

    const requirements =
      this.getRequirements();

    const duplicate =
      requirements.some(
        (requirement) =>
          requirement.title
            .trim()
            .toLowerCase() ===
          input.title
            .trim()
            .toLowerCase(),
      );

    if (duplicate) {
      throw new Error(
        `A compliance requirement named "${input.title}" already exists.`,
      );
    }

    const createdAt =
      new Date().toISOString();

    const dueDate =
      input.dueDate
        ? this.toDateString(
            this.parseDate(
              input.dueDate,
            ),
          )
        : null;

    const requirement: ComplianceRequirement =
      {
        id: this.generateRequirementId(),
        title: input.title.trim(),
        required:
          input.required ?? true,
        completed: false,
        completedAt: null,
        approvedBy: null,
        notes:
          input.notes ?? null,
        dueDate,
        status:
          EnterpriseStatus.PENDING,
        createdAt,
        updatedAt: createdAt,
      };

    const requirementWithCreator = {
      ...requirement,
      createdBy:
        input.createdBy ?? null,
    };

    const updatedRequirements = [
      ...requirements.map(
        (item) => ({ ...item }),
      ),
      requirementWithCreator,
    ];

    this.applyRequirements(
      updatedRequirements,
      createdAt,
      input.createdBy ?? undefined,
    );

    return this.getPlan();
  }

  /**
   * Removes a non-completed compliance requirement.
   *
   * Completed compliance history cannot be deleted.
   */
  public removeRequirement(
    requirementId: string,
    removedBy: string,
    reason: string,
  ): BusinessLaunchPlan {
    this.assertPlanIsOperational();
    this.assertComplianceRecordExists();

    if (!removedBy.trim()) {
      throw new Error(
        "The person removing the requirement is required.",
      );
    }

    if (!reason.trim()) {
      throw new Error(
        "A reason is required to remove a compliance requirement.",
      );
    }

    const requirements =
      this.getRequirements();

    const requirement =
      requirements.find(
        (item) =>
          item.id === requirementId,
      );

    if (!requirement) {
      throw new Error(
        `Compliance requirement "${requirementId}" was not found.`,
      );
    }

    if (requirement.completed) {
      throw new Error(
        "Completed compliance requirements cannot be removed because they are part of the immutable operational history.",
      );
    }

    const removedAt =
      new Date().toISOString();

    const updatedRequirements =
      requirements.filter(
        (item) =>
          item.id !== requirementId,
      );

    const existingHistory =
      this.readArrayValue(
        this.plan.compliance,
        "requirementHistory",
      );

    const requirementHistory = [
      ...existingHistory,
      {
        action: "REMOVED",
        requirement: {
          ...requirement,
        },
        removedBy,
        reason,
        removedAt,
      },
    ];

    const evaluation =
      this.evaluateRequirements(
        updatedRequirements,
        new Date(removedAt),
      );

    this.plan = {
      ...this.plan,
      complianceStatus:
        evaluation.status,
      compliance: {
        ...this.plan.compliance,
        status:
          evaluation.status,
        requirements:
          updatedRequirements,
        requirementHistory,
        lastReviewedAt:
          removedAt,
        nextReviewDate:
          this.calculateNextReviewDate(
            new Date(removedAt),
          ),
        updatedAt: removedAt,
      },
      updatedAt: removedAt,
    } as BusinessLaunchPlan;

    return this.getPlan();
  }

  /**
   * Returns all incomplete mandatory requirements.
   */
  public getIncompleteRequirements():
    ComplianceRequirement[] {
    return this.getRequirements()
      .filter(
        (requirement) =>
          requirement.required &&
          !requirement.completed,
      )
      .map(
        (requirement) => ({
          ...requirement,
        }),
      );
  }

  /**
   * Returns all overdue mandatory requirements.
   */
  public getOverdueRequirements(
    asOf: Date = new Date(),
  ): ComplianceRequirement[] {
    if (Number.isNaN(asOf.getTime())) {
      throw new Error(
        "ComplianceEngine received an invalid overdue-review date.",
      );
    }

    return this.getRequirements()
      .filter(
        (requirement) =>
          requirement.required &&
          !requirement.completed &&
          this.isRequirementOverdue(
            requirement,
            asOf,
          ),
      )
      .map(
        (requirement) => ({
          ...requirement,
        }),
      );
  }

  /**
   * Returns compliance requirements due within a selected number of days.
   */
  public getRequirementsDueWithin(
    days: number,
    asOf: Date = new Date(),
  ): ComplianceRequirement[] {
    if (
      !Number.isInteger(days) ||
      days < 0
    ) {
      throw new Error(
        "The number of days must be a non-negative integer.",
      );
    }

    if (Number.isNaN(asOf.getTime())) {
      throw new Error(
        "ComplianceEngine received an invalid review date.",
      );
    }

    const deadline =
      this.addDays(asOf, days);

    return this.getRequirements()
      .filter((requirement) => {
        if (
          requirement.completed ||
          !requirement.dueDate
        ) {
          return false;
        }

        const dueDate =
          this.parseDate(
            requirement.dueDate,
          );

        return (
          dueDate.getTime() >=
            this.startOfUtcDay(
              asOf,
            ).getTime() &&
          dueDate.getTime() <=
            this.endOfUtcDay(
              deadline,
            ).getTime()
        );
      })
      .map(
        (requirement) => ({
          ...requirement,
        }),
      );
  }

  /**
   * Returns true only when the official compliance status is compliant.
   */
  public isCompliant(): boolean {
    return (
      this.evaluate().status ===
      ComplianceStatus.COMPLIANT
    );
  }

  /**
   * Applies a modified requirement set and recalculates compliance.
   */
  private applyRequirements(
    requirements: ComplianceRequirement[],
    updatedAt: string,
    evaluatedBy?: string,
  ): void {
    const evaluation =
      this.evaluateRequirements(
        requirements,
        new Date(updatedAt),
      );

    this.plan = {
      ...this.plan,
      complianceStatus:
        evaluation.status,
      compliance: {
        ...this.plan.compliance,
        status:
          evaluation.status,
        requirements,
        lastReviewedAt:
          updatedAt,
        nextReviewDate:
          this.calculateNextReviewDate(
            new Date(updatedAt),
          ),
        evaluatedBy:
          evaluatedBy ??
          this.readOptionalValue(
            this.plan.compliance,
            "evaluatedBy",
          ),
        updatedAt,
      },
      updatedAt,
    } as BusinessLaunchPlan;
  }

  /**
   * Evaluates a supplied requirement collection.
   */
  private evaluateRequirements(
    requirements: ComplianceRequirement[],
    evaluationDate: Date,
  ): ComplianceEvaluation {
    const requiredRequirements =
      requirements.filter(
        (requirement) =>
          requirement.required,
      );

    const completedRequirements =
      requiredRequirements.filter(
        (requirement) =>
          requirement.completed,
      );

    const incompleteRequirements =
      requiredRequirements.filter(
        (requirement) =>
          !requirement.completed,
      );

    const overdueRequirements =
      incompleteRequirements.filter(
        (requirement) =>
          this.isRequirementOverdue(
            requirement,
            evaluationDate,
          ),
      );

    const status =
      this.determineComplianceStatus(
        requiredRequirements,
        overdueRequirements,
      );

    return {
      status,
      totalRequirements:
        requirements.length,
      requiredRequirements:
        requiredRequirements.length,
      completedRequirements:
        completedRequirements.length,
      incompleteRequirements,
      overdueRequirements,
      evaluatedAt:
        evaluationDate.toISOString(),
      compliant:
        status ===
        ComplianceStatus.COMPLIANT,
    };
  }

  /**
   * Enterprise compliance rules:
   *
   * COMPLIANT
   * All mandatory requirements are complete.
   *
   * NON_COMPLIANT
   * One or more mandatory requirements are overdue.
   *
   * ACTION_REQUIRED
   * Mandatory requirements remain incomplete but are not overdue.
   */
  private determineComplianceStatus(
    requiredRequirements:
      ComplianceRequirement[],
    overdueRequirements:
      ComplianceRequirement[],
  ): ComplianceStatus {
    if (
      requiredRequirements.length === 0
    ) {
      return ComplianceStatus.COMPLIANT;
    }

    const allCompleted =
      requiredRequirements.every(
        (requirement) =>
          requirement.completed,
      );

    if (allCompleted) {
      return ComplianceStatus.COMPLIANT;
    }

    if (
      overdueRequirements.length > 0
    ) {
      return ComplianceStatus.NON_COMPLIANT;
    }

    return ComplianceStatus.ACTION_REQUIRED;
  }

  private getRequirements():
    ComplianceRequirement[] {
    this.assertComplianceRecordExists();

    return (
      this.plan.compliance
        .requirements as ComplianceRequirement[]
    ).map(
      (requirement) => ({
        ...requirement,
      }),
    );
  }

  private isRequirementOverdue(
    requirement: ComplianceRequirement,
    asOf: Date,
  ): boolean {
    if (
      requirement.completed ||
      !requirement.dueDate
    ) {
      return false;
    }

    const dueDate =
      this.parseDate(
        requirement.dueDate,
      );

    return (
      this.endOfUtcDay(
        dueDate,
      ).getTime() <
      this.startOfUtcDay(
        asOf,
      ).getTime()
    );
  }

  /**
   * Default compliance review occurs every 30 days.
   */
  private calculateNextReviewDate(
    reviewedAt: Date,
  ): string {
    return this.toDateString(
      this.addDays(
        reviewedAt,
        30,
      ),
    );
  }

  private assertComplianceRecordExists(): void {
    if (
      !this.plan.compliance ||
      !Array.isArray(
        this.plan.compliance
          .requirements,
      )
    ) {
      throw new Error(
        "The Business Launch Plan does not contain a valid compliance record.",
      );
    }
  }

  private assertPlanIsOperational(): void {
    if (
      this.plan.status ===
      EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "The Business Launch Plan is closed and cannot be modified.",
      );
    }

    if (
      this.plan.status ===
      EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "The Business Launch Plan is cancelled and cannot be modified.",
      );
    }
  }

  private generateRequirementId(): string {
    const year =
      new Date().getUTCFullYear();

    const randomCode =
      this.generateRandomCode(8);

    return `COMPLIANCE-${year}-${randomCode}`;
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

  private addDays(
    date: Date,
    days: number,
  ): Date {
    const result =
      new Date(date);

    result.setUTCDate(
      result.getUTCDate() +
        days,
    );

    return result;
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
    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        "ComplianceEngine received an invalid date.",
      );
    }

    return date
      .toISOString()
      .split("T")[0];
  }

  private readOptionalValue(
    source: unknown,
    property: string,
  ): unknown {
    if (
      typeof source !== "object" ||
      source === null
    ) {
      return null;
    }

    return (
      source as Record<
        string,
        unknown
      >
    )[property] ?? null;
  }

  private readArrayValue(
    source: unknown,
    property: string,
  ): unknown[] {
    const value =
      this.readOptionalValue(
        source,
        property,
      );

    return Array.isArray(value)
      ? [...value]
      : [];
  }

  private clonePlan(
    plan: BusinessLaunchPlan,
  ): BusinessLaunchPlan {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(
        plan,
      );
    }

    return JSON.parse(
      JSON.stringify(plan),
    ) as BusinessLaunchPlan;
  }
}