"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Church,
  CircleAlert,
  ClipboardCheck,
  FileSpreadsheet,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
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

type MeetingFormat =
  | "virtual"
  | "in_person"
  | "hybrid"
  | "not_selected";

type RegistrationForm = {
  entityType: EntityType;
  legalName: string;
  displayName: string;
  organizationPhone: string;
  organizationEmail: string;
  website: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  organizationDescription: string;

  representativeFirstName: string;
  representativeLastName: string;
  representativeTitle: string;
  representativePhone: string;
  representativeEmail: string;
  representativeLanguage: PreferredLanguage;
  representativeChannel: PreferredChannel;
  representativeSmsPermission: boolean;
  representativeEmailPermission: boolean;
  representativeWhatsAppPermission: boolean;

  interestReason: string;
  estimatedInterestedMembers: string;
  requestsInformationSession: boolean;
  requestsCampaignMaterials: boolean;
  requestsPartnerStatus: boolean;
  preferredMeetingFormat: MeetingFormat;

  consentConfirmed: boolean;
  authorizedRepresentativeConfirmed: boolean;
};

type MemberDraft = {
  localId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  preferredLanguage: PreferredLanguage;
  preferredChannel: PreferredChannel;
  interestType: InterestType;
  city: string;
  state: string;
  permissionSms: boolean;
  permissionEmail: boolean;
  permissionWhatsApp: boolean;
};

type RegistrationResult = {
  entityId: string;
  entityCode: string;
  secureToken: string;
  organizationName: string;
  membersSubmitted: number;
};

const initialForm: RegistrationForm = {
  entityType: "church",
  legalName: "",
  displayName: "",
  organizationPhone: "",
  organizationEmail: "",
  website: "",
  streetAddress: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  organizationDescription: "",

  representativeFirstName: "",
  representativeLastName: "",
  representativeTitle: "",
  representativePhone: "",
  representativeEmail: "",
  representativeLanguage: "en",
  representativeChannel: "email",
  representativeSmsPermission: false,
  representativeEmailPermission: false,
  representativeWhatsAppPermission: false,

  interestReason: "",
  estimatedInterestedMembers: "",
  requestsInformationSession: false,
  requestsCampaignMaterials: false,
  requestsPartnerStatus: false,
  preferredMeetingFormat: "not_selected",

  consentConfirmed: false,
  authorizedRepresentativeConfirmed: false,
};

const ENTITY_TYPE_OPTIONS: Array<{
  value: EntityType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    value: "church",
    label: "Church",
    description: "Church, ministry, or faith-based organization",
    icon: Church,
  },
  {
    value: "business",
    label: "Business",
    description: "Company, corporation, or local business",
    icon: Building2,
  },
  {
    value: "nonprofit",
    label: "Nonprofit",
    description: "Registered nonprofit or charitable organization",
    icon: HeartHandshake,
  },
  {
    value: "community_organization",
    label: "Community Organization",
    description: "Neighborhood or community-based organization",
    icon: UsersRound,
  },
  {
    value: "school",
    label: "School",
    description: "School, college, university, or training institution",
    icon: GraduationCap,
  },
  {
    value: "association",
    label: "Association",
    description: "Membership or professional association",
    icon: Handshake,
  },
  {
    value: "government_office",
    label: "Government Office",
    description: "Public agency or elected official’s office",
    icon: Building2,
  },
  {
    value: "professional_network",
    label: "Professional Network",
    description: "Business or professional network",
    icon: UsersRound,
  },
  {
    value: "media_organization",
    label: "Media Organization",
    description: "Radio, television, newspaper, or digital media",
    icon: Globe2,
  },
  {
    value: "other",
    label: "Other",
    description: "Another type of organization or community group",
    icon: Building2,
  },
];

const LANGUAGE_OPTIONS: Array<{
  value: PreferredLanguage;
  label: string;
}> = [
  { value: "en", label: "English" },
  { value: "ht", label: "Haitian Creole" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "tl", label: "Tagalog" },
];

const CHANNEL_OPTIONS: Array<{
  value: PreferredChannel;
  label: string;
}> = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "voice", label: "Phone Call" },
  { value: "none", label: "Not Selected" },
];

const INTEREST_OPTIONS: Array<{
  value: InterestType;
  label: string;
}> = [
  {
    value: "start_business",
    label: "Start a Business",
  },
  {
    value: "receive_business_funding",
    label: "Learn About Business Funding",
  },
  {
    value: "support_entrepreneurs",
    label: "Support Entrepreneurs",
  },
  {
    value: "become_coach",
    label: "Become a Coach",
  },
  {
    value: "become_partner",
    label: "Become a Partner",
  },
  {
    value: "attend_information_session",
    label: "Attend an Information Session",
  },
  {
    value: "attend_annual_meeting",
    label: "Attend an Annual Meeting",
  },
  {
    value: "receive_updates",
    label: "Receive EPEW Updates",
  },
  {
    value: "not_yet_sure",
    label: "Not Yet Sure",
  },
  {
    value: "other",
    label: "Other",
  },
];

const steps = [
  {
    number: 1,
    title: "Organization",
    description: "Entity information",
    icon: Building2,
  },
  {
    number: 2,
    title: "Representative",
    description: "Primary contact",
    icon: UserRound,
  },
  {
    number: 3,
    title: "Interest",
    description: "Community goals",
    icon: HeartHandshake,
  },
  {
    number: 4,
    title: "Members",
    description: "Interested people",
    icon: UsersRound,
  },
  {
    number: 5,
    title: "Review",
    description: "Confirm and submit",
    icon: ClipboardCheck,
  },
];

function createEmptyMember(): MemberDraft {
  return {
    localId: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    preferredLanguage: "en",
    preferredChannel: "sms",
    interestType: "not_yet_sure",
    city: "",
    state: "",
    permissionSms: false,
    permissionEmail: false,
    permissionWhatsApp: false,
  };
}

export default function CommunityRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registrationResult, setRegistrationResult] =
    useState<RegistrationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const progress = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep],
  );

  const managementUrl = useMemo(() => {
    if (!registrationResult) {
      return "";
    }

    if (typeof window === "undefined") {
      return `/community-registration/manage/${registrationResult.secureToken}`;
    }

    return `${window.location.origin}/community-registration/manage/${registrationResult.secureToken}`;
  }, [registrationResult]);

  function updateForm<K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateMember<K extends keyof MemberDraft>(
    localId: string,
    field: K,
    value: MemberDraft[K],
  ) {
    setMembers((current) =>
      current.map((member) =>
        member.localId === localId
          ? {
              ...member,
              [field]: value,
            }
          : member,
      ),
    );
  }

  function addMember() {
    setMembers((current) => [...current, createEmptyMember()]);
  }

  function removeMember(localId: string) {
    setMembers((current) =>
      current.filter((member) => member.localId !== localId),
    );
  }

  function validateStep(step: number) {
    setErrorMessage("");

    if (step === 1) {
      if (!form.legalName.trim()) {
        setErrorMessage(
          "Enter the organization’s legal or official name.",
        );
        return false;
      }

      if (!form.displayName.trim()) {
        setErrorMessage(
          "Enter the organization’s public or common name.",
        );
        return false;
      }

      if (
        !form.organizationPhone.trim() &&
        !form.organizationEmail.trim()
      ) {
        setErrorMessage(
          "Enter an organization phone number or email address.",
        );
        return false;
      }
    }

    if (step === 2) {
      if (
        !form.representativeFirstName.trim() ||
        !form.representativeLastName.trim()
      ) {
        setErrorMessage(
          "Enter the first and last name of the primary representative.",
        );
        return false;
      }

      if (
        !form.representativePhone.trim() &&
        !form.representativeEmail.trim()
      ) {
        setErrorMessage(
          "Enter a phone number or email address for the primary representative.",
        );
        return false;
      }

      if (!form.representativeTitle.trim()) {
        setErrorMessage(
          "Enter the representative’s title or position.",
        );
        return false;
      }
    }

    if (step === 3 && !form.interestReason.trim()) {
      setErrorMessage(
        "Explain why the organization is interested in EPEW.",
      );
      return false;
    }

    if (step === 4) {
      const invalidMember = members.find(
        (member) =>
          !member.firstName.trim() ||
          !member.lastName.trim() ||
          (!member.phone.trim() &&
            !member.email.trim() &&
            !member.whatsappNumber.trim()),
      );

      if (invalidMember) {
        setErrorMessage(
          "Each listed member must have a first name, last name, and at least one contact method.",
        );
        return false;
      }
    }

    if (step === 5) {
      if (!form.authorizedRepresentativeConfirmed) {
        setErrorMessage(
          "Confirm that you are authorized to submit this registration.",
        );
        return false;
      }

      if (!form.consentConfirmed) {
        setErrorMessage(
          "Confirm the member-interest and contact-information statement.",
        );
        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((current) =>
      Math.min(steps.length, current + 1),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goBack() {
    setErrorMessage("");
    setCurrentStep((current) => Math.max(1, current - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(5)) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const estimatedMembers = Number.parseInt(
        form.estimatedInterestedMembers || "0",
        10,
      );

      const { data: entity, error: entityError } = await supabase
        .from("communication_entities")
        .insert({
          entity_type: form.entityType,
          legal_name: form.legalName.trim(),
          display_name: form.displayName.trim(),
          phone: form.organizationPhone.trim() || null,
          email: form.organizationEmail.trim() || null,
          website: form.website.trim() || null,
          street_address: form.streetAddress.trim() || null,
          address_line_2: form.addressLine2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postal_code: form.postalCode.trim() || null,
          country: form.country.trim() || "United States",
          organization_description:
            form.organizationDescription.trim() || null,
          interest_reason: form.interestReason.trim(),
          estimated_interested_members: Number.isNaN(
            estimatedMembers,
          )
            ? 0
            : estimatedMembers,
          requests_information_session:
            form.requestsInformationSession,
          requests_campaign_materials:
            form.requestsCampaignMaterials,
          requests_partner_status: form.requestsPartnerStatus,
          preferred_meeting_format:
            form.preferredMeetingFormat,
          preferred_language:
            form.representativeLanguage,
          preferred_channel: form.representativeChannel,
          status: "submitted",
          verification_status: "pending",
          member_submission_status:
            members.length > 0 ? "submitted" : "draft",
        })
        .select(
          "id, entity_code, secure_management_token, display_name",
        )
        .single();

      if (entityError || !entity) {
        throw new Error(
          entityError?.message ||
            "The organization registration could not be created.",
        );
      }

      const representativeDisplayName =
        `${form.representativeFirstName.trim()} ${form.representativeLastName.trim()}`.trim();

      const {
        data: representative,
        error: representativeError,
      } = await supabase
        .from("communication_entity_representatives")
        .insert({
          entity_id: entity.id,
          first_name: form.representativeFirstName.trim(),
          last_name: form.representativeLastName.trim(),
          display_name: representativeDisplayName,
          role_title: form.representativeTitle.trim(),
          phone: form.representativePhone.trim() || null,
          email: form.representativeEmail.trim() || null,
          preferred_language:
            form.representativeLanguage,
          preferred_channel: form.representativeChannel,
          is_primary: true,
          can_manage_members: true,
          is_community_ambassador: true,
          permission_sms:
            form.representativeSmsPermission,
          permission_email:
            form.representativeEmailPermission,
          permission_whatsapp:
            form.representativeWhatsAppPermission,
          status: "pending",
        })
        .select("id")
        .single();

      if (representativeError || !representative) {
        throw new Error(
          representativeError?.message ||
            "The primary representative could not be registered.",
        );
      }

      if (members.length > 0) {
        const batchCode = `EPEW-BATCH-${new Date()
          .toISOString()
          .slice(0, 10)
          .replaceAll("-", "")}-${crypto
          .randomUUID()
          .slice(0, 8)
          .toUpperCase()}`;

        const { data: batch, error: batchError } =
          await supabase
            .from("communication_entity_submission_batches")
            .insert({
              entity_id: entity.id,
              batch_code: batchCode,
              batch_name: "Initial Community Interest List",
              source_type: "manual",
              total_records: members.length,
              status: "submitted",
              submitted_by_representative_id:
                representative.id,
              submitted_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (batchError || !batch) {
          throw new Error(
            batchError?.message ||
              "The member submission batch could not be created.",
          );
        }

        const permissionConfirmationText =
          "The entity representative confirmed that submitted individuals expressed interest in receiving EPEW information or authorized the entity to share their information for this purpose.";

        const memberRecords = members.map((member) => ({
          entity_id: entity.id,
          batch_id: batch.id,
          first_name: member.firstName.trim(),
          last_name: member.lastName.trim(),
          display_name:
            `${member.firstName.trim()} ${member.lastName.trim()}`.trim(),
          phone: member.phone.trim() || null,
          email: member.email.trim() || null,
          whatsapp_number:
            member.whatsappNumber.trim() || null,
          preferred_language: member.preferredLanguage,
          preferred_channel: member.preferredChannel,
          city: member.city.trim() || null,
          state: member.state.trim() || null,
          country: form.country.trim() || "United States",
          interest_type: member.interestType,
          permission_sms: member.permissionSms,
          permission_email: member.permissionEmail,
          permission_whatsapp: member.permissionWhatsApp,
          permission_confirmed_by_entity: true,
          permission_confirmation_text:
            permissionConfirmationText,
          permission_confirmed_at: new Date().toISOString(),
          consent_source: "community_registration",
          review_status: "submitted",
          created_by_representative_id: representative.id,
        }));

        const { error: membersError } = await supabase
          .from("communication_entity_member_submissions")
          .insert(memberRecords);

        if (membersError) {
          throw new Error(
            membersError.message ||
              "The interested-member list could not be submitted.",
          );
        }
      }

      setRegistrationResult({
        entityId: entity.id,
        entityCode: entity.entity_code,
        secureToken: entity.secure_management_token,
        organizationName: entity.display_name,
        membersSubmitted: members.length,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("COMMUNITY REGISTRATION ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The registration could not be submitted. Please review the information and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyManagementLink() {
    if (!managementUrl) {
      return;
    }

    await navigator.clipboard.writeText(managementUrl);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2500);
  }

  if (registrationResult) {
    return (
      <RegistrationSuccess
        result={registrationResult}
        managementUrl={managementUrl}
        copied={copied}
        onCopy={() => void copyManagementLink()}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PublicHeader />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              <HeartHandshake className="h-4 w-4" />
              EPEW Community Network
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Grow Opportunities in Your Community
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Register your church, business, school, nonprofit,
              association, or community organization and help connect
              interested people with entrepreneurship, business
              development, and community wealth-building opportunities.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <FeatureBadge
                icon={ShieldCheck}
                label="Administrator reviewed"
              />
              <FeatureBadge
                icon={Sparkles}
                label="Secure contact validation"
              />
              <FeatureBadge
                icon={Languages}
                label="Multilingual communication"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-7 xl:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5">
            <ProgressPanel
              currentStep={currentStep}
              progress={progress}
            />

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-lg font-black text-slate-950">
                Administrator approval required
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Submitted organizations and member lists are reviewed
                before contacts become eligible for EPEW campaigns.
                Registration does not automatically authorize mass
                communication.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                What happens next?
              </h2>

              <div className="mt-5 space-y-4">
                <NextStep
                  number="1"
                  text="EPEW reviews the organization registration."
                />
                <NextStep
                  number="2"
                  text="The submitted member list is checked for duplicates and incomplete records."
                />
                <NextStep
                  number="3"
                  text="The administrator approves eligible contacts or requests corrections."
                />
                <NextStep
                  number="4"
                  text="Approved contacts may receive future EPEW information based on recorded permission."
                />
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Step {currentStep} of {steps.length}
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                {steps[currentStep - 1].title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {getStepDescription(currentStep)}
              </p>
            </div>

            {errorMessage && (
              <div className="mx-6 mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 sm:mx-8">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-bold">{errorMessage}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  aria-label="Close error"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {currentStep === 1 && (
                <OrganizationStep
                  form={form}
                  onChange={updateForm}
                />
              )}

              {currentStep === 2 && (
                <RepresentativeStep
                  form={form}
                  onChange={updateForm}
                />
              )}

              {currentStep === 3 && (
                <InterestStep
                  form={form}
                  onChange={updateForm}
                />
              )}

              {currentStep === 4 && (
                <MembersStep
                  members={members}
                  onAdd={addMember}
                  onRemove={removeMember}
                  onChange={updateMember}
                />
              )}

              {currentStep === 5 && (
                <ReviewStep
                  form={form}
                  members={members}
                  onChange={updateForm}
                />
              )}
            </div>

            <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:p-6">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1 || submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  {submitting
                    ? "Submitting Registration..."
                    : "Submit for Review"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400">
            <HeartHandshake className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              EPEW-EDE-IBOS
            </p>
            <p className="text-sm font-black text-slate-950">
              Community Registration
            </p>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          EPEW Home
        </Link>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:px-6">
        <p className="font-semibold">
          EPEW-EDE-IBOS Community Registration
        </p>

        <p>
          Build Your Business. Build Your Wealth. Build Your
          Community.
        </p>
      </div>
    </footer>
  );
}

function ProgressPanel({
  currentStep,
  progress,
}: {
  currentStep: number;
  progress: number;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Registration Progress
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            {progress}% Complete
          </p>
        </div>

        <p className="text-3xl font-black text-emerald-700">
          {currentStep}/5
        </p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-6 space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const complete = currentStep > step.number;
          const active = currentStep === step.number;

          return (
            <div
              key={step.number}
              className={[
                "flex items-center gap-3 rounded-xl border p-3 transition",
                active
                  ? "border-emerald-300 bg-emerald-50"
                  : complete
                    ? "border-slate-200 bg-slate-50"
                    : "border-transparent",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  active
                    ? "bg-emerald-600 text-white"
                    : complete
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  {step.title}
                </p>
                <p className="text-xs text-slate-500">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrganizationStep({
  form,
  onChange,
}: {
  form: RegistrationForm;
  onChange: <K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) => void;
}) {
  return (
    <div className="space-y-7">
      <section>
        <SectionTitle
          title="Entity Type"
          description="Select the category that best describes your organization."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ENTITY_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = form.entityType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange("entityType", option.value)
                }
                className={[
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Organization Information"
          description="Enter the organization’s official contact and location information."
        />

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <FormField label="Legal or Official Name" required>
            <input
              value={form.legalName}
              onChange={(event) =>
                onChange("legalName", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Public or Common Name" required>
            <input
              value={form.displayName}
              onChange={(event) =>
                onChange("displayName", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Organization Phone">
            <input
              type="tel"
              value={form.organizationPhone}
              onChange={(event) =>
                onChange(
                  "organizationPhone",
                  event.target.value,
                )
              }
              placeholder="+1 347 555 1234"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Organization Email">
            <input
              type="email"
              value={form.organizationEmail}
              onChange={(event) =>
                onChange(
                  "organizationEmail",
                  event.target.value,
                )
              }
              placeholder="office@example.org"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Website">
            <input
              type="url"
              value={form.website}
              onChange={(event) =>
                onChange("website", event.target.value)
              }
              placeholder="https://example.org"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Country">
            <input
              value={form.country}
              onChange={(event) =>
                onChange("country", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Street Address">
            <input
              value={form.streetAddress}
              onChange={(event) =>
                onChange("streetAddress", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Address Line 2">
            <input
              value={form.addressLine2}
              onChange={(event) =>
                onChange("addressLine2", event.target.value)
              }
              className={inputClassName}
            />
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

          <FormField label="State or Province">
            <input
              value={form.state}
              onChange={(event) =>
                onChange("state", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="ZIP or Postal Code">
            <input
              value={form.postalCode}
              onChange={(event) =>
                onChange("postalCode", event.target.value)
              }
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="mt-5">
          <FormField label="Organization Description">
            <textarea
              value={form.organizationDescription}
              onChange={(event) =>
                onChange(
                  "organizationDescription",
                  event.target.value,
                )
              }
              rows={4}
              placeholder="Briefly describe the organization, its mission, and the community it serves."
              className={textareaClassName}
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}

function RepresentativeStep({
  form,
  onChange,
}: {
  form: RegistrationForm;
  onChange: <K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) => void;
}) {
  return (
    <div className="space-y-7">
      <SectionTitle
        title="Primary Representative"
        description="This person will serve as the official contact and community ambassador for the organization."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="First Name" required>
          <input
            value={form.representativeFirstName}
            onChange={(event) =>
              onChange(
                "representativeFirstName",
                event.target.value,
              )
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Last Name" required>
          <input
            value={form.representativeLastName}
            onChange={(event) =>
              onChange(
                "representativeLastName",
                event.target.value,
              )
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Title or Position" required>
          <input
            value={form.representativeTitle}
            onChange={(event) =>
              onChange(
                "representativeTitle",
                event.target.value,
              )
            }
            placeholder="Pastor, President, Director, Owner..."
            className={inputClassName}
          />
        </FormField>

        <FormField label="Direct Phone Number">
          <input
            type="tel"
            value={form.representativePhone}
            onChange={(event) =>
              onChange(
                "representativePhone",
                event.target.value,
              )
            }
            placeholder="+1 347 555 1234"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Email Address">
          <input
            type="email"
            value={form.representativeEmail}
            onChange={(event) =>
              onChange(
                "representativeEmail",
                event.target.value,
              )
            }
            placeholder="representative@example.org"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Preferred Language">
          <SelectInput
            value={form.representativeLanguage}
            onChange={(value) =>
              onChange(
                "representativeLanguage",
                value as PreferredLanguage,
              )
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Preferred Contact Method">
          <SelectInput
            value={form.representativeChannel}
            onChange={(value) =>
              onChange(
                "representativeChannel",
                value as PreferredChannel,
              )
            }
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </div>

      <section>
        <SectionTitle
          title="Representative Communication Permissions"
          description="Select only the channels through which this representative has agreed to receive EPEW communications."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PermissionOption
            label="SMS"
            icon={Phone}
            checked={form.representativeSmsPermission}
            onChange={(checked) =>
              onChange(
                "representativeSmsPermission",
                checked,
              )
            }
          />

          <PermissionOption
            label="Email"
            icon={Mail}
            checked={form.representativeEmailPermission}
            onChange={(checked) =>
              onChange(
                "representativeEmailPermission",
                checked,
              )
            }
          />

          <PermissionOption
            label="WhatsApp"
            icon={MessageCircle}
            checked={form.representativeWhatsAppPermission}
            onChange={(checked) =>
              onChange(
                "representativeWhatsAppPermission",
                checked,
              )
            }
          />
        </div>
      </section>
    </div>
  );
}

function InterestStep({
  form,
  onChange,
}: {
  form: RegistrationForm;
  onChange: <K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) => void;
}) {
  return (
    <div className="space-y-7">
      <SectionTitle
        title="Organization Interest"
        description="Tell EPEW how your organization would like to participate."
      />

      <FormField
        label="Why is your organization interested in EPEW?"
        required
      >
        <textarea
          value={form.interestReason}
          onChange={(event) =>
            onChange("interestReason", event.target.value)
          }
          rows={6}
          placeholder="Describe your organization’s goals, the needs of your community, and the opportunities you would like to explore with EPEW."
          className={textareaClassName}
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Estimated Interested Members">
          <input
            type="number"
            min="0"
            value={form.estimatedInterestedMembers}
            onChange={(event) =>
              onChange(
                "estimatedInterestedMembers",
                event.target.value,
              )
            }
            placeholder="0"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Preferred Meeting Format">
          <SelectInput
            value={form.preferredMeetingFormat}
            onChange={(value) =>
              onChange(
                "preferredMeetingFormat",
                value as MeetingFormat,
              )
            }
          >
            <option value="not_selected">
              Not Selected
            </option>
            <option value="virtual">Virtual</option>
            <option value="in_person">In Person</option>
            <option value="hybrid">Hybrid</option>
          </SelectInput>
        </FormField>
      </div>

      <div className="grid gap-3">
        <RequestOption
          title="Request an EPEW Information Session"
          description="Arrange a presentation for your organization or community."
          checked={form.requestsInformationSession}
          onChange={(checked) =>
            onChange(
              "requestsInformationSession",
              checked,
            )
          }
        />

        <RequestOption
          title="Request Promotional Materials"
          description="Receive approved digital materials to share with interested members."
          checked={form.requestsCampaignMaterials}
          onChange={(checked) =>
            onChange(
              "requestsCampaignMaterials",
              checked,
            )
          }
        />

        <RequestOption
          title="Apply to Become an EPEW Community Partner"
          description="Request information about an official partnership relationship."
          checked={form.requestsPartnerStatus}
          onChange={(checked) =>
            onChange("requestsPartnerStatus", checked)
          }
        />
      </div>
    </div>
  );
}

function MembersStep({
  members,
  onAdd,
  onRemove,
  onChange,
}: {
  members: MemberDraft[];
  onAdd: () => void;
  onRemove: (localId: string) => void;
  onChange: <K extends keyof MemberDraft>(
    localId: string,
    field: K,
    value: MemberDraft[K],
  ) => void;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionTitle
          title="Interested Members"
          description="Add people who have expressed interest in EPEW. This step may be skipped and completed later through the secure organization link."
        />

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

          <div>
            <p className="text-sm font-black text-blue-950">
              CSV and Excel upload
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              Spreadsheet upload will be available from the secure
              organization management page. Members can be entered
              individually here.
            </p>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <UsersRound className="mx-auto h-9 w-9 text-slate-400" />

          <h3 className="mt-4 text-lg font-black text-slate-950">
            No members added yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Continue without members or add interested people now.
            You will receive a secure link to manage the list later.
          </p>

          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            <Plus className="h-4 w-4" />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {members.map((member, index) => (
            <MemberCard
              key={member.localId}
              member={member}
              index={index}
              onRemove={() => onRemove(member.localId)}
              onChange={(field, value) =>
                onChange(member.localId, field, value)
              }
            />
          ))}

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            Add Another Member
          </button>
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  index,
  onRemove,
  onChange,
}: {
  member: MemberDraft;
  index: number;
  onRemove: () => void;
  onChange: <K extends keyof MemberDraft>(
    field: K,
    value: MemberDraft[K],
  ) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
            {index + 1}
          </div>

          <div>
            <p className="text-sm font-black text-slate-950">
              Interested Member {index + 1}
            </p>
            <p className="text-xs text-slate-500">
              Pending administrator review
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50"
          aria-label={`Remove member ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FormField label="First Name" required>
          <input
            value={member.firstName}
            onChange={(event) =>
              onChange("firstName", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Last Name" required>
          <input
            value={member.lastName}
            onChange={(event) =>
              onChange("lastName", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Phone Number">
          <input
            type="tel"
            value={member.phone}
            onChange={(event) =>
              onChange("phone", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Email Address">
          <input
            type="email"
            value={member.email}
            onChange={(event) =>
              onChange("email", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="WhatsApp Number">
          <input
            type="tel"
            value={member.whatsappNumber}
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
            value={member.interestType}
            onChange={(value) =>
              onChange("interestType", value as InterestType)
            }
          >
            {INTEREST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Preferred Language">
          <SelectInput
            value={member.preferredLanguage}
            onChange={(value) =>
              onChange(
                "preferredLanguage",
                value as PreferredLanguage,
              )
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Preferred Channel">
          <SelectInput
            value={member.preferredChannel}
            onChange={(value) =>
              onChange(
                "preferredChannel",
                value as PreferredChannel,
              )
            }
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="City">
          <input
            value={member.city}
            onChange={(event) =>
              onChange("city", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="State">
          <input
            value={member.state}
            onChange={(event) =>
              onChange("state", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Recorded Permissions
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <PermissionOption
            label="SMS"
            icon={Phone}
            checked={member.permissionSms}
            onChange={(checked) =>
              onChange("permissionSms", checked)
            }
          />

          <PermissionOption
            label="Email"
            icon={Mail}
            checked={member.permissionEmail}
            onChange={(checked) =>
              onChange("permissionEmail", checked)
            }
          />

          <PermissionOption
            label="WhatsApp"
            icon={MessageCircle}
            checked={member.permissionWhatsApp}
            onChange={(checked) =>
              onChange("permissionWhatsApp", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  members,
  onChange,
}: {
  form: RegistrationForm;
  members: MemberDraft[];
  onChange: <K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) => void;
}) {
  const entityLabel =
    ENTITY_TYPE_OPTIONS.find(
      (option) => option.value === form.entityType,
    )?.label ?? "Organization";

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-black text-slate-950">
          Registration Summary
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ReviewItem
            label="Entity"
            value={form.displayName}
          />
          <ReviewItem label="Entity Type" value={entityLabel} />
          <ReviewItem
            label="Organization Contact"
            value={
              form.organizationEmail ||
              form.organizationPhone ||
              "Not provided"
            }
          />
          <ReviewItem
            label="Primary Representative"
            value={`${form.representativeFirstName} ${form.representativeLastName}`.trim()}
          />
          <ReviewItem
            label="Representative Title"
            value={form.representativeTitle}
          />
          <ReviewItem
            label="Members Included"
            value={String(members.length)}
          />
          <ReviewItem
            label="Information Session"
            value={
              form.requestsInformationSession
                ? "Requested"
                : "Not requested"
            }
          />
          <ReviewItem
            label="Community Partnership"
            value={
              form.requestsPartnerStatus
                ? "Requested"
                : "Not requested"
            }
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

          <div>
            <h3 className="text-sm font-black text-emerald-950">
              AI-assisted validation
            </h3>

            <p className="mt-1 text-xs leading-5 text-emerald-800">
              After submission, the EPEW Communication Assistant may
              identify duplicate, incomplete, invalid, or
              permission-review records. Final decisions remain under
              administrator control.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ConfirmationCheckbox
          checked={form.authorizedRepresentativeConfirmed}
          onChange={(checked) =>
            onChange(
              "authorizedRepresentativeConfirmed",
              checked,
            )
          }
          title="Authorized Representative"
          description="I confirm that I am authorized to submit this registration on behalf of the organization."
        />

        <ConfirmationCheckbox
          checked={form.consentConfirmed}
          onChange={(checked) =>
            onChange("consentConfirmed", checked)
          }
          title="Member Interest and Information Confirmation"
          description="I confirm that the individuals submitted have expressed an interest in receiving information about EPEW or authorized this organization to share their contact information for this purpose. I understand that each communication channel remains subject to recorded permission and administrator review."
        />
      </div>
    </div>
  );
}

function RegistrationSuccess({
  result,
  managementUrl,
  copied,
  onCopy,
}: {
  result: RegistrationResult;
  managementUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-100">
      <PublicHeader />

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-xl">
          <div className="bg-slate-950 p-8 text-center text-white sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-400 text-slate-950">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Registration Received
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Thank You, {result.organizationName}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Your organization registration has been submitted for
              EPEW administrator review. Submitted members will not
              enter a mass campaign until validation and approval are
              completed.
            </p>
          </div>

          <div className="p-6 sm:p-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <SuccessMetric
                label="Entity Code"
                value={result.entityCode}
              />

              <SuccessMetric
                label="Members Submitted"
                value={String(result.membersSubmitted)}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <h2 className="text-sm font-black text-amber-950">
                    Protect this private management link
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    This link will provide access to your
                    organization’s registration and member-list
                    management page. Share it only with authorized
                    representatives.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  readOnly
                  value={managementUrl}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-slate-700"
                />

                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-900 px-5 text-sm font-black text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ClipboardCheck className="h-4 w-4" />
                  )}

                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to EPEW
              </Link>

              <Link
                href={`/community-registration/manage/${result.secureToken}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Manage Organization
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </span>
  );
}

function NextStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
        {number}
      </div>

      <p className="pt-0.5 text-sm leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-black text-slate-950">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(event.target.checked)}
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

function RequestOption({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition",
        checked
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />

      <div>
        <p className="text-sm font-black text-slate-900">
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </label>
  );
}

function ConfirmationCheckbox({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition",
        checked
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />

      <div>
        <p className="text-sm font-black text-slate-950">
          {title}
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </label>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function SuccessMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function getStepDescription(step: number) {
  switch (step) {
    case 1:
      return "Register the organization, church, business, school, association, or community group.";

    case 2:
      return "Identify the person authorized to communicate with EPEW and manage the organization’s member list.";

    case 3:
      return "Describe the organization’s goals and the type of relationship it would like to develop with EPEW.";

    case 4:
      return "Add interested members now or complete the list later through the secure organization management link.";

    case 5:
      return "Review the information, confirm authorization and consent, and submit the registration for administrator review.";

    default:
      return "";
  }
}

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const textareaClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";