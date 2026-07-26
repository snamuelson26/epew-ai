/**
 * ================================================================
 * EPEW – Entrepreneur Development Ecosystem
 * Entrepreneur Development Coach Enterprise Operating System
 * ----------------------------------------------------------------
 * RepositoryFactory.ts
 *
 * Centralized repository creation for Supabase-backed repositories.
 * ================================================================
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRepository } from "./SupabaseRepository";

/* ================================================================
 * Repository registration models
 * ================================================================ */

export interface RepositoryDefinition<
  TEntity extends Record<string, any>,
  TCreate,
  TUpdate,
  TFilter
> {
  readonly table: string;
  readonly create?: (
    client: SupabaseClient,
    table: string
  ) => SupabaseRepository<TEntity, TCreate, TUpdate, TFilter>;
}

export interface RepositoryFactoryOptions {
  readonly client: SupabaseClient;
}

/* ================================================================
 * Repository Factory
 * ================================================================ */

export class RepositoryFactory {
  private readonly client: SupabaseClient;

  private readonly instances = new Map<
    string,
    SupabaseRepository<
      Record<string, any>,
      unknown,
      unknown,
      unknown
    >
  >();

  constructor(options: RepositoryFactoryOptions) {
    this.client = options.client;
  }

  /**
   * Returns a shared repository instance for the requested table.
   *
   * Repeated calls with the same table name return the same instance.
   */
  get<
    TEntity extends Record<string, any>,
    TCreate,
    TUpdate,
    TFilter
  >(
    definition: RepositoryDefinition<
      TEntity,
      TCreate,
      TUpdate,
      TFilter
    >
  ): SupabaseRepository<TEntity, TCreate, TUpdate, TFilter> {
    const table = this.normalizeTableName(definition.table);
    const existing = this.instances.get(table);

    if (existing) {
      return existing as SupabaseRepository<
        TEntity,
        TCreate,
        TUpdate,
        TFilter
      >;
    }

    const repository = definition.create
      ? definition.create(this.client, table)
      : new SupabaseRepository<
          TEntity,
          TCreate,
          TUpdate,
          TFilter
        >(this.client, table);

    this.instances.set(
      table,
      repository as SupabaseRepository<
        Record<string, any>,
        unknown,
        unknown,
        unknown
      >
    );

    return repository;
  }

  /**
   * Convenience method for direct table-based repository creation.
   */
  forTable<
    TEntity extends Record<string, any>,
    TCreate,
    TUpdate,
    TFilter
  >(
    table: string
  ): SupabaseRepository<TEntity, TCreate, TUpdate, TFilter> {
    return this.get<TEntity, TCreate, TUpdate, TFilter>({
      table,
    });
  }

  /**
   * Returns true when a repository instance has already been created
   * for the supplied table.
   */
  has(table: string): boolean {
    return this.instances.has(this.normalizeTableName(table));
  }

  /**
   * Removes a cached repository instance for one table.
   *
   * The next request for that table creates a fresh instance.
   */
  reset(table: string): void {
    this.instances.delete(this.normalizeTableName(table));
  }

  /**
   * Removes every cached repository instance.
   */
  resetAll(): void {
    this.instances.clear();
  }

  /**
   * Returns the normalized table names currently registered.
   */
  registeredTables(): readonly string[] {
    return [...this.instances.keys()];
  }

  private normalizeTableName(table: string): string {
    const normalized = table.trim();

    if (normalized.length === 0) {
      throw new Error(
        "RepositoryFactory requires a non-empty Supabase table name."
      );
    }

    return normalized;
  }
}

/* ================================================================
 * Repository registry
 * ================================================================ */

export class RepositoryRegistry {
  private readonly definitions = new Map<
    string,
    RepositoryDefinition<
      Record<string, any>,
      unknown,
      unknown,
      unknown
    >
  >();

  register<
    TEntity extends Record<string, any>,
    TCreate,
    TUpdate,
    TFilter
  >(
    key: string,
    definition: RepositoryDefinition<
      TEntity,
      TCreate,
      TUpdate,
      TFilter
    >
  ): void {
    const normalizedKey = this.normalizeKey(key);

    if (this.definitions.has(normalizedKey)) {
      throw new Error(
        `A repository definition is already registered for "${normalizedKey}".`
      );
    }

    this.definitions.set(
      normalizedKey,
      definition as RepositoryDefinition<
        Record<string, any>,
        unknown,
        unknown,
        unknown
      >
    );
  }

  get<
    TEntity extends Record<string, any>,
    TCreate,
    TUpdate,
    TFilter
  >(
    key: string
  ): RepositoryDefinition<
    TEntity,
    TCreate,
    TUpdate,
    TFilter
  > {
    const normalizedKey = this.normalizeKey(key);
    const definition = this.definitions.get(normalizedKey);

    if (!definition) {
      throw new Error(
        `No repository definition is registered for "${normalizedKey}".`
      );
    }

    return definition as RepositoryDefinition<
      TEntity,
      TCreate,
      TUpdate,
      TFilter
    >;
  }

  has(key: string): boolean {
    return this.definitions.has(this.normalizeKey(key));
  }

  keys(): readonly string[] {
    return [...this.definitions.keys()];
  }

  private normalizeKey(key: string): string {
    const normalized = key.trim().toLowerCase();

    if (normalized.length === 0) {
      throw new Error(
        "RepositoryRegistry requires a non-empty repository key."
      );
    }

    return normalized;
  }
}