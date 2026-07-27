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
          "home",
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

  return Array.from(new Set(normalized));
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
    variables: value as TranslationVariables,
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
 * becomes:
 *
 * namespace: homepage
 * key: hero.title
 */
function resolveTranslationKey(
  fullKey: string,
  explicitNamespace?: string,
): ResolvedTranslationKey {
  const trimmedKey = fullKey.trim();

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
    trimmedKey.slice(0, firstDotIndex);

  const remainingKey =
    trimmedKey.slice(firstDotIndex + 1);

  const namespaceExistsForAnyLocale =
    translationEngine
      .getSupportedLocales()
      .some((locale) =>
        translationEngine.hasRegisteredNamespace(
          locale,
          possibleNamespace,
        ),
      );

  if (!namespaceExistsForAnyLocale) {
    return {
      namespace:
        DEFAULT_TRANSLATION_NAMESPACE,
      key: trimmedKey,
    };
  }

  return {
    namespace: possibleNamespace,
    key: remainingKey,
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
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang =
    locale;

  /**
   * All currently enabled EPEW languages are written
   * left-to-right.
   *
   * This can later be expanded when RTL languages are added.
   */
  document.documentElement.dir =
    "ltr";
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
}: LanguageProviderProps) {
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

  const [isLoading, setIsLoading] =
    useState(true);

  const [isReady, setIsReady] =
    useState(false);

  /**
   * Revision forces consumers to re-render after a namespace
   * has been refreshed without changing the active locale.
   */
  const [, setRevision] =
    useState(0);

  const localeRef =
    useRef<SupportedLocale>(
      normalizeLocale(initialLocale),
    );

  const namespacesRef =
    useRef<string[]>(
      initialNamespaces,
    );

  const mountedRef =
    useRef(false);

  const initializedRef =
    useRef(false);

  /**
   * Used to prevent an older asynchronous language request
   * from overwriting a newer selection.
   */
  const changeRequestRef =
    useRef(0);

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
        requestedLocale: SupportedLocale,
        options: SetLocaleOptions = {},
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
          if (reloadTranslations) {
            await translationEngine.preloadNamespaces(
              nextLocale,
              namespacesRef.current,
            );
          }

          /**
           * Ignore this result when another language request
           * was started after it.
           */
          if (
            requestId !==
            changeRequestRef.current
          ) {
            return;
          }

          localeRef.current =
            nextLocale;

          if (mountedRef.current) {
            setLocaleState(
              nextLocale,
            );

            setRevision(
              (current) =>
                current + 1,
            );
          }

          updateDocumentLanguage(
            nextLocale,
          );

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

    if (initializedRef.current) {
      return () => {
        mountedRef.current = false;
      };
    }

    initializedRef.current = true;

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
       * LanguageDetector returns the platform default when no
       * stored, profile, or browser preference is available.
       *
       * In that case, respect initialLocale.
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
    };
  }, [
    changeLocale,
    detectBrowserLanguage,
    initialLocale,
    profileLocale,
    useStoredPreference,
  ]);

  /**
   * Load namespaces added through provider props after the
   * initial mount.
   */
  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const missingNamespaces =
      initialNamespaces.filter(
        (namespace) =>
          !namespacesRef.current.includes(
            namespace,
          ),
      );

    if (
      missingNamespaces.length === 0
    ) {
      return;
    }

    async function loadPropNamespaces():
      Promise<void> {
      await translationEngine.preloadNamespaces(
        localeRef.current,
        missingNamespaces,
      );

      if (!mountedRef.current) {
        return;
      }

      setActiveNamespaces(
        (current) =>
          Array.from(
            new Set([
              ...current,
              ...missingNamespaces,
            ]),
          ),
      );

      setRevision(
        (current) =>
          current + 1,
      );
    }

    void loadPropNamespaces();
  }, [initialNamespaces]);

  /**
   * ==========================================================
   * Public Actions
   * ==========================================================
   */

  const setLocale =
    useCallback(
      async (
        nextLocale: SupportedLocale,
        options?: SetLocaleOptions,
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
           * Remove current locale namespaces from cache so the
           * translation files are loaded again.
           */
          for (
            const namespace of
            namespacesRef.current
          ) {
            translationEngine.removeNamespaceFromCache(
              localeRef.current,
              namespace,
            );
          }

          await translationEngine.preloadNamespaces(
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

          setRevision(
            (current) =>
              current + 1,
          );
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

  const loadNamespaces =
    useCallback(
      async (
        requestedNamespaces:
          readonly string[],
      ): Promise<void> => {
        const normalized =
          normalizeNamespaces(
            requestedNamespaces,
          );

        const missingNamespaces =
          normalized.filter(
            (namespace) =>
              !namespacesRef.current.includes(
                namespace,
              ),
          );

        if (
          missingNamespaces.length === 0
        ) {
          return;
        }

        if (mountedRef.current) {
          setIsLoading(true);
        }

        try {
          await translationEngine.preloadNamespaces(
            localeRef.current,
            missingNamespaces,
          );

          if (!mountedRef.current) {
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

          setRevision(
            (current) =>
              current + 1,
          );
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
            setIsReady(true);
          }
        }
      },
      [],
    );

  const isNamespaceLoaded =
    useCallback(
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

        return translationEngine.translateSync(
          resolved.key,
          {
            ...options,
            locale:
              localeRef.current,
            namespace:
              resolved.namespace,
          },
        );
      },
      [],
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
            localeRef.current,
          );

        return new Intl.DateTimeFormat(
          activeLanguage.dateLocale,
          options,
        ).format(date);
      },
      [],
    );

  const formatNumber =
    useCallback(
      (
        value: number,
        options?:
          Intl.NumberFormatOptions,
      ): string => {
        if (!Number.isFinite(value)) {
          return "";
        }

        const activeLanguage =
          getLanguageDefinition(
            localeRef.current,
          );

        return new Intl.NumberFormat(
          activeLanguage.numberLocale,
          options,
        ).format(value);
      },
      [],
    );

  const formatCurrency =
    useCallback(
      (
        value: number,
        currency?: string,
        options?:
          Intl.NumberFormatOptions,
      ): string => {
        if (!Number.isFinite(value)) {
          return "";
        }

        const activeLanguage =
          getLanguageDefinition(
            localeRef.current,
          );

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
      },
      [],
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
      ],
    );

  return (
    <LanguageContext.Provider
      value={contextValue}
    >
      {!isReady &&
      loadingFallback !== undefined
        ? (loadingFallback as ReactNode)
        : children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;