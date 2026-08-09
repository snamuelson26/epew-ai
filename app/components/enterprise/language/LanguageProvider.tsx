"use client";

/**
 * EPEW Global Language Engine
 * ============================================================
 * LanguageProvider.tsx
 *
 * Central React provider for the multilingual EPEW platform.
 *
 * Responsibilities
 * ------------------------------------------------------------
 * ✓ Resolve the initial language
 * ✓ Load translation namespaces
 * ✓ Change languages instantly
 * ✓ Persist manual language selections
 * ✓ Support namespaced keys such as navigation.home
 * ✓ Update the HTML lang and dir attributes
 * ✓ Provide locale-aware formatting
 * ✓ Prevent stale asynchronous language changes
 * ✓ Avoid language-event recursion
 * ✓ Force translation consumers to refresh after cache updates
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

import { LanguageDetector } from "./LanguageDetector";
import { LanguageEvents } from "./LanguageEvents";
import { LanguageStorage } from "./LanguageStorage";
import { translationEngine } from "./TranslationEngine";

/**
 * ============================================================
 * Internal Types
 * ============================================================
 */

interface ResolvedTranslationKey {
  key: string;
  namespace: string;
}

type TranslationArguments =
  | TranslationVariables
  | TranslationLookupOptions
  | undefined;

/**
 * ============================================================
 * Utilities
 * ============================================================
 */

function normalizeNamespaces(
  namespaces: readonly string[] | undefined,
): string[] {
  const source =
    namespaces && namespaces.length > 0
      ? namespaces
      : [
          DEFAULT_TRANSLATION_NAMESPACE,
          "navigation",
          "homepage",
          "about",
        ];

  const normalized = source
    .map((namespace) => namespace.trim())
    .filter(Boolean);

  if (
    !normalized.includes(
      DEFAULT_TRANSLATION_NAMESPACE,
    )
  ) {
    normalized.unshift(
      DEFAULT_TRANSLATION_NAMESPACE,
    );
  }

  return Array.from(
    new Set(normalized),
  );
}

function parseTranslationArguments(
  value: TranslationArguments,
): TranslationLookupOptions {
  if (!value) {
    return {};
  }

  const possibleOptions =
    value as TranslationLookupOptions;

  const isOptionsObject =
    "variables" in possibleOptions ||
    "defaultValue" in possibleOptions ||
    "locale" in possibleOptions ||
    "namespace" in possibleOptions ||
    "logMissing" in possibleOptions;

  if (isOptionsObject) {
    return possibleOptions;
  }

  return {
    variables:
      value as TranslationVariables,
  };
}

/**
 * Converts:
 *
 * navigation.home
 *
 * into:
 *
 * namespace: navigation
 * key: home
 *
 * It also supports deeper keys:
 *
 * homepage.hero.title
 *
 * into:
 *
 * namespace: homepage
 * key: hero.title
 */
function resolveTranslationKey(
  fullKey: string,
  explicitNamespace?: string,
): ResolvedTranslationKey {
  const trimmedKey =
    fullKey.trim();

  if (explicitNamespace?.trim()) {
    const namespace =
      explicitNamespace.trim();

    const namespacePrefix =
      `${namespace}.`;

    return {
      namespace,
      key: trimmedKey.startsWith(
        namespacePrefix,
      )
        ? trimmedKey.slice(
            namespacePrefix.length,
          )
        : trimmedKey,
    };
  }

  const firstDotIndex =
    trimmedKey.indexOf(".");

  if (firstDotIndex <= 0) {
    return {
      namespace:
        DEFAULT_TRANSLATION_NAMESPACE,
      key: trimmedKey,
    };
  }

  const possibleNamespace =
    trimmedKey.slice(
      0,
      firstDotIndex,
    );

  const remainingKey =
    trimmedKey.slice(
      firstDotIndex + 1,
    );

  const namespaceExistsForAnyLocale =
    translationEngine
      .getSupportedLocales()
      .some((supportedLocale) =>
        translationEngine.hasRegisteredNamespace(
          supportedLocale,
          possibleNamespace,
        ),
      );

  if (
    !namespaceExistsForAnyLocale
  ) {
    return {
      namespace:
        DEFAULT_TRANSLATION_NAMESPACE,
      key: trimmedKey,
    };
  }

  return {
    namespace:
      possibleNamespace,
    key:
      remainingKey,
  };
}

function getEventSource(
  source:
    | SetLocaleOptions["source"]
    | undefined,
):
  | "manual"
  | "browser"
  | "cookie"
  | "local-storage"
  | "user-profile"
  | "system"
  | "sync" {
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
    default:
      return "system";
  }
}

function getStorageSource(
  source:
    | SetLocaleOptions["source"]
    | undefined,
):
  | "manual"
  | "browser"
  | "cookie"
  | "local-storage"
  | "user-profile"
  | "system"
  | "default" {
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
    default:
      return "system";
  }
}

function updateDocumentLanguage(
  locale: SupportedLocale,
): void {
  if (
    typeof document === "undefined"
  ) {
    return;
  }

  const language =
    getLanguageDefinition(locale);

  document.documentElement.lang =
    language.browserLocale;

  document.documentElement.dir =
    language.direction;

  document.documentElement.dataset.locale =
    locale;
}

/**
 * ============================================================
 * Provider
 * ============================================================
 */

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  profileLocale = null,
  namespaces,
  detectBrowserLanguage = true,
  useStoredPreference = true,
  persistPreference = true,
  loadingFallback,
}: LanguageProviderProps): ReactNode {
  const initialNamespaces =
    useMemo(
      () =>
        normalizeNamespaces(
          namespaces,
        ),
      [namespaces],
    );

  const [locale, setLocaleState] =
    useState<SupportedLocale>(
      normalizeLocale(initialLocale),
    );

  const [
    activeNamespaces,
    setActiveNamespaces,
  ] = useState<string[]>(
    initialNamespaces,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState<boolean>(true);

  const [
    isReady,
    setIsReady,
  ] = useState<boolean>(false);

  /**
   * This revision is intentionally read by the translation
   * callback. Whenever translations are added to or refreshed
   * inside the engine cache, the revision changes and forces
   * React translation consumers to render again.
   */
  const [
    translationRevision,
    setTranslationRevision,
  ] = useState<number>(0);

  const localeRef =
    useRef<SupportedLocale>(
      normalizeLocale(initialLocale),
    );

  const namespacesRef =
    useRef<string[]>(
      initialNamespaces,
    );

  const mountedRef =
    useRef<boolean>(false);

  /**
   * Prevent an older asynchronous language request from
   * overwriting a newer language selection.
   */
  const changeRequestRef =
    useRef<number>(0);

  useEffect(() => {
    localeRef.current =
      locale;
  }, [locale]);

  useEffect(() => {
    namespacesRef.current =
      activeNamespaces;
  }, [activeNamespaces]);

  /**
   * ==========================================================
   * Internal Locale Change Operation
   * ==========================================================
   */

  const changeLocale =
    useCallback(
      async (
        requestedLocale:
          SupportedLocale,
        options:
          SetLocaleOptions = {},
      ): Promise<void> => {
        const nextLocale =
          normalizeLocale(
            requestedLocale,
          );

        const previousLocale =
          localeRef.current;

        const {
          source = "manual",
          persist =
            persistPreference,
          reloadTranslations = true,
          emitEvent = true,
        } = options;

        const requestId =
          ++changeRequestRef.current;

        if (mountedRef.current) {
          setIsLoading(true);
        }

        try {
          /**
           * English remains the enterprise fallback language.
           */
          if (
            reloadTranslations &&
            nextLocale !==
              DEFAULT_LOCALE
          ) {
            await translationEngine
              .preloadNamespaces(
                DEFAULT_LOCALE,
                namespacesRef.current,
              );
          }

          if (reloadTranslations) {
            await translationEngine
              .preloadNamespaces(
                nextLocale,
                namespacesRef.current,
              );
          }

          /**
           * Ignore the result when a newer language request
           * started while this one was loading.
           */
          if (
            requestId !==
            changeRequestRef.current
          ) {
            return;
          }

          localeRef.current =
            nextLocale;

          updateDocumentLanguage(
            nextLocale,
          );

          if (mountedRef.current) {
            setLocaleState(
              nextLocale,
            );

            setTranslationRevision(
              (currentRevision) =>
                currentRevision + 1,
            );
          }

          if (persist) {
            LanguageStorage.save(
              nextLocale,
              {
                source:
                  getStorageSource(
                    source,
                  ),
              },
            );
          }

          if (
            emitEvent &&
            previousLocale !==
              nextLocale
          ) {
            LanguageEvents.emit(
              previousLocale,
              nextLocale,
              getEventSource(source),
            );
          }
        } catch (error) {
          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            console.error(
              "[EPEW Language Engine] Failed to change language.",
              error,
            );
          }
        } finally {
          if (
            requestId ===
              changeRequestRef.current &&
            mountedRef.current
          ) {
            setIsLoading(false);
            setIsReady(true);
          }
        }
      },
      [persistPreference],
    );

  /**
   * ==========================================================
   * Initial Language Resolution
   * ==========================================================
   */

  useEffect(() => {
    mountedRef.current = true;

    async function initializeLanguage():
      Promise<void> {
      const detected =
        LanguageDetector.detect({
          profileLocale,
          includeStoredPreference:
            useStoredPreference,
          includeBrowserLanguage:
            detectBrowserLanguage,
        });

      /**
       * Respect initialLocale when no stored, browser, or
       * profile preference exists.
       */
      const resolvedLocale =
        detected.source === "default"
          ? normalizeLocale(
              initialLocale,
            )
          : detected.locale;

      const resolvedSource =
        detected.source === "default"
          ? "default"
          : detected.source;

      await changeLocale(
        resolvedLocale,
        {
          source:
            resolvedSource,
          persist: false,
          reloadTranslations: true,
          emitEvent: false,
        },
      );
    }

    void initializeLanguage();

    return () => {
      mountedRef.current = false;

      /**
       * Invalidate any request still running during cleanup.
       * This also makes the provider safe under React Strict
       * Mode's development mount/unmount checks.
       */
      changeRequestRef.current += 1;
    };
  }, [
    changeLocale,
    detectBrowserLanguage,
    initialLocale,
    profileLocale,
    useStoredPreference,
  ]);

  /**
   * ==========================================================
   * Synchronize Namespaces Received Through Provider Props
   * ==========================================================
   */

  useEffect(() => {
    const missingNamespaces =
  initialNamespaces.filter(
    (namespace) => {
      const currentLocaleLoaded =
        translationEngine.isNamespaceLoaded(
          localeRef.current,
          namespace,
        );

      const fallbackLocaleLoaded =
        localeRef.current === DEFAULT_LOCALE ||
        translationEngine.isNamespaceLoaded(
          DEFAULT_LOCALE,
          namespace,
        );

      return (
        !currentLocaleLoaded ||
        !fallbackLocaleLoaded
      );
    },
  );

    if (
      missingNamespaces.length === 0
    ) {
      return;
    }

    let cancelled = false;

    async function loadPropNamespaces():
      Promise<void> {
      try {
        if (
          localeRef.current !==
          DEFAULT_LOCALE
        ) {
          await translationEngine
            .preloadNamespaces(
              DEFAULT_LOCALE,
              missingNamespaces,
            );
        }

        await translationEngine
          .preloadNamespaces(
            localeRef.current,
            missingNamespaces,
          );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        const updatedNamespaces =
          Array.from(
            new Set([
              ...namespacesRef.current,
              ...missingNamespaces,
            ]),
          );

        namespacesRef.current =
          updatedNamespaces;

        setActiveNamespaces(
          updatedNamespaces,
        );

        setTranslationRevision(
          (currentRevision) =>
            currentRevision + 1,
        );
      } catch (error) {
        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.error(
            "[EPEW Language Engine] Failed to load provider namespaces.",
            error,
          );
        }
      }
    }

    void loadPropNamespaces();

    return () => {
      cancelled = true;
    };
  }, [initialNamespaces]);

  /**
   * ==========================================================
   * Listen for Language Events
   * ==========================================================
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

          void changeLocale(
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
  }, [changeLocale]);

  /**
   * ==========================================================
   * Public Actions
   * ==========================================================
   */

  const setLocale =
    useCallback(
      async (
        nextLocale:
          SupportedLocale,
        options?:
          SetLocaleOptions,
      ): Promise<void> => {
        await changeLocale(
          nextLocale,
          options,
        );
      },
      [changeLocale],
    );

  const reloadTranslations =
    useCallback(
      async (): Promise<void> => {
        const requestId =
          ++changeRequestRef.current;

        if (mountedRef.current) {
          setIsLoading(true);
        }

        try {
          /**
           * Remove the active locale namespaces so that their
           * files are fetched and registered again.
           */
          for (
            const namespace of
            namespacesRef.current
          ) {
            translationEngine
              .removeNamespaceFromCache(
                localeRef.current,
                namespace,
              );
          }

          if (
            localeRef.current !==
            DEFAULT_LOCALE
          ) {
            for (
              const namespace of
              namespacesRef.current
            ) {
              translationEngine
                .removeNamespaceFromCache(
                  DEFAULT_LOCALE,
                  namespace,
                );
            }

            await translationEngine
              .preloadNamespaces(
                DEFAULT_LOCALE,
                namespacesRef.current,
              );
          }

          await translationEngine
            .preloadNamespaces(
              localeRef.current,
              namespacesRef.current,
            );

          if (
            requestId !==
              changeRequestRef.current ||
            !mountedRef.current
          ) {
            return;
          }

          setTranslationRevision(
            (currentRevision) =>
              currentRevision + 1,
          );
        } catch (error) {
          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            console.error(
              "[EPEW Language Engine] Failed to reload translations.",
              error,
            );
          }
        } finally {
          if (
            requestId ===
              changeRequestRef.current &&
            mountedRef.current
          ) {
            setIsLoading(false);
            setIsReady(true);
          }
        }
      },
      [],
    );

 const loadNamespaces = useCallback(
  async (
    requestedNamespaces: readonly string[],
  ): Promise<void> => {
    const normalized = normalizeNamespaces(
      requestedNamespaces,
    );

    console.log("LOAD NAMESPACES REQUEST", {
      locale: localeRef.current,
      requestedNamespaces,
      normalized,
    });

    const missingNamespaces = normalized.filter(
      (namespace) => {
        const currentLocaleLoaded =
          translationEngine.isNamespaceLoaded(
            localeRef.current,
            namespace,
          );

        const fallbackLocaleLoaded =
          localeRef.current === DEFAULT_LOCALE ||
          translationEngine.isNamespaceLoaded(
            DEFAULT_LOCALE,
            namespace,
          );

        return (
          !currentLocaleLoaded ||
          !fallbackLocaleLoaded
        );
      },
    );

    if (missingNamespaces.length === 0) {
      return;
    }

    if (mountedRef.current) {
      setIsLoading(true);
    }

    try {
      if (
        localeRef.current !==
        DEFAULT_LOCALE
      ) {
        await translationEngine.preloadNamespaces(
          DEFAULT_LOCALE,
          missingNamespaces,
        );
      }

      await translationEngine.preloadNamespaces(
        localeRef.current,
        missingNamespaces,
      );

      if (!mountedRef.current) {
        return;
      }

      const updatedNamespaces = Array.from(
        new Set([
          ...namespacesRef.current,
          ...missingNamespaces,
        ]),
      );

      namespacesRef.current =
        updatedNamespaces;

      setActiveNamespaces(
        updatedNamespaces,
      );

      setTranslationRevision(
        (currentRevision) =>
          currentRevision + 1,
      );
    } catch (error) {
      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        console.error(
          "[EPEW Language Engine] Failed to load namespaces.",
          error,
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsReady(true);
      }
    }
  },
  [],
);

const isNamespaceLoaded = useCallback(
  (
    namespace: string,
  ): boolean => {
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
  [
    locale,
    translationRevision,
  ],
);

  /**
   * ==========================================================
   * Translation Function
   * ==========================================================
   */

  const t =
    useCallback(
      (
        fullKey: string,
        variablesOrOptions?:
          | TranslationVariables
          | TranslationLookupOptions,
      ): string => {
        const options =
          parseTranslationArguments(
            variablesOrOptions,
          );

        const resolved =
          resolveTranslationKey(
            fullKey,
            options.namespace,
          );

        return translationEngine
          .translateSync(
            resolved.key,
            {
              ...options,

              /**
               * A locale explicitly supplied to t() has
               * priority. Otherwise, use the provider locale.
               */
              locale:
                options.locale ??
                locale,

              namespace:
                resolved.namespace,
            },
          );
      },
      [
        activeNamespaces,
        locale,
        translationRevision,
      ],
    );

  /**
   * ==========================================================
   * Locale Formatting
   * ==========================================================
   */

  const language =
    useMemo(
      () =>
        getLanguageDefinition(
          locale,
        ),
      [locale],
    );

  const languages =
    useMemo(
      () =>
        getEnabledLanguages(),
      [],
    );

  const formatDate =
    useCallback(
      (
        value:
          | Date
          | string
          | number,
        options?:
          Intl.DateTimeFormatOptions,
      ): string => {
        const date =
          value instanceof Date
            ? value
            : new Date(value);

        if (
          Number.isNaN(
            date.getTime(),
          )
        ) {
          return "";
        }

        const activeLanguage =
          getLanguageDefinition(
            locale,
          );

        try {
          return new Intl.DateTimeFormat(
            activeLanguage.dateLocale,
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

  const formatNumber =
    useCallback(
      (
        value: number,
        options?:
          Intl.NumberFormatOptions,
      ): string => {
        if (
          !Number.isFinite(value)
        ) {
          return "";
        }

        const activeLanguage =
          getLanguageDefinition(
            locale,
          );

        try {
          return new Intl.NumberFormat(
            activeLanguage.numberLocale,
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

  const formatCurrency =
    useCallback(
      (
        value: number,
        currency?: string,
        options?:
          Intl.NumberFormatOptions,
      ): string => {
        if (
          !Number.isFinite(value)
        ) {
          return "";
        }

        const activeLanguage =
          getLanguageDefinition(
            locale,
          );

        try {
          return new Intl.NumberFormat(
            activeLanguage.currencyLocale,
            {
              style: "currency",
              currency:
                currency ??
                activeLanguage.currency,
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
   * ==========================================================
   * Context Value
   * ==========================================================
   */

  const contextValue =
    useMemo<ExtendedLanguageContextValue>(
      () => ({
        locale,
        language,
        languages,

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
        language,
        languages,
        loadNamespaces,
        locale,
        reloadTranslations,
        setLocale,
        t,
        translationRevision,
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

export default LanguageProvider;