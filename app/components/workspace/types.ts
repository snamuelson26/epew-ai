/**
 * EPEW-EDE-IBOS
 * Enterprise Workspace Framework
 *
 * File:
 * app/components/workspace/types.ts
 *
 * Purpose:
 * Defines the shared TypeScript types used by every operational workspace:
 *
 * - Coach Workspace
 * - Partner Workspace
 * - Supporter Workspace
 * - Vendor Workspace
 * - Administrator Workspace
 *
 * This file contains types only.
 * Business rules, constants, permissions, and helper functions belong in
 * their respective framework files.
 */

/* ==========================================================================
   WORKSPACE ROLES
   ========================================================================== */

export const WORKSPACE_ROLES = [
  "coach",
  "partner",
  "supporter",
  "vendor",
  "administrator",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/**
 * Allows the framework to support future workspace roles without changing
 * every shared component immediately.
 */
export type ExtendedWorkspaceRole = WorkspaceRole | (string & {});

/* ==========================================================================
   WORKSPACE MODULES
   ========================================================================== */

export const WORKSPACE_MODULES = [
  "dashboard",
  "assignments",
  "entrepreneurs",
  "organizations",
  "businesses",
  "orders",
  "users",
  "communications",
  "interviews",
  "development",
  "readiness",
  "projects",
  "benefits",
  "deliveries",
  "installations",
  "approvals",
  "compliance",
  "analytics",
  "reports",
  "documents",
  "notifications",
  "timeline",
  "calendar",
  "tasks",
  "search",
  "activity",
  "settings",
] as const;

export type WorkspaceModule = (typeof WORKSPACE_MODULES)[number];

export type ExtendedWorkspaceModule = WorkspaceModule | (string & {});

/* ==========================================================================
   WORKSPACE STATUS
   ========================================================================== */

export const WORKSPACE_STATUSES = [
  "active",
  "inactive",
  "pending",
  "restricted",
  "suspended",
  "archived",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

/* ==========================================================================
   COMMON RECORD STATUS
   ========================================================================== */

export const RECORD_STATUSES = [
  "draft",
  "pending",
  "active",
  "in_progress",
  "completed",
  "overdue",
  "cancelled",
  "declined",
  "expired",
  "archived",
] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];

/* ==========================================================================
   ASSIGNMENT TYPES
   ========================================================================== */

export const ASSIGNMENT_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
  "reassigned",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_ACKNOWLEDGMENT_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "expired",
  "not_required",
] as const;

export type AssignmentAcknowledgmentStatus =
  (typeof ASSIGNMENT_ACKNOWLEDGMENT_STATUSES)[number];

export const ASSIGNMENT_TYPES = [
  "entrepreneur_assignment",
  "follow_up",
  "meeting",
  "interview",
  "development_milestone",
  "readiness_evaluation",
  "service_request",
  "partnership_obligation",
  "community_initiative",
  "resource_coordination",
  "funding_commitment",
  "participation_confirmation",
  "community_engagement",
  "purchase_order",
  "installation",
  "delivery",
  "launch_support",
  "approval_request",
  "escalation",
  "policy_review",
  "exception_review",
  "operational_oversight",
  "general_task",
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

export type ExtendedAssignmentType = AssignmentType | (string & {});

/* ==========================================================================
   PRIORITY
   ========================================================================== */

export const PRIORITY_LEVELS = [
  "low",
  "normal",
  "high",
  "urgent",
  "critical",
] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

export const NOTIFICATION_TYPES = [
  "info",
  "success",
  "warning",
  "error",
  "assignment",
  "message",
  "deadline",
  "reminder",
  "approval",
  "escalation",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = [
  "unread",
  "read",
  "dismissed",
  "archived",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/* ==========================================================================
   COMMUNICATIONS
   ========================================================================== */

export const COMMUNICATION_CHANNELS = [
  "platform",
  "email",
  "sms",
  "phone",
  "video",
  "in_person",
  "whatsapp",
  "other",
] as const;

export type CommunicationChannel =
  (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_DIRECTIONS = [
  "incoming",
  "outgoing",
  "internal",
] as const;

export type CommunicationDirection =
  (typeof COMMUNICATION_DIRECTIONS)[number];

export const COMMUNICATION_STATUSES = [
  "draft",
  "scheduled",
  "sent",
  "delivered",
  "failed",
  "received",
  "read",
  "cancelled",
] as const;

export type CommunicationStatus =
  (typeof COMMUNICATION_STATUSES)[number];

/* ==========================================================================
   TIMELINE AND ACTIVITY
   ========================================================================== */

export const TIMELINE_EVENT_TYPES = [
  "workspace_created",
  "workspace_updated",
  "assignment_created",
  "assignment_accepted",
  "assignment_declined",
  "assignment_started",
  "assignment_completed",
  "assignment_expired",
  "assignment_reassigned",
  "message_sent",
  "message_received",
  "meeting_scheduled",
  "meeting_completed",
  "interview_scheduled",
  "interview_completed",
  "document_uploaded",
  "document_reviewed",
  "notification_sent",
  "approval_requested",
  "approval_granted",
  "approval_declined",
  "status_changed",
  "note_added",
  "report_submitted",
  "escalation_created",
  "system_event",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export type ExtendedTimelineEventType = TimelineEventType | (string & {});

/* ==========================================================================
   DOCUMENTS
   ========================================================================== */

export const DOCUMENT_STATUSES = [
  "draft",
  "uploaded",
  "pending_review",
  "approved",
  "rejected",
  "expired",
  "archived",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_VISIBILITIES = [
  "private",
  "workspace",
  "shared",
  "public",
] as const;

export type DocumentVisibility =
  (typeof DOCUMENT_VISIBILITIES)[number];

/* ==========================================================================
   REPORTS
   ========================================================================== */

export const REPORT_STATUSES = [
  "draft",
  "pending",
  "submitted",
  "under_review",
  "approved",
  "returned",
  "rejected",
  "archived",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_FREQUENCIES = [
  "one_time",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
] as const;

export type ReportFrequency = (typeof REPORT_FREQUENCIES)[number];

/* ==========================================================================
   PERMISSIONS
   ========================================================================== */

export const WORKSPACE_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "assign",
  "accept",
  "decline",
  "complete",
  "reassign",
  "approve",
  "reject",
  "escalate",
  "message",
  "upload",
  "download",
  "export",
  "manage",
] as const;

export type WorkspaceAction = (typeof WORKSPACE_ACTIONS)[number];

export type WorkspacePermission =
  `${ExtendedWorkspaceModule}:${WorkspaceAction}`;

export type PermissionMap = Partial<
  Record<ExtendedWorkspaceModule, WorkspaceAction[]>
>;

/* ==========================================================================
   COMMON IDENTIFIERS AND METADATA
   ========================================================================== */

export type EntityId = string;

export type MetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | MetadataValue[]
  | {
      [key: string]: MetadataValue;
    };

export type WorkspaceMetadata = Record<string, MetadataValue>;

export interface BaseEntity {
  id: EntityId;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: EntityId | null;
  updatedBy?: EntityId | null;
  archivedAt?: string | null;
  archivedBy?: EntityId | null;
}

/* ==========================================================================
   WORKSPACE USER
   ========================================================================== */

export interface WorkspaceUser {
  id: EntityId;
  authUserId?: EntityId | null;
  role: ExtendedWorkspaceRole;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
  phone?: string | null;
  photoUrl?: string | null;
  title?: string | null;
  organizationId?: EntityId | null;
  organizationName?: string | null;
  status?: WorkspaceStatus;
  permissions?: WorkspacePermission[];
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   WORKSPACE CONFIGURATION
   ========================================================================== */

export interface WorkspaceBranding {
  title: string;
  subtitle?: string;
  description?: string;
  logoUrl?: string;
  accentClassName?: string;
  iconName?: string;
}

export type WorkspaceNavigationItem = {
  id: string;
  label: string;
  href: string;

  icon?: string;
 module?: ExtendedWorkspaceModule;
  requiredPermission?: WorkspacePermission;

  badge?: number | string;
  badgeColor?: string;

  description?: string;

  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  hidden?: boolean;

  children?: WorkspaceNavigationItem[];
};

export interface WorkspaceConfiguration {
  role: ExtendedWorkspaceRole;
  status: WorkspaceStatus;
  branding: WorkspaceBranding;
  basePath: string;
  defaultModule: ExtendedWorkspaceModule;
  enabledModules: ExtendedWorkspaceModule[];
  navigation: WorkspaceNavigationItem[];
  permissions: WorkspacePermission[];
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   WORKSPACE SUMMARY AND METRICS
   ========================================================================== */

export interface WorkspaceMetric {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  previousValue?: string | number;
  changeValue?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  iconName?: string;
  href?: string;
  status?: RecordStatus;
}

export interface WorkspaceSummary {
  totalAssignments: number;
  pendingAssignments: number;
  activeAssignments: number;
  overdueAssignments: number;
  completedAssignments: number;
  unreadNotifications: number;
  upcomingEvents: number;
  pendingDocuments: number;
  metrics?: WorkspaceMetric[];
}

/* ==========================================================================
   ASSIGNMENT ENTITIES
   ========================================================================== */

export interface WorkspaceAssignmentSubject {
  id: EntityId;
  type:
    | "entrepreneur"
    | "partner"
    | "supporter"
    | "vendor"
    | "business"
    | "organization"
    | "user"
    | "project"
    | "order"
    | "other";
  name: string;
  subtitle?: string | null;
  referenceNumber?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  href?: string | null;
  metadata?: WorkspaceMetadata;
}

export interface WorkspaceAssignmentAssignee {
  id: EntityId;
  role: ExtendedWorkspaceRole;
  name: string;
  email?: string | null;
  photoUrl?: string | null;
}

export interface WorkspaceAssignmentCreator {
  id: EntityId;
  name: string;
  role?: ExtendedWorkspaceRole | null;
  email?: string | null;
}

export interface WorkspaceAssignment extends BaseEntity {
  workspaceRole: ExtendedWorkspaceRole;
  assignmentType: ExtendedAssignmentType;

  title: string;
  description?: string | null;
  instructions?: string | null;

  status: AssignmentStatus;
  acknowledgmentStatus: AssignmentAcknowledgmentStatus;
  priority: PriorityLevel;

  subject?: WorkspaceAssignmentSubject | null;
  assignee?: WorkspaceAssignmentAssignee | null;
  createdByUser?: WorkspaceAssignmentCreator | null;

  assignedAt?: string | null;
  acknowledgmentDeadline?: string | null;
  acknowledgedAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  declineReason?: string | null;

  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  reassignedAt?: string | null;

  requiresAcknowledgment?: boolean;
  canAccept?: boolean;
  canDecline?: boolean;
  canComplete?: boolean;
  canReassign?: boolean;

  actionUrl?: string | null;
  source?: string | null;

  tags?: string[];
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   ASSIGNMENT ACTIONS
   ========================================================================== */

export interface AssignmentActionRequest {
  assignmentId: EntityId;
  performedBy?: EntityId;
  source?: string;
  metadata?: WorkspaceMetadata;
}

export interface AcceptAssignmentRequest extends AssignmentActionRequest {
  acknowledgmentNote?: string;
}

export interface DeclineAssignmentRequest extends AssignmentActionRequest {
  reason: string;
  additionalDetails?: string;
}

export interface CompleteAssignmentRequest extends AssignmentActionRequest {
  completionNote?: string;
  completionData?: WorkspaceMetadata;
}

export interface ReassignAssignmentRequest extends AssignmentActionRequest {
  newAssigneeId?: EntityId;
  reason: string;
}

export interface AssignmentActionResult {
  success: boolean;
  assignment?: WorkspaceAssignment;
  message?: string;
  error?: string;
}

/* ==========================================================================
   ASSIGNMENT FILTERS AND SORTING
   ========================================================================== */

export type AssignmentSortField =
  | "createdAt"
  | "assignedAt"
  | "dueDate"
  | "acknowledgmentDeadline"
  | "priority"
  | "status"
  | "title";

export type SortDirection = "asc" | "desc";

export interface AssignmentFilters {
  search?: string;
  statuses?: AssignmentStatus[];
  acknowledgmentStatuses?: AssignmentAcknowledgmentStatus[];
  priorities?: PriorityLevel[];
  assignmentTypes?: ExtendedAssignmentType[];
  assigneeIds?: EntityId[];
  subjectIds?: EntityId[];
  workspaceRoles?: ExtendedWorkspaceRole[];
  dueFrom?: string;
  dueTo?: string;
  overdueOnly?: boolean;
  requiresAcknowledgment?: boolean;
  tags?: string[];
}

export interface AssignmentSort {
  field: AssignmentSortField;
  direction: SortDirection;
}

/* ==========================================================================
   ASSIGNMENT COMPONENT PROPS
   ========================================================================== */

export interface AssignmentCountdownProps {
  deadline?: string | null;
  status?: AssignmentStatus;
  acknowledgmentStatus?: AssignmentAcknowledgmentStatus;
  compact?: boolean;
  showExpiredLabel?: boolean;
  onExpired?: () => void;
}

export interface AssignmentActionsProps {
  assignment: WorkspaceAssignment;
  isProcessing?: boolean;
  disableAccept?: boolean;
  disableDecline?: boolean;
  acceptLabel?: string;
  declineLabel?: string;
  onAccept?: (assignment: WorkspaceAssignment) => void | Promise<void>;
  onDecline?: (
    assignment: WorkspaceAssignment,
    reason: string
  ) => void | Promise<void>;
}

export interface AssignmentCardProps {
  assignment: WorkspaceAssignment;
  compact?: boolean;
  showSubject?: boolean;
  showDescription?: boolean;
  showCountdown?: boolean;
  showActions?: boolean;
  isProcessing?: boolean;
  onAccept?: (assignment: WorkspaceAssignment) => void | Promise<void>;
  onDecline?: (
    assignment: WorkspaceAssignment,
    reason: string
  ) => void | Promise<void>;
  onSelect?: (assignment: WorkspaceAssignment) => void;
}

export interface AssignmentListProps {
  assignments: WorkspaceAssignment[];
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  showActions?: boolean;
  processingAssignmentId?: EntityId | null;
  onAccept?: (assignment: WorkspaceAssignment) => void | Promise<void>;
  onDecline?: (
    assignment: WorkspaceAssignment,
    reason: string
  ) => void | Promise<void>;
  onSelect?: (assignment: WorkspaceAssignment) => void;
  onRefresh?: () => void | Promise<void>;
}

/* ==========================================================================
   NOTIFICATION ENTITIES
   ========================================================================== */

export interface WorkspaceNotification extends BaseEntity {
  recipientId: EntityId;
  recipientRole: ExtendedWorkspaceRole;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  readAt?: string | null;
  dismissedAt?: string | null;
  expiresAt?: string | null;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   COMMUNICATION ENTITIES
   ========================================================================== */

export interface CommunicationParticipant {
  id: EntityId;
  role?: ExtendedWorkspaceRole | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

export interface WorkspaceCommunication extends BaseEntity {
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject?: string | null;
  message: string;
  sender?: CommunicationParticipant | null;
  recipients: CommunicationParticipant[];
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   TIMELINE ENTITIES
   ========================================================================== */

export interface WorkspaceTimelineEvent extends BaseEntity {
  eventType: ExtendedTimelineEventType;
  title: string;
  description?: string | null;
  actorId?: EntityId | null;
  actorName?: string | null;
  actorRole?: ExtendedWorkspaceRole | null;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  occurredAt: string;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   DOCUMENT ENTITIES
   ========================================================================== */

export interface WorkspaceDocument extends BaseEntity {
  name: string;
  description?: string | null;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  category?: string | null;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  uploadedBy: EntityId;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  reviewedBy?: EntityId | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   REPORT ENTITIES
   ========================================================================== */

export interface WorkspaceReport extends BaseEntity {
  title: string;
  description?: string | null;
  reportType: string;
  status: ReportStatus;
  frequency?: ReportFrequency | null;
  submittedBy?: EntityId | null;
  submittedAt?: string | null;
  reviewedBy?: EntityId | null;
  reviewedAt?: string | null;
  reportingPeriodStart?: string | null;
  reportingPeriodEnd?: string | null;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  data?: WorkspaceMetadata;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   SEARCH
   ========================================================================== */

export interface WorkspaceSearchFilters {
  modules?: ExtendedWorkspaceModule[];
  roles?: ExtendedWorkspaceRole[];
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  metadata?: WorkspaceMetadata;
}

export interface WorkspaceSearchQuery {
  query: string;
  page?: number;
  pageSize?: number;
  filters?: WorkspaceSearchFilters;
  sort?: {
    field: string;
    direction: SortDirection;
  };
}

export interface WorkspaceSearchResult<T = unknown> {
  id: EntityId;
  type: string;
  title: string;
  description?: string | null;
  href?: string | null;
  module?: ExtendedWorkspaceModule;
  score?: number;
  data: T;
}

/* ==========================================================================
   PAGINATION AND API RESPONSES
   ========================================================================== */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface WorkspaceApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface WorkspaceApiFailure {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type WorkspaceApiResponse<T> =
  | WorkspaceApiSuccess<T>
  | WorkspaceApiFailure;

/* ==========================================================================
   DASHBOARD
   ========================================================================== */

export interface WorkspaceQuickAction {
  id: string;
  label: string;
  description?: string;
  href?: string;
  iconName?: string;
  requiredPermission?: WorkspacePermission;
  isDisabled?: boolean;
  onClick?: () => void;
}

export interface WorkspaceDashboardSection<T = unknown> {
  id: string;
  title: string;
  description?: string;
  module?: ExtendedWorkspaceModule;
  order?: number;
  isVisible?: boolean;
  data?: T;
}

export interface WorkspaceDashboardData {
  summary: WorkspaceSummary;
  assignments: WorkspaceAssignment[];
  notifications: WorkspaceNotification[];
  timeline: WorkspaceTimelineEvent[];
  metrics: WorkspaceMetric[];
  quickActions: WorkspaceQuickAction[];
  upcomingEvents?: WorkspaceCalendarEvent[];
  sections?: WorkspaceDashboardSection[];
}

/* ==========================================================================
   CALENDAR
   ========================================================================== */

export const CALENDAR_EVENT_TYPES = [
  "meeting",
  "interview",
  "follow_up",
  "deadline",
  "training",
  "event",
  "task",
  "other",
] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export interface WorkspaceCalendarEvent extends BaseEntity {
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingUrl?: string | null;
  allDay?: boolean;
  organizerId?: EntityId | null;
  participantIds?: EntityId[];
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  status?: RecordStatus;
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   TASKS
   ========================================================================== */

export interface WorkspaceTask extends BaseEntity {
  title: string;
  description?: string | null;
  status: RecordStatus;
  priority: PriorityLevel;
  assignedTo?: EntityId | null;
  assignedBy?: EntityId | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  tags?: string[];
  metadata?: WorkspaceMetadata;
}

/* ==========================================================================
   WORKSPACE CONTEXT
   ========================================================================== */

export interface WorkspaceContextValue {
  user: WorkspaceUser | null;
  role: ExtendedWorkspaceRole | null;
  configuration: WorkspaceConfiguration | null;
  activeModule: ExtendedWorkspaceModule;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: WorkspacePermission) => boolean;
  setActiveModule: (module: ExtendedWorkspaceModule) => void;
  refreshWorkspace: () => Promise<void>;
}

/* ==========================================================================
   GENERIC COMPONENT STATES
   ========================================================================== */

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  error: string | null;
  errorCode?: string | null;
}

export interface AsyncState<T> extends LoadingState, ErrorState {
  data: T | null;
}

export interface ListState<T> extends LoadingState, ErrorState {
  items: T[];
  selectedItem?: T | null;
}

/* ==========================================================================
   ROLE-SPECIFIC WORKSPACE DATA
   ========================================================================== */

export interface CoachWorkspaceData {
  coachId: EntityId;
  assignments: WorkspaceAssignment[];
  entrepreneurIds: EntityId[];
  upcomingInterviews: WorkspaceCalendarEvent[];
  pendingReadinessEvaluations: number;
  activeDevelopmentPlans: number;
}

export interface PartnerWorkspaceData {
  partnerId: EntityId;
  assignments: WorkspaceAssignment[];
  organizationIds: EntityId[];
  activeProjects: number;
  pendingServiceRequests: number;
}

export interface SupporterWorkspaceData {
  supporterId: EntityId;
  assignments: WorkspaceAssignment[];
  supportedBusinessIds: EntityId[];
  pendingCommitments: number;
  participationConfirmations: number;
}

export interface VendorWorkspaceData {
  vendorId: EntityId;
  assignments: WorkspaceAssignment[];
  activeOrderIds: EntityId[];
  pendingDeliveries: number;
  pendingInstallations: number;
}

export interface AdministratorWorkspaceData {
  administratorId: EntityId;
  assignments: WorkspaceAssignment[];
  pendingApprovals: number;
  activeEscalations: number;
  policyReviews: number;
  complianceExceptions: number;
}

export type RoleWorkspaceData =
  | CoachWorkspaceData
  | PartnerWorkspaceData
  | SupporterWorkspaceData
  | VendorWorkspaceData
  | AdministratorWorkspaceData;