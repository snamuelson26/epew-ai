// ============================================================
// EPEW-EDE-IBOS
// Enterprise Communication Center
// Communication Groups Types
// ============================================================

export type CommunicationGroupType =
  | "entrepreneurs"
  | "supporters"
  | "coaches"
  | "partners"
  | "vendors"
  | "organizations"
  | "churches"
  | "businesses"
  | "community_leaders"
  | "government"
  | "media"
  | "volunteers"
  | "founding_supporters"
  | "qualified_entrepreneurs"
  | "funding_queue"
  | "business_launch"
  | "annual_meeting"
  | "custom";

export type CommunicationGroupMode = "static" | "smart" | "system";

export type CommunicationChannel =
  | "sms"
  | "whatsapp"
  | "email"
  | "all"
  | "multichannel";

export type CommunicationLanguage =
  | "english"
  | "haitian_creole"
  | "french"
  | "spanish"
  | "tagalog"
  | "multilingual";

export type CommunicationGroupVisibility =
  | "admin"
  | "partner"
  | "organization"
  | "private";

export type CommunicationGroupStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived";

export type CommunicationPartnerCode =
  | "kleernest"
  | "orgdh_network";

export type CommunicationMembershipSource =
  | "manual"
  | "import"
  | "smart_rule"
  | "system"
  | "organization"
  | "campaign"
  | "event";

export type CommunicationMembershipStatus =
  | "active"
  | "inactive"
  | "excluded"
  | "removed";

export type CommunicationRuleType =
  | "contact_filter"
  | "role_filter"
  | "location_filter"
  | "language_filter"
  | "permission_filter"
  | "engagement_filter"
  | "campaign_filter"
  | "event_filter"
  | "business_filter"
  | "compliance_filter"
  | "custom";

export type CommunicationRuleMatchMode = "all" | "any";

export type CommunicationRuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "in"
  | "not_in"
  | "before"
  | "after";

export type CommunicationCampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "sending"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

export type CommunicationGroupHistoryAction =
  | "created"
  | "updated"
  | "activated"
  | "deactivated"
  | "archived"
  | "restored"
  | "member_added"
  | "member_removed"
  | "members_imported"
  | "rule_created"
  | "rule_updated"
  | "rule_deleted"
  | "rule_evaluated"
  | "campaign_created"
  | "campaign_sent"
  | "merged"
  | "duplicated"
  | "exported"
  | "deleted";

export interface CommunicationGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  group_type: CommunicationGroupType;
  group_mode: CommunicationGroupMode;

  preferred_channel: CommunicationChannel;
  preferred_language: CommunicationLanguage;

  visibility: CommunicationGroupVisibility;
  status: CommunicationGroupStatus;

  partner_code: CommunicationPartnerCode | null;
  entity_id: string | null;

  member_count: number;
  campaign_ready: boolean;

  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;

  is_protected: boolean;
  is_system_group: boolean;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface CommunicationGroupMember {
  id: string;
  group_id: string;
  contact_id: string;

  membership_source: CommunicationMembershipSource;
  membership_status: CommunicationMembershipStatus;

  added_by: string | null;
  added_at: string;

  removed_by: string | null;
  removed_at: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CommunicationGroupRuleCondition {
  field: string;
  operator: CommunicationRuleOperator;
  value?: string | number | boolean | string[] | number[] | null;
}

export interface CommunicationGroupRulePayload {
  conditions: CommunicationGroupRuleCondition[];
}

export interface CommunicationGroupRule {
  id: string;
  group_id: string;

  rule_name: string;
  description: string | null;

  rule_type: CommunicationRuleType;
  match_mode: CommunicationRuleMatchMode;

  rule_json: CommunicationGroupRulePayload;

  priority: number;
  is_active: boolean;

  last_evaluated_at: string | null;
  last_match_count: number;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface CommunicationGroupCampaign {
  id: string;
  group_id: string;

  campaign_id: string | null;
  campaign_name: string | null;

  channel: Exclude<CommunicationChannel, "all">;
  campaign_status: CommunicationCampaignStatus;

  audience_size: number;
  members_attempted: number;
  members_sent: number;
  members_delivered: number;
  members_failed: number;

  opened_count: number;
  clicked_count: number;
  responded_count: number;
  registration_count: number;

  estimated_cost: number;
  actual_cost: number;

  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  approved_by: string | null;
  approved_at: string | null;

  created_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface CommunicationGroupHistory {
  id: string;
  group_id: string | null;

  action_type: CommunicationGroupHistoryAction;
  action_summary: string;

  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;

  performed_by: string | null;
  created_at: string;
}

export interface CommunicationGroupWithRelations
  extends CommunicationGroup {
  rules?: CommunicationGroupRule[];
  members?: CommunicationGroupMember[];
  campaigns?: CommunicationGroupCampaign[];
}

export interface CommunicationGroupListItem
  extends CommunicationGroup {
  last_campaign_name?: string | null;
  last_campaign_date?: string | null;
  active_rule_count?: number;
}

export interface CommunicationGroupStatistics {
  total_groups: number;
  smart_groups: number;
  static_groups: number;
  system_groups: number;
  active_groups: number;
  archived_groups: number;
  total_memberships: number;
  campaign_ready_groups: number;
  new_groups_this_week: number;
}

export interface CommunicationGroupChannelReadiness {
  total_members: number;
  sms_ready: number;
  whatsapp_ready: number;
  email_ready: number;
  multichannel_ready: number;
  missing_phone: number;
  missing_email: number;
  permission_restricted: number;
}

export interface CreateCommunicationGroupInput {
  name: string;
  slug?: string;
  description?: string | null;

  group_type: CommunicationGroupType;
  group_mode: CommunicationGroupMode;

  preferred_channel: CommunicationChannel;
  preferred_language: CommunicationLanguage;

  visibility: CommunicationGroupVisibility;
  status?: CommunicationGroupStatus;

  partner_code?: CommunicationPartnerCode | null;
  entity_id?: string | null;

  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  email_enabled?: boolean;

  is_protected?: boolean;
  is_system_group?: boolean;

  created_by?: string | null;
}

export interface UpdateCommunicationGroupInput {
  name?: string;
  slug?: string;
  description?: string | null;

  group_type?: CommunicationGroupType;
  group_mode?: CommunicationGroupMode;

  preferred_channel?: CommunicationChannel;
  preferred_language?: CommunicationLanguage;

  visibility?: CommunicationGroupVisibility;
  status?: CommunicationGroupStatus;

  partner_code?: CommunicationPartnerCode | null;
  entity_id?: string | null;

  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  email_enabled?: boolean;

  campaign_ready?: boolean;

  updated_by?: string | null;
}

export interface CreateCommunicationGroupRuleInput {
  group_id: string;

  rule_name: string;
  description?: string | null;

  rule_type: CommunicationRuleType;
  match_mode: CommunicationRuleMatchMode;

  rule_json: CommunicationGroupRulePayload;

  priority?: number;
  is_active?: boolean;

  created_by?: string | null;
}

export interface UpdateCommunicationGroupRuleInput {
  rule_name?: string;
  description?: string | null;

  rule_type?: CommunicationRuleType;
  match_mode?: CommunicationRuleMatchMode;

  rule_json?: CommunicationGroupRulePayload;

  priority?: number;
  is_active?: boolean;

  updated_by?: string | null;
}

export interface AddCommunicationGroupMemberInput {
  group_id: string;
  contact_id: string;

  membership_source?: CommunicationMembershipSource;
  membership_status?: CommunicationMembershipStatus;

  added_by?: string | null;
  notes?: string | null;
}

export interface CommunicationGroupFilters {
  search?: string;
  group_type?: CommunicationGroupType | "all";
  group_mode?: CommunicationGroupMode | "all";
  status?: CommunicationGroupStatus | "all";
  preferred_channel?: CommunicationChannel | "all";
  preferred_language?: CommunicationLanguage | "all";
  partner_code?: CommunicationPartnerCode | "all";
  campaign_ready?: boolean | "all";
}

export interface CommunicationGroupSort {
  field:
    | "name"
    | "created_at"
    | "updated_at"
    | "member_count"
    | "group_type"
    | "group_mode";
  direction: "asc" | "desc";
}

export interface CommunicationGroupPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CommunicationGroupQueryResult {
  groups: CommunicationGroupListItem[];
  statistics: CommunicationGroupStatistics;
  pagination: CommunicationGroupPagination;
}

export interface SmartGroupEvaluationResult {
  group_id: string;
  rule_id?: string;
  evaluated_at: string;
  matched_contact_ids: string[];
  match_count: number;
  added_count: number;
  removed_count: number;
  skipped_count: number;
  errors: string[];
}

export interface CommunicationGroupActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CommunicationGroupOption {
  label: string;
  value: string;
}

export const COMMUNICATION_GROUP_TYPE_OPTIONS: CommunicationGroupOption[] = [
  { label: "Entrepreneurs", value: "entrepreneurs" },
  { label: "Supporters", value: "supporters" },
  { label: "Coaches", value: "coaches" },
  { label: "Partners", value: "partners" },
  { label: "Vendors", value: "vendors" },
  { label: "Organizations", value: "organizations" },
  { label: "Churches", value: "churches" },
  { label: "Businesses", value: "businesses" },
  { label: "Community Leaders", value: "community_leaders" },
  { label: "Government", value: "government" },
  { label: "Media", value: "media" },
  { label: "Volunteers", value: "volunteers" },
  { label: "Founding Supporters", value: "founding_supporters" },
  {
    label: "Qualified Entrepreneurs",
    value: "qualified_entrepreneurs",
  },
  { label: "Funding Queue", value: "funding_queue" },
  { label: "Business Launch", value: "business_launch" },
  { label: "Annual Meeting", value: "annual_meeting" },
  { label: "Custom", value: "custom" },
];

export const COMMUNICATION_GROUP_MODE_OPTIONS: CommunicationGroupOption[] = [
  { label: "Static Group", value: "static" },
  { label: "Smart Group", value: "smart" },
  { label: "System Group", value: "system" },
];

export const COMMUNICATION_CHANNEL_OPTIONS: CommunicationGroupOption[] = [
  { label: "All Channels", value: "all" },
  { label: "SMS", value: "sms" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
];

export const COMMUNICATION_LANGUAGE_OPTIONS: CommunicationGroupOption[] = [
  { label: "English", value: "english" },
  { label: "Haitian Creole", value: "haitian_creole" },
  { label: "French", value: "french" },
  { label: "Spanish", value: "spanish" },
  { label: "Tagalog", value: "tagalog" },
  { label: "Multilingual", value: "multilingual" },
];

export const COMMUNICATION_VISIBILITY_OPTIONS: CommunicationGroupOption[] = [
  { label: "Administrator Only", value: "admin" },
  { label: "Partner Access", value: "partner" },
  { label: "Organization Access", value: "organization" },
  { label: "Private", value: "private" },
];

export const COMMUNICATION_STATUS_OPTIONS: CommunicationGroupOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Archived", value: "archived" },
];

export const COMMUNICATION_PARTNER_OPTIONS: CommunicationGroupOption[] = [
  { label: "Kleernest", value: "kleernest" },
  { label: "ORGDH Network", value: "orgdh_network" },
];

export function formatCommunicationGroupType(
  value: CommunicationGroupType,
): string {
  return (
    COMMUNICATION_GROUP_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

export function formatCommunicationGroupMode(
  value: CommunicationGroupMode,
): string {
  return (
    COMMUNICATION_GROUP_MODE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

export function formatCommunicationChannel(
  value: CommunicationChannel,
): string {
  return (
    COMMUNICATION_CHANNEL_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

export function formatCommunicationLanguage(
  value: CommunicationLanguage,
): string {
  return (
    COMMUNICATION_LANGUAGE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

export function createCommunicationGroupSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isCommunicationGroupEditable(
  group: CommunicationGroup,
): boolean {
  return !group.is_protected;
}

export function isCommunicationGroupDeletable(
  group: CommunicationGroup,
): boolean {
  return !group.is_protected && !group.is_system_group;
}

export function isCommunicationGroupSmart(
  group: CommunicationGroup,
): boolean {
  return group.group_mode === "smart";
}

export function isCommunicationGroupCampaignReady(
  group: CommunicationGroup,
): boolean {
  return (
    group.status === "active" &&
    group.member_count > 0 &&
    group.campaign_ready
  );
}