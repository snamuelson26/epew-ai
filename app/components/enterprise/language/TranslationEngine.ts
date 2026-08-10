/**
 * EPEW Global Language Engine
 * ============================================================
 * TranslationEngine.ts
 *
 * Central translation runtime for the EPEW–EDE–IBOS platform.
 *
 * Features:
 * - Lazy namespace loading
 * - In-memory caching
 * - English fallback
 * - Nested translation keys
 * - Variable replacement
 * - Missing-key diagnostics
 * - Translation statistics
 * - Translation health reporting
 * - Namespace preloading
 * - Server-safe and browser-safe execution
 *
 * Translation files are located under:
 *
 * app/messages/
 *   en/
 *   ht/
 *   fr/
 *   es/
 */

import {
  DEFAULT_LOCALE,
  DEFAULT_TRANSLATION_NAMESPACE,
  FALLBACK_LOCALE,
  LANGUAGE_DEFINITIONS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
  type SupportedLocale,
  type TranslationDictionary,
  type TranslationHealthSummary,
  type TranslationLoadResult,
  type TranslationLookupOptions,
  type TranslationResult,
  type TranslationValue,
  type TranslationVariables,
} from "./LocaleTypes";

/**
 * ============================================================
 * Public Types
 * ============================================================
 */

export interface TranslationEngineConfiguration {
  cacheEnabled: boolean;
  fallbackEnabled: boolean;
  diagnosticsEnabled: boolean;
  missingKeyWarningsEnabled: boolean;
  fallbackLocale: SupportedLocale;
  defaultLocale: SupportedLocale;
  defaultNamespace: string;
}

export interface TranslateOptions extends TranslationLookupOptions {
  locale?: SupportedLocale;
  namespace?: string;
}

export interface TranslationNamespaceStatistics {
  locale: SupportedLocale;
  namespace: string;
  cacheHits: number;
  cacheMisses: number;
  translationHits: number;
  translationMisses: number;
  fallbackHits: number;
  loadCount: number;
  loadedAt: number | null;
  lastAccessedAt: number | null;
}

export interface TranslationCacheSnapshot {
  locale: SupportedLocale;
  namespace: string;
  version: number;
  loadedAt: number;
  keyCount: number;
}

export interface MissingTranslationRecord {
  locale: SupportedLocale;
  namespace: string;
  key: string;
  requestedAt: string;
  fallbackAttempted: boolean;
  defaultValueUsed: boolean;
}

export interface TranslationPreloadResult {
  locale: SupportedLocale;
  loadedNamespaces: string[];
  failedNamespaces: string[];
}

export interface TranslationNamespaceHealth {
  locale: SupportedLocale;
  namespace: string;
  totalFallbackKeys: number;
  translatedKeys: number;
  missingKeys: number;
  completionPercentage: number;
}

/**
 * ============================================================
 * Internal Types
 * ============================================================
 */

type NamespaceLoader = () => Promise<TranslationDictionary>;

interface TranslationCacheEntry {
  locale: SupportedLocale;
  namespace: string;
  translations: TranslationDictionary;
  version: number;
  loadedAt: number;
}

interface InternalNamespaceStatistics {
  locale: SupportedLocale;
  namespace: string;
  cacheHits: number;
  cacheMisses: number;
  translationHits: number;
  translationMisses: number;
  fallbackHits: number;
  loadCount: number;
  loadedAt: number | null;
  lastAccessedAt: number | null;
}

/**
 * ============================================================
 * Constants
 * ============================================================
 */

const TRANSLATION_VERSION = 1;

const INITIAL_CONFIGURATION: TranslationEngineConfiguration = {
  cacheEnabled: true,
  fallbackEnabled: true,
  diagnosticsEnabled: process.env.NODE_ENV !== "production",
  missingKeyWarningsEnabled: process.env.NODE_ENV !== "production",
  fallbackLocale: FALLBACK_LOCALE,
  defaultLocale: DEFAULT_LOCALE,
  defaultNamespace: DEFAULT_TRANSLATION_NAMESPACE,
};

/* JSON imports are dynamically typed in this file to avoid module
   augmentation issues. Dynamic imports are cast where used. */

async function loadNamespace(
  locale: SupportedLocale,
  namespace: string,
): Promise<TranslationDictionary> {
  try {
    const module = await import(
      `../../../messages/${locale}/${namespace}.json`
    );

    return module.default as TranslationDictionary;
  } catch {
    if (locale === FALLBACK_LOCALE) {
      return {};
    }

    try {
      const fallbackModule = await import(
        `../../../messages/${FALLBACK_LOCALE}/${namespace}.json`
      );

      return fallbackModule.default as TranslationDictionary;
    } catch {
      return {};
    }
  }
}

/**
 * ============================================================
 * Namespace Registry
 * ============================================================
 *
 * TranslationEngine.ts:
 * app/components/enterprise/language/TranslationEngine.ts
 *
 * Translation files:
 * app/messages/{locale}/{namespace}.json
 *
* Translation files:
* app/components/enterprise/messages/{locale}/{namespace}.json
*
* Correct relative path:
* ../messages/
 */

const namespaceRegistry: Record<
  SupportedLocale,
  Record<string, NamespaceLoader>
> = {
  en: {
    "about": async () => {
      const module = await import(
        "../../../messages/en/about.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-activity-logs": async () => {
      const module = await import(
        "../../../messages/en/admin-activity-logs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-analytics": async () => {
      const module = await import(
        "../../../messages/en/admin-analytics.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-annual-meetings": async () => {
      const module = await import(
        "../../../messages/en/admin-annual-meetings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-audit-center": async () => {
      const module = await import(
        "../../../messages/en/admin-audit-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-automation-center": async () => {
      const module = await import(
        "../../../messages/en/admin-automation-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-categories": async () => {
      const module = await import(
        "../../../messages/en/admin-business-categories.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-openings": async () => {
      const module = await import(
        "../../../messages/en/admin-business-openings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coach-candidates": async () => {
      const module = await import(
        "../../../messages/en/admin-coach-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coaches": async () => {
      const module = await import(
        "../../../messages/en/admin-coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts": async () => {
      const module = await import(
        "../../../messages/en/admin-cohorts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts-by-id": async () => {
      const module = await import(
        "../../../messages/en/admin-cohorts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center": async () => {
      const module = await import(
        "../../../messages/en/admin-communication-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts": async () => {
      const module = await import(
        "../../../messages/en/admin-communication-center-contacts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts-by-id": async () => {
      const module = await import(
        "../../../messages/en/admin-communication-center-contacts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-entities": async () => {
      const module = await import(
        "../../../messages/en/admin-communication-center-entities.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-groups": async () => {
      const module = await import(
        "../../../messages/en/admin-communication-center-groups.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-compliance": async () => {
      const module = await import(
        "../../../messages/en/admin-compliance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-daily-transactions": async () => {
      const module = await import(
        "../../../messages/en/admin-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-dashboard": async () => {
      const module = await import(
        "../../../messages/en/admin-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursement-center": async () => {
      const module = await import(
        "../../../messages/en/admin-disbursement-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursements": async () => {
      const module = await import(
        "../../../messages/en/admin-disbursements.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-documents": async () => {
      const module = await import(
        "../../../messages/en/admin-documents.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ecosystem-dashboard": async () => {
      const module = await import(
        "../../../messages/en/admin-ecosystem-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneur-qualification": async () => {
      const module = await import(
        "../../../messages/en/admin-entrepreneur-qualification.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/en/admin-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/en/admin-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-finance": async () => {
      const module = await import(
        "../../../messages/en/admin-finance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funded-businesses": async () => {
      const module = await import(
        "../../../messages/en/admin-funded-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-allocation": async () => {
      const module = await import(
        "../../../messages/en/admin-funding-allocation.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-calendar": async () => {
      const module = await import(
        "../../../messages/en/admin-funding-calendar.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-committee": async () => {
      const module = await import(
        "../../../messages/en/admin-funding-committee.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-queue": async () => {
      const module = await import(
        "../../../messages/en/admin-funding-queue.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-readiness": async () => {
      const module = await import(
        "../../../messages/en/admin-funding-readiness.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-certificate-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-designer": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-certificate-center-designer.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-generator": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-certificate-center-generator.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-event-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-event-center-sessions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-event-center-sessions-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-guests": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-event-center-sessions-by-id-guests.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-participants": async () => {
      const module = await import(
        "../../../messages/en/admin-ibos-centers-event-center-sessions-by-id-participants.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-login": async () => {
      const module = await import(
        "../../../messages/en/admin-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-marketplace": async () => {
      const module = await import(
        "../../../messages/en/admin-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-messages": async () => {
      const module = await import(
        "../../../messages/en/admin-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-notifications": async () => {
      const module = await import(
        "../../../messages/en/admin-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-partner-candidates": async () => {
      const module = await import(
        "../../../messages/en/admin-partner-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-quarterly-reporting": async () => {
      const module = await import(
        "../../../messages/en/admin-quarterly-reporting.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-reports": async () => {
      const module = await import(
        "../../../messages/en/admin-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-settings": async () => {
      const module = await import(
        "../../../messages/en/admin-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-support-tickets": async () => {
      const module = await import(
        "../../../messages/en/admin-support-tickets.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-supporters": async () => {
      const module = await import(
        "../../../messages/en/admin-supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-users": async () => {
      const module = await import(
        "../../../messages/en/admin-users.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-vendors": async () => {
      const module = await import(
        "../../../messages/en/admin-vendors.json"
      );

      return module.default as TranslationDictionary;
    },

    "blogs": async () => {
      const module = await import(
        "../../../messages/en/blogs.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-by-id": async () => {
      const module = await import(
        "../../../messages/en/business-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-directory": async () => {
      const module = await import(
        "../../../messages/en/business-directory.json"
      );

      return module.default as TranslationDictionary;
    },

    "campaign-by-slug": async () => {
      const module = await import(
        "../../../messages/en/campaign-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches": async () => {
      const module = await import(
        "../../../messages/en/coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-apply": async () => {
      const module = await import(
        "../../../messages/en/coaches-apply.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-dashboard": async () => {
      const module = await import(
        "../../../messages/en/coaches-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/en/coaches-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/en/coaches-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-layout": async () => {
      const module = await import(
        "../../../messages/en/coaches-layout.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-login": async () => {
      const module = await import(
        "../../../messages/en/coaches-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-register": async () => {
      const module = await import(
        "../../../messages/en/coaches-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "common": async () => {
      const module = await import(
        "../../../messages/en/common.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration": async () => {
      const module = await import(
        "../../../messages/en/community-registration.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration-manage-by-token": async () => {
      const module = await import(
        "../../../messages/en/community-registration-manage-by-token.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-business-profile": async () => {
      const module = await import(
        "../../../messages/en/dashboard-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-funding-pitch": async () => {
      const module = await import(
        "../../../messages/en/dashboard-funding-pitch.json"
      );

      return module.default as TranslationDictionary;
    },

    "disclaimer": async () => {
      const module = await import(
        "../../../messages/en/disclaimer.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneur-list": async () => {
      const module = await import(
        "../../../messages/en/entrepreneur-list.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-assigned-coach": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-assigned-coach.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-presentation": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-business-presentation.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-profile": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-daily-transactions": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-dashboard": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-enroll": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-enroll.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-forgot-password": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-forgot-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-funding-status": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-funding-status.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-login": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-onboarding-questionnaire": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-onboarding-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-questionnaire": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reports": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reset-password": async () => {
      const module = await import(
        "../../../messages/en/entrepreneurs-reset-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "epew": async () => {
      const module = await import(
        "../../../messages/en/epew.json"
      );

      return module.default as TranslationDictionary;
    },

    "footer": async () => {
      const module = await import(
        "../../../messages/en/footer.json"
      );

      return module.default as TranslationDictionary;
    },

    "homepage": async () => {
      const module = await import(
        "../../../messages/en/homepage.json"
      );

      return module.default as TranslationDictionary;
    },

    "how-it-works": async () => {
      const module = await import(
        "../../../messages/en/how-it-works.json"
      );

      return module.default as TranslationDictionary;
    },

    "professional-support": async () => {
      const module = await import(
        "../../../messages/en/professional-support.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners": async () => {
      const module = await import(
        "../../../messages/en/partners.json"
      );

      return module.default as TranslationDictionary;
    },

    "legal": async () => {
      const module = await import(
        "../../../messages/en/legal.json"
      );

      return module.default as TranslationDictionary;
    },

    "login": async () => {
      const module = await import(
        "../../../messages/en/login.json"
      );

      return module.default as TranslationDictionary;
    },

    "marketplace": async () => {
      const module = await import(
        "../../../messages/en/marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "navigation": async () => {
      const module = await import(
        "../../../messages/en/navigation.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners-register": async () => {
      const module = await import(
        "../../../messages/en/partners-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "privacy-policy": async () => {
      const module = await import(
        "../../../messages/en/privacy-policy.json"
      );

      return module.default as TranslationDictionary;
    },

    "register": async () => {
      const module = await import(
        "../../../messages/en/register.json"
      );

      return module.default as TranslationDictionary;
    },

    "resources-videos": async () => {
      const module = await import(
        "../../../messages/en/resources-videos.json"
      );

      return module.default as TranslationDictionary;
    },

    "select-portal": async () => {
      const module = await import(
        "../../../messages/en/select-portal.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug": async () => {
      const module = await import(
        "../../../messages/en/support-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-checkout": async () => {
      const module = await import(
        "../../../messages/en/support-by-slug-checkout.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-agreement": async () => {
      const module = await import(
        "../../../messages/en/support-by-slug-participation-agreement.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-submitted": async () => {
      const module = await import(
        "../../../messages/en/support-by-slug-participation-submitted.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-id": async () => {
      const module = await import(
        "../../../messages/en/support-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-register": async () => {
      const module = await import(
        "../../../messages/en/support-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters": async () => {
      const module = await import(
        "../../../messages/en/supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-contribution-plans": async () => {
      const module = await import(
        "../../../messages/en/supporters-contribution-plans.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-dashboard": async () => {
      const module = await import(
        "../../../messages/en/supporters-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/en/supporters-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/en/supporters-entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-settings": async () => {
      const module = await import(
        "../../../messages/en/supporters-entrepreneurs-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-impact-center": async () => {
      const module = await import(
        "../../../messages/en/supporters-impact-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-learn": async () => {
      const module = await import(
        "../../../messages/en/supporters-learn.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-login": async () => {
      const module = await import(
        "../../../messages/en/supporters-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-marketplace": async () => {
      const module = await import(
        "../../../messages/en/supporters-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-messages": async () => {
      const module = await import(
        "../../../messages/en/supporters-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-my-supported-businesses": async () => {
      const module = await import(
        "../../../messages/en/supporters-my-supported-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-notifications": async () => {
      const module = await import(
        "../../../messages/en/supporters-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-quarterly-reports": async () => {
      const module = await import(
        "../../../messages/en/supporters-quarterly-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-register": async () => {
      const module = await import(
        "../../../messages/en/supporters-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-reports": async () => {
      const module = await import(
        "../../../messages/en/supporters-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-settings": async () => {
      const module = await import(
        "../../../messages/en/supporters-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-success-stories": async () => {
      const module = await import(
        "../../../messages/en/supporters-success-stories.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-update-password": async () => {
      const module = await import(
        "../../../messages/en/supporters-update-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "terms-of-use": async () => {
      const module = await import(
        "../../../messages/en/terms-of-use.json"
      );

      return module.default as TranslationDictionary;
    },

    "videos": async () => {
      const module = await import(
        "../../../messages/en/videos.json"
      );

      return module.default as TranslationDictionary;
    },

  },
  ht: {
    "about": async () => {
      const module = await import(
        "../../../messages/ht/about.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-activity-logs": async () => {
      const module = await import(
        "../../../messages/ht/admin-activity-logs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-analytics": async () => {
      const module = await import(
        "../../../messages/ht/admin-analytics.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-annual-meetings": async () => {
      const module = await import(
        "../../../messages/ht/admin-annual-meetings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-audit-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-audit-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-automation-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-automation-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-categories": async () => {
      const module = await import(
        "../../../messages/ht/admin-business-categories.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-openings": async () => {
      const module = await import(
        "../../../messages/ht/admin-business-openings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coach-candidates": async () => {
      const module = await import(
        "../../../messages/ht/admin-coach-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coaches": async () => {
      const module = await import(
        "../../../messages/ht/admin-coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts": async () => {
      const module = await import(
        "../../../messages/ht/admin-cohorts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts-by-id": async () => {
      const module = await import(
        "../../../messages/ht/admin-cohorts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-communication-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts": async () => {
      const module = await import(
        "../../../messages/ht/admin-communication-center-contacts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts-by-id": async () => {
      const module = await import(
        "../../../messages/ht/admin-communication-center-contacts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-entities": async () => {
      const module = await import(
        "../../../messages/ht/admin-communication-center-entities.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-groups": async () => {
      const module = await import(
        "../../../messages/ht/admin-communication-center-groups.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-compliance": async () => {
      const module = await import(
        "../../../messages/ht/admin-compliance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-daily-transactions": async () => {
      const module = await import(
        "../../../messages/ht/admin-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-dashboard": async () => {
      const module = await import(
        "../../../messages/ht/admin-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursement-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-disbursement-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursements": async () => {
      const module = await import(
        "../../../messages/ht/admin-disbursements.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-documents": async () => {
      const module = await import(
        "../../../messages/ht/admin-documents.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ecosystem-dashboard": async () => {
      const module = await import(
        "../../../messages/ht/admin-ecosystem-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneur-qualification": async () => {
      const module = await import(
        "../../../messages/ht/admin-entrepreneur-qualification.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/ht/admin-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/ht/admin-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-finance": async () => {
      const module = await import(
        "../../../messages/ht/admin-finance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funded-businesses": async () => {
      const module = await import(
        "../../../messages/ht/admin-funded-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-allocation": async () => {
      const module = await import(
        "../../../messages/ht/admin-funding-allocation.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-calendar": async () => {
      const module = await import(
        "../../../messages/ht/admin-funding-calendar.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-committee": async () => {
      const module = await import(
        "../../../messages/ht/admin-funding-committee.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-queue": async () => {
      const module = await import(
        "../../../messages/ht/admin-funding-queue.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-readiness": async () => {
      const module = await import(
        "../../../messages/ht/admin-funding-readiness.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-certificate-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-designer": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-certificate-center-designer.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-generator": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-certificate-center-generator.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-event-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-event-center-sessions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-event-center-sessions-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-guests": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-event-center-sessions-by-id-guests.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-participants": async () => {
      const module = await import(
        "../../../messages/ht/admin-ibos-centers-event-center-sessions-by-id-participants.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-login": async () => {
      const module = await import(
        "../../../messages/ht/admin-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-marketplace": async () => {
      const module = await import(
        "../../../messages/ht/admin-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-messages": async () => {
      const module = await import(
        "../../../messages/ht/admin-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-notifications": async () => {
      const module = await import(
        "../../../messages/ht/admin-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-partner-candidates": async () => {
      const module = await import(
        "../../../messages/ht/admin-partner-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-quarterly-reporting": async () => {
      const module = await import(
        "../../../messages/ht/admin-quarterly-reporting.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-reports": async () => {
      const module = await import(
        "../../../messages/ht/admin-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-settings": async () => {
      const module = await import(
        "../../../messages/ht/admin-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-support-tickets": async () => {
      const module = await import(
        "../../../messages/ht/admin-support-tickets.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-supporters": async () => {
      const module = await import(
        "../../../messages/ht/admin-supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-users": async () => {
      const module = await import(
        "../../../messages/ht/admin-users.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-vendors": async () => {
      const module = await import(
        "../../../messages/ht/admin-vendors.json"
      );

      return module.default as TranslationDictionary;
    },

    "blogs": async () => {
      const module = await import(
        "../../../messages/ht/blogs.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-by-id": async () => {
      const module = await import(
        "../../../messages/ht/business-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-directory": async () => {
      const module = await import(
        "../../../messages/ht/business-directory.json"
      );

      return module.default as TranslationDictionary;
    },

    "campaign-by-slug": async () => {
      const module = await import(
        "../../../messages/ht/campaign-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches": async () => {
      const module = await import(
        "../../../messages/ht/coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-apply": async () => {
      const module = await import(
        "../../../messages/ht/coaches-apply.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-dashboard": async () => {
      const module = await import(
        "../../../messages/ht/coaches-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/ht/coaches-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/ht/coaches-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-layout": async () => {
      const module = await import(
        "../../../messages/ht/coaches-layout.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-login": async () => {
      const module = await import(
        "../../../messages/ht/coaches-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-register": async () => {
      const module = await import(
        "../../../messages/ht/coaches-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "common": async () => {
      const module = await import(
        "../../../messages/ht/common.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration": async () => {
      const module = await import(
        "../../../messages/ht/community-registration.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration-manage-by-token": async () => {
      const module = await import(
        "../../../messages/ht/community-registration-manage-by-token.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-business-profile": async () => {
      const module = await import(
        "../../../messages/ht/dashboard-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-funding-pitch": async () => {
      const module = await import(
        "../../../messages/ht/dashboard-funding-pitch.json"
      );

      return module.default as TranslationDictionary;
    },

    "disclaimer": async () => {
      const module = await import(
        "../../../messages/ht/disclaimer.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneur-list": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneur-list.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-assigned-coach": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-assigned-coach.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-presentation": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-business-presentation.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-profile": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-daily-transactions": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-dashboard": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-enroll": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-enroll.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-forgot-password": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-forgot-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-funding-status": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-funding-status.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-login": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-onboarding-questionnaire": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-onboarding-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-questionnaire": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reports": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reset-password": async () => {
      const module = await import(
        "../../../messages/ht/entrepreneurs-reset-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "epew": async () => {
      const module = await import(
        "../../../messages/ht/epew.json"
      );

      return module.default as TranslationDictionary;
    },

    "footer": async () => {
      const module = await import(
        "../../../messages/ht/footer.json"
      );

      return module.default as TranslationDictionary;
    },

    "homepage": async () => {
      const module = await import(
        "../../../messages/ht/homepage.json"
      );

      return module.default as TranslationDictionary;
    },

    "how-it-works": async () => {
      const module = await import(
        "../../../messages/ht/how-it-works.json"
      );

      return module.default as TranslationDictionary;
    },

    "professional-support": async () => {
      const module = await import(
        "../../../messages/ht/professional-support.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners": async () => {
      const module = await import(
        "../../../messages/ht/partners.json"
      );

      return module.default as TranslationDictionary;
    },

    "legal": async () => {
      const module = await import(
        "../../../messages/ht/legal.json"
      );

      return module.default as TranslationDictionary;
    },

    "login": async () => {
      const module = await import(
        "../../../messages/ht/login.json"
      );

      return module.default as TranslationDictionary;
    },

    "marketplace": async () => {
      const module = await import(
        "../../../messages/ht/marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "navigation": async () => {
      const module = await import(
        "../../../messages/ht/navigation.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners-register": async () => {
      const module = await import(
        "../../../messages/ht/partners-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "privacy-policy": async () => {
      const module = await import(
        "../../../messages/ht/privacy-policy.json"
      );

      return module.default as TranslationDictionary;
    },

    "register": async () => {
      const module = await import(
        "../../../messages/ht/register.json"
      );

      return module.default as TranslationDictionary;
    },

    "resources-videos": async () => {
      const module = await import(
        "../../../messages/ht/resources-videos.json"
      );

      return module.default as TranslationDictionary;
    },

    "select-portal": async () => {
      const module = await import(
        "../../../messages/ht/select-portal.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug": async () => {
      const module = await import(
        "../../../messages/ht/support-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-checkout": async () => {
      const module = await import(
        "../../../messages/ht/support-by-slug-checkout.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-agreement": async () => {
      const module = await import(
        "../../../messages/ht/support-by-slug-participation-agreement.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-submitted": async () => {
      const module = await import(
        "../../../messages/ht/support-by-slug-participation-submitted.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-id": async () => {
      const module = await import(
        "../../../messages/ht/support-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-register": async () => {
      const module = await import(
        "../../../messages/ht/support-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters": async () => {
      const module = await import(
        "../../../messages/ht/supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-contribution-plans": async () => {
      const module = await import(
        "../../../messages/ht/supporters-contribution-plans.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-dashboard": async () => {
      const module = await import(
        "../../../messages/ht/supporters-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/ht/supporters-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/ht/supporters-entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-settings": async () => {
      const module = await import(
        "../../../messages/ht/supporters-entrepreneurs-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-impact-center": async () => {
      const module = await import(
        "../../../messages/ht/supporters-impact-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-learn": async () => {
      const module = await import(
        "../../../messages/ht/supporters-learn.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-login": async () => {
      const module = await import(
        "../../../messages/ht/supporters-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-marketplace": async () => {
      const module = await import(
        "../../../messages/ht/supporters-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-messages": async () => {
      const module = await import(
        "../../../messages/ht/supporters-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-my-supported-businesses": async () => {
      const module = await import(
        "../../../messages/ht/supporters-my-supported-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-notifications": async () => {
      const module = await import(
        "../../../messages/ht/supporters-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-quarterly-reports": async () => {
      const module = await import(
        "../../../messages/ht/supporters-quarterly-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-register": async () => {
      const module = await import(
        "../../../messages/ht/supporters-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-reports": async () => {
      const module = await import(
        "../../../messages/ht/supporters-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-settings": async () => {
      const module = await import(
        "../../../messages/ht/supporters-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-success-stories": async () => {
      const module = await import(
        "../../../messages/ht/supporters-success-stories.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-update-password": async () => {
      const module = await import(
        "../../../messages/ht/supporters-update-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "terms-of-use": async () => {
      const module = await import(
        "../../../messages/ht/terms-of-use.json"
      );

      return module.default as TranslationDictionary;
    },

    "videos": async () => {
      const module = await import(
        "../../../messages/ht/videos.json"
      );

      return module.default as TranslationDictionary;
    },

  },
  fr: {
    "about": async () => {
      const module = await import(
        "../../../messages/fr/about.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-activity-logs": async () => {
      const module = await import(
        "../../../messages/fr/admin-activity-logs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-analytics": async () => {
      const module = await import(
        "../../../messages/fr/admin-analytics.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-annual-meetings": async () => {
      const module = await import(
        "../../../messages/fr/admin-annual-meetings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-audit-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-audit-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-automation-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-automation-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-categories": async () => {
      const module = await import(
        "../../../messages/fr/admin-business-categories.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-openings": async () => {
      const module = await import(
        "../../../messages/fr/admin-business-openings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coach-candidates": async () => {
      const module = await import(
        "../../../messages/fr/admin-coach-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coaches": async () => {
      const module = await import(
        "../../../messages/fr/admin-coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts": async () => {
      const module = await import(
        "../../../messages/fr/admin-cohorts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts-by-id": async () => {
      const module = await import(
        "../../../messages/fr/admin-cohorts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-communication-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts": async () => {
      const module = await import(
        "../../../messages/fr/admin-communication-center-contacts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts-by-id": async () => {
      const module = await import(
        "../../../messages/fr/admin-communication-center-contacts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-entities": async () => {
      const module = await import(
        "../../../messages/fr/admin-communication-center-entities.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-groups": async () => {
      const module = await import(
        "../../../messages/fr/admin-communication-center-groups.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-compliance": async () => {
      const module = await import(
        "../../../messages/fr/admin-compliance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-daily-transactions": async () => {
      const module = await import(
        "../../../messages/fr/admin-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-dashboard": async () => {
      const module = await import(
        "../../../messages/fr/admin-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursement-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-disbursement-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursements": async () => {
      const module = await import(
        "../../../messages/fr/admin-disbursements.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-documents": async () => {
      const module = await import(
        "../../../messages/fr/admin-documents.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ecosystem-dashboard": async () => {
      const module = await import(
        "../../../messages/fr/admin-ecosystem-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneur-qualification": async () => {
      const module = await import(
        "../../../messages/fr/admin-entrepreneur-qualification.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/fr/admin-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/fr/admin-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-finance": async () => {
      const module = await import(
        "../../../messages/fr/admin-finance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funded-businesses": async () => {
      const module = await import(
        "../../../messages/fr/admin-funded-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-allocation": async () => {
      const module = await import(
        "../../../messages/fr/admin-funding-allocation.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-calendar": async () => {
      const module = await import(
        "../../../messages/fr/admin-funding-calendar.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-committee": async () => {
      const module = await import(
        "../../../messages/fr/admin-funding-committee.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-queue": async () => {
      const module = await import(
        "../../../messages/fr/admin-funding-queue.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-readiness": async () => {
      const module = await import(
        "../../../messages/fr/admin-funding-readiness.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-certificate-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-designer": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-certificate-center-designer.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-generator": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-certificate-center-generator.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-event-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-event-center-sessions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-event-center-sessions-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-guests": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-event-center-sessions-by-id-guests.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-participants": async () => {
      const module = await import(
        "../../../messages/fr/admin-ibos-centers-event-center-sessions-by-id-participants.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-login": async () => {
      const module = await import(
        "../../../messages/fr/admin-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-marketplace": async () => {
      const module = await import(
        "../../../messages/fr/admin-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-messages": async () => {
      const module = await import(
        "../../../messages/fr/admin-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-notifications": async () => {
      const module = await import(
        "../../../messages/fr/admin-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-partner-candidates": async () => {
      const module = await import(
        "../../../messages/fr/admin-partner-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-quarterly-reporting": async () => {
      const module = await import(
        "../../../messages/fr/admin-quarterly-reporting.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-reports": async () => {
      const module = await import(
        "../../../messages/fr/admin-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-settings": async () => {
      const module = await import(
        "../../../messages/fr/admin-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-support-tickets": async () => {
      const module = await import(
        "../../../messages/fr/admin-support-tickets.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-supporters": async () => {
      const module = await import(
        "../../../messages/fr/admin-supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-users": async () => {
      const module = await import(
        "../../../messages/fr/admin-users.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-vendors": async () => {
      const module = await import(
        "../../../messages/fr/admin-vendors.json"
      );

      return module.default as TranslationDictionary;
    },

    "blogs": async () => {
      const module = await import(
        "../../../messages/fr/blogs.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-by-id": async () => {
      const module = await import(
        "../../../messages/fr/business-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-directory": async () => {
      const module = await import(
        "../../../messages/fr/business-directory.json"
      );

      return module.default as TranslationDictionary;
    },

    "campaign-by-slug": async () => {
      const module = await import(
        "../../../messages/fr/campaign-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches": async () => {
      const module = await import(
        "../../../messages/fr/coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-apply": async () => {
      const module = await import(
        "../../../messages/fr/coaches-apply.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-dashboard": async () => {
      const module = await import(
        "../../../messages/fr/coaches-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/fr/coaches-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/fr/coaches-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-layout": async () => {
      const module = await import(
        "../../../messages/fr/coaches-layout.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-login": async () => {
      const module = await import(
        "../../../messages/fr/coaches-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-register": async () => {
      const module = await import(
        "../../../messages/fr/coaches-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "common": async () => {
      const module = await import(
        "../../../messages/fr/common.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration": async () => {
      const module = await import(
        "../../../messages/fr/community-registration.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration-manage-by-token": async () => {
      const module = await import(
        "../../../messages/fr/community-registration-manage-by-token.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-business-profile": async () => {
      const module = await import(
        "../../../messages/fr/dashboard-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-funding-pitch": async () => {
      const module = await import(
        "../../../messages/fr/dashboard-funding-pitch.json"
      );

      return module.default as TranslationDictionary;
    },

    "disclaimer": async () => {
      const module = await import(
        "../../../messages/fr/disclaimer.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneur-list": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneur-list.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-assigned-coach": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-assigned-coach.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-presentation": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-business-presentation.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-profile": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-daily-transactions": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-dashboard": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-enroll": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-enroll.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-forgot-password": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-forgot-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-funding-status": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-funding-status.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-login": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-onboarding-questionnaire": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-onboarding-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-questionnaire": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reports": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reset-password": async () => {
      const module = await import(
        "../../../messages/fr/entrepreneurs-reset-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "epew": async () => {
      const module = await import(
        "../../../messages/fr/epew.json"
      );

      return module.default as TranslationDictionary;
    },

    "footer": async () => {
      const module = await import(
        "../../../messages/fr/footer.json"
      );

      return module.default as TranslationDictionary;
    },

    "homepage": async () => {
      const module = await import(
        "../../../messages/fr/homepage.json"
      );

      return module.default as TranslationDictionary;
    },

    "how-it-works": async () => {
      const module = await import(
        "../../../messages/fr/how-it-works.json"
      );

      return module.default as TranslationDictionary;
    },

    "professional-support": async () => {
      const module = await import(
        "../../../messages/fr/professional-support.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners": async () => {
      const module = await import(
        "../../../messages/fr/partners.json"
      );

      return module.default as TranslationDictionary;
    },

    "legal": async () => {
      const module = await import(
        "../../../messages/fr/legal.json"
      );

      return module.default as TranslationDictionary;
    },

    "login": async () => {
      const module = await import(
        "../../../messages/fr/login.json"
      );

      return module.default as TranslationDictionary;
    },

    "marketplace": async () => {
      const module = await import(
        "../../../messages/fr/marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "navigation": async () => {
      const module = await import(
        "../../../messages/fr/navigation.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners-register": async () => {
      const module = await import(
        "../../../messages/fr/partners-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "privacy-policy": async () => {
      const module = await import(
        "../../../messages/fr/privacy-policy.json"
      );

      return module.default as TranslationDictionary;
    },

    "register": async () => {
      const module = await import(
        "../../../messages/fr/register.json"
      );

      return module.default as TranslationDictionary;
    },

    "resources-videos": async () => {
      const module = await import(
        "../../../messages/fr/resources-videos.json"
      );

      return module.default as TranslationDictionary;
    },

    "select-portal": async () => {
      const module = await import(
        "../../../messages/fr/select-portal.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug": async () => {
      const module = await import(
        "../../../messages/fr/support-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-checkout": async () => {
      const module = await import(
        "../../../messages/fr/support-by-slug-checkout.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-agreement": async () => {
      const module = await import(
        "../../../messages/fr/support-by-slug-participation-agreement.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-submitted": async () => {
      const module = await import(
        "../../../messages/fr/support-by-slug-participation-submitted.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-id": async () => {
      const module = await import(
        "../../../messages/fr/support-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-register": async () => {
      const module = await import(
        "../../../messages/fr/support-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters": async () => {
      const module = await import(
        "../../../messages/fr/supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-contribution-plans": async () => {
      const module = await import(
        "../../../messages/fr/supporters-contribution-plans.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-dashboard": async () => {
      const module = await import(
        "../../../messages/fr/supporters-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/fr/supporters-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/fr/supporters-entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-settings": async () => {
      const module = await import(
        "../../../messages/fr/supporters-entrepreneurs-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-impact-center": async () => {
      const module = await import(
        "../../../messages/fr/supporters-impact-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-learn": async () => {
      const module = await import(
        "../../../messages/fr/supporters-learn.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-login": async () => {
      const module = await import(
        "../../../messages/fr/supporters-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-marketplace": async () => {
      const module = await import(
        "../../../messages/fr/supporters-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-messages": async () => {
      const module = await import(
        "../../../messages/fr/supporters-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-my-supported-businesses": async () => {
      const module = await import(
        "../../../messages/fr/supporters-my-supported-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-notifications": async () => {
      const module = await import(
        "../../../messages/fr/supporters-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-quarterly-reports": async () => {
      const module = await import(
        "../../../messages/fr/supporters-quarterly-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-register": async () => {
      const module = await import(
        "../../../messages/fr/supporters-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-reports": async () => {
      const module = await import(
        "../../../messages/fr/supporters-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-settings": async () => {
      const module = await import(
        "../../../messages/fr/supporters-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-success-stories": async () => {
      const module = await import(
        "../../../messages/fr/supporters-success-stories.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-update-password": async () => {
      const module = await import(
        "../../../messages/fr/supporters-update-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "terms-of-use": async () => {
      const module = await import(
        "../../../messages/fr/terms-of-use.json"
      );

      return module.default as TranslationDictionary;
    },

    "videos": async () => {
      const module = await import(
        "../../../messages/fr/videos.json"
      );

      return module.default as TranslationDictionary;
    },

  },
  es: {
    "about": async () => {
      const module = await import(
        "../../../messages/es/about.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-activity-logs": async () => {
      const module = await import(
        "../../../messages/es/admin-activity-logs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-analytics": async () => {
      const module = await import(
        "../../../messages/es/admin-analytics.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-annual-meetings": async () => {
      const module = await import(
        "../../../messages/es/admin-annual-meetings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-audit-center": async () => {
      const module = await import(
        "../../../messages/es/admin-audit-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-automation-center": async () => {
      const module = await import(
        "../../../messages/es/admin-automation-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-categories": async () => {
      const module = await import(
        "../../../messages/es/admin-business-categories.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-business-openings": async () => {
      const module = await import(
        "../../../messages/es/admin-business-openings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coach-candidates": async () => {
      const module = await import(
        "../../../messages/es/admin-coach-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-coaches": async () => {
      const module = await import(
        "../../../messages/es/admin-coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts": async () => {
      const module = await import(
        "../../../messages/es/admin-cohorts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-cohorts-by-id": async () => {
      const module = await import(
        "../../../messages/es/admin-cohorts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center": async () => {
      const module = await import(
        "../../../messages/es/admin-communication-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts": async () => {
      const module = await import(
        "../../../messages/es/admin-communication-center-contacts.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-contacts-by-id": async () => {
      const module = await import(
        "../../../messages/es/admin-communication-center-contacts-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-entities": async () => {
      const module = await import(
        "../../../messages/es/admin-communication-center-entities.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-communication-center-groups": async () => {
      const module = await import(
        "../../../messages/es/admin-communication-center-groups.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-compliance": async () => {
      const module = await import(
        "../../../messages/es/admin-compliance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-daily-transactions": async () => {
      const module = await import(
        "../../../messages/es/admin-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-dashboard": async () => {
      const module = await import(
        "../../../messages/es/admin-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursement-center": async () => {
      const module = await import(
        "../../../messages/es/admin-disbursement-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-disbursements": async () => {
      const module = await import(
        "../../../messages/es/admin-disbursements.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-documents": async () => {
      const module = await import(
        "../../../messages/es/admin-documents.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ecosystem-dashboard": async () => {
      const module = await import(
        "../../../messages/es/admin-ecosystem-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneur-qualification": async () => {
      const module = await import(
        "../../../messages/es/admin-entrepreneur-qualification.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/es/admin-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/es/admin-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-finance": async () => {
      const module = await import(
        "../../../messages/es/admin-finance.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funded-businesses": async () => {
      const module = await import(
        "../../../messages/es/admin-funded-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-allocation": async () => {
      const module = await import(
        "../../../messages/es/admin-funding-allocation.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-calendar": async () => {
      const module = await import(
        "../../../messages/es/admin-funding-calendar.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-committee": async () => {
      const module = await import(
        "../../../messages/es/admin-funding-committee.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-queue": async () => {
      const module = await import(
        "../../../messages/es/admin-funding-queue.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-funding-readiness": async () => {
      const module = await import(
        "../../../messages/es/admin-funding-readiness.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-certificate-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-designer": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-certificate-center-designer.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-certificate-center-generator": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-certificate-center-generator.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-event-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-event-center-sessions.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-event-center-sessions-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-guests": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-event-center-sessions-by-id-guests.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-ibos-centers-event-center-sessions-by-id-participants": async () => {
      const module = await import(
        "../../../messages/es/admin-ibos-centers-event-center-sessions-by-id-participants.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-login": async () => {
      const module = await import(
        "../../../messages/es/admin-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-marketplace": async () => {
      const module = await import(
        "../../../messages/es/admin-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-messages": async () => {
      const module = await import(
        "../../../messages/es/admin-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-notifications": async () => {
      const module = await import(
        "../../../messages/es/admin-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-partner-candidates": async () => {
      const module = await import(
        "../../../messages/es/admin-partner-candidates.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-quarterly-reporting": async () => {
      const module = await import(
        "../../../messages/es/admin-quarterly-reporting.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-reports": async () => {
      const module = await import(
        "../../../messages/es/admin-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-settings": async () => {
      const module = await import(
        "../../../messages/es/admin-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-support-tickets": async () => {
      const module = await import(
        "../../../messages/es/admin-support-tickets.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-supporters": async () => {
      const module = await import(
        "../../../messages/es/admin-supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-users": async () => {
      const module = await import(
        "../../../messages/es/admin-users.json"
      );

      return module.default as TranslationDictionary;
    },

    "admin-vendors": async () => {
      const module = await import(
        "../../../messages/es/admin-vendors.json"
      );

      return module.default as TranslationDictionary;
    },

    "blogs": async () => {
      const module = await import(
        "../../../messages/es/blogs.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-by-id": async () => {
      const module = await import(
        "../../../messages/es/business-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "business-directory": async () => {
      const module = await import(
        "../../../messages/es/business-directory.json"
      );

      return module.default as TranslationDictionary;
    },

    "campaign-by-slug": async () => {
      const module = await import(
        "../../../messages/es/campaign-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches": async () => {
      const module = await import(
        "../../../messages/es/coaches.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-apply": async () => {
      const module = await import(
        "../../../messages/es/coaches-apply.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-dashboard": async () => {
      const module = await import(
        "../../../messages/es/coaches-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/es/coaches-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-entrepreneurs-by-id": async () => {
      const module = await import(
        "../../../messages/es/coaches-entrepreneurs-by-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-layout": async () => {
      const module = await import(
        "../../../messages/es/coaches-layout.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-login": async () => {
      const module = await import(
        "../../../messages/es/coaches-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "coaches-register": async () => {
      const module = await import(
        "../../../messages/es/coaches-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "common": async () => {
      const module = await import(
        "../../../messages/es/common.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration": async () => {
      const module = await import(
        "../../../messages/es/community-registration.json"
      );

      return module.default as TranslationDictionary;
    },

    "community-registration-manage-by-token": async () => {
      const module = await import(
        "../../../messages/es/community-registration-manage-by-token.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-business-profile": async () => {
      const module = await import(
        "../../../messages/es/dashboard-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "dashboard-funding-pitch": async () => {
      const module = await import(
        "../../../messages/es/dashboard-funding-pitch.json"
      );

      return module.default as TranslationDictionary;
    },

    "disclaimer": async () => {
      const module = await import(
        "../../../messages/es/disclaimer.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneur-list": async () => {
      const module = await import(
        "../../../messages/es/entrepreneur-list.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-assigned-coach": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-assigned-coach.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-presentation": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-business-presentation.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-business-profile": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-business-profile.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-daily-transactions": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-daily-transactions.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-dashboard": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-enroll": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-enroll.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-forgot-password": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-forgot-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-funding-status": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-funding-status.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-login": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-onboarding-questionnaire": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-onboarding-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-questionnaire": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-questionnaire.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reports": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "entrepreneurs-reset-password": async () => {
      const module = await import(
        "../../../messages/es/entrepreneurs-reset-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "epew": async () => {
      const module = await import(
        "../../../messages/es/epew.json"
      );

      return module.default as TranslationDictionary;
    },

    "footer": async () => {
      const module = await import(
        "../../../messages/es/footer.json"
      );

      return module.default as TranslationDictionary;
    },

    "homepage": async () => {
      const module = await import(
        "../../../messages/es/homepage.json"
      );

      return module.default as TranslationDictionary;
    },

    "how-it-works": async () => {
      const module = await import(
        "../../../messages/es/how-it-works.json"
      );

      return module.default as TranslationDictionary;
    },

    "professional-support": async () => {
      const module = await import(
        "../../../messages/es/professional-support.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners": async () => {
      const module = await import(
        "../../../messages/es/partners.json"
      );

      return module.default as TranslationDictionary;
    },

    "legal": async () => {
      const module = await import(
        "../../../messages/es/legal.json"
      );

      return module.default as TranslationDictionary;
    },

    "login": async () => {
      const module = await import(
        "../../../messages/es/login.json"
      );

      return module.default as TranslationDictionary;
    },

    "marketplace": async () => {
      const module = await import(
        "../../../messages/es/marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "navigation": async () => {
      const module = await import(
        "../../../messages/es/navigation.json"
      );

      return module.default as TranslationDictionary;
    },

    "partners-register": async () => {
      const module = await import(
        "../../../messages/es/partners-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "privacy-policy": async () => {
      const module = await import(
        "../../../messages/es/privacy-policy.json"
      );

      return module.default as TranslationDictionary;
    },

    "register": async () => {
      const module = await import(
        "../../../messages/es/register.json"
      );

      return module.default as TranslationDictionary;
    },

    "resources-videos": async () => {
      const module = await import(
        "../../../messages/es/resources-videos.json"
      );

      return module.default as TranslationDictionary;
    },

    "select-portal": async () => {
      const module = await import(
        "../../../messages/es/select-portal.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug": async () => {
      const module = await import(
        "../../../messages/es/support-by-slug.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-checkout": async () => {
      const module = await import(
        "../../../messages/es/support-by-slug-checkout.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-agreement": async () => {
      const module = await import(
        "../../../messages/es/support-by-slug-participation-agreement.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-by-slug-participation-submitted": async () => {
      const module = await import(
        "../../../messages/es/support-by-slug-participation-submitted.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-id": async () => {
      const module = await import(
        "../../../messages/es/support-id.json"
      );

      return module.default as TranslationDictionary;
    },

    "support-register": async () => {
      const module = await import(
        "../../../messages/es/support-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters": async () => {
      const module = await import(
        "../../../messages/es/supporters.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-contribution-plans": async () => {
      const module = await import(
        "../../../messages/es/supporters-contribution-plans.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-dashboard": async () => {
      const module = await import(
        "../../../messages/es/supporters-dashboard.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs": async () => {
      const module = await import(
        "../../../messages/es/supporters-entrepreneurs.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-messages": async () => {
      const module = await import(
        "../../../messages/es/supporters-entrepreneurs-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-entrepreneurs-settings": async () => {
      const module = await import(
        "../../../messages/es/supporters-entrepreneurs-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-impact-center": async () => {
      const module = await import(
        "../../../messages/es/supporters-impact-center.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-learn": async () => {
      const module = await import(
        "../../../messages/es/supporters-learn.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-login": async () => {
      const module = await import(
        "../../../messages/es/supporters-login.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-marketplace": async () => {
      const module = await import(
        "../../../messages/es/supporters-marketplace.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-messages": async () => {
      const module = await import(
        "../../../messages/es/supporters-messages.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-my-supported-businesses": async () => {
      const module = await import(
        "../../../messages/es/supporters-my-supported-businesses.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-notifications": async () => {
      const module = await import(
        "../../../messages/es/supporters-notifications.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-quarterly-reports": async () => {
      const module = await import(
        "../../../messages/es/supporters-quarterly-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-register": async () => {
      const module = await import(
        "../../../messages/es/supporters-register.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-reports": async () => {
      const module = await import(
        "../../../messages/es/supporters-reports.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-settings": async () => {
      const module = await import(
        "../../../messages/es/supporters-settings.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-success-stories": async () => {
      const module = await import(
        "../../../messages/es/supporters-success-stories.json"
      );

      return module.default as TranslationDictionary;
    },

    "supporters-update-password": async () => {
      const module = await import(
        "../../../messages/es/supporters-update-password.json"
      );

      return module.default as TranslationDictionary;
    },

    "terms-of-use": async () => {
      const module = await import(
        "../../../messages/es/terms-of-use.json"
      );

      return module.default as TranslationDictionary;
    },

    "videos": async () => {
      const module = await import(
        "../../../messages/es/videos.json"
      );

      return module.default as TranslationDictionary;
    },

  },
};

/**
 * Utility Functions
 * ============================================================
 */

function createCacheKey(
  locale: SupportedLocale,
  namespace: string,
): string {
  return `${locale}:${namespace}`;
}

function isTranslationDictionary(
  value: TranslationValue | undefined,
): value is TranslationDictionary {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function resolveNestedValue(
  dictionary: TranslationDictionary,
  key: string,
): TranslationValue | undefined {
  const segments = key
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return undefined;
  }

  let currentValue: TranslationValue = dictionary;

  for (const segment of segments) {
    if (!isTranslationDictionary(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[segment];

    if (currentValue === undefined) {
      return undefined;
    }
  }

  return currentValue;
}

function convertTranslationValueToString(
  value: TranslationValue | undefined,
): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null) {
    return "";
  }

  return null;
}

function interpolateVariables(
  template: string,
  variables?: TranslationVariables,
): string {
  if (!variables) {
    return template;
  }

  return template.replace(
    /\{([a-zA-Z0-9_.-]+)\}/g,
    (match, variableName: string) => {
      const value = variables[variableName];

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

function countLeafKeys(
  value: TranslationValue,
): number {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return 1;
  }

  if (Array.isArray(value)) {
    return (value as TranslationValue[]).reduce<number>(
      (total, item) => total + countLeafKeys(item),
      0,
    );
  }

  return Object.values(value as TranslationDictionary).reduce<number>(
    (total, item) => total + countLeafKeys(item),
    0,
  );
}

function flattenDictionary(
  dictionary: TranslationDictionary,
  prefix = "",
): Map<string, TranslationValue> {
  const flattened = new Map<string, TranslationValue>();

  for (const [key, value] of Object.entries(dictionary)) {
    const completeKey = prefix ? `${prefix}.${key}` : key;

    if (isTranslationDictionary(value)) {
      const nestedValues = flattenDictionary(value, completeKey);

      for (const [nestedKey, nestedValue] of nestedValues.entries()) {
        flattened.set(nestedKey, nestedValue);
      }

      continue;
    }

    flattened.set(completeKey, value);
  }

  return flattened;
}

function normalizeNamespace(namespace?: string): string {
  const normalized = namespace?.trim();

  return normalized || DEFAULT_TRANSLATION_NAMESPACE;
}

/**
 * ============================================================
 * Translation Engine
 * ============================================================
 */

export class TranslationEngine {
  private configuration: TranslationEngineConfiguration = {
    ...INITIAL_CONFIGURATION,
  };

  private readonly cache = new Map<string, TranslationCacheEntry>();

  private readonly pendingLoads = new Map<
    string,
    Promise<TranslationLoadResult>
  >();

  private readonly statistics = new Map<
    string,
    InternalNamespaceStatistics
  >();

  private readonly missingTranslations = new Map<
    string,
    MissingTranslationRecord
  >();

  /**
   * Update runtime configuration.
   */
  configure(
    configuration: Partial<TranslationEngineConfiguration>,
  ): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }

  /**
   * Return a copy of the current configuration.
   */
  getConfiguration(): TranslationEngineConfiguration {
    return {
      ...this.configuration,
    };
  }

  /**
   * Return all namespaces registered for a locale.
   */
  getRegisteredNamespaces(
    locale: SupportedLocale,
  ): string[] {
    return Object.keys(namespaceRegistry[locale] ?? {});
  }

  /**
   * Return true when a namespace loader exists.
   */
  hasRegisteredNamespace(
    locale: SupportedLocale,
    namespace: string,
  ): boolean {
    return Boolean(namespaceRegistry[locale]?.[namespace]);
  }

  /**
   * Register or replace a namespace loader.
   *
   * This allows future modules to add translation namespaces
   * without changing the engine internals.
   */
  registerNamespace(
    locale: SupportedLocale,
    namespace: string,
    loader: NamespaceLoader,
  ): void {
    const normalizedNamespace = normalizeNamespace(namespace);

    namespaceRegistry[locale][normalizedNamespace] = loader;

    this.removeNamespaceFromCache(
      locale,
      normalizedNamespace,
    );
  }

  /**
   * Load one translation namespace.
   */
  async loadNamespace(
    locale: SupportedLocale,
    namespace = this.configuration.defaultNamespace,
  ): Promise<TranslationLoadResult> {
    const normalizedLocale = normalizeLocale(locale);
    const normalizedNamespace = normalizeNamespace(namespace);
    const cacheKey = createCacheKey(
      normalizedLocale,
      normalizedNamespace,
    );

    const statistics = this.getOrCreateStatistics(
      normalizedLocale,
      normalizedNamespace,
    );

    statistics.lastAccessedAt = Date.now();

    if (this.configuration.cacheEnabled) {
      const cachedEntry = this.cache.get(cacheKey);

      if (cachedEntry) {
        statistics.cacheHits += 1;

        return {
          locale: normalizedLocale,
          namespace: normalizedNamespace,
          translations: cachedEntry.translations,
          loadedFromFallback: false,
        };
      }
    }

    statistics.cacheMisses += 1;

    const existingPendingLoad = this.pendingLoads.get(cacheKey);

    if (existingPendingLoad) {
      return existingPendingLoad;
    }

    const loadPromise = this.performNamespaceLoad(
      normalizedLocale,
      normalizedNamespace,
    );

    this.pendingLoads.set(cacheKey, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.pendingLoads.delete(cacheKey);
    }
  }

  /**
   * Internal namespace loading operation.
   */
  private async performNamespaceLoad(
    locale: SupportedLocale,
    namespace: string,
  ): Promise<TranslationLoadResult> {
    const loader = namespaceRegistry[locale]?.[namespace];
    const statistics = this.getOrCreateStatistics(locale, namespace);

    if (!loader) {
      this.logDiagnostic(
        `No namespace loader is registered for "${locale}:${namespace}".`,
      );

      if (
        this.configuration.fallbackEnabled &&
        locale !== this.configuration.fallbackLocale
      ) {
        const fallbackResult = await this.loadNamespace(
          this.configuration.fallbackLocale,
          namespace,
        );

        return {
          locale,
          namespace,
          translations: fallbackResult.translations,
          loadedFromFallback: true,
        };
      }

      return {
        locale,
        namespace,
        translations: {},
        loadedFromFallback: false,
      };
    }

    try {
      const translations = await loader();
      console.log("=== TRANSLATION LOAD ===");
      console.log("Locale:", locale);
      console.log("Namespace:", namespace);
      console.log("Translations:", translations);
      console.log("Keys:", Object.keys(translations));
      const loadedAt = Date.now();

      statistics.loadCount += 1;
      statistics.loadedAt = loadedAt;
      statistics.lastAccessedAt = loadedAt;

      if (this.configuration.cacheEnabled) {
        this.cache.set(createCacheKey(locale, namespace), {
          locale,
          namespace,
          translations,
          version: TRANSLATION_VERSION,
          loadedAt,
        });
      }

      return {
        locale,
        namespace,
        translations,
        loadedFromFallback: false,
      };
    } catch (error) {
      this.logDiagnostic(
        `Failed to load translation namespace "${locale}:${namespace}".`,
        error,
      );

      if (
        this.configuration.fallbackEnabled &&
        locale !== this.configuration.fallbackLocale
      ) {
        const fallbackResult = await this.loadNamespace(
          this.configuration.fallbackLocale,
          namespace,
        );

        return {
          locale,
          namespace,
          translations: fallbackResult.translations,
          loadedFromFallback: true,
        };
      }

      return {
        locale,
        namespace,
        translations: {},
        loadedFromFallback: false,
      };
    }
  }

  /**
   * Load multiple namespaces for one locale.
   */
  async preloadNamespaces(
    locale: SupportedLocale,
    namespaces: readonly string[],
  ): Promise<TranslationPreloadResult> {
    const normalizedLocale = normalizeLocale(locale);
    const uniqueNamespaces = Array.from(
      new Set(namespaces.map(normalizeNamespace)),
    );

    const loadedNamespaces: string[] = [];
    const failedNamespaces: string[] = [];

    await Promise.all(
      uniqueNamespaces.map(async (namespace) => {
        try {
          await this.loadNamespace(
            normalizedLocale,
            namespace,
          );

          loadedNamespaces.push(namespace);
        } catch {
          failedNamespaces.push(namespace);
        }
      }),
    );

    return {
      locale: normalizedLocale,
      loadedNamespaces,
      failedNamespaces,
    };
  }

  /**
   * Load all registered namespaces for a locale.
   */
  async preloadLocale(
    locale: SupportedLocale,
  ): Promise<TranslationPreloadResult> {
    return this.preloadNamespaces(
      locale,
      this.getRegisteredNamespaces(locale),
    );
  }

  /**
   * Translate one key asynchronously.
   *
   * Recommended for namespace content that may not yet
   * be loaded.
   */
  async translate(
    key: string,
    options: TranslateOptions = {},
  ): Promise<string> {
    const result = await this.translateWithResult(
      key,
      options,
    );

    return result.value;
  }

  /**
   * Translate one key and return detailed metadata.
   */
  async translateWithResult(
    key: string,
    options: TranslateOptions = {},
  ): Promise<TranslationResult> {
    const locale = normalizeLocale(
      options.locale ?? this.configuration.defaultLocale,
    );

    const namespace = normalizeNamespace(
      options.namespace ??
        this.configuration.defaultNamespace,
    );

    const primaryResult = await this.loadNamespace(
      locale,
      namespace,
    );

    const primaryValue = resolveNestedValue(
      primaryResult.translations,
      key,
    );

    const primaryString =
      convertTranslationValueToString(primaryValue);

    const primaryStatistics =
      this.getOrCreateStatistics(locale, namespace);

    if (primaryString !== null) {
      primaryStatistics.translationHits += 1;

      return {
        key,
        value: interpolateVariables(
          primaryString,
          options.variables,
        ),
        locale,
        namespace,
        usedFallback: primaryResult.loadedFromFallback,
        missing: false,
      };
    }

    primaryStatistics.translationMisses += 1;

    if (
      this.configuration.fallbackEnabled &&
      locale !== this.configuration.fallbackLocale
    ) {
      const fallbackLocale =
        this.configuration.fallbackLocale;

      const fallbackResult = await this.loadNamespace(
        fallbackLocale,
        namespace,
      );

      const fallbackValue = resolveNestedValue(
        fallbackResult.translations,
        key,
      );

      const fallbackString =
        convertTranslationValueToString(fallbackValue);

      if (fallbackString !== null) {
        primaryStatistics.fallbackHits += 1;

        this.recordMissingTranslation({
          locale,
          namespace,
          key,
          requestedAt: new Date().toISOString(),
          fallbackAttempted: true,
          defaultValueUsed: false,
        });

        return {
          key,
          value: interpolateVariables(
            fallbackString,
            options.variables,
          ),
          locale,
          namespace,
          usedFallback: true,
          missing: false,
        };
      }
    }

    const defaultValue =
      options.defaultValue ??
      this.createMissingTranslationValue(
        key,
        namespace,
      );

    this.recordMissingTranslation({
      locale,
      namespace,
      key,
      requestedAt: new Date().toISOString(),
      fallbackAttempted:
        this.configuration.fallbackEnabled,
      defaultValueUsed:
        options.defaultValue !== undefined,
    });

    if (
      options.logMissing !== false &&
      this.configuration.missingKeyWarningsEnabled
    ) {
      this.warnMissingTranslation(
        locale,
        namespace,
        key,
      );
    }

    return {
      key,
      value: interpolateVariables(
        defaultValue,
        options.variables,
      ),
      locale,
      namespace,
      usedFallback: false,
      missing: true,
    };
  }

  /**
   * Synchronous translation lookup.
   *
   * The namespace must already exist in cache.
   *
   * Use translate() when the namespace may not yet be loaded.
   */
  translateSync(
    key: string,
    options: TranslateOptions = {},
  ): string {
    const locale = normalizeLocale(
      options.locale ?? this.configuration.defaultLocale,
    );

    const namespace = normalizeNamespace(
      options.namespace ??
        this.configuration.defaultNamespace,
    );

    const primaryEntry = this.cache.get(
      createCacheKey(locale, namespace),
    );

    const primaryValue = primaryEntry
      ? resolveNestedValue(
          primaryEntry.translations,
          key,
        )
      : undefined;

    const primaryString =
      convertTranslationValueToString(primaryValue);

    if (primaryString !== null) {
      const statistics =
        this.getOrCreateStatistics(locale, namespace);

      statistics.translationHits += 1;
      statistics.lastAccessedAt = Date.now();

      return interpolateVariables(
        primaryString,
        options.variables,
      );
    }

    if (
      this.configuration.fallbackEnabled &&
      locale !== this.configuration.fallbackLocale
    ) {
      const fallbackEntry = this.cache.get(
        createCacheKey(
          this.configuration.fallbackLocale,
          namespace,
        ),
      );

      const fallbackValue = fallbackEntry
        ? resolveNestedValue(
            fallbackEntry.translations,
            key,
          )
        : undefined;

      const fallbackString =
        convertTranslationValueToString(fallbackValue);

      if (fallbackString !== null) {
        const statistics =
          this.getOrCreateStatistics(locale, namespace);

        statistics.fallbackHits += 1;
        statistics.lastAccessedAt = Date.now();

        return interpolateVariables(
          fallbackString,
          options.variables,
        );
      }
    }

    const value =
      options.defaultValue ??
      this.createMissingTranslationValue(
        key,
        namespace,
      );

    if (
      options.logMissing !== false &&
      this.configuration.missingKeyWarningsEnabled
    ) {
      this.warnMissingTranslation(
        locale,
        namespace,
        key,
      );
    }

    return interpolateVariables(
      value,
      options.variables,
    );
  }

  /**
   * Convenience alias for synchronous translation.
   *
   * This will later be used by LanguageProvider.
   */
  t(
    key: string,
    variablesOrOptions?:
      | TranslationVariables
      | TranslateOptions,
  ): string {
    const options =
      this.normalizeTranslationArguments(
        variablesOrOptions,
      );

    return this.translateSync(key, options);
  }

  /**
   * Return an entire loaded namespace.
   */
  getCachedNamespace(
    locale: SupportedLocale,
    namespace: string,
  ): TranslationDictionary | null {
    const entry = this.cache.get(
      createCacheKey(
        normalizeLocale(locale),
        normalizeNamespace(namespace),
      ),
    );

    return entry?.translations ?? null;
  }

  /**
   * Return true when a namespace is loaded.
   */
  isNamespaceLoaded(
    locale: SupportedLocale,
    namespace: string,
  ): boolean {
    return this.cache.has(
      createCacheKey(
        normalizeLocale(locale),
        normalizeNamespace(namespace),
      ),
    );
  }

  /**
   * Remove one namespace from cache.
   */
  removeNamespaceFromCache(
    locale: SupportedLocale,
    namespace: string,
  ): void {
    const normalizedLocale = normalizeLocale(locale);
    const normalizedNamespace =
      normalizeNamespace(namespace);

    this.cache.delete(
      createCacheKey(
        normalizedLocale,
        normalizedNamespace,
      ),
    );
  }

  /**
   * Clear one locale from cache.
   */
  clearLocaleCache(
    locale: SupportedLocale,
  ): void {
    const normalizedLocale = normalizeLocale(locale);

    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`${normalizedLocale}:`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Clear all translation cache entries.
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingLoads.clear();
  }

  /**
   * Return cache metadata.
   */
  getCacheSnapshot(): TranslationCacheSnapshot[] {
    return Array.from(this.cache.values()).map(
      (entry) => ({
        locale: entry.locale,
        namespace: entry.namespace,
        version: entry.version,
        loadedAt: entry.loadedAt,
        keyCount: countLeafKeys(entry.translations),
      }),
    );
  }

  /**
   * Return current cache size.
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Return translation runtime statistics.
   */
  getStatistics(): TranslationNamespaceStatistics[] {
    return Array.from(this.statistics.values()).map(
      (statistics) => ({
        ...statistics,
      }),
    );
  }

  /**
   * Reset runtime statistics.
   */
  resetStatistics(): void {
    this.statistics.clear();
  }

  /**
   * Return all missing translations recorded during runtime.
   */
  getMissingTranslations(): MissingTranslationRecord[] {
    return Array.from(
      this.missingTranslations.values(),
    );
  }

  /**
   * Clear missing translation diagnostics.
   */
  clearMissingTranslations(): void {
    this.missingTranslations.clear();
  }

  /**
   * Calculate language health against the fallback language.
   *
   * Both locale and fallback namespaces are loaded if needed.
   */
  async getNamespaceHealth(
    locale: SupportedLocale,
    namespace: string,
  ): Promise<TranslationNamespaceHealth> {
    const normalizedLocale = normalizeLocale(locale);
    const normalizedNamespace =
      normalizeNamespace(namespace);

    const fallbackResult = await this.loadNamespace(
      this.configuration.fallbackLocale,
      normalizedNamespace,
    );

    const localeResult = await this.loadNamespace(
      normalizedLocale,
      normalizedNamespace,
    );

    const fallbackKeys = flattenDictionary(
      fallbackResult.translations,
    );

    const localeKeys = flattenDictionary(
      localeResult.translations,
    );

    let translatedKeys = 0;

    for (const key of fallbackKeys.keys()) {
      const localeValue = localeKeys.get(key);
      const localeString =
        convertTranslationValueToString(localeValue);

      if (
        localeString !== null &&
        localeString.trim().length > 0
      ) {
        translatedKeys += 1;
      }
    }

    const totalFallbackKeys = fallbackKeys.size;
    const missingKeys = Math.max(
      totalFallbackKeys - translatedKeys,
      0,
    );

    const completionPercentage =
      totalFallbackKeys === 0
        ? 100
        : Math.round(
            (translatedKeys / totalFallbackKeys) * 100,
          );

    return {
      locale: normalizedLocale,
      namespace: normalizedNamespace,
      totalFallbackKeys,
      translatedKeys,
      missingKeys,
      completionPercentage,
    };
  }

  /**
   * Calculate overall translation health for one language.
   */
  async getLanguageHealth(
    locale: SupportedLocale,
    namespaces?: readonly string[],
  ): Promise<TranslationHealthSummary> {
    const normalizedLocale = normalizeLocale(locale);

    const namespacesToCheck =
      namespaces && namespaces.length > 0
        ? Array.from(new Set(namespaces))
        : this.getRegisteredNamespaces(
            this.configuration.fallbackLocale,
          );

    const namespaceHealth = await Promise.all(
      namespacesToCheck.map((namespace) =>
        this.getNamespaceHealth(
          normalizedLocale,
          namespace,
        ),
      ),
    );

    const totalKeys = namespaceHealth.reduce(
      (total, health) =>
        total + health.totalFallbackKeys,
      0,
    );

    const translatedKeys = namespaceHealth.reduce(
      (total, health) =>
        total + health.translatedKeys,
      0,
    );

    const missingKeys = Math.max(
      totalKeys - translatedKeys,
      0,
    );

    const completionPercentage =
      totalKeys === 0
        ? 100
        : Math.round(
            (translatedKeys / totalKeys) * 100,
          );

    return {
      locale: normalizedLocale,
      totalKeys,
      translatedKeys,
      missingKeys,
      completionPercentage,
    };
  }

  /**
   * Calculate health for every supported language.
   */
  async getAllLanguageHealth(
    namespaces?: readonly string[],
  ): Promise<TranslationHealthSummary[]> {
    return Promise.all(
      SUPPORTED_LOCALES.map((locale) =>
        this.getLanguageHealth(
          locale,
          namespaces,
        ),
      ),
    );
  }

  /**
   * Return supported language codes.
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * Return enabled language metadata.
   */
  getSupportedLanguages() {
    return LANGUAGE_DEFINITIONS.filter(
      (language) => language.enabled,
    );
  }

  /**
   * Safely resolve a locale input.
   */
  resolveLocale(
    locale: string | null | undefined,
  ): SupportedLocale {
    return normalizeLocale(locale);
  }

  /**
   * Return true when the supplied locale is supported.
   */
  supportsLocale(
    locale: string | null | undefined,
  ): boolean {
    if (!locale) {
      return false;
    }

    const normalizedValue = locale
      .trim()
      .toLowerCase()
      .replaceAll("_", "-");

    if (isSupportedLocale(normalizedValue)) {
      return true;
    }

    const baseLanguage = normalizedValue.split("-")[0];

    return isSupportedLocale(baseLanguage);
  }

  /**
   * Normalize translation arguments.
   *
   * This allows:
   *
   * t("common.welcome", { name: "Nelson" })
   *
   * and:
   *
   * t("common.welcome", {
   *   variables: { name: "Nelson" },
   *   namespace: "common",
   * })
   */
  private normalizeTranslationArguments(
    value?:
      | TranslationVariables
      | TranslateOptions,
  ): TranslateOptions {
    if (!value) {
      return {};
    }

    const possibleOptions =
      value as TranslateOptions;

    const containsOptionProperty =
      "variables" in possibleOptions ||
      "defaultValue" in possibleOptions ||
      "locale" in possibleOptions ||
      "namespace" in possibleOptions ||
      "logMissing" in possibleOptions;

    if (containsOptionProperty) {
      return possibleOptions;
    }

    return {
      variables: value as TranslationVariables,
    };
  }

  /**
   * Return or initialize statistics for one namespace.
   */
  private getOrCreateStatistics(
    locale: SupportedLocale,
    namespace: string,
  ): InternalNamespaceStatistics {
    const statisticsKey = createCacheKey(
      locale,
      namespace,
    );

    const existing =
      this.statistics.get(statisticsKey);

    if (existing) {
      return existing;
    }

    const created: InternalNamespaceStatistics = {
      locale,
      namespace,
      cacheHits: 0,
      cacheMisses: 0,
      translationHits: 0,
      translationMisses: 0,
      fallbackHits: 0,
      loadCount: 0,
      loadedAt: null,
      lastAccessedAt: null,
    };

    this.statistics.set(
      statisticsKey,
      created,
    );

    return created;
  }

  /**
   * Record one missing translation.
   */
  private recordMissingTranslation(
    record: MissingTranslationRecord,
  ): void {
    const recordKey = [
      record.locale,
      record.namespace,
      record.key,
    ].join(":");

    this.missingTranslations.set(
      recordKey,
      record,
    );
  }

  /**
   * Create a development-safe missing translation value.
   */
  private createMissingTranslationValue(
    key: string,
    namespace: string,
  ): string {
    if (this.configuration.diagnosticsEnabled) {
      return `[${namespace}.${key}]`;
    }

    return key;
  }

  /**
   * Log missing translations during development.
   */
  private warnMissingTranslation(
    locale: SupportedLocale,
    namespace: string,
    key: string,
  ): void {
    if (!this.configuration.missingKeyWarningsEnabled) {
      return;
    }

    console.warn(
      [
        "[EPEW Language Engine] Missing translation",
        `Locale: ${locale}`,
        `Namespace: ${namespace}`,
        `Key: ${key}`,
      ].join("\n"),
    );
  }

  /**
   * Log development diagnostics.
   */
  private logDiagnostic(
    message: string,
    error?: unknown,
  ): void {
    if (!this.configuration.diagnosticsEnabled) {
      return;
    }

    if (error) {
      console.error(
        `[EPEW Language Engine] ${message}`,
        error,
      );

      return;
    }

    console.warn(
      `[EPEW Language Engine] ${message}`,
    );
  }
}

/**
 * ============================================================
 * Singleton Instance
 * ============================================================
 */

export const translationEngine =
  new TranslationEngine();

/**
 * ============================================================
 * Convenience Exports
 * ============================================================
 */

/**
 * Asynchronous translation helper.
 */
export async function translate(
  key: string,
  options: TranslateOptions = {},
): Promise<string> {
  return translationEngine.translate(
    key,
    options,
  );
}

/**
 * Synchronous translation helper.
 *
 * Required namespaces must already be loaded.
 */
export function translateSync(
  key: string,
  options: TranslateOptions = {},
): string {
  return translationEngine.translateSync(
    key,
    options,
  );
}

/**
 * Preload one or more namespaces.
 */
export async function preloadTranslations(
  locale: SupportedLocale,
  namespaces: readonly string[],
): Promise<TranslationPreloadResult> {
  return translationEngine.preloadNamespaces(
    locale,
    namespaces,
  );
}
