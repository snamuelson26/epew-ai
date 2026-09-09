"use client";

import Link from "next/link";

export default function EntrepreneurCommunicationAccess() {
  return (
    <div className="sticky top-0 z-[90] border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 pr-24 sm:pr-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Personal Communication Secretary
          </p>
          <p className="text-sm font-semibold text-slate-600">
            Manage prospective supporters, messages, languages, and automatic follow-ups from your portal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/entrepreneurs/communication"
            className="inline-flex items-center justify-center rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
          >
            ✉️ Communication Center
          </Link>
          <Link
            href="/entrepreneurs/supporters"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-green-800"
          >
            👥 Potential Supporters
          </Link>
        </div>
      </div>
    </div>
  );
}
