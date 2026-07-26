"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * LanguageProvider.tsx
 *
 * Main React provider for the multilingual platform.
 *
 * Responsibilities:
 * - Detect the initial language
 * - Load translation namespaces
 * - Persist language preferences
 * - Update the document language and direction
 * - Broadcast language-change events
 * - Provide translation and formatting functions
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  LanguageContext,
  type ExtendedLanguageContextValue,
  type LanguageProviderProps,
  type SetLocaleOptions,
} from "./LanguageContext";

import {
  DEFAULT_LOCALE,
  DEFAULT_TRANSLATION_NAMESPACE,
  getEnabledLanguages,
  getLanguageDefinition,
  normalizeLocale,
  type SupportedLocale,
  type TranslationLookupOptions,
  type TranslationVariables,
} from "./LocaleTypes";

import {
  LanguageDetector,
} from "./LanguageDetector";

import {
  LanguageStorage,
  type SaveLanguageOptions,
} from "./LanguageStorage";

import {
  LanguageEvents,
  type LanguageChangeSource,
} from "./LanguageEvents";

import {
  translationEngine,
  type TranslateOptions,
} from "./TranslationEngine";

/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function normalizeNamespaces(
  namespaces?: readonly string[],
): string[] {
  const source =
    namespaces && namespaces.length > 0
      ? namespaces
      : [DEFAULT_TRANSLATION_NAMESPACE];

  return Array.from(
    new Set(
      source
        .map((namespace) => namespace.trim())
        .filter(Boolean),
    ),
  );
}

function resolveStorageSource(
  source: SetLocaleOptions["source"],
): SaveLanguageOptions["source"] {
  switch (source) {
    case "manual":
    case "browser":
    case "cookie":
    case "local-storage":
    case "user-profile":
    case "system":
    case "default":
      return source;

    case "sync":
      return "system";

    default:
      return "manual";
  }
}

function resolveEventSource(
  source: SetLocaleOptions["source"],
): LanguageChangeSource {
  switch (source) {
    case "manual":
    case "browser":
    case "cookie":
    case "local-storage":
    case "user-profile":
    case "system":
    case "sync":
      return source;

    case "default":
      return "system";

    default:
      return "manual";
  }
}

function updateDocumentLanguage(
  locale: SupportedLocale,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const language = getLanguageDefinition(locale);

  document.documentElement.lang =
    language.browserLocale;

  document.documentElement.dir =
    language.direction;

  document.documentElement.dataset.locale =
    locale;
}

function isTranslationOptions(
  value:
    | TranslationVariables
    | TranslationLookupOptions,
): value is TranslationLookupOptions {
  return (
    "variables" in value ||
    "defaultValue" in value ||
    "locale" in value ||
    "namespace" in value ||
    "logMissing" in value
  );
}

/**
 * ============================================================
 * Provider
 * ============================================================
 */

export function LanguageProvider({
  children,
  initialLocale,
  profileLocale,
  namespaces,
  detectBrowserLanguage = true,
  useStoredPreference = true,
  persistPreference = true,
  loadingFallback,
}: LanguageProviderProps): ReactNode {
  const initialNamespaces = useMemo(
    () => normalizeNamespaces(namespaces),
    [namespaces],
  );

  const [locale, setLocaleState] =
    useState<SupportedLocale>(
      normalizeLocale(initialLocale ?? DEFAULT_LOCALE),
    );

  const [activeNamespaces, setActiveNamespaces] =
    useState<string[]>(initialNamespaces);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isReady, setIsReady] =
    useState<boolean>(false);

  /**
   * This revision value forces React consumers to update after
   * translations have been loaded into the engine cache.
   */
  const [, setTranslationRevision] =
    useState<number>(0);

  const mountedRef = useRef<boolean>(false);

  const localeRef =
    useRef<SupportedLocale>(locale);

  const namespacesRef =
    useRef<string[]>(initialNamespaces);

  const requestIdRef =
    useRef<number>(0);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    namespacesRef.current = activeNamespaces;
  }, [activeNamespaces]);

  /**
   * Load namespaces for a locale.
   */
  const loadLocaleNamespaces = useCallback(
    async (
      targetLocale: SupportedLocale,
      targetNamespaces: readonly string[],
    ): Promise<void> => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);

      const normalizedNamespaces =
        normalizeNamespaces(targetNamespaces);

      try {
        /**
         * Always preload English as the fallback language.
         */
        if (targetLocale !== DEFAULT_LOCALE) {
          await translationEngine.preloadNamespaces(
            DEFAULT_LOCALE,
            normalizedNamespaces,
          );
        }

        await translationEngine.preloadNamespaces(
          targetLocale,
          normalizedNamespaces,
        );

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setTranslationRevision(
          (revision) => revision + 1,
        );

        setIsReady(true);
      } catch (error) {
        if (
          process.env.NODE_ENV === "development"
        ) {
          console.error(
            "[EPEW Language Engine] Failed to load translations.",
            error,
          );
        }

        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setIsReady(true);
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  /**
   * Change the current language.
   */
  const setLocale = useCallback(
    async (
      requestedLocale: SupportedLocale,
      options: SetLocaleOptions = {},
    ): Promise<void> => {
      const nextLocale =
        normalizeLocale(requestedLocale);

      const previousLocale =
        localeRef.current;

      const {
        source = "manual",
        persist = true,
        reloadTranslations = true,
        emitEvent = true,
      } = options;

      if (
        nextLocale === previousLocale &&
        !reloadTranslations
      ) {
        return;
      }

      setLocaleState(nextLocale);
      localeRef.current = nextLocale;

      updateDocumentLanguage(nextLocale);

      if (
        persist &&
        persistPreference
      ) {
        LanguageStorage.save(nextLocale, {
          source: resolveStorageSource(source),
          saveCookie: true,
          saveLocalStorage: true,
        });
      }

      if (reloadTranslations) {
        await loadLocaleNamespaces(
          nextLocale,
          namespacesRef.current,
        );
      }

      if (
        emitEvent &&
        nextLocale !== previousLocale
      ) {
        LanguageEvents.emit(
          previousLocale,
          nextLocale,
          resolveEventSource(source),
        );
      }
    },
    [
      loadLocaleNamespaces,
      persistPreference,
    ],
  );

  /**
   * Reload all active namespaces.
   */
  const reloadTranslations =
    useCallback(async (): Promise<void> => {
      await loadLocaleNamespaces(
        localeRef.current,
        namespacesRef.current,
      );
    }, [loadLocaleNamespaces]);

  /**
   * Add namespaces to the provider.
   */
  const loadNamespaces = useCallback(
    async (
      requestedNamespaces: readonly string[],
    ): Promise<void> => {
      const mergedNamespaces =
        normalizeNamespaces([
          ...namespacesRef.current,
          ...requestedNamespaces,
        ]);

      namespacesRef.current =
        mergedNamespaces;

      setActiveNamespaces(
        mergedNamespaces,
      );

      await loadLocaleNamespaces(
        localeRef.current,
        mergedNamespaces,
      );
    },
    [loadLocaleNamespaces],
  );

  /**
   * Check whether a namespace is loaded for the current locale.
   */
  const isNamespaceLoaded = useCallback(
    (namespace: string): boolean => {
      const normalizedNamespace =
        namespace.trim();

      if (!normalizedNamespace) {
        return false;
      }

      return translationEngine.isNamespaceLoaded(
        localeRef.current,
        normalizedNamespace,
      );
    },
    [],
  );

  /**
   * Translation function used by React components.
   *
   * Translation namespaces are preloaded by this provider,
   * allowing the synchronous lookup method to be used safely.
   */
  const t = useCallback(
    (
      key: string,
      variablesOrOptions?:
        | TranslationVariables
        | TranslationLookupOptions,
    ): string => {
      let options: TranslateOptions = {
        locale,
      };

      if (variablesOrOptions) {
        if (
          isTranslationOptions(
            variablesOrOptions,
          )
        ) {
          options = {
            ...variablesOrOptions,
            locale:
              variablesOrOptions.locale ??
              locale,
          };
        } else {
          options = {
            locale,
            variables:
              variablesOrOptions,
          };
        }
      }

      return translationEngine.translateSync(
        key,
        options,
      );
    },
    [locale],
  );

  /**
   * Locale-aware date formatter.
   */
  const formatDate = useCallback(
    (
      value: Date | string | number,
      options?: Intl.DateTimeFormatOptions,
    ): string => {
      const date =
        value instanceof Date
          ? value
          : new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      const language =
        getLanguageDefinition(locale);

      try {
        return new Intl.DateTimeFormat(
          language.dateLocale,
          options,
        ).format(date);
      } catch {
        return new Intl.DateTimeFormat(
          "en-US",
          options,
        ).format(date);
      }
    },
    [locale],
  );

  /**
   * Locale-aware number formatter.
   */
  const formatNumber = useCallback(
    (
      value: number,
      options?: Intl.NumberFormatOptions,
    ): string => {
      if (!Number.isFinite(value)) {
        return "";
      }

      const language =
        getLanguageDefinition(locale);

      try {
        return new Intl.NumberFormat(
          language.numberLocale,
          options,
        ).format(value);
      } catch {
        return new Intl.NumberFormat(
          "en-US",
          options,
        ).format(value);
      }
    },
    [locale],
  );

  /**
   * Locale-aware currency formatter.
   */
  const formatCurrency = useCallback(
    (
      value: number,
      currency?: string,
      options?: Intl.NumberFormatOptions,
    ): string => {
      if (!Number.isFinite(value)) {
        return "";
      }

      const language =
        getLanguageDefinition(locale);

      try {
        return new Intl.NumberFormat(
          language.currencyLocale,
          {
            style: "currency",
            currency:
              currency ??
              language.currency,
            ...options,
          },
        ).format(value);
      } catch {
        return new Intl.NumberFormat(
          "en-US",
          {
            style: "currency",
            currency:
              currency ??
              "USD",
            ...options,
          },
        ).format(value);
      }
    },
    [locale],
  );

  /**
   * Initial language resolution.
   */
  useEffect(() => {
    mountedRef.current = true;

    const initializeLanguage =
      async (): Promise<void> => {
        setIsLoading(true);

        let resolvedLocale:
          SupportedLocale;

        let source:
          SetLocaleOptions["source"];

        if (initialLocale) {
          resolvedLocale =
            normalizeLocale(initialLocale);

          source = "system";
        } else {
          const detection =
            LanguageDetector.detect({
              profileLocale,
              includeStoredPreference:
                useStoredPreference,
              includeBrowserLanguage:
                detectBrowserLanguage,
            });

          resolvedLocale =
            detection.locale;

          source =
            detection.source;
        }

        await setLocale(
          resolvedLocale,
          {
            source,
            persist:
              persistPreference,
            reloadTranslations: true,
            emitEvent: false,
          },
        );

        if (mountedRef.current) {
          setIsReady(true);
          setIsLoading(false);
        }
      };

    void initializeLanguage();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [
    detectBrowserLanguage,
    initialLocale,
    persistPreference,
    profileLocale,
    setLocale,
    useStoredPreference,
  ]);

  /**
   * Keep the document metadata synchronized.
   */
  useEffect(() => {
    updateDocumentLanguage(locale);
  }, [locale]);

  /**
   * Listen for language changes emitted by another application
   * module using LanguageEvents.
   */
  useEffect(() => {
    const unsubscribe =
      LanguageEvents.subscribe(
        (event) => {
          if (
            event.locale ===
            localeRef.current
          ) {
            return;
          }

          void setLocale(
            event.locale,
            {
              source: "sync",
              persist: true,
              reloadTranslations: true,
              emitEvent: false,
            },
          );
        },
      );

    return unsubscribe;
  }, [setLocale]);

  const contextValue =
    useMemo<ExtendedLanguageContextValue>(
      () => ({
        locale,
        language:
          getLanguageDefinition(locale),
        languages:
          getEnabledLanguages(),
        namespaces:
          activeNamespaces,
        isLoading,
        isReady,
        setLocale,
        reloadTranslations,
        loadNamespaces,
        isNamespaceLoaded,
        t,
        formatDate,
        formatNumber,
        formatCurrency,
      }),
      [
        activeNamespaces,
        formatCurrency,
        formatDate,
        formatNumber,
        isLoading,
        isNamespaceLoaded,
        isReady,
        loadNamespaces,
        locale,
        reloadTranslations,
        setLocale,
        t,
      ],
    );

  if (
    isLoading &&
    !isReady &&
    loadingFallback !== undefined
  ) {
    return (
      <LanguageContext.Provider
        value={contextValue}
      >
        {loadingFallback}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider
      value={contextValue}
    >
      {children}
    </LanguageContext.Provider>
  );
}

LanguageProvider.displayName =
  "EPEWLanguageProvider";