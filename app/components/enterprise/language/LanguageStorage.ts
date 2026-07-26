/**
 * EPEW Global Language Engine
 * ---------------------------------------------------------
 * Enterprise Language Storage Service
 *
 * Handles:
 * - Local Storage
 * - Cookies
 * - Future Supabase synchronization
 * - Safe server-side execution
 */

import {
  DEFAULT_LOCALE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  normalizeLocale,
  type LanguageDetectionResult,
  type StoredLanguagePreference,
  type SupportedLocale,
} from "./LocaleTypes";

export interface SaveLanguageOptions {
  source?:
    | "manual"
    | "browser"
    | "cookie"
    | "local-storage"
    | "user-profile"
    | "system"
    | "default";

  saveCookie?: boolean;

  saveLocalStorage?: boolean;
}

interface StoredLanguageRecord extends StoredLanguagePreference {
  version: number;
  source: string;
}

const STORAGE_VERSION = 1;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeJSONParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export class LanguageStorage {
  /**
   * Save language preference.
   */
  static save(
    locale: SupportedLocale,
    options: SaveLanguageOptions = {},
  ): void {
    if (!isBrowser()) return;

    const {
      source = "manual",
      saveCookie = true,
      saveLocalStorage = true,
    } = options;

    const record: StoredLanguageRecord = {
      version: STORAGE_VERSION,
      locale,
      source,
      savedAt: new Date().toISOString(),
    };

    if (saveLocalStorage) {
      localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        JSON.stringify(record),
      );
    }

    if (saveCookie) {
      this.saveCookie(locale);
    }
  }

  /**
   * Load preferred language.
   */
  static load(): LanguageDetectionResult {
    if (!isBrowser()) {
      return {
        locale: DEFAULT_LOCALE,
        source: "default",
      };
    }

    const local = this.loadFromLocalStorage();

    if (local) {
      return {
        locale: local.locale,
        source: "local-storage",
      };
    }

    const cookie = this.readCookie();

    if (cookie) {
      return {
        locale: cookie,
        source: "cookie",
      };
    }

    return {
      locale: DEFAULT_LOCALE,
      source: "default",
    };
  }

  /**
   * Returns true if a preference exists.
   */
  static hasPreference(): boolean {
    if (!isBrowser()) return false;

    return (
      localStorage.getItem(LANGUAGE_STORAGE_KEY) !== null ||
      this.readCookie() !== null
    );
  }

  /**
   * Remove all language preferences.
   */
  static clear(): void {
    if (!isBrowser()) return;

    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    this.removeCookie();
  }

  /**
   * Read local storage.
   */
  static loadFromLocalStorage(): StoredLanguagePreference | null {
    if (!isBrowser()) return null;

    const value = localStorage.getItem(
      LANGUAGE_STORAGE_KEY,
    );

    if (!value) return null;

    const record =
      safeJSONParse<StoredLanguageRecord>(value);

    if (!record) return null;

    return {
      locale: normalizeLocale(record.locale),
      savedAt: record.savedAt,
    };
  }

  /**
   * Save browser cookie.
   */
  static saveCookie(
    locale: SupportedLocale,
  ): void {
    if (!isBrowser()) return;

    document.cookie = [
      `${LANGUAGE_COOKIE_NAME}=${locale}`,
      `max-age=${LANGUAGE_COOKIE_MAX_AGE}`,
      "path=/",
      "SameSite=Lax",
    ].join("; ");
  }

  /**
   * Read browser cookie.
   */
  static readCookie():
    | SupportedLocale
    | null {
    if (!isBrowser()) return null;

    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
      const trimmed = cookie.trim();

      if (
        trimmed.startsWith(
          `${LANGUAGE_COOKIE_NAME}=`,
        )
      ) {
        const value = trimmed.substring(
          LANGUAGE_COOKIE_NAME.length + 1,
        );

        return normalizeLocale(value);
      }
    }

    return null;
  }

  /**
   * Delete cookie.
   */
  static removeCookie(): void {
    if (!isBrowser()) return;

    document.cookie = [
      `${LANGUAGE_COOKIE_NAME}=`,
      "Max-Age=0",
      "path=/",
      "SameSite=Lax",
    ].join("; ");
  }

  /**
   * Future Supabase synchronization.
   */
  static async syncUserProfile(): Promise<void> {
    /**
     * Placeholder.
     *
     * Future implementation:
     *
     * Read language from Supabase profile.
     *
     * Save locally.
     *
     * Keep browser synchronized.
     */
  }
}