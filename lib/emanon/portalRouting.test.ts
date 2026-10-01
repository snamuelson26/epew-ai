import assert from "node:assert/strict";
import { test } from "node:test";
import { staffRedirect, organizationLoginPath, EMANON_DASHBOARD } from "./portalRouting";

test("staff redirects reject external, cross-organization and normalized traversal paths", () => {
  for (const value of [undefined, "//evil.example", "https://evil.example", "/admin/dashboard", "/organizations/OTHER/dashboard", "/organizations/EMANON-001/../../admin", "/organizations/EMANON-001/%2e%2e/%2e%2e/admin", "/emanon/login", "/orgdh/communication-center", "/\\evil.example"]) {
    assert.equal(staffRedirect(value), EMANON_DASHBOARD);
  }
});
test("Emanon deep links and OAuth round trips remain local", () => {
  assert.equal(staffRedirect("/organizations/EMANON-001/documents"), "/organizations/EMANON-001/documents");
  assert.equal(staffRedirect("/emanon/oauth/consent?request=123"), "/emanon/oauth/consent?request=123");
  assert.ok(organizationLoginPath("EMANON-001").startsWith("/emanon/login?redirect="));
});
test("ORGDH staff keep their own portal", () => {
  assert.equal(staffRedirect(undefined, "ORGDH-NETWORK"), "/orgdh/communication-center");
  assert.equal(staffRedirect(EMANON_DASHBOARD, "ORGDH-NETWORK"), "/orgdh/communication-center");
});
