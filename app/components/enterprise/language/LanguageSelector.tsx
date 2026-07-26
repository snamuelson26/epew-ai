"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * LanguageSelector.tsx
 *
 * Enterprise language selector.
 *
 * Features
 * ----------
 * ✓ Accessible
 * ✓ Keyboard navigation
 * ✓ Responsive
 * ✓ Uses LanguageProvider
 * ✓ Works everywhere
 */

import { useMemo, useState } from "react";

import { useLocale } from "./useLanguage";

import type { SupportedLocale } from "./LocaleTypes";

export interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  showNativeName?: boolean;
  showEnglishName?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function LanguageSelector({
  className = "",
  showLabel = true,
  showNativeName = true,
  showEnglishName = false,
  compact = false,
  disabled = false,
}: LanguageSelectorProps) {
  const {
    locale,
    language,
    languages,
    setLocale,
  } = useLocale();

  const [loading, setLoading] =
    useState(false);

  const sortedLanguages = useMemo(
  () =>
    [...languages].sort((a, b) =>
      a.nativeName.localeCompare(b.nativeName),
    ),
  [languages],
);

  async function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextLocale =
      event.target.value as SupportedLocale;

    if (
      nextLocale === locale ||
      loading
    ) {
      return;
    }

    try {
      setLoading(true);

      await setLocale(nextLocale, {
        source: "manual",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={[
        "flex items-center gap-2",
        className,
      ].join(" ")}
    >
      {showLabel && (
        <label
          htmlFor="epew-language-selector"
          className="text-sm font-medium"
        >
          🌐
        </label>
      )}

      <select
        id="epew-language-selector"
        disabled={
          disabled || loading
        }
        value={locale}
        onChange={handleChange}
        className={[
          "rounded-md",
          "border",
          "border-gray-300",
          "bg-white",
          "px-3",
          compact
            ? "py-1 text-sm"
            : "py-2 text-sm",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-green-600",
          "disabled:opacity-60",
        ].join(" ")}
      >
        {sortedLanguages.map((item) => {
  let label = "";

  if (showNativeName) {
    label = item.nativeName;
  }

  if (showEnglishName) {
    label +=
      label.length > 0
        ? ` (${item.name})`
        : item.name;
  }

  return (
    <option
      key={item.code}
      value={item.code}
    >
      {item.flag} {label}
    </option>
  );
})}
      </select>

      {!compact && (
        <span className="text-xs text-gray-500">
          {language.nativeName}
        </span>
      )}
    </div>
  );
}

export default LanguageSelector;