/**
 * IBOS Enterprise Engine Contract
 *
 * Every engine registered with IBOS must implement this base contract.
 */

export type EngineEnvironment =
  | "development"
  | "test"
  | "staging"
  | "production";

export type EngineStatus =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "degraded"
  | "error";

export type EngineHealthStatus =
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "unknown";

export interface EngineConfig {
  enabled?: boolean;
  debug?: boolean;
  environment?: EngineEnvironment;
  options?: Record<string, unknown>;
}

export interface EngineCapability {
  id: string;
  name: string;
  description?: string;
  version?: string;
  available: boolean;
}

export interface EngineMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  capabilities?: EngineCapability[];
  dependencies?: string[];
  properties?: Record<string, unknown>;
}

export interface EngineDependencyHealth {
  id: string;
  name: string;
  status: EngineHealthStatus;
  message?: string;
}

export interface EngineHealthCheck {
  engineId: string;
  engineName: string;
  status: EngineHealthStatus;
  operationalStatus: EngineStatus;
  checkedAt: string;
  message?: string;
  responseTimeMs?: number;
  details?: Record<string, unknown>;
  dependencies?: EngineDependencyHealth[];
}

export interface EngineError {
  code?: string;
  message: string;
  details?: unknown;
}

export interface EngineOperationResult {
  success: boolean;
  status: EngineStatus;
  message?: string;
  data?: Record<string, unknown>;
  error?: EngineError;
}

export interface EngineInitializationContext<
  TConfig extends EngineConfig = EngineConfig,
> {
  config: TConfig;
  ibosVersion?: string;
  environment?: EngineEnvironment;
  services?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

/**
 * Base interface implemented by every IBOS engine.
 */
export interface IEngine<
  TConfig extends EngineConfig = EngineConfig,
> {
  readonly metadata: EngineMetadata;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: EngineStatus;
  readonly config: Readonly<TConfig>;
  readonly initialized: boolean;
  readonly running: boolean;

  initialize(
    context: EngineInitializationContext<TConfig>,
  ): Promise<EngineOperationResult>;

  start(): Promise<EngineOperationResult>;

  stop(): Promise<EngineOperationResult>;

  shutdown(): Promise<EngineOperationResult>;

  healthCheck(): Promise<EngineHealthCheck>;

  configure(
    config: Partial<TConfig>,
  ): Promise<EngineOperationResult>;

  getCapabilities(): EngineCapability[];

  hasCapability(capabilityId: string): boolean;
}

/**
 * Runtime type guard for IBOS engines.
 */
export function isIBOSEngine(value: unknown): value is IEngine {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const engine = value as Partial<IEngine>;

  return (
    typeof engine.id === "string" &&
    typeof engine.name === "string" &&
    typeof engine.version === "string" &&
    typeof engine.initialize === "function" &&
    typeof engine.start === "function" &&
    typeof engine.stop === "function" &&
    typeof engine.shutdown === "function" &&
    typeof engine.healthCheck === "function" &&
    typeof engine.configure === "function" &&
    typeof engine.getCapabilities === "function" &&
    typeof engine.hasCapability === "function"
  );
}