// ============================================================
// EPEW-EDE-IBOS
// Enterprise Communication Center
// Communication Groups Data Layer
// ============================================================

import { createClient } from "@/lib/supabase/client";

import type {
  AddCommunicationGroupMemberInput,
  CommunicationGroup,
  CommunicationGroupActionResult,
  CommunicationGroupCampaign,
  CommunicationGroupFilters,
  CommunicationGroupHistory,
  CommunicationGroupListItem,
  CommunicationGroupMember,
  CommunicationGroupPagination,
  CommunicationGroupQueryResult,
  CommunicationGroupRule,
  CommunicationGroupSort,
  CommunicationGroupStatistics,
  CreateCommunicationGroupInput,
  CreateCommunicationGroupRuleInput,
  UpdateCommunicationGroupInput,
  UpdateCommunicationGroupRuleInput,
} from "@/lib/types/communication-groups";

import { createCommunicationGroupSlug } from "@/lib/types/communication-groups";

// ============================================================
// INTERNAL TYPES
// ============================================================

interface CurrentUserResult {
  userId: string | null;
  error: string | null;
}

interface ListGroupsOptions {
  filters?: CommunicationGroupFilters;
  sort?: CommunicationGroupSort;
  page?: number;
  pageSize?: number;
}

interface CommunicationGroupCampaignSummaryRow {
  group_id: string;
  campaign_name: string | null;
  created_at: string;
}

interface CommunicationGroupRuleCountRow {
  group_id: string;
}

interface GroupMembershipRow {
  id: string;
}

interface GroupCountRow {
  group_mode: "static" | "smart" | "system";
  status: "draft" | "active" | "inactive" | "archived";
  campaign_ready: boolean;
  created_at: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================================
// HELPERS
// ============================================================

function normalizePage(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

function normalizePageSize(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function normalizeSearchTerm(value?: string): string {
  return value?.trim() ?? "";
}

function getStartOfCurrentWeekIso(): string {
  const now = new Date();
  const day = now.getDay();

  const daysSinceMonday = day === 0 ? 6 : day - 1;

  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
}

function uniqueSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function cleanDatabaseError(error: unknown): string {
  if (!error) {
    return "An unknown database error occurred.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The requested operation could not be completed.";
}

async function getCurrentUser(): Promise<CurrentUserResult> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      userId: null,
      error: error.message,
    };
  }

  return {
    userId: user?.id ?? null,
    error: null,
  };
}

async function createUniqueGroupSlug(
  requestedName: string,
  requestedSlug?: string,
  excludeGroupId?: string,
): Promise<string> {
  const supabase = createClient();

  const baseSlug =
    createCommunicationGroupSlug(requestedSlug || requestedName) ||
    `communication-group-${uniqueSlugSuffix()}`;

  let candidate = baseSlug;
  let attempt = 0;

  while (attempt < 20) {
    let query = supabase
      .from("communication_groups")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (excludeGroupId) {
      query = query.neq("id", excludeGroupId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    attempt += 1;
    candidate = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${uniqueSlugSuffix()}`;
}

async function writeGroupHistory(input: {
  groupId: string | null;
  actionType: CommunicationGroupHistory["action_type"];
  actionSummary: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  performedBy?: string | null;
}): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("communication_group_history")
    .insert({
      group_id: input.groupId,
      action_type: input.actionType,
      action_summary: input.actionSummary,
      previous_values: input.previousValues ?? null,
      new_values: input.newValues ?? null,
      metadata: input.metadata ?? {},
      performed_by: input.performedBy ?? null,
    });

  if (error) {
    console.error(
      "Unable to write communication group history:",
      error.message,
    );
  }
}

// ============================================================
// GROUP STATISTICS
// ============================================================

export async function getCommunicationGroupStatistics(): Promise<
  CommunicationGroupActionResult<CommunicationGroupStatistics>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_groups")
      .select("group_mode,status,campaign_ready,created_at");

    if (error) {
      throw new Error(error.message);
    }

    const groups = (data ?? []) as GroupCountRow[];

    const weekStart = new Date(getStartOfCurrentWeekIso()).getTime();

    const { count: totalMemberships, error: membershipError } =
      await supabase
        .from("communication_group_members")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("membership_status", "active");

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const statistics: CommunicationGroupStatistics = {
      total_groups: groups.length,
      smart_groups: groups.filter(
        (group) => group.group_mode === "smart",
      ).length,
      static_groups: groups.filter(
        (group) => group.group_mode === "static",
      ).length,
      system_groups: groups.filter(
        (group) => group.group_mode === "system",
      ).length,
      active_groups: groups.filter(
        (group) => group.status === "active",
      ).length,
      archived_groups: groups.filter(
        (group) => group.status === "archived",
      ).length,
      total_memberships: totalMemberships ?? 0,
      campaign_ready_groups: groups.filter(
        (group) => group.campaign_ready,
      ).length,
      new_groups_this_week: groups.filter((group) => {
        return new Date(group.created_at).getTime() >= weekStart;
      }).length,
    };

    return {
      success: true,
      message: "Communication group statistics loaded.",
      data: statistics,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load communication group statistics.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// LIST GROUPS
// ============================================================

export async function getCommunicationGroups(
  options: ListGroupsOptions = {},
): Promise<CommunicationGroupActionResult<CommunicationGroupQueryResult>> {
  try {
    const supabase = createClient();

    const page = normalizePage(options.page);
    const pageSize = normalizePageSize(options.pageSize);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const filters = options.filters ?? {};
    const sort = options.sort ?? {
      field: "created_at",
      direction: "desc",
    };

    let query = supabase
      .from("communication_groups")
      .select("*", {
        count: "exact",
      });

    const search = normalizeSearchTerm(filters.search);

    if (search) {
      const escapedSearch = search.replace(/[%_]/g, "\\$&");

      query = query.or(
        [
          `name.ilike.%${escapedSearch}%`,
          `description.ilike.%${escapedSearch}%`,
          `slug.ilike.%${escapedSearch}%`,
        ].join(","),
      );
    }

    if (filters.group_type && filters.group_type !== "all") {
      query = query.eq("group_type", filters.group_type);
    }

    if (filters.group_mode && filters.group_mode !== "all") {
      query = query.eq("group_mode", filters.group_mode);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (
      filters.preferred_channel &&
      filters.preferred_channel !== "all"
    ) {
      query = query.eq(
        "preferred_channel",
        filters.preferred_channel,
      );
    }

    if (
      filters.preferred_language &&
      filters.preferred_language !== "all"
    ) {
      query = query.eq(
        "preferred_language",
        filters.preferred_language,
      );
    }

    if (filters.partner_code && filters.partner_code !== "all") {
      query = query.eq("partner_code", filters.partner_code);
    }

    if (typeof filters.campaign_ready === "boolean") {
      query = query.eq("campaign_ready", filters.campaign_ready);
    }

    const {
      data: groupRows,
      error,
      count,
    } = await query
      .order(sort.field, {
        ascending: sort.direction === "asc",
      })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const groups = (groupRows ?? []) as CommunicationGroup[];

    const groupIds = groups.map((group) => group.id);

    const lastCampaignMap = new Map<
      string,
      CommunicationGroupCampaignSummaryRow
    >();

    const activeRuleCountMap = new Map<string, number>();

    if (groupIds.length > 0) {
      const { data: campaignRows, error: campaignError } =
        await supabase
          .from("communication_group_campaigns")
          .select("group_id,campaign_name,created_at")
          .in("group_id", groupIds)
          .order("created_at", {
            ascending: false,
          });

      if (campaignError) {
        throw new Error(campaignError.message);
      }

      for (const campaign of (campaignRows ??
        []) as CommunicationGroupCampaignSummaryRow[]) {
        if (!lastCampaignMap.has(campaign.group_id)) {
          lastCampaignMap.set(campaign.group_id, campaign);
        }
      }

      const { data: ruleRows, error: ruleError } = await supabase
        .from("communication_group_rules")
        .select("group_id")
        .in("group_id", groupIds)
        .eq("is_active", true);

      if (ruleError) {
        throw new Error(ruleError.message);
      }

      for (const rule of (ruleRows ??
        []) as CommunicationGroupRuleCountRow[]) {
        const currentCount =
          activeRuleCountMap.get(rule.group_id) ?? 0;

        activeRuleCountMap.set(rule.group_id, currentCount + 1);
      }
    }

    const listItems: CommunicationGroupListItem[] = groups.map(
      (group) => {
        const lastCampaign = lastCampaignMap.get(group.id);

        return {
          ...group,
          last_campaign_name: lastCampaign?.campaign_name ?? null,
          last_campaign_date: lastCampaign?.created_at ?? null,
          active_rule_count:
            activeRuleCountMap.get(group.id) ?? 0,
        };
      },
    );

    const statisticsResult =
      await getCommunicationGroupStatistics();

    if (!statisticsResult.success || !statisticsResult.data) {
      throw new Error(
        statisticsResult.error ??
          "Unable to load communication group statistics.",
      );
    }

    const total = count ?? 0;

    const pagination: CommunicationGroupPagination = {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };

    return {
      success: true,
      message: "Communication groups loaded.",
      data: {
        groups: listItems,
        statistics: statisticsResult.data,
        pagination,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load communication groups.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// GET ONE GROUP
// ============================================================

export async function getCommunicationGroupById(
  groupId: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Communication group loaded.",
      data: data as CommunicationGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function getCommunicationGroupBySlug(
  slug: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_groups")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Communication group loaded.",
      data: data as CommunicationGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// CREATE GROUP
// ============================================================

export async function createCommunicationGroup(
  input: CreateCommunicationGroupInput,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  try {
    const supabase = createClient();

    const name = input.name.trim();

    if (!name) {
      return {
        success: false,
        message: "Group name is required.",
        error: "Enter a valid communication group name.",
      };
    }

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const slug = await createUniqueGroupSlug(
      name,
      input.slug,
    );

    const payload = {
      name,
      slug,
      description: input.description?.trim() || null,

      group_type: input.group_type,
      group_mode: input.group_mode,

      preferred_channel: input.preferred_channel,
      preferred_language: input.preferred_language,

      visibility: input.visibility,
      status: input.status ?? "active",

      partner_code: input.partner_code ?? null,
      entity_id: input.entity_id ?? null,

      sms_enabled: input.sms_enabled ?? true,
      whatsapp_enabled: input.whatsapp_enabled ?? true,
      email_enabled: input.email_enabled ?? true,

      is_protected: input.is_protected ?? false,
      is_system_group: input.is_system_group ?? false,

      created_by: input.created_by ?? currentUser.userId,
      updated_by: input.created_by ?? currentUser.userId,
    };

    const { data, error } = await supabase
      .from("communication_groups")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const group = data as CommunicationGroup;

    return {
      success: true,
      message: `${group.name} was created successfully.`,
      data: group,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to create the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// UPDATE GROUP
// ============================================================

export async function updateCommunicationGroup(
  groupId: string,
  input: UpdateCommunicationGroupInput,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  try {
    const supabase = createClient();

    const currentResult = await getCommunicationGroupById(groupId);

    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        message: currentResult.message,
        error: currentResult.error,
      };
    }

    const currentGroup = currentResult.data;

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    let slug = input.slug;

    if (input.name || input.slug) {
      slug = await createUniqueGroupSlug(
        input.name ?? currentGroup.name,
        input.slug ?? currentGroup.slug,
        groupId,
      );
    }

    const updatePayload: Record<string, unknown> = {
      ...input,
      updated_by: input.updated_by ?? currentUser.userId,
    };

    if (input.name !== undefined) {
      const normalizedName = input.name.trim();

      if (!normalizedName) {
        return {
          success: false,
          message: "Group name is required.",
          error: "Enter a valid communication group name.",
        };
      }

      updatePayload.name = normalizedName;
    }

    if (slug !== undefined) {
      updatePayload.slug = slug;
    }

    if (input.description !== undefined) {
      updatePayload.description =
        input.description?.trim() || null;
    }

    const { data, error } = await supabase
      .from("communication_groups")
      .update(updatePayload)
      .eq("id", groupId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const updatedGroup = data as CommunicationGroup;

    await writeGroupHistory({
      groupId,
      actionType: "updated",
      actionSummary: "Communication group updated.",
      previousValues: currentGroup as unknown as Record<
        string,
        unknown
      >,
      newValues: updatedGroup as unknown as Record<
        string,
        unknown
      >,
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: `${updatedGroup.name} was updated successfully.`,
      data: updatedGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to update the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// STATUS ACTIONS
// ============================================================

export async function activateCommunicationGroup(
  groupId: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  const currentUser = await getCurrentUser();

  const result = await updateCommunicationGroup(groupId, {
    status: "active",
    updated_by: currentUser.userId,
  });

  if (result.success && result.data) {
    await writeGroupHistory({
      groupId,
      actionType: "activated",
      actionSummary: "Communication group activated.",
      newValues: {
        status: "active",
      },
      performedBy: currentUser.userId,
    });
  }

  return result;
}

export async function deactivateCommunicationGroup(
  groupId: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  const currentUser = await getCurrentUser();

  const result = await updateCommunicationGroup(groupId, {
    status: "inactive",
    updated_by: currentUser.userId,
  });

  if (result.success && result.data) {
    await writeGroupHistory({
      groupId,
      actionType: "deactivated",
      actionSummary: "Communication group deactivated.",
      newValues: {
        status: "inactive",
      },
      performedBy: currentUser.userId,
    });
  }

  return result;
}

export async function archiveCommunicationGroup(
  groupId: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  try {
    const current = await getCommunicationGroupById(groupId);

    if (!current.success || !current.data) {
      return {
        success: false,
        message: current.message,
        error: current.error,
      };
    }

    if (current.data.is_protected) {
      return {
        success: false,
        message: "Protected groups cannot be archived.",
        error:
          "This is a protected system group required by the platform.",
      };
    }

    const currentUser = await getCurrentUser();

    const result = await updateCommunicationGroup(groupId, {
      status: "archived",
      updated_by: currentUser.userId,
    });

    if (result.success && result.data) {
      await writeGroupHistory({
        groupId,
        actionType: "archived",
        actionSummary: "Communication group archived.",
        previousValues: {
          status: current.data.status,
        },
        newValues: {
          status: "archived",
        },
        performedBy: currentUser.userId,
      });
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message: "Unable to archive the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function restoreCommunicationGroup(
  groupId: string,
): Promise<CommunicationGroupActionResult<CommunicationGroup>> {
  const currentUser = await getCurrentUser();

  const result = await updateCommunicationGroup(groupId, {
    status: "active",
    updated_by: currentUser.userId,
  });

  if (result.success && result.data) {
    await writeGroupHistory({
      groupId,
      actionType: "restored",
      actionSummary: "Communication group restored.",
      newValues: {
        status: "active",
      },
      performedBy: currentUser.userId,
    });
  }

  return result;
}

// ============================================================
// DELETE GROUP
// ============================================================

export async function deleteCommunicationGroup(
  groupId: string,
): Promise<CommunicationGroupActionResult> {
  try {
    const supabase = createClient();

    const current = await getCommunicationGroupById(groupId);

    if (!current.success || !current.data) {
      return {
        success: false,
        message: current.message,
        error: current.error,
      };
    }

    if (
      current.data.is_protected ||
      current.data.is_system_group
    ) {
      return {
        success: false,
        message: "This group cannot be deleted.",
        error:
          "Protected and system groups are required by EPEW operations.",
      };
    }

    const currentUser = await getCurrentUser();

    await writeGroupHistory({
      groupId,
      actionType: "deleted",
      actionSummary: `${current.data.name} was deleted.`,
      previousValues: current.data as unknown as Record<
        string,
        unknown
      >,
      performedBy: currentUser.userId,
    });

    const { error } = await supabase
      .from("communication_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: `${current.data.name} was deleted successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to delete the communication group.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// GROUP MEMBERS
// ============================================================

export async function getCommunicationGroupMembers(
  groupId: string,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupMember[]>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("added_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Group members loaded.",
      data: (data ?? []) as CommunicationGroupMember[],
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load group members.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function addCommunicationGroupMember(
  input: AddCommunicationGroupMemberInput,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupMember>
> {
  try {
    const supabase = createClient();

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const payload = {
      group_id: input.group_id,
      contact_id: input.contact_id,

      membership_source:
        input.membership_source ?? "manual",

      membership_status:
        input.membership_status ?? "active",

      added_by: input.added_by ?? currentUser.userId,
      added_at: new Date().toISOString(),

      removed_by: null,
      removed_at: null,

      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("communication_group_members")
      .upsert(payload, {
        onConflict: "group_id,contact_id",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const membership = data as CommunicationGroupMember;

    await writeGroupHistory({
      groupId: input.group_id,
      actionType: "member_added",
      actionSummary:
        "A contact was added to the communication group.",
      newValues: {
        contact_id: input.contact_id,
        membership_source: payload.membership_source,
        membership_status: payload.membership_status,
      },
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: "Contact added to the group.",
      data: membership,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to add the contact to the group.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function addCommunicationGroupMembers(
  groupId: string,
  contactIds: string[],
  source: AddCommunicationGroupMemberInput["membership_source"] = "manual",
): Promise<
  CommunicationGroupActionResult<{
    added: number;
    skipped: number;
  }>
> {
  try {
    const supabase = createClient();

    const uniqueContactIds = Array.from(
      new Set(contactIds.filter(Boolean)),
    );

    if (uniqueContactIds.length === 0) {
      return {
        success: false,
        message: "No contacts were selected.",
        error: "Select at least one contact.",
      };
    }

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const rows = uniqueContactIds.map((contactId) => ({
      group_id: groupId,
      contact_id: contactId,
      membership_source: source,
      membership_status: "active",
      added_by: currentUser.userId,
      added_at: new Date().toISOString(),
      removed_by: null,
      removed_at: null,
    }));

    const { data, error } = await supabase
      .from("communication_group_members")
      .upsert(rows, {
        onConflict: "group_id,contact_id",
      })
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    const addedRows = (data ?? []) as GroupMembershipRow[];

    await writeGroupHistory({
      groupId,
      actionType:
        source === "import"
          ? "members_imported"
          : "member_added",
      actionSummary: `${addedRows.length} contacts were added to the communication group.`,
      newValues: {
        contact_ids: uniqueContactIds,
        membership_source: source,
      },
      metadata: {
        requested_count: uniqueContactIds.length,
        completed_count: addedRows.length,
      },
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: `${addedRows.length} contacts were added successfully.`,
      data: {
        added: addedRows.length,
        skipped: Math.max(
          0,
          uniqueContactIds.length - addedRows.length,
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to add contacts to the group.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function removeCommunicationGroupMember(
  groupId: string,
  contactId: string,
): Promise<CommunicationGroupActionResult> {
  try {
    const supabase = createClient();

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("communication_group_members")
      .update({
        membership_status: "removed",
        removed_by: currentUser.userId,
        removed_at: now,
      })
      .eq("group_id", groupId)
      .eq("contact_id", contactId);

    if (error) {
      throw new Error(error.message);
    }

    await writeGroupHistory({
      groupId,
      actionType: "member_removed",
      actionSummary:
        "A contact was removed from the communication group.",
      previousValues: {
        contact_id: contactId,
        membership_status: "active",
      },
      newValues: {
        contact_id: contactId,
        membership_status: "removed",
        removed_at: now,
      },
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: "Contact removed from the group.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to remove the contact from the group.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// GROUP RULES
// ============================================================

export async function getCommunicationGroupRules(
  groupId: string,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupRule[]>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_group_rules")
      .select("*")
      .eq("group_id", groupId)
      .order("priority", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Communication group rules loaded.",
      data: (data ?? []) as CommunicationGroupRule[],
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load communication group rules.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function createCommunicationGroupRule(
  input: CreateCommunicationGroupRuleInput,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupRule>
> {
  try {
    const supabase = createClient();

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const payload = {
      group_id: input.group_id,

      rule_name: input.rule_name.trim(),
      description: input.description?.trim() || null,

      rule_type: input.rule_type,
      match_mode: input.match_mode,

      rule_json: input.rule_json,

      priority: input.priority ?? 100,
      is_active: input.is_active ?? true,

      created_by: input.created_by ?? currentUser.userId,
      updated_by: input.created_by ?? currentUser.userId,
    };

    if (!payload.rule_name) {
      return {
        success: false,
        message: "Rule name is required.",
        error: "Enter a valid smart-group rule name.",
      };
    }

    if (
      !payload.rule_json.conditions ||
      payload.rule_json.conditions.length === 0
    ) {
      return {
        success: false,
        message: "At least one rule condition is required.",
        error:
          "Add one or more conditions before saving the rule.",
      };
    }

    const { data, error } = await supabase
      .from("communication_group_rules")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const rule = data as CommunicationGroupRule;

    await writeGroupHistory({
      groupId: input.group_id,
      actionType: "rule_created",
      actionSummary: `${rule.rule_name} was created.`,
      newValues: rule as unknown as Record<string, unknown>,
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: `${rule.rule_name} was created successfully.`,
      data: rule,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to create the smart-group rule.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function updateCommunicationGroupRule(
  ruleId: string,
  input: UpdateCommunicationGroupRuleInput,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupRule>
> {
  try {
    const supabase = createClient();

    const { data: existingData, error: existingError } =
      await supabase
        .from("communication_group_rules")
        .select("*")
        .eq("id", ruleId)
        .single();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingRule =
      existingData as CommunicationGroupRule;

    const currentUser = await getCurrentUser();

    if (currentUser.error) {
      throw new Error(currentUser.error);
    }

    const updatePayload: Record<string, unknown> = {
      ...input,
      updated_by: input.updated_by ?? currentUser.userId,
    };

    if (input.rule_name !== undefined) {
      const ruleName = input.rule_name.trim();

      if (!ruleName) {
        return {
          success: false,
          message: "Rule name is required.",
          error: "Enter a valid smart-group rule name.",
        };
      }

      updatePayload.rule_name = ruleName;
    }

    if (input.description !== undefined) {
      updatePayload.description =
        input.description?.trim() || null;
    }

    if (
      input.rule_json &&
      (!input.rule_json.conditions ||
        input.rule_json.conditions.length === 0)
    ) {
      return {
        success: false,
        message: "At least one rule condition is required.",
        error:
          "Add one or more conditions before saving the rule.",
      };
    }

    const { data, error } = await supabase
      .from("communication_group_rules")
      .update(updatePayload)
      .eq("id", ruleId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const updatedRule = data as CommunicationGroupRule;

    await writeGroupHistory({
      groupId: existingRule.group_id,
      actionType: "rule_updated",
      actionSummary: `${updatedRule.rule_name} was updated.`,
      previousValues: existingRule as unknown as Record<
        string,
        unknown
      >,
      newValues: updatedRule as unknown as Record<
        string,
        unknown
      >,
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: `${updatedRule.rule_name} was updated successfully.`,
      data: updatedRule,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to update the smart-group rule.",
      error: cleanDatabaseError(error),
    };
  }
}

export async function deleteCommunicationGroupRule(
  ruleId: string,
): Promise<CommunicationGroupActionResult> {
  try {
    const supabase = createClient();

    const { data: existingData, error: existingError } =
      await supabase
        .from("communication_group_rules")
        .select("*")
        .eq("id", ruleId)
        .single();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingRule =
      existingData as CommunicationGroupRule;

    const currentUser = await getCurrentUser();

    const { error } = await supabase
      .from("communication_group_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      throw new Error(error.message);
    }

    await writeGroupHistory({
      groupId: existingRule.group_id,
      actionType: "rule_deleted",
      actionSummary: `${existingRule.rule_name} was deleted.`,
      previousValues: existingRule as unknown as Record<
        string,
        unknown
      >,
      performedBy: currentUser.userId,
    });

    return {
      success: true,
      message: `${existingRule.rule_name} was deleted successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to delete the smart-group rule.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// CAMPAIGN HISTORY
// ============================================================

export async function getCommunicationGroupCampaigns(
  groupId: string,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupCampaign[]>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_group_campaigns")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Group campaign history loaded.",
      data: (data ?? []) as CommunicationGroupCampaign[],
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load the group campaign history.",
      error: cleanDatabaseError(error),
    };
  }
}

// ============================================================
// OPERATIONAL HISTORY
// ============================================================

export async function getCommunicationGroupHistory(
  groupId: string,
  limit = 50,
): Promise<
  CommunicationGroupActionResult<CommunicationGroupHistory[]>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("communication_group_history")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", {
        ascending: false,
      })
      .limit(Math.min(Math.max(limit, 1), 200));

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Group activity history loaded.",
      data: (data ?? []) as CommunicationGroupHistory[],
    };
  } catch (error) {
    return {
      success: false,
      message: "Unable to load group activity history.",
      error: cleanDatabaseError(error),
    };
  }
}