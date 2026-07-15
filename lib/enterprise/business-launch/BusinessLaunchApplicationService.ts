import {
  Business,
  BusinessId,
  BusinessLaunchPlan,
  FundingApproval,
  LaunchId,
  StageResult,
} from "./types";

import {
  BusinessLaunchEngine,
} from "./BusinessLaunchEngine";

import {
  ComplianceEngine,
} from "./ComplianceEngine";

import {
  FinancialEngine,
  FinancialTransaction,
} from "./FinancialEngine";

import {
  ReportingEngine,
  QuarterlyReportSubmission,
} from "./ReportingEngine";

import {
  BusinessRegistryEngine,
  RegisterRegistryItemInput,
  RegistryHistoryEntry,
  RegistryItem,
  RenewRegistryItemInput,
} from "./BusinessRegistryEngine";

import {
  CommunicationEngine,
  CommunicationHistoryEntry,
  CommunicationMessage,
  CreateCommunicationInput,
} from "./CommunicationEngine";

import {
  CoachMeetingRecord,
  CreateGrowthMilestoneInput,
  GrowthEngine,
  GrowthMetricRecord,
  GrowthMilestone,
  RecordCoachMeetingInput,
  RecordGrowthMetricInput,
} from "./GrowthEngine";

import {
  BusinessLaunchUnitOfWork,
  ComplianceRecord,
  RepositoryTransactionContext,
} from "./repositories";

/**
 * ============================================================
 * APPLICATION SERVICE RESULT TYPES
 * ============================================================
 */

export interface LaunchPlanWithFinancialTransactions {
  plan: BusinessLaunchPlan;
  transactions: FinancialTransaction[];
}

export interface LaunchPlanWithRegistry {
  plan: BusinessLaunchPlan;
  registry: RegistryItem[];
  history: RegistryHistoryEntry[];
}

export interface LaunchPlanWithCommunications {
  plan: BusinessLaunchPlan;
  messages: CommunicationMessage[];
  history: CommunicationHistoryEntry[];
}

export interface LaunchPlanWithGrowth {
  plan: BusinessLaunchPlan;
  metrics: GrowthMetricRecord[];
  coachMeetings: CoachMeetingRecord[];
  milestones: GrowthMilestone[];
}

/**
 * ============================================================
 * BUSINESS LAUNCH APPLICATION SERVICE
 * ============================================================
 *
 * This service connects:
 *
 * Application / API Route
 *          │
 *          ▼
 * BusinessLaunchApplicationService
 *          │
 *          ├── EOS Engines
 *          │
 *          └── Repository Interfaces
 *
 * Responsibilities:
 *
 * - load persisted enterprise state,
 * - instantiate the correct EOS engine,
 * - execute one business operation,
 * - save the resulting state,
 * - append immutable history,
 * - coordinate multiple repositories,
 * - provide one application-level entry point.
 *
 * This service does not:
 *
 * - contain duplicated business rules,
 * - call Supabase directly,
 * - call Stripe directly,
 * - send email or SMS,
 * - render user-interface components.
 */
export class BusinessLaunchApplicationService {
  constructor(
    private readonly unitOfWork: BusinessLaunchUnitOfWork,
  ) {}

  /**
   * ============================================================
   * LAUNCH PLAN
   * ============================================================
   */

  /**
   * Creates and persists a new Business Launch Plan.
   */
  public async createLaunchPlan(
    business: Business,
    approval: FundingApproval,
  ): Promise<BusinessLaunchPlan> {
    const existingPlan =
      await this.unitOfWork.launchPlans.findByBusinessId(
        business.id as BusinessId,
      );

    if (existingPlan) {
      throw new BusinessLaunchApplicationError({
        operation: "createLaunchPlan",
        message:
          "An active Business Launch Plan already exists for this business.",
      });
    }

    const plan =
      BusinessLaunchEngine.createLaunchPlan(
        business,
        approval,
      );

    return this.unitOfWork.runInTransaction(
      async (context) => {
        const savedPlan =
          await this.unitOfWork.launchPlans.create(
            plan,
            context,
          );

        const complianceRecord =
          this.createComplianceProjection(
            savedPlan,
          );

        await this.unitOfWork.complianceRecords.save(
          complianceRecord,
          context,
        );

        return savedPlan;
      },
    );
  }

  /**
   * Returns one launch plan.
   */
  public async getLaunchPlan(
    launchPlanId: LaunchId,
  ): Promise<BusinessLaunchPlan> {
    return this.requireLaunchPlan(
      launchPlanId,
    );
  }

  /**
   * Returns the launch plan associated with one business.
   */
  public async getLaunchPlanByBusinessId(
    businessId: BusinessId,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.unitOfWork.launchPlans.findByBusinessId(
        businessId,
      );

    if (!plan) {
      throw new BusinessLaunchApplicationError({
        operation:
          "getLaunchPlanByBusinessId",
        message:
          `No Business Launch Plan was found for business "${String(
            businessId,
          )}".`,
      });
    }

    return plan;
  }

  /**
   * Advances the official lifecycle stage.
   */
  public async advanceStage(
    launchPlanId: LaunchId,
    result: StageResult,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      engine.advanceStage(result);

    return this.unitOfWork.launchPlans.save(
      updatedPlan,
    );
  }

  /**
   * Verifies business readiness.
   */
  public async verifyBusinessReady(
    launchPlanId: LaunchId,
    verifiedBy: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      engine.verifyBusinessReady(
        verifiedBy,
        notes,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * Records the official opening of the business.
   */
  public async openBusiness(
    launchPlanId: LaunchId,
    openedBy: string,
    openingDate?: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      engine.openBusiness(
        openedBy,
        openingDate,
        notes,
      );

    return this.unitOfWork.launchPlans.save(
      updatedPlan,
    );
  }

  /**
   * Closes a completed launch plan.
   */
  public async closeLaunchPlan(
    launchPlanId: LaunchId,
    reason: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      engine.closeLaunchPlan(reason);

    return this.unitOfWork.launchPlans.save(
      updatedPlan,
    );
  }

  /**
   * Cancels a launch plan.
   */
  public async cancelLaunchPlan(
    launchPlanId: LaunchId,
    reason: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      engine.cancelLaunchPlan(reason);

    return this.unitOfWork.launchPlans.save(
      updatedPlan,
    );
  }

  /**
   * ============================================================
   * COMPLIANCE
   * ============================================================
   */

  /**
   * Completes one compliance requirement.
   */
  public async completeComplianceRequirement(
    launchPlanId: LaunchId,
    requirementId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ComplianceEngine(plan);

    const updatedPlan =
      engine.completeRequirement(
        requirementId,
        approvedBy,
        notes,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * Reopens one compliance requirement.
   */
  public async reopenComplianceRequirement(
    launchPlanId: LaunchId,
    requirementId: string,
    reopenedBy: string,
    reason: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ComplianceEngine(plan);

    const updatedPlan =
      engine.reopenRequirement(
        requirementId,
        reopenedBy,
        reason,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * Refreshes the official compliance status.
   */
  public async refreshCompliance(
    launchPlanId: LaunchId,
    evaluatedBy?: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ComplianceEngine(plan);

    const updatedPlan =
      engine.refreshStatus(
        evaluatedBy,
        notes,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * ============================================================
   * FINANCE
   * ============================================================
   */

  /**
   * Releases an approved vendor payment.
   *
   * The Financial Engine validates and creates the immutable
   * financial transaction.
   *
   * The Business Launch Engine updates the allocation balance.
   */
  public async releaseVendorPayment(
    launchPlanId: LaunchId,
    allocationId: string,
    amount: number,
    approvedBy: string,
    reference: string,
  ): Promise<LaunchPlanWithFinancialTransactions> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingTransactions =
      await this.loadAllFinancialTransactions(
        plan.businessId,
      );

    const financialEngine =
      new FinancialEngine(
        plan,
        existingTransactions,
      );

    const transaction =
      financialEngine.releaseVendorPayment(
        allocationId,
        amount,
        approvedBy,
        reference,
      );

    const launchEngine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      launchEngine.releaseAllocation(
        allocationId,
        amount,
        approvedBy,
        reference,
      );

    return this.unitOfWork.runInTransaction(
      async (context) => {
        const savedTransaction =
          await this.unitOfWork.financialTransactions.append(
            transaction,
            context,
          );

        const savedPlan =
          await this.unitOfWork.launchPlans.save(
            updatedPlan,
            context,
          );

        return {
          plan: savedPlan,
          transactions: [
            ...existingTransactions,
            savedTransaction,
          ],
        };
      },
    );
  }

  /**
   * Releases approved working capital.
   */
  public async releaseWorkingCapital(
    launchPlanId: LaunchId,
    allocationId: string,
    amount: number,
    approvedBy: string,
    reference: string,
  ): Promise<LaunchPlanWithFinancialTransactions> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingTransactions =
      await this.loadAllFinancialTransactions(
        plan.businessId,
      );

    const financialEngine =
      new FinancialEngine(
        plan,
        existingTransactions,
      );

    const transaction =
      financialEngine.releaseWorkingCapital(
        allocationId,
        amount,
        approvedBy,
        reference,
      );

    const launchEngine =
      new BusinessLaunchEngine(plan);

    const updatedPlan =
      launchEngine.releaseAllocation(
        allocationId,
        amount,
        approvedBy,
        reference,
      );

    return this.unitOfWork.runInTransaction(
      async (context) => {
        const savedTransaction =
          await this.unitOfWork.financialTransactions.append(
            transaction,
            context,
          );

        const savedPlan =
          await this.unitOfWork.launchPlans.save(
            updatedPlan,
            context,
          );

        return {
          plan: savedPlan,
          transactions: [
            ...existingTransactions,
            savedTransaction,
          ],
        };
      },
    );
  }

  /**
   * Records a financial reversal.
   *
   * Reversals are appended as new records.
   * Original transactions are never deleted.
   */
  public async reversePayment(
    launchPlanId: LaunchId,
    allocationId: string,
    amount: number,
    approvedBy: string,
    reason: string,
  ): Promise<FinancialTransaction> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const transactions =
      await this.loadAllFinancialTransactions(
        plan.businessId,
      );

    const engine =
      new FinancialEngine(
        plan,
        transactions,
      );

    const reversal =
      engine.reversePayment(
        allocationId,
        amount,
        approvedBy,
        reason,
      );

    return this.unitOfWork.financialTransactions.append(
      reversal,
    );
  }

  /**
   * ============================================================
   * QUARTERLY REPORTING
   * ============================================================
   */

  /**
   * Submits one quarterly report.
   */
  public async submitQuarterlyReport(
    launchPlanId: LaunchId,
    quarter: number,
    submittedBy: string,
    submission: QuarterlyReportSubmission,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ReportingEngine(plan);

    const updatedPlan =
      engine.submitReport(
        quarter,
        submittedBy,
        submission,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * Reviews one quarterly report.
   */
  public async reviewQuarterlyReport(
    launchPlanId: LaunchId,
    quarter: number,
    reviewedBy: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ReportingEngine(plan);

    const updatedPlan =
      engine.reviewReport(
        quarter,
        reviewedBy,
        notes,
      );

    return this.unitOfWork.launchPlans.save(
      updatedPlan,
    );
  }

  /**
   * Approves one quarterly report.
   */
  public async approveQuarterlyReport(
    launchPlanId: LaunchId,
    quarter: number,
    approvedBy: string,
    notes?: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ReportingEngine(plan);

    const updatedPlan =
      engine.approveReport(
        quarter,
        approvedBy,
        notes,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * Rejects one quarterly report.
   */
  public async rejectQuarterlyReport(
    launchPlanId: LaunchId,
    quarter: number,
    rejectedBy: string,
    reason: string,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const engine =
      new ReportingEngine(plan);

    const updatedPlan =
      engine.rejectReport(
        quarter,
        rejectedBy,
        reason,
      );

    return this.savePlanAndCompliance(
      updatedPlan,
    );
  }

  /**
   * ============================================================
   * BUSINESS REGISTRY
   * ============================================================
   */

  /**
   * Registers a new business registry item.
   */
  public async registerRegistryItem(
    launchPlanId: LaunchId,
    input: RegisterRegistryItemInput,
  ): Promise<LaunchPlanWithRegistry> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingRegistry =
      await this.loadAllRegistryItems(
        plan.businessId,
      );

    const engine =
      new BusinessRegistryEngine(
        plan,
        existingRegistry,
        [],
      );

    const item =
      engine.registerItem(input);

    const updatedPlan =
      engine.getPlan();

    const newHistory =
      engine.getHistory();

    return this.unitOfWork.runInTransaction(
      async (context) => {
        await this.unitOfWork.registry.saveItem(
          item,
          context,
        );

        await this.appendRegistryHistory(
          newHistory,
          context,
        );

        const savedPlan =
          await this.unitOfWork.launchPlans.save(
            updatedPlan,
            context,
          );

        return {
          plan: savedPlan,
          registry:
            engine.getAllRegistryItems(),
          history: newHistory,
        };
      },
    );
  }

  /**
   * Verifies one registry item.
   */
  public async verifyRegistryItem(
    launchPlanId: LaunchId,
    registryItemId: string,
    verifiedBy: string,
    notes?: string,
  ): Promise<LaunchPlanWithRegistry> {
    return this.executeRegistryMutation(
      launchPlanId,
      (engine) =>
        engine.verifyItem(
          registryItemId,
          verifiedBy,
          notes,
        ),
    );
  }

  /**
   * Renews one registry item.
   */
  public async renewRegistryItem(
    launchPlanId: LaunchId,
    registryItemId: string,
    input: RenewRegistryItemInput,
  ): Promise<LaunchPlanWithRegistry> {
    return this.executeRegistryMutation(
      launchPlanId,
      (engine) =>
        engine.renewItem(
          registryItemId,
          input,
        ),
    );
  }

  /**
   * Reopens one registry item.
   */
  public async reopenRegistryItem(
    launchPlanId: LaunchId,
    registryItemId: string,
    reopenedBy: string,
    reason: string,
  ): Promise<LaunchPlanWithRegistry> {
    return this.executeRegistryMutation(
      launchPlanId,
      (engine) =>
        engine.reopenItem(
          registryItemId,
          reopenedBy,
          reason,
        ),
    );
  }

  /**
   * ============================================================
   * COMMUNICATION
   * ============================================================
   */

  /**
   * Creates a draft enterprise communication.
   */
  public async createCommunication(
    launchPlanId: LaunchId,
    input: CreateCommunicationInput,
  ): Promise<LaunchPlanWithCommunications> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingMessages =
      await this.loadAllCommunicationMessages(
        plan.businessId,
      );

    const engine =
      new CommunicationEngine(
        plan,
        existingMessages,
        [],
      );

    const message =
      engine.createMessage(input);

    const history =
      engine.getHistory();

    return this.unitOfWork.runInTransaction(
      async (context) => {
        await this.unitOfWork.communications.saveMessage(
          message,
          context,
        );

        await this.appendCommunicationHistory(
          history,
          context,
        );

        return {
          plan,
          messages:
            engine.getMessages(),
          history,
        };
      },
    );
  }

  /**
   * Queues one communication.
   */
  public async queueCommunication(
    launchPlanId: LaunchId,
    messageId: string,
    queuedBy: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.queueMessage(
          messageId,
          queuedBy,
        ),
    );
  }

  /**
   * Marks one communication as sent.
   */
  public async markCommunicationSent(
    launchPlanId: LaunchId,
    messageId: string,
    sentBy: string,
    externalReference?: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.sendMessage(
          messageId,
          sentBy,
          externalReference,
        ),
    );
  }

  /**
   * Marks one communication as delivered.
   */
  public async markCommunicationDelivered(
    launchPlanId: LaunchId,
    messageId: string,
    deliveredBy?: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.deliverMessage(
          messageId,
          deliveredBy,
        ),
    );
  }

  /**
   * Marks one communication as read.
   */
  public async markCommunicationRead(
    launchPlanId: LaunchId,
    messageId: string,
    readBy?: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.markRead(
          messageId,
          readBy,
        ),
    );
  }

  /**
   * Records a communication failure.
   */
  public async markCommunicationFailed(
    launchPlanId: LaunchId,
    messageId: string,
    reason: string,
    failedBy?: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.markFailed(
          messageId,
          reason,
          failedBy,
        ),
    );
  }

  /**
   * Cancels one draft or queued communication.
   */
  public async cancelCommunication(
    launchPlanId: LaunchId,
    messageId: string,
    cancelledBy: string,
    reason: string,
  ): Promise<LaunchPlanWithCommunications> {
    return this.executeCommunicationMutation(
      launchPlanId,
      (engine) =>
        engine.cancelMessage(
          messageId,
          cancelledBy,
          reason,
        ),
    );
  }

  /**
   * ============================================================
   * GROWTH
   * ============================================================
   */

  /**
   * Records one growth KPI.
   */
  public async recordGrowthMetric(
    launchPlanId: LaunchId,
    input: RecordGrowthMetricInput,
  ): Promise<GrowthMetricRecord> {
    const state =
      await this.loadGrowthState(
        launchPlanId,
      );

    const engine =
      new GrowthEngine(
        state.plan,
        state.metrics,
        state.coachMeetings,
        state.milestones,
      );

    const metric =
      engine.recordMetric(input);

    return this.unitOfWork.growthMetrics.append(
      metric,
    );
  }

  /**
   * Records one coach meeting.
   */
  public async recordCoachMeeting(
    launchPlanId: LaunchId,
    input: RecordCoachMeetingInput,
  ): Promise<CoachMeetingRecord> {
    const state =
      await this.loadGrowthState(
        launchPlanId,
      );

    const engine =
      new GrowthEngine(
        state.plan,
        state.metrics,
        state.coachMeetings,
        state.milestones,
      );

    const meeting =
      engine.recordCoachMeeting(input);

    return this.unitOfWork.coachMeetings.save(
      meeting,
    );
  }

  /**
   * Creates one growth milestone.
   */
  public async createGrowthMilestone(
    launchPlanId: LaunchId,
    input: CreateGrowthMilestoneInput,
  ): Promise<GrowthMilestone> {
    const state =
      await this.loadGrowthState(
        launchPlanId,
      );

    const engine =
      new GrowthEngine(
        state.plan,
        state.metrics,
        state.coachMeetings,
        state.milestones,
      );

    const milestone =
      engine.createMilestone(input);

    return this.unitOfWork.growthMilestones.save(
      milestone,
    );
  }

  /**
   * Completes one growth milestone.
   */
  public async completeGrowthMilestone(
    launchPlanId: LaunchId,
    milestoneId: string,
    completedBy: string,
    notes?: string,
  ): Promise<GrowthMilestone> {
    const state =
      await this.loadGrowthState(
        launchPlanId,
      );

    const engine =
      new GrowthEngine(
        state.plan,
        state.metrics,
        state.coachMeetings,
        state.milestones,
      );

    const milestone =
      engine.completeMilestone(
        milestoneId,
        completedBy,
        notes,
      );

    return this.unitOfWork.growthMilestones.save(
      milestone,
    );
  }

  /**
   * Returns the complete Growth Engine state required by a dashboard.
   */
  public async getGrowthState(
    launchPlanId: LaunchId,
  ): Promise<LaunchPlanWithGrowth> {
    return this.loadGrowthState(
      launchPlanId,
    );
  }

  /**
   * ============================================================
   * PRIVATE APPLICATION HELPERS
   * ============================================================
   */

  private async requireLaunchPlan(
    launchPlanId: LaunchId,
  ): Promise<BusinessLaunchPlan> {
    const plan =
      await this.unitOfWork.launchPlans.findById(
        launchPlanId,
      );

    if (!plan) {
      throw new BusinessLaunchApplicationError({
        operation: "requireLaunchPlan",
        message:
          `Business Launch Plan "${String(
            launchPlanId,
          )}" was not found.`,
      });
    }

    return plan;
  }

  private async savePlanAndCompliance(
    plan: BusinessLaunchPlan,
  ): Promise<BusinessLaunchPlan> {
    return this.unitOfWork.runInTransaction(
      async (context) => {
        const savedPlan =
          await this.unitOfWork.launchPlans.save(
            plan,
            context,
          );

        const projection =
          this.createComplianceProjection(
            savedPlan,
          );

        await this.unitOfWork.complianceRecords.save(
          projection,
          context,
        );

        return savedPlan;
      },
    );
  }

  private createComplianceProjection(
    plan: BusinessLaunchPlan,
  ): ComplianceRecord {
    const compliance =
      plan.compliance;

    return {
      id:
        compliance?.id ??
        `COMPLIANCE-${String(
          plan.id,
        )}`,

      launchPlanId: plan.id,
      businessId: plan.businessId,

      status:
        plan.complianceStatus,

      requirements:
        compliance?.requirements ?? [],

      lastReviewedAt:
        compliance?.lastReviewedAt ??
        null,

      nextReviewDate:
        compliance?.nextReviewDate ??
        null,

      createdAt:
        compliance?.createdAt ??
        plan.createdAt,

      updatedAt:
        compliance?.updatedAt ??
        plan.updatedAt,
    };
  }

  private async loadAllFinancialTransactions(
    businessId: BusinessId,
  ): Promise<FinancialTransaction[]> {
    const result =
      await this.unitOfWork.financialTransactions.findByBusinessId(
        businessId,
        {
          limit: 10_000,
          offset: 0,
        },
      );

    return result.items;
  }

  private async loadAllRegistryItems(
    businessId: BusinessId,
  ): Promise<RegistryItem[]> {
    const result =
      await this.unitOfWork.registry.findItemsByBusinessId(
        businessId,
        {
          limit: 10_000,
          offset: 0,
          includeArchived: true,
        },
      );

    return result.items;
  }

  private async loadAllCommunicationMessages(
    businessId: BusinessId,
  ): Promise<CommunicationMessage[]> {
    const result =
      await this.unitOfWork.communications.findMessagesByBusinessId(
        businessId,
        {
          limit: 10_000,
          offset: 0,
        },
      );

    return result.items;
  }

  private async executeRegistryMutation(
    launchPlanId: LaunchId,
    mutate: (
      engine: BusinessRegistryEngine,
    ) => RegistryItem,
  ): Promise<LaunchPlanWithRegistry> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingRegistry =
      await this.loadAllRegistryItems(
        plan.businessId,
      );

    const engine =
      new BusinessRegistryEngine(
        plan,
        existingRegistry,
        [],
      );

    const updatedItem =
      mutate(engine);

    const updatedPlan =
      engine.getPlan();

    const history =
      engine.getHistory();

    return this.unitOfWork.runInTransaction(
      async (context) => {
        await this.unitOfWork.registry.saveItem(
          updatedItem,
          context,
        );

        await this.appendRegistryHistory(
          history,
          context,
        );

        const savedPlan =
          await this.unitOfWork.launchPlans.save(
            updatedPlan,
            context,
          );

        return {
          plan: savedPlan,
          registry:
            engine.getAllRegistryItems(),
          history,
        };
      },
    );
  }

  private async executeCommunicationMutation(
    launchPlanId: LaunchId,
    mutate: (
      engine: CommunicationEngine,
    ) => CommunicationMessage,
  ): Promise<LaunchPlanWithCommunications> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const existingMessages =
      await this.loadAllCommunicationMessages(
        plan.businessId,
      );

    const engine =
      new CommunicationEngine(
        plan,
        existingMessages,
        [],
      );

    const updatedMessage =
      mutate(engine);

    const history =
      engine.getHistory();

    return this.unitOfWork.runInTransaction(
      async (context) => {
        await this.unitOfWork.communications.saveMessage(
          updatedMessage,
          context,
        );

        await this.appendCommunicationHistory(
          history,
          context,
        );

        return {
          plan,
          messages:
            engine.getMessages(),
          history,
        };
      },
    );
  }

  private async loadGrowthState(
    launchPlanId: LaunchId,
  ): Promise<LaunchPlanWithGrowth> {
    const plan =
      await this.requireLaunchPlan(
        launchPlanId,
      );

    const [
      metricResult,
      meetingResult,
      milestoneResult,
    ] = await Promise.all([
      this.unitOfWork.growthMetrics.findByBusinessId(
        plan.businessId,
        {
          limit: 10_000,
          offset: 0,
        },
      ),

      this.unitOfWork.coachMeetings.findByBusinessId(
        plan.businessId,
        {
          limit: 10_000,
          offset: 0,
        },
      ),

      this.unitOfWork.growthMilestones.findByBusinessId(
        plan.businessId,
        {
          limit: 10_000,
          offset: 0,
        },
      ),
    ]);

    return {
      plan,
      metrics: metricResult.items,
      coachMeetings:
        meetingResult.items,
      milestones:
        milestoneResult.items,
    };
  }

  private async appendRegistryHistory(
    history: RegistryHistoryEntry[],
    context?: RepositoryTransactionContext,
  ): Promise<void> {
    if (history.length === 0) {
      return;
    }

    await this.unitOfWork.registry.appendHistoryMany(
      history,
      context,
    );
  }

  private async appendCommunicationHistory(
    history: CommunicationHistoryEntry[],
    context?: RepositoryTransactionContext,
  ): Promise<void> {
    if (history.length === 0) {
      return;
    }

    await this.unitOfWork.communications.appendHistoryMany(
      history,
      context,
    );
  }
}

/**
 * ============================================================
 * APPLICATION SERVICE ERROR
 * ============================================================
 */

export class BusinessLaunchApplicationError extends Error {
  public readonly operation: string;

  public readonly causeValue: unknown;

  constructor(input: {
    operation: string;
    message: string;
    cause?: unknown;
  }) {
    super(input.message);

    this.name =
      "BusinessLaunchApplicationError";

    this.operation =
      input.operation;

    this.causeValue =
      input.cause;

    Object.setPrototypeOf(
      this,
      BusinessLaunchApplicationError.prototype,
    );
  }
}