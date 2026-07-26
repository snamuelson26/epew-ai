/**
 * EPEW Global Language Engine
 * ---------------------------------------------------------
 * Central locale definitions, language metadata, and shared
 * TypeScript types for the multilingual platform.
 */

export const SUPPORTED_LOCALES = ["en", "ht", "fr", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type TextDirection = "ltr" | "rtl";

export type TranslationPrimitive = string | number | boolean | null;

export type TranslationValue =
  | TranslationPrimitive
  | TranslationDictionary
  | TranslationValue[];

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export interface TranslationVariables {
  [key: string]: string | number | boolean | null | undefined;
}

export interface LanguageDefinition {
  /**
   * Internal platform language code.
   */
  code: SupportedLocale;

  /**
   * English display name.
   */
  name: string;

  /**
   * Name displayed in the language itself.
   */
  nativeName: string;

  /**
   * Flag or visual identifier.
   */
  flag: string;

  /**
   * Full browser-compatible locale.
   */
  browserLocale: string;

  /**
   * Document writing direction.
   */
  direction: TextDirection;

  /**
   * Default date formatting locale.
   */
  dateLocale: string;

  /**
   * Default number formatting locale.
   */
  numberLocale: string;

  /**
   * Default currency formatting locale.
   */
  currencyLocale: string;

  /**
   * Default currency used by the platform.
   */
  currency: string;

  /**
   * Whether the language is currently available publicly.
   */
  enabled: boolean;

  /**
   * Whether this is the platform's fallback language.
   */
  isDefault: boolean;

  /**
   * Order used in language selectors.
   */
  sortOrder: number;
}

export interface TranslationNamespaceDefinition {
  id: string;
  label: string;
  required: boolean;
}

export interface TranslationRequest {
  locale: SupportedLocale;
  namespace: string;
}

export interface TranslationLookupOptions {
  /**
   * Variables used in placeholders such as:
   * "Welcome, {name}"
   */
  variables?: TranslationVariables;

  /**
   * Value returned when the requested key does not exist.
   */
  defaultValue?: string;

  /**
   * Optional locale override for a specific translation.
   */
  locale?: SupportedLocale;

  /**
   * Optional namespace override.
   */
  namespace?: string;

  /**
   * Log missing keys during development.
   */
  logMissing?: boolean;
}

export interface TranslationResult {
  key: string;
  value: string;
  locale: SupportedLocale;
  namespace: string;
  usedFallback: boolean;
  missing: boolean;
}

export interface LanguagePreference {
  locale: SupportedLocale;
  source:
    | "user-profile"
    | "cookie"
    | "local-storage"
    | "browser"
    | "default";
  updatedAt?: string;
}

export interface LanguageContextValue {
  locale: SupportedLocale;
  language: LanguageDefinition;
  languages: readonly LanguageDefinition[];
  isLoading: boolean;
  isReady: boolean;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (
    key: string,
    variablesOrOptions?: TranslationVariables | TranslationLookupOptions,
  ) => string;
  formatDate: (
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (
    value: number,
    options?: Intl.NumberFormatOptions,
  ) => string;
  formatCurrency: (
    value: number,
    currency?: string,
    options?: Intl.NumberFormatOptions,
  ) => string;
}

export interface StoredLanguagePreference {
  locale: SupportedLocale;
  savedAt: string;
}

export interface LanguageDetectionResult {
  locale: SupportedLocale;
  source: LanguagePreference["source"];
}

export interface TranslationCacheEntry {
  locale: SupportedLocale;
  namespace: string;
  translations: TranslationDictionary;
  loadedAt: number;
}

export interface TranslationLoadResult {
  locale: SupportedLocale;
  namespace: string;
  translations: TranslationDictionary;
  loadedFromFallback: boolean;
}

export interface TranslationHealthSummary {
  locale: SupportedLocale;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  completionPercentage: number;
}

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const FALLBACK_LOCALE: SupportedLocale = "en";

export const LANGUAGE_STORAGE_KEY = "epew-preferred-language";

export const LANGUAGE_COOKIE_NAME = "epew_locale";

export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_TRANSLATION_NAMESPACE = "common";

export const DEFAULT_CURRENCY = "USD";

export const LANGUAGE_DEFINITIONS = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    browserLocale: "en-US",
    direction: "ltr",
    dateLocale: "en-US",
    numberLocale: "en-US",
    currencyLocale: "en-US",
    currency: "USD",
    enabled: true,
    isDefault: true,
    sortOrder: 1,
  },
  {
    code: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    flag: "🇭🇹",
    browserLocale: "ht-HT",
    direction: "ltr",
    dateLocale: "ht-HT",
    numberLocale: "ht-HT",
    currencyLocale: "en-US",
    currency: "USD",
    enabled: true,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    browserLocale: "fr-FR",
    direction: "ltr",
    dateLocale: "fr-FR",
    numberLocale: "fr-FR",
    currencyLocale: "fr-FR",
    currency: "USD",
    enabled: true,
    isDefault: false,
    sortOrder: 3,
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    browserLocale: "es-ES",
    direction: "ltr",
    dateLocale: "es-ES",
    numberLocale: "es-ES",
    currencyLocale: "es-US",
    currency: "USD",
    enabled: true,
    isDefault: false,
    sortOrder: 4,
  },
] as const satisfies readonly LanguageDefinition[];

export const TRANSLATION_NAMESPACES = [
  {
    id: "common",
    label: "Common Interface",
    required: true,
  },
  {
    id: "navigation",
    label: "Navigation",
    required: true,
  },
  {
    id: "homepage",
    label: "Public Homepage",
    required: true,
  },
  {
    id: "entrepreneur",
    label: "Entrepreneur Portal",
    required: false,
  },
  {
    id: "supporter",
    label: "Supporter Portal",
    required: false,
  },
  {
    id: "coach",
    label: "Coach Portal",
    required: false,
  },
  {
    id: "partner",
    label: "Partner Portal",
    required: false,
  },
  {
    id: "vendor",
    label: "Vendor Portal",
    required: false,
  },
  {
    id: "admin",
    label: "Administration Portal",
    required: false,
  },
  {
    id: "communication",
    label: "Communication Center",
    required: false,
  },
  {
    id: "emails",
    label: "Email Templates",
    required: false,
  },
  {
    id: "sms",
    label: "SMS Templates",
    required: false,
  },
  {
    id: "certificates",
    label: "Certificates",
    required: false,
  },
  {
    id: "errors",
    label: "Errors",
    required: false,
  },
  {
    id: "validation",
    label: "Validation Messages",
    required: false,
  },
] as const satisfies readonly TranslationNamespaceDefinition[];

export function isSupportedLocale(
  value: string | null | undefined,
): value is SupportedLocale {
  if (!value) {
    return false;
  }

  return SUPPORTED_LOCALES.includes(value.toLowerCase() as SupportedLocale);
}

export function normalizeLocale(
  value: string | null | undefined,
): SupportedLocale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalizedValue = value.trim().toLowerCase().replace("_", "-");

  if (isSupportedLocale(normalizedValue)) {
    return normalizedValue;
  }

  const baseLanguage = normalizedValue.split("-")[0];

  if (isSupportedLocale(baseLanguage)) {
    return baseLanguage;
  }

  return DEFAULT_LOCALE;
}

export function getLanguageDefinition(
  locale: SupportedLocale,
): LanguageDefinition {
  return (
    LANGUAGE_DEFINITIONS.find((language) => language.code === locale) ??
    LANGUAGE_DEFINITIONS[0]
  );
}

export function getEnabledLanguages(): readonly LanguageDefinition[] {
  return LANGUAGE_DEFINITIONS.filter((language) => language.enabled).sort(
    (firstLanguage, secondLanguage) =>
      firstLanguage.sortOrder - secondLanguage.sortOrder,
  );
}