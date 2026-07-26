/**
 * EPEW Global Language Engine
 * ---------------------------------------------------------
 * Central event service for broadcasting language changes
 * across the platform.
 *
 * This module is browser-safe, server-safe, dependency-free,
 * and compatible with React client components.
 */

import type { SupportedLocale } from "./LocaleTypes";

export const LANGUAGE_CHANGE_EVENT = "epew:language-change";

export type LanguageChangeSource =
  | "manual"
  | "browser"
  | "cookie"
  | "local-storage"
  | "user-profile"
  | "system"
  | "sync";

export interface LanguageChangeEventDetail {
  previousLocale: SupportedLocale;
  locale: SupportedLocale;
  source: LanguageChangeSource;
  changedAt: string;
}

export type LanguageChangeListener = (
  detail: LanguageChangeEventDetail,
) => void;

type InternalListener = LanguageChangeListener;

const listeners = new Set<InternalListener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createEventDetail(
  previousLocale: SupportedLocale,
  locale: SupportedLocale,
  source: LanguageChangeSource,
): LanguageChangeEventDetail {
  return {
    previousLocale,
    locale,
    source,
    changedAt: new Date().toISOString(),
  };
}

function notifyInternalListeners(
  detail: LanguageChangeEventDetail,
): void {
  for (const listener of listeners) {
    try {
      listener(detail);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[EPEW LanguageEvents] A language listener failed.",
          error,
        );
      }
    }
  }
}

function dispatchBrowserEvent(
  detail: LanguageChangeEventDetail,
): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<LanguageChangeEventDetail>(
      LANGUAGE_CHANGE_EVENT,
      {
        detail,
      },
    ),
  );
}

export const LanguageEvents = {
  /**
   * Broadcasts a language change to all registered listeners.
   */
  emit(
    previousLocale: SupportedLocale,
    locale: SupportedLocale,
    source: LanguageChangeSource = "system",
  ): LanguageChangeEventDetail {
    const detail = createEventDetail(
      previousLocale,
      locale,
      source,
    );

    notifyInternalListeners(detail);
    dispatchBrowserEvent(detail);

    return detail;
  },

  /**
   * Registers a language-change listener.
   *
   * Returns an unsubscribe function for convenient cleanup.
   */
  subscribe(
    listener: LanguageChangeListener,
  ): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Removes a previously registered listener.
   */
  unsubscribe(listener: LanguageChangeListener): void {
    listeners.delete(listener);
  },

  /**
   * Removes all internal subscribers.
   *
   * Primarily intended for testing, development refreshes,
   * or controlled application shutdown.
   */
  clear(): void {
    listeners.clear();
  },

  /**
   * Returns the number of registered internal listeners.
   */
  getListenerCount(): number {
    return listeners.size;
  },

  /**
   * Adds a native browser event listener.
   *
   * This is useful for integrations outside React or for
   * cross-module communication through window events.
   */
  subscribeToBrowserEvent(
    listener: LanguageChangeListener,
  ): () => void {
    if (!isBrowser()) {
      return () => undefined;
    }

    const browserListener = (event: Event): void => {
      const customEvent =
        event as CustomEvent<LanguageChangeEventDetail>;

      if (!customEvent.detail) {
        return;
      }

      listener(customEvent.detail);
    };

    window.addEventListener(
      LANGUAGE_CHANGE_EVENT,
      browserListener,
    );

    return () => {
      window.removeEventListener(
        LANGUAGE_CHANGE_EVENT,
        browserListener,
      );
    };
  },
} as const;

/**
 * Convenience function for broadcasting language changes.
 */
export function emitLanguageChange(
  previousLocale: SupportedLocale,
  locale: SupportedLocale,
  source: LanguageChangeSource = "system",
): LanguageChangeEventDetail {
  return LanguageEvents.emit(
    previousLocale,
    locale,
    source,
  );
}

/**
 * Convenience function for subscribing to language changes.
 */
export function subscribeToLanguageChange(
  listener: LanguageChangeListener,
): () => void {
  return LanguageEvents.subscribe(listener);
}