import fs from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import type {
  TranslationCertification,
  TranslationComplianceReport,
  TranslationLanguage,
  TranslationManifest,
  TranslationNamespace,
  TranslationQueueItem,
} from "@/lib/ibos/translation-center";

export const dynamic = "force-dynamic";

const LANGUAGE_ORDER: TranslationLanguage[] = [
  "en",
  "ht",
  "fr",
  "es",
];

const LANGUAGE_NAMES: Record<TranslationLanguage, string> = {
  en: "English",
  ht: "Haitian Creole",
  fr: "French",
  es: "Spanish",
};

const ARTIFACT_PATHS = {
  manifest:
    "data/enterprise/ibos/translation-center/generated/translation-manifest.json",

  compliance:
    "data/enterprise/ibos/translation-center/reports/translation-compliance-report.json",

  certification:
    "data/enterprise/ibos/translation-center/reports/translation-certification.json",

  queue:
    "data/enterprise/ibos/translation-center/registry/translation-queue.json",
} as const;

type QueueFilePayload = {
  queue?: TranslationQueueItem[];
};

type DashboardData = {
  manifest: TranslationManifest | null;
  compliance: TranslationComplianceReport | null;
  certification: TranslationCertification | null;
  queue: TranslationQueueItem[];
  missingArtifacts: string[];
  invalidArtifacts: string[];
};

type PortalProgress = {
  id: string;
  label: string;
  total: number;
  compliant: number;
  coverage: number;
};

async function readJsonFile<T>(
  projectRelativePath: string,
): Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      reason: "missing" | "invalid";
    }
> {
  const absolutePath = path.join(
    process.cwd(),
    projectRelativePath,
  );

  try {
    const content = await fs.readFile(
      absolutePath,
      "utf8",
    );

    return {
      success: true,
      data: JSON.parse(content) as T,
    };
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error
        ? String(error.code)
        : "";

    return {
      success: false,
      reason:
        errorCode === "ENOENT"
          ? "missing"
          : "invalid",
    };
  }
}

async function loadDashboardData(): Promise<DashboardData> {
  const [
    manifestResult,
    complianceResult,
    certificationResult,
    queueResult,
  ] = await Promise.all([
    readJsonFile<TranslationManifest>(
      ARTIFACT_PATHS.manifest,
    ),

    readJsonFile<TranslationComplianceReport>(
      ARTIFACT_PATHS.compliance,
    ),

    readJsonFile<TranslationCertification>(
      ARTIFACT_PATHS.certification,
    ),

    readJsonFile<QueueFilePayload>(
      ARTIFACT_PATHS.queue,
    ),
  ]);

  const missingArtifacts: string[] = [];
  const invalidArtifacts: string[] = [];

  const registerArtifactStatus = (
    result:
      | { success: true; data: unknown }
      | {
          success: false;
          reason: "missing" | "invalid";
        },
    artifactPath: string,
  ): void => {
    if (result.success) {
      return;
    }

    if (result.reason === "missing") {
      missingArtifacts.push(artifactPath);
      return;
    }

    invalidArtifacts.push(artifactPath);
  };

  registerArtifactStatus(
    manifestResult,
    ARTIFACT_PATHS.manifest,
  );

  registerArtifactStatus(
    complianceResult,
    ARTIFACT_PATHS.compliance,
  );

  registerArtifactStatus(
    certificationResult,
    ARTIFACT_PATHS.certification,
  );

  registerArtifactStatus(
    queueResult,
    ARTIFACT_PATHS.queue,
  );

  return {
    manifest: manifestResult.success
      ? manifestResult.data
      : null,

    compliance: complianceResult.success
      ? complianceResult.data
      : null,

    certification: certificationResult.success
      ? certificationResult.data
      : null,

    queue:
      queueResult.success &&
      Array.isArray(queueResult.data.queue)
        ? queueResult.data.queue
        : [],

    missingArtifacts,
    invalidArtifacts,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercentage(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(
    1,
  )}%`;
}

function calculateLanguageCoverage(
  namespaces: TranslationNamespace[],
  language: TranslationLanguage,
): number {
  if (namespaces.length === 0) {
    return 0;
  }

  const total = namespaces.reduce(
    (sum, namespace) =>
      sum +
      (namespace.languages[language]
        ?.coveragePercentage ?? 0),
    0,
  );

  return total / namespaces.length;
}

function calculateMissingLanguageFiles(
  namespaces: TranslationNamespace[],
): number {
  return namespaces.reduce(
    (total, namespace) => {
      const missingForNamespace =
        LANGUAGE_ORDER.filter(
          (language) =>
            !namespace.languages[language]
              ?.fileExists,
        ).length;

      return total + missingForNamespace;
    },
    0,
  );
}

function calculatePendingNamespaces(
  namespaces: TranslationNamespace[],
): number {
  return namespaces.filter(
    (namespace) =>
      namespace.complianceStatus !== "compliant",
  ).length;
}

function calculatePortalProgress(
  manifest: TranslationManifest,
): PortalProgress[] {
  const categories = [
    {
      id: "public",
      label: "Public Website",
      matches: (route: string) =>
        !route.startsWith("/admin") &&
        !route.startsWith("/entrepreneurs") &&
        !route.startsWith("/supporters") &&
        !route.startsWith("/coaches") &&
        !route.startsWith("/partners") &&
        !route.includes("/ibos"),
    },

    {
      id: "entrepreneur",
      label: "Entrepreneur Portal",
      matches: (route: string) =>
        route.startsWith("/entrepreneurs") ||
        route.startsWith("/entrepreneur"),
    },

    {
      id: "supporter",
      label: "Supporter Portal",
      matches: (route: string) =>
        route.startsWith("/supporters") ||
        route.startsWith("/support/"),
    },

    {
      id: "coach",
      label: "Coach Portal",
      matches: (route: string) =>
        route.startsWith("/coaches") ||
        route.startsWith("/coach"),
    },

    {
      id: "partner",
      label: "Partner Portal",
      matches: (route: string) =>
        route.startsWith("/partners") ||
        route.startsWith("/partner"),
    },

    {
      id: "admin",
      label: "Admin Portal",
      matches: (route: string) =>
        route.startsWith("/admin") &&
        !route.includes("/ibos"),
    },

    {
      id: "ibos",
      label: "IBOS Centers",
      matches: (route: string) =>
        route.includes("/ibos") ||
        route.includes(
          "/admin/translation",
        ),
    },
  ];

  return categories.map((category) => {
    const pages = manifest.pages.filter((page) =>
      category.matches(page.route),
    );

    const compliant = pages.filter(
      (page) =>
        page.complianceStatus === "compliant",
    ).length;

    const coverage =
      pages.length > 0
        ? pages.reduce(
            (sum, page) =>
              sum + page.complianceScore,
            0,
          ) / pages.length
        : 0;

    return {
      id: category.id,
      label: category.label,
      total: pages.length,
      compliant,
      coverage,
    };
  });
}

function getStatusClasses(
  status:
    | "success"
    | "warning"
    | "danger"
    | "neutral",
): string {
  switch (status) {
    case "success":
      return [
        "border-green-200",
        "bg-green-50",
        "text-green-800",
      ].join(" ");

    case "warning":
      return [
        "border-amber-200",
        "bg-amber-50",
        "text-amber-800",
      ].join(" ");

    case "danger":
      return [
        "border-red-200",
        "bg-red-50",
        "text-red-800",
      ].join(" ");

    case "neutral":
    default:
      return [
        "border-slate-200",
        "bg-slate-50",
        "text-slate-700",
      ].join(" ");
  }
}

function MetricCard({
  title,
  value,
  description,
  status = "neutral",
}: {
  title: string;
  value: string;
  description: string;
  status?:
    | "success"
    | "warning"
    | "danger"
    | "neutral";
}) {
  return (
    <article
      className={[
        "rounded-3xl border p-6 shadow-sm",
        getStatusClasses(status),
      ].join(" ")}
    >
      <p className="text-sm font-bold uppercase tracking-[0.12em]">
        {title}
      </p>

      <p className="mt-4 text-4xl font-black">
        {value}
      </p>

      <p className="mt-3 text-sm leading-relaxed opacity-80">
        {description}
      </p>
    </article>
  );
}

function ProgressBar({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  const normalized = Math.max(
    0,
    Math.min(100, value),
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900">
            {label}
          </p>

          {detail ? (
            <p className="text-sm text-slate-500">
              {detail}
            </p>
          ) : null}
        </div>

        <p className="font-black text-[#06245c]">
          {formatPercentage(normalized)}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#06245c] transition-all"
          style={{
            width: `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyDashboard({
  missingArtifacts,
  invalidArtifacts,
}: {
  missingArtifacts: string[];
  invalidArtifacts: string[];
}) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-[#06245c] p-8 text-white shadow-xl md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">
            EPEW-EDE-IBOS
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Enterprise Translation Center
          </h1>

          <p className="mt-6 max-w-4xl text-xl leading-relaxed text-slate-200">
            The Translation Center dashboard is ready,
            but the generated scan artifacts are not
            available in this environment.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-2xl font-black text-amber-900">
            Translation scan required
          </h2>

          <p className="mt-3 text-lg text-amber-800">
            Run the following command from the EPEW
            project root:
          </p>

          <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm text-green-300">
            <code>
              npm run enterprise:translation:scan
            </code>
          </pre>

          {missingArtifacts.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-black text-amber-900">
                Missing artifacts
              </h3>

              <div className="mt-3 space-y-2">
                {missingArtifacts.map(
                  (artifactPath) => (
                    <p
                      key={artifactPath}
                      className="break-all rounded-xl bg-white px-4 py-3 font-mono text-sm text-slate-700"
                    >
                      {artifactPath}
                    </p>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {invalidArtifacts.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-black text-red-800">
                Invalid artifacts
              </h3>

              <div className="mt-3 space-y-2">
                {invalidArtifacts.map(
                  (artifactPath) => (
                    <p
                      key={artifactPath}
                      className="break-all rounded-xl bg-white px-4 py-3 font-mono text-sm text-red-700"
                    >
                      {artifactPath}
                    </p>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default async function TranslationCenterPage() {
  const data = await loadDashboardData();

  if (!data.manifest) {
    return (
      <EmptyDashboard
        missingArtifacts={data.missingArtifacts}
        invalidArtifacts={data.invalidArtifacts}
      />
    );
  }

  const manifest = data.manifest;

  const statistics =
    data.compliance?.statistics ??
    manifest.statistics;

  const certification =
    data.certification;

  const missingLanguageFiles =
    calculateMissingLanguageFiles(
      manifest.namespaces,
    );

  const pendingNamespaces =
    calculatePendingNamespaces(
      manifest.namespaces,
    );

  const pendingQueueItems = data.queue.filter(
    (item) => item.status !== "completed",
  );

  const criticalQueueItems =
    pendingQueueItems.filter(
      (item) => item.priority === "critical",
    );

  const highQueueItems =
    pendingQueueItems.filter(
      (item) => item.priority === "high",
    );

  const portalProgress =
    calculatePortalProgress(manifest);

  const languageProgress = LANGUAGE_ORDER.map(
    (language) => ({
      language,
      name: LANGUAGE_NAMES[language],
      coverage: calculateLanguageCoverage(
        manifest.namespaces,
        language,
      ),
    }),
  );

  const certificationIssued =
    certification?.issued ??
    statistics.deploymentReady;

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] bg-[#06245c] shadow-2xl">
          <div className="px-7 py-10 text-white md:px-12 md:py-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">
                  EPEW-EDE-IBOS
                </p>

                <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                  Enterprise Translation Center
                </h1>

                <p className="mt-6 max-w-4xl text-xl leading-relaxed text-slate-200">
                  Centralized multilingual monitoring,
                  page discovery, namespace compliance,
                  translation coverage, work queues, and
                  deployment certification.
                </p>
              </div>

              <div
                className={[
                  "w-fit rounded-2xl border px-6 py-4",
                  certificationIssued
                    ? "border-green-400 bg-green-500/20"
                    : "border-amber-300 bg-amber-400/15",
                ].join(" ")}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                  Certification
                </p>

                <p className="mt-2 text-2xl font-black">
                  {certificationIssued
                    ? "Certified"
                    : "Not Ready"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Routes"
            value={formatNumber(
              manifest.routes.length,
            )}
            description="Application routes automatically discovered."
          />

          <MetricCard
            title="Pages"
            value={formatNumber(
              statistics.totalPages,
            )}
            description="Pages registered with the Translation Center."
          />

          <MetricCard
            title="Namespaces"
            value={formatNumber(
              statistics.totalNamespaces,
            )}
            description="Translation namespaces registered across the platform."
          />

          <MetricCard
            title="Languages"
            value={formatNumber(
              statistics.supportedLanguages,
            )}
            description="English, Haitian Creole, French, and Spanish."
            status="success"
          />

          <MetricCard
            title="Coverage"
            value={formatPercentage(
              statistics.translationCoverage,
            )}
            description="Current multilingual translation coverage."
            status={
              statistics.translationCoverage === 100
                ? "success"
                : "warning"
            }
          />

          <MetricCard
            title="Compliance"
            value={formatPercentage(
              statistics.complianceScore,
            )}
            description="Enterprise translation compliance score."
            status={
              statistics.complianceScore === 100
                ? "success"
                : "danger"
            }
          />

          <MetricCard
            title="Pending Namespaces"
            value={formatNumber(
              pendingNamespaces,
            )}
            description="Namespaces requiring translation or compliance action."
            status={
              pendingNamespaces === 0
                ? "success"
                : "warning"
            }
          />

          <MetricCard
            title="Missing Files"
            value={formatNumber(
              missingLanguageFiles,
            )}
            description="Missing language files across all namespaces."
            status={
              missingLanguageFiles === 0
                ? "success"
                : "danger"
            }
          />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl bg-white p-7 shadow-lg md:p-9">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
                Language Coverage
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#06245c]">
                Translation Progress
              </h2>
            </div>

            <div className="mt-8 space-y-7">
              {languageProgress.map(
                (language) => (
                  <ProgressBar
                    key={language.language}
                    label={language.name}
                    value={language.coverage}
                    detail={language.language.toUpperCase()}
                  />
                ),
              )}
            </div>
          </article>

          <article className="rounded-3xl bg-white p-7 shadow-lg md:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              Translation Health
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#06245c]">
              Compliance Findings
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                  Complete
                </p>

                <p className="mt-3 text-3xl font-black text-green-900">
                  {formatNumber(
                    statistics.compliantNamespaces,
                  )}
                </p>

                <p className="mt-2 text-sm text-green-700">
                  Compliant namespaces
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
                  Needs Translation
                </p>

                <p className="mt-3 text-3xl font-black text-amber-900">
                  {formatNumber(
                    pendingNamespaces,
                  )}
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  Pending namespaces
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                  Missing Keys
                </p>

                <p className="mt-3 text-3xl font-black text-red-900">
                  {formatNumber(
                    statistics.missingKeys,
                  )}
                </p>

                <p className="mt-2 text-sm text-red-700">
                  Translation keys missing
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                  Hardcoded Text
                </p>

                <p className="mt-3 text-3xl font-black text-red-900">
                  {formatNumber(
                    statistics.hardcodedTexts,
                  )}
                </p>

                <p className="mt-2 text-sm text-red-700">
                  Findings requiring review
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-7 shadow-lg md:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
            Enterprise Coverage
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#06245c]">
            Translation Progress by Portal
          </h2>

          <div className="mt-8 grid gap-7 lg:grid-cols-2">
            {portalProgress.map((portal) => (
              <ProgressBar
                key={portal.id}
                label={portal.label}
                value={portal.coverage}
                detail={`${formatNumber(
                  portal.compliant,
                )} compliant of ${formatNumber(
                  portal.total,
                )} pages`}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl bg-white p-7 shadow-lg md:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              Work Queue
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#06245c]">
              Translation Priorities
            </h2>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5">
                <span className="font-bold text-slate-700">
                  Pending items
                </span>

                <span className="text-2xl font-black text-[#06245c]">
                  {formatNumber(
                    pendingQueueItems.length,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5">
                <span className="font-bold text-red-800">
                  Critical priority
                </span>

                <span className="text-2xl font-black text-red-900">
                  {formatNumber(
                    criticalQueueItems.length,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <span className="font-bold text-amber-800">
                  High priority
                </span>

                <span className="text-2xl font-black text-amber-900">
                  {formatNumber(
                    highQueueItems.length,
                  )}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-7 shadow-lg md:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              Phase 1
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#06245c]">
              Translation Center Actions
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-[#06245c]">
                  Scan Project
                </p>

                <code className="mt-3 block break-all text-sm text-slate-600">
                  npm run enterprise:translation:scan
                </code>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-[#06245c]">
                  Validate
                </p>

                <code className="mt-3 block break-all text-sm text-slate-600">
                  npm run enterprise:translation:validate
                </code>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-[#06245c]">
                  Build
                </p>

                <code className="mt-3 block break-all text-sm text-slate-600">
                  npm run enterprise:translation:build
                </code>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-[#06245c]">
                  Certify
                </p>

                <code className="mt-3 block break-all text-sm text-slate-600">
                  npm run enterprise:translation:certify
                </code>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-bold text-blue-900">
                Phase 1 is monitoring-only.
              </p>

              <p className="mt-2 leading-relaxed text-blue-800">
                Namespace generation, language-file
                generation, automatic key creation, and
                translation actions will be activated in
                Phase 2.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-7 shadow-lg md:p-9">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
                Deployment Certification
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#06245c]">
                {certificationIssued
                  ? "Translation Certification Issued"
                  : "Translation Certification Pending"}
              </h2>

              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
                {certificationIssued
                  ? "The platform has met the Translation Center deployment requirements."
                  : "Certification will be issued after all blocking issues, missing files, missing keys, and hardcoded text requirements are resolved."}
              </p>
            </div>

            <div
              className={[
                "rounded-2xl border px-7 py-5 text-center",
                certificationIssued
                  ? getStatusClasses("success")
                  : getStatusClasses("danger"),
              ].join(" ")}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Deployment Ready
              </p>

              <p className="mt-2 text-3xl font-black">
                {statistics.deploymentReady
                  ? "YES"
                  : "NO"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#06245c] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#0a347d]"
          >
            Back to Admin
          </Link>

          <Link
            href="/admin/translation"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#06245c] px-6 py-3 font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
          >
            Refresh Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}