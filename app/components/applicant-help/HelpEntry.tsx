"use client";
import Link from "next/link";
import { useLocale } from "@/app/components/enterprise/language";
import { helpCopy } from "@/lib/applicant-help/copy";
export default function HelpEntry() {
  const { locale } = useLocale();
  return <aside className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-950"><Link href="/entrepreneurs/help" className="font-bold underline underline-offset-4">{helpCopy[locale].entry}</Link></aside>;
}
