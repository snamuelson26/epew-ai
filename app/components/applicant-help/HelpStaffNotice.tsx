"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/app/components/enterprise/language";
import { helpCopy } from "@/lib/applicant-help/copy";
export default function HelpStaffNotice({ coach = false }: { coach?: boolean }) {
 const [counts, setCounts] = useState({ open: 0, overdue: 0 });
 const { locale } = useLocale(); const t = helpCopy[locale];
 useEffect(() => {
  let active = true;
  async function load() {
   try {
    const r = await fetch("/api/entrepreneurs/help?scope=staff", { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    if (active) setCounts({ open: data.cases.filter((c: { status: string }) => c.status !== "resolved").length, overdue: data.cases.filter((c: { overdue: boolean }) => c.overdue).length });
   } catch { /* Existing dashboards remain available when help is offline. */ }
  }
  void load();
  const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
  return () => { active = false; clearInterval(timer); };
 }, []);
 if (!counts.open) return null;
 return <aside aria-live="polite" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><Link href={coach ? "/coaches/applicant-help" : "/admin/applicant-help"} className="font-bold underline">{t.staffTitle}: {counts.open} · {t.dueCount}: {counts.overdue}</Link></aside>;
}
