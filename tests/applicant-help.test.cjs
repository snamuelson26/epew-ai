const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { validateHelpInput } = require('../lib/applicant-help/validation.ts');
const { helpCopy } = require('../lib/applicant-help/copy.ts');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let db, firstCase;
before(async () => {
 db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create table public.entrepreneur_applications(id bigint primary key,user_id uuid,email text,business_name text,full_name text);
 create table public.user_roles(user_id uuid,email text,role text);
 create table public.epew_coaches(id uuid primary key,email text,status text);
 create table public.epew_coach_agent_accounts(coach_id uuid,user_id uuid,active boolean);
 create table public.coach_assignments(application_id bigint,coach_id uuid,ended_at timestamptz,assignment_status text);
 grant usage on schema public,auth to service_role;
 grant select on all tables in schema auth,public to service_role;
 insert into auth.users values ('${id(1)}','one@example.invalid',now()),('${id(2)}','two@example.invalid',now()),('${id(3)}','admin@example.invalid',now()),('${id(4)}','coach@example.invalid',now()),('${id(5)}','wrong@example.invalid',now()),('${id(6)}','unverified@example.invalid',null);
 insert into entrepreneur_applications values (1,'${id(1)}','one@example.invalid','One','Applicant One'),(2,'${id(2)}','two@example.invalid','Two','Applicant Two'),(3,null,'one@example.invalid','Unlinked','Applicant One'),(4,'${id(2)}','one@example.invalid','Must not claim','Other owner');
 insert into user_roles values('${id(3)}','admin@example.invalid','administrator');
 insert into epew_coaches values('${id(10)}','coach@example.invalid','available');
 insert into epew_coach_agent_accounts values('${id(10)}','${id(4)}',true);
 insert into coach_assignments values(1,'${id(10)}',null,'assigned');`);
 await db.exec(fs.readFileSync('supabase/migrations/20261021031813_applicant_help_cases.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261021033905_applicant_help_verified_identity.sql','utf8'));
 await db.exec('revoke select on auth.users from service_role');
});
after(async()=>{await db.close()});
async function op(actor, action, values={}) {
 await db.exec('set role service_role');
 try { return (await db.query('select public.epew_applicant_help_operation($1,$2,$3) as result',[id(actor),action,JSON.stringify({...values,_verified_email:({1:'one@example.invalid',2:'two@example.invalid',3:'admin@example.invalid',4:'coach@example.invalid',5:'wrong@example.invalid'})[actor]??null})])).rows[0].result; }
 finally { await db.exec('reset role'); }
}
const input = (key=20, app=1) => ({application_id:app,request_key:id(key),category:'coach',description:'I have not heard from my coach.',help_needed:'Please help arrange a conversation.',locale:'ht'});
test('validation strips forged actor/routing/status and rejects invalid requests',()=>{
 const clean=validateHelpInput({...input(),action:'create',p_actor:id(3),status:'resolved',responsible_team:'finance'});
 assert.ok(clean);assert.equal(clean.values.p_actor,undefined);assert.equal(clean.values.status,undefined);
 assert.equal(validateHelpInput({...input(),action:'create',application_id:'1'}),null);
 assert.equal(validateHelpInput({...input(),action:'create',description:'x'}),null);
 assert.equal(validateHelpInput({action:'update',case_id:id(20),body:'Reply',status:'approved'}),null);
});
test('every language includes every applicant-facing label',()=>{
 for(const locale of ['ht','fr','es']) {assert.deepEqual(Object.keys(helpCopy[locale]).sort(),Object.keys(helpCopy.en).sort());assert.deepEqual(Object.keys(helpCopy[locale].categories),Object.keys(helpCopy.en.categories));}
});
test('unverified identity is denied before reading applications',async()=>{await assert.rejects(op(6,'list'),/Verified login/)});
test('verified email can find an unlinked application but cannot claim an already linked one',async()=>{
 const list=await op(1,'list');assert.deepEqual(list.applications.map(a=>a.id),[1,3]);
 await assert.rejects(op(1,'create',input(30,4)),/Application access denied/);
});
test('saving one case atomically alerts administration and the assigned coach',async()=>{
 const saved=await op(1,'create',input());firstCase=saved.id;assert.equal(saved.saved,true);
 const alerts=(await db.query('select audience,recipient_user_id from epew_applicant_help_alerts order by audience')).rows;
 assert.deepEqual(alerts.map(a=>a.audience),['administration','coach']);assert.equal(alerts[1].recipient_user_id,id(4));
 const list=await op(1,'list');assert.equal(list.cases[0].events.length,1);assert.equal(list.cases[0].locale,'ht');
});
test('repeat request is idempotent and changed payload cannot reuse its key',async()=>{
 assert.equal((await op(1,'create',input())).id,firstCase);
 assert.equal((await db.query('select count(*)::int n from epew_applicant_help_alerts')).rows[0].n,2);
 await assert.rejects(op(1,'create',{...input(),help_needed:'A different problem'}),/Request key/);
});
test('applicant without a coach still creates an administrative alert',async()=>{
 const saved=await op(1,'create',input(21,3));
 const alerts=(await db.query('select a.audience from epew_applicant_help_alerts a join epew_applicant_help_events e on e.id=a.event_id where e.case_id=$1',[saved.id])).rows;
 assert.deepEqual(alerts,[{audience:'administration'}]);
});
test('another applicant cannot read or reply to the case',async()=>{
 assert.equal((await op(2,'list')).cases.length,0);
 await assert.rejects(op(2,'reply',{case_id:firstCase,body:'Forged reply'}),/Request unavailable/);
 await assert.rejects(op(2,'staff_list'),/Staff access/);
});
test('only the current bound coach sees the case; applicant cannot assign a status',async()=>{
 assert.equal((await op(4,'staff_list')).cases.length,1);
 await assert.rejects(op(1,'update',{case_id:firstCase,body:'Approve myself',status:'resolved'}),/Staff update/);
 await db.exec(`update epew_coach_agent_accounts set active=false`);
 await assert.rejects(op(4,'staff_list'),/Staff access/);
 await db.exec(`update epew_coach_agent_accounts set active=true`);
});
test('staff reply updates next action and notifies applicant; applicant can reopen',async()=>{
 await op(4,'update',{case_id:firstCase,body:'Please choose a time in Availability.',status:'resolved'});
 const row=(await op(1,'list')).cases.find(c=>c.id===firstCase);
 assert.equal(row.status,'resolved');assert.equal(row.next_action,'Please choose a time in Availability.');assert.ok(row.first_staff_reply_at);
 assert.ok((await db.query("select 1 from epew_applicant_help_alerts where audience='applicant' and recipient_user_id=$1",[id(1)])).rows.length);
 await op(1,'reopen',{case_id:firstCase,body:'The availability page is not loading.'});
 assert.equal((await op(1,'list')).cases.find(c=>c.id===firstCase).status,'open');
});
test('overdue unresolved requests remain visible to administration',async()=>{
 await db.exec("update epew_applicant_help_cases set response_due_at=now()-interval '1 hour'");
 assert.ok((await op(3,'staff_list')).cases.every(c=>c.overdue));
});
test('notification insert failure rolls back the case and event',async()=>{
 const before=(await db.query('select count(*)::int n from epew_applicant_help_cases')).rows[0].n;
 await db.exec('revoke insert on epew_applicant_help_alerts from service_role');
 await assert.rejects(op(1,'create',input(22,3)),/permission denied/);
 await db.exec('grant insert on epew_applicant_help_alerts to service_role');
 assert.equal((await db.query('select count(*)::int n from epew_applicant_help_cases')).rows[0].n,before);
});
test('public roles cannot call service RPC or select private case tables; RLS enabled',async()=>{
 for(const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query('select * from epew_applicant_help_cases'),/permission denied/);
  await assert.rejects(db.query('select epew_applicant_help_operation($1,\'list\')',[id(1)]),/permission denied/);
  await db.exec('reset role');
 }
 assert.equal((await db.query("select count(*)::int n from pg_class where relname in ('epew_applicant_help_cases','epew_applicant_help_events','epew_applicant_help_alerts') and relrowsecurity")).rows[0].n,3);
});
