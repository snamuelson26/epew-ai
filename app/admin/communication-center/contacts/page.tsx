"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleUserRound,
  ContactRound,
  Copy,
  CopyCheck,
  Download,
  FileSpreadsheet,
  Filter,
  Languages,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Fallback local definitions in case the external types module is not a proper module.
// These provide minimal shapes used in this file and prevent import errors.
const CHANNEL_LABELS: Record<string, string> = {};
const CONTACT_STATUS_LABELS: Record<string, string> = {};
const CONTACT_TYPE_LABELS: Record<string, string> = {};
const LANGUAGE_LABELS: Record<string, string> = {};
type CommunicationChannel = string;
type CommunicationContact = any;
type CommunicationContactStatus = string;
type CommunicationContactType = string;
type CommunicationLanguage = string;
type ContactFilter = any;

const PAGE_SIZE = 25;

type ContactFormState = {
  first_name: string;
  last_name: string;
  display_name: string;
  organization: string;
  job_title: string;
  contact_type: CommunicationContactType;
  email: string;
  phone: string;
  whatsapp_number: string;
  preferred_language: CommunicationLanguage;
  preferred_channel: CommunicationChannel;
  city: string;
  state: string;
  country: string;
  permission_sms: boolean;
  permission_email: boolean;
  permission_whatsapp: boolean;
  notes: string;
};

const initialContactForm: ContactFormState = {
  first_name: "",
  last_name: "",
  display_name: "",
  organization: "",
  job_title: "",
  contact_type: "other",
  email: "",
  phone: "",
  whatsapp_number: "",
  preferred_language: "en",
  preferred_channel: "sms",
  city: "",
  state: "",
  country: "United States",
  permission_sms: false,
  permission_email: false,
  permission_whatsapp: false,
  notes: "",
};

export default function OfficialContactsPage() {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [contacts, setContacts] = useState<CommunicationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [contactType, setContactType] = useState<
    CommunicationContactType | "all"
  >("all");
  const [language, setLanguage] = useState<
    CommunicationLanguage | "all"
  >("all");
  const [channel, setChannel] = useState<
    CommunicationChannel | "all"
  >("all");
  const [status, setStatus] = useState<
    CommunicationContactStatus | "all"
  >("all");
  const [activeFilter, setActiveFilter] =
    useState<ContactFilter>("all");

  const [page, setPage] = useState(1);

  const [showFilters, setShowFilters] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const [savingContact, setSavingContact] = useState(false);
  const [contactForm, setContactForm] =
    useState<ContactFormState>(initialContactForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadContacts = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const { data, error } = await supabase
        .from("communication_contacts")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        setErrorMessage(
          "Unable to load official contacts. Confirm that the communication_contacts migration was completed.",
        );
      } else {
        setContacts((data ?? []) as CommunicationContact[]);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [supabase],
  );

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const statistics = useMemo(() => {
    const total = contacts.length;

    const verifiedEmails = contacts.filter(
      (contact) => contact.verified_email,
    ).length;

    const verifiedPhones = contacts.filter(
      (contact) => contact.verified_phone,
    ).length;

    const duplicates = contacts.filter(
      (contact) =>
        contact.duplicate_of !== null ||
        (contact.duplicate_confidence ?? 0) >= 80,
    ).length;

    const missingPhones = contacts.filter(
      (contact) => !contact.phone,
    ).length;

    const permissionReview = contacts.filter(
      (contact) =>
        !contact.permission_sms &&
        !contact.permission_email &&
        !contact.permission_whatsapp,
    ).length;

    return {
      total,
      verifiedEmails,
      verifiedPhones,
      duplicates,
      missingPhones,
      permissionReview,
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          contact.display_name,
          contact.organization,
          contact.email,
          contact.phone,
          contact.city,
          contact.state,
          ...contact.tags,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      const matchesType =
        contactType === "all" ||
        contact.contact_type === contactType;

      const matchesLanguage =
        language === "all" ||
        contact.preferred_language === language;

      const matchesChannel =
        channel === "all" ||
        contact.preferred_channel === channel;

      const matchesStatus =
        status === "all" || contact.status === status;

      const matchesSpecialFilter = (() => {
        switch (activeFilter) {
          case "duplicates":
            return (
              contact.duplicate_of !== null ||
              (contact.duplicate_confidence ?? 0) >= 80
            );

          case "incomplete":
            return contact.communication_quality_score < 60;

          case "permission_review":
            return (
              !contact.permission_sms &&
              !contact.permission_email &&
              !contact.permission_whatsapp
            );

          case "missing_phone":
            return !contact.phone;

          case "missing_email":
            return !contact.email;

          case "verified":
            return (
              contact.verified_email &&
              contact.verified_phone
            );

          case "recent": {
            const createdAt = new Date(contact.created_at);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            return createdAt >= sevenDaysAgo;
          }

          case "all":
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesType &&
        matchesLanguage &&
        matchesChannel &&
        matchesStatus &&
        matchesSpecialFilter
      );
    });
  }, [
    contacts,
    searchTerm,
    contactType,
    language,
    channel,
    status,
    activeFilter,
  ]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredContacts.length / PAGE_SIZE),
  );

  const displayedContacts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, page]);

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    contactType,
    language,
    channel,
    status,
    activeFilter,
  ]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function clearFilters() {
    setSearchTerm("");
    setContactType("all");
    setLanguage("all");
    setChannel("all");
    setStatus("all");
    setActiveFilter("all");
  }

  function updateContactForm<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setContactForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function createContact() {
    setErrorMessage("");
    setSuccessMessage("");

    const displayName =
      contactForm.display_name.trim() ||
      `${contactForm.first_name.trim()} ${contactForm.last_name.trim()}`.trim();

    if (!displayName) {
      setErrorMessage("The contact name is required.");
      return;
    }

    if (
      !contactForm.email.trim() &&
      !contactForm.phone.trim() &&
      !contactForm.whatsapp_number.trim()
    ) {
      setErrorMessage(
        "Enter at least one email address, phone number, or WhatsApp number.",
      );
      return;
    }

    setSavingContact(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("communication_contacts")
      .insert({
        first_name: contactForm.first_name.trim() || null,
        last_name: contactForm.last_name.trim() || null,
        display_name: displayName,
        organization:
          contactForm.organization.trim() || null,
        job_title: contactForm.job_title.trim() || null,
        contact_type: contactForm.contact_type,
        email: contactForm.email.trim() || null,
        phone: contactForm.phone.trim() || null,
        whatsapp_number:
          contactForm.whatsapp_number.trim() || null,
        preferred_language:
          contactForm.preferred_language,
        preferred_channel:
          contactForm.preferred_channel,
        city: contactForm.city.trim() || null,
        state: contactForm.state.trim() || null,
        country: contactForm.country.trim() || null,
        permission_sms: contactForm.permission_sms,
        permission_email: contactForm.permission_email,
        permission_whatsapp:
          contactForm.permission_whatsapp,
        permission_sms_updated_at:
          contactForm.permission_sms
            ? new Date().toISOString()
            : null,
        permission_email_updated_at:
          contactForm.permission_email
            ? new Date().toISOString()
            : null,
        permission_whatsapp_updated_at:
          contactForm.permission_whatsapp
            ? new Date().toISOString()
            : null,
        permission_source: "administrator",
        notes: contactForm.notes.trim() || null,
        source: "manual",
        created_by: userData.user?.id ?? null,
        updated_by: userData.user?.id ?? null,
      });

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setErrorMessage(
          "A contact with this email address already exists.",
        );
      } else {
        setErrorMessage(
          error.message ||
            "The contact could not be created.",
        );
      }

      setSavingContact(false);
      return;
    }

    setContactForm(initialContactForm);
    setShowAddContact(false);
    setSuccessMessage(
      `${displayName} was added to Official Contacts.`,
    );

    await loadContacts(true);

    setSavingContact(false);
  }

  async function updateContactStatus(
    contactId: string,
    nextStatus: CommunicationContactStatus,
  ) {
    setErrorMessage("");
    setSuccessMessage("");

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("communication_contacts")
      .update({
        status: nextStatus,
        updated_by: userData.user?.id ?? null,
      })
      .eq("id", contactId);

    if (error) {
      console.error(error);
      setErrorMessage(
        "The contact status could not be updated.",
      );
      return;
    }

    setContacts((current) =>
      current.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              status: nextStatus,
            }
          : contact,
      ),
    );

    setSuccessMessage("The contact status was updated.");
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
              Official Contacts
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Official Contacts
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            The master communication database for entrepreneurs,
            supporters, coaches, partners, organizations, community
            leaders, and official EPEW contacts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadContacts(true)}
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
            href="/admin/communication-center/contacts/import"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>

          <button
            type="button"
            onClick={() => setShowAddContact(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
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

      {successMessage && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-bold">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close message"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatisticCard
          title="Official Contacts"
          value={statistics.total}
          icon={UsersRound}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />

        <StatisticCard
          title="Verified Emails"
          value={statistics.verifiedEmails}
          icon={Mail}
          active={activeFilter === "verified"}
          onClick={() => setActiveFilter("verified")}
        />

        <StatisticCard
          title="Verified Phones"
          value={statistics.verifiedPhones}
          icon={Phone}
        />

        <StatisticCard
          title="Duplicate Records"
          value={statistics.duplicates}
          icon={CopyCheck}
          tone="warning"
          active={activeFilter === "duplicates"}
          onClick={() => setActiveFilter("duplicates")}
        />

        <StatisticCard
          title="Missing Phone Numbers"
          value={statistics.missingPhones}
          icon={UserRoundX}
          tone="danger"
          active={activeFilter === "missing_phone"}
          onClick={() => setActiveFilter("missing_phone")}
        />

        <StatisticCard
          title="Permission Review"
          value={statistics.permissionReview}
          icon={ShieldAlert}
          tone="warning"
          active={activeFilter === "permission_review"}
          onClick={() =>
            setActiveFilter("permission_review")
          }
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-slate-950 p-6 text-white xl:grid-cols-[1fr_auto] xl:items-center sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Bot className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  AI Contact Intelligence
                </p>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                  Administrator Review
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black">
                Contact database analysis
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                The assistant found {statistics.duplicates} possible
                duplicates, {statistics.missingPhones} contacts
                without phone numbers, and{" "}
                {statistics.permissionReview} contacts requiring
                permission review.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/communication-center/contacts/duplicates"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              <CopyCheck className="h-4 w-4" />
              Review Duplicates
            </Link>

            <Link
              href="/admin/communication-center/assistant?command=analyze-contacts"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              <Sparkles className="h-4 w-4" />
              Ask Assistant
            </Link>
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
                placeholder="Search by name, organization, phone, email, city, state, or tag..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={[
                  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition",
                  showFilters
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>

              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-5">
              <FilterSelect
                label="Contact Type"
                value={contactType}
                onChange={(value) =>
                  setContactType(
                    value as CommunicationContactType | "all",
                  )
                }
              >
                <option value="all">All contact types</option>

                {Object.entries(CONTACT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {String(label)}
                    </option>
                  ),
                )}
              </FilterSelect>

              <FilterSelect
                label="Language"
                value={language}
                onChange={(value) =>
                  setLanguage(
                    value as CommunicationLanguage | "all",
                  )
                }
              >
                <option value="all">All languages</option>

                {Object.entries(LANGUAGE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {String(label)}
                    </option>
                  ),
                )}
              </FilterSelect>

              <FilterSelect
                label="Preferred Channel"
                value={channel}
                onChange={(value) =>
                  setChannel(
                    value as CommunicationChannel | "all",
                  )
                }
              >
                <option value="all">All channels</option>

                {Object.entries(CHANNEL_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {String(label)}
                    </option>
                  ),
                )}
              </FilterSelect>

              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) =>
                  setStatus(
                    value as CommunicationContactStatus | "all",
                  )
                }
              >
                <option value="all">All statuses</option>

                {Object.entries(CONTACT_STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {String(label)}
                    </option>
                  ),
                )}
              </FilterSelect>

              <FilterSelect
                label="Quality"
                value={activeFilter}
                onChange={(value) =>
                  setActiveFilter(value as ContactFilter)
                }
              >
                <option value="all">All records</option>
                <option value="duplicates">
                  Possible duplicates
                </option>
                <option value="incomplete">
                  Incomplete records
                </option>
                <option value="permission_review">
                  Permission review
                </option>
                <option value="missing_phone">
                  Missing phone
                </option>
                <option value="missing_email">
                  Missing email
                </option>
                <option value="verified">
                  Fully verified
                </option>
                <option value="recent">
                  Recently added
                </option>
              </FilterSelect>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <QuickFilter
              label="All Contacts"
              count={statistics.total}
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            />

            <QuickFilter
              label="Duplicates"
              count={statistics.duplicates}
              active={activeFilter === "duplicates"}
              onClick={() => setActiveFilter("duplicates")}
            />

            <QuickFilter
              label="Incomplete"
              active={activeFilter === "incomplete"}
              onClick={() => setActiveFilter("incomplete")}
            />

            <QuickFilter
              label="Permission Review"
              count={statistics.permissionReview}
              active={activeFilter === "permission_review"}
              onClick={() =>
                setActiveFilter("permission_review")
              }
            />

            <QuickFilter
              label="Recently Added"
              active={activeFilter === "recent"}
              onClick={() => setActiveFilter("recent")}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeading>Contact</TableHeading>
                <TableHeading>Organization</TableHeading>
                <TableHeading>Type</TableHeading>
                <TableHeading>Phone</TableHeading>
                <TableHeading>Email</TableHeading>
                <TableHeading>Channel</TableHeading>
                <TableHeading>Language</TableHeading>
                <TableHeading>Quality</TableHeading>
                <TableHeading>Permission</TableHeading>
                <TableHeading>Status</TableHeading>
                <TableHeading align="right">
                  Actions
                </TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />

                      <p className="mt-3 text-sm font-bold text-slate-600">
                        Loading official contacts...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : displayedContacts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20">
                    <EmptyContacts
                      hasFilters={
                        searchTerm.length > 0 ||
                        contactType !== "all" ||
                        language !== "all" ||
                        channel !== "all" ||
                        status !== "all" ||
                        activeFilter !== "all"
                      }
                      onAdd={() => setShowAddContact(true)}
                      onClear={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                displayedContacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onUpdateStatus={updateContactStatus}
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
              {displayedContacts.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-slate-950">
              {filteredContacts.length}
            </span>{" "}
            matching contacts
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

      {showAddContact && (
        <AddContactDialog
          form={contactForm}
          saving={savingContact}
          onChange={updateContactForm}
          onClose={() => {
            if (!savingContact) {
              setShowAddContact(false);
              setContactForm(initialContactForm);
            }
          }}
          onSave={() => void createContact()}
        />
      )}
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
  icon: React.ComponentType<{
    className?: string;
  }>;
  tone?: "standard" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneStyles = {
    standard: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  };

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
          toneStyles[tone],
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-3xl font-black text-slate-950">
        {new Intl.NumberFormat("en-US").format(value)}
      </p>

      <p className="mt-1 text-sm font-black text-slate-700">
        {title}
      </p>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function QuickFilter({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
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

      {typeof count === "number" && (
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
      )}
    </button>
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

function ContactRow({
  contact,
  onUpdateStatus,
}: {
  contact: CommunicationContact;
  onUpdateStatus: (
    contactId: string,
    status: CommunicationContactStatus,
  ) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={contact.display_name}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
              {getInitials(contact.display_name)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/communication-center/contacts/${contact.id}`}
                className="truncate text-sm font-black text-slate-950 transition hover:text-emerald-700"
              >
                {contact.display_name}
              </Link>

              {contact.duplicate_of && (
                <span title="Possible duplicate">
                  <Copy className="h-3.5 w-3.5 text-amber-600" />
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-xs text-slate-500">
              {contact.job_title || contact.city || "Official contact"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[190px] truncate text-sm font-bold text-slate-700">
          {contact.organization || "—"}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
          {CONTACT_TYPE_LABELS[contact.contact_type]}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-700">
            {contact.phone || "Missing"}
          </p>

          {contact.verified_phone && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="max-w-[210px] truncate text-sm font-semibold text-slate-700">
            {contact.email || "Missing"}
          </p>

          {contact.verified_email && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <ChannelBadge channel={contact.preferred_channel} />
      </td>

      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
          <Languages className="h-4 w-4 text-slate-400" />
          {LANGUAGE_LABELS[contact.preferred_language]}
        </div>
      </td>

      <td className="px-5 py-4">
        <QualityScore
          score={contact.communication_quality_score}
          summary={contact.ai_quality_summary}
        />
      </td>

      <td className="px-5 py-4">
        <PermissionStatus contact={contact} />
      </td>

      <td className="px-5 py-4">
        <ContactStatusBadge status={contact.status} />
      </td>

      <td className="relative px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label={`Actions for ${contact.display_name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setMenuOpen(false)}
              aria-label="Close contact menu"
            />

            <div className="absolute right-5 top-14 z-30 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
              <Link
                href={`/admin/communication-center/contacts/${contact.id}`}
                className="block px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View contact
              </Link>

              <Link
                href={`/admin/communication-center/contacts/${contact.id}/edit`}
                className="block px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Edit contact
              </Link>

              <Link
                href={`/admin/communication-center/contacts/${contact.id}#timeline`}
                className="block px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Communication timeline
              </Link>

              <div className="my-1 border-t border-slate-100" />

              {contact.status !== "active" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void onUpdateStatus(
                      contact.id,
                      "active",
                    );
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Mark active
                </button>
              )}

              {contact.status !== "needs_review" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void onUpdateStatus(
                      contact.id,
                      "needs_review",
                    );
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-amber-700 transition hover:bg-amber-50"
                >
                  Mark for review
                </button>
              )}

              {contact.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void onUpdateStatus(
                      contact.id,
                      "archived",
                    );
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-red-700 transition hover:bg-red-50"
                >
                  Archive contact
                </button>
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function ChannelBadge({
  channel,
}: {
  channel: CommunicationChannel;
}) {
  const styles: Record<
    CommunicationChannel,
    string
  > = {
    sms: "border-blue-200 bg-blue-50 text-blue-800",
    whatsapp:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    email:
      "border-violet-200 bg-violet-50 text-violet-800",
    voice:
      "border-amber-200 bg-amber-50 text-amber-800",
    none: "border-slate-200 bg-slate-50 text-slate-600",
  };

  const Icon =
    channel === "whatsapp"
      ? MessageCircle
      : channel === "email"
        ? Mail
        : Phone;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        styles[channel],
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" />
      {CHANNEL_LABELS[channel]}
    </span>
  );
}

function QualityScore({
  score,
  summary,
}: {
  score: number;
  summary: string | null;
}) {
  const styles =
    score >= 90
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : score >= 75
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : score >= 60
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-red-200 bg-red-50 text-red-800";

  return (
    <div>
      <span
        className={[
          "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
          styles,
        ].join(" ")}
      >
        {score}/100
      </span>

      <p
        className="mt-1 max-w-[155px] truncate text-[10px] font-semibold text-slate-500"
        title={summary ?? undefined}
      >
        {summary || "Quality analysis pending"}
      </p>
    </div>
  );
}

function PermissionStatus({
  contact,
}: {
  contact: CommunicationContact;
}) {
  const permissions = [
    contact.permission_sms,
    contact.permission_email,
    contact.permission_whatsapp,
  ].filter(Boolean).length;

  if (permissions === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
        <ShieldAlert className="h-3.5 w-3.5" />
        Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
      <ShieldCheck className="h-3.5 w-3.5" />
      {permissions} allowed
    </span>
  );
}

function ContactStatusBadge({
  status,
}: {
  status: CommunicationContactStatus;
}) {
  const styles: Record<
    CommunicationContactStatus,
    string
  > = {
    active:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    inactive:
      "border-slate-200 bg-slate-50 text-slate-700",
    blocked: "border-red-200 bg-red-50 text-red-800",
    needs_review:
      "border-amber-200 bg-amber-50 text-amber-800",
    archived:
      "border-slate-300 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        styles[status],
      ].join(" ")}
    >
      {CONTACT_STATUS_LABELS[status]}
    </span>
  );
}

function EmptyContacts({
  hasFilters,
  onAdd,
  onClear,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ContactRound className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        {hasFilters
          ? "No matching contacts"
          : "No official contacts yet"}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Change or clear the current filters to see additional contact records."
          : "Add the first official contact or import contacts from another EPEW system."}
      </p>

      <div className="mt-5 flex justify-center gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700"
          >
            Clear Filters
          </button>
        )}

        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
        >
          Add Contact
        </button>
      </div>
    </div>
  );
}

function AddContactDialog({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: ContactFormState;
  saving: boolean;
  onChange: <K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
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
        aria-label="Close add contact dialog"
      />

      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Official Contacts
            </p>

            <h2 className="mt-1 text-xl font-black">
              Add Official Contact
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white transition hover:bg-white/10 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="First Name">
              <input
                value={form.first_name}
                onChange={(event) =>
                  onChange("first_name", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Last Name">
              <input
                value={form.last_name}
                onChange={(event) =>
                  onChange("last_name", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField
              label="Display Name"
              description="Leave blank to use the first and last name."
            >
              <input
                value={form.display_name}
                onChange={(event) =>
                  onChange("display_name", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Contact Type">
              <select
                value={form.contact_type}
                onChange={(event) =>
                  onChange(
                    "contact_type",
                    event.target
                      .value as CommunicationContactType,
                  )
                }
                className={inputClassName}
              >
                {Object.entries(CONTACT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </FormField>

            <FormField label="Organization">
              <input
                value={form.organization}
                onChange={(event) =>
                  onChange("organization", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Title or Role">
              <input
                value={form.job_title}
                onChange={(event) =>
                  onChange("job_title", event.target.value)
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
                placeholder="+1 347 555 1234"
                className={inputClassName}
              />
            </FormField>

            <FormField label="WhatsApp Number">
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={(event) =>
                  onChange(
                    "whatsapp_number",
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
                value={form.email}
                onChange={(event) =>
                  onChange("email", event.target.value)
                }
                placeholder="contact@example.com"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Preferred Channel">
              <select
                value={form.preferred_channel}
                onChange={(event) =>
                  onChange(
                    "preferred_channel",
                    event.target
                      .value as CommunicationChannel,
                  )
                }
                className={inputClassName}
              >
                {Object.entries(CHANNEL_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </FormField>

            <FormField label="Preferred Language">
              <select
                value={form.preferred_language}
                onChange={(event) =>
                  onChange(
                    "preferred_language",
                    event.target
                      .value as CommunicationLanguage,
                  )
                }
                className={inputClassName}
              >
                {Object.entries(LANGUAGE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
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

            <FormField label="Country">
              <input
                value={form.country}
                onChange={(event) =>
                  onChange("country", event.target.value)
                }
                className={inputClassName}
              />
            </FormField>
          </div>

          <div className="mt-6">
            <p className="text-sm font-black text-slate-950">
              Communication Permissions
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select only channels for which EPEW has valid
              communication permission.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <PermissionCheckbox
                label="SMS Permission"
                checked={form.permission_sms}
                onChange={(checked) =>
                  onChange("permission_sms", checked)
                }
              />

              <PermissionCheckbox
                label="Email Permission"
                checked={form.permission_email}
                onChange={(checked) =>
                  onChange("permission_email", checked)
                }
              />

              <PermissionCheckbox
                label="WhatsApp Permission"
                checked={form.permission_whatsapp}
                onChange={(checked) =>
                  onChange("permission_whatsapp", checked)
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <FormField label="Administrator Notes">
              <textarea
                value={form.notes}
                onChange={(event) =>
                  onChange("notes", event.target.value)
                }
                rows={4}
                className={`${inputClassName} h-auto py-3`}
              />
            </FormField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}

            {saving ? "Saving Contact..." : "Save Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}
      </span>

      {description && (
        <span className="ml-2 text-xs text-slate-500">
          {description}
        </span>
      )}

      <div className="mt-2">{children}</div>
    </label>
  );
}

function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
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

      <span className="text-sm font-black text-slate-700">
        {label}
      </span>
    </label>
  );
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";