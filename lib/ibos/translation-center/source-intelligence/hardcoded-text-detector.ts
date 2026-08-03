/**
 * ============================================================
 * EPEW-EDE-IBOS
 * Enterprise Translation Center
 * ------------------------------------------------------------
 * Source Intelligence Engine
 * Hardcoded Text Detector
 * Version: 1.0.0
 * ============================================================
 */

import path from "node:path";

import type { DiscoveredProjectFile } from "../file-scanner";

import {
  createStableId,
  getLineAndColumn,
  appearsUserFacingText,
  stripSourceComments,
  uniqueValues,
} from "../utils";

/**
 * Supported hardcoded-text locations.
 */
export type HardcodedTextKind =
  | "jsx_text"
  | "jsx_attribute"
  | "string_literal"
  | "template_literal"
  | "object_property"
  | "array_value"
  | "notification_message"
  | "validation_message"
  | "api_response"
  | "unknown";

/**
 * Severity assigned to a detected hardcoded string.
 */
export type HardcodedTextSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

/**
 * Review status for one hardcoded-text finding.
 */
export type HardcodedTextReviewStatus =
  | "pending"
  | "approved"
  | "ignored"
  | "converted"
  | "false_positive";

/**
 * One hardcoded user-facing text occurrence.
 */
export interface HardcodedTextOccurrence {
  id: string;
  sourceFile: string;
  route: string | null;
  namespace: string | null;
  componentName: string | null;

  text: string;
  normalizedText: string;
  kind: HardcodedTextKind;
  severity: HardcodedTextSeverity;
  reviewStatus: HardcodedTextReviewStatus;

  line: number;
  column: number;
  endLine: number;
  endColumn: number;

  attributeName: string | null;
  propertyName: string | null;
  htmlElement: string | null;

  suggestedNamespace: string | null;
  suggestedKey: string;
  suggestedFullKey: string;
  suggestedReplacement: string;

  rawExpression: string;
  confidence: number;
  reason: string;
}

/**
 * Result returned after analyzing one source file.
 */
export interface FileHardcodedTextAnalysis {
  success: boolean;
  sourceFile: string;
  route: string | null;
  namespace: string | null;
  componentName: string | null;

  occurrences: HardcodedTextOccurrence[];

  jsxTextCount: number;
  jsxAttributeCount: number;
  stringLiteralCount: number;
  templateLiteralCount: number;

  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;

  ignoredCandidates: number;
  errors: string[];
}

/**
 * Result returned after analyzing multiple project files.
 */
export interface ProjectHardcodedTextAnalysis {
  success: boolean;
  analyzedFiles: number;
  filesWithHardcodedText: number;

  occurrences: HardcodedTextOccurrence[];
  fileResults: FileHardcodedTextAnalysis[];

  totalOccurrences: number;
  uniqueTexts: string[];

  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;

  occurrencesByNamespace: Record<string, number>;
  occurrencesByKind: Record<HardcodedTextKind, number>;

  errors: string[];
}

/**
 * Detector configuration.
 */
export interface HardcodedTextDetectorOptions {
  /**
   * Minimum number of visible characters required.
   */
  minimumTextLength?: number;

  /**
   * Include JSX child text.
   *
   * Example:
   * <h1>Welcome to EPEW</h1>
   */
  detectJsxText?: boolean;

  /**
   * Include user-facing JSX attributes.
   *
   * Example:
   * placeholder="Enter your email"
   */
  detectJsxAttributes?: boolean;

  /**
   * Include object properties commonly used for messages.
   *
   * Example:
   * { message: "Application submitted" }
   */
  detectMessageProperties?: boolean;

  /**
   * Include general string literals.
   *
   * This is more aggressive and may produce false positives.
   */
  detectGeneralStringLiterals?: boolean;

  /**
   * Include template literals containing visible text.
   */
  detectTemplateLiterals?: boolean;

  /**
   * Include strings inside API response objects.
   */
  detectApiResponses?: boolean;

  /**
   * Ignore source files that match any supplied pattern.
   */
  ignoredFilePatterns?: RegExp[];

  /**
   * Additional JSX attributes considered user-facing.
   */
  userFacingAttributes?: string[];

  /**
   * Additional object property names considered user-facing.
   */
  userFacingProperties?: string[];

  /**
   * Translation function names. Strings inside these calls are ignored.
   */
  translationFunctionNames?: string[];

  /**
   * Text values that should never be reported.
   */
  ignoredExactValues?: string[];

  /**
   * Patterns used to ignore non-user-facing strings.
   */
  ignoredTextPatterns?: RegExp[];
}

/**
 * Internal candidate before it becomes an official occurrence.
 */
interface HardcodedTextCandidate {
  text: string;
  kind: HardcodedTextKind;
  startIndex: number;
  endIndex: number;
  rawExpression: string;
  attributeName?: string;
  propertyName?: string;
  htmlElement?: string;
  confidence: number;
  reason: string;
}

/**
 * Default user-facing JSX attributes.
 */
const DEFAULT_USER_FACING_ATTRIBUTES = [
  "alt",
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "caption",
  "description",
  "emptyMessage",
  "errorMessage",
  "helperText",
  "label",
  "message",
  "placeholder",
  "successMessage",
  "title",
  "tooltip",
];

/**
 * Default object-property names likely to contain visible messages.
 */
const DEFAULT_USER_FACING_PROPERTIES = [
  "alert",
  "caption",
  "description",
  "detail",
  "error",
  "errorMessage",
  "heading",
  "helperText",
  "label",
  "message",
  "name",
  "notification",
  "placeholder",
  "reason",
  "statusText",
  "subtitle",
  "success",
  "successMessage",
  "summary",
  "text",
  "title",
  "tooltip",
  "warning",
];

/**
 * Translation functions whose arguments must not be reported.
 */
const DEFAULT_TRANSLATION_FUNCTION_NAMES = [
  "t",
  "translate",
  "translation",
  "getTranslation",
  "formatMessage",
];

/**
 * Exact values that are commonly technical rather than user-facing.
 */
const DEFAULT_IGNORED_EXACT_VALUES = [
  "",
  " ",
  "use client",
  "use server",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
  "true",
  "false",
  "null",
  "undefined",
];

/**
 * Patterns representing technical strings.
 */
const DEFAULT_IGNORED_TEXT_PATTERNS = [
  /^https?:\/\//i,
  /^mailto:/i,
  /^tel:/i,
  /^\/[A-Za-z0-9_./?=&:#-]*$/,
  /^#[0-9A-Fa-f]{3,8}$/,
  /^rgba?\(/i,
  /^hsla?\(/i,
  /^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|fr)$/i,
  /^[A-Za-z0-9_-]+\.(?:tsx?|jsx?|json|css|scss|svg|png|jpe?g|webp|gif)$/i,
  /^[A-Za-z0-9_-]+\/[A-Za-z0-9_./-]+$/,
  /^[a-z]+(?:-[a-z]+)+$/,
  /^[A-Z0-9_]+$/,
  /^[a-zA-Z_$][\w$]*$/,
  /^[\d.,:%$+\-*/=<>()[\]{}]+$/,
  /^[a-z]+:[a-z0-9_-]+$/i,
  /^var\(--[A-Za-z0-9_-]+\)$/,
  /^data:/i,
];

/**
 * JSX attributes that usually contain technical values.
 */
const TECHNICAL_JSX_ATTRIBUTES = new Set([
  "action",
  "as",
  "autoComplete",
  "className",
  "color",
  "data-testid",
  "defaultValue",
  "dir",
  "href",
  "htmlFor",
  "id",
  "key",
  "lang",
  "method",
  "name",
  "rel",
  "role",
  "src",
  "style",
  "target",
  "type",
  "value",
]);

/**
 * Default detector options.
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    HardcodedTextDetectorOptions,
    | "minimumTextLength"
    | "detectJsxText"
    | "detectJsxAttributes"
    | "detectMessageProperties"
    | "detectGeneralStringLiterals"
    | "detectTemplateLiterals"
    | "detectApiResponses"
  >
> = {
  minimumTextLength: 2,
  detectJsxText: true,
  detectJsxAttributes: true,
  detectMessageProperties: true,
  detectGeneralStringLiterals: false,
  detectTemplateLiterals: true,
  detectApiResponses: true,
};

/**
 * Escapes a string for use in a regular expression.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes visible text.
 */
function normalizeVisibleText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

/**
 * Determines whether a string has letters.
 */
function containsLetters(value: string): boolean {
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value);
}

/**
 * Determines whether text looks like a translation key.
 */
function looksLikeTranslationKey(value: string): boolean {
  return /^[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/i.test(value);
}

/**
 * Determines whether text is probably a CSS class list.
 */
function looksLikeCssClassList(value: string): boolean {
  const tokens = value.trim().split(/\s+/);

  if (tokens.length < 2) {
    return false;
  }

  const technicalTokens = tokens.filter((token) =>
    /^(?:sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|dark:)?[a-z0-9_[\]-]+(?:\/[a-z0-9]+)?$/i.test(
      token,
    ),
  );

  return technicalTokens.length === tokens.length;
}

/**
 * Determines whether text appears to be executable code.
 */
function looksLikeCode(value: string): boolean {
  return (
    /^(?:const|let|var|function|return|import|export|interface|type|class)\b/.test(
      value,
    ) ||
    /=>/.test(value) ||
    /^[A-Za-z_$][\w$]*\([^)]*\)$/.test(value)
  );
}

/**
 * Determines whether text should be ignored.
 */
function shouldIgnoreText(input: {
  text: string;
  minimumTextLength: number;
  ignoredExactValues: Set<string>;
  ignoredPatterns: RegExp[];
}): boolean {
  const normalized = normalizeVisibleText(input.text);

  if (normalized.length < input.minimumTextLength) {
    return true;
  }

  if (input.ignoredExactValues.has(normalized)) {
    return true;
  }

  if (!containsLetters(normalized)) {
    return true;
  }

  if (looksLikeTranslationKey(normalized)) {
    return true;
  }

  if (looksLikeCssClassList(normalized)) {
    return true;
  }

  if (looksLikeCode(normalized)) {
    return true;
  }

  if (
    input.ignoredPatterns.some((pattern) => pattern.test(normalized))
  ) {
    return true;
  }

   return !appearsUserFacingText(normalized);
}

/**
 * Determines whether an index is inside a translation function call.
 */
function isInsideTranslationFunctionCall(input: {
  source: string;
  stringStartIndex: number;
  translationFunctionNames: string[];
}): boolean {
  const lookBehindStart = Math.max(0, input.stringStartIndex - 100);
  const precedingText = input.source.slice(
    lookBehindStart,
    input.stringStartIndex,
  );

  return input.translationFunctionNames.some((functionName) => {
    const pattern = new RegExp(
      `\\b${escapeRegExp(functionName)}\\s*\\(\\s*$`,
    );

    return pattern.test(precedingText);
  });
}

/**
 * Determines whether an index appears inside an import statement.
 */
function isInsideImportStatement(
  source: string,
  index: number,
): boolean {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const lineEnd = source.indexOf("\n", index);
  const line = source.slice(
    lineStart,
    lineEnd === -1 ? source.length : lineEnd,
  );

  return /^\s*(?:import|export)\b/.test(line);
}

/**
 * Determines whether an index appears in a type declaration.
 */
function isInsideTypeDeclaration(
  source: string,
  index: number,
): boolean {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const lineEnd = source.indexOf("\n", index);
  const line = source.slice(
    lineStart,
    lineEnd === -1 ? source.length : lineEnd,
  );

  return /^\s*(?:type|interface)\b/.test(line);
}

/**
 * Extracts JSX child text.
 *
 * Example:
 * <h1>Welcome to EPEW</h1>
 */
function extractJsxTextCandidates(
  source: string,
): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const pattern = />([^<>{}]+)</g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const rawText = match[1] ?? "";
    const text = normalizeVisibleText(rawText);

    if (!text) {
      continue;
    }

    const startOffset = match[0].indexOf(rawText);
    const startIndex = match.index + Math.max(startOffset, 1);

    const openingTagStart = source.lastIndexOf("<", match.index);
    const openingTag = source.slice(openingTagStart, match.index + 1);

    const elementMatch = openingTag.match(
      /<([A-Za-z][A-Za-z0-9._:-]*)\b/,
    );

    candidates.push({
      text,
      kind: "jsx_text",
      startIndex,
      endIndex: startIndex + rawText.length,
      rawExpression: rawText,
      htmlElement: elementMatch?.[1] ?? undefined,
      confidence: 0.98,
      reason:
        "Visible text was found directly between JSX elements.",
    });
  }

  return candidates;
}

/**
 * Extracts user-facing JSX attribute values.
 *
 * Examples:
 * placeholder="Enter your email"
 * aria-label={"Close dialog"}
 */
function extractJsxAttributeCandidates(input: {
  source: string;
  userFacingAttributes: string[];
}): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const attributePattern = input.userFacingAttributes
    .map(escapeRegExp)
    .join("|");

  const pattern = new RegExp(
    `\\b(${attributePattern})\\s*=\\s*(?:["']([^"']+)["']|\\{\\s*["']([^"']+)["']\\s*\\}|\\{\\s*\`([^\\\`$]+)\`\\s*\\})`,
    "g",
  );

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const attributeName = match[1] ?? null;
    const text = normalizeVisibleText(
      match[2] ?? match[3] ?? match[4] ?? "",
    );

    if (!text || !attributeName) {
      continue;
    }

    const textOffset = match[0].indexOf(
      match[2] ?? match[3] ?? match[4] ?? "",
    );

    const startIndex = match.index + Math.max(textOffset, 0);

    const tagStart = input.source.lastIndexOf("<", match.index);
    const tagEnd = input.source.indexOf(">", match.index);

    const tagText =
      tagStart >= 0 && tagEnd >= 0
        ? input.source.slice(tagStart, tagEnd + 1)
        : "";

    const elementMatch = tagText.match(
      /<([A-Za-z][A-Za-z0-9._:-]*)\b/,
    );

    candidates.push({
      text,
      kind: "jsx_attribute",
      startIndex,
      endIndex: startIndex + text.length,
      rawExpression: match[0],
      attributeName,
      htmlElement: elementMatch?.[1] ?? undefined,
      confidence: 0.97,
      reason: `A user-facing JSX attribute named "${attributeName}" contains hardcoded text.`,
    });
  }

  return candidates;
}

/**
 * Extracts object properties likely to contain user-facing text.
 */
function extractMessagePropertyCandidates(input: {
  source: string;
  userFacingProperties: string[];
}): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const propertyPattern = input.userFacingProperties
    .map(escapeRegExp)
    .join("|");

  const pattern = new RegExp(
    `(?:^|[,{\\n])\\s*(?:["']?(${propertyPattern})["']?)\\s*:\\s*(?:["']([^"'\\n\\r]+)["']|\`([^\\\`$]+)\`)`,
    "g",
  );

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input.source)) !== null) {
    const propertyName = match[1] ?? null;
    const rawText = match[2] ?? match[3] ?? "";
    const text = normalizeVisibleText(rawText);

    if (!text || !propertyName) {
      continue;
    }

    const textOffset = match[0].indexOf(rawText);
    const startIndex = match.index + Math.max(textOffset, 0);

    candidates.push({
      text,
      kind: classifyMessageProperty(propertyName),
      startIndex,
      endIndex: startIndex + rawText.length,
      rawExpression: match[0].trim(),
      propertyName,
      confidence: 0.94,
      reason: `The "${propertyName}" property likely contains user-facing text.`,
    });
  }

  return candidates;
}

/**
 * Classifies message properties.
 */
function classifyMessageProperty(
  propertyName: string,
): HardcodedTextKind {
  const normalized = propertyName.toLowerCase();

  if (
    normalized.includes("error") ||
    normalized.includes("validation") ||
    normalized === "reason"
  ) {
    return "validation_message";
  }

  if (
    normalized.includes("notification") ||
    normalized.includes("alert") ||
    normalized.includes("success") ||
    normalized.includes("warning")
  ) {
    return "notification_message";
  }

  return "object_property";
}

/**
 * Extracts visible text from template literals without expressions.
 */
function extractTemplateLiteralCandidates(
  source: string,
): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const pattern = /`([^`$]+)`/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const rawText = match[1] ?? "";
    const text = normalizeVisibleText(rawText);

    if (!text) {
      continue;
    }

    candidates.push({
      text,
      kind: "template_literal",
      startIndex: match.index + 1,
      endIndex: match.index + 1 + rawText.length,
      rawExpression: match[0],
      confidence: 0.72,
      reason:
        "A static template literal contains text that may be visible to users.",
    });
  }

  return candidates;
}

/**
 * Extracts general string literals.
 *
 * This detector is optional because many source-code strings are
 * technical rather than user-facing.
 */
function extractGeneralStringLiteralCandidates(
  source: string,
): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const pattern = /(["'])([^"'\\\n\r]*(?:\\.[^"'\\\n\r]*)*)\1/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const rawText = match[2] ?? "";
    const text = normalizeVisibleText(rawText);

    if (!text) {
      continue;
    }

    candidates.push({
      text,
      kind: "string_literal",
      startIndex: match.index + 1,
      endIndex: match.index + 1 + rawText.length,
      rawExpression: match[0],
      confidence: 0.55,
      reason:
        "A string literal contains natural-language text that may be user-facing.",
    });
  }

  return candidates;
}

/**
 * Extracts message values returned by API-response helpers.
 *
 * Examples:
 * NextResponse.json({ message: "Access denied" })
 * Response.json({ error: "Record not found" })
 */
function extractApiResponseCandidates(
  source: string,
): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  const pattern =
    /\b(?:NextResponse|Response)\.json\s*\(\s*\{([\s\S]*?)\}\s*(?:,|\))/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const objectBody = match[1] ?? "";
    const bodyStart = match.index + match[0].indexOf(objectBody);

    const propertyPattern =
      /\b(message|error|detail|description|success|warning)\s*:\s*(?:["']([^"']+)["']|`([^`$]+)`)/g;

    let propertyMatch: RegExpExecArray | null;

    while (
      (propertyMatch = propertyPattern.exec(objectBody)) !== null
    ) {
      const propertyName = propertyMatch[1] ?? null;
      const rawText =
        propertyMatch[2] ?? propertyMatch[3] ?? "";
      const text = normalizeVisibleText(rawText);

      if (!text || !propertyName) {
        continue;
      }

      const textOffset = propertyMatch[0].indexOf(rawText);
      const startIndex =
        bodyStart +
        propertyMatch.index +
        Math.max(textOffset, 0);

      candidates.push({
        text,
        kind: "api_response",
        startIndex,
        endIndex: startIndex + rawText.length,
        rawExpression: propertyMatch[0],
        propertyName,
        confidence: 0.96,
        reason:
          "A response object contains a hardcoded message that may be displayed by a client application.",
      });
    }
  }

  return candidates;
}

/**
 * Converts a text value into a safe translation-key segment.
 */
function textToKeySegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!normalized) {
    return "text";
  }

  const words = normalized.split("_").filter(Boolean);

  return words.slice(0, 8).join("_") || "text";
}

/**
 * Returns a section prefix based on the finding location.
 */
function getSuggestedKeyPrefix(
  candidate: HardcodedTextCandidate,
): string {
  if (candidate.kind === "jsx_attribute") {
    const attribute = candidate.attributeName ?? "attribute";

    if (attribute === "placeholder") {
      return "form.placeholder";
    }

    if (attribute.startsWith("aria-")) {
      return "accessibility";
    }

    if (attribute === "alt") {
      return "image.alt";
    }

    return `attributes.${textToKeySegment(attribute)}`;
  }

  if (candidate.kind === "validation_message") {
    return "validation";
  }

  if (candidate.kind === "notification_message") {
    return "notifications";
  }

  if (candidate.kind === "api_response") {
    return "api.messages";
  }

  if (candidate.htmlElement) {
    const element = candidate.htmlElement.toLowerCase();

    if (/^h[1-6]$/.test(element)) {
      return "headings";
    }

    if (element === "button") {
      return "buttons";
    }

    if (element === "label") {
      return "form.labels";
    }

    if (element === "p") {
      return "content";
    }
  }

  return "content";
}

/**
 * Creates a suggested translation key.
 */
function createSuggestedKey(
  candidate: HardcodedTextCandidate,
): string {
  const prefix = getSuggestedKeyPrefix(candidate);
  const textSegment = textToKeySegment(candidate.text);

  return `${prefix}.${textSegment}`;
}

/**
 * Returns the probable component name from a source file.
 */
function getComponentName(
  file: DiscoveredProjectFile,
): string | null {
  const baseName = path.basename(
    file.relativePath,
    path.extname(file.relativePath),
  );

  if (baseName === "page" || baseName === "layout") {
    return null;
  }

  return baseName || null;
}

/**
 * Determines finding severity.
 */
function determineSeverity(
  candidate: HardcodedTextCandidate,
): HardcodedTextSeverity {
  if (
    candidate.kind === "validation_message" ||
    candidate.kind === "api_response"
  ) {
    return "error";
  }

  if (
    candidate.kind === "notification_message" ||
    candidate.kind === "jsx_text" ||
    candidate.kind === "jsx_attribute"
  ) {
    return "warning";
  }

  return candidate.confidence >= 0.85
    ? "warning"
    : "info";
}

/**
 * Creates the suggested replacement expression.
 */
function createSuggestedReplacement(input: {
  candidate: HardcodedTextCandidate;
  localKey: string;
}): string {
  if (input.candidate.kind === "jsx_text") {
    return `{t("${input.localKey}")}`;
  }

  if (input.candidate.kind === "jsx_attribute") {
    return `{t("${input.localKey}")}`;
  }

  return `t("${input.localKey}")`;
}

/**
 * Converts a candidate into an official occurrence.
 */
function createOccurrence(input: {
  source: string;
  file: DiscoveredProjectFile;
  candidate: HardcodedTextCandidate;
}): HardcodedTextOccurrence {
  const startPosition = getLineAndColumn(
    input.source,
    input.candidate.startIndex,
  );

  const endPosition = getLineAndColumn(
    input.source,
    input.candidate.endIndex,
  );

  const suggestedKey = createSuggestedKey(input.candidate);
  const namespace = input.file.namespace;

  return {
    id: createStableId(
      "hardcoded-text",
      input.file.relativePath,
      input.candidate.text,
      startPosition.line,
      startPosition.column,
    ),
    sourceFile: input.file.relativePath,
    route: input.file.route,
    namespace,
    componentName: getComponentName(input.file),

    text: input.candidate.text,
    normalizedText: normalizeVisibleText(input.candidate.text),
    kind: input.candidate.kind,
    severity: determineSeverity(input.candidate),
    reviewStatus: "pending",

    line: startPosition.line,
    column: startPosition.column,
    endLine: endPosition.line,
    endColumn: endPosition.column,

    attributeName: input.candidate.attributeName ?? null,
    propertyName: input.candidate.propertyName ?? null,
    htmlElement: input.candidate.htmlElement ?? null,

    suggestedNamespace: namespace,
    suggestedKey,
    suggestedFullKey: namespace
      ? `${namespace}.${suggestedKey}`
      : suggestedKey,
    suggestedReplacement: createSuggestedReplacement({
      candidate: input.candidate,
      localKey: suggestedKey,
    }),

    rawExpression: input.candidate.rawExpression,
    confidence: input.candidate.confidence,
    reason: input.candidate.reason,
  };
}

/**
 * Removes candidates that overlap stronger findings.
 */
function removeOverlappingCandidates(
  candidates: HardcodedTextCandidate[],
): HardcodedTextCandidate[] {
  const sorted = [...candidates].sort((first, second) => {
    if (first.startIndex !== second.startIndex) {
      return first.startIndex - second.startIndex;
    }

    return second.confidence - first.confidence;
  });

  const accepted: HardcodedTextCandidate[] = [];

  for (const candidate of sorted) {
    const overlap = accepted.find(
      (existing) =>
        candidate.startIndex < existing.endIndex &&
        candidate.endIndex > existing.startIndex,
    );

    if (!overlap) {
      accepted.push(candidate);
      continue;
    }

    if (candidate.confidence > overlap.confidence) {
      const overlapIndex = accepted.indexOf(overlap);
      accepted.splice(overlapIndex, 1, candidate);
    }
  }

  return accepted.sort(
    (first, second) => first.startIndex - second.startIndex,
  );
}

/**
 * Removes duplicate occurrences.
 */
function deduplicateOccurrences(
  occurrences: HardcodedTextOccurrence[],
): HardcodedTextOccurrence[] {
  const records = new Map<
    string,
    HardcodedTextOccurrence
  >();

  for (const occurrence of occurrences) {
    const key = [
      occurrence.sourceFile,
      occurrence.normalizedText,
      occurrence.line,
      occurrence.column,
      occurrence.kind,
    ].join("::");

    if (!records.has(key)) {
      records.set(key, occurrence);
    }
  }

  return [...records.values()].sort((first, second) => {
    if (first.line !== second.line) {
      return first.line - second.line;
    }

    return first.column - second.column;
  });
}

/**
 * Determines whether a file should be ignored.
 */
function shouldIgnoreFile(
  filePath: string,
  patterns: RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(filePath));
}

/**
 * Builds all candidates for a source file.
 */
function collectCandidates(input: {
  source: string;
  options: Required<
    Pick<
      HardcodedTextDetectorOptions,
      | "detectJsxText"
      | "detectJsxAttributes"
      | "detectMessageProperties"
      | "detectGeneralStringLiterals"
      | "detectTemplateLiterals"
      | "detectApiResponses"
    >
  >;
  userFacingAttributes: string[];
  userFacingProperties: string[];
}): HardcodedTextCandidate[] {
  const candidates: HardcodedTextCandidate[] = [];

  if (input.options.detectJsxText) {
    candidates.push(...extractJsxTextCandidates(input.source));
  }

  if (input.options.detectJsxAttributes) {
    candidates.push(
      ...extractJsxAttributeCandidates({
        source: input.source,
        userFacingAttributes: input.userFacingAttributes,
      }),
    );
  }

  if (input.options.detectMessageProperties) {
    candidates.push(
      ...extractMessagePropertyCandidates({
        source: input.source,
        userFacingProperties: input.userFacingProperties,
      }),
    );
  }

  if (input.options.detectTemplateLiterals) {
    candidates.push(
      ...extractTemplateLiteralCandidates(input.source),
    );
  }

  if (input.options.detectApiResponses) {
    candidates.push(
      ...extractApiResponseCandidates(input.source),
    );
  }

  if (input.options.detectGeneralStringLiterals) {
    candidates.push(
      ...extractGeneralStringLiteralCandidates(input.source),
    );
  }

  return candidates;
}

/**
 * Analyzes hardcoded user-facing text in one source file.
 */
export function analyzeFileHardcodedText(input: {
  source: string;
  file: DiscoveredProjectFile;
  options?: HardcodedTextDetectorOptions;
}): FileHardcodedTextAnalysis {
  const options = {
    ...DEFAULT_OPTIONS,
    ...(input.options ?? {}),
  };

  const ignoredFilePatterns =
    input.options?.ignoredFilePatterns ?? [];

  const userFacingAttributes = uniqueValues([
    ...DEFAULT_USER_FACING_ATTRIBUTES,
    ...(input.options?.userFacingAttributes ?? []),
  ]);

  const userFacingProperties = uniqueValues([
    ...DEFAULT_USER_FACING_PROPERTIES,
    ...(input.options?.userFacingProperties ?? []),
  ]);

  const translationFunctionNames = uniqueValues([
    ...DEFAULT_TRANSLATION_FUNCTION_NAMES,
    ...(input.options?.translationFunctionNames ?? []),
  ]);

  const ignoredExactValues = new Set([
    ...DEFAULT_IGNORED_EXACT_VALUES,
    ...(input.options?.ignoredExactValues ?? []),
  ]);

  const ignoredPatterns = [
    ...DEFAULT_IGNORED_TEXT_PATTERNS,
    ...(input.options?.ignoredTextPatterns ?? []),
  ];

  const errors: string[] = [];

  if (
    shouldIgnoreFile(
      input.file.relativePath,
      ignoredFilePatterns,
    )
  ) {
    return {
      success: true,
      sourceFile: input.file.relativePath,
      route: input.file.route,
      namespace: input.file.namespace,
      componentName: getComponentName(input.file),
      occurrences: [],
      jsxTextCount: 0,
      jsxAttributeCount: 0,
      stringLiteralCount: 0,
      templateLiteralCount: 0,
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      ignoredCandidates: 0,
      errors: [],
    };
  }

  let occurrences: HardcodedTextOccurrence[] = [];
  let ignoredCandidates = 0;

  try {
    const sourceWithoutComments = stripSourceComments(
      input.source,
    );

    const candidates = collectCandidates({
      source: sourceWithoutComments,
      options,
      userFacingAttributes,
      userFacingProperties,
    });

    const filteredCandidates =
      removeOverlappingCandidates(candidates).filter((candidate) => {
        if (
          shouldIgnoreText({
            text: candidate.text,
            minimumTextLength: options.minimumTextLength,
            ignoredExactValues,
            ignoredPatterns,
          })
        ) {
          ignoredCandidates += 1;
          return false;
        }

        if (
          isInsideTranslationFunctionCall({
            source: sourceWithoutComments,
            stringStartIndex: candidate.startIndex,
            translationFunctionNames,
          })
        ) {
          ignoredCandidates += 1;
          return false;
        }

        if (
          isInsideImportStatement(
            sourceWithoutComments,
            candidate.startIndex,
          )
        ) {
          ignoredCandidates += 1;
          return false;
        }

        if (
          isInsideTypeDeclaration(
            sourceWithoutComments,
            candidate.startIndex,
          )
        ) {
          ignoredCandidates += 1;
          return false;
        }

        if (
          candidate.kind === "jsx_attribute" &&
          candidate.attributeName &&
          TECHNICAL_JSX_ATTRIBUTES.has(
            candidate.attributeName,
          )
        ) {
          ignoredCandidates += 1;
          return false;
        }

        return true;
      });

    occurrences = deduplicateOccurrences(
      filteredCandidates.map((candidate) =>
        createOccurrence({
          source: sourceWithoutComments,
          file: input.file,
          candidate,
        }),
      ),
    );
  } catch (error) {
    errors.push(
      `Unable to detect hardcoded text in "${input.file.relativePath}": ${
        error instanceof Error
          ? error.message
          : "Unknown hardcoded-text detection error."
      }`,
    );
  }

  return {
    success: errors.length === 0,
    sourceFile: input.file.relativePath,
    route: input.file.route,
    namespace: input.file.namespace,
    componentName: getComponentName(input.file),
    occurrences,

    jsxTextCount: occurrences.filter(
      (occurrence) => occurrence.kind === "jsx_text",
    ).length,

    jsxAttributeCount: occurrences.filter(
      (occurrence) =>
        occurrence.kind === "jsx_attribute",
    ).length,

    stringLiteralCount: occurrences.filter(
      (occurrence) =>
        occurrence.kind === "string_literal" ||
        occurrence.kind === "object_property" ||
        occurrence.kind === "notification_message" ||
        occurrence.kind === "validation_message" ||
        occurrence.kind === "api_response",
    ).length,

    templateLiteralCount: occurrences.filter(
      (occurrence) =>
        occurrence.kind === "template_literal",
    ).length,

    criticalCount: occurrences.filter(
      (occurrence) => occurrence.severity === "critical",
    ).length,

    errorCount: occurrences.filter(
      (occurrence) => occurrence.severity === "error",
    ).length,

    warningCount: occurrences.filter(
      (occurrence) => occurrence.severity === "warning",
    ).length,

    infoCount: occurrences.filter(
      (occurrence) => occurrence.severity === "info",
    ).length,

    ignoredCandidates,
    errors,
  };
}

/**
 * Analyzes hardcoded text across multiple project files.
 *
 * The source map must use project-relative file paths as keys.
 */
export function analyzeProjectHardcodedText(input: {
  files: DiscoveredProjectFile[];
  sources: Record<string, string>;
  options?: HardcodedTextDetectorOptions;
}): ProjectHardcodedTextAnalysis {
  const fileResults: FileHardcodedTextAnalysis[] = [];
  const errors: string[] = [];

  for (const file of input.files) {
    const source = input.sources[file.relativePath];

    if (source === undefined) {
      errors.push(
        `Source content was not provided for "${file.relativePath}".`,
      );

      continue;
    }

    const result = analyzeFileHardcodedText({
      source,
      file,
      options: input.options,
    });

    fileResults.push(result);
    errors.push(...result.errors);
  }

  const occurrences = fileResults.flatMap(
    (result) => result.occurrences,
  );

  const occurrencesByNamespace: Record<string, number> = {};

  for (const occurrence of occurrences) {
    const namespace =
      occurrence.namespace ?? "unassigned";

    occurrencesByNamespace[namespace] =
      (occurrencesByNamespace[namespace] ?? 0) + 1;
  }

  const occurrencesByKind =
    {} as Record<HardcodedTextKind, number>;

  const kinds: HardcodedTextKind[] = [
    "jsx_text",
    "jsx_attribute",
    "string_literal",
    "template_literal",
    "object_property",
    "array_value",
    "notification_message",
    "validation_message",
    "api_response",
    "unknown",
  ];

  for (const kind of kinds) {
    occurrencesByKind[kind] = occurrences.filter(
      (occurrence) => occurrence.kind === kind,
    ).length;
  }

  return {
    success: errors.length === 0,
    analyzedFiles: fileResults.length,
    filesWithHardcodedText: fileResults.filter(
      (result) => result.occurrences.length > 0,
    ).length,

    occurrences,
    fileResults,

    totalOccurrences: occurrences.length,
    uniqueTexts: uniqueValues(
      occurrences.map(
        (occurrence) => occurrence.normalizedText,
      ),
    ).sort(),

    criticalCount: occurrences.filter(
      (occurrence) => occurrence.severity === "critical",
    ).length,

    errorCount: occurrences.filter(
      (occurrence) => occurrence.severity === "error",
    ).length,

    warningCount: occurrences.filter(
      (occurrence) => occurrence.severity === "warning",
    ).length,

    infoCount: occurrences.filter(
      (occurrence) => occurrence.severity === "info",
    ).length,

    occurrencesByNamespace,
    occurrencesByKind,
    errors,
  };
}

/**
 * Returns all hardcoded-text findings for one file.
 */
export function getHardcodedTextForFile(
  analysis: ProjectHardcodedTextAnalysis,
  sourceFile: string,
): HardcodedTextOccurrence[] {
  return analysis.occurrences.filter(
    (occurrence) =>
      occurrence.sourceFile === sourceFile,
  );
}

/**
 * Returns all hardcoded-text findings for one route.
 */
export function getHardcodedTextForRoute(
  analysis: ProjectHardcodedTextAnalysis,
  route: string,
): HardcodedTextOccurrence[] {
  return analysis.occurrences.filter(
    (occurrence) => occurrence.route === route,
  );
}

/**
 * Returns all hardcoded-text findings for one namespace.
 */
export function getHardcodedTextForNamespace(
  analysis: ProjectHardcodedTextAnalysis,
  namespace: string,
): HardcodedTextOccurrence[] {
  return analysis.occurrences.filter(
    (occurrence) =>
      occurrence.namespace === namespace,
  );
}

/**
 * Returns all findings at or above a severity level.
 */
export function getHardcodedTextBySeverity(
  analysis: ProjectHardcodedTextAnalysis,
  severity: HardcodedTextSeverity,
): HardcodedTextOccurrence[] {
  const severityRank: Record<
    HardcodedTextSeverity,
    number
  > = {
    info: 1,
    warning: 2,
    error: 3,
    critical: 4,
  };

  const minimumRank = severityRank[severity];

  return analysis.occurrences.filter(
    (occurrence) =>
      severityRank[occurrence.severity] >= minimumRank,
  );
}

/**
 * Returns files containing hardcoded user-facing text.
 */
export function getFilesWithHardcodedText(
  analysis: ProjectHardcodedTextAnalysis,
): string[] {
  return uniqueValues(
    analysis.occurrences.map(
      (occurrence) => occurrence.sourceFile,
    ),
  ).sort();
}

/**
 * Returns suggested translation entries grouped by namespace.
 */
export function createSuggestedTranslationEntries(
  analysis: ProjectHardcodedTextAnalysis,
): Record<string, Record<string, string>> {
  const entries: Record<
    string,
    Record<string, string>
  > = {};

  for (const occurrence of analysis.occurrences) {
    const namespace =
      occurrence.suggestedNamespace ?? "unassigned";

    entries[namespace] ??= {};

    if (
      entries[namespace][occurrence.suggestedKey] === undefined
    ) {
      entries[namespace][occurrence.suggestedKey] =
        occurrence.text;
    }
  }

  return entries;
}