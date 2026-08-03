import path from "node:path";

import type { TranslationScannerConfig } from "./types";

const projectRoot = process.cwd();

export const translationScannerConfig: TranslationScannerConfig = {
  projectRoot,

  appDirectory: path.join(projectRoot, "app"),

  componentDirectories: [
    path.join(projectRoot, "app", "components"),
    path.join(projectRoot, "components"),
  ],

  messagesDirectory: path.join(projectRoot, "app", "messages"),

  outputDirectory: path.join(
    projectRoot,
    ".enterprise-translation"
  ),

  supportedLocales: ["en", "ht", "fr", "es"],

  excludedDirectories: [
    "node_modules",
    ".next",
    ".git",
    ".enterprise-translation",
    "dist",
    "build",
    "coverage",
  ],

  /*
   * These routes will still exist in the project,
   * but they will not be treated as public translation targets.
   *
   * Remove a prefix later when you are ready to scan that portal.
   */
  excludedRoutePrefixes: [
    "/api",
    "/admin",
    "/entrepreneur",
    "/supporter",
    "/coach",
    "/partner",
  ],

  /*
   * JSX attributes whose values are visible or meaningful
   * to the public and should therefore be translated.
   */
  visibleAttributes: [
    "alt",
    "title",
    "placeholder",
    "aria-label",
    "aria-description",
  ],

  /*
   * Translation calls recognized by the scanner:
   *
   * t("hero.title")
   * translate("hero.title")
   */
  translationFunctionNames: [
    "t",
    "translate",
  ],

  /*
   * Namespace declarations recognized by the scanner:
   *
   * useLanguage("about")
   * useTranslation("about")
   */
  namespaceHookNames: [
    "useLanguage",
    "useTranslation",
  ],
};