import path from "node:path";

import { translationScannerConfig } from "./config";
import { EnterpriseTranslationScanner } from "./scanner";

function printDivider(): void {
  console.log(
    "────────────────────────────────────────────────"
  );
}

function main(): void {
  console.log("");
  printDivider();
  console.log(
    "EPEW Enterprise Translation Center"
  );
  console.log(
    "Project Intelligence Scanner v1.0"
  );
  printDivider();

  try {
    const scanner =
      new EnterpriseTranslationScanner(
        translationScannerConfig
      );

    console.log("");
    console.log("Scanning project...");

    const manifest = scanner.scan();

    const manifestPath =
      scanner.writeManifest(manifest);

    console.log("");
    console.log("Project scan completed.");
    console.log("");

    printDivider();
    console.log("PROJECT INTELLIGENCE REPORT");
    printDivider();

    console.log(
      `Pages discovered:             ${manifest.statistics.pagesDiscovered}`
    );

    console.log(
      `Source files scanned:         ${manifest.statistics.sourceFilesScanned}`
    );

    console.log(
      `Component files scanned:      ${manifest.statistics.componentFilesScanned}`
    );

    console.log(
      `Namespaces discovered:        ${manifest.statistics.namespacesDiscovered}`
    );

    console.log(
      `Translation files:            ${manifest.statistics.translationFilesDiscovered}`
    );

    console.log(
      `Translation keys defined:     ${manifest.statistics.translationKeysDefined}`
    );

    console.log(
      `Translation keys used:        ${manifest.statistics.translationKeysUsed}`
    );

    console.log(
      `Hardcoded text issues:        ${manifest.statistics.hardcodedTextIssues}`
    );

    console.log(
      `Missing language files:       ${manifest.statistics.missingLanguageFiles}`
    );

    console.log(
      `Invalid JSON files:           ${manifest.statistics.invalidJsonFiles}`
    );

    console.log(
      `Overall compliance score:     ${manifest.statistics.overallComplianceScore}%`
    );

    printDivider();

    console.log("");
    console.log("PUBLIC ROUTES");
    console.log("");

    for (const route of manifest.routes) {
      const statusIcon =
        route.status === "compliant"
          ? "✅"
          : route.status === "review-required"
            ? "⚠️"
            : "❌";

      console.log(
        `${statusIcon} ${route.route}`
      );

      console.log(
        `   Namespace: ${route.namespace}`
      );

      console.log(
        `   Hardcoded text: ${route.hardcodedTextCount}`
      );

      console.log(
        `   Missing languages: ${
          route.missingLocaleFiles.length > 0
            ? route.missingLocaleFiles.join(", ")
            : "None"
        }`
      );

      console.log(
        `   Compliance: ${route.complianceScore}%`
      );

      console.log("");
    }

    if (manifest.warnings.length > 0) {
      printDivider();
      console.log("WARNINGS");
      printDivider();

      for (const warning of manifest.warnings) {
        console.log(`⚠️ ${warning}`);
      }

      console.log("");
    }

    printDivider();

    console.log(
      `Manifest created: ${path.relative(
        process.cwd(),
        manifestPath
      )}`
    );

    printDivider();
    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "Enterprise Translation Scan failed."
    );

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

main();