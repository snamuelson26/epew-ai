const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const policy = require('../lib/communications/smsConsentPolicy.ts');
test('strict opt-in evidence and canonical phone normalization', () => {
  assert.equal(policy.normalizeSmsPhone('(202) 555-0123'), '+12025550123');
  assert.equal(policy.normalizeSmsPhone('garbage'), '');
  const declined=policy.consentRecord(false,'+12025550123');
  assert.equal(declined.sms_consent,false); assert.equal(declined.sms_consented_at,null);
  const yes=policy.consentRecord(true,'+12025550123','2026-10-25T12:00:00Z');
  assert.equal(yes.sms_consent_phone,'+12025550123');assert.equal(yes.sms_consent_language,'en');
  assert.equal(yes.sms_consented_at,'2026-10-25T12:00:00Z');assert.equal(yes.sms_disclosure,policy.SMS_DISCLOSURE);
});
test('STOP variants and HELP are distinct; START never grants consent',()=>{
  for(const text of ['STOP',' stop ','UNSUBSCRIBE','REVOKE','STOPALL']) assert.equal(policy.smsKeyword(text),'stop');
  assert.equal(policy.smsKeyword('HELP'),'help'); assert.equal(policy.smsKeyword('START'),null);
  assert.match(policy.SMS_HELP_REPLY,/support@epew.us/);
});
test('database denies legacy consent, persists evidence, preserves STOP and invalidates phone changes',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table entrepreneur_reminder_contacts(id uuid primary key default gen_random_uuid(),user_id uuid,phone text,status text default 'active',weekly_information_consent boolean default false);
 create table epew_appointment_message_optouts(phone text,channel text,primary key(phone,channel));
 alter table entrepreneur_reminder_contacts add column application_id bigint, add column application_reminders_active boolean default true;
 create table epew_all_appointment_recipients(source_key text,application_id bigint,starts_at timestamptz,email text);
 create table entrepreneur_applications(id bigint,user_id uuid);
 create table communication_contacts(id uuid,email text,user_id uuid,normalized_whatsapp_number text,whatsapp_number text,normalized_phone text,phone text,permission_sms boolean,permission_whatsapp boolean);
 create table epew_supporter_welcome_meetings(id uuid,supporter_user_id uuid);
 create table organization_meetings_followups(id uuid,contact_id uuid);`);
 await db.exec(readFileSync('supabase/migrations/20261025224814_separate_epew_sms_consent.sql','utf8'));
 const allowed=async()=> (await db.query("select epew_can_send_application_sms('+12025550123') as allowed")).rows[0].allowed;
 await db.exec("insert into entrepreneur_reminder_contacts(phone,weekly_information_consent) values('+12025550123',true)");
 assert.equal(await allowed(),false);
 const evidence=policy.consentRecord(true,'+12025550123');
 const cols=Object.keys(evidence), vals=Object.values(evidence);
 await db.query(`insert into entrepreneur_reminder_contacts(user_id,phone,${cols.join(',')}) values('00000000-0000-4000-8000-000000000001','+12025550123',${vals.map((_,i)=>'$'+(i+1)).join(',')})`,vals);
 assert.equal(await allowed(),true);
 assert.equal((await db.query('select * from epew_sms_consent_events')).rows.length,1);
 // Even if concurrent legacy records exist, the actor's latest preference wins.
 const no=policy.consentRecord(false,'+12025550123');const noCols=Object.keys(no),noVals=Object.values(no);
 const declined=await db.query(`insert into entrepreneur_reminder_contacts(user_id,phone,${noCols.join(',')}) values('00000000-0000-4000-8000-000000000001','+12025550123',${noVals.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,noVals);
 assert.equal(await allowed(),false);
 await db.query('delete from entrepreneur_reminder_contacts where id=$1',[declined.rows[0].id]);
 // Deleting a current record never revives the older grant.
 assert.equal(await allowed(),false);
 await db.exec('update entrepreneur_reminder_contacts set sms_preference_updated_at=now() where sms_consent');
 assert.equal(await allowed(),true);
 await db.exec('update entrepreneur_reminder_contacts set user_id=null where sms_consent');
 assert.equal(await allowed(),false); // auth.users ON DELETE SET NULL must remain possible
 await db.exec("update entrepreneur_reminder_contacts set user_id='00000000-0000-4000-8000-000000000001' where sms_consent");
 await db.exec("insert into epew_appointment_message_optouts values('+12025550123','sms')");
 assert.equal(await allowed(),false);
 await db.exec("update entrepreneur_reminder_contacts set sms_preference_updated_at=now() where sms_consent");
 assert.equal(await allowed(),false); // repeated web opt-in cannot override STOP
 await db.exec("delete from epew_appointment_message_optouts");
 await db.exec("update entrepreneur_reminder_contacts set sms_consent=false,phone='+12025550124' where sms_consent");
 assert.equal(await allowed(),false);
 assert.equal((await db.query("select has_table_privilege('anon','epew_sms_consent_events','select') as allowed")).rows[0].allowed,false);
 await db.close();
});
