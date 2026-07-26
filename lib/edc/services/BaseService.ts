/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * BaseService.ts
 *
 * Shared enterprise service contracts and abstract base service.
 * ================================================================
 */

/* ================================================================
 * Shared primitives
 * ================================================================ */

export type UUID = string;
export type ISODateString = string;

export interface PaginationRequest {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginationResult {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/* ================================================================
 * Standard service models
 * ================================================================ */

export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly errors?: readonly string[];
}

export interface ServiceContext {
  readonly userId?: UUID;
  readonly role?: string;
  readonly requestId?: string;
  readonly correlationId?: UUID;
  readonly transactionId?: UUID;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface SearchRequest<TFilter> {
  readonly filter?: TFilter;
  readonly pagination?: PaginationRequest;
}

export interface SearchResult<TEntity> {
  readonly items: readonly TEntity[];
  readonly pagination: PaginationResult;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface AuthorizationResult {
  readonly authorized: boolean;
  readonly reason?: string;
}

export interface ServiceEvent {
  readonly name: string;
  readonly entityId: UUID;
  readonly entityType: string;
  readonly occurredAt: ISODateString;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DomainEvent {
  readonly id: UUID;
  readonly name: string;
  readonly aggregateId: UUID;
  readonly aggregateType: string;
  readonly occurredAt: ISODateString;
  readonly payload: Readonly<Record<string, unknown>>;
}

/* ================================================================
 * Errors
 * ================================================================ */

export enum ServiceErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE = "DUPLICATE",
  CONFLICT = "CONFLICT",
  BUSINESS_RULE = "BUSINESS_RULE",
  WORKFLOW_ERROR = "WORKFLOW_ERROR",
  TIMELINE_ERROR = "TIMELINE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  TRANSACTION_ERROR = "TRANSACTION_ERROR",
  INTEGRATION_ERROR = "INTEGRATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class ServiceException extends Error {
  readonly code: ServiceErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp: ISODateString;

  constructor(
    code: ServiceErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>
  ) {
    super(message);
    this.name = "ServiceException";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* ================================================================
 * Infrastructure contracts
 * ================================================================ */

export interface ILogger {
  debug(message: string, metadata?: object): Promise<void>;
  info(message: string, metadata?: object): Promise<void>;
  warn(message: string, metadata?: object): Promise<void>;
  error(message: string, metadata?: object): Promise<void>;
}

export interface IServiceMetrics {
  increment(metric: string, value?: number): Promise<void>;
  gauge(metric: string, value: number): Promise<void>;
  timing(metric: string, milliseconds: number): Promise<void>;
}

export interface IServiceCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(prefix?: string): Promise<void>;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: readonly DomainEvent[]): Promise<void>;
}

export interface IRepository<TEntity, TCreate, TUpdate, TFilter> {
  create(dto: TCreate): Promise<TEntity>;
  findById(id: UUID): Promise<TEntity | null>;
  update(id: UUID, dto: TUpdate): Promise<TEntity>;
  archive(id: UUID): Promise<void>;
  restore(id: UUID): Promise<void>;
  search(request: SearchRequest<TFilter>): Promise<SearchResult<TEntity>>;
}

export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface ITimelinePublisher {
  publish(event: ServiceEvent): Promise<void>;
}

export interface IWorkflowPublisher {
  publish(event: ServiceEvent): Promise<void>;
}

export interface IAuditService {
  record(
    action: string,
    entityId: UUID,
    context?: ServiceContext
  ): Promise<void>;
}

export interface IClock {
  now(): Date;
}

export interface IIdGenerator {
  generate(): UUID;
}

/* ================================================================
 * Dependency container
 * ================================================================ */

export interface BaseServiceDependencies<
  TEntity,
  TCreate,
  TUpdate,
  TFilter
> {
  readonly repository: IRepository<TEntity, TCreate, TUpdate, TFilter>;
  readonly logger: ILogger;
  readonly metrics: IServiceMetrics;
  readonly cache: IServiceCache;
  readonly eventBus: IEventBus;
  readonly timeline: ITimelinePublisher;
  readonly workflow: IWorkflowPublisher;
  readonly audit: IAuditService;
  readonly unitOfWork: IUnitOfWork;
  readonly clock: IClock;
  readonly ids: IIdGenerator;
}

/* ================================================================
 * Abstract enterprise base service
 * ================================================================ */

export abstract class BaseService<
  TEntity,
  TCreate,
  TUpdate,
  TFilter
> {
  protected readonly repository: IRepository<
    TEntity,
    TCreate,
    TUpdate,
    TFilter
  >;

  protected readonly logger: ILogger;
  protected readonly metrics: IServiceMetrics;
  protected readonly cache: IServiceCache;
  protected readonly eventBus: IEventBus;
  protected readonly timeline: ITimelinePublisher;
  protected readonly workflow: IWorkflowPublisher;
  protected readonly auditService: IAuditService;
  protected readonly unitOfWork: IUnitOfWork;
  protected readonly clock: IClock;
  protected readonly ids: IIdGenerator;

  protected constructor(
    protected readonly dependencies: BaseServiceDependencies<
      TEntity,
      TCreate,
      TUpdate,
      TFilter
    >
  ) {
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

  /* ------------------------------------------------------------
   * Required service operations
   * ------------------------------------------------------------ */

  abstract create(
    dto: TCreate,
    context?: ServiceContext
  ): Promise<ServiceResult<TEntity>>;

  abstract findById(
    id: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<TEntity>>;

  abstract update(
    id: UUID,
    dto: TUpdate,
    context?: ServiceContext
  ): Promise<ServiceResult<TEntity>>;

  abstract archive(
    id: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<void>>;

  abstract restore(
    id: UUID,
    context?: ServiceContext
  ): Promise<ServiceResult<void>>;

  abstract search(
    request: SearchRequest<TFilter>,
    context?: ServiceContext
  ): Promise<SearchResult<TEntity>>;

  protected abstract validateCreate(dto: TCreate): Promise<ValidationResult>;

  protected abstract validateUpdate(dto: TUpdate): Promise<ValidationResult>;

  protected abstract authorize(
    action: string,
    context?: ServiceContext
  ): Promise<AuthorizationResult>;

  /* ------------------------------------------------------------
   * Standard result helpers
   * ------------------------------------------------------------ */

  protected success<T>(data: T, message?: string): ServiceResult<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  protected emptySuccess(message?: string): ServiceResult<void> {
    return {
      success: true,
      message,
    };
  }

  protected failure<T>(
    message: string,
    errors: readonly string[] = []
  ): ServiceResult<T> {
    return {
      success: false,
      message,
      errors,
    };
  }

  /* ------------------------------------------------------------
   * Repository helpers
   * ------------------------------------------------------------ */

  protected executeSearch(
    request: SearchRequest<TFilter>
  ): Promise<SearchResult<TEntity>> {
    return this.repository.search(request);
  }

  protected loadEntity(id: UUID): Promise<TEntity | null> {
    return this.repository.findById(id);
  }

  /* ------------------------------------------------------------
   * Enterprise integration helpers
   * ------------------------------------------------------------ */

  protected publishTimeline(event: ServiceEvent): Promise<void> {
    return this.timeline.publish(event);
  }

  protected publishWorkflow(event: ServiceEvent): Promise<void> {
    return this.workflow.publish(event);
  }

  protected publishDomainEvent(event: DomainEvent): Promise<void> {
    return this.eventBus.publish(event);
  }

  protected publishDomainEvents(
    events: readonly DomainEvent[]
  ): Promise<void> {
    return this.eventBus.publishMany(events);
  }

  protected audit(
    action: string,
    entityId: UUID,
    context?: ServiceContext
  ): Promise<void> {
    return this.auditService.record(action, entityId, context);
  }

  /* ------------------------------------------------------------
   * Logging helpers
   * ------------------------------------------------------------ */

  protected logDebug(message: string, metadata?: object): Promise<void> {
    return this.logger.debug(message, metadata);
  }

  protected logInfo(message: string, metadata?: object): Promise<void> {
    return this.logger.info(message, metadata);
  }

  protected logWarning(message: string, metadata?: object): Promise<void> {
    return this.logger.warn(message, metadata);
  }

  protected logError(message: string, metadata?: object): Promise<void> {
    return this.logger.error(message, metadata);
  }

  /* ------------------------------------------------------------
   * Metrics helpers
   * ------------------------------------------------------------ */

  protected incrementMetric(metric: string, value = 1): Promise<void> {
    return this.metrics.increment(metric, value);
  }

  protected recordGauge(metric: string, value: number): Promise<void> {
    return this.metrics.gauge(metric, value);
  }

  protected recordTiming(
    metric: string,
    milliseconds: number
  ): Promise<void> {
    return this.metrics.timing(metric, milliseconds);
  }

  /* ------------------------------------------------------------
   * Cache helpers
   * ------------------------------------------------------------ */

  protected getCache<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  protected setCache<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    return this.cache.set(key, value, ttlSeconds);
  }

  protected invalidateCache(key: string): Promise<void> {
    return this.cache.delete(key);
  }

  protected clearCache(prefix?: string): Promise<void> {
    return this.cache.clear(prefix);
  }

  /* ------------------------------------------------------------
   * Transaction helpers
   * ------------------------------------------------------------ */

  protected begin(): Promise<void> {
    return this.unitOfWork.begin();
  }

  protected commit(): Promise<void> {
    return this.unitOfWork.commit();
  }

  protected rollback(): Promise<void> {
    return this.unitOfWork.rollback();
  }

  protected async inTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    await this.begin();

    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      try {
        await this.rollback();
      } catch (rollbackError) {
        await this.logError("Transaction rollback failed.", {
          rollbackError,
          originalError: error,
        });
      }

      throw error;
    }
  }

  /* ------------------------------------------------------------
   * Utility helpers
   * ------------------------------------------------------------ */

  protected now(): Date {
    return this.clock.now();
  }

  protected nowISO(): ISODateString {
    return this.clock.now().toISOString();
  }

  protected newId(): UUID {
    return this.ids.generate();
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    attempts = 3,
    delayMilliseconds = 0
  ): Promise<T> {
    if (!Number.isInteger(attempts) || attempts < 1) {
      throw new ServiceException(
        ServiceErrorCode.VALIDATION_ERROR,
        "Retry attempts must be an integer greater than zero."
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < attempts && delayMilliseconds > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, delayMilliseconds);
          });
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new ServiceException(
          ServiceErrorCode.INTERNAL_ERROR,
          "The requested operation failed after all retry attempts."
        );
  }

  protected errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "An unknown service error occurred.";
  }
}