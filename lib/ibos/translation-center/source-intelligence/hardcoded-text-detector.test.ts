import assert from "node:assert/strict";
import test from "node:test";

import type { DiscoveredProjectFile } from "../file-scanner";
import { analyzeFileHardcodedText } from "./hardcoded-text-detector";

function sourceFile(relativePath: string): DiscoveredProjectFile {
  return {
    relativePath,
    fileName: relativePath.split("/").at(-1) ?? relativePath,
    extension: relativePath.endsWith(".tsx") ? ".tsx" : ".ts",
    route: "/example",
    namespace: "example",
  } as DiscoveredProjectFile;
}

test("JSX text detection ignores comparison operators and executable code", () => {
  const source = `
    const [items, setItems] = useState<string[]>([]);
    const recent = items.length > 0 && items.filter((item) => item.length < 7);
    export default function Page() {
      return <><h1>Schedule your interview</h1><button aria-label="Continue">Next step</button></>;
    }
  `;

  const result = analyzeFileHardcodedText({
    source,
    file: sourceFile("app/example/page.tsx"),
  });

  assert.equal(result.success, true);
  assert.deepEqual(
    result.occurrences.filter((item) => item.kind === "jsx_text").map((item) => item.text),
    ["Schedule your interview", "Next step"],
  );
  assert.equal(result.occurrences.some((item) => item.text.includes("items.filter")), false);
});

test("TypeScript comparisons never become JSX text", () => {
  const result = analyzeFileHardcodedText({
    source: "const ready = count > 0 && count < 10;",
    file: sourceFile("app/example/logic.ts"),
  });

  assert.equal(result.jsxTextCount, 0);
});
