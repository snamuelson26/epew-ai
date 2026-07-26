"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  ChevronLeft,
  ContactRound,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MessagesSquare,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin/communication-center",
    icon: LayoutDashboard,
  },
  {
    label: "Official Contacts",
    href: "/admin/communication-center/contacts",
    icon: ContactRound,
  },
  {
    label: "Organizations & Churches",
    href: "/admin/communication-center/entities",
    icon: Building2,
  },
  {
    label: "Groups",
    href: "/admin/communication-center/groups",
    icon: UsersRound,
  },
  {
    label: "Campaigns",
    href: "/admin/communication-center/campaigns",
    icon: FolderKanban,
  },
  {
    label: "SMS",
    href: "/admin/communication-center/sms",
    icon: MessagesSquare,
  },
  {
    label: "WhatsApp",
    href: "/admin/communication-center/whatsapp",
    icon: MessageCircle,
  },
  {
    label: "Email",
    href: "/admin/communication-center/email",
    icon: Mail,
  },
  {
    label: "Templates",
    href: "/admin/communication-center/templates",
    icon: FileText,
  },
  {
    label: "AI Assistant",
    href: "/admin/communication-center/assistant",
    icon: Bot,
  },
  {
    label: "History",
    href: "/admin/communication-center/history",
    icon: History,
  },
  {
    label: "Analytics",
    href: "/admin/communication-center/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/communication-center/settings",
    icon: Settings,
  },
];

function isNavigationItemActive(
  pathname: string,
  href: string,
) {
  if (href === "/admin/communication-center") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function CommunicationCenterLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-18 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
              aria-label="Open communication navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-amber-400 shadow-sm">
              <MessagesSquare className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                EPEW-EDE-IBOS
              </p>

              <h1 className="text-base font-black text-slate-950 sm:text-lg">
                Communication Center
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              Public Preview
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Communication systems operational
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={[
            "sticky top-18 hidden h-[calc(100vh-4.5rem)] shrink-0 border-r border-slate-200 bg-white transition-all duration-300 lg:block",
            sidebarCollapsed ? "w-22" : "w-72",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-100 p-4">
              <div
                className={[
                  "rounded-2xl bg-slate-950 text-white",
                  sidebarCollapsed ? "p-3" : "p-4",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex items-center",
                    sidebarCollapsed
                      ? "justify-center"
                      : "justify-between gap-3",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex items-center",
                      sidebarCollapsed ? "" : "gap-3",
                    ].join(" ")}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                      <Bot className="h-5 w-5" />
                    </div>

                    {!sidebarCollapsed && (
                      <div>
                        <p className="text-sm font-black">
                          Communication Assistant
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Assistantmanagement layer
                        </p>
                      </div>
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <Activity className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navigationItems.map((item) => {
                const active = isNavigationItemActive(
                  pathname,
                  item.href,
                );

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={
                      sidebarCollapsed
                        ? item.label
                        : undefined
                    }
                    className={[
                      "group flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition",
                      sidebarCollapsed
                        ? "justify-center"
                        : "gap-3",
                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-5 w-5 shrink-0",
                        active
                          ? "text-emerald-700"
                          : "text-slate-400 group-hover:text-slate-700",
                      ].join(" ")}
                    />

                    {!sidebarCollapsed && (
                      <span>{item.label}</span>
                    )}

                    {item.label === "AI Assistant" &&
                      !sidebarCollapsed && (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800">
                          AI
                        </span>
                      )}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() =>
                  setSidebarCollapsed(
                    (current) => !current,
                  )
                }
                className={[
                  "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950",
                  sidebarCollapsed
                    ? "justify-center"
                    : "gap-3",
                ].join(" ")}
              >
                <ChevronLeft
                  className={[
                    "h-5 w-5 transition-transform",
                    sidebarCollapsed
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />

                {!sidebarCollapsed && (
                  <span>Collapse Navigation</span>
                )}
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation overlay"
            />

            <aside className="relative h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    EPEW-EDE-IBOS
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    Communication Center
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                  aria-label="Close communication navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4">
                <Link
                  href="/admin/communication-center/assistant"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Bot className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      EPEW Communication Assistant
                    </p>

                    <p className="text-xs text-slate-400">
                      Assistant communication management
                    </p>
                  </div>
                </Link>

                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const active =
                      isNavigationItemActive(
                        pathname,
                        item.href,
                      );

                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setMobileMenuOpen(false)
                        }
                        className={[
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition",
                          active
                            ? "bg-emerald-50 text-emerald-800"
                            : "text-slate-600 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>

                        {item.label ===
                          "AI Assistant" && (
                          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800">
                            AI
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}