/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * BaseRepository.ts
 *
 * Shared enterprise repository contracts and abstract base repository.
 * ================================================================
 */

import type {
  IRepository,
  ISODateString,
  PaginationRequest,
  PaginationResult,
  SearchRequest,
  SearchResult,
  UUID,
} from "../services/BaseService";

/* ================================================================
 * Shared repository models
 * ================================================================ */

export type SortDirection = "asc" | "desc";

export interface SortRequest {
  readonly field: string;
  readonly direction?: SortDirection;
}

export interface RepositoryQuery<TFilter> {
  readonly filter?: TFilter;
  readonly pagination: PaginationRequest;
  readonly sort?: readonly SortRequest[];
}

export interface RepositoryPage<TEntity> {
  readonly items: readonly TEntity[];
  readonly totalItems: number;
}

export interface RepositoryContext {
  readonly requestId?: string;
  readonly correlationId?: UUID;
  readonly transactionId?: UUID;
}

export interface RepositoryWriteMetadata {
  readonly createdAt?: ISODateString;
  readonly createdBy?: UUID;
  readonly updatedAt?: ISODateString;
  readonly updatedBy?: UUID;
}

/* ================================================================
 * Persistence adapter
 * ================================================================ */

export interface IRepositoryAdapter<
  TEntity,
  TCreate,
  TUpdate,
  TFilter
> {
  insert(
    dto: TCreate,
    context?: RepositoryContext
  ): Promise<TEntity>;

  selectById(
    id: UUID,
    context?: RepositoryContext
  ): Promise<TEntity | null>;

  updateById(
    id: UUID,
    dto: TUpdate,
    context?: RepositoryContext
  ): Promise<TEntity>;

  softDeleteById(
    id: UUID,
    context?: RepositoryContext
  ): Promise<void>;

  restoreById(
    id: UUID,
    context?: RepositoryContext
  ): Promise<void>;

  selectPage(
    query: RepositoryQuery<TFilter>,
    context?: RepositoryContext
  ): Promise<RepositoryPage<TEntity>>;
}

/* ================================================================
 * Repository errors
 * ================================================================ */

export enum RepositoryErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE = "DUPLICATE",
  CONFLICT = "CONFLICT",
  DATABASE_ERROR = "DATABASE_ERROR",
  TRANSACTION_ERROR = "TRANSACTION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class RepositoryException extends Error {
  readonly code: RepositoryErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp: ISODateString;

  constructor(
    code: RepositoryErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>
  ) {
    super(message);
    this.name = "RepositoryException";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* ================================================================
 * Abstract enterprise repository
 * ================================================================ */

export abstract class BaseRepository<
  TEntity,
  TCreate,
  TUpdate,
  TFilter
> implements IRepository<TEntity, TCreate, TUpdate, TFilter>
{
  protected readonly defaultPage = 1;
  protected readonly defaultPageSize = 25;
  protected readonly maximumPageSize = 100;

  protected constructor(
    protected readonly adapter: IRepositoryAdapter<
      TEntity,
      TCreate,
      TUpdate,
      TFilter
    >
  ) {}

  async create(dto: TCreate): Promise<TEntity> {
    this.assertCreatePayload(dto);

    try {
      return await this.adapter.insert(dto);
    } catch (error) {
      throw this.mapError(error, "Unable to create repository entity.");
    }
  }

  async findById(id: UUID): Promise<TEntity | null> {
    this.assertId(id);

    try {
      return await this.adapter.selectById(id);
    } catch (error) {
      throw this.mapError(error, "Unable to load repository entity.");
    }
  }

  async update(id: UUID, dto: TUpdate): Promise<TEntity> {
    this.assertId(id);
    this.assertUpdatePayload(dto);

    try {
      return await this.adapter.updateById(id, dto);
    } catch (error) {
      throw this.mapError(error, "Unable to update repository entity.");
    }
  }

  async archive(id: UUID): Promise<void> {
    this.assertId(id);

    try {
      await this.adapter.softDeleteById(id);
    } catch (error) {
      throw this.mapError(error, "Unable to archive repository entity.");
    }
  }

  async restore(id: UUID): Promise<void> {
    this.assertId(id);

    try {
      await this.adapter.restoreById(id);
    } catch (error) {
      throw this.mapError(error, "Unable to restore repository entity.");
    }
  }

  async search(
    request: SearchRequest<TFilter>
  ): Promise<SearchResult<TEntity>> {
    const pagination = this.normalizePagination(request.pagination);

    try {
      const page = await this.adapter.selectPage({
        filter: request.filter,
        pagination,
        sort: this.getDefaultSort(),
      });

      return {
        items: page.items,
        pagination: this.buildPaginationResult(
          pagination,
          page.totalItems
        ),
      };
    } catch (error) {
      throw this.mapError(error, "Unable to search repository entities.");
    }
  }

  /* ------------------------------------------------------------
   * Extension points
   * ------------------------------------------------------------ */

  protected getDefaultSort(): readonly SortRequest[] | undefined {
    return undefined;
  }

  protected validateCreate(_dto: TCreate): readonly string[] {
    return [];
  }

  protected validateUpdate(_dto: TUpdate): readonly string[] {
    return [];
  }

  protected mapDatabaseError(
    error: unknown,
    fallbackMessage: string
  ): RepositoryException {
    return new RepositoryException(
      RepositoryErrorCode.DATABASE_ERROR,
      this.getErrorMessage(error, fallbackMessage),
      { cause: error }
    );
  }

  /* ------------------------------------------------------------
   * Validation
   * ------------------------------------------------------------ */

  protected assertId(id: UUID): void {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new RepositoryException(
        RepositoryErrorCode.VALIDATION_ERROR,
        "A valid entity ID is required."
      );
    }
  }

  protected assertCreatePayload(dto: TCreate): void {
    if (dto === null || dto === undefined) {
      throw new RepositoryException(
        RepositoryErrorCode.VALIDATION_ERROR,
        "A create payload is required."
      );
    }

    const errors = this.validateCreate(dto);

    if (errors.length > 0) {
      throw new RepositoryException(
        RepositoryErrorCode.VALIDATION_ERROR,
        "The create payload is invalid.",
        { errors }
      );
    }
  }

  protected assertUpdatePayload(dto: TUpdate): void {
    if (dto === null || dto === undefined) {
      throw new RepositoryException(
        RepositoryErrorCode.VALIDATION_ERROR,
        "An update payload is required."
      );
    }

    const errors = this.validateUpdate(dto);

    if (errors.length > 0) {
      throw new RepositoryException(
        RepositoryErrorCode.VALIDATION_ERROR,
        "The update payload is invalid.",
        { errors }
      );
    }
  }

  /* ------------------------------------------------------------
   * Pagination
   * ------------------------------------------------------------ */

  protected normalizePagination(
    pagination?: PaginationRequest
  ): PaginationRequest {
    const requestedPage = pagination?.page ?? this.defaultPage;
    const requestedPageSize =
      pagination?.pageSize ?? this.defaultPageSize;

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : this.defaultPage;

    const pageSize =
      Number.isInteger(requestedPageSize) && requestedPageSize > 0
        ? Math.min(requestedPageSize, this.maximumPageSize)
        : this.defaultPageSize;

    return {
      page,
      pageSize,
    };
  }

  protected buildPaginationResult(
    pagination: PaginationRequest,
    totalItems: number
  ): PaginationResult {
    const safeTotalItems =
      Number.isFinite(totalItems) && totalItems > 0
        ? Math.floor(totalItems)
        : 0;

    const totalPages =
      safeTotalItems === 0
        ? 0
        : Math.ceil(safeTotalItems / pagination.pageSize);

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: safeTotalItems,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1 && totalPages > 0,
    };
  }

  protected calculateOffset(
    pagination: PaginationRequest
  ): number {
    return (pagination.page - 1) * pagination.pageSize;
  }

  /* ------------------------------------------------------------
   * Error mapping
   * ------------------------------------------------------------ */

  protected mapError(
    error: unknown,
    fallbackMessage: string
  ): RepositoryException {
    if (error instanceof RepositoryException) {
      return error;
    }

    return this.mapDatabaseError(error, fallbackMessage);
  }

  protected getErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return fallbackMessage;
  }
}