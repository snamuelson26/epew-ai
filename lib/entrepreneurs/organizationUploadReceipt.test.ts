import assert from "node:assert/strict";
import test from "node:test";
import { signUploadReceipt, verifyUploadReceipt, validateDocumentMetadata, type OrganizationUploadReceipt } from "./organizationUploadReceipt";

process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-receipt-signing-key";
const receipt: OrganizationUploadReceipt = {
  userId: "test-user", email: "applicant@example.test", expires: Date.now() + 60000,
  names: ["Representative", "One", "Two", "Three"], documents: [],
};

test("private upload receipt preserves the member binding", () => {
  assert.deepEqual(verifyUploadReceipt(signUploadReceipt(receipt)), receipt);
});
test("tampering with identity ownership is rejected", () => {
  const token = signUploadReceipt(receipt);
  const tampered = Buffer.from(JSON.stringify({ ...receipt, userId: "another-user" })).toString("base64url");
  assert.throws(() => verifyUploadReceipt(`${tampered}.${token.split(".")[1]}`), /Invalid/);
});
test("expired receipts and malformed signatures cannot submit", () => {
  assert.throws(() => verifyUploadReceipt(signUploadReceipt({ ...receipt, expires: 0 })), /expired/);
  assert.throws(() => verifyUploadReceipt("invalid.signature"), /Invalid/);
});
test("every identity file has a valid type and bounded individual size", () => {
  validateDocumentMetadata(10 * 1024 * 1024, "application/pdf", false);
  validateDocumentMetadata(6 * 1024 * 1024, "image/jpeg", true);
  for (const size of [0, -1, NaN, 0.5, 10 * 1024 * 1024 + 1]) assert.throws(() => validateDocumentMetadata(size, "image/jpeg", false));
  assert.throws(() => validateDocumentMetadata(100, "application/pdf", true));
  assert.throws(() => validateDocumentMetadata(100, "text/html", false));
});
