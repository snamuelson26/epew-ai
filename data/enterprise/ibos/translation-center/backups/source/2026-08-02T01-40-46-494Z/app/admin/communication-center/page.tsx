"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ContactRound,
  CopyCheck,
  FileText,
  FolderKanban,
  History,
  Languages,
  Mail,
  MessageCircle,
  MessagesSquare,
  MousePointerClick,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRoundX,
  UsersRound,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type ChannelStatus = "Operational" | "Setup Required" | "Attention";

type CommunicationChannel = {
  name: string;
  description: string;
  count: number;
  status: ChannelStatus;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

type Recommendation = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  priority: "High" | "Medium" | "Low";
  icon: React.ComponentType<{
    className?: string;
  }>;
};

type ScheduledCampaign = {
  id: string;
  name: string;
  audience: string;
  channel: "SMS" | "WhatsApp" | "Email";
  sendTime: string;
  recipients: number;
  status: "Awaiting Approval" | "Scheduled" | "Draft";
};

type RecentActivity = {
  id: string;
  description: string;
  time: string;
  status: "success" | "warning" | "neutral";
};

const communicationChannels: CommunicationChannel[] = [
  {
    name: "SMS Contacts",
    description: "Twilio-ready mobile contacts",
    count: 1248,
    status: "Operational",
    href: "/admin/communication-center/sms",
    icon: MessagesSquare,
  },
  {
    name: "WhatsApp Contacts",
    description: "WhatsApp-capable contacts",
    count: 884,
    status: "Setup Required",
    href: "/admin/communication-center/whatsapp",
    icon: MessageCircle,
  },
  {
    name: "Email Contacts",
    description: "Validated email recipients",
    count: 1936,
    status: "Operational",
    href: "/admin/communication-center/email",
    icon: Mail,
  },
  {
    name: "Official Contacts",
    description: "Master communication database",
    count: 2284,
    status: "Attention",
    href: "/admin/communication-center/contacts",
    icon: ContactRound,
  },
];

const recommendations: Recommendation[] = [
  {
    id: "public-preview",
    title: "Public Preview campaign is ready",
    description:
      "Prepare the official launch announcement for eligible community leaders, business owners, personal contacts, and partner organizations.",
    actionLabel: "Review campaign",
    href: "/admin/communication-center/campaigns/public-preview",
    priority: "High",
    icon: Send,
  },
  {
    id: "duplicate-review",
    title: "92 duplicate phone numbers detected",
    description:
      "Review duplicate contacts before preparing the next mass campaign.",
    actionLabel: "Review duplicates",
    href: "/admin/communication-center/contacts?filter=duplicates",
    priority: "High",
    icon: CopyCheck,
  },
  {
    id: "permission-review",
    title: "36 contacts require permission review",
    description:
      "Confirm messaging authorization before including these contacts in outbound campaigns.",
    actionLabel: "Review permissions",
    href: "/admin/communication-center/contacts?filter=permission-review",
    priority: "Medium",
    icon: ShieldCheck,
  },
  {
    id: "registration-follow-up",
    title: "Prepare registration follow-up",
    description:
      "Create a reminder for contacts who clicked the Public Preview link but did not begin registration.",
    actionLabel: "Prepare follow-up",
    href: "/admin/communication-center/assistant?command=registration-follow-up",
    priority: "Medium",
    icon: MousePointerClick,
  },
];

const scheduledCampaigns: ScheduledCampaign[] = [
  {
    id: "campaign-001",
    name: "Public Preview Announcement",
    audience: "Community Leaders and Business Owners",
    channel: "SMS",
    sendTime: "Today at 7:00 PM",
    recipients: 642,
    status: "Awaiting Approval",
  },
  {
    id: "campaign-002",
    name: "Public Preview WhatsApp Follow-Up",
    audience: "WhatsApp-ready launch contacts",
    channel: "WhatsApp",
    sendTime: "Tomorrow at 10:00 AM",
    recipients: 418,
    status: "Draft",
  },
  {
    id: "campaign-003",
    name: "Entrepreneur Registration Reminder",
    audience: "Incomplete entrepreneur registrations",
    channel: "Email",
    sendTime: "Friday at 6:30 PM",
    recipients: 87,
    status: "Scheduled",
  },
];

const recentActivity: RecentActivity[] = [
  {
    id: "activity-001",
    description: "27 duplicate contact records were excluded.",
    time: "18 minutes ago",
    status: "success",
  },
  {
    id: "activity-002",
    description: "14 invalid mobile numbers require correction.",
    time: "34 minutes ago",
    status: "warning",
  },
  {
    id: "activity-003",
    description: "Public Preview SMS draft was generated.",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: "activity-004",
    description: "WhatsApp Business connection is not yet active.",
    time: "2 hours ago",
    status: "warning",
  },
  {
    id: "activity-005",
    description: "Email contact validation completed successfully.",
    time: "Today at 1:42 PM",
    status: "neutral",
  },
];

const quickActions = [
  {
    label: "Prepare Launch Campaign",
    description: "Build a complete multichannel launch campaign.",
    href: "/admin/communication-center/assistant?command=prepare-launch",
    icon: WandSparkles,
  },
  {
    label: "Review Contact List",
    description: "Inspect the official contact database.",
    href: "/admin/communication-center/contacts",
    icon: ContactRound,
  },
  {
    label: "Find Missing Phone Numbers",
    description: "Locate records without mobile numbers.",
    href: "/admin/communication-center/contacts?filter=missing-phone",
    icon: Search,
  },
  {
    label: "Remove Duplicates",
    description: "Review and merge duplicate records.",
    href: "/admin/communication-center/contacts?filter=duplicates",
    icon: CopyCheck,
  },
  {
    label: "Translate Message",
    description: "Prepare multilingual campaign versions.",
    href: "/admin/communication-center/assistant?command=translate",
    icon: Languages,
  },
  {
    label: "Shorten for SMS",
    description: "Reduce message segments and estimated cost.",
    href: "/admin/communication-center/assistant?command=shorten-sms",
    icon: MessagesSquare,
  },
  {
    label: "Create WhatsApp Version",
    description: "Convert a campaign for WhatsApp.",
    href: "/admin/communication-center/assistant?command=whatsapp-version",
    icon: MessageCircle,
  },
  {
    label: "Create Email Version",
    description: "Prepare a complete email campaign.",
    href: "/admin/communication-center/assistant?command=email-version",
    icon: Mail,
  },
  {
    label: "Schedule Follow-Up",
    description: "Prepare a follow-up sequence for approval.",
    href: "/admin/communication-center/assistant?command=schedule-follow-up",
    icon: CalendarClock,
  },
  {
    label: "Analyze Campaign Results",
    description: "Review delivery, clicks, and registrations.",
    href: "/admin/communication-center/analytics",
    icon: BarChart3,
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getChannelStatusStyles(status: ChannelStatus) {
  switch (status) {
    case "Operational":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "Attention":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "Setup Required":
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPriorityStyles(priority: Recommendation["priority"]) {
  switch (priority) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";

    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Low":
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getCampaignStatusStyles(status: ScheduledCampaign["status"]) {
  switch (status) {
    case "Awaiting Approval":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "Scheduled":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "Draft":
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getChannelIcon(channel: ScheduledCampaign["channel"]) {
  switch (channel) {
    case "SMS":
      return MessagesSquare;

    case "WhatsApp":
      return MessageCircle;

    case "Email":
      return Mail;
  }
}

export default function CommunicationCenterDashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const dashboardMetrics = useMemo(
    () => ({
      officialContacts: 2284,
      eligibleRecipients: 1248,
      activeCampaigns: 4,
      scheduledMessages: 3,
      deliveryRate: 96.8,
      permissionReview: 36,
      duplicates: 92,
      invalidRecords: 14,
    }),
    [],
  );

  function handleRefresh() {
    setRefreshing(true);

    window.setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] p-4 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10 xl:px-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-8 xl:flex-row xl:items-center">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Enterprise Communication Management
            </div>

            <h2 className="max-w-4xl text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
              EPEW Communication Center
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Manage official contacts, communication channels,
              campaigns, scheduling, message quality, delivery,
              follow-up, and results from one intelligent enterprise
              workspace.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Administrator approval required
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                <MessagesSquare className="h-4 w-4 text-amber-300" />
                SMS
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                <MessageCircle className="h-4 w-4 text-emerald-300" />
                WhatsApp
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                <Mail className="h-4 w-4 text-sky-300" />
                Email
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row xl:max-w-none xl:justify-end">
            <Link
              href="/admin/communication-center/assistant"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
            >
              <Bot className="h-5 w-5" />
              Open AI Assistant
            </Link>

            <Link
              href="/admin/communication-center/campaigns/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              <Plus className="h-5 w-5" />
              New Campaign
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Official Contacts"
          value={formatNumber(dashboardMetrics.officialContacts)}
          subtitle="Master contact database"
          icon={UsersRound}
          href="/admin/communication-center/contacts"
        />

        <MetricCard
          title="Eligible SMS Contacts"
          value={formatNumber(dashboardMetrics.eligibleRecipients)}
          subtitle="Ready for authorized campaigns"
          icon={UserCheck}
          href="/admin/communication-center/sms"
        />

        <MetricCard
          title="Active Campaigns"
          value={formatNumber(dashboardMetrics.activeCampaigns)}
          subtitle="Draft, approval, or sending"
          icon={FolderKanban}
          href="/admin/communication-center/campaigns"
        />

        <MetricCard
          title="Delivery Rate"
          value={`${dashboardMetrics.deliveryRate}%`}
          subtitle="Current combined delivery rate"
          icon={Activity}
          href="/admin/communication-center/analytics"
        />
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.45fr_0.75fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-900 p-6 text-white sm:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black">
                      EPEW Communication Assistant
                    </h3>

                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      AI Management Layer
                    </span>
                  </div>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    Prepare campaigns, organize audiences, check
                    permissions, identify duplicates, draft
                    multilingual messages, estimate cost, and submit
                    everything for administrator approval.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/communication-center/assistant"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                Open Assistant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.82fr] sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Today&apos;s Recommendation
              </p>

              <h4 className="mt-2 text-2xl font-black text-slate-950">
                Public Preview campaign is ready.
              </h4>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The assistant has prepared the initial audience
                analysis and identified records requiring exclusion
                or administrator review.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <AssistantMetric
                  label="Eligible SMS contacts"
                  value="1,248"
                  icon={UserCheck}
                  status="success"
                />

                <AssistantMetric
                  label="Duplicate numbers excluded"
                  value="92"
                  icon={CopyCheck}
                  status="warning"
                />

                <AssistantMetric
                  label="Permission review"
                  value="36"
                  icon={ShieldCheck}
                  status="warning"
                />

                <AssistantMetric
                  label="Invalid numbers"
                  value="14"
                  icon={UserRoundX}
                  status="danger"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-950">
                Campaign Preparation
              </p>

              <div className="mt-5 space-y-4">
                <CampaignPreparationRow
                  label="Recommended channel"
                  value="SMS first"
                  icon={MessagesSquare}
                />

                <CampaignPreparationRow
                  label="Follow-up channel"
                  value="WhatsApp"
                  icon={MessageCircle}
                />

                <CampaignPreparationRow
                  label="Recommended send time"
                  value="7:00 PM"
                  icon={Clock3}
                />

                <CampaignPreparationRow
                  label="Estimated Twilio cost"
                  value="Pending live rate"
                  icon={CircleDollarSign}
                />
              </div>

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                  <div>
                    <p className="text-sm font-black text-amber-950">
                      Final approval required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      No mass campaign may be sent or scheduled until
                      an authorized administrator approves it.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/communication-center/assistant?command=prepare-public-preview"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <WandSparkles className="h-4 w-4" />
                Prepare Public Preview Campaign
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Contact Readiness
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-950">
                Database Quality
              </h3>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Refresh communication dashboard"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  refreshing ? "animate-spin" : "",
                ].join(" ")}
              />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <ReadinessRow
              label="Campaign eligible"
              value={dashboardMetrics.eligibleRecipients}
              total={dashboardMetrics.officialContacts}
              status="success"
            />

            <ReadinessRow
              label="Permission review"
              value={dashboardMetrics.permissionReview}
              total={dashboardMetrics.officialContacts}
              status="warning"
            />

            <ReadinessRow
              label="Duplicate records"
              value={dashboardMetrics.duplicates}
              total={dashboardMetrics.officialContacts}
              status="warning"
            />

            <ReadinessRow
              label="Invalid records"
              value={dashboardMetrics.invalidRecords}
              total={dashboardMetrics.officialContacts}
              status="danger"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/admin/communication-center/contacts?filter=duplicates"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Review duplicate records
              <ChevronRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/communication-center/contacts?filter=incomplete"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Review incomplete records
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Communication Channels
            </p>

            <h3 className="mt-1 text-2xl font-black text-slate-950">
              Channel Overview
            </h3>
          </div>

          <Link
            href="/admin/communication-center/settings"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-700 transition hover:text-slate-950"
          >
            Manage connections
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {communicationChannels.map((channel) => {
            const Icon = channel.icon;

            return (
              <Link
                key={channel.name}
                href={channel.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span
                    className={[
                      "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                      getChannelStatusStyles(channel.status),
                    ].join(" ")}
                  >
                    {channel.status}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-black text-slate-950">
                  {formatNumber(channel.count)}
                </p>

                <h4 className="mt-2 text-sm font-black text-slate-950">
                  {channel.name}
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {channel.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs font-black text-emerald-700">
                  Manage channel
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                AI Guidance
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-950">
                Today&apos;s Recommendations
              </h3>
            </div>

            <Link
              href="/admin/communication-center/assistant"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-700 transition hover:text-slate-950"
            >
              Ask Assistant
              <Bot className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 divide-y divide-slate-200">
            {recommendations.map((recommendation) => {
              const Icon = recommendation.icon;

              return (
                <div
                  key={recommendation.id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-slate-950">
                          {recommendation.title}
                        </h4>

                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase",
                            getPriorityStyles(
                              recommendation.priority,
                            ),
                          ].join(" ")}
                        >
                          {recommendation.priority}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {recommendation.description}
                      </p>
                    </div>

                    <Link
                      href={recommendation.href}
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-emerald-700 transition hover:text-emerald-900"
                    >
                      {recommendation.actionLabel}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Communication Activity
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              Today&apos;s Activity
            </h3>
          </div>

          <div className="mt-6 space-y-5">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3"
              >
                <ActivityStatusIcon status={activity.status} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-5 text-slate-800">
                    {activity.description}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/communication-center/history"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            View Communication History
            <History className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Administrator Tools
            </p>

            <h3 className="mt-1 text-2xl font-black text-slate-950">
              Quick Actions
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Start common communication-management tasks directly
              from the dashboard.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.label}
                href={action.href}
                className="group rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-emerald-100 group-hover:text-emerald-800">
                  <Icon className="h-5 w-5" />
                </div>

                <h4 className="mt-4 text-sm font-black text-slate-950">
                  {action.label}
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Approval Queue
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              Scheduled and Pending Campaigns
            </h3>
          </div>

          <Link
            href="/admin/communication-center/campaigns"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-700 transition hover:text-slate-950"
          >
            View all campaigns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Campaign
                </th>

                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Audience
                </th>

                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Channel
                </th>

                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Recipients
                </th>

                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Send Time
                </th>

                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {scheduledCampaigns.map((campaign) => {
                const ChannelIcon = getChannelIcon(
                  campaign.channel,
                );

                return (
                  <tr
                    key={campaign.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-950">
                        {campaign.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {campaign.id.toUpperCase()}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                      {campaign.audience}
                    </td>

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                        <ChannelIcon className="h-4 w-4" />
                        {campaign.channel}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-black text-slate-950">
                      {formatNumber(campaign.recipients)}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                      {campaign.sendTime}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                          getCampaignStatusStyles(
                            campaign.status,
                          ),
                        ].join(" ")}
                      >
                        {campaign.status}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/communication-center/campaigns/${campaign.id}`}
                        className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 transition hover:text-emerald-900"
                      >
                        Review
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                Enterprise Approval Rule
              </p>

              <h3 className="mt-2 text-xl font-black">
                The assistant prepares. The administrator approves.
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                The EPEW Communication Assistant may organize
                contacts, recommend audiences, prepare messages,
                translate content, estimate cost, schedule drafts,
                and analyze results. It may not independently send a
                mass campaign.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ApprovalStep number="1" label="Objective received" />
            <ApprovalStep number="2" label="Campaign prepared" />
            <ApprovalStep number="3" label="Administrator review" />
            <ApprovalStep number="4" label="Approved send" />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <BellRing className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">
                Scheduled Messages
              </p>

              <p className="text-xs text-slate-500">
                Approved future communication
              </p>
            </div>

            <p className="ml-auto text-3xl font-black text-slate-950">
              {dashboardMetrics.scheduledMessages}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Next approved send
                </p>

                <p className="mt-1 text-sm font-black text-slate-950">
                  Entrepreneur Registration Reminder
                </p>
              </div>

              <CalendarClock className="h-5 w-5 text-slate-500" />
            </div>

            <p className="mt-3 text-xs font-bold text-emerald-700">
              Friday at 6:30 PM
            </p>
          </div>

          <Link
            href="/admin/communication-center/campaigns?filter=scheduled"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Manage Scheduled Messages
          </Link>
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-200 py-6">
        <div className="flex flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p className="font-semibold">
            EPEW-EDE-IBOS Enterprise Communication Center
          </p>

          <p>
            SMS · WhatsApp · Email · Contact Management · AI
            Assistance
          </p>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-emerald-100 group-hover:text-emerald-800">
          <Icon className="h-5 w-5" />
        </div>

        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600" />
      </div>

      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-black text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Link>
  );
}

function AssistantMetric({
  label,
  value,
  icon: Icon,
  status,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  status: "success" | "warning" | "danger";
}) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[status]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />

        <p className="text-xs font-bold">{label}</p>
      </div>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function CampaignPreparationRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-black text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function ReadinessRow({
  label,
  value,
  total,
  status,
}: {
  label: string;
  value: number;
  total: number;
  status: "success" | "warning" | "danger";
}) {
  const percentage = Math.min(
    100,
    Math.max(0, (value / total) * 100),
  );

  const barStyles = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-700">{label}</p>

        <p className="text-sm font-black text-slate-950">
          {formatNumber(value)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barStyles[status]}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function ActivityStatusIcon({
  status,
}: {
  status: RecentActivity["status"];
}) {
  if (status === "success") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }

  if (status === "warning") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
      <Activity className="h-4 w-4" />
    </div>
  );
}

function ApprovalStep({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-slate-950">
        {number}
      </div>

      <p className="mt-3 text-sm font-black text-white">{label}</p>
    </div>
  );
}