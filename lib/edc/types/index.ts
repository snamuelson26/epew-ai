/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * shared.ts
 *
 * Shared primitive and utility domain types.
 * ================================================================
 */

export type UUID = string;

export type ISODateString = string;

export type ISODateOnlyString = string;

export type ISOTimeString = string;

export type Percentage = number;

export type CurrencyAmount = number;

export type EmailAddress = string;

export type PhoneNumber = string;

export type URLString = string;

export type EntityMetadata = Readonly<Record<string, unknown>>;

export type SortDirection =
  | "ASC"
  | "DESC";

export interface DateRange {
  readonly startAt?: ISODateString | null;

  readonly endAt?: ISODateString | null;
}

export interface PaginationRequest {
  readonly page: number;

  readonly pageSize: number;

  readonly cursor?: string | null;
}

export interface PaginationResult {
  readonly total: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;

  readonly nextCursor?: string | null;
}

export interface AuditIdentity {
  readonly createdAt: ISODateString;

  readonly createdBy: UUID;

  readonly updatedAt: ISODateString;

  readonly updatedBy?: UUID | null;
}

export interface ArchiveIdentity {
  readonly archivedAt?: ISODateString | null;

  readonly archivedBy?: UUID | null;
}