"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  FileSpreadsheet,
  Globe2,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { supabase } from "@/lib/supabase";

type PreferredLanguage = "en" | "ht" | "fr" | "es" | "tl";

type PreferredChannel =
  | "sms"
  | "whatsapp"
  | "email"
  | "voice"
  | "none";

type InterestType =
  | "start_business"
  | "receive_business_funding"
  | "support_entrepreneurs"
  | "become_coach"
  | "become_partner"
  | "attend_information_session"
  | "attend_annual_meeting"
  | "receive_updates"
  | "not_yet_sure"
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
  entity_type: string;
  legal_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  street_address: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  organization_description: string | null;
  interest_reason: string | null;
  estimated_interested_members: number;
  requests_information_session: boolean;
  requests_campaign_materials: boolean;
  requests_partner_status: boolean;
  preferred_meeting_format: string | null;
  preferred_language: PreferredLanguage;
  preferred_channel: PreferredChannel;
  status: EntityStatus;
  verification_status: string;
  secure_management_token: string;
  member_submission_status: SubmissionStatus;
  total_members_submitted: number;
  total_members_approved: number;
  total_members_rejected: number;
  total_members_needing_review: number;
  ai_quality_score: number;
  ai_validation_summary: string | null;
  ai_recommendation: string | null;
  administrator_review_notes: string | null;
  created_at: string;
  updated_at: string;
};

type EntityRepresentative = {
  id: string;
  entity_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  preferred_language: PreferredLanguage;
  preferred_channel: PreferredChannel;
  is_primary: boolean;
  can_manage_members: boolean;
  is_community_ambassador: boolean;
  verified_phone: boolean;
  verified_email: boolean;
  permission_sms: boolean;
  permission_email: boolean;
  permission_whatsapp: boolean;
  status: string;
};

type MemberSubmission = {
  id: string;
  entity_id: string;
  batch_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  preferred_language: PreferredLanguage;
  preferred_channel: PreferredChannel;
  city: string | null;
  state: string | null;
  country: string;
  interest_type: InterestType;
  interest_notes: string | null;
  permission_sms: boolean;
  permission_email: boolean;
  permission_whatsapp: boolean;
  permission_confirmed_by_entity: boolean;
  validation_status: ValidationStatus;
  quality_score: number;
  ai_validation_notes: string | null;
  ai_recommendation: string | null;
  review_status: SubmissionStatus;
  administrator_review_notes: string | null;
  created_at: string;
  updated_at: string;
};

type MemberForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  preferredLanguage: PreferredLanguage;
  preferredChannel: PreferredChannel;
  city: string;
  state: string;
  interestType: InterestType;
  permissionSms: boolean;
  permissionEmail: boolean;
  permissionWhatsApp: boolean;
  permissionConfirmed: boolean;
};

const initialMemberForm: MemberForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  whatsappNumber: "",
  preferredLanguage: "en",
  preferredChannel: "sms",
  city: "",
  state: "",
  interestType: "not_yet_sure",
  permissionSms: false,
  permissionEmail: false,
  permissionWhatsApp: false,
  permissionConfirmed: false,
};

const LANGUAGE_LABELS: Record<PreferredLanguage, string> = {
  en: "English",
  ht: "Haitian Creole",
  fr: "French",
  es: "Spanish",
  tl: "Tagalog",
};

const CHANNEL_LABELS: Record<PreferredChannel, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
  voice: "Phone Call",
  none: "Not Selected",
};

const INTEREST_LABELS: Record<InterestType, string> = {
  start_business: "Start a Business",
  receive_business_funding: "Learn About Business Funding",
  support_entrepreneurs: "Support Entrepreneurs",
  become_coach: "Become a Coach",
  become_partner: "Become a Partner",
  attend_information_session: "Attend an Information Session",
  attend_annual_meeting: "Attend an Annual Meeting",
  receive_updates: "Receive EPEW Updates",
  not_yet_sure: "Not Yet Sure",
  other: "Other",
};

export default function OrganizationManagementPage() {
  const params = useParams<{
  token: string | string[];
}>();

const rawToken = Array.isArray(params.token)
  ? params.token[0]
  : params.token;

const token = decodeURIComponent(rawToken ?? "").trim();

console.log("PARAMS =", params);
console.log("TOKEN =", token);
console.log("TOKEN LENGTH =", token.length);

  const [entity, setEntity] =
    useState<CommunicationEntity | null>(null);

  const [representative, setRepresentative] =
    useState<EntityRepresentative | null>(null);

  const [members, setMembers] = useState<MemberSubmission[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [submittingList, setSubmittingList] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] =
    useState<MemberForm>(initialMemberForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadOrganization = useCallback(
    async (showRefreshState = false) => {
      if (!token) {
        return;
      }

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const { data: entityData, error: entityError } =
        await supabase
          .from("communication_entities")
          .select("*")
          .eq("secure_management_token", token)
          .maybeSingle();

      if (entityError) {
        console.error("ENTITY LOAD ERROR:", entityError);
        setErrorMessage(
          "The organization management page could not be loaded.",
        );
        setEntity(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!entityData) {
        setErrorMessage(
          "This private organization link is invalid or no longer available.",
        );
        setEntity(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const typedEntity = entityData as CommunicationEntity;
      setEntity(typedEntity);

      const [representativeResult, membersResult] =
        await Promise.all([
          supabase
            .from("communication_entity_representatives")
            .select("*")
            .eq("entity_id", typedEntity.id)
            .eq("is_primary", true)
            .maybeSingle(),

          supabase
            .from("communication_entity_member_submissions")
            .select("*")
            .eq("entity_id", typedEntity.id)
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (representativeResult.error) {
        console.error(
          "REPRESENTATIVE LOAD ERROR:",
          representativeResult.error,
        );
      } else {
        setRepresentative(
          representativeResult.data as EntityRepresentative | null,
        );
      }

      if (membersResult.error) {
        console.error(
          "MEMBERS LOAD ERROR:",
          membersResult.error,
        );
      } else {
        setMembers(
          (membersResult.data ?? []) as MemberSubmission[],
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    [token],
  );

  useEffect(() => {
    void loadOrganization();
    console.log("Searching token:", token);
  }, [loadOrganization, token]);

  const statistics = useMemo(() => {
    const total = members.length;

    const valid = members.filter(
      (member) => member.validation_status === "valid",
    ).length;

    const review = members.filter((member) =>
      [
        "possible_duplicate",
        "permission_review",
        "incomplete",
        "manual_review",
      ].includes(member.validation_status),
    ).length;

    const approved = members.filter((member) =>
      ["approved", "imported"].includes(member.review_status),
    ).length;

    return {
      total,
      valid,
      review,
      approved,
    };
  }, [members]);

  const canEditMembers =
    entity?.member_submission_status === "draft" ||
    entity?.member_submission_status === "needs_correction";

  function updateMemberForm<K extends keyof MemberForm>(
    key: K,
    value: MemberForm[K],
  ) {
    setMemberForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function addMember() {
    if (!entity) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !memberForm.firstName.trim() ||
      !memberForm.lastName.trim()
    ) {
      setErrorMessage(
        "Enter the member’s first and last name.",
      );
      return;
    }

    if (
      !memberForm.phone.trim() &&
      !memberForm.email.trim() &&
      !memberForm.whatsappNumber.trim()
    ) {
      setErrorMessage(
        "Enter at least one phone number, email address, or WhatsApp number.",
      );
      return;
    }

    if (!memberForm.permissionConfirmed) {
      setErrorMessage(
        "Confirm that the member expressed interest or authorized the organization to share the information.",
      );
      return;
    }

    setSavingMember(true);

    let batchId: string | null = null;

    const { data: existingBatch, error: existingBatchError } =
      await supabase
        .from("communication_entity_submission_batches")
        .select("id")
        .eq("entity_id", entity.id)
        .in("status", ["draft", "needs_correction"])
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (existingBatchError) {
      console.error(existingBatchError);
    }

    if (existingBatch?.id) {
      batchId = existingBatch.id;
    } else {
      const batchCode = `EPEW-BATCH-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

      const { data: newBatch, error: batchError } =
        await supabase
          .from("communication_entity_submission_batches")
          .insert({
            entity_id: entity.id,
            batch_code: batchCode,
            batch_name: "Organization Member List",
            source_type: "manual",
            status: "draft",
            submitted_by_representative_id:
              representative?.id ?? null,
          })
          .select("id")
          .single();

      if (batchError || !newBatch) {
        console.error(batchError);
        setErrorMessage(
          batchError?.message ||
            "The member-list batch could not be created.",
        );
        setSavingMember(false);
        return;
      }

      batchId = newBatch.id;
    }

    const displayName =
      `${memberForm.firstName.trim()} ${memberForm.lastName.trim()}`.trim();

    const { error } = await supabase
      .from("communication_entity_member_submissions")
      .insert({
        entity_id: entity.id,
        batch_id: batchId,
        first_name: memberForm.firstName.trim(),
        last_name: memberForm.lastName.trim(),
        display_name: displayName,
        phone: memberForm.phone.trim() || null,
        email: memberForm.email.trim() || null,
        whatsapp_number:
          memberForm.whatsappNumber.trim() || null,
        preferred_language:
          memberForm.preferredLanguage,
        preferred_channel:
          memberForm.preferredChannel,
        city: memberForm.city.trim() || null,
        state: memberForm.state.trim() || null,
        country: entity.country,
        interest_type: memberForm.interestType,
        permission_sms: memberForm.permissionSms,
        permission_email: memberForm.permissionEmail,
        permission_whatsapp:
          memberForm.permissionWhatsApp,
        permission_confirmed_by_entity: true,
        permission_confirmation_text:
          "The organization representative confirmed that this individual expressed interest in receiving EPEW information or authorized the organization to share the contact information for this purpose.",
        permission_confirmed_at: new Date().toISOString(),
        consent_source: "organization_management_portal",
        review_status: "draft",
        created_by_representative_id:
          representative?.id ?? null,
      });

    if (error) {
      console.error("ADD MEMBER ERROR:", error);
      setErrorMessage(
        error.message || "The member could not be added.",
      );
      setSavingMember(false);
      return;
    }

    await supabase
      .from("communication_entity_activity")
      .insert({
        entity_id: entity.id,
        representative_id: representative?.id ?? null,
        activity_type: "MEMBER_ADDED",
        title: "Interested member added",
        summary: `${displayName} was added to the organization’s interest list.`,
        performed_by_type: "representative",
      });

    setMemberForm(initialMemberForm);
    setShowAddMember(false);
    setSuccessMessage(
      `${displayName} was added to the member list.`,
    );

    await loadOrganization(true);

    setSavingMember(false);
  }

  async function removeMember(member: MemberSubmission) {
    if (!entity || !canEditMembers) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.display_name} from this draft member list?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("communication_entity_member_submissions")
      .delete()
      .eq("id", member.id)
      .eq("entity_id", entity.id)
      .eq("review_status", "draft");

    if (error) {
      console.error("REMOVE MEMBER ERROR:", error);
      setErrorMessage(
        error.message ||
          "The draft member could not be removed.",
      );
      return;
    }

    setSuccessMessage(
      `${member.display_name} was removed from the draft list.`,
    );

    await loadOrganization(true);
  }

  async function submitMemberList() {
    if (!entity) {
      return;
    }

    const draftMembers = members.filter(
      (member) => member.review_status === "draft",
    );

    if (draftMembers.length === 0) {
      setErrorMessage(
        "There are no draft members ready for submission.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Submit ${draftMembers.length} draft member${
        draftMembers.length === 1 ? "" : "s"
      } for EPEW administrator review? Members cannot be edited while under review.`,
    );

    if (!confirmed) {
      return;
    }

    setSubmittingList(true);
    setErrorMessage("");
    setSuccessMessage("");

    const draftIds = draftMembers.map((member) => member.id);

    const { error: membersError } = await supabase
      .from("communication_entity_member_submissions")
      .update({
        review_status: "submitted",
      })
      .in("id", draftIds)
      .eq("entity_id", entity.id);

    if (membersError) {
      console.error("SUBMIT MEMBERS ERROR:", membersError);
      setErrorMessage(
        membersError.message ||
          "The member list could not be submitted.",
      );
      setSubmittingList(false);
      return;
    }

    const batchIds = Array.from(
      new Set(
        draftMembers
          .map((member) => member.batch_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (batchIds.length > 0) {
      const { error: batchesError } = await supabase
        .from("communication_entity_submission_batches")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .in("id", batchIds)
        .eq("entity_id", entity.id);

      if (batchesError) {
        console.error(
          "SUBMIT BATCHES ERROR:",
          batchesError,
        );
      }
    }

    const { error: entityError } = await supabase
      .from("communication_entities")
      .update({
        member_submission_status: "submitted",
      })
      .eq("id", entity.id)
      .eq("secure_management_token", token);

    if (entityError) {
      console.error(
        "UPDATE ENTITY SUBMISSION ERROR:",
        entityError,
      );
    }

    await supabase
      .from("communication_entity_activity")
      .insert({
        entity_id: entity.id,
        representative_id: representative?.id ?? null,
        activity_type: "MEMBER_LIST_SUBMITTED",
        title: "Member list submitted",
        summary: `${draftMembers.length} interested member${
          draftMembers.length === 1 ? " was" : "s were"
        } submitted for administrator review.`,
        performed_by_type: "representative",
      });

    setSuccessMessage(
      "The member list was submitted for EPEW administrator review.",
    );

    await loadOrganization(true);

    setSubmittingList(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-4 text-sm font-black text-slate-600">
            Loading organization portal...
          </p>
        </div>
      </main>
    );
  }

  if (!entity) {
    return (
      <main className="min-h-screen bg-slate-100">
        <PublicHeader />

        <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <div className="rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <CircleAlert className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Organization link unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {errorMessage ||
                "This private organization management link is invalid or unavailable."}
            </p>

            <Link
              href="/community-registration"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Community Registration
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PublicHeader />

      <section className="bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Secure Organization Portal
                </span>

                <EntityStatusBadge status={entity.status} />
              </div>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                {entity.display_name}
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-300">
                {entity.entity_code}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-slate-300">
                {entity.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-300" />
                    {entity.email}
                  </span>
                )}

                {entity.phone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-300" />
                    {entity.phone}
                  </span>
                )}

                {(entity.city || entity.state) && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {[entity.city, entity.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadOrganization(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    refreshing ? "animate-spin" : "",
                  ].join(" ")}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                disabled={!canEditMembers}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            title="Members Submitted"
            value={statistics.total}
            icon={UsersRound}
          />

          <StatisticCard
            title="Valid Records"
            value={statistics.valid}
            icon={CheckCircle2}
          />

          <StatisticCard
            title="Needs Review"
            value={statistics.review}
            icon={AlertTriangle}
            tone="warning"
          />

          <StatisticCard
            title="Approved Contacts"
            value={statistics.approved}
            icon={ShieldCheck}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-6">
            <OrganizationCard entity={entity} />

            <RepresentativeCard representative={representative} />

            <SubmissionStatusCard entity={entity} />

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <h2 className="text-sm font-black text-slate-950">
                    Private management access
                  </h2>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    Anyone with this private link may access this
                    organization page. Do not share it publicly.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Community Interest List
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Interested Members
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Add, review, and submit interested members for
                    EPEW administrator approval.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-400"
                    title="Spreadsheet upload will be added next."
                  >
                    <Upload className="h-4 w-4" />
                    Upload List
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    disabled={!canEditMembers}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </button>
                </div>
              </div>

              {!canEditMembers && (
                <div className="border-b border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                    <p className="text-sm font-bold leading-6 text-amber-900">
                      This member list is currently under review and
                      cannot be edited. EPEW will reopen editing if
                      corrections are required.
                    </p>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <EmptyMemberList
                  canEdit={canEditMembers}
                  onAdd={() => setShowAddMember(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <TableHeading>Member</TableHeading>
                        <TableHeading>Contact</TableHeading>
                        <TableHeading>Interest</TableHeading>
                        <TableHeading>Language</TableHeading>
                        <TableHeading>Permissions</TableHeading>
                        <TableHeading>Validation</TableHeading>
                        <TableHeading>Review</TableHeading>
                        <TableHeading align="right">
                          Action
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {members.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          canEdit={canEditMembers}
                          onRemove={() =>
                            void removeMember(member)
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold text-slate-500">
                  Draft members can be edited until the list is
                  submitted for administrator review.
                </p>

                <button
                  type="button"
                  onClick={() => void submitMemberList()}
                  disabled={
                    submittingList ||
                    !canEditMembers ||
                    !members.some(
                      (member) =>
                        member.review_status === "draft",
                    )
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submittingList ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  {submittingList
                    ? "Submitting List..."
                    : "Submit Draft Members"}
                </button>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                    Coming Next
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    CSV and Excel Member Upload
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The next phase will allow authorized
                    representatives to upload larger member lists,
                    review validation results, correct errors, and
                    submit only clean records.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {showAddMember && (
        <AddMemberDialog
          form={memberForm}
          saving={savingMember}
          onChange={updateMemberForm}
          onClose={() => {
            if (!savingMember) {
              setShowAddMember(false);
              setMemberForm(initialMemberForm);
              setErrorMessage("");
            }
          }}
          onSave={() => void addMember()}
        />
      )}
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400">
            <UsersRound className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              EPEW-EDE-IBOS
            </p>

            <p className="text-sm font-black text-slate-950">
              Community Organization Portal
            </p>
          </div>
        </Link>

        <Link
          href="/community-registration"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Registration
        </Link>
      </div>
    </header>
  );
}

function StatisticCard({
  title,
  value,
  icon: Icon,
  tone = "standard",
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone?: "standard" | "warning";
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
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

      <p className="mt-4 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-black text-slate-600">
        {title}
      </p>
    </div>
  );
}

function OrganizationCard({
  entity,
}: {
  entity: CommunicationEntity;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        Organization
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        {entity.display_name}
      </h2>

      <div className="mt-5 space-y-4">
        <InformationRow
          icon={Building2}
          label="Legal Name"
          value={entity.legal_name}
        />

        <InformationRow
          icon={Globe2}
          label="Entity Type"
          value={formatLabel(entity.entity_type)}
        />

        <InformationRow
          icon={Languages}
          label="Preferred Language"
          value={LANGUAGE_LABELS[entity.preferred_language]}
        />

        <InformationRow
          icon={CalendarDays}
          label="Registered"
          value={formatDate(entity.created_at)}
        />
      </div>
    </div>
  );
}

function RepresentativeCard({
  representative,
}: {
  representative: EntityRepresentative | null;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Primary Representative
      </p>

      {representative ? (
        <>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            {representative.display_name}
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {representative.role_title ||
              "Authorized Representative"}
          </p>

          <div className="mt-5 space-y-4">
            {representative.phone && (
              <InformationRow
                icon={Phone}
                label="Phone"
                value={representative.phone}
              />
            )}

            {representative.email && (
              <InformationRow
                icon={Mail}
                label="Email"
                value={representative.email}
              />
            )}

            <InformationRow
              icon={MessageCircle}
              label="Preferred Channel"
              value={
                CHANNEL_LABELS[
                  representative.preferred_channel
                ]
              }
            />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No primary representative was found.
        </p>
      )}
    </div>
  );
}

function SubmissionStatusCard({
  entity,
}: {
  entity: CommunicationEntity;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Review Status
      </p>

      <div className="mt-4 space-y-4">
        <StatusRow
          label="Organization"
          value={formatLabel(entity.status)}
          status={entity.status}
        />

        <StatusRow
          label="Verification"
          value={formatLabel(entity.verification_status)}
          status={entity.verification_status}
        />

        <StatusRow
          label="Member List"
          value={formatLabel(entity.member_submission_status)}
          status={entity.member_submission_status}
        />
      </div>

      {entity.administrator_review_notes && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
            Administrator Notes
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            {entity.administrator_review_notes}
          </p>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  canEdit,
  onRemove,
}: {
  member: MemberSubmission;
  canEdit: boolean;
  onRemove: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950">
          {member.display_name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {member.city || member.state
            ? [member.city, member.state]
                .filter(Boolean)
                .join(", ")
            : "Location not provided"}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">
          {member.phone || "No phone"}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {member.email || "No email"}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
          {INTEREST_LABELS[member.interest_type]}
        </span>
      </td>

      <td className="px-5 py-4 text-sm font-bold text-slate-700">
        {LANGUAGE_LABELS[member.preferred_language]}
      </td>

      <td className="px-5 py-4">
        <PermissionSummary member={member} />
      </td>

      <td className="px-5 py-4">
        <ValidationBadge
          status={member.validation_status}
        />
      </td>

      <td className="px-5 py-4">
        <ReviewBadge status={member.review_status} />
      </td>

      <td className="px-5 py-4 text-right">
        {canEdit && member.review_status === "draft" ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50"
            aria-label={`Remove ${member.display_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-xs font-bold text-slate-400">
            Locked
          </span>
        )}
      </td>
    </tr>
  );
}

function EmptyMemberList({
  canEdit,
  onAdd,
}: {
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="p-10 text-center">
      <UsersRound className="mx-auto h-9 w-9 text-slate-400" />

      <h3 className="mt-4 text-lg font-black text-slate-950">
        No interested members
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {canEdit
          ? "Add interested members individually or use the spreadsheet upload feature when it becomes available."
          : "No members are currently displayed for this organization."}
      </p>

      {canEdit && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
        >
          <Plus className="h-4 w-4" />
          Add First Member
        </button>
      )}
    </div>
  );
}

function AddMemberDialog({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: MemberForm;
  saving: boolean;
  onChange: <K extends keyof MemberForm>(
    key: K,
    value: MemberForm[K],
  ) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close add member dialog"
      />

      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-5 text-white sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Community Interest List
            </p>

            <h2 className="mt-1 text-xl font-black">
              Add Interested Member
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="First Name" required>
              <input
                value={form.firstName}
                onChange={(event) =>
                  onChange("firstName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Last Name" required>
              <input
                value={form.lastName}
                onChange={(event) =>
                  onChange("lastName", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  onChange("phone", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  onChange("email", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="WhatsApp Number">
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={(event) =>
                  onChange(
                    "whatsappNumber",
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Interest">
              <SelectInput
                value={form.interestType}
                onChange={(value) =>
                  onChange(
                    "interestType",
                    value as InterestType,
                  )
                }
              >
                {Object.entries(INTEREST_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </SelectInput>
            </FormField>

            <FormField label="Preferred Language">
              <SelectInput
                value={form.preferredLanguage}
                onChange={(value) =>
                  onChange(
                    "preferredLanguage",
                    value as PreferredLanguage,
                  )
                }
              >
                {Object.entries(LANGUAGE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </SelectInput>
            </FormField>

            <FormField label="Preferred Channel">
              <SelectInput
                value={form.preferredChannel}
                onChange={(value) =>
                  onChange(
                    "preferredChannel",
                    value as PreferredChannel,
                  )
                }
              >
                {Object.entries(CHANNEL_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </SelectInput>
            </FormField>

            <FormField label="City">
              <input
                value={form.city}
                onChange={(event) =>
                  onChange("city", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="State">
              <input
                value={form.state}
                onChange={(event) =>
                  onChange("state", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>
          </div>

          <div className="mt-6">
            <p className="text-sm font-black text-slate-950">
              Recorded Communication Permissions
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select only channels the member has authorized.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <PermissionOption
                label="SMS"
                icon={Phone}
                checked={form.permissionSms}
                onChange={(checked) =>
                  onChange("permissionSms", checked)
                }
              />

              <PermissionOption
                label="Email"
                icon={Mail}
                checked={form.permissionEmail}
                onChange={(checked) =>
                  onChange("permissionEmail", checked)
                }
              />

              <PermissionOption
                label="WhatsApp"
                icon={MessageCircle}
                checked={form.permissionWhatsApp}
                onChange={(checked) =>
                  onChange("permissionWhatsApp", checked)
                }
              />
            </div>
          </div>

          <label
            className={[
              "mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition",
              form.permissionConfirmed
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={form.permissionConfirmed}
              onChange={(event) =>
                onChange(
                  "permissionConfirmed",
                  event.target.checked,
                )
              }
              className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <div>
              <p className="text-sm font-black text-slate-950">
                Member Interest Confirmation
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-600">
                I confirm that this individual expressed interest in
                receiving EPEW information or authorized the
                organization to share this contact information for
                that purpose.
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving Member..." : "Save Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InformationRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-black text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-slate-600">
        {label}
      </p>

      <GenericStatusBadge
        status={status}
        label={value}
      />
    </div>
  );
}

function PermissionSummary({
  member,
}: {
  member: MemberSubmission;
}) {
  const permissions = [
    member.permission_sms ? "SMS" : null,
    member.permission_email ? "Email" : null,
    member.permission_whatsapp ? "WhatsApp" : null,
  ].filter(Boolean);

  if (permissions.length === 0) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
        Review
      </span>
    );
  }

  return (
    <span className="text-xs font-bold text-slate-700">
      {permissions.join(", ")}
    </span>
  );
}

function ValidationBadge({
  status,
}: {
  status: ValidationStatus;
}) {
  return (
    <GenericStatusBadge
      status={status}
      label={formatLabel(status)}
    />
  );
}

function ReviewBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  return (
    <GenericStatusBadge
      status={status}
      label={formatLabel(status)}
    />
  );
}

function EntityStatusBadge({
  status,
}: {
  status: EntityStatus;
}) {
  const style =
    status === "approved"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : status === "rejected" ||
          status === "suspended"
        ? "border-red-400/25 bg-red-400/10 text-red-300"
        : status === "needs_correction"
          ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
          : "border-slate-400/25 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider",
        style,
      ].join(" ")}
    >
      {formatLabel(status)}
    </span>
  );
}

function GenericStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const normalized = status.toLowerCase();

  const style =
    normalized.includes("approved") ||
    normalized.includes("valid") ||
    normalized.includes("verified") ||
    normalized.includes("imported")
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized.includes("reject") ||
          normalized.includes("invalid") ||
          normalized.includes("failed") ||
          normalized.includes("suspended")
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
        "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        style,
      ].join(" ")}
    >
      {label}
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

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}
        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`${inputClassName} appearance-none pr-10`}
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function PermissionOption({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition",
        checked
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />

      <Icon
        className={[
          "h-4 w-4",
          checked ? "text-emerald-700" : "text-slate-400",
        ].join(" ")}
      />

      <span className="text-sm font-black text-slate-700">
        {label}
      </span>
    </label>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";