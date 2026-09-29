import assert from "node:assert/strict";
import test from "node:test";
import twilio from "twilio";
import { appendInterviewGather, isNewInterviewCall, readInterviewNotes } from "./prequalificationListening";

test("a new outbound call resets listening even when previous call exhausted retries", () => {
  assert.equal(isNewInterviewCall("CAprevious", "CAnew", false), true);
  assert.equal(isNewInterviewCall("CAprevious", "CAnew", true), true);
  assert.equal(isNewInterviewCall(undefined, "CAnew", false), true);
});
test("a listening callback in the same call does not repeatedly reset its retry count", () => {
  assert.equal(isNewInterviewCall("CAcurrent", "CAcurrent", true), false);
});
test("Luidgy-style historical correction retains both structured state and correction", () => {
  const state = { source: "phone_prequalification_approved_v6", no_input_count: 3, messages: [{ role: "coach", content: "Previous attempt" }] };
  const annotation = "[record correction] Interview incomplete after no-audio input.";
  assert.deepEqual(readInterviewNotes(JSON.stringify(state) + "\n" + annotation), { data: state, annotation });
});
test("unstructured notes are preserved and ordinary JSON still loads", () => {
  assert.deepEqual(readInterviewNotes("Historical note"), { data: null, annotation: "Historical note" });
  assert.deepEqual(readInterviewNotes('{"no_input_count":2}'), { data: { no_input_count: 2 } });
  assert.deepEqual(readInterviewNotes(null), { data: null });
});
test("gather supports speech and keypad, waits longer, and identifies listening callbacks", async () => {
  const response = new twilio.twiml.VoiceResponse();
  await appendInterviewGather(response, { origin: "https://example.test", applicationId: 29, prompt: "Please answer.", hints: "EPEW" });
  const xml = response.toString();
  assert.match(xml, /input="speech dtmf"/);
  assert.match(xml, /numDigits="1"/);
  assert.match(xml, /timeout="15"/);
  assert.match(xml, /speechTimeout="5"/);
  assert.match(xml, /turn=listen/);
  assert.match(xml, /actionOnEmptyResult="true"/);
  assert.match(xml, /googlev2_telephony/);
});
test("a retry uses the default recognizer without discarding speech input", async () => {
  const response = new twilio.twiml.VoiceResponse();
  await appendInterviewGather(response, { origin: "https://example.test", applicationId: 29, prompt: "Try again.", hints: "EPEW", retry: true });
  assert.match(response.toString(), /speechModel="default"/);
  assert.match(response.toString(), /input="speech dtmf"/);
});
