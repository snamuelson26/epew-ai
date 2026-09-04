"use client";

import { useEffect, useState } from "react";

export type EpewLanguage = "en" | "ht" | "fr" | "es";

const STORAGE_KEY = "epew-language";
const EVENT_NAME = "epew-language-change";

export const languageNames: Record<EpewLanguage, string> = {
  en: "English",
  ht: "Kreyòl Ayisyen",
  fr: "Français",
  es: "Español",
};

function normalizeLanguage(value: string | null): EpewLanguage {
  return value === "ht" || value === "fr" || value === "es" ? value : "en";
}

export function useEpewLanguage() {
  const [language, setLanguageState] = useState<EpewLanguage>("en");

  useEffect(() => {
    setLanguageState(normalizeLanguage(window.localStorage.getItem(STORAGE_KEY)));

    const sync = () =>
      setLanguageState(normalizeLanguage(window.localStorage.getItem(STORAGE_KEY)));

    window.addEventListener("storage", sync);
    window.addEventListener(EVENT_NAME, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  function setLanguage(next: EpewLanguage) {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "ht" ? "ht" : next;
    setLanguageState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  return { language, setLanguage };
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
