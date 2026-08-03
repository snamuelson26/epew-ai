"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Church,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CopyCheck,
  FileSearch,
  Filter,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Mail,
  MessageSquareWarning,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { supabase } from "@/lib/supabase";

type EntityType =
  | "church"
  | "business"
  | "nonprofit"
  | "community_organization"
  | "school"
  | "association"
  | "government_office"
  | "professional_network"
  | "media_organization"
  | "other";

type EntityStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_correction"
  | "approved"
  | "rejected"
  | "suspended"
  | "archived";

type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed"
  | "manual_review";

type SubmissionStatus =
  | "draft"
  | "submitted"
  | "validating"
  | "awaiting_review"
  | "needs_correction"
  | "approved"
  | "partially_approved"
  | "rejected"
  | "imported"
  | "withdrawn";

type ValidationStatus =
  | "not_checked"
  | "valid"
  | "invalid"
  | "incomplete"
  | "possible_duplicate"
  | "permission_review"
  | "manual_review";

type CommunicationEntity = {
  id: string;
  entity_code: string;
  entity_type: EntityType;
  legal_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: EntityStatus;
  verification_status: VerificationStatus;
  member_submission_status: SubmissionStatus;
  total_members_submitted: number;
  total_members_approved: number;
  total_members_rejected: number;
  total_members_needing_review: number;
  ai_quality_score: number;
  ai_validation_summary: string | null;
  ai_recommendation: string | null;
  administrator_review_notes: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type EntityRepresentative = {
  id: string;
  entity_id: string;
  display_name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  preferred_language: string;
  preferred_channel: string;
  is_primary: boolean;
  verified_phone: boolean;
  verified_email: boolean;
};

type MemberSubmission = {
  id: string;
  entity_id: string;
  batch_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  preferred_language: string;
  preferred_channel: string;
  city: string | null;
  state: string | null;
  country: string;
  interest_type: string;
  permission_sms: boolean;
  permission_email: boolean;
  permission_whatsapp: boolean;
  permission_confirmed_by_entity: boolean;
  validation_status: ValidationStatus;
  quality_score: number;
  review_status: SubmissionStatus;
  possible_duplicate_contact_id: string | null;
  approved_contact_id: string | null;
  administrator_review_notes: string | null;
  created_at: string;
};

type EntityRecord = CommunicationEntity & {
  representative: EntityRepresentative | null;
  members: MemberSubmission[];
};

type EntityFilter =
  | "all"
  | "submitted"
  | "under_review"
  | "needs_correction"
  | "approved"
  | "rejected"
  | "member_review";

type ReviewAction =
  | "approve"
  | "request_correction"
  | "reject"
  | null;

const PAGE_SIZE = 15;

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  church: "Church",
  business: "Business",
  nonprofit: "Nonprofit",
  community_organization: "Community Organization",
  school: "School",
  association: "Association",
  government_office: "Government Office",
  professional_network: "Professional Network",
  media_organization: "Media Organization",
  other: "Other",
};

const ENTITY_TYPE_ICONS: Record<
  EntityType,
  ComponentType<{ className?: string }>
> = {
  church: Church,
  business: Building2,
  nonprofit: HeartHandshake,
  community_organization: UsersRound,
  school: GraduationCap,
  association: Handshake,
  government_office: Building2,
  professional_network: UsersRound,
  media_organization: Mail,
  other: Building2,
};

export default function OrganizationReviewCenterPage() {
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [entityType, setEntityType] = useState<EntityType | "all">(
    "all",
  );
  const [activeFilter, setActiveFilter] =
    useState<EntityFilter>("all");
  const [page, setPage] = useState(1);

  const [selectedRecord, setSelectedRecord] =
    useState<EntityRecord | null>(null);

  const [reviewAction, setReviewAction] =
    useState<ReviewAction>(null);

  const [reviewNotes, setReviewNotes] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadEntities = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const { data: entitiesData, error: entitiesError } =
        await supabase
          .from("communication_entities")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (entitiesError) {
        console.error("ENTITY REVIEW LOAD ERROR:", entitiesError);
        setErrorMessage(
          "The organization registrations could not be loaded.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const entities =
        (entitiesData ?? []) as CommunicationEntity[];

      if (entities.length === 0) {
        setRecords([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const entityIds = entities.map((entity) => entity.id);

      const [representativesResult, membersResult] =
        await Promise.all([
          supabase
            .from("communication_entity_representatives")
            .select("*")
            .in("entity_id", entityIds)
            .eq("is_primary", true),

          supabase
            .from("communication_entity_member_submissions")
            .select("*")
            .in("entity_id", entityIds)
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (representativesResult.error) {
        console.error(
          "ENTITY REPRESENTATIVE LOAD ERROR:",
          representativesResult.error,
        );
      }

      if (membersResult.error) {
        console.error(
          "ENTITY MEMBER LOAD ERROR:",
          membersResult.error,
        );
      }

      const representatives =
        (representativesResult.data ??
          []) as EntityRepresentative[];

      const members =
        (membersResult.data ?? []) as MemberSubmission[];

      const combined: EntityRecord[] = entities.map((entity) => ({
        ...entity,
        representative:
          representatives.find(
            (representative) =>
              representative.entity_id === entity.id,
          ) ?? null,
        members: members.filter(
          (member) => member.entity_id === entity.id,
        ),
      }));

      setRecords(combined);
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void loadEntities();
  }, [loadEntities]);

  const statistics = useMemo(() => {
    return {
      total: records.length,
      submitted: records.filter(
        (record) => record.status === "submitted",
      ).length,
      underReview: records.filter(
        (record) => record.status === "under_review",
      ).length,
      corrections: records.filter(
        (record) => record.status === "needs_correction",
      ).length,
      approved: records.filter(
        (record) => record.status === "approved",
      ).length,
      membersAwaitingReview: records.reduce(
        (total, record) =>
          total +
          record.members.filter((member) =>
            [
              "submitted",
              "awaiting_review",
              "needs_correction",
            ].includes(member.review_status),
          ).length,
        0,
      ),
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          record.display_name,
          record.legal_name,
          record.entity_code,
          record.email,
          record.phone,
          record.city,
          record.state,
          record.representative?.display_name,
          record.representative?.email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch),
          );

      const matchesType =
        entityType === "all" ||
        record.entity_type === entityType;

      const matchesFilter = (() => {
        switch (activeFilter) {
          case "submitted":
            return record.status === "submitted";

          case "under_review":
            return record.status === "under_review";

          case "needs_correction":
            return record.status === "needs_correction";

          case "approved":
            return record.status === "approved";

          case "rejected":
            return record.status === "rejected";

          case "member_review":
            return record.members.some((member) =>
              [
                "submitted",
                "awaiting_review",
                "needs_correction",
              ].includes(member.review_status),
            );

          case "all":
          default:
            return true;
        }
      })();

      return matchesSearch && matchesType && matchesFilter;
    });
  }, [records, searchTerm, entityType, activeFilter]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE),
  );

  const displayedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, entityType, activeFilter]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function openReview(
    record: EntityRecord,
    action: ReviewAction,
  ) {
    setSelectedRecord(record);
    setReviewAction(action);
    setReviewNotes(record.administrator_review_notes ?? "");
    setErrorMessage("");
  }

  function closeReview() {
    if (processingAction) {
      return;
    }

    setSelectedRecord(null);
    setReviewAction(null);
    setReviewNotes("");
  }

  async function recordActivity({
    entityId,
    activityType,
    title,
    summary,
    performedBy,
  }: {
    entityId: string;
    activityType: string;
    title: string;
    summary: string;
    performedBy: string | null;
  }) {
    const { error } = await supabase
      .from("communication_entity_activity")
      .insert({
        entity_id: entityId,
        activity_type: activityType,
        title,
        summary,
        performed_by: performedBy,
        performed_by_type: "administrator",
      });

    if (error) {
      console.error("ENTITY ACTIVITY ERROR:", error);
    }
  }

  async function updateEntityReview() {
    if (!selectedRecord || !reviewAction) {
      return;
    }

    if (
      reviewAction !== "approve" &&
      !reviewNotes.trim()
    ) {
      setErrorMessage(
        "Enter administrator notes explaining this decision.",
      );
      return;
    }

    setProcessingAction(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const administratorId = userData.user?.id ?? null;
    const now = new Date().toISOString();

    const updatePayload =
      reviewAction === "approve"
        ? {
            status: "approved" as EntityStatus,
            verification_status:
              "verified" as VerificationStatus,
            member_submission_status:
              selectedRecord.members.length > 0
                ? ("awaiting_review" as SubmissionStatus)
                : selectedRecord.member_submission_status,
            administrator_review_notes:
              reviewNotes.trim() || null,
            reviewed_by: administratorId,
            reviewed_at: now,
            approved_by: administratorId,
            approved_at: now,
            updated_by: administratorId,
          }
        : reviewAction === "request_correction"
          ? {
              status:
                "needs_correction" as EntityStatus,
              verification_status:
                "manual_review" as VerificationStatus,
              member_submission_status:
                "needs_correction" as SubmissionStatus,
              administrator_review_notes:
                reviewNotes.trim(),
              reviewed_by: administratorId,
              reviewed_at: now,
              updated_by: administratorId,
            }
          : {
              status: "rejected" as EntityStatus,
              verification_status:
                "failed" as VerificationStatus,
              member_submission_status:
                "rejected" as SubmissionStatus,
              administrator_review_notes:
                reviewNotes.trim(),
              reviewed_by: administratorId,
              reviewed_at: now,
              updated_by: administratorId,
            };

    const { error } = await supabase
      .from("communication_entities")
      .update(updatePayload)
      .eq("id", selectedRecord.id);

    if (error) {
      console.error("ENTITY REVIEW UPDATE ERROR:", error);
      setErrorMessage(
        error.message ||
          "The organization review decision could not be saved.",
      );
      setProcessingAction(false);
      return;
    }

    const activityMap = {
      approve: {
        type: "ENTITY_APPROVED",
        title: "Organization approved",
        summary: `${selectedRecord.display_name} was approved by an EPEW administrator.`,
      },
      request_correction: {
        type: "ENTITY_CORRECTION_REQUESTED",
        title: "Corrections requested",
        summary: `Corrections were requested from ${selectedRecord.display_name}.`,
      },
      reject: {
        type: "ENTITY_REJECTED",
        title: "Organization rejected",
        summary: `${selectedRecord.display_name} was rejected by an EPEW administrator.`,
      },
    } as const;

    const activity = activityMap[reviewAction];

    await recordActivity({
      entityId: selectedRecord.id,
      activityType: activity.type,
      title: activity.title,
      summary: reviewNotes.trim()
        ? `${activity.summary} Notes: ${reviewNotes.trim()}`
        : activity.summary,
      performedBy: administratorId,
    });

    setSuccessMessage(activity.summary);
    closeReview();
    await loadEntities(true);
    setProcessingAction(false);
  }

  async function markUnderReview(record: EntityRecord) {
    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const administratorId = userData.user?.id ?? null;

    const { error } = await supabase
      .from("communication_entities")
      .update({
        status: "under_review",
        verification_status: "manual_review",
        reviewed_by: administratorId,
        reviewed_at: new Date().toISOString(),
        updated_by: administratorId,
      })
      .eq("id", record.id);

    if (error) {
      console.error("MARK UNDER REVIEW ERROR:", error);
      setErrorMessage(
        "The organization could not be marked under review.",
      );
      return;
    }

    await recordActivity({
      entityId: record.id,
      activityType: "ENTITY_REVIEW_STARTED",
      title: "Administrator review started",
      summary: `${record.display_name} entered administrator review.`,
      performedBy: administratorId,
    });

    setSuccessMessage(
      `${record.display_name} is now under review.`,
    );

    await loadEntities(true);
  }

  async function importApprovedMembers(record: EntityRecord) {
    const eligibleMembers = record.members.filter(
      (member) =>
        member.validation_status === "valid" &&
        member.review_status !== "imported" &&
        !member.approved_contact_id,
    );

    if (eligibleMembers.length === 0) {
      setErrorMessage(
        "This organization has no validated members ready to import.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Import ${eligibleMembers.length} validated member${
        eligibleMembers.length === 1 ? "" : "s"
      } into Official Contacts?`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingAction(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const administratorId = userData.user?.id ?? null;

    let importedCount = 0;
    let skippedCount = 0;

    for (const member of eligibleMembers) {
      const normalizedEmail = member.email
        ?.trim()
        .toLowerCase();

      const normalizedPhone = normalizePhone(member.phone);

      let existingContactId: string | null = null;

      if (normalizedEmail) {
        const { data: existingByEmail } = await supabase
          .from("communication_contacts")
          .select("id")
          .eq("normalized_email", normalizedEmail)
          .limit(1)
          .maybeSingle();

        existingContactId = existingByEmail?.id ?? null;
      }

      if (!existingContactId && normalizedPhone) {
        const { data: existingByPhone } = await supabase
          .from("communication_contacts")
          .select("id")
          .eq("normalized_phone", normalizedPhone)
          .limit(1)
          .maybeSingle();

        existingContactId = existingByPhone?.id ?? null;
      }

      if (existingContactId) {
        await supabase
          .from("communication_entity_member_submissions")
          .update({
            possible_duplicate_contact_id:
              existingContactId,
            validation_status: "possible_duplicate",
            review_status: "needs_correction",
            administrator_review_notes:
              "A matching Official Contact already exists. Administrator merge review is required.",
            reviewed_by: administratorId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", member.id);

        skippedCount += 1;
        continue;
      }

      const { data: insertedContact, error: contactError } =
        await supabase
          .from("communication_contacts")
          .insert({
            contact_type: inferContactType(
              member.interest_type,
            ),
            first_name: member.first_name,
            last_name: member.last_name,
            display_name: member.display_name,
            organization: record.display_name,
            email: member.email,
            phone: member.phone,
            whatsapp_number: member.whatsapp_number,
            preferred_language:
              normalizeLanguage(member.preferred_language),
            preferred_channel:
              normalizeChannel(member.preferred_channel),
            city: member.city,
            state: member.state,
            country: member.country,
            verified_email: false,
            verified_phone: false,
            verified_whatsapp: false,
            permission_sms: member.permission_sms,
            permission_email: member.permission_email,
            permission_whatsapp:
              member.permission_whatsapp,
            permission_source:
              "community_entity_submission",
            source: "community_registration",
            source_record_id: member.id,
            status: "active",
            tags: [
              record.display_name,
              ENTITY_TYPE_LABELS[record.entity_type],
              formatLabel(member.interest_type),
            ],
            created_by: administratorId,
            updated_by: administratorId,
          })
          .select("id")
          .single();

      if (contactError || !insertedContact) {
        console.error(
          "MEMBER CONTACT IMPORT ERROR:",
          contactError,
        );
        skippedCount += 1;
        continue;
      }

      await supabase
        .from("communication_entity_member_submissions")
        .update({
          approved_contact_id: insertedContact.id,
          validation_status: "valid",
          review_status: "imported",
          reviewed_by: administratorId,
          reviewed_at: new Date().toISOString(),
          approved_by: administratorId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", member.id);

      importedCount += 1;
    }

    const remainingReview = record.members.length - importedCount;

    await supabase
      .from("communication_entities")
      .update({
        member_submission_status:
          skippedCount > 0
            ? "partially_approved"
            : "imported",
        total_members_approved:
          record.total_members_approved + importedCount,
        total_members_needing_review:
          Math.max(0, remainingReview),
        updated_by: administratorId,
      })
      .eq("id", record.id);

    await recordActivity({
      entityId: record.id,
      activityType: "MEMBERS_IMPORTED_TO_OFFICIAL_CONTACTS",
      title: "Members imported",
      summary: `${importedCount} member${
        importedCount === 1 ? "" : "s"
      } imported into Official Contacts. ${skippedCount} record${
        skippedCount === 1 ? "" : "s"
      } require duplicate or data review.`,
      performedBy: administratorId,
    });

    setSuccessMessage(
      `${importedCount} member${
        importedCount === 1 ? "" : "s"
      } imported into Official Contacts. ${
        skippedCount > 0
          ? `${skippedCount} record${
              skippedCount === 1 ? "" : "s"
            } require review.`
          : ""
      }`,
    );

    await loadEntities(true);
    setProcessingAction(false);
  }

  async function createSOSRequest(record: EntityRecord) {
    const subject = window.prompt(
      "Enter a short SOS subject:",
      `Review assistance required for ${record.display_name}`,
    );

    if (!subject?.trim()) {
      return;
    }

    const reason = window.prompt(
      "Explain why a reliable decision cannot be made:",
      "Additional policy, verification, or administrator guidance is required.",
    );

    if (!reason?.trim()) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } = await supabase.auth.getUser();

    const requestCode = `SOS-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const { error } = await supabase
      .from("communication_sos_requests")
      .insert({
        request_code: requestCode,
        module: "communication_center",
        entity_id: record.id,
        subject: subject.trim(),
        request_summary: `Administrator review support requested for ${record.display_name}.`,
        reason_for_escalation: reason.trim(),
        missing_policy_or_capability:
          "Reliable organization-review determination unavailable.",
        recommended_implementation:
          "Review the organization record, establish the missing policy or verification method, and resolve within 24 to 48 hours.",
        priority: "high",
        status: "pending",
        target_response_hours: 48,
        due_at: new Date(
          Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString(),
        created_by: userData.user?.id ?? null,
      });

    if (error) {
      console.error("SOS CREATE ERROR:", error);
      setErrorMessage(
        error.message ||
          "The SOS request could not be created.",
      );
      return;
    }

    await recordActivity({
      entityId: record.id,
      activityType: "SOS_REQUEST_CREATED",
      title: "SOS review request created",
      summary: `${requestCode}: ${reason.trim()}`,
      performedBy: userData.user?.id ?? null,
    });

    setSuccessMessage(
      `SOS request ${requestCode} was created for 24–48 hour administrator follow-up.`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 xl:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Link
              href="/admin/communication-center"
              className="transition hover:text-slate-950"
            >
              Communication Center
            </Link>

            <ChevronRight className="h-4 w-4" />

            <span className="text-emerald-700">
              Organizations & Churches
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Organization Review Center
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review churches, businesses, nonprofits, schools,
            associations, and community organizations before their
            members enter Official Contacts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadEntities(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
            Refresh
          </button>

          <Link
            href="/admin/communication-center/assistant?command=analyze-entity-submissions"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Bot className="h-4 w-4" />
            Ask Assistant
          </Link>
        </div>
      </div>

      {errorMessage && (
        <MessageBanner
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      )}

      {successMessage && (
        <MessageBanner
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatisticCard
          title="Registered Entities"
          value={statistics.total}
          icon={Building2}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />

        <StatisticCard
          title="New Submissions"
          value={statistics.submitted}
          icon={ClipboardCheck}
          active={activeFilter === "submitted"}
          onClick={() => setActiveFilter("submitted")}
        />

        <StatisticCard
          title="Under Review"
          value={statistics.underReview}
          icon={FileSearch}
          active={activeFilter === "under_review"}
          onClick={() => setActiveFilter("under_review")}
        />

        <StatisticCard
          title="Corrections Required"
          value={statistics.corrections}
          icon={AlertTriangle}
          tone="warning"
          active={activeFilter === "needs_correction"}
          onClick={() =>
            setActiveFilter("needs_correction")
          }
        />

        <StatisticCard
          title="Approved Entities"
          value={statistics.approved}
          icon={ShieldCheck}
          active={activeFilter === "approved"}
          onClick={() => setActiveFilter("approved")}
        />

        <StatisticCard
          title="Members Awaiting Review"
          value={statistics.membersAwaitingReview}
          icon={UsersRound}
          tone="warning"
          active={activeFilter === "member_review"}
          onClick={() => setActiveFilter("member_review")}
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white sm:p-7">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  AI Review Intelligence
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Organization submission analysis
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Review entity verification, member-list quality,
                  communication permissions, possible duplicates, and
                  administrator actions from one workspace.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-slate-300">
              Final approval remains under administrator control.
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search entity, representative, code, email, phone, city, or state..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="relative min-w-[230px]">
              <select
                value={entityType}
                onChange={(event) =>
                  setEntityType(
                    event.target.value as EntityType | "all",
                  )
                }
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="all">All entity types</option>

                {Object.entries(ENTITY_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setEntityType("all");
                setActiveFilter("all");
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <QuickFilter
              label="All"
              count={statistics.total}
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            />

            <QuickFilter
              label="Submitted"
              count={statistics.submitted}
              active={activeFilter === "submitted"}
              onClick={() => setActiveFilter("submitted")}
            />

            <QuickFilter
              label="Under Review"
              count={statistics.underReview}
              active={activeFilter === "under_review"}
              onClick={() =>
                setActiveFilter("under_review")
              }
            />

            <QuickFilter
              label="Corrections"
              count={statistics.corrections}
              active={activeFilter === "needs_correction"}
              onClick={() =>
                setActiveFilter("needs_correction")
              }
            />

            <QuickFilter
              label="Approved"
              count={statistics.approved}
              active={activeFilter === "approved"}
              onClick={() => setActiveFilter("approved")}
            />

            <QuickFilter
              label="Member Review"
              count={statistics.membersAwaitingReview}
              active={activeFilter === "member_review"}
              onClick={() =>
                setActiveFilter("member_review")
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeading>Entity</TableHeading>
                <TableHeading>Representative</TableHeading>
                <TableHeading>Type</TableHeading>
                <TableHeading>Location</TableHeading>
                <TableHeading>Members</TableHeading>
                <TableHeading>Validation</TableHeading>
                <TableHeading>Organization</TableHeading>
                <TableHeading>Member List</TableHeading>
                <TableHeading>Registered</TableHeading>
                <TableHeading align="right">
                  Actions
                </TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20">
                    <div className="text-center">
                      <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />

                      <p className="mt-3 text-sm font-bold text-slate-600">
                        Loading organization registrations...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20">
                    <div className="text-center">
                      <Building2 className="mx-auto h-9 w-9 text-slate-400" />

                      <h3 className="mt-4 text-lg font-black text-slate-950">
                        No matching organizations
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Change or clear the current search and
                        filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedRecords.map((record) => (
                  <EntityRow
                    key={record.id}
                    record={record}
                    processing={processingAction}
                    onReview={() =>
                      setSelectedRecord(record)
                    }
                    onMarkUnderReview={() =>
                      void markUnderReview(record)
                    }
                    onApprove={() =>
                      openReview(record, "approve")
                    }
                    onCorrection={() =>
                      openReview(
                        record,
                        "request_correction",
                      )
                    }
                    onReject={() =>
                      openReview(record, "reject")
                    }
                    onImport={() =>
                      void importApprovedMembers(record)
                    }
                    onSOS={() =>
                      void createSOSRequest(record)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
          <p className="text-sm font-semibold text-slate-500">
            Showing{" "}
            <span className="font-black text-slate-950">
              {displayedRecords.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-slate-950">
              {filteredRecords.length}
            </span>{" "}
            matching entities
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="px-3 text-sm font-black text-slate-700">
              Page {page} of {pageCount}
            </span>

            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() =>
                setPage((current) =>
                  Math.min(pageCount, current + 1),
                )
              }
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {selectedRecord && !reviewAction && (
        <EntityDetailsDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onMarkUnderReview={() =>
            void markUnderReview(selectedRecord)
          }
          onApprove={() =>
            openReview(selectedRecord, "approve")
          }
          onCorrection={() =>
            openReview(
              selectedRecord,
              "request_correction",
            )
          }
          onReject={() =>
            openReview(selectedRecord, "reject")
          }
          onImport={() =>
            void importApprovedMembers(selectedRecord)
          }
          onSOS={() =>
            void createSOSRequest(selectedRecord)
          }
        />
      )}

      {selectedRecord && reviewAction && (
        <ReviewDecisionDialog
          record={selectedRecord}
          action={reviewAction}
          notes={reviewNotes}
          processing={processingAction}
          onNotesChange={setReviewNotes}
          onClose={closeReview}
          onConfirm={() => void updateEntityReview()}
        />
      )}
    </div>
  );
}

function EntityRow({
  record,
  processing,
  onReview,
  onMarkUnderReview,
  onApprove,
  onCorrection,
  onReject,
  onImport,
  onSOS,
}: {
  record: EntityRecord;
  processing: boolean;
  onReview: () => void;
  onMarkUnderReview: () => void;
  onApprove: () => void;
  onCorrection: () => void;
  onReject: () => void;
  onImport: () => void;
  onSOS: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = ENTITY_TYPE_ICONS[record.entity_type];

  const validMembers = record.members.filter(
    (member) => member.validation_status === "valid",
  ).length;

  const reviewMembers = record.members.filter((member) =>
    [
      "possible_duplicate",
      "permission_review",
      "incomplete",
      "manual_review",
    ].includes(member.validation_status),
  ).length;

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <button
              type="button"
              onClick={onReview}
              className="max-w-[230px] truncate text-left text-sm font-black text-slate-950 transition hover:text-emerald-700"
            >
              {record.display_name}
            </button>

            <p className="mt-1 text-xs font-bold text-slate-500">
              {record.entity_code}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[190px] truncate text-sm font-black text-slate-800">
          {record.representative?.display_name ||
            "Not available"}
        </p>

        <p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">
          {record.representative?.role_title ||
            record.representative?.email ||
            "Primary representative"}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
          {ENTITY_TYPE_LABELS[record.entity_type]}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-700">
          {[record.city, record.state]
            .filter(Boolean)
            .join(", ") || "Not provided"}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {record.country}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-lg font-black text-slate-950">
          {record.members.length}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {validMembers} valid · {reviewMembers} review
        </p>
      </td>

      <td className="px-5 py-4">
        <QualityBadge
          score={record.ai_quality_score}
          summary={record.ai_validation_summary}
        />
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={record.status} />
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={record.member_submission_status}
        />
      </td>

      <td className="px-5 py-4 text-sm font-bold text-slate-600">
        {formatDate(record.created_at)}
      </td>

      <td className="relative px-5 py-4 text-right">
        <button
          type="button"
          disabled={processing}
          onClick={() =>
            setMenuOpen((current) => !current)
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          aria-label={`Actions for ${record.display_name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-20"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />

            <div className="absolute right-5 top-14 z-30 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
              <ActionButton
                icon={FileSearch}
                label="Review Details"
                onClick={() => {
                  setMenuOpen(false);
                  onReview();
                }}
              />

              {record.status === "submitted" && (
                <ActionButton
                  icon={Clock3}
                  label="Start Review"
                  onClick={() => {
                    setMenuOpen(false);
                    onMarkUnderReview();
                  }}
                />
              )}

              <ActionButton
                icon={CheckCircle2}
                label="Approve Organization"
                tone="success"
                onClick={() => {
                  setMenuOpen(false);
                  onApprove();
                }}
              />

              <ActionButton
                icon={AlertTriangle}
                label="Request Corrections"
                tone="warning"
                onClick={() => {
                  setMenuOpen(false);
                  onCorrection();
                }}
              />

              <ActionButton
                icon={XCircle}
                label="Reject Organization"
                tone="danger"
                onClick={() => {
                  setMenuOpen(false);
                  onReject();
                }}
              />

              <div className="my-1 border-t border-slate-100" />

              <ActionButton
                icon={UserCheck}
                label="Import Valid Members"
                onClick={() => {
                  setMenuOpen(false);
                  onImport();
                }}
              />

              <ActionButton
                icon={MessageSquareWarning}
                label="Create SOS Request"
                tone="warning"
                onClick={() => {
                  setMenuOpen(false);
                  onSOS();
                }}
              />
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function EntityDetailsDrawer({
  record,
  onClose,
  onMarkUnderReview,
  onApprove,
  onCorrection,
  onReject,
  onImport,
  onSOS,
}: {
  record: EntityRecord;
  onClose: () => void;
  onMarkUnderReview: () => void;
  onApprove: () => void;
  onCorrection: () => void;
  onReject: () => void;
  onImport: () => void;
  onSOS: () => void;
}) {
  const validMembers = record.members.filter(
    (member) => member.validation_status === "valid",
  ).length;

  const duplicateMembers = record.members.filter(
    (member) =>
      member.validation_status === "possible_duplicate",
  ).length;

  const permissionReview = record.members.filter(
    (member) =>
      member.validation_status === "permission_review",
  ).length;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close organization details"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto bg-slate-100 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 p-5 text-white sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Organization Review
            </p>

            <h2 className="mt-1 text-xl font-black">
              {record.display_name}
            </h2>

            <p className="mt-1 text-xs font-bold text-slate-400">
              {record.entity_code}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailMetric
              label="Members Submitted"
              value={record.members.length}
            />

            <DetailMetric
              label="Valid Members"
              value={validMembers}
              tone="success"
            />

            <DetailMetric
              label="Possible Duplicates"
              value={duplicateMembers}
              tone="warning"
            />

            <DetailMetric
              label="Permission Review"
              value={permissionReview}
              tone="warning"
            />
          </div>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">
              Organization Information
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InformationItem
                label="Legal Name"
                value={record.legal_name}
              />

              <InformationItem
                label="Entity Type"
                value={ENTITY_TYPE_LABELS[record.entity_type]}
              />

              <InformationItem
                label="Email"
                value={record.email || "Not provided"}
              />

              <InformationItem
                label="Phone"
                value={record.phone || "Not provided"}
              />

              <InformationItem
                label="Location"
                value={
                  [
                    record.city,
                    record.state,
                    record.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not provided"
                }
              />

              <InformationItem
                label="Registered"
                value={formatDate(record.created_at)}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">
              Primary Representative
            </h3>

            {record.representative ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InformationItem
                  label="Name"
                  value={record.representative.display_name}
                />

                <InformationItem
                  label="Title"
                  value={
                    record.representative.role_title ||
                    "Not provided"
                  }
                />

                <InformationItem
                  label="Email"
                  value={
                    record.representative.email ||
                    "Not provided"
                  }
                />

                <InformationItem
                  label="Phone"
                  value={
                    record.representative.phone ||
                    "Not provided"
                  }
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No primary representative was found.
              </p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  AI Recommendation
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {record.ai_recommendation ||
                    generateRecommendation(record)}
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-black text-slate-950">
                Submitted Members
              </h3>
            </div>

            {record.members.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No members were submitted.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {record.members.map((member) => (
                  <div key={member.id} className="p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {member.display_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {member.phone || "No phone"} ·{" "}
                          {member.email || "No email"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          status={member.validation_status}
                        />

                        <StatusBadge
                          status={member.review_status}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                      <span>
                        Score: {member.quality_score}/100
                      </span>

                      <span>•</span>

                      <span>
                        Permissions:{" "}
                        {[
                          member.permission_sms
                            ? "SMS"
                            : null,
                          member.permission_email
                            ? "Email"
                            : null,
                          member.permission_whatsapp
                            ? "WhatsApp"
                            : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Review required"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">
              Administrator Actions
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {record.status === "submitted" && (
                <DrawerAction
                  icon={Clock3}
                  label="Start Review"
                  onClick={onMarkUnderReview}
                />
              )}

              <DrawerAction
                icon={CheckCircle2}
                label="Approve Organization"
                tone="success"
                onClick={onApprove}
              />

              <DrawerAction
                icon={AlertTriangle}
                label="Request Corrections"
                tone="warning"
                onClick={onCorrection}
              />

              <DrawerAction
                icon={XCircle}
                label="Reject Organization"
                tone="danger"
                onClick={onReject}
              />

              <DrawerAction
                icon={UserCheck}
                label="Import Valid Members"
                onClick={onImport}
              />

              <DrawerAction
                icon={MessageSquareWarning}
                label="Create SOS Request"
                tone="warning"
                onClick={onSOS}
              />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function ReviewDecisionDialog({
  record,
  action,
  notes,
  processing,
  onNotesChange,
  onClose,
  onConfirm,
}: {
  record: EntityRecord;
  action: Exclude<ReviewAction, null>;
  notes: string;
  processing: boolean;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const config = {
    approve: {
      title: "Approve Organization",
      description:
        "Confirm that the organization is eligible to participate in the EPEW community network.",
      button: "Approve Organization",
      icon: CheckCircle2,
      tone: "success",
    },
    request_correction: {
      title: "Request Corrections",
      description:
        "Explain what the organization must correct before approval.",
      button: "Send Correction Request",
      icon: AlertTriangle,
      tone: "warning",
    },
    reject: {
      title: "Reject Organization",
      description:
        "Explain why the organization registration cannot be approved.",
      button: "Reject Organization",
      icon: XCircle,
      tone: "danger",
    },
  }[action];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close review dialog"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-slate-950 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Administrator Decision
              </p>

              <h2 className="mt-1 text-xl font-black">
                {config.title}
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                {record.display_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm leading-6 text-slate-600">
            {config.description}
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-black text-slate-800">
              Administrator Notes
              {action !== "approve" && (
                <span className="ml-1 text-red-600">*</span>
              )}
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                onNotesChange(event.target.value)
              }
              rows={6}
              placeholder={
                action === "approve"
                  ? "Optional approval notes..."
                  : "Provide the specific reason and required next action..."
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={[
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60",
              config.tone === "success"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : config.tone === "warning"
                  ? "bg-amber-700 hover:bg-amber-600"
                  : "bg-red-700 hover:bg-red-600",
            ].join(" ")}
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}

            {processing
              ? "Processing..."
              : config.button}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatisticCard({
  title,
  value,
  icon: Icon,
  tone = "standard",
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone?: "standard" | "warning";
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[1.4rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        active
          ? "border-emerald-400 ring-4 ring-emerald-100"
          : "border-slate-200",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11 items-center justify-center rounded-xl",
          tone === "warning"
            ? "bg-amber-100 text-amber-800"
            : "bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-black text-slate-700">
        {title}
      </p>
    </button>
  );
}

function QuickFilter({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}

      <span
        className={[
          "rounded-full px-1.5 py-0.5 text-[10px]",
          active
            ? "bg-emerald-200 text-emerald-900"
            : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function QualityBadge({
  score,
  summary,
}: {
  score: number;
  summary: string | null;
}) {
  const style =
    score >= 90
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : score >= 70
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : score >= 50
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <div>
      <span
        className={[
          "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
          style,
        ].join(" ")}
      >
        {score}/100
      </span>

      <p
        className="mt-1 max-w-[155px] truncate text-[10px] font-semibold text-slate-500"
        title={summary ?? undefined}
      >
        {summary || "Analysis pending"}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const style =
    normalized.includes("approved") ||
    normalized.includes("verified") ||
    normalized.includes("valid") ||
    normalized.includes("imported")
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized.includes("reject") ||
          normalized.includes("failed") ||
          normalized.includes("suspended") ||
          normalized.includes("invalid")
        ? "border-red-200 bg-red-50 text-red-800"
        : normalized.includes("review") ||
            normalized.includes("correction") ||
            normalized.includes("duplicate") ||
            normalized.includes("permission") ||
            normalized.includes("incomplete")
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        style,
      ].join(" ")}
    >
      {formatLabel(status)}
    </span>
  );
}

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function ActionButton({
  icon: Icon,
  label,
  tone = "standard",
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: "standard" | "success" | "warning" | "danger";
  onClick: () => void;
}) {
  const style =
    tone === "success"
      ? "text-emerald-700 hover:bg-emerald-50"
      : tone === "warning"
        ? "text-amber-700 hover:bg-amber-50"
        : tone === "danger"
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold transition",
        style,
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function DrawerAction({
  icon: Icon,
  label,
  tone = "standard",
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: "standard" | "success" | "warning" | "danger";
  onClick: () => void;
}) {
  const style =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition hover:brightness-95",
        style,
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function DetailMetric({
  label,
  value,
  tone = "standard",
}: {
  label: string;
  value: number;
  tone?: "standard" | "success" | "warning";
}) {
  const style =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <p className="text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-black text-slate-600">
        {label}
      </p>
    </div>
  );
}

function InformationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MessageBanner({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "mb-5 flex items-start justify-between gap-4 rounded-2xl border p-4",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        )}

        <p className="text-sm font-bold">{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close message"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function generateRecommendation(record: EntityRecord) {
  const validMembers = record.members.filter(
    (member) => member.validation_status === "valid",
  ).length;

  const reviewMembers = record.members.filter((member) =>
    [
      "possible_duplicate",
      "permission_review",
      "incomplete",
      "manual_review",
    ].includes(member.validation_status),
  ).length;

  if (!record.representative) {
    return "Request correction because no primary representative is associated with this organization.";
  }

  if (record.members.length === 0) {
    return "Review the organization registration independently. No interested-member list has been submitted.";
  }

  if (reviewMembers > 0) {
    return `Approve the organization only if its identity is verified. Import ${validMembers} validated member${
      validMembers === 1 ? "" : "s"
    } and review ${reviewMembers} incomplete, duplicate, or permission-sensitive record${
      reviewMembers === 1 ? "" : "s"
    } separately.`;
  }

  return `The organization record and all ${validMembers} submitted member${
    validMembers === 1 ? "" : "s"
  } are ready for administrator review.`;
}

function inferContactType(
  interestType: string,
):
  | "entrepreneur"
  | "supporter"
  | "coach"
  | "partner"
  | "community_leader"
  | "other" {
  switch (interestType) {
    case "start_business":
    case "receive_business_funding":
      return "entrepreneur";

    case "support_entrepreneurs":
      return "supporter";

    case "become_coach":
      return "coach";

    case "become_partner":
      return "partner";

    case "attend_information_session":
    case "attend_annual_meeting":
      return "community_leader";

    default:
      return "other";
  }
}

function normalizeLanguage(
  language: string,
): "en" | "ht" | "fr" | "es" | "tl" {
  if (
    language === "ht" ||
    language === "fr" ||
    language === "es" ||
    language === "tl"
  ) {
    return language;
  }

  return "en";
}

function normalizeChannel(
  channel: string,
): "sms" | "whatsapp" | "email" | "voice" | "none" {
  if (
    channel === "sms" ||
    channel === "whatsapp" ||
    channel === "email" ||
    channel === "voice"
  ) {
    return channel;
  }

  return "none";
}

function normalizePhone(phone: string | null) {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length >= 8) {
    return `+${digits}`;
  }

  return digits || null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}