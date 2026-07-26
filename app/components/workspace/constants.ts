/**
 * EPEW-EDE-IBOS
 * Enterprise Workspace Framework
 *
 * File:
 * app/components/workspace/constants.ts
 *
 * Purpose:
 * Defines shared constants used across all enterprise workspaces:
 *
 * - Coach Workspace
 * - Partner Workspace
 * - Supporter Workspace
 * - Vendor Workspace
 * - Administrator Workspace
 *
 * This file contains configuration values only.
 * Types belong in types.ts.
 * Permission logic belongs in permissions.ts.
 * Helper functions belong in utils.ts.
 */

import type {
  AssignmentAcknowledgmentStatus,
  AssignmentSort,
  AssignmentStatus,
  CommunicationChannel,
  CommunicationStatus,
  DocumentStatus,
  ExtendedWorkspaceModule,
  ExtendedWorkspaceRole,
  NotificationStatus,
  NotificationType,
  PriorityLevel,
  RecordStatus,
  ReportStatus,
  WorkspaceAction,
  WorkspaceModule,
  WorkspaceRole,
  WorkspaceStatus,
} from "./types";

/* ==========================================================================
   APPLICATION IDENTITY
   ========================================================================== */

export const WORKSPACE_FRAMEWORK_NAME =
  "EPEW Enterprise Workspace Framework";

export const WORKSPACE_FRAMEWORK_SHORT_NAME = "Enterprise Workspace";

export const WORKSPACE_FRAMEWORK_VERSION = "1.0.0";

export const WORKSPACE_FRAMEWORK_DESCRIPTION =
  "Shared operational workspace framework for EPEW-EDE-IBOS roles.";

export const WORKSPACE_ORGANIZATION_NAME = "EPEW-EDE-IBOS";

export const WORKSPACE_DEFAULT_LANGUAGE = "en";

export const WORKSPACE_DEFAULT_LOCALE = "en-US";

export const WORKSPACE_DEFAULT_TIMEZONE = "America/New_York";

/* ==========================================================================
   WORKSPACE ROLE LABELS
   ========================================================================== */

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  coach: "Coach",
  partner: "Partner",
  supporter: "Supporter",
  vendor: "Vendor",
  administrator: "Administrator",
};

export const WORKSPACE_ROLE_PLURAL_LABELS: Record<WorkspaceRole, string> = {
  coach: "Coaches",
  partner: "Partners",
  supporter: "Supporters",
  vendor: "Vendors",
  administrator: "Administrators",
};

export const WORKSPACE_ROLE_TITLES: Record<WorkspaceRole, string> = {
  coach: "Coach Workspace",
  partner: "Partner Workspace",
  supporter: "Supporter Workspace",
  vendor: "Vendor Workspace",
  administrator: "Administrator Workspace",
};

export const WORKSPACE_ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  coach:
    "Manage entrepreneur assignments, interviews, development milestones, readiness evaluations, and coaching activities.",
  partner:
    "Manage service requests, partnership obligations, community initiatives, and resource coordination.",
  supporter:
    "Manage participation commitments, confirmations, community engagement, and supported business activities.",
  vendor:
    "Manage purchase orders, deliveries, installations, launch support, and service completion.",
  administrator:
    "Manage approvals, escalations, policy reviews, exceptions, compliance, and operational oversight.",
};

/* ==========================================================================
   WORKSPACE BASE PATHS
   ========================================================================== */

export const WORKSPACE_BASE_PATHS: Record<WorkspaceRole, string> = {
  coach: "/coaches/workspace",
  partner: "/partners/workspace",
  supporter: "/supporters/workspace",
  vendor: "/vendors/workspace",
  administrator: "/admin/workspace",
};

export const WORKSPACE_DASHBOARD_PATHS: Record<WorkspaceRole, string> = {
  coach: "/coaches/workspace",
  partner: "/partners/workspace",
  supporter: "/supporters/workspace",
  vendor: "/vendors/workspace",
  administrator: "/admin/workspace",
};

/* ==========================================================================
   PRIMARY MODULES BY ROLE
   ========================================================================== */

export const WORKSPACE_PRIMARY_MODULES: Record<
  WorkspaceRole,
  WorkspaceModule
> = {
  coach: "entrepreneurs",
  partner: "organizations",
  supporter: "businesses",
  vendor: "orders",
  administrator: "users",
};

export const WORKSPACE_OPERATIONAL_MODULES: Record<
  WorkspaceRole,
  WorkspaceModule[]
> = {
  coach: [
    "assignments",
    "entrepreneurs",
    "communications",
    "interviews",
    "development",
    "readiness",
    "reports",
  ],

  partner: [
    "assignments",
    "organizations",
    "communications",
    "projects",
    "reports",
  ],

  supporter: [
    "assignments",
    "businesses",
    "communications",
    "benefits",
    "reports",
  ],

  vendor: [
    "assignments",
    "orders",
    "communications",
    "deliveries",
    "installations",
    "reports",
  ],

  administrator: [
    "assignments",
    "users",
    "communications",
    "approvals",
    "compliance",
    "analytics",
    "reports",
  ],
};

export const WORKSPACE_SHARED_MODULES: WorkspaceModule[] = [
  "dashboard",
  "assignments",
  "communications",
  "documents",
  "notifications",
  "timeline",
  "calendar",
  "tasks",
  "search",
  "activity",
  "reports",
  "settings",
];

/* ==========================================================================
   MODULE LABELS
   ========================================================================== */

export const WORKSPACE_MODULE_LABELS: Record<WorkspaceModule, string> = {
  dashboard: "Dashboard",
  assignments: "Assignments",
  entrepreneurs: "Entrepreneurs",
  organizations: "Organizations",
  businesses: "Businesses",
  orders: "Orders",
  users: "Users",
  communications: "Communications",
  interviews: "Interviews",
  development: "Development",
  readiness: "Readiness",
  projects: "Projects",
  benefits: "Benefits",
  deliveries: "Deliveries",
  installations: "Installations",
  approvals: "Approvals",
  compliance: "Compliance",
  analytics: "Analytics",
  reports: "Reports",
  documents: "Documents",
  notifications: "Notifications",
  timeline: "Timeline",
  calendar: "Calendar",
  tasks: "Tasks",
  search: "Search",
  activity: "Activity",
  settings: "Settings",
};

export const WORKSPACE_MODULE_DESCRIPTIONS: Record<
  WorkspaceModule,
  string
> = {
  dashboard: "View workspace activity, metrics, priorities, and quick actions.",
  assignments: "Manage pending, active, completed, and overdue assignments.",
  entrepreneurs: "Manage assigned entrepreneurs and their development progress.",
  organizations: "Manage partner organizations and institutional relationships.",
  businesses: "Manage supported businesses and participation activity.",
  orders: "Manage vendor orders and fulfillment activity.",
  users: "Manage workspace users, roles, access, and account activity.",
  communications: "Manage messages, contact history, and follow-up activity.",
  interviews: "Schedule, conduct, and review entrepreneur interviews.",
  development: "Manage development plans, milestones, and coaching progress.",
  readiness: "Evaluate readiness and submit recommendations.",
  projects: "Manage partner projects and community initiatives.",
  benefits: "Manage participation benefits and supporter activity.",
  deliveries: "Coordinate deliveries and confirm completion.",
  installations: "Coordinate installation schedules and completion.",
  approvals: "Review and process approval requests.",
  compliance: "Monitor compliance obligations and corrective actions.",
  analytics: "Review operational performance and enterprise analytics.",
  reports: "Create, submit, review, and export reports.",
  documents: "Upload, organize, review, and manage workspace documents.",
  notifications: "Review alerts, reminders, deadlines, and system notices.",
  timeline: "Review chronological workspace and entity activity.",
  calendar: "Manage meetings, interviews, deadlines, and events.",
  tasks: "Manage operational tasks and due dates.",
  search: "Search across workspace records and modules.",
  activity: "Review recent workspace activity and audit history.",
  settings: "Manage workspace preferences and configuration.",
};

/* ==========================================================================
   MODULE ICON NAMES
   ========================================================================== */

/**
 * These names are intentionally library-neutral.
 * UI components may map them to Lucide, Heroicons, or another icon library.
 */
export const WORKSPACE_MODULE_ICONS: Record<WorkspaceModule, string> = {
  dashboard: "LayoutDashboard",
  assignments: "ClipboardList",
  entrepreneurs: "Users",
  organizations: "Building2",
  businesses: "BriefcaseBusiness",
  orders: "ShoppingCart",
  users: "UserCog",
  communications: "MessagesSquare",
  interviews: "Video",
  development: "TrendingUp",
  readiness: "BadgeCheck",
  projects: "FolderKanban",
  benefits: "Gift",
  deliveries: "Truck",
  installations: "Wrench",
  approvals: "CircleCheckBig",
  compliance: "ShieldCheck",
  analytics: "ChartNoAxesCombined",
  reports: "FileChartColumn",
  documents: "Files",
  notifications: "Bell",
  timeline: "History",
  calendar: "CalendarDays",
  tasks: "ListChecks",
  search: "Search",
  activity: "Activity",
  settings: "Settings",
};

/* ==========================================================================
   WORKSPACE BRANDING
   ========================================================================== */

export interface WorkspaceRoleBrandingConstant {
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  iconName: string;

  accentClassName: string;
  backgroundClassName: string;
  borderClassName: string;
  textClassName: string;
  badgeClassName: string;
  buttonClassName: string;
}

export const WORKSPACE_ROLE_BRANDING: Record<
  WorkspaceRole,
  WorkspaceRoleBrandingConstant
> = {
  coach: {
    title: "Coach Workspace",
    shortTitle: "Coach",
    subtitle: "Entrepreneur Development and Readiness",
    description:
      "Manage assignments, entrepreneurs, interviews, development plans, and readiness evaluations.",
    iconName: "GraduationCap",
    accentClassName: "bg-emerald-600",
    backgroundClassName: "bg-emerald-50",
    borderClassName: "border-emerald-200",
    textClassName: "text-emerald-800",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-800",
    buttonClassName:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  },

  partner: {
    title: "Partner Workspace",
    shortTitle: "Partner",
    subtitle: "Partnership and Resource Coordination",
    description:
      "Manage service requests, partnership obligations, community initiatives, and resource coordination.",
    iconName: "Handshake",
    accentClassName: "bg-blue-600",
    backgroundClassName: "bg-blue-50",
    borderClassName: "border-blue-200",
    textClassName: "text-blue-800",
    badgeClassName: "border border-blue-200 bg-blue-50 text-blue-800",
    buttonClassName:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  },

  supporter: {
    title: "Supporter Workspace",
    shortTitle: "Supporter",
    subtitle: "Participation and Community Engagement",
    description:
      "Manage commitments, confirmations, supported businesses, and community engagement activities.",
    iconName: "HeartHandshake",
    accentClassName: "bg-amber-600",
    backgroundClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
    textClassName: "text-amber-900",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-900",
    buttonClassName:
      "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
  },

  vendor: {
    title: "Vendor Workspace",
    shortTitle: "Vendor",
    subtitle: "Orders, Delivery, and Launch Support",
    description:
      "Manage purchase orders, delivery coordination, installations, and launch support tasks.",
    iconName: "PackageCheck",
    accentClassName: "bg-violet-600",
    backgroundClassName: "bg-violet-50",
    borderClassName: "border-violet-200",
    textClassName: "text-violet-800",
    badgeClassName:
      "border border-violet-200 bg-violet-50 text-violet-800",
    buttonClassName:
      "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
  },

  administrator: {
    title: "Administrator Workspace",
    shortTitle: "Administrator",
    subtitle: "Governance and Operational Oversight",
    description:
      "Manage approvals, escalations, policy reviews, exceptions, compliance, and operational oversight.",
    iconName: "ShieldCheck",
    accentClassName: "bg-slate-900",
    backgroundClassName: "bg-slate-100",
    borderClassName: "border-slate-300",
    textClassName: "text-slate-900",
    badgeClassName:
      "border border-slate-300 bg-slate-100 text-slate-900",
    buttonClassName:
      "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700",
  },
};

/* ==========================================================================
   WORKSPACE STATUS LABELS
   ========================================================================== */

export const WORKSPACE_STATUS_LABELS: Record<WorkspaceStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  restricted: "Restricted",
  suspended: "Suspended",
  archived: "Archived",
};

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  active: "Active",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  cancelled: "Cancelled",
  declined: "Declined",
  expired: "Expired",
  archived: "Archived",
};

/* ==========================================================================
   STATUS UI CLASSES
   ========================================================================== */

export interface StatusStyleConstant {
  label: string;
  iconName: string;
  badgeClassName: string;
  dotClassName: string;
  textClassName: string;
  backgroundClassName: string;
  borderClassName: string;
}

export const RECORD_STATUS_STYLES: Record<
  RecordStatus,
  StatusStyleConstant
> = {
  draft: {
    label: "Draft",
    iconName: "FilePenLine",
    badgeClassName: "border border-slate-200 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-500",
    textClassName: "text-slate-700",
    backgroundClassName: "bg-slate-50",
    borderClassName: "border-slate-200",
  },

  pending: {
    label: "Pending",
    iconName: "Clock3",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-800",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-800",
    backgroundClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
  },

  active: {
    label: "Active",
    iconName: "CirclePlay",
    badgeClassName: "border border-blue-200 bg-blue-50 text-blue-800",
    dotClassName: "bg-blue-500",
    textClassName: "text-blue-800",
    backgroundClassName: "bg-blue-50",
    borderClassName: "border-blue-200",
  },

  in_progress: {
    label: "In Progress",
    iconName: "LoaderCircle",
    badgeClassName: "border border-cyan-200 bg-cyan-50 text-cyan-800",
    dotClassName: "bg-cyan-500",
    textClassName: "text-cyan-800",
    backgroundClassName: "bg-cyan-50",
    borderClassName: "border-cyan-200",
  },

  completed: {
    label: "Completed",
    iconName: "CircleCheckBig",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-800",
    backgroundClassName: "bg-emerald-50",
    borderClassName: "border-emerald-200",
  },

  overdue: {
    label: "Overdue",
    iconName: "TriangleAlert",
    badgeClassName: "border border-red-200 bg-red-50 text-red-800",
    dotClassName: "bg-red-500",
    textClassName: "text-red-800",
    backgroundClassName: "bg-red-50",
    borderClassName: "border-red-200",
  },

  cancelled: {
    label: "Cancelled",
    iconName: "CircleX",
    badgeClassName: "border border-slate-300 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-700",
    backgroundClassName: "bg-slate-50",
    borderClassName: "border-slate-300",
  },

  declined: {
    label: "Declined",
    iconName: "ThumbsDown",
    badgeClassName: "border border-rose-200 bg-rose-50 text-rose-800",
    dotClassName: "bg-rose-500",
    textClassName: "text-rose-800",
    backgroundClassName: "bg-rose-50",
    borderClassName: "border-rose-200",
  },

  expired: {
    label: "Expired",
    iconName: "TimerOff",
    badgeClassName: "border border-orange-200 bg-orange-50 text-orange-800",
    dotClassName: "bg-orange-500",
    textClassName: "text-orange-800",
    backgroundClassName: "bg-orange-50",
    borderClassName: "border-orange-200",
  },

  archived: {
    label: "Archived",
    iconName: "Archive",
    badgeClassName: "border border-zinc-200 bg-zinc-100 text-zinc-700",
    dotClassName: "bg-zinc-500",
    textClassName: "text-zinc-700",
    backgroundClassName: "bg-zinc-50",
    borderClassName: "border-zinc-200",
  },
};

/* ==========================================================================
   ASSIGNMENT STATUS
   ========================================================================== */

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  in_progress: "In Progress",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
  reassigned: "Reassigned",
};

export const ASSIGNMENT_STATUS_STYLES: Record<
  AssignmentStatus,
  StatusStyleConstant
> = {
  pending: {
    label: "Pending",
    iconName: "Clock3",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-800",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-800",
    backgroundClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
  },

  accepted: {
    label: "Accepted",
    iconName: "CircleCheck",
    badgeClassName: "border border-blue-200 bg-blue-50 text-blue-800",
    dotClassName: "bg-blue-500",
    textClassName: "text-blue-800",
    backgroundClassName: "bg-blue-50",
    borderClassName: "border-blue-200",
  },

  declined: {
    label: "Declined",
    iconName: "CircleX",
    badgeClassName: "border border-rose-200 bg-rose-50 text-rose-800",
    dotClassName: "bg-rose-500",
    textClassName: "text-rose-800",
    backgroundClassName: "bg-rose-50",
    borderClassName: "border-rose-200",
  },

  in_progress: {
    label: "In Progress",
    iconName: "LoaderCircle",
    badgeClassName: "border border-cyan-200 bg-cyan-50 text-cyan-800",
    dotClassName: "bg-cyan-500",
    textClassName: "text-cyan-800",
    backgroundClassName: "bg-cyan-50",
    borderClassName: "border-cyan-200",
  },

  completed: {
    label: "Completed",
    iconName: "CircleCheckBig",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-800",
    backgroundClassName: "bg-emerald-50",
    borderClassName: "border-emerald-200",
  },

  expired: {
    label: "Expired",
    iconName: "TimerOff",
    badgeClassName: "border border-orange-200 bg-orange-50 text-orange-800",
    dotClassName: "bg-orange-500",
    textClassName: "text-orange-800",
    backgroundClassName: "bg-orange-50",
    borderClassName: "border-orange-200",
  },

  cancelled: {
    label: "Cancelled",
    iconName: "Ban",
    badgeClassName: "border border-slate-300 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-700",
    backgroundClassName: "bg-slate-50",
    borderClassName: "border-slate-300",
  },

  reassigned: {
    label: "Reassigned",
    iconName: "RefreshCw",
    badgeClassName:
      "border border-violet-200 bg-violet-50 text-violet-800",
    dotClassName: "bg-violet-500",
    textClassName: "text-violet-800",
    backgroundClassName: "bg-violet-50",
    borderClassName: "border-violet-200",
  },
};

/* ==========================================================================
   ACKNOWLEDGMENT STATUS
   ========================================================================== */

export const ASSIGNMENT_ACKNOWLEDGMENT_STATUS_LABELS: Record<
  AssignmentAcknowledgmentStatus,
  string
> = {
  pending: "Awaiting Response",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  not_required: "Not Required",
};

export const ASSIGNMENT_ACKNOWLEDGMENT_STATUS_STYLES: Record<
  AssignmentAcknowledgmentStatus,
  StatusStyleConstant
> = {
  pending: {
    label: "Awaiting Response",
    iconName: "Clock3",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-800",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-800",
    backgroundClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
  },

  accepted: {
    label: "Accepted",
    iconName: "CircleCheck",
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-800",
    backgroundClassName: "bg-emerald-50",
    borderClassName: "border-emerald-200",
  },

  declined: {
    label: "Declined",
    iconName: "CircleX",
    badgeClassName: "border border-rose-200 bg-rose-50 text-rose-800",
    dotClassName: "bg-rose-500",
    textClassName: "text-rose-800",
    backgroundClassName: "bg-rose-50",
    borderClassName: "border-rose-200",
  },

  expired: {
    label: "Expired",
    iconName: "TimerOff",
    badgeClassName: "border border-orange-200 bg-orange-50 text-orange-800",
    dotClassName: "bg-orange-500",
    textClassName: "text-orange-800",
    backgroundClassName: "bg-orange-50",
    borderClassName: "border-orange-200",
  },

  not_required: {
    label: "Not Required",
    iconName: "MinusCircle",
    badgeClassName: "border border-slate-200 bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-700",
    backgroundClassName: "bg-slate-50",
    borderClassName: "border-slate-200",
  },
};

/* ==========================================================================
   PRIORITY
   ========================================================================== */

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  critical: "Critical",
};

export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
  critical: 5,
};

export const PRIORITY_STYLES: Record<
  PriorityLevel,
  StatusStyleConstant
> = {
  low: {
    label: "Low",
    iconName: "ArrowDown",
    badgeClassName: "border border-slate-200 bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-700",
    backgroundClassName: "bg-slate-50",
    borderClassName: "border-slate-200",
  },

  normal: {
    label: "Normal",
    iconName: "Minus",
    badgeClassName: "border border-blue-200 bg-blue-50 text-blue-800",
    dotClassName: "bg-blue-500",
    textClassName: "text-blue-800",
    backgroundClassName: "bg-blue-50",
    borderClassName: "border-blue-200",
  },

  high: {
    label: "High",
    iconName: "ArrowUp",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-900",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-900",
    backgroundClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
  },

  urgent: {
    label: "Urgent",
    iconName: "TriangleAlert",
    badgeClassName: "border border-orange-200 bg-orange-50 text-orange-900",
    dotClassName: "bg-orange-500",
    textClassName: "text-orange-900",
    backgroundClassName: "bg-orange-50",
    borderClassName: "border-orange-200",
  },

  critical: {
    label: "Critical",
    iconName: "Siren",
    badgeClassName: "border border-red-300 bg-red-100 text-red-900",
    dotClassName: "bg-red-600",
    textClassName: "text-red-900",
    backgroundClassName: "bg-red-50",
    borderClassName: "border-red-300",
  },
};

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info: "Information",
  success: "Success",
  warning: "Warning",
  error: "Error",
  assignment: "Assignment",
  message: "Message",
  deadline: "Deadline",
  reminder: "Reminder",
  approval: "Approval",
  escalation: "Escalation",
  system: "System",
};

export const NOTIFICATION_STATUS_LABELS: Record<
  NotificationStatus,
  string
> = {
  unread: "Unread",
  read: "Read",
  dismissed: "Dismissed",
  archived: "Archived",
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  info: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  error: "CircleX",
  assignment: "ClipboardList",
  message: "MessageSquare",
  deadline: "Timer",
  reminder: "BellRing",
  approval: "BadgeCheck",
  escalation: "Siren",
  system: "Settings",
};

/* ==========================================================================
   COMMUNICATIONS
   ========================================================================== */

export const COMMUNICATION_CHANNEL_LABELS: Record<
  CommunicationChannel,
  string
> = {
  platform: "Platform Message",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
  video: "Video Meeting",
  in_person: "In Person",
  whatsapp: "WhatsApp",
  other: "Other",
};

export const COMMUNICATION_CHANNEL_ICONS: Record<
  CommunicationChannel,
  string
> = {
  platform: "MessagesSquare",
  email: "Mail",
  sms: "MessageSquareText",
  phone: "Phone",
  video: "Video",
  in_person: "UsersRound",
  whatsapp: "MessageCircle",
  other: "Ellipsis",
};

export const COMMUNICATION_STATUS_LABELS: Record<
  CommunicationStatus,
  string
> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  received: "Received",
  read: "Read",
  cancelled: "Cancelled",
};

/* ==========================================================================
   DOCUMENTS
   ========================================================================== */

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  uploaded: "Uploaded",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  archived: "Archived",
};

/* ==========================================================================
   REPORTS
   ========================================================================== */

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
  archived: "Archived",
};

/* ==========================================================================
   WORKSPACE ACTION LABELS
   ========================================================================== */

export const WORKSPACE_ACTION_LABELS: Record<WorkspaceAction, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  assign: "Assign",
  accept: "Accept",
  decline: "Decline",
  complete: "Complete",
  reassign: "Reassign",
  approve: "Approve",
  reject: "Reject",
  escalate: "Escalate",
  message: "Message",
  upload: "Upload",
  download: "Download",
  export: "Export",
  manage: "Manage",
};

/* ==========================================================================
   DEFAULT ASSIGNMENT CONFIGURATION
   ========================================================================== */

export const DEFAULT_ASSIGNMENT_ACKNOWLEDGMENT_HOURS = 24;

export const DEFAULT_ASSIGNMENT_REMINDER_HOURS = 12;

export const DEFAULT_ASSIGNMENT_ESCALATION_HOURS = 24;

export const DEFAULT_ASSIGNMENT_REASSIGNMENT_HOURS = 48;

export const DEFAULT_ASSIGNMENT_DUE_DAYS = 7;

export const DEFAULT_ASSIGNMENT_REFRESH_INTERVAL_MS = 60_000;

export const DEFAULT_ASSIGNMENT_COUNTDOWN_INTERVAL_MS = 1_000;

export const DEFAULT_ASSIGNMENT_AUTO_REFRESH_ENABLED = true;

export const DEFAULT_ASSIGNMENT_REQUIRES_ACKNOWLEDGMENT = true;

export const DEFAULT_ASSIGNMENT_PRIORITY: PriorityLevel = "normal";

export const DEFAULT_ASSIGNMENT_STATUS: AssignmentStatus = "pending";

export const DEFAULT_ASSIGNMENT_ACKNOWLEDGMENT_STATUS:
  AssignmentAcknowledgmentStatus = "pending";

export const DEFAULT_ASSIGNMENT_SORT: AssignmentSort = {
  field: "acknowledgmentDeadline",
  direction: "asc",
};

export const DEFAULT_ASSIGNMENT_PAGE_SIZE = 10;

export const ASSIGNMENT_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100] as const;

export const ASSIGNMENT_DECLINE_REASON_MIN_LENGTH = 3;

export const ASSIGNMENT_DECLINE_REASON_MAX_LENGTH = 500;

export const ASSIGNMENT_COMPLETION_NOTE_MAX_LENGTH = 2_000;

export const ASSIGNMENT_DESCRIPTION_MAX_LENGTH = 5_000;

export const ASSIGNMENT_TITLE_MAX_LENGTH = 160;

export const ASSIGNMENT_TAG_MAX_LENGTH = 50;

export const ASSIGNMENT_MAX_TAGS = 10;

/* ==========================================================================
   ASSIGNMENT COUNTDOWN THRESHOLDS
   ========================================================================== */

export const ASSIGNMENT_COUNTDOWN_THRESHOLDS = {
  criticalMinutes: 60,
  urgentHours: 4,
  warningHours: 12,
  normalHours: 24,
} as const;

export const ASSIGNMENT_COUNTDOWN_LABELS = {
  expired: "Response deadline expired",
  lessThanMinute: "Less than 1 minute remaining",
  minute: "1 minute remaining",
  minutes: "minutes remaining",
  hour: "1 hour remaining",
  hours: "hours remaining",
  day: "1 day remaining",
  days: "days remaining",
  noDeadline: "No deadline",
} as const;

/* ==========================================================================
   DEFAULT API ENDPOINTS
   ========================================================================== */

export const WORKSPACE_API_ENDPOINTS = {
  assignments: {
    list: "/api/workspace/assignments",
    pending: "/api/workspace/assignments/pending",
    accept: "/api/workspace/assignments/accept",
    decline: "/api/workspace/assignments/decline",
    complete: "/api/workspace/assignments/complete",
    reassign: "/api/workspace/assignments/reassign",
  },

  coachAssignments: {
    pending: "/api/coach-assignments/pending",
    acknowledge: "/api/coach-assignments/acknowledge",
    decline: "/api/coach-assignments/decline",
  },

  notifications: {
    list: "/api/workspace/notifications",
    read: "/api/workspace/notifications/read",
    dismiss: "/api/workspace/notifications/dismiss",
  },

  communications: {
    list: "/api/workspace/communications",
    send: "/api/workspace/communications/send",
  },

  documents: {
    list: "/api/workspace/documents",
    upload: "/api/workspace/documents/upload",
  },

  reports: {
    list: "/api/workspace/reports",
    submit: "/api/workspace/reports/submit",
  },
} as const;

/* ==========================================================================
   DASHBOARD CONFIGURATION
   ========================================================================== */

export const DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS = 120_000;

export const DEFAULT_DASHBOARD_AUTO_REFRESH_ENABLED = true;

export const DEFAULT_DASHBOARD_METRIC_LIMIT = 8;

export const DEFAULT_DASHBOARD_ASSIGNMENT_LIMIT = 5;

export const DEFAULT_DASHBOARD_NOTIFICATION_LIMIT = 5;

export const DEFAULT_DASHBOARD_TIMELINE_LIMIT = 10;

export const DEFAULT_DASHBOARD_QUICK_ACTION_LIMIT = 6;

export const DEFAULT_DASHBOARD_UPCOMING_EVENT_LIMIT = 5;

export const DEFAULT_DASHBOARD_DOCUMENT_LIMIT = 5;

export const DEFAULT_DASHBOARD_REPORT_LIMIT = 5;

/* ==========================================================================
   SEARCH CONFIGURATION
   ========================================================================== */

export const DEFAULT_SEARCH_DEBOUNCE_MS = 350;

export const DEFAULT_SEARCH_MINIMUM_CHARACTERS = 2;

export const DEFAULT_SEARCH_PAGE_SIZE = 20;

export const SEARCH_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100] as const;

export const DEFAULT_SEARCH_RESULT_LIMIT = 20;

export const DEFAULT_FILTER_PANEL_OPEN = false;

/* ==========================================================================
   NOTIFICATION CONFIGURATION
   ========================================================================== */

export const DEFAULT_NOTIFICATION_REFRESH_INTERVAL_MS = 60_000;

export const DEFAULT_NOTIFICATION_TOAST_DURATION_MS = 5_000;

export const DEFAULT_NOTIFICATION_PAGE_SIZE = 20;

export const NOTIFICATION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_NOTIFICATION_RETENTION_DAYS = 90;

export const DEFAULT_NOTIFICATION_SOUND_ENABLED = false;

/* ==========================================================================
   COMMUNICATION CONFIGURATION
   ========================================================================== */

export const DEFAULT_COMMUNICATION_PAGE_SIZE = 20;

export const DEFAULT_COMMUNICATION_REFRESH_INTERVAL_MS = 60_000;

export const DEFAULT_COMMUNICATION_CHANNEL: CommunicationChannel =
  "platform";

export const DEFAULT_MESSAGE_MAX_LENGTH = 5_000;

export const DEFAULT_MESSAGE_SUBJECT_MAX_LENGTH = 160;

export const DEFAULT_SMS_MAX_LENGTH = 320;

export const DEFAULT_EMAIL_SUBJECT_MAX_LENGTH = 160;

/* ==========================================================================
   DOCUMENT CONFIGURATION
   ========================================================================== */

export const DEFAULT_DOCUMENT_PAGE_SIZE = 20;

export const DEFAULT_MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;

export const DEFAULT_MAX_DOCUMENT_SIZE_MB = 25;

export const DEFAULT_ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;

export const DEFAULT_ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/* ==========================================================================
   REPORT CONFIGURATION
   ========================================================================== */

export const DEFAULT_REPORT_PAGE_SIZE = 20;

export const DEFAULT_REPORT_EXPORT_FORMAT = "pdf";

export const REPORT_EXPORT_FORMATS = [
  "pdf",
  "csv",
  "xlsx",
  "json",
] as const;

export const DEFAULT_REPORT_RETENTION_DAYS = 365;

/* ==========================================================================
   DATE AND TIME FORMATS
   ========================================================================== */

export const DATE_FORMATS = {
  shortDate: "MM/dd/yyyy",
  mediumDate: "MMM d, yyyy",
  longDate: "MMMM d, yyyy",
  shortDateTime: "MM/dd/yyyy h:mm a",
  mediumDateTime: "MMM d, yyyy h:mm a",
  longDateTime: "MMMM d, yyyy 'at' h:mm a",
  timeOnly: "h:mm a",
  timeWithSeconds: "h:mm:ss a",
  monthYear: "MMMM yyyy",
  isoDate: "yyyy-MM-dd",
  isoDateTime: "yyyy-MM-dd'T'HH:mm:ssXXX",
} as const;

export const DEFAULT_DATE_FORMAT = DATE_FORMATS.mediumDate;

export const DEFAULT_DATETIME_FORMAT = DATE_FORMATS.mediumDateTime;

export const DEFAULT_TIME_FORMAT = DATE_FORMATS.timeOnly;

export const DEFAULT_WEEK_STARTS_ON = 0;

/* ==========================================================================
   GENERIC PAGINATION
   ========================================================================== */

export const DEFAULT_PAGE_NUMBER = 1;

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100] as const;

export const DEFAULT_MAX_VISIBLE_PAGES = 7;

/* ==========================================================================
   GENERIC TEXT LIMITS
   ========================================================================== */

export const DEFAULT_NAME_MAX_LENGTH = 150;

export const DEFAULT_TITLE_MAX_LENGTH = 160;

export const DEFAULT_DESCRIPTION_MAX_LENGTH = 5_000;

export const DEFAULT_NOTE_MAX_LENGTH = 5_000;

export const DEFAULT_REASON_MAX_LENGTH = 1_000;

export const DEFAULT_REFERENCE_NUMBER_MAX_LENGTH = 100;

/* ==========================================================================
   EMPTY STATE CONTENT
   ========================================================================== */

export const WORKSPACE_EMPTY_STATES = {
  assignments: {
    title: "No assignments found",
    description:
      "There are currently no assignments matching the selected filters.",
    iconName: "ClipboardCheck",
  },

  pendingAssignments: {
    title: "No pending assignments",
    description:
      "You have responded to all assignments requiring acknowledgment.",
    iconName: "CircleCheckBig",
  },

  notifications: {
    title: "No notifications",
    description: "You have no new workspace notifications.",
    iconName: "BellOff",
  },

  communications: {
    title: "No communications",
    description: "No communication activity is available.",
    iconName: "MessageSquareOff",
  },

  documents: {
    title: "No documents",
    description: "No workspace documents have been uploaded.",
    iconName: "FileX",
  },

  reports: {
    title: "No reports",
    description: "No workspace reports are currently available.",
    iconName: "FileChartColumn",
  },

  timeline: {
    title: "No activity",
    description: "No workspace activity has been recorded.",
    iconName: "History",
  },

  search: {
    title: "No results found",
    description: "Try changing your search terms or filters.",
    iconName: "SearchX",
  },
} as const;

/* ==========================================================================
   LOADING AND ERROR MESSAGES
   ========================================================================== */

export const WORKSPACE_LOADING_MESSAGES = {
  workspace: "Loading workspace...",
  dashboard: "Loading dashboard...",
  assignments: "Loading assignments...",
  notifications: "Loading notifications...",
  communications: "Loading communications...",
  timeline: "Loading activity...",
  documents: "Loading documents...",
  reports: "Loading reports...",
  search: "Searching...",
  acceptingAssignment: "Accepting assignment...",
  decliningAssignment: "Declining assignment...",
  completingAssignment: "Completing assignment...",
  refreshing: "Refreshing...",
} as const;

export const WORKSPACE_ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  unauthorized: "You are not authorized to access this workspace.",
  forbidden: "You do not have permission to perform this action.",
  sessionExpired: "Your session has expired. Please sign in again.",
  network: "Unable to connect. Please check your connection and try again.",
  loadWorkspace: "Unable to load the workspace.",
  loadAssignments: "Unable to load assignments.",
  acceptAssignment: "Unable to accept the assignment.",
  declineAssignment: "Unable to decline the assignment.",
  completeAssignment: "Unable to complete the assignment.",
  loadNotifications: "Unable to load notifications.",
  loadCommunications: "Unable to load communications.",
  loadTimeline: "Unable to load activity history.",
  loadDocuments: "Unable to load documents.",
  loadReports: "Unable to load reports.",
  validation: "Please review the highlighted fields.",
} as const;

export const WORKSPACE_SUCCESS_MESSAGES = {
  assignmentAccepted: "Assignment accepted successfully.",
  assignmentDeclined: "Assignment declined successfully.",
  assignmentCompleted: "Assignment completed successfully.",
  assignmentReassigned: "Assignment reassigned successfully.",
  notificationRead: "Notification marked as read.",
  messageSent: "Message sent successfully.",
  documentUploaded: "Document uploaded successfully.",
  reportSubmitted: "Report submitted successfully.",
  settingsSaved: "Workspace settings saved successfully.",
} as const;

/* ==========================================================================
   CONFIRMATION MESSAGES
   ========================================================================== */

export const WORKSPACE_CONFIRMATION_MESSAGES = {
  acceptAssignment:
    "Are you sure you want to accept this assignment?",
  declineAssignment:
    "Are you sure you want to decline this assignment?",
  completeAssignment:
    "Are you sure you want to mark this assignment as completed?",
  reassignAssignment:
    "Are you sure you want to reassign this assignment?",
  deleteDocument:
    "Are you sure you want to delete this document?",
  dismissNotification:
    "Are you sure you want to dismiss this notification?",
} as const;

/* ==========================================================================
   DEFAULT DECLINE REASONS
   ========================================================================== */

export const DEFAULT_ASSIGNMENT_DECLINE_REASONS = [
  {
    value: "capacity",
    label: "Current workload or capacity",
  },
  {
    value: "scheduling_conflict",
    label: "Scheduling conflict",
  },
  {
    value: "outside_expertise",
    label: "Outside my area of expertise",
  },
  {
    value: "conflict_of_interest",
    label: "Potential conflict of interest",
  },
  {
    value: "unavailable",
    label: "Temporarily unavailable",
  },
  {
    value: "incorrect_assignment",
    label: "Assignment appears to be incorrect",
  },
  {
    value: "other",
    label: "Other reason",
  },
] as const;

/* ==========================================================================
   ROLE-SPECIFIC ASSIGNMENT LABELS
   ========================================================================== */

export const ROLE_ASSIGNMENT_LABELS: Record<
  WorkspaceRole,
  {
    singular: string;
    plural: string;
    pendingTitle: string;
    pendingDescription: string;
  }
> = {
  coach: {
    singular: "Coach Assignment",
    plural: "Coach Assignments",
    pendingTitle: "Pending Entrepreneur Assignments",
    pendingDescription:
      "Review and respond to new entrepreneur assignments.",
  },

  partner: {
    singular: "Partner Assignment",
    plural: "Partner Assignments",
    pendingTitle: "Pending Partner Assignments",
    pendingDescription:
      "Review service requests, obligations, and resource coordination assignments.",
  },

  supporter: {
    singular: "Supporter Assignment",
    plural: "Supporter Assignments",
    pendingTitle: "Pending Supporter Activities",
    pendingDescription:
      "Review participation commitments and community engagement activities.",
  },

  vendor: {
    singular: "Vendor Assignment",
    plural: "Vendor Assignments",
    pendingTitle: "Pending Vendor Assignments",
    pendingDescription:
      "Review purchase orders, deliveries, installations, and launch support tasks.",
  },

  administrator: {
    singular: "Administrative Assignment",
    plural: "Administrative Assignments",
    pendingTitle: "Pending Administrative Reviews",
    pendingDescription:
      "Review approvals, escalations, policy matters, and operational exceptions.",
  },
};

/* ==========================================================================
   NAVIGATION ORDER
   ========================================================================== */

export const DEFAULT_NAVIGATION_ORDER: ExtendedWorkspaceModule[] = [
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
  "documents",
  "calendar",
  "tasks",
  "reports",
  "notifications",
  "timeline",
  "activity",
  "settings",
];

/* ==========================================================================
   RESPONSIVE BREAKPOINT LABELS
   ========================================================================== */

/**
 * Tailwind breakpoint values are included as documentation and may also
 * support non-Tailwind layout calculations.
 */
export const WORKSPACE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/* ==========================================================================
   ACCESSIBILITY
   ========================================================================== */

export const WORKSPACE_ACCESSIBILITY_LABELS = {
  openNavigation: "Open workspace navigation",
  closeNavigation: "Close workspace navigation",
  openNotifications: "Open notifications",
  refreshAssignments: "Refresh assignments",
  acceptAssignment: "Accept assignment",
  declineAssignment: "Decline assignment",
  viewAssignment: "View assignment details",
  searchWorkspace: "Search workspace",
  clearSearch: "Clear search",
  openFilters: "Open filters",
  closeFilters: "Close filters",
  nextPage: "Go to next page",
  previousPage: "Go to previous page",
} as const;

/* ==========================================================================
   STORAGE KEYS
   ========================================================================== */

export const WORKSPACE_STORAGE_KEYS = {
  activeRole: "epew_workspace_active_role",
  activeModule: "epew_workspace_active_module",
  sidebarCollapsed: "epew_workspace_sidebar_collapsed",
  filters: "epew_workspace_filters",
  assignmentView: "epew_workspace_assignment_view",
  dashboardLayout: "epew_workspace_dashboard_layout",
  notificationPreferences: "epew_workspace_notification_preferences",
} as const;

/* ==========================================================================
   TEST IDENTIFIERS
   ========================================================================== */

export const WORKSPACE_TEST_IDS = {
  workspaceRoot: "workspace-root",
  workspaceHeader: "workspace-header",
  workspaceSidebar: "workspace-sidebar",
  workspaceNavigation: "workspace-navigation",
  workspaceContent: "workspace-content",
  assignmentList: "assignment-list",
  assignmentCard: "assignment-card",
  assignmentAcceptButton: "assignment-accept-button",
  assignmentDeclineButton: "assignment-decline-button",
  assignmentCountdown: "assignment-countdown",
  notificationList: "notification-list",
  workspaceSearch: "workspace-search",
} as const;

/* ==========================================================================
   DEVELOPMENT AND LOGGING
   ========================================================================== */

export const WORKSPACE_LOG_PREFIX = "[EnterpriseWorkspace]";

export const WORKSPACE_DEBUG_ENABLED =
  process.env.NODE_ENV !== "production";

export const WORKSPACE_LOG_EVENTS = {
  initialized: "workspace_initialized",
  moduleChanged: "workspace_module_changed",
  assignmentLoaded: "assignment_loaded",
  assignmentAccepted: "assignment_accepted",
  assignmentDeclined: "assignment_declined",
  assignmentCompleted: "assignment_completed",
  assignmentExpired: "assignment_expired",
  refreshStarted: "workspace_refresh_started",
  refreshCompleted: "workspace_refresh_completed",
  error: "workspace_error",
} as const;

/* ==========================================================================
   TYPE-SAFE HELPERS FOR CONSTANT LOOKUPS
   ========================================================================== */

/**
 * These fallback constants allow components to safely render future roles
 * and modules that may not yet be registered in the primary type arrays.
 */

export const UNKNOWN_WORKSPACE_ROLE_LABEL = "Workspace User";

export const UNKNOWN_WORKSPACE_MODULE_LABEL = "Module";

export const UNKNOWN_STATUS_LABEL = "Unknown";

export const UNKNOWN_ICON_NAME = "CircleHelp";

export const DEFAULT_EXTENDED_ROLE: ExtendedWorkspaceRole = "coach";

export const DEFAULT_EXTENDED_MODULE: ExtendedWorkspaceModule = "dashboard";