/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * EntrepreneurService.ts
 *
 * Standalone enterprise entrepreneur service.
 * All required contracts and types are contained in this one file.
 * ================================================================
 */

/* ================================================================
 * Shared primitives
 * ================================================================ */

export type UUID = string;
export type ISODateString = string;

export interface Entrepreneur {
  id: UUID;
  status?: string;
  active?: boolean;
  qualifiedAt?: ISODateString;
  coachId?: UUID;
  coachAssignedAt?: ISODateString;
  suspensionReason?: string;
  interviewScheduledAt?: ISODateString;
  interviewCompletedAt?: ISODateString;
  interviewStatus?: string;
  interviewScore?: number;
  interviewNotes?: string;
  readinessScore?: number;
  readinessUpdatedAt?: ISODateString;
  developmentPlanApproved?: boolean;
  developmentPlanApprovedAt?: ISODateString;
  fundingRecommendation?: string;
  fundingRecommendedAt?: ISODateString;
  fundingReady?: boolean;
  fundingReadyAt?: ISODateString;
  fundingStatus?: string;
  businessStatus?: string;
  launchedAt?: ISODateString;
  quarterlyReviewScore?: number;
  quarterlyReviewNotes?: string;
  quarterlyReviewDate?: ISODateString;
  archivedAt?: ISODateString | null;
  [key: string]: unknown;
}

export type CreateEntrepreneurDTO = Omit<Entrepreneur, "id"> & {
  id?: UUID;
};

export type UpdateEntrepreneurDTO = Partial<Omit<Entrepreneur, "id">>;

export interface EntrepreneurSearchFilter {
  query?: string;
  status?: string;
  coachId?: UUID;
  active?: boolean;
  fundingStatus?: string;
  businessStatus?: string;
  archived?: boolean;
  [key: string]: unknown;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchRequest<TFilter> {
  filter?: TFilter;
  pagination?: PaginationRequest;
}

export interface SearchResult<TEntity> {
  items: readonly TEntity[];
  pagination: PaginationResult;
}

export interface ServiceContext {
  userId?: UUID;
  role?: string;
  requestId?: string;
  correlationId?: UUID;
  transactionId?: UUID;
  ipAddress?: string;
  userAgent?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: readonly string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

export interface ServiceEvent {
  name: string;
  entityId: UUID;
  entityType: string;
  occurredAt: ISODateString;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface DomainEvent {
  id: UUID;
  name: string;
  aggregateId: UUID;
  aggregateType: string;
  occurredAt: ISODateString;
  payload: Readonly<Record<string, unknown>>;
}

/* ================================================================
 * Infrastructure contracts
 * ================================================================ */

export interface EntrepreneurRepository {
  create(dto: CreateEntrepreneurDTO): Promise<Entrepreneur>;
  findById(id: UUID): Promise<Entrepreneur | null>;
  update(id: UUID, dto: UpdateEntrepreneurDTO): Promise<Entrepreneur>;
  archive(id: UUID): Promise<void>;
  restore(id: UUID): Promise<void>;
  search(
    request: SearchRequest<EntrepreneurSearchFilter>
  ): Promise<SearchResult<Entrepreneur>>;
}

export interface Logger {
  debug(message: string, metadata?: object): Promise<void>;
  info(message: string, metadata?: object): Promise<void>;
  warn(message: string, metadata?: object): Promise<void>;
  error(message: string, metadata?: object): Promise<void>;
}

export interface Metrics {
  increment(metric: string, value?: number): Promise<void>;
  gauge(metric: string, value: number): Promise<void>;
  timing(metric: string, milliseconds: number): Promise<void>;
}

export interface ServiceCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(prefix?: string): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: readonly DomainEvent[]): Promise<void>;
}

export interface EventPublisher {
  publish(event: ServiceEvent): Promise<void>;
}

export interface AuditService {
  record(
    action: string,
    entityId: UUID,
    context?: ServiceContext
  ): Promise<void>;
}

export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  generate(): UUID;
}

export interface EntrepreneurServiceDependencies {
  repository: EntrepreneurRepository;
  logger: Logger;
  metrics: Metrics;
  cache: ServiceCache;
  eventBus: EventBus;
  timeline: EventPublisher;
  workflow: EventPublisher;
  audit: AuditService;
  unitOfWork: UnitOfWork;
  clock: Clock;
  ids: IdGenerator;
}

export interface EntrepreneurServiceDiagnostics {
  service: "EntrepreneurService";
  version: string;
  timestamp: ISODateString;
  healthy: boolean;
}

/* ================================================================
 * Entrepreneur service
 * ================================================================ */

export class EntrepreneurService {
  private readonly repository: EntrepreneurRepository;
  private readonly logger: Logger;
  private readonly metrics: Metrics;
  private readonly cache: ServiceCache;
  private readonly eventBus: EventBus;
  private readonly timeline: EventPublisher;
  private readonly workflow: EventPublisher;
  private readonly auditService: AuditService;
  private readonly unitOfWork: UnitOfWork;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(dependencies: EntrepreneurServiceDependencies) {
    this.repository = dependencies.repository;
    this.logger = dependencies.logger;
    this.metrics = dependencies.metrics;
    this.cache = dependencies.cache;
    this.eventBus = dependencies.eventBus;
    this.timeline = dependencies.timeline;
    this.workflow = dependencies.workflow;
    this.auditService = dependencies.audit;
    this.unitOfWork = dependencies.unitOfWork;
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
  }

  /* ============================================================
   * CRUD
   * ============================================================ */

  async create(
    dto: CreateEntrepreneurDTO,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    const validation = await this.validateCreate(dto);
    if (!validation.valid) {
      return this.failure("Validation failed.", validation.errors);
    }

    const authorization = await this.authorize(
      "entrepreneur.create",
      context
    );
    if (!authorization.authorized) {
      return this.failure(authorization.reason ?? "Unauthorized.");
    }

    return this.withTransaction(async () => {
      const entrepreneur = await this.repository.create(dto);
      await this.audit("CREATE_ENTREPRENEUR", entrepreneur.id, context);
      await this.invalidateEntrepreneurCache(entrepreneur.id);
      return this.success(
        entrepreneur,
        "Entrepreneur created successfully."
      );
    }, "Unable to create entrepreneur.");
  }

  async findById(
    id: UUID,
    _context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    const cacheKey = `entrepreneur:${id}`;
    const cached = await this.cache.get<Entrepreneur>(cacheKey);
    if (cached) return this.success(cached);

    const entrepreneur = await this.repository.findById(id);
    if (!entrepreneur) return this.failure("Entrepreneur not found.");

    await this.cache.set(cacheKey, entrepreneur, 300);
    return this.success(entrepreneur);
  }

  async update(
    id: UUID,
    dto: UpdateEntrepreneurDTO,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    const validation = await this.validateUpdate(dto);
    if (!validation.valid) {
      return this.failure("Validation failed.", validation.errors);
    }

    const existing = await this.repository.findById(id);
    if (!existing) return this.failure("Entrepreneur not found.");

    return this.withTransaction(async () => {
      const entrepreneur = await this.repository.update(id, dto);
      await this.audit("UPDATE_ENTREPRENEUR", id, context);
      await this.invalidateEntrepreneurCache(id);
      return this.success(entrepreneur, "Entrepreneur updated.");
    }, "Unable to update entrepreneur.");
  }

  async archive(
    id: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<void>> {
    const existing = await this.repository.findById(id);
    if (!existing) return this.failure("Entrepreneur not found.");

    return this.withTransaction(async () => {
      await this.repository.archive(id);
      await this.audit("ARCHIVE_ENTREPRENEUR", id, context);
      await this.invalidateEntrepreneurCache(id);
      return this.emptySuccess("Entrepreneur archived.");
    }, "Unable to archive entrepreneur.");
  }

  async restore(
    id: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<void>> {
    return this.withTransaction(async () => {
      await this.repository.restore(id);
      await this.audit("RESTORE_ENTREPRENEUR", id, context);
      await this.invalidateEntrepreneurCache(id);
      return this.emptySuccess("Entrepreneur restored.");
    }, "Unable to restore entrepreneur.");
  }

  async search(
    request: SearchRequest<EntrepreneurSearchFilter>,
    _context?: ServiceContext
  ): Promise<SearchResult<Entrepreneur>> {
    return this.repository.search(request);
  }

  /* ============================================================
   * Qualification and coach assignment
   * ============================================================ */

  async qualifyEntrepreneur(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        status: "QUALIFIED",
        qualifiedAt: this.nowIso(),
      },
      "QUALIFY_ENTREPRENEUR",
      "EntrepreneurQualified",
      "Entrepreneur qualified.",
      context,
      {},
      "entrepreneur.qualified"
    );
  }

  async assignCoach(
    entrepreneurId: UUID,
    coachId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        coachId,
        coachAssignedAt: this.nowIso(),
      },
      "ASSIGN_COACH",
      "CoachAssigned",
      "Coach assigned successfully.",
      context,
      { coachId },
      "coach.assignment"
    );
  }

  async reassignCoach(
    entrepreneurId: UUID,
    newCoachId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        coachId: newCoachId,
        coachAssignedAt: this.nowIso(),
      },
      "REASSIGN_COACH",
      "CoachReassigned",
      "Coach reassigned successfully.",
      context,
      { coachId: newCoachId },
      "coach.reassignment"
    );
  }

  async activateEntrepreneur(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      { active: true, suspensionReason: undefined },
      "ACTIVATE_ENTREPRENEUR",
      "EntrepreneurActivated",
      "Entrepreneur activated.",
      context
    );
  }

  async suspendEntrepreneur(
    entrepreneurId: UUID,
    reason: string,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!reason.trim()) return this.failure("A suspension reason is required.");

    return this.applyLifecycleUpdate(
      entrepreneurId,
      { active: false, suspensionReason: reason.trim() },
      "SUSPEND_ENTREPRENEUR",
      "EntrepreneurSuspended",
      "Entrepreneur suspended.",
      context,
      { reason: reason.trim() }
    );
  }

  /* ============================================================
   * Interview and readiness
   * ============================================================ */

  async scheduleInterview(
    entrepreneurId: UUID,
    interviewDate: ISODateString,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!this.isValidDate(interviewDate)) {
      return this.failure("A valid interview date is required.");
    }

    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        interviewScheduledAt: interviewDate,
        interviewStatus: "SCHEDULED",
      },
      "SCHEDULE_INTERVIEW",
      "InterviewScheduled",
      "Interview scheduled.",
      context,
      { interviewDate }
    );
  }

  async completeInterview(
    entrepreneurId: UUID,
    score: number,
    notes: string,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!this.isScore(score)) {
      return this.failure("Interview score must be between 0 and 100.");
    }

    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        interviewCompletedAt: this.nowIso(),
        interviewStatus: "COMPLETED",
        interviewScore: score,
        interviewNotes: notes.trim(),
      },
      "COMPLETE_INTERVIEW",
      "InterviewCompleted",
      "Interview completed.",
      context,
      { score }
    );
  }

  async updateReadiness(
    entrepreneurId: UUID,
    readinessScore: number,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!this.isScore(readinessScore)) {
      return this.failure("Readiness score must be between 0 and 100.");
    }

    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        readinessScore,
        readinessUpdatedAt: this.nowIso(),
      },
      "UPDATE_READINESS",
      "ReadinessUpdated",
      "Readiness updated.",
      context,
      { readinessScore },
      "entrepreneur.readiness.updated"
    );
  }

  async approveDevelopmentPlan(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        developmentPlanApproved: true,
        developmentPlanApprovedAt: this.nowIso(),
      },
      "APPROVE_DEVELOPMENT_PLAN",
      "DevelopmentPlanApproved",
      "Development plan approved.",
      context
    );
  }

  /* ============================================================
   * Activities and milestones
   * ============================================================ */

  async assignActivity(
    entrepreneurId: UUID,
    activityId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.recordReferenceEvent(
      entrepreneurId,
      "ASSIGN_ACTIVITY",
      "ActivityAssigned",
      "Activity assigned.",
      { activityId },
      context
    );
  }

  async completeActivity(
    entrepreneurId: UUID,
    activityId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.recordReferenceEvent(
      entrepreneurId,
      "COMPLETE_ACTIVITY",
      "ActivityCompleted",
      "Activity completed.",
      { activityId },
      context
    );
  }

  async approveMilestone(
    entrepreneurId: UUID,
    milestoneId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.recordReferenceEvent(
      entrepreneurId,
      "APPROVE_MILESTONE",
      "MilestoneCompleted",
      "Milestone approved.",
      { milestoneId },
      context
    );
  }

  /* ============================================================
   * Funding and launch
   * ============================================================ */

  async recommendFunding(
    entrepreneurId: UUID,
    recommendation: string,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!recommendation.trim()) {
      return this.failure("A funding recommendation is required.");
    }

    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        fundingRecommendation: recommendation.trim(),
        fundingRecommendedAt: this.nowIso(),
        fundingStatus: "RECOMMENDED",
      },
      "RECOMMEND_FUNDING",
      "FundingRecommended",
      "Funding recommendation completed.",
      context,
      { recommendation: recommendation.trim() },
      "funding.recommended"
    );
  }

  async approveFundingReadiness(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        fundingReady: true,
        fundingReadyAt: this.nowIso(),
        fundingStatus: "READY",
      },
      "APPROVE_FUNDING_READINESS",
      "FundingReady",
      "Entrepreneur approved for funding.",
      context,
      {},
      "funding.ready"
    );
  }

  async launchBusiness(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        businessStatus: "LAUNCHED",
        launchedAt: this.nowIso(),
      },
      "LAUNCH_BUSINESS",
      "BusinessLaunched",
      "Business launched successfully.",
      context,
      {},
      "business.launched"
    );
  }

  /* ============================================================
   * Reporting
   * ============================================================ */

  async recordQuarterlyReview(
    entrepreneurId: UUID,
    score: number,
    notes: string,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    if (!this.isScore(score)) {
      return this.failure("Quarterly review score must be between 0 and 100.");
    }

    return this.applyLifecycleUpdate(
      entrepreneurId,
      {
        quarterlyReviewScore: score,
        quarterlyReviewNotes: notes.trim(),
        quarterlyReviewDate: this.nowIso(),
      },
      "QUARTERLY_REVIEW",
      "QuarterlyReviewCompleted",
      "Quarterly review recorded.",
      context,
      { score }
    );
  }

  async generateProgressReport(
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    const result = await this.findById(entrepreneurId, context);
    if (!result.success || !result.data) return result;

    await this.audit("GENERATE_PROGRESS_REPORT", entrepreneurId, context);
    await this.publishServiceEvent("ProgressReportGenerated", entrepreneurId);
    return this.success(result.data, "Progress report generated.");
  }

  /* ============================================================
   * Batch operations
   * ============================================================ */

  async qualifyMany(
    entrepreneurIds: readonly UUID[],
    context?: ServiceContext
  ): Promise<number> {
    return this.countSuccessful(
      entrepreneurIds,
      (id) => this.qualifyEntrepreneur(id, context)
    );
  }

  async assignCoachToMany(
    entrepreneurIds: readonly UUID[],
    coachId: UUID,
    context?: ServiceContext
  ): Promise<number> {
    return this.countSuccessful(
      entrepreneurIds,
      (id) => this.assignCoach(id, coachId, context)
    );
  }

  async archiveMany(
    entrepreneurIds: readonly UUID[],
    context?: ServiceContext
  ): Promise<number> {
    return this.countSuccessful(
      entrepreneurIds,
      (id) => this.archive(id, context)
    );
  }

  /* ============================================================
   * Operational support
   * ============================================================ */

  async healthCheck(): Promise<boolean> {
    try {
      await this.repository.search({
        pagination: { page: 1, pageSize: 1 },
      });
      return true;
    } catch (error) {
      await this.logger.error("EntrepreneurService health check failed.", {
        error,
      });
      return false;
    }
  }

  async diagnostics(): Promise<EntrepreneurServiceDiagnostics> {
    return {
      service: "EntrepreneurService",
      version: "1.0.0",
      timestamp: this.nowIso(),
      healthy: await this.healthCheck(),
    };
  }

  async warmCache(): Promise<void> {
    const result = await this.repository.search({
      pagination: { page: 1, pageSize: 100 },
    });
    await this.cache.set("entrepreneurs:list", result.items, 300);
  }

  async shutdown(): Promise<void> {
    await this.logger.info("EntrepreneurService shutdown.");
  }

  /* ============================================================
   * Validation and authorization hooks
   * ============================================================ */

  protected async validateCreate(
    dto: CreateEntrepreneurDTO
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    if (dto.id !== undefined && !String(dto.id).trim()) {
      errors.push("Entrepreneur ID cannot be empty.");
    }
    return { valid: errors.length === 0, errors };
  }

  protected async validateUpdate(
    dto: UpdateEntrepreneurDTO
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    if (Object.keys(dto).length === 0) {
      errors.push("At least one field must be provided.");
    }
    return { valid: errors.length === 0, errors };
  }

  protected async authorize(
    _action: string,
    _context?: ServiceContext
  ): Promise<AuthorizationResult> {
    return { authorized: true };
  }

  /* ============================================================
   * Private helpers
   * ============================================================ */

  private async applyLifecycleUpdate(
    entrepreneurId: UUID,
    update: UpdateEntrepreneurDTO,
    auditAction: string,
    eventName: string,
    successMessage: string,
    context?: ServiceContext,
    metadata: Readonly<Record<string, unknown>> = {},
    metric?: string
  ): Promise<ServiceResult<Entrepreneur>> {
    const existing = await this.repository.findById(entrepreneurId);
    if (!existing) return this.failure("Entrepreneur not found.");

    return this.withTransaction(async () => {
      const updated = await this.repository.update(entrepreneurId, update);
      await this.audit(auditAction, entrepreneurId, context);
      await this.publishServiceEvent(eventName, entrepreneurId, metadata);
      await this.publishDomainEvent(eventName, entrepreneurId, metadata);
      if (metric) await this.metrics.increment(metric);
      await this.invalidateEntrepreneurCache(entrepreneurId);
      return this.success(updated, successMessage);
    }, `Unable to complete ${eventName}.`);
  }

  private async recordReferenceEvent(
    entrepreneurId: UUID,
    auditAction: string,
    eventName: string,
    successMessage: string,
    metadata: Readonly<Record<string, unknown>>,
    context?: ServiceContext
  ): Promise<ServiceResult<Entrepreneur>> {
    const entrepreneur = await this.repository.findById(entrepreneurId);
    if (!entrepreneur) return this.failure("Entrepreneur not found.");

    await this.audit(auditAction, entrepreneurId, context);
    await this.publishServiceEvent(eventName, entrepreneurId, metadata);
    await this.publishDomainEvent(eventName, entrepreneurId, metadata);
    return this.success(entrepreneur, successMessage);
  }

  private async publishServiceEvent(
    name: string,
    entrepreneurId: UUID,
    metadata: Readonly<Record<string, unknown>> = {}
  ): Promise<void> {
    const event: ServiceEvent = {
      name,
      entityId: entrepreneurId,
      entityType: "Entrepreneur",
      occurredAt: this.nowIso(),
      metadata,
    };
    await this.timeline.publish(event);
    await this.workflow.publish(event);
  }

  private async publishDomainEvent(
    name: string,
    entrepreneurId: UUID,
    payload: Readonly<Record<string, unknown>> = {}
  ): Promise<void> {
    await this.eventBus.publish({
      id: this.ids.generate(),
      name,
      aggregateId: entrepreneurId,
      aggregateType: "Entrepreneur",
      occurredAt: this.nowIso(),
      payload,
    });
  }

  private async audit(
    action: string,
    entrepreneurId: UUID,
    context?: ServiceContext
  ): Promise<void> {
    await this.auditService.record(action, entrepreneurId, context);
  }

  private async invalidateEntrepreneurCache(
    entrepreneurId: UUID
  ): Promise<void> {
    await Promise.all([
      this.cache.delete(`entrepreneur:${entrepreneurId}`),
      this.cache.delete("entrepreneurs:list"),
    ]);
  }

  private async withTransaction<T>(
    operation: () => Promise<ServiceResult<T>>,
    failureMessage: string
  ): Promise<ServiceResult<T>> {
    await this.unitOfWork.begin();
    try {
      const result = await operation();
      await this.unitOfWork.commit();
      return result;
    } catch (error) {
      try {
        await this.unitOfWork.rollback();
      } catch (rollbackError) {
        await this.logger.error("Transaction rollback failed.", {
          rollbackError,
        });
      }
      await this.logger.error(failureMessage, { error });
      return this.failure(failureMessage);
    }
  }

  private async countSuccessful<T>(
    ids: readonly UUID[],
    operation: (id: UUID) => Promise<ServiceResult<T>>
  ): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const result = await operation(id);
      if (result.success) count += 1;
    }
    return count;
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    attempts = 3
  ): Promise<T> {
    if (!Number.isInteger(attempts) || attempts < 1) {
      throw new Error("Retry attempts must be a positive integer.");
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        await this.logger.warn("EntrepreneurService operation failed.", {
          attempt,
          attempts,
          error,
        });
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Operation failed after all retry attempts.");
  }

  private success<T>(data: T, message?: string): ServiceResult<T> {
    return { success: true, data, message };
  }

  private emptySuccess(message?: string): ServiceResult<void> {
    return { success: true, message };
  }

  private failure<T>(
    message: string,
    errors: readonly string[] = []
  ): ServiceResult<T> {
    return { success: false, message, errors };
  }

  private nowIso(): ISODateString {
    return this.clock.now().toISOString();
  }

  private isValidDate(value: string): boolean {
    return value.trim().length > 0 && !Number.isNaN(Date.parse(value));
  }

  private isScore(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 100;
  }
}