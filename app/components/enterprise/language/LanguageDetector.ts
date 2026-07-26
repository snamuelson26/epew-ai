/**
 * EPEW Global Language Engine
 * ---------------------------------------------------------
 * Enterprise Language Detection Service
 *
 * Detection priority:
 * 1. User profile preference
 * 2. Local storage preference
 * 3. Cookie preference
 * 4. Browser language
 * 5. Default English
 */

import {
  DEFAULT_LOCALE,
  getLanguageDefinition,
  isSupportedLocale,
  normalizeLocale,
  type LanguageDefinition,
  type LanguageDetectionResult,
  type SupportedLocale,
} from "./LocaleTypes";

import { LanguageStorage } from "./LanguageStorage";

export interface LanguageDetectionOptions {
  /**
   * Language preference loaded from the authenticated
   * user's profile, such as Supabase.
   */
  profileLocale?: string | null;

  /**
   * Optional browser language override.
   *
   * Useful for tests, server-provided request information,
   * or environments where navigator is unavailable.
   */
  browserLanguages?: readonly string[];

  /**
   * Whether stored browser preferences should be checked.
   *
   * Default: true
   */
  includeStoredPreference?: boolean;

  /**
   * Whether browser language detection should be used.
   *
   * Default: true
   */
  includeBrowserLanguage?: boolean;
}

export interface LanguageDetectionSummary
  extends LanguageDetectionResult {
  language: LanguageDefinition;
  candidates: readonly string[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Returns browser language candidates in priority order.
 */
function getBrowserLanguageCandidates(
  browserLanguages?: readonly string[],
): readonly string[] {
  if (browserLanguages && browserLanguages.length > 0) {
    return browserLanguages.filter(Boolean);
  }

  if (!isBrowser() || typeof navigator === "undefined") {
    return [];
  }

  const candidates = new Set<string>();

  if (Array.isArray(navigator.languages)) {
    for (const language of navigator.languages) {
      if (language) {
        candidates.add(language);
      }
    }
  }

  if (navigator.language) {
    candidates.add(navigator.language);
  }

  return Array.from(candidates);
}

/**
 * Finds the first supported locale from a list of
 * full or abbreviated locale values.
 */
function findSupportedLocale(
  candidates: readonly string[],
): SupportedLocale | null {
  for (const candidate of candidates) {
    const normalizedCandidate = candidate
      .trim()
      .toLowerCase()
      .replaceAll("_", "-");

    if (isSupportedLocale(normalizedCandidate)) {
      return normalizedCandidate;
    }

    const baseLanguage = normalizedCandidate.split("-")[0];

    if (isSupportedLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return null;
}

export class LanguageDetector {
  /**
   * Detects the most appropriate language.
   */
  static detect(
    options: LanguageDetectionOptions = {},
  ): LanguageDetectionResult {
    const {
      profileLocale,
      browserLanguages,
      includeStoredPreference = true,
      includeBrowserLanguage = true,
    } = options;

    /*
     * Priority 1:
     * Authenticated user profile.
     */
    if (profileLocale) {
      const normalizedProfileLocale =
        normalizeLocale(profileLocale);

      if (
        isSupportedLocale(
          profileLocale.trim().toLowerCase().split("-")[0],
        )
      ) {
        return {
          locale: normalizedProfileLocale,
          source: "user-profile",
        };
      }
    }

    /*
     * Priority 2 and 3:
     * Local storage and cookie.
     *
     * LanguageStorage already checks local storage first,
     * followed by the browser cookie.
     */
    if (includeStoredPreference) {
      const storedPreference = LanguageStorage.load();

      if (storedPreference.source !== "default") {
        return storedPreference;
      }
    }

    /*
     * Priority 4:
     * Browser language.
     */
    if (includeBrowserLanguage) {
      const candidates =
        getBrowserLanguageCandidates(browserLanguages);

      const browserLocale =
        findSupportedLocale(candidates);

      if (browserLocale) {
        return {
          locale: browserLocale,
          source: "browser",
        };
      }
    }

    /*
     * Priority 5:
     * Platform default.
     */
    return {
      locale: DEFAULT_LOCALE,
      source: "default",
    };
  }

  /**
   * Returns a detailed detection summary for diagnostics.
   */
  static detectWithSummary(
    options: LanguageDetectionOptions = {},
  ): LanguageDetectionSummary {
    const result = this.detect(options);

    return {
      ...result,
      language: getLanguageDefinition(result.locale),
      candidates: getBrowserLanguageCandidates(
        options.browserLanguages,
      ),
    };
  }

  /**
   * Detects and persists the result.
   *
   * Profile and browser detection can be saved so future
   * visits do not need to repeat the same selection process.
   */
  static detectAndSave(
    options: LanguageDetectionOptions = {},
  ): LanguageDetectionResult {
    const result = this.detect(options);

    if (isBrowser()) {
      LanguageStorage.save(result.locale, {
        source: result.source,
      });
    }

    return result;
  }

  /**
   * Detects only from browser preferences.
   */
  static detectFromBrowser(
    browserLanguages?: readonly string[],
  ): SupportedLocale | null {
    const candidates =
      getBrowserLanguageCandidates(browserLanguages);

    return findSupportedLocale(candidates);
  }

  /**
   * Resolves a single locale value safely.
   */
  static resolveLocale(
    value: string | null | undefined,
  ): SupportedLocale {
    return normalizeLocale(value);
  }

  /**
   * Returns true when a browser locale can be mapped to one
   * of the platform's supported languages.
   */
  static supportsBrowserLocale(
    value: string | null | undefined,
  ): boolean {
    if (!value) {
      return false;
    }

    return (
      findSupportedLocale([value]) !== null
    );
  }

  /**
   * Returns the user's current stored preference without
   * checking profile or browser language.
   */
  static getStoredPreference(): LanguageDetectionResult | null {
    const storedPreference = LanguageStorage.load();

    return storedPreference.source === "default"
      ? null
      : storedPreference;
  }
}

/**
 * Convenience function for standard language detection.
 */
export function detectLanguage(
  options: LanguageDetectionOptions = {},
): LanguageDetectionResult {
  return LanguageDetector.detect(options);
}

/**
 * Convenience function for browser-only detection.
 */
export function detectBrowserLanguage(
  browserLanguages?: readonly string[],
): SupportedLocale | null {
  return LanguageDetector.detectFromBrowser(
    browserLanguages,
  );
}