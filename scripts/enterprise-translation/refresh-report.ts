import { scanTranslationCenter } from "../../lib/ibos/translation-center";

// Build a fresh dashboard snapshot from this checkout. Translation findings
// are expected while work remains; only an execution failure blocks a build.
async function main(): Promise<void> {
  const result = await scanTranslationCenter({
    projectRoot: process.cwd(),
    loadPreviousState: false,
    saveArtifacts: true,
  });

  console.log(
    `Translation scan: ${result.summary.totalPages} pages, ` +
      `${result.summary.hardcodedTexts} hardcoded texts, ` +
      `${result.summary.blockingIssues} blocking issues.`,
  );

  if (result.status === "failed" || result.errors.length > 0) {
    console.error(result.errors.join("\n") || "Translation scan failed.");
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
