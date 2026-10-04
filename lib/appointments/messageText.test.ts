import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appointmentMessage,reminderTemplates} from './messageText';
test('every reminder uses the right lead time, language, timezone, and STOP instruction',()=>{
 for(const language of ['en','fr','ht','es']) for(const hours of [168,24,1]) {
  const m=appointmentMessage(language,hours,'2026-11-01T15:00:00Z');
  assert.equal(m.lang,language);assert.match(m.body,/STOP/);assert.doesNotMatch(m.body,/\{\{/);
  assert.match(m.body,/10:00/);assert.match(m.body,/(New|Nueva) York/);assert.ok(m.body.length<1024);
 }
 assert.equal(appointmentMessage('Spanish',24,'2026-10-15T15:00:00Z').lang,'es');
 assert.equal(appointmentMessage('Haitian Creole',24,'2026-10-15T15:00:00Z').lang,'ht');
 assert.match(appointmentMessage('en',24,'2026-10-15T15:00:00Z').body,/11:00/);
});
test('WhatsApp templates use only the two declared variables',()=>{
 for(const body of Object.values(reminderTemplates)) assert.deepEqual(body.match(/\{\{\d+\}\}/g),['{{1}}','{{2}}']);
});
