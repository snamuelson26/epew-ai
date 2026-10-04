import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reminderEmail, type Appointment} from './reminderEmail';
const appointment: Appointment = {source_key:'test',application_id:null,starts_at:'2026-11-01T15:00:00Z',email:'test@example.invalid',recipient_name:'<script>bad</script>',language:'en',title:'Interview & orientation',portal_url:'javascript:alert(1)'};
test('escapes recipient content and rejects unsafe portal links',()=>{
 const result=reminderEmail(appointment,168);
 assert.match(result.html,/&lt;script&gt;/); assert.doesNotMatch(result.html,/<script>|javascript:/);
 assert.match(result.subject,/one week/); assert.match(result.text,/America\/New_York/);
});
test('honors DST and all four supported reminder languages',()=>{
 assert.match(reminderEmail(appointment,1).text,/10:00/);
 assert.match(reminderEmail({...appointment,starts_at:'2026-10-01T15:00:00Z'},24).text,/11:00/);
 for(const [language,word] of [['fr','Rappel'],['ht','Rapèl'],['es','Recordatorio'],['en','reminder']]) {
  assert.match(reminderEmail({...appointment,language},1).subject,new RegExp(word));
 }
});
