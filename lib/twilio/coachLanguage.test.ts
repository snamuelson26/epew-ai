import assert from "node:assert/strict";
import test from "node:test";
import twilio from "twilio";
import { appendCreoleConsent, appendLanguageMenu, languageDigit, needsLanguageChoice } from "./coachLanguage";
import { appendInterviewGather } from "./prequalificationListening";

test("keypad choices consistently map to the four spoken languages", () => {
  assert.deepEqual(["1", "2", "3", "4", "9", "*"].map(languageDigit), ["en", "ht", "es", "fr", null, null]);
  const response = new twilio.twiml.VoiceResponse();
  appendLanguageMenu(response, "https://example.test", 29);
  assert.match(response.toString(), /input="dtmf"/);
  assert.match(response.toString(), /turn=language/);
  assert.match(response.toString(), /ht-language-selection.mp3/);
});
test("silence, low confidence and explicit language requests open language choice", () => {
  for (const [speech, confidence] of [["", ""], ["unrecognized", "0.2"], ["Please speak Haitian Creole", "0.9"], ["Mwen pa konprann", ""], ["No entiendo", ""]]) assert.equal(needsLanguageChoice(speech, confidence), true);
  assert.equal(needsLanguageChoice("I sell food", "0.9"), false);
  assert.equal(needsLanguageChoice("I sell food", ""), false);
});
test("selected language controls voice and recognizer; Creole uses consent and recording", async (t) => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousToken = process.env.TWILIO_AUTH_TOKEN;
  process.env.OPENAI_API_KEY = "test-only";
  process.env.TWILIO_AUTH_TOKEN = "test-only";
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ choices: [{ message: { content: "Translated question" } }] }), { status: 200, headers: { "content-type": "application/json" } }));
  try {
    for (const [language, locale] of [["fr", "fr-FR"], ["es", "es-MX"]] as const) {
      const response = new twilio.twiml.VoiceResponse();
      await appendInterviewGather(response, { origin: "https://example.test", applicationId: 29, prompt: "Question", hints: "EPEW", language });
      assert.match(response.toString(), new RegExp(`language="${locale}"`));
      assert.match(response.toString(), /Translated question/);
      assert.match(response.toString(), /speechModel="default"/);
    }
    const consent = new twilio.twiml.VoiceResponse();
    appendCreoleConsent(consent, "https://example.test", 29);
    assert.match(consent.toString(), /turn=record-consent/);
    assert.doesNotMatch(consent.toString(), /<Record /);
    const response = new twilio.twiml.VoiceResponse();
    await appendInterviewGather(response, { origin: "https://example.test", applicationId: 29, prompt: "Question", hints: "", language: "ht" });
    assert.match(response.toString(), /<Play>/);
    assert.match(response.toString(), /<Record /);
    assert.match(response.toString(), /finishOnKey="\*#"/);
    assert.match(response.toString(), /prequalification-recording/);
    assert.doesNotMatch(response.toString(), /language="ht/);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousToken === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = previousToken;
  }
});
