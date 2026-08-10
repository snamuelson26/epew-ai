"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type AdminShellProps = {
  children: ReactNode;
  administratorEmail?: string | null;
};

export default function AdminShell({
  children,
  administratorEmail,
}: AdminShellProps) {
  const pathname = usePathname();

  const menuGroups = [
    {
      title: "Main",
      links: [{ name: "Dashboard", href: "/admin/dashboard" }],
    },
    {
      title: "People",
      links: [
        { name: "Entrepreneurs", href: "/admin/entrepreneurs" },
        { name: "Supporters", href: "/admin/supporters" },
        { name: "Users", href: "/admin/users" },
        { name: "Coach Candidates", href: "/admin/coach-candidates" },
        { name: "Partner Candidates", href: "/admin/partner-candidates" },
        { name: "Partners", href: "/admin/partners" },
      ],
    },
    {
      title: "Funding",
      links: [
        { name: "Funding Readiness", href: "/admin/funding-readiness" },
        { name: "Funding Queue", href: "/admin/funding-queue" },
        { name: "Funding Calendar", href: "/admin/funding-calendar" },
        { name: "Funding Committee", href: "/admin/funding-committee" },
        {
          name: "Funding Allocation Center",
          href: "/admin/funding-allocation",
        },
        {
          name: "Disbursement Center",
          href: "/admin/disbursement-center",
        },
        { name: "Finance", href: "/admin/finance" },
        { name: "Transactions", href: "/admin/transactions" },
        { name: "Funded Businesses", href: "/admin/funded-businesses" },
      ],
    },
    {
      title: "Operations",
      links: [
        { name: "Marketplace", href: "/admin/marketplace" },
        { name: "ETVMC", href: "/admin/etvmc" },
        { name: "Vendors", href: "/admin/vendors" },
        { name: "Documents", href: "/admin/documents" },
        { name: "Annual Meetings", href: "/admin/annual-meetings" },
        { name: "Business Openings", href: "/admin/business-openings" },
        {
          name: "Business Intelligence Center",
          href: "/admin/daily-transactions",
        },
        {
          name: "Quarterly Reporting",
          href: "/admin/quarterly-reporting",
        },
        {
          name: "Business Categories",
          href: "/admin/business-categories",
        },
      ],
    },
    {
      title: "Monitoring",
      links: [
        { name: "Analytics", href: "/admin/analytics" },
        {
          name: "Ecosystem Dashboard",
          href: "/admin/ecosystem-dashboard",
        },
        { name: "Audit Center", href: "/admin/audit-center" },
        { name: "Activity Logs", href: "/admin/activity-logs" },
        { name: "Compliance", href: "/admin/compliance" },
        { name: "Reports", href: "/admin/reports" },
      ],
    },
    {
      title: "Communication",
      links: [
        { name: "Messages", href: "/admin/messages" },
        { name: "Notifications", href: "/admin/notifications" },
        { name: "Support Tickets", href: "/admin/support-tickets" },
      ],
    },
    {
      title: "System",
      links: [
        { name: "Settings", href: "/admin/settings" },
        {
          name: "Automation Center",
          href: "/admin/automation-center",
        },
        { name: "AI Admin", href: "/admin/ai-admin" },
        {
          name: "Automation Engine",
          href: "/admin/automation-engine",
        },
      ],
    },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <aside className="sticky top-0 h-screen w-80 flex-none overflow-y-auto bg-[#06245c] p-6 text-white">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold">EPEW</h1>

          <p className="mt-1 text-sm text-blue-100">
            Admin Control Center
          </p>
          <form action="/admin/logout" method="post" className="mt-6">
  <button
    type="submit"
    className="w-full rounded-xl border border-blue-300 px-4 py-3 text-left font-bold text-white transition hover:bg-blue-800"
  >
    Log Out
  </button>
</form>

          {administratorEmail ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Signed in as
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-white">
                {administratorEmail}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="space-y-8">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-200">
                {group.title}
              </h2>

              <div className="space-y-2">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-xl px-4 py-3 font-bold transition ${
                      isActive(link.href)
                        ? "bg-white text-[#06245c]"
                        : "text-blue-50 hover:bg-blue-800"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <section className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
        {children}
      </section>
    </div>
  );
}
