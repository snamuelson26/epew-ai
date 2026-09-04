"use client";

import { useLocale } from "@/app/components/enterprise/language";

export type EpewLanguage = "en" | "ht" | "fr" | "es";

export const languageNames: Record<EpewLanguage, string> = {
  en: "English",
  ht: "Kreyòl Ayisyen",
  fr: "Français",
  es: "Español",
};

export function useEpewLanguage() {
  const { locale, setLocale } = useLocale();

  function setLanguage(next: EpewLanguage) {
    void setLocale(next);
  }

  return {
    language: locale as EpewLanguage,
    setLanguage,
  };
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useEpewLanguage();

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as EpewLanguage)}
        className="w-full rounded-xl border border-white/30 bg-white px-3 py-2 font-bold text-[#06245c] shadow-sm"
      >
        {(Object.keys(languageNames) as EpewLanguage[]).map((code) => (
          <option key={code} value={code}>
            {languageNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
