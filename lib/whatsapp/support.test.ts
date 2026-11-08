import test from "node:test";
import assert from "node:assert/strict";
import { supportReply } from "./support";
test("explicit help commands reach support without an interview connection", () => {
  for (const command of ["HELP", " support ", "Menu"]) {
    const reply = supportReply(command);
    assert.ok(reply);
    if (!reply) throw new Error("Missing support reply");
    assert.ok(reply.startsWith("EPEW Support"));
    assert.match(reply, /entrepreneurs\/help/);
    assert.match(reply, /does not create a support case/);
  }
});
test("interview answers, linking tokens, language commands and opt-outs stay with their handlers", () => {
  for (const input of ["STOP", "EPEW " + "a".repeat(36), "1", "REPEAT", "LANGUAGE", "I support local businesses", "My business needs help"]) {
    assert.equal(supportReply(input), null);
  }
});
