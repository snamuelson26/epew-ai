import test from "node:test";
import assert from "node:assert/strict";
import { whatsappNumber } from "./config";
import { validatedMediaPath } from "./media";
// The shared interview module loads the server-side database client but these tests perform no queries.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-only";
test("international numbers preserve country codes and reject local numbers", () => {
  assert.equal(whatsappNumber("whatsapp:+509 1234 5678"), "+50912345678");
  assert.equal(whatsappNumber("7184132059"), null);
  assert.equal(whatsappNumber("+33123456789"), "+33123456789");
});
test("voice-note downloads reject foreign accounts, messages and external hosts", () => {
  const a = "AC" + "a".repeat(32),
    m = "SM" + "b".repeat(32),
    media = "ME" + "c".repeat(32);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${a}/Messages/${m}/Media/${media}`;
  assert.equal(validatedMediaPath(url, a, m).hostname, "api.twilio.com");
  for (const unsafe of [
    url.replace("api.twilio.com", "evil.test"),
    url.replace(a, "AC" + "d".repeat(32)),
    url.replace(m, "SM" + "e".repeat(32)),
    url + "?redirect=https://evil.test",
  ])
    assert.throws(() => validatedMediaPath(unsafe, a, m));
});
test("language choice and repeat never advance the shared interview; an answer advances once", async () => {
  const { freshState } = await import("../interviews/prequalification");
  const { whatsappInterviewTurn } = await import("./interviewTurn");
  const state = freshState();
  const app = { business_name: "Test business" };
  const selected = await whatsappInterviewTurn(state, app, "1", true);
  assert.equal(selected.state.current_topic, state.current_topic);
  assert.equal(selected.state.messages.length, 0);
  const repeat = await whatsappInterviewTurn(
    selected.state,
    app,
    "REPEAT",
    false,
  );
  assert.equal(repeat.state.current_topic, state.current_topic);
  const answer = await whatsappInterviewTurn(
    selected.state,
    app,
    "Yes, that is my business",
    false,
  );
  assert.notEqual(answer.state.current_topic, state.current_topic);
  assert.equal(
    answer.state.messages.filter((m) => m.role === "entrepreneur").length,
    1,
  );
  assert.equal(state.messages.length, 0);
  const change = await whatsappInterviewTurn(
    answer.state,
    app,
    "LANGUAGE",
    false,
  );
  assert.equal(change.choosingLanguage, true);
  assert.equal(change.state.current_topic, answer.state.current_topic);
});
