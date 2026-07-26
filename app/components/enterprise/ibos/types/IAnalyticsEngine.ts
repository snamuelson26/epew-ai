import type {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Analytics event categories supported by IBOS.
 */
export type AnalyticsEventCategory =
  | "system"
  | "user"
  | "entrepreneur"
  | "supporter"
  | "coach"
  | "partner"
  | "vendor"
  | "business"
  | "funding"
  | "payment"
  | "communication"
  | "workflow"
  | "certificate"
  | "event"
  | "compliance"
  | "security"
  | "custom";

/**
 * Analytics aggregation periods.
 */
export type AnalyticsPeriod =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "all_time"
  | "custom";

/**
 * Supported report output formats.
 */
export type AnalyticsReportFormat =
  | "json"
  | "csv"
  | "pdf"
  | "xlsx";

/**
 * Analytics engine configuration.
 */
export interface AnalyticsEngineConfig extends EngineConfig {
  provider?: string;
  trackingEnabled?: boolean;
  anonymousTrackingEnabled?: boolean;
  retentionDays?: number;
  flushIntervalMs?: number;
  batchSize?: number;
}

/**
 * A single analytics event.
 */
export interface AnalyticsEvent {
  id?: string;
  name: string;
  category: AnalyticsEventCategory;
  actorId?: string;
  actorType?: string;
  entityId?: string;
  entityType?: string;
  sessionId?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Analytics metric definition.
 */
export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  unit?: string;
  period?: AnalyticsPeriod;
  metadata?: Record<string, unknown>;
}

/**
 * Date range used for analytics queries.
 */
export interface AnalyticsDateRange {
  from: string;
  to: string;
}

/**
 * Analytics query filters.
 */
export interface AnalyticsFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "in"
    | "not_in";
  value: unknown;
}

/**
 * Query used to retrieve analytics information.
 */
export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  period?: AnalyticsPeriod;
  dateRange?: AnalyticsDateRange;
  filters?: AnalyticsFilter[];
  groupBy?: string[];
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * A row returned by an analytics query.
 */
export interface AnalyticsDataRow {
  dimensions?: Record<string, string | number | boolean | null>;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}

/**
 * Analytics query response.
 */
export interface AnalyticsQueryResult {
  success: boolean;
  rows: AnalyticsDataRow[];
  totals?: Record<string, number>;
  generatedAt: string;
  query?: AnalyticsQuery;
  error?: string;
}

/**
 * Dashboard widget definition.
 */
export interface AnalyticsWidget {
  id: string;
  title: string;
  type:
    | "metric"
    | "table"
    | "line_chart"
    | "bar_chart"
    | "pie_chart"
    | "progress"
    | "funnel"
    | "map";
  metricKeys?: string[];
  query?: AnalyticsQuery;
  position?: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
  settings?: Record<string, unknown>;
}

/**
 * Analytics dashboard definition.
 */
export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: AnalyticsWidget[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Analytics report request.
 */
export interface AnalyticsReportRequest {
  name: string;
  description?: string;
  query: AnalyticsQuery;
  format: AnalyticsReportFormat;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generated analytics report.
 */
export interface AnalyticsReport {
  id: string;
  name: string;
  format: AnalyticsReportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  generatedAt?: string;
  expiresAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Enterprise analytics contract used by IBOS.
 */
export interface IAnalyticsEngine
  extends IEngine<AnalyticsEngineConfig> {
  trackEvent(event: AnalyticsEvent): Promise<EngineOperationResult>;

  trackEvents(events: AnalyticsEvent[]): Promise<EngineOperationResult>;

  incrementMetric(
    metricKey: string,
    amount?: number,
    properties?: Record<string, unknown>,
  ): Promise<EngineOperationResult>;

  recordMetric(
    metricKey: string,
    value: number,
    properties?: Record<string, unknown>,
  ): Promise<EngineOperationResult>;

  query(query: AnalyticsQuery): Promise<AnalyticsQueryResult>;

  getMetric(
    metricKey: string,
    period?: AnalyticsPeriod,
    dateRange?: AnalyticsDateRange,
  ): Promise<AnalyticsMetric | null>;

  getMetrics(
    metricKeys: string[],
    period?: AnalyticsPeriod,
    dateRange?: AnalyticsDateRange,
  ): Promise<AnalyticsMetric[]>;

  getDashboard(
    dashboardId: string,
  ): Promise<AnalyticsDashboard | null>;

  generateReport(
    request: AnalyticsReportRequest,
  ): Promise<AnalyticsReport>;

  getReport(
    reportId: string,
  ): Promise<AnalyticsReport | null>;

  flush(): Promise<EngineOperationResult>;
}