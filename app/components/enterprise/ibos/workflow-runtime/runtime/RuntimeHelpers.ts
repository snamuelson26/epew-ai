/**
 * ============================================================
 * IBOS Enterprise Operating System (IBOS-EOS)
 * Workflow Runtime Helpers
 *
 * Shared utility functions used throughout the runtime.
 * ============================================================
 */

import crypto from "crypto";

import {
  WorkflowExecutionId,
  WorkflowInstanceId,
  WorkflowId,
  WorkflowStepId,
} from "../RuntimeTypes";

/* ============================================================
 * Constants
 * ============================================================
 */

export const DEFAULT_ID_LENGTH = 16;

export const DEFAULT_RANDOM_BYTES = 16;

/* ============================================================
 * Random IDs
 * ============================================================
 */

export function generateId(
  length: number = DEFAULT_ID_LENGTH
): string {

  return crypto
    .randomBytes(length)
    .toString("hex");
}

export function generateWorkflowInstanceId():
WorkflowInstanceId {

  return `wf_${generateId(12)}`;
}

export function generateExecutionId():
WorkflowExecutionId {

  return `exec_${generateId(12)}`;
}

export function generateCorrelationId(): string {

  return `corr_${generateId(10)}`;
}

export function generateStepExecutionId(): string {

  return `step_${generateId(10)}`;
}

/* ============================================================
 * Time
 * ============================================================
 */

export function now(): Date {

  return new Date();
}

export function nowIso(): string {

  return new Date().toISOString();
}

export function elapsedMilliseconds(
  started: Date,
  finished: Date = new Date()
): number {

  return finished.getTime() - started.getTime();
}

export function sleep(
  milliseconds: number
): Promise<void> {

  return new Promise(resolve =>
    setTimeout(resolve, milliseconds)
  );
}

/* ============================================================
 * Type Guards
 * ============================================================
 */

export function isString(
  value: unknown
): value is string {

  return typeof value === "string";
}

export function isNumber(
  value: unknown
): value is number {

  return typeof value === "number";
}

export function isBoolean(
  value: unknown
): value is boolean {

  return typeof value === "boolean";
}

export function isObject(
  value: unknown
): value is Record<string, unknown> {

  return (
    value !== null &&
    typeof value === "object"
  );
}

export function isFunction(
  value: unknown
): value is Function {

  return typeof value === "function";
}

/* ============================================================
 * Deep Clone
 * ============================================================
 */

export function deepClone<T>(
  value: T
): T {

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

/* ============================================================
 * Freeze
 * ============================================================
 */

export function deepFreeze<T>(
  object: T
): T {

  if (
    object === null ||
    typeof object !== "object"
  ) {
    return object;
  }

  Object.freeze(object);

  for (const key of Object.keys(object)) {

    const value = (object as any)[key];

    if (
      value &&
      typeof value === "object" &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  }

  return object;
}

/* ============================================================
 * Assertions
 * ============================================================
 */

export function assert(
  condition: unknown,
  message: string
): asserts condition {

  if (!condition) {
    throw new Error(message);
  }
}

export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): T {

  if (
    value === undefined ||
    value === null
  ) {
    throw new Error(message);
  }

  return value;
}

/* ============================================================
 * Arrays
 * ============================================================
 */

export function unique<T>(
  array: T[]
): T[] {

  return [...new Set(array)];
}

export function removeUndefined<T>(
  array: Array<T | undefined>
): T[] {

  return array.filter(
    (item): item is T =>
      item !== undefined
  );
}
/* ============================================================
 * Error Helpers
 * ============================================================
 */

export function isError(
  value: unknown
): value is Error {
  return value instanceof Error;
}

export function errorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function errorStack(
  error: unknown
): string | undefined {
  return error instanceof Error
    ? error.stack
    : undefined;
}

export function normalizeError(
  error: unknown
): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(errorMessage(error));
}

/* ============================================================
 * Promise Timeout
 * ============================================================
 */

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    return promise;
  }

  let timeoutHandle:
    | ReturnType<typeof setTimeout>
    | undefined;

  const timeoutPromise = new Promise<never>(
    (_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);
    }
  );

  try {
    return await Promise.race([
      promise,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/* ============================================================
 * Retry
 * ============================================================
 */

export interface RetryOptions {
  maxAttempts: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maximumDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (
    error: unknown,
    attempt: number
  ) => boolean | Promise<boolean>;
  onRetry?: (
    error: unknown,
    attempt: number,
    delayMs: number
  ) => void | Promise<void>;
}

export function calculateRetryDelay(
  attempt: number,
  options: Pick<
    RetryOptions,
    | "delayMs"
    | "backoffMultiplier"
    | "maximumDelayMs"
    | "jitter"
  >
): number {
  const initialDelay = Math.max(
    0,
    options.delayMs ?? 0
  );

  const multiplier = Math.max(
    1,
    options.backoffMultiplier ?? 1
  );

  const maximumDelay = Math.max(
    initialDelay,
    options.maximumDelayMs ??
      Number.MAX_SAFE_INTEGER
  );

  const exponentialDelay =
    initialDelay *
    Math.pow(
      multiplier,
      Math.max(0, attempt - 1)
    );

  const boundedDelay = Math.min(
    exponentialDelay,
    maximumDelay
  );

  if (!options.jitter || boundedDelay === 0) {
    return Math.round(boundedDelay);
  }

  const jitterFactor = 0.5 + Math.random();

  return Math.round(
    Math.min(
      boundedDelay * jitterFactor,
      maximumDelay
    )
  );
}

export async function retry<T>(
  operation: (
    attempt: number
  ) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const maxAttempts = Math.max(
    1,
    Math.floor(options.maxAttempts)
  );

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      const mayRetry = options.shouldRetry
        ? await options.shouldRetry(
            error,
            attempt
          )
        : true;

      if (!mayRetry) {
        break;
      }

      const delayMs = calculateRetryDelay(
        attempt,
        options
      );

      if (options.onRetry) {
        await options.onRetry(
          error,
          attempt,
          delayMs
        );
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  throw normalizeError(lastError);
}

/* ============================================================
 * Deferred Promise
 * ============================================================
 */

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export function createDeferred<T>():
Deferred<T> {
  let resolvePromise!: (
    value: T | PromiseLike<T>
  ) => void;

  let rejectPromise!: (
    reason?: unknown
  ) => void;

  const promise = new Promise<T>(
    (resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    }
  );

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

/* ============================================================
 * Hashing
 * ============================================================
 */

export function createHash(
  value: string,
  algorithm = "sha256"
): string {
  return crypto
    .createHash(algorithm)
    .update(value)
    .digest("hex");
}

export function hashObject(
  value: unknown,
  algorithm = "sha256"
): string {
  return createHash(
    stableStringify(value),
    algorithm
  );
}

/* ============================================================
 * Stable Serialization
 * ============================================================
 */

function sortSerializableValue(
  value: unknown,
  seen: WeakSet<object>
): unknown {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    if (typeof value === "bigint") {
      return value.toString();
    }

    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) =>
      sortSerializableValue(item, seen)
    );
  }

  if (value instanceof Map) {
    return [...value.entries()]
      .sort(([left], [right]) =>
        String(left).localeCompare(
          String(right)
        )
      )
      .map(([key, item]) => [
        key,
        sortSerializableValue(item, seen),
      ]);
  }

  if (value instanceof Set) {
    return [...value.values()]
      .map((item) =>
        sortSerializableValue(item, seen)
      )
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(
          JSON.stringify(right)
        )
      );
  }

  const result: Record<string, unknown> = {};

  const source =
    value as Record<string, unknown>;

  for (const key of Object.keys(source).sort()) {
    const item = source[key];

    if (item !== undefined) {
      result[key] = sortSerializableValue(
        item,
        seen
      );
    }
  }

  return result;
}

export function stableStringify(
  value: unknown,
  spacing?: number
): string {
  return JSON.stringify(
    sortSerializableValue(
      value,
      new WeakSet<object>()
    ),
    null,
    spacing
  );
}

export function safeJsonParse<T>(
  value: string,
  fallback: T
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback = "{}"
): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/* ============================================================
 * Object Comparison
 * ============================================================
 */

export function deepEqual(
  left: unknown,
  right: unknown
): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  try {
    return (
      stableStringify(left) ===
      stableStringify(right)
    );
  } catch {
    return false;
  }
}

/* ============================================================
 * Object Utilities
 * ============================================================
 */

export function omitUndefined<
  T extends Record<string, unknown>
>(
  value: T
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, item] of Object.entries(
    value
  )) {
    if (item !== undefined) {
      result[key as keyof T] =
        item as T[keyof T];
    }
  }

  return result;
}

export function mergeRecords(
  ...records: Array<
    Record<string, unknown> | undefined
  >
): Record<string, unknown> {
  return records.reduce<
    Record<string, unknown>
  >(
    (result, current) => ({
      ...result,
      ...(current ?? {}),
    }),
    {}
  );
}

/* ============================================================
 * Batch Processing
 * ============================================================
 */

export async function processInBatches<
  TInput,
  TOutput
>(
  items: readonly TInput[],
  processor: (
    item: TInput,
    index: number
  ) => Promise<TOutput>,
  batchSize = 10
): Promise<TOutput[]> {
  const normalizedBatchSize = Math.max(
    1,
    Math.floor(batchSize)
  );

  const results: TOutput[] = [];

  for (
    let offset = 0;
    offset < items.length;
    offset += normalizedBatchSize
  ) {
    const batch = items.slice(
      offset,
      offset + normalizedBatchSize
    );

    const batchResults = await Promise.all(
      batch.map((item, batchIndex) =>
        processor(
          item,
          offset + batchIndex
        )
      )
    );

    results.push(...batchResults);
  }

  return results;
}

/* ============================================================
 * Concurrency Limiter
 * ============================================================
 */

export async function mapWithConcurrency<
  TInput,
  TOutput
>(
  items: readonly TInput[],
  concurrency: number,
  mapper: (
    item: TInput,
    index: number
  ) => Promise<TOutput>
): Promise<TOutput[]> {
  const normalizedConcurrency = Math.max(
    1,
    Math.floor(concurrency)
  );

  const results =
    new Array<TOutput>(items.length);

  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] =
        await mapper(
          items[currentIndex],
          currentIndex
        );
    }
  }

  const workerCount = Math.min(
    normalizedConcurrency,
    items.length
  );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => worker()
    )
  );

  return results;
}

/* ============================================================
 * Memoization
 * ============================================================
 */

export function memoize<
  TArguments extends unknown[],
  TResult
>(
  functionToMemoize: (
    ...argumentsList: TArguments
  ) => TResult,
  createKey: (
    ...argumentsList: TArguments
  ) => string = (...argumentsList) =>
    stableStringify(argumentsList)
): (
  ...argumentsList: TArguments
) => TResult {
  const cache = new Map<string, TResult>();

  return (...argumentsList: TArguments) => {
    const key = createKey(...argumentsList);

    if (cache.has(key)) {
      return cache.get(key) as TResult;
    }

    const result =
      functionToMemoize(...argumentsList);

    cache.set(key, result);

    return result;
  };
}

/* ============================================================
 * Workflow Identifiers
 * ============================================================
 */

export function workflowDefinitionKey(
  workflowId: WorkflowId,
  version: string
): string {
  return `${workflowId.trim()}@${version.trim()}`;
}

export function workflowStepKey(
  workflowId: WorkflowId,
  stepId: WorkflowStepId
): string {
  return `${workflowId.trim()}:${stepId.trim()}`;
}

export function workflowInstanceKey(
  instanceId: WorkflowInstanceId
): string {
  return `workflow-instance:${instanceId}`;
}

export function workflowExecutionKey(
  executionId: WorkflowExecutionId
): string {
  return `workflow-execution:${executionId}`;
}

/* ============================================================
 * Workflow Validation Helpers
 * ============================================================
 */

export function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

export function requirePositiveNumber(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive number.`
    );
  }

  return value;
}

export function requireNonNegativeNumber(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be zero or greater.`
    );
  }

  return value;
}

/* ============================================================
 * Date Conversion
 * ============================================================
 */

export function toDate(
  value: Date | string | number
): Date {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Invalid date value: ${String(value)}`
    );
  }

  return date;
}

export function toIsoDate(
  value: Date | string | number
): string {
  return toDate(value).toISOString();
}

/* ============================================================
 * Cleanup Helpers
 * ============================================================
 */

export async function safelyExecute(
  operation: () =>
    | void
    | Promise<void>
): Promise<void> {
  try {
    await operation();
  } catch {
    // Cleanup operations must not replace
    // the original runtime error.
  }
}