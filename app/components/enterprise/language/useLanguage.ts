"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * useLanguage.ts
 *
 * React hooks for accessing the enterprise language context.
 *
 * Provides:
 * - useLanguage()
 * - useTranslation()
 * - useLocale()
 * - useLanguageFormatting()
 * - useLanguageNamespaces()
 */

import {
  useContext,
  useMemo,
} from "react";

import {
  LanguageContext,
  type ExtendedLanguageContextValue,
} from "./LanguageContext";

import type {
  SupportedLocale,
  TranslationLookupOptions,
  TranslationVariables,
} from "./LocaleTypes";

/**
 * ============================================================
 * Public Types
 * ============================================================
 */

export type TranslationFunction = (
  key: string,
  variablesOrOptions?:
    | TranslationVariables
    | TranslationLookupOptions,
) => string;

export interface UseTranslationResult {
  t: TranslationFunction;
  locale: SupportedLocale;
  isLoading: boolean;
  isReady: boolean;
}

export interface UseLocaleResult {
  locale: SupportedLocale;
  language:
    ExtendedLanguageContextValue["language"];
  languages:
    ExtendedLanguageContextValue["languages"];
  setLocale:
    ExtendedLanguageContextValue["setLocale"];
}

export interface UseLanguageFormattingResult {
  formatDate:
    ExtendedLanguageContextValue["formatDate"];
  formatNumber:
    ExtendedLanguageContextValue["formatNumber"];
  formatCurrency:
    ExtendedLanguageContextValue["formatCurrency"];
}

export interface UseLanguageNamespacesResult {
  namespaces:
    ExtendedLanguageContextValue["namespaces"];
  loadNamespaces:
    ExtendedLanguageContextValue["loadNamespaces"];
  reloadTranslations:
    ExtendedLanguageContextValue["reloadTranslations"];
  isNamespaceLoaded:
    ExtendedLanguageContextValue["isNamespaceLoaded"];
}

/**
 * ============================================================
 * Primary Hook
 * ============================================================
 */

/**
 * Returns the complete EPEW language context.
 *
 * This is the main hook for components that need access to:
 *
 * - locale
 * - active language metadata
 * - supported languages
 * - translations
 * - locale switching
 * - formatting
 * - namespace loading
 */
export function useLanguage():
  ExtendedLanguageContextValue {
  return useContext(LanguageContext);
}

/**
 * ============================================================
 * Translation Hook
 * ============================================================
 */

/**
 * Returns the translation function and current loading state.
 *
 * Example:
 *
 * const { t } = useTranslation();
 *
 * return <h1>{t("common.welcome", { name: "Nelson" })}</h1>;
 */
export function useTranslation():
  UseTranslationResult {
  const {
    t,
    locale,
    isLoading,
    isReady,
  } = useLanguage();

  return useMemo(
    () => ({
      t,
      locale,
      isLoading,
      isReady,
    }),
    [
      t,
      locale,
      isLoading,
      isReady,
    ],
  );
}

/**
 * ============================================================
 * Locale Hook
 * ============================================================
 */

/**
 * Returns locale-specific state and controls.
 *
 * Example:
 *
 * const {
 *   locale,
 *   language,
 *   languages,
 *   setLocale,
 * } = useLocale();
 */
export function useLocale():
  UseLocaleResult {
  const {
    locale,
    language,
    languages,
    setLocale,
  } = useLanguage();

  return useMemo(
    () => ({
      locale,
      language,
      languages,
      setLocale,
    }),
    [
      locale,
      language,
      languages,
      setLocale,
    ],
  );
}

/**
 * ============================================================
 * Formatting Hook
 * ============================================================
 */

/**
 * Returns locale-aware formatting functions.
 *
 * Example:
 *
 * const {
 *   formatDate,
 *   formatNumber,
 *   formatCurrency,
 * } = useLanguageFormatting();
 */
export function useLanguageFormatting():
  UseLanguageFormattingResult {
  const {
    formatDate,
    formatNumber,
    formatCurrency,
  } = useLanguage();

  return useMemo(
    () => ({
      formatDate,
      formatNumber,
      formatCurrency,
    }),
    [
      formatDate,
      formatNumber,
      formatCurrency,
    ],
  );
}

/**
 * ============================================================
 * Namespace Hook
 * ============================================================
 */

/**
 * Returns translation namespace controls.
 *
 * Example:
 *
 * const {
 *   namespaces,
 *   loadNamespaces,
 *   reloadTranslations,
 *   isNamespaceLoaded,
 * } = useLanguageNamespaces();
 */
export function useLanguageNamespaces():
  UseLanguageNamespacesResult {
  const {
    namespaces,
    loadNamespaces,
    reloadTranslations,
    isNamespaceLoaded,
  } = useLanguage();

  return useMemo(
    () => ({
      namespaces,
      loadNamespaces,
      reloadTranslations,
      isNamespaceLoaded,
    }),
    [
      namespaces,
      loadNamespaces,
      reloadTranslations,
      isNamespaceLoaded,
    ],
  );
}