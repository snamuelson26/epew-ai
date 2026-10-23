import assert from "node:assert/strict";
import test from "node:test";
import { supportLink } from "./supportLink";

test("links lead to the selected business support flow", () => {
  assert.equal(supportLink("FFR-001"), "https://www.epew.us/support/FFR-001");
  assert.equal(supportLink("OTHER-002"), "https://www.epew.us/support/OTHER-002");
});
test("missing or unsafe codes never produce a substitute campaign or business link", () => {
  for (const code of [undefined, null, "", " ", "../campaign/foo", "FFR-001?next=other"]) assert.equal(supportLink(code), "");
});
