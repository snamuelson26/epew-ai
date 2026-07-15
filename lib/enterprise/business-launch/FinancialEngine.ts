import {
  Allocation,
  AllocationCategory,
  AllocationType,
  BusinessLaunchPlan,
  EnterpriseStatus,
} from "./types";

/**
 * Enterprise payment transaction.
 *
 * Every financial movement is recorded.
 * Nothing is ever deleted.
 */
export interface FinancialTransaction {
  id: string;

  allocationId: string;
  businessId: string;

  type:
    | "AUTHORIZATION"
    | "VENDOR_PAYMENT"
    | "WORKING_CAPITAL"
    | "REVERSAL";

  amount: number;

  reference: string | null;

  vendorId: string | null;
  vendorName: string | null;

  approvedBy: string;

  notes: string | null;

  createdAt: string;
}

/**
 * Enterprise Financial Summary
 */
export interface FinancialSummary {
  approvedAmount: number;
  releasedAmount: number;
  remainingAmount: number;

  allocationCount: number;

  vendorPayments: number;

  workingCapitalReleased: number;

  completionPercentage: number;
}

/**
 * Enterprise Financial Engine
 *
 * Responsible ONLY for financial policy.
 *
 * Never:
 * - Stripe
 * - Database
 * - Email
 * - UI
 */
export class FinancialEngine {
  private readonly plan: BusinessLaunchPlan;

  private readonly transactions: FinancialTransaction[];

  constructor(
    plan: BusinessLaunchPlan,
    transactions: FinancialTransaction[] = [],
  ) {
    this.plan = this.clone(plan);
    this.transactions = [...transactions];
  }

  /**
   * Returns all financial transactions.
   */
  public getTransactions(): FinancialTransaction[] {
    return this.clone(this.transactions);
  }

  /**
   * Returns a safe copy of the plan.
   */
  public getPlan(): BusinessLaunchPlan {
    return this.clone(this.plan);
  }

  /**
   * Authorizes an allocation before release.
   */
  public authorizeAllocation(
    allocationId: string,
    approvedBy: string,
    notes?: string,
  ): Allocation {
    const allocation =
      this.findAllocation(allocationId);

    this.ensureOperational();

    return {
      ...allocation,
      status: EnterpriseStatus.ACTIVE,
      authorizedBy: approvedBy,
      authorizedAt:
        new Date().toISOString(),
      authorizationNotes:
        notes ?? null,
    } as Allocation;
  }

  /**
   * Releases payment directly to a vendor.
   */
  public releaseVendorPayment(
    allocationId: string,
    amount: number,
    approvedBy: string,
    reference: string,
  ) {
    const allocation =
      this.findAllocation(allocationId);

    if (
      allocation.type !==
      AllocationType.VENDOR_PAYMENT
    ) {
      throw new Error(
        "Allocation is not a vendor payment.",
      );
    }

    this.validateRelease(
      allocation,
      amount,
    );

    return this.recordTransaction(
      allocation,
      amount,
      "VENDOR_PAYMENT",
      approvedBy,
      reference,
    );
  }

  /**
   * Releases working capital.
   */
  public releaseWorkingCapital(
    allocationId: string,
    amount: number,
    approvedBy: string,
    reference: string,
  ) {
    const allocation =
      this.findAllocation(allocationId);

    if (
      allocation.category !==
      AllocationCategory.WORKING_CAPITAL
    ) {
      throw new Error(
        "Allocation is not Working Capital.",
      );
    }

    this.validateRelease(
      allocation,
      amount,
    );

    return this.recordTransaction(
      allocation,
      amount,
      "WORKING_CAPITAL",
      approvedBy,
      reference,
    );
  }

  /**
   * Generic payment recording.
   */
  public recordPayment(
    allocationId: string,
    amount: number,
    approvedBy: string,
    reference: string,
  ) {
    const allocation =
      this.findAllocation(allocationId);

    this.validateRelease(
      allocation,
      amount,
    );

    return this.recordTransaction(
      allocation,
      amount,
      "VENDOR_PAYMENT",
      approvedBy,
      reference,
    );
  }

  /**
   * Reverses a payment.
   */
  public reversePayment(
    allocationId: string,
    amount: number,
    approvedBy: string,
    reason: string,
  ): FinancialTransaction {
    const allocation =
      this.findAllocation(allocationId);

    return {
      id: this.id(),

      allocationId,

      businessId:
        allocation.businessId,

      type: "REVERSAL",

      amount,

      reference: null,

      vendorId:
        allocation.vendorId ?? null,

      vendorName:
        allocation.recipient?.name ??
        null,

      approvedBy,

      notes: reason,

      createdAt:
        new Date().toISOString(),
    };
  }

  /**
   * Remaining balance.
   */
  public getRemainingBalance(
    allocationId: string,
  ): number {
    const allocation =
      this.findAllocation(allocationId);

    return (
      allocation.approvedAmount -
      allocation.releasedAmount
    );
  }

  /**
   * Returns true if every allocation
   * has been fully released.
   */
  public isFullyReleased(): boolean {
    return this.plan.allocations.every(
      (allocation) =>
        allocation.releasedAmount >=
        allocation.approvedAmount,
    );
  }

  /**
   * Enterprise financial summary.
   */
  public getFinancialSummary(): FinancialSummary {
    const approved =
      this.plan.allocations.reduce(
        (sum, allocation) =>
          sum +
          allocation.approvedAmount,
        0,
      );

    const released =
      this.plan.allocations.reduce(
        (sum, allocation) =>
          sum +
          allocation.releasedAmount,
        0,
      );

    const remaining =
      approved - released;

    const vendorPayments =
      this.transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "VENDOR_PAYMENT",
        )
        .reduce(
          (sum, transaction) =>
            sum +
            transaction.amount,
          0,
        );

    const workingCapital =
      this.transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "WORKING_CAPITAL",
        )
        .reduce(
          (sum, transaction) =>
            sum +
            transaction.amount,
          0,
        );

    return {
      approvedAmount: approved,

      releasedAmount: released,

      remainingAmount: remaining,

      allocationCount:
        this.plan.allocations.length,

      vendorPayments,

      workingCapitalReleased:
        workingCapital,

      completionPercentage:
        approved === 0
          ? 0
          : Number(
              (
                (released /
                  approved) *
                100
              ).toFixed(2),
            ),
    };
  }

  /**
   * Finds allocation.
   */
  private findAllocation(
    id: string,
  ): Allocation {
    const allocation =
      this.plan.allocations.find(
        (item) => item.id === id,
      );

    if (!allocation) {
      throw new Error(
        `Allocation ${id} not found.`,
      );
    }

    return allocation;
  }

  /**
   * Validates release.
   */
  private validateRelease(
    allocation: Allocation,
    amount: number,
  ) {
    if (amount <= 0) {
      throw new Error(
        "Release amount must be greater than zero.",
      );
    }

    if (
      allocation.releasedAmount +
        amount >
      allocation.approvedAmount
    ) {
      throw new Error(
        "Release exceeds approved allocation.",
      );
    }
  }

  /**
   * Creates payment transaction.
   */
  private recordTransaction(
    allocation: Allocation,
    amount: number,
    type: FinancialTransaction["type"],
    approvedBy: string,
    reference: string,
  ): FinancialTransaction {
    return {
      id: this.id(),

      allocationId:
        allocation.id,

      businessId:
        allocation.businessId,

      type,

      amount,

      reference,

      vendorId:
        allocation.vendorId ??
        null,

      vendorName:
  allocation.recipient?.name ??
  null,

      approvedBy,

      notes: null,

      createdAt:
        new Date().toISOString(),
    };
  }

  /**
   * Operational validation.
   */
  private ensureOperational() {
    if (
      this.plan.status ===
      EnterpriseStatus.CLOSED
    ) {
      throw new Error(
        "Launch Plan is closed.",
      );
    }

    if (
      this.plan.status ===
      EnterpriseStatus.CANCELLED
    ) {
      throw new Error(
        "Launch Plan is cancelled.",
      );
    }
  }

  /**
   * Enterprise identifier.
   */
  private id(): string {
    return (
      crypto.randomUUID?.() ??
      `TX-${Date.now()}`
    );
  }

  /**
   * Safe clone.
   */
  private clone<T>(
    value: T,
  ): T {
    return structuredClone
      ? structuredClone(value)
      : JSON.parse(
          JSON.stringify(value),
        );
  }
}