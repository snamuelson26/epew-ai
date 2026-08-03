"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * TranslatedText.tsx
 *
 * Safe reusable translation wrapper.
 *
 * Features
 * ------------------------------------------------------------
 * ✓ Uses the existing LanguageProvider
 * ✓ Supports translation keys
 * ✓ Supports fallback English text
 * ✓ Supports variables
 * ✓ Prevents blank text
 * ✓ Prevents visible missing keys
 */

import type { ReactNode } from "react";

import { useTranslation } from "./useLanguage";

import type {
  TranslationVariables,
} from "./LocaleTypes";

export interface TranslatedTextProps {
  /**
   * Complete translation key.
   *
   * Example:
   * navigation.home
   */
  id: string;

  /**
   * English fallback text.
   *
   * This will be displayed when the translation
   * has not yet been added to the selected language.
   */
  fallback: string;

  /**
   * Optional translation variables.
   *
   * Example:
   * { name: "Nelson" }
   */
  variables?: TranslationVariables;

  /**
   * Optional wrapper element.
   *
   * Default: span
   */
  as?:
    | "span"
    | "p"
    | "div"
    | "strong"
    | "small"
    | "label";

  /**
   * Optional CSS classes.
   */
  className?: string;

  /**
   * Optional content displayed while the
   * language engine is loading.
   */
  loadingFallback?: ReactNode;
}

export function TranslatedText({
  id,
  fallback,
  variables,
  as: Component = "span",
  className = "",
  loadingFallback,
}: TranslatedTextProps) {
  const {
    t,
    isLoading,
    isReady,
  } = useTranslation();

  if (
    isLoading &&
    !isReady &&
    loadingFallback !== undefined
  ) {
    return (
      <Component className={className}>
        {loadingFallback}
      </Component>
    );
  }

  const translatedValue = t(id, {
    variables,
    defaultValue: fallback,
  });

  const safeValue =
    translatedValue &&
    translatedValue.trim() !== "" &&
    translatedValue !== id
      ? translatedValue
      : fallback;

  return (
    <Component className={className}>
      {safeValue}
    </Component>
  );
}

/**
 * Compact alias.
 *
 * Example:
 *
 * <T
 *   id="navigation.home"
 *   fallback="Home"
 * />
 */
export const T = TranslatedText;

export default TranslatedText;