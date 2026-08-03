/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Command-Line Runner
 * Version: 1.0.0
 * ============================================================
 */

import {
  buildTranslationCenter,
  certifyTranslationCenter,
  scanTranslationCenter,
  validateTranslationCenter,
  type TranslationCenterExecutionMode,
  type TranslationCenterResult,
} from "../../lib/ibos/translation-center";

/**
 * Supported command-line modes.
 */
const SUPPORTED_MODES: TranslationCenterExecutionMode[] = [
  "scan",
  "validate",
  "build",
  "certify",
];

/**
 * Returns the requested execution mode.
 *
 * Examples:
 *
 * tsx scripts/enterprise-translation/run-translation-center.ts scan
 * tsx scripts/enterprise-translation/run-translation-center.ts build
 */
function getRequestedMode(): TranslationCenterExecutionMode {
  const requestedMode = process.argv[2]?.trim().toLowerCase();

  if (
    requestedMode &&
    SUPPORTED_MODES.includes(
      requestedMode as TranslationCenterExecutionMode,
    )
  ) {
    return requestedMode as TranslationCenterExecutionMode;
  }

  return "scan";
}

/**
 * Returns whether a command-line flag is present.
 */
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

/**
 * Returns the value following a command-line flag.
 *
 * Example:
 *
 * --project-root /Users/name/project
 */
function getFlagValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

/**
 * Formats a number as a percentage.
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Prints one summary line.
 */
function printSummaryLine(
  label: string,
  value: string | number | boolean,
): void {
  const formattedValue =
    typeof value === "boolean"
      ? value
        ? "YES"
        : "NO"
      : String(value);

  console.log(`${label.padEnd(31)} ${formattedValue}`);
}

/**
 * Prints execution phase timing.
 */
function printPhaseTimings(
  result: TranslationCenterResult,
): void {
  console.log("\nPHASE TIMINGS");
  console.log("--------------------------------------------------");

  for (const timing of result.phaseTimings) {
    const seconds = (timing.durationMs / 1000).toFixed(2);

    console.log(
      `${timing.phase.padEnd(28)} ${seconds}s ${
        timing.success ? "✓" : "✗"
      }`,
    );
  }
}

/**
 * Prints the enterprise summary.
 */
function printExecutionSummary(
  result: TranslationCenterResult,
): void {
  console.log("\n==================================================");
  console.log("EPEW-EDE-IBOS ENTERPRISE TRANSLATION CENTER");
  console.log("==================================================");

  printSummaryLine("Execution ID:", result.executionId);
  printSummaryLine("Mode:", result.mode.toUpperCase());
  printSummaryLine("Status:", result.status);
  printSummaryLine("Project Root:", result.projectRoot);
  printSummaryLine(
    "Duration:",
    `${(result.durationMs / 1000).toFixed(2)} seconds`,
  );

  console.log("\nPROJECT DISCOVERY");
  console.log("--------------------------------------------------");

  printSummaryLine("Routes Discovered:", result.summary.totalRoutes);
  printSummaryLine("Pages Registered:", result.summary.totalPages);
  printSummaryLine(
    "Namespaces Registered:",
    result.summary.totalNamespaces,
  );
  printSummaryLine(
    "Languages Supported:",
    result.summary.supportedLanguages,
  );

  console.log("\nTRANSLATION STATUS");
  console.log("--------------------------------------------------");

  printSummaryLine(
    "Translation Keys:",
    result.summary.totalTranslationKeys,
  );
  printSummaryLine(
    "Missing Keys:",
    result.summary.missingTranslationKeys,
  );
  printSummaryLine(
    "Hardcoded Texts:",
    result.summary.hardcodedTexts,
  );
  printSummaryLine(
    "Placeholder Mismatches:",
    result.summary.placeholderMismatches,
  );
  printSummaryLine(
    "Translation Coverage:",
    formatPercentage(result.summary.translationCoverage),
  );
  printSummaryLine(
    "Compliance Score:",
    formatPercentage(result.summary.complianceScore),
  );

  console.log("\nWORK QUEUE");
  console.log("--------------------------------------------------");

  printSummaryLine(
    "Pending Queue Items:",
    result.summary.pendingQueueItems,
  );
  printSummaryLine(
    "Blocking Issues:",
    result.summary.blockingIssues,
  );

  console.log("\nCERTIFICATION");
  console.log("--------------------------------------------------");

  printSummaryLine(
    "Deployment Ready:",
    result.summary.deploymentReady,
  );
  printSummaryLine(
    "Certification Issued:",
    result.summary.certificationIssued,
  );

  if (result.artifactWrite) {
    console.log("\nGENERATED ARTIFACTS");
    console.log("--------------------------------------------------");

    printSummaryLine(
      "Created Files:",
      result.artifactWrite.createdFiles.length,
    );
    printSummaryLine(
      "Updated Files:",
      result.artifactWrite.updatedFiles.length,
    );
    printSummaryLine(
      "Unchanged Files:",
      result.artifactWrite.unchangedFiles.length,
    );
  }

  printPhaseTimings(result);

  if (result.recommendations.length > 0) {
    console.log("\nRECOMMENDATIONS");
    console.log("--------------------------------------------------");

    result.recommendations.forEach(
      (recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      },
    );
  }

  if (result.errors.length > 0) {
    console.log("\nERRORS");
    console.log("--------------------------------------------------");

    result.errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });
  }

  console.log("\n==================================================");
}

/**
 * Executes the requested Translation Center mode.
 */
async function executeTranslationCenter(): Promise<void> {
  const mode = getRequestedMode();

  const projectRoot =
    getFlagValue("--project-root") ?? process.cwd();

  const saveArtifacts = !hasFlag("--no-save");
  const loadPreviousState = !hasFlag("--fresh");

  const createMissingMasterFiles = hasFlag(
    "--create-master-files",
  );

  const createMissingTargetFiles =
    hasFlag("--create-target-files") ||
    mode === "build";

  console.log(
    `Starting EPEW-EDE-IBOS Translation Center in ${mode.toUpperCase()} mode...`,
  );

  let result: TranslationCenterResult;

  const options = {
    projectRoot,
    saveArtifacts,
    loadPreviousState,
    createMissingMasterFiles,
    createMissingTargetFiles,
  };

  switch (mode) {
    case "validate":
      result = await validateTranslationCenter(options);
      break;

    case "build":
      result = await buildTranslationCenter(options);
      break;

    case "certify":
      result = await certifyTranslationCenter(options);
      break;

    case "scan":
    default:
      result = await scanTranslationCenter(options);
      break;
  }

  printExecutionSummary(result);

  if (result.status === "failed") {
    process.exitCode = 1;
    return;
  }

  if (
    mode === "certify" &&
    !result.certification.issued
  ) {
    process.exitCode = 2;
    return;
  }

  if (
    result.summary.blockingIssues > 0 ||
    !result.success
  ) {
    process.exitCode = 1;
  }
}

/**
 * Main execution.
 */
executeTranslationCenter().catch((error) => {
  console.error(
    "\nTranslation Center execution failed:",
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});