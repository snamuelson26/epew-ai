"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * LanguageContext.tsx
 *
 * Defines the React context contract used by the entire
 * multilingual platform.
 *
 * The provider implementation will be created separately in:
 *
 * LanguageProvider.tsx
 */

import {
  createContext,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  getEnabledLanguages,
  getLanguageDefinition,
  type LanguageContextValue,
  type SupportedLocale,
  type TranslationLookupOptions,
  type TranslationVariables,
} from "./LocaleTypes";

/**
 * ============================================================
 * Public Types
 * ============================================================
 */

export interface LanguageProviderProps {
  children: ReactNode;

  /**
   * Optional starting locale.
   *
   * Useful when a locale has already been resolved from:
   * - the authenticated user profile
   * - a server cookie
   * - route metadata
   * - application settings
   */
  initialLocale?: SupportedLocale;

  /**
   * Optional authenticated profile preference.
   *
   * When available, the provider can give this preference
   * priority over browser detection and stored preferences.
   */
  profileLocale?: string | null;

  /**
   * Translation namespaces loaded when the provider starts.
   */
  namespaces?: readonly string[];

  /**
   * Whether browser language detection should be enabled.
   *
   * Default: true
   */
  detectBrowserLanguage?: boolean;

  /**
   * Whether cookie and local-storage preferences should be used.
   *
   * Default: true
   */
  useStoredPreference?: boolean;

  /**
   * Whether the resolved language should be persisted.
   *
   * Default: true
   */
  persistPreference?: boolean;

  /**
   * Optional loading interface shown while translations load.
   */
  loadingFallback?: ReactNode;
}

export interface SetLocaleOptions {
  /**
   * Source recorded for the language change.
   */
  source?:
    | "manual"
    | "browser"
    | "cookie"
    | "local-storage"
    | "user-profile"
    | "system"
    | "default"
    | "sync";

  /**
   * Whether the selected language should be saved.
   *
   * Default: true
   */
  persist?: boolean;

  /**
   * Whether the provider should reload its active namespaces.
   *
   * Default: true
   */
  reloadTranslations?: boolean;

  /**
   * Whether a language-change event should be emitted.
   *
   * Default: true
   */
  emitEvent?: boolean;
}

export interface ExtendedLanguageContextValue
  extends Omit<LanguageContextValue, "setLocale"> {
  /**
   * Changes the active language.
   */
  setLocale: (
    locale: SupportedLocale,
    options?: SetLocaleOptions,
  ) => Promise<void>;

  /**
   * Active translation namespaces.
   */
  namespaces: readonly string[];

  /**
   * Reloads the currently active namespaces.
   */
  reloadTranslations: () => Promise<void>;

  /**
   * Loads additional namespaces without removing the current ones.
   */
  loadNamespaces: (
    namespaces: readonly string[],
  ) => Promise<void>;

  /**
   * Returns true when a namespace has been loaded for the
   * current locale.
   */
  isNamespaceLoaded: (namespace: string) => boolean;
}

/**
 * ============================================================
 * Safe Default Implementations
 * ============================================================
 *
 * These defaults prevent components from crashing before the
 * provider is mounted.
 */

const defaultLanguage = getLanguageDefinition(DEFAULT_LOCALE);

const defaultLanguages = getEnabledLanguages();

function getDefaultTranslation(
  key: string,
  variablesOrOptions?:
    | TranslationVariables
    | TranslationLookupOptions,
): string {
  let defaultValue: string | undefined;

  let variables: TranslationVariables | undefined;

  if (variablesOrOptions) {
    const possibleOptions =
      variablesOrOptions as TranslationLookupOptions;

    const isOptionsObject =
      "variables" in possibleOptions ||
      "defaultValue" in possibleOptions ||
      "locale" in possibleOptions ||
      "namespace" in possibleOptions ||
      "logMissing" in possibleOptions;

    if (isOptionsObject) {
      defaultValue = possibleOptions.defaultValue;
      variables = possibleOptions.variables;
    } else {
      variables =
        variablesOrOptions as TranslationVariables;
    }
  }

  const template = defaultValue ?? key;

  if (!variables) {
    return template;
  }

  return template.replace(
    /\{([a-zA-Z0-9_.-]+)\}/g,
    (match, variableName: string) => {
      const value = variables?.[variableName];

      if (
        value === undefined ||
        value === null
      ) {
        return match;
      }

      return String(value);
    },
  );
}

function getDefaultDateFormat(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    defaultLanguage.dateLocale,
    options,
  ).format(date);
}

function getDefaultNumberFormat(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat(
    defaultLanguage.numberLocale,
    options,
  ).format(value);
}

function getDefaultCurrencyFormat(
  value: number,
  currency = defaultLanguage.currency,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat(
    defaultLanguage.currencyLocale,
    {
      style: "currency",
      currency,
      ...options,
    },
  ).format(value);
}

async function defaultSetLocale(
  _locale: SupportedLocale,
  _options?: SetLocaleOptions,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[EPEW Language Engine] setLocale() was called outside LanguageProvider.",
    );
  }
}

async function defaultReloadTranslations(): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[EPEW Language Engine] reloadTranslations() was called outside LanguageProvider.",
    );
  }
}

async function defaultLoadNamespaces(
  _namespaces: readonly string[],
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[EPEW Language Engine] loadNamespaces() was called outside LanguageProvider.",
    );
  }
}

/**
 * ============================================================
 * Default Context Value
 * ============================================================
 */

export const DEFAULT_LANGUAGE_CONTEXT_VALUE:
  ExtendedLanguageContextValue = {
    locale: DEFAULT_LOCALE,
    language: defaultLanguage,
    languages: defaultLanguages,
    namespaces: [],
    isLoading: false,
    isReady: false,

    setLocale: defaultSetLocale,

    reloadTranslations:
      defaultReloadTranslations,

    loadNamespaces:
      defaultLoadNamespaces,

    isNamespaceLoaded: () => false,

    t: getDefaultTranslation,

    formatDate: getDefaultDateFormat,

    formatNumber: getDefaultNumberFormat,

    formatCurrency:
      getDefaultCurrencyFormat,
  };

/**
 * ============================================================
 * React Context
 * ============================================================
 */

export const LanguageContext =
  createContext<ExtendedLanguageContextValue>(
    DEFAULT_LANGUAGE_CONTEXT_VALUE,
  );

LanguageContext.displayName =
  "EPEWLanguageContext";