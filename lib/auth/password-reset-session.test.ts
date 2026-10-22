import { test } from "node:test";
import assert from "node:assert/strict";
import { hasVerifiedPasswordResetSession } from "./password-reset-session";
const auth = (sessionId: string | null, userId: string | null, error: unknown = null) => ({
  getSession: async () => ({ data: { session: sessionId ? { user: { id: sessionId } } : null }, error: null }),
  getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error }),
}) as unknown as Parameters<typeof hasVerifiedPasswordResetSession>[0];
test("accepts an already initialized, server-verified session without a recovery event", async () => {
  assert.equal(await hasVerifiedPasswordResetSession(auth("student", "student")), true);
});
test("rejects missing, mismatched and revoked users", async () => {
  for (const input of [auth(null, null), auth("a", "b"), auth("a", "a", new Error("revoked"))])
    assert.equal(await hasVerifiedPasswordResetSession(input), false);
});
test("waits for asynchronous SDK initialization", async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const input = auth("a", "a");
  const original = input.getSession;
  input.getSession = async () => { await gate; return original(); };
  const check = hasVerifiedPasswordResetSession(input);
  release();
  assert.equal(await check, true);
});
test("fails closed on transport failure", async () => {
  const input = auth("a", "a");
  input.getUser = async () => { throw new Error("offline"); };
  assert.equal(await hasVerifiedPasswordResetSession(input), false);
});
