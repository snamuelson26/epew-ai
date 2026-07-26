"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  ContactRound,
  Download,
  Edit3,
  FileText,
  FolderPlus,
  Globe2,
  History,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type CommunicationChannel = string;
type CommunicationContact = {
  id: string;
  display_name: string;
  photo_url?: string | null;
  contact_type?: string | null;
  status?: string | null;
  job_title?: string | null;
  organization?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  preferred_channel?: string | null;
  communication_quality_score?: number;
  ai_quality_summary?: string | null;
  last_contacted_at?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  verified_phone?: boolean;
  verified_email?: boolean;
  permission_sms?: boolean;
  permission_email?: boolean;
  permission_whatsapp?: boolean;
  permission_voice?: boolean;
  permission_source?: string | null;
  tags: string[];
  source?: string;
  created_at?: string;
  notes?: string | null;
  [key: string]: unknown;
};

const CHANNEL_LABELS: Record<string, string> = {};
const CONTACT_STATUS_LABELS: Record<string, string> = {};
const CONTACT_TYPE_LABELS: Record<string, string> = {};
const LANGUAGE_LABELS: Record<string, string> = {};

type CommunicationEvent = {
  id: string;
  contact_id: string;
  campaign_id: string | null;
  event_type: string;
  channel: CommunicationChannel | null;
  direction: "inbound" | "outbound" | "internal" | "system";
  status: string | null;
  title: string;
  summary: string | null;
  message_preview: string | null;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  performed_by_type: string;
  created_at: string;
};

type ContactGroup = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  color: string | null;
  active: boolean;
};

type GroupMembershipRow = {
  group_id: string;
  communication_contact_groups:
    | ContactGroup
    | ContactGroup[]
    | null;
};

type TimelineFilter =
  | "all"
  | "sms"
  | "whatsapp"
  | "email"
  | "registration"
  | "funding"
  | "certificate"
  | "event"
  | "internal";

const TIMELINE_FILTERS: Array<{
  value: TimelineFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "sms",
    label: "SMS",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "registration",
    label: "Registration",
  },
  {
    value: "funding",
    label: "Funding",
  },
  {
    value: "certificate",
    label: "Certificates",
  },
  {
    value: "event",
    label: "Events",
  },
  {
    value: "internal",
    label: "Internal",
  },
];

export default function ContactDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const contactId =
  typeof params.id === "string" ? params.id : "";

const isValidContactId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    contactId,
  );

  const [contact, setContact] =
    useState<CommunicationContact | null>(null);

  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [timelineFilter, setTimelineFilter] =
    useState<TimelineFilter>("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showActions, setShowActions] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadContact = useCallback(
    async (showRefreshState = false) => {
      if (!contactId || !isValidContactId) {
  setContact(null);
  setErrorMessage(
    "The address does not contain a valid contact ID. Return to Official Contacts and select an existing contact.",
  );
  setLoading(false);
  setRefreshing(false);
  return;
}

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const [
        contactResult,
        eventsResult,
        groupsResult,
      ] = await Promise.all([
        supabase
  .from("communication_contacts")
  .select("*")
  .eq("id", String(contactId).trim())
  .limit(1)
  .maybeSingle(),

        supabase
          .from("communication_events")
          .select("*")
          .eq("contact_id", contactId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("communication_contact_group_members")
          .select(
            `
              group_id,
              communication_contact_groups (
                id,
                name,
                description,
                group_type,
                color,
                active
              )
            `,
          )
          .eq("contact_id", contactId),
      ]);

      if (contactResult.error) {
  console.error("CONTACT LOAD ERROR:", {
    contactId,
    code: contactResult.error.code,
    message: contactResult.error.message,
    details: contactResult.error.details,
    hint: contactResult.error.hint,
  });

  setErrorMessage(
    `Unable to load the contact profile. ${contactResult.error.message}`,
  );

  setContact(null);
} else if (!contactResult.data) {
  console.error("CONTACT NOT FOUND:", {
    contactId,
    requestedId: String(contactId).trim(),
  });

  setErrorMessage(
    `No communication contact exists with ID: ${String(contactId)}`,
  );

  setContact(null);
} else {
  setContact(
    contactResult.data as CommunicationContact,
  );
}

      if (eventsResult.error) {
        console.error(eventsResult.error);
      } else {
        setEvents(
          (eventsResult.data ?? []) as CommunicationEvent[],
        );
      }

      if (groupsResult.error) {
        console.error(groupsResult.error);
      } else {
        const membershipRows =
          (groupsResult.data ??
            []) as unknown as GroupMembershipRow[];

        const normalizedGroups = membershipRows
          .map((row) => {
            const joined = row.communication_contact_groups;

            if (Array.isArray(joined)) {
              return joined[0] ?? null;
            }

            return joined;
          })
          .filter(
            (group): group is ContactGroup =>
              group !== null,
          );

        setGroups(normalizedGroups);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [contactId, supabase],
  );

  useEffect(() => {
    void loadContact();
  }, [loadContact]);

  const filteredEvents = useMemo(() => {
    if (timelineFilter === "all") {
      return events;
    }

    return events.filter((event) => {
      const eventType = event.event_type.toLowerCase();
      const title = event.title.toLowerCase();

      switch (timelineFilter) {
        case "sms":
          return event.channel === "sms";

        case "whatsapp":
          return event.channel === "whatsapp";

        case "email":
          return event.channel === "email";

        case "registration":
          return (
            eventType.includes("registration") ||
            title.includes("registration")
          );

        case "funding":
          return (
            eventType.includes("funding") ||
            title.includes("funding")
          );

        case "certificate":
          return (
            eventType.includes("certificate") ||
            title.includes("certificate")
          );

        case "event":
          return (
            eventType.includes("event") ||
            eventType.includes("meeting") ||
            title.includes("meeting") ||
            title.includes("invitation")
          );

        case "internal":
          return (
            event.direction === "internal" ||
            event.direction === "system"
          );

        default:
          return true;
      }
    });
  }, [events, timelineFilter]);

  const overviewMetrics = useMemo(() => {
    const messagesSent = events.filter(
      (event) => event.direction === "outbound",
    ).length;

    const messagesReceived = events.filter(
      (event) => event.direction === "inbound",
    ).length;

    const clicks = events.filter(
      (event) =>
        event.event_type.toLowerCase().includes("click"),
    ).length;

    const campaigns = new Set(
      events
        .map((event) => event.campaign_id)
        .filter(Boolean),
    ).size;

    return {
      messagesSent,
      messagesReceived,
      clicks,
      campaigns,
    };
  }, [events]);

  const contactHealth = useMemo(() => {
    if (!contact) {
      return [];
    }

    return [
      {
        label: "Phone number",
        complete: !!contact.phone,
      },
      {
        label: "Email address",
        complete: !!contact.email,
      },
      {
        label: "Phone verified",
        complete: !!contact.verified_phone,
      },
      {
        label: "Email verified",
        complete: !!contact.verified_email,
      },
      {
        label: "Preferred language",
        complete: !!contact.preferred_language,
      },
      {
        label: "Preferred channel",
        complete:
          contact.preferred_channel !== "none",
      },
      {
        label: "Communication permission",
        complete: !!(
          contact.permission_sms ||
          contact.permission_email ||
          contact.permission_whatsapp ||
          contact.permission_voice
        ),
      },
      {
        label: "Organization",
        complete: !!contact.organization,
      },
      {
        label: "Location",
        complete: !!(contact.city || contact.state),
      },
      {
        label: "AI summary",
        complete: !!contact.ai_contact_summary,
      },
    ];
  }, [contact]);

  const healthPercentage = useMemo(() => {
    if (contactHealth.length === 0) {
      return 0;
    }

    const completed = contactHealth.filter(
      (item) => item.complete,
    ).length;

    return Math.round(
      (completed / contactHealth.length) * 100,
    );
  }, [contactHealth]);

  async function addNote() {
    if (!contact || !noteText.trim()) {
      return;
    }

    setSavingNote(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } =
      await supabase.auth.getUser();

    const currentNotes = typeof contact.notes === "string" ? contact.notes.trim() : "";

    const datedNote = `[${new Date().toLocaleString(
      "en-US",
    )}] ${noteText.trim()}`;

    const updatedNotes = currentNotes
      ? `${currentNotes}\n\n${datedNote}`
      : datedNote;

    const { error: contactError } = await supabase
      .from("communication_contacts")
      .update({
        notes: updatedNotes,
        updated_by: userData.user?.id ?? null,
      })
      .eq("id", contact.id);

    if (contactError) {
      console.error(contactError);
      setErrorMessage(
        "The administrator note could not be saved.",
      );
      setSavingNote(false);
      return;
    }

    const { error: eventError } = await supabase
      .from("communication_events")
      .insert({
        contact_id: contact.id,
        event_type: "ADMINISTRATOR_NOTE_ADDED",
        channel: null,
        direction: "internal",
        status: "completed",
        title: "Administrator note added",
        summary: noteText.trim(),
        performed_by: userData.user?.id ?? null,
        performed_by_type: "administrator",
      });

    if (eventError) {
      console.error(eventError);
    }

    setNoteText("");
    setShowAddNote(false);
    setSuccessMessage("Administrator note added.");

    await loadContact(true);

    setSavingNote(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading contact profile...
          </p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="mx-auto max-w-2xl p-6 sm:p-8">
        <div className="rounded-[1.75rem] border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <CircleAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Contact not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {errorMessage ||
              "The requested contact record is not available."}
          </p>

          <Link
            href="/admin/communication-center/contacts"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Official Contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 xl:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <Link
              href="/admin/communication-center"
              className="transition hover:text-slate-950"
            >
              Communication Center
            </Link>

            <ChevronRight className="h-4 w-4" />

            <Link
              href="/admin/communication-center/contacts"
              className="transition hover:text-slate-950"
            >
              Official Contacts
            </Link>

            <ChevronRight className="h-4 w-4" />

            <span className="text-emerald-700">
              {contact.display_name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() => void loadContact(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
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
            href={`/admin/communication-center/contacts/${contact.id}/edit`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Edit3 className="h-4 w-4" />
            Edit Contact
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowActions((current) => !current)
              }
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Contact actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showActions && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20"
                  onClick={() => setShowActions(false)}
                  aria-label="Close actions menu"
                />

                <div className="absolute right-0 top-13 z-30 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  <ActionMenuLink
                    href={`/admin/communication-center/assistant?contact=${contact.id}&command=prepare-sms`}
                    icon={MessagesSquare}
                    label="Prepare SMS"
                  />

                  <ActionMenuLink
                    href={`/admin/communication-center/assistant?contact=${contact.id}&command=prepare-email`}
                    icon={Mail}
                    label="Prepare Email"
                  />

                  <ActionMenuLink
                    href={`/admin/communication-center/assistant?contact=${contact.id}&command=prepare-whatsapp`}
                    icon={MessageCircle}
                    label="Prepare WhatsApp"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowActions(false);
                      setShowAddNote(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Add Administrator Note
                  </button>

                  <ActionMenuLink
                    href={`/admin/communication-center/groups?contact=${contact.id}`}
                    icon={FolderPlus}
                    label="Assign to Group"
                  />

                  <ActionMenuLink
                    href={`/admin/communication-center/contacts/${contact.id}/report`}
                    icon={Download}
                    label="Generate Contact Report"
                  />
                </div>
              </>
            )}
          </div>
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

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
        <div className="relative p-6 sm:p-8 xl:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={contact.display_name}
                  className="h-28 w-28 rounded-[1.75rem] border-4 border-white/10 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.75rem] border-4 border-white/10 bg-white/10 text-3xl font-black text-white">
                  {getInitials(contact.display_name as string)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    {contact.contact_type ? CONTACT_TYPE_LABELS[contact.contact_type] : "Unknown"}
                  </span>

                  <ContactStatusBadge
                    status={contact.status}
                  />
                </div>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                  {contact.display_name}
                </h1>

                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {contact.job_title ||
                    "Official EPEW Contact"}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
                  {contact.organization && (
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-300" />
                      {contact.organization}
                    </span>
                  )}

                  {(contact.city || contact.state) && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-300" />
                      {[contact.city, contact.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-2">
                    <Languages className="h-4 w-4 text-emerald-300" />
                    {
                      // Guard against null/undefined preferred_language when indexing
                      (contact.preferred_language && LANGUAGE_LABELS[contact.preferred_language]) || LANGUAGE_LABELS['en']
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[430px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Communication Score
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <p className="text-4xl font-black">
                    {contact.communication_quality_score}
                  </p>

                  <p className="pb-1 text-sm font-bold text-slate-400">
                    / 100
                  </p>
                </div>

                <p className="mt-2 text-xs font-semibold text-emerald-300">
                  {contact.ai_quality_summary ||
                    "Communication analysis pending"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Preferred Channel
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <ChannelIcon
                    channel={contact.preferred_channel ?? ""}
                  />

                  <p className="text-xl font-black">
                    {CHANNEL_LABELS[contact.preferred_channel ?? ""]}
                  </p>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Last contacted:{" "}
                  {contact.last_contacted_at
                    ? formatDate(contact.last_contacted_at)
                    : "Not yet contacted"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          title="Messages Sent"
          value={overviewMetrics.messagesSent}
          icon={Send}
        />

        <OverviewMetric
          title="Messages Received"
          value={overviewMetrics.messagesReceived}
          icon={MessageCircle}
        />

        <OverviewMetric
          title="Campaigns"
          value={overviewMetrics.campaigns}
          icon={BarChart3}
        />

        <OverviewMetric
          title="Links Clicked"
          value={overviewMetrics.clicks}
          icon={Activity}
        />
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <ContactProfileCard contact={contact} />

          <TimelineSection
            events={filteredEvents}
            selectedFilter={timelineFilter}
            onFilterChange={setTimelineFilter}
          />
        </div>

        <div className="space-y-6">
          <AIInsightCard contact={contact} />

          <RecommendedActionCard contact={contact} />

          <PermissionsCard contact={contact} />

          <GroupsCard
            contactId={contact.id}
            groups={groups}
          />

          <ContactHealthCard
            score={healthPercentage}
            items={contactHealth}
          />

          <NotesCard
            notes={contact.notes ?? null}
            onAddNote={() => setShowAddNote(true)}
          />
        </div>
      </section>

      {showAddNote && (
        <AddNoteDialog
          note={noteText}
          saving={savingNote}
          onChange={setNoteText}
          onClose={() => {
            if (!savingNote) {
              setShowAddNote(false);
              setNoteText("");
            }
          }}
          onSave={() => void addNote()}
        />
      )}
    </div>
  );
}

function ContactProfileCard({
  contact,
}: {
  contact: CommunicationContact;
}) {
  const fields = [
    {
      label: "Full Name",
      value: contact.display_name,
      icon: UserRound,
    },
    {
      label: "Organization",
      value: contact.organization || "Not provided",
      icon: Building2,
    },
    {
      label: "Title or Role",
      value: contact.job_title || "Not provided",
      icon: ContactRound,
    },
    {
      label: "Contact Type",
      value: contact.contact_type ? CONTACT_TYPE_LABELS[contact.contact_type] : "Not provided",
      icon: UsersRound,
    },
    {
      label: "Phone",
      value: contact.phone || "Not provided",
      icon: Phone,
    },
    {
      label: "WhatsApp",
      value: contact.whatsapp_number || "Not provided",
      icon: MessageCircle,
    },
    {
      label: "Email",
      value: contact.email || "Not provided",
      icon: Mail,
    },
    {
      label: "Preferred Language",
      value:
        contact.preferred_language ? LANGUAGE_LABELS[contact.preferred_language] : "Not provided",
      icon: Languages,
    },
    {
      label: "Preferred Channel",
      value:
        contact.preferred_channel ? CHANNEL_LABELS[contact.preferred_channel] : "Not provided",
      icon: MessagesSquare,
    },
    {
      label: "Location",
      value:
        [
          contact.city,
          contact.state,
          contact.country,
        ]
          .filter(Boolean)
          .join(", ") || "Not provided",
      icon: MapPin,
    },
    {
      label: "Source",
      value: contact.source ? formatSource(contact.source) : "Not provided",
      icon: Globe2,
    },
    {
      label: "Date Added",
      value: contact.created_at ? formatDate(contact.created_at) : "Not provided",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Contact Profile
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          Official Contact Information
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const Icon = field.icon;

          return (
            <div
              key={field.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4" />

                <p className="text-xs font-black uppercase tracking-wide">
                  {field.label}
                </p>
              </div>

              <p className="mt-2 break-words text-sm font-black text-slate-950">
                {field.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-sm font-black text-slate-950">
          Tags
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {contact.tags.length > 0 ? (
            contact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700"
              >
                <Tag className="h-3.5 w-3.5" />
                {tag}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No tags assigned.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AIInsightCard({
  contact,
}: {
  contact: CommunicationContact;
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-950 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              AI Contact Insights
            </p>

            <h3 className="mt-1 text-lg font-black">
              Communication Summary
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm leading-7 text-slate-700">
          {(contact.ai_contact_summary as string) ||
            buildFallbackSummary(contact)}
        </p>

        <Link
          href={`/admin/communication-center/assistant?contact=${contact.id}&command=analyze-contact`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
        >
          <Sparkles className="h-4 w-4" />
          Analyze Contact
        </Link>
      </div>
    </div>
  );
}

function RecommendedActionCard({
  contact,
}: {
  contact: CommunicationContact;
}) {
  const recommendation = getRecommendedAction(contact);

  return (
    <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Recommended Next Action
          </p>

          <h3 className="mt-1 text-lg font-black text-amber-950">
            {recommendation.title}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-amber-900">
        {recommendation.description}
      </p>

      <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-amber-800">
            Recommended time
          </span>

          <span className="text-xs font-black text-amber-950">
            {recommendation.time}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-amber-800">
            Estimated cost
          </span>

          <span className="text-xs font-black text-amber-950">
            Pending live Twilio rate
          </span>
        </div>
      </div>

      <Link
        href={`/admin/communication-center/assistant?contact=${contact.id}&command=${recommendation.command}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-800"
      >
        <Send className="h-4 w-4" />
        {recommendation.buttonLabel}
      </Link>
    </div>
  );
}

function PermissionsCard({
  contact,
}: {
  contact: CommunicationContact;
}) {
  const permissions = [
    {
      label: "SMS",
      approved: contact.permission_sms,
      icon: MessagesSquare,
    },
    {
      label: "Email",
      approved: contact.permission_email,
      icon: Mail,
    },
    {
      label: "WhatsApp",
      approved: contact.permission_whatsapp,
      icon: MessageCircle,
    },
    {
      label: "Voice",
      approved: contact.permission_voice,
      icon: Phone,
    },
  ];

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Permissions
        </p>

        <h3 className="mt-1 text-lg font-black text-slate-950">
          Communication Authorization
        </h3>
      </div>

      <div className="mt-5 space-y-3">
        {permissions.map((permission) => {
          const Icon = permission.icon;

          return (
            <div
              key={permission.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    permission.approved
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <p className="text-sm font-black text-slate-800">
                  {permission.label}
                </p>
              </div>

              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                  permission.approved
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-600",
                ].join(" ")}
              >
                {permission.approved ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}

                {permission.approved
                  ? "Approved"
                  : "Not Approved"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-500">
          Permission source
        </p>

        <p className="mt-1 text-sm font-black text-slate-800">
          {contact.permission_source ||
            "No permission source recorded"}
        </p>
      </div>
    </div>
  );
}

function GroupsCard({
  contactId,
  groups,
}: {
  contactId: string;
  groups: ContactGroup[];
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Contact Groups
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950">
            Group Memberships
          </h3>
        </div>

        <Link
          href={`/admin/communication-center/groups?contact=${contactId}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Add group"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {groups.length > 0 ? (
          groups.map((group) => (
            <span
              key={group.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800"
            >
              <UsersRound className="h-3.5 w-3.5" />
              {group.name}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            This contact is not assigned to a group.
          </p>
        )}
      </div>
    </div>
  );
}

function ContactHealthCard({
  score,
  items,
}: {
  score: number;
  items: Array<{
    label: string;
    complete: boolean;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Contact Health
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950">
            Communication Readiness
          </h3>
        </div>

        <p className="text-3xl font-black text-slate-950">
          {score}%
        </p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3"
          >
            {item.complete ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            )}

            <p
              className={[
                "text-sm font-bold",
                item.complete
                  ? "text-slate-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesCard({
  notes,
  onAddNote,
}: {
  notes: string | null;
  onAddNote: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Private
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950">
            Administrator Notes
          </h3>
        </div>

        <button
          type="button"
          onClick={onAddNote}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Add administrator note"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {notes ? (
        <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {notes}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-500">
          No administrator notes have been added.
        </p>
      )}
    </div>
  );
}

function TimelineSection({
  events,
  selectedFilter,
  onFilterChange,
}: {
  events: CommunicationEvent[];
  selectedFilter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
}) {
  return (
    <div
      id="timeline"
      className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Communication Timeline
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          Complete Contact History
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Messages, campaigns, clicks, registrations,
          events, funding updates, certificates, and internal
          activity.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TIMELINE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() =>
              onFilterChange(filter.value)
            }
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-black transition",
              selectedFilter === filter.value
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {events.length > 0 ? (
          <div className="space-y-0">
            {events.map((event, index) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                last={index === events.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <History className="mx-auto h-8 w-8 text-slate-400" />

            <h3 className="mt-4 text-lg font-black text-slate-950">
              No timeline activity
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No communication or enterprise events match this
              filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEventCard({
  event,
  last,
}: {
  event: CommunicationEvent;
  last: boolean;
}) {
  const eventStyles = getEventStyles(event);
  const Icon = eventStyles.icon;

  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute bottom-0 left-5 top-10 w-px bg-slate-200" />
      )}

      <div
        className={[
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
          eventStyles.iconClass,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 pb-7">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-slate-950">
                  {event.title}
                </h3>

                {event.channel && (
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                      eventStyles.badgeClass,
                    ].join(" ")}
                  >
                    {CHANNEL_LABELS[event.channel]}
                  </span>
                )}

                {event.status && (
                  <EventStatusBadge
                    status={event.status}
                  />
                )}
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                {formatDateTime(event.created_at)}
              </p>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {formatEventType(event.event_type)}
            </span>
          </div>

          {event.summary && (
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {event.summary}
            </p>
          )}

          {event.message_preview && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Message Preview
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {event.message_preview}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddNoteDialog({
  note,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  note: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close note dialog"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-5 text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Private Administrator Record
            </p>

            <h2 className="mt-1 text-xl font-black">
              Add Contact Note
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

        <div className="p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-black text-slate-800">
              Administrator Note
            </span>

            <textarea
              value={note}
              onChange={(event) =>
                onChange(event.target.value)
              }
              rows={7}
              placeholder="Add private information, follow-up instructions, or contact context..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
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
            disabled={saving || !note.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}

            {saving ? "Saving Note..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewMetric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
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

function ChannelIcon({
  channel,
}: {
  channel: CommunicationChannel;
}) {
  const Icon =
    channel === "email"
      ? Mail
      : channel === "whatsapp"
        ? MessageCircle
        : channel === "voice"
          ? Phone
          : MessagesSquare;

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function ContactStatusBadge({
  status,
}: {
  status: CommunicationContact["status"];
}) {
  const styles = {
    active:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    inactive:
      "border-slate-400/25 bg-slate-400/10 text-slate-300",
    blocked:
      "border-red-400/25 bg-red-400/10 text-red-300",
    needs_review:
      "border-amber-400/25 bg-amber-400/10 text-amber-300",
    archived:
      "border-slate-400/25 bg-slate-400/10 text-slate-400",
  };

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider",
        styles[status as keyof typeof styles],
      ].join(" ")}
    >
      {(() => {
        if (status == null) return "Unknown";
        return (
          CONTACT_STATUS_LABELS[status as keyof typeof CONTACT_STATUS_LABELS] ??
          "Unknown"
        );
      })()}
    </span>
  );
}

function ActionMenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
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

function EventStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles =
    normalized.includes("deliver") ||
    normalized.includes("complete") ||
    normalized.includes("success")
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized.includes("fail") ||
          normalized.includes("error")
        ? "border-red-200 bg-red-50 text-red-800"
        : normalized.includes("pending") ||
            normalized.includes("scheduled")
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function getEventStyles(event: CommunicationEvent) {
  if (event.channel === "sms") {
    return {
      icon: MessagesSquare,
      iconClass:
        "border-blue-200 bg-blue-50 text-blue-700",
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  if (event.channel === "whatsapp") {
    return {
      icon: MessageCircle,
      iconClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (event.channel === "email") {
    return {
      icon: Mail,
      iconClass:
        "border-violet-200 bg-violet-50 text-violet-700",
      badgeClass:
        "border-violet-200 bg-violet-50 text-violet-800",
    };
  }

  const type = event.event_type.toLowerCase();

  if (type.includes("funding")) {
    return {
      icon: CircleDollarSign,
      iconClass:
        "border-amber-200 bg-amber-50 text-amber-700",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (type.includes("certificate")) {
    return {
      icon: FileText,
      iconClass:
        "border-sky-200 bg-sky-50 text-sky-700",
      badgeClass:
        "border-sky-200 bg-sky-50 text-sky-800",
    };
  }

  if (
    type.includes("event") ||
    type.includes("meeting")
  ) {
    return {
      icon: CalendarDays,
      iconClass:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
      badgeClass:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    };
  }

  return {
    icon: Activity,
    iconClass:
      "border-slate-200 bg-slate-50 text-slate-600",
    badgeClass:
      "border-slate-200 bg-slate-100 text-slate-700",
  };
}

function getRecommendedAction(
  contact: CommunicationContact,
) {
  if (!contact.phone && !contact.email) {
    return {
      title: "Complete contact information",
      description:
        "This contact does not currently have a usable phone number or email address. Add a verified communication method before preparing a campaign.",
      time: "As soon as possible",
      command: "complete-contact",
      buttonLabel: "Review Contact",
    };
  }

  if (
    !contact.permission_sms &&
    !contact.permission_email &&
    !contact.permission_whatsapp
  ) {
    return {
      title: "Review communication permission",
      description:
        "No outbound communication permission is currently recorded. Confirm the valid permission source before including this contact in a campaign.",
      time: "Before next campaign",
      command: "review-permission",
      buttonLabel: "Review Permission",
    };
  }

  if (
    (contact.communication_quality_score ?? 0) < 60
  ) {
    return {
      title: "Improve contact readiness",
      description:
        "This record is incomplete. Review missing information and verification fields before preparing a personalized campaign.",
      time: "Today",
      command: "improve-contact",
      buttonLabel: "Improve Contact",
    };
  }

  return {
    title: "Prepare personalized follow-up",
    description:
      `This contact is ready for communication through ${
        CHANNEL_LABELS[
          contact.preferred_channel ?? ""
        ] ?? "their preferred channel"
      }. Prepare a personalized message in ${
        LANGUAGE_LABELS[
          contact.preferred_language ?? ""
        ] ?? "their preferred language"
      } for administrator review.`,
    time: "7:00 PM",
    command: "prepare-follow-up",
    buttonLabel: "Prepare Follow-Up",
  };
}

function buildFallbackSummary(
  contact: CommunicationContact,
) {
  const availableChannels = [
    contact.permission_sms ? "SMS" : null,
    contact.permission_email ? "email" : null,
    contact.permission_whatsapp
      ? "WhatsApp"
      : null,
  ].filter(Boolean);

  const channelText =
    availableChannels.length > 0
      ? availableChannels.join(", ")
      : "no approved outbound channels";

  return `${contact.display_name} is an active ${
    (CONTACT_TYPE_LABELS[
      contact.contact_type ?? ""
    ] ?? "contact").toLowerCase()
  } contact. The preferred language is ${
    LANGUAGE_LABELS[
      contact.preferred_language ?? ""
    ] ?? "unknown"
  }, and the preferred communication channel is ${
    CHANNEL_LABELS[
      contact.preferred_channel ?? ""
    ] ?? "unknown"
  }. Current approved communication options: ${channelText}. Communication readiness is ${
    contact.communication_quality_score
  } out of 100.`;
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSource(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatEventType(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}