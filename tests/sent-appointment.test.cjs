const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
const Module=require('node:module');const original=Module._load;
let writes=[],eligibleRows=[{source_key:'controlled'}],optouts=[],template={id:'00000000-0000-4000-8000-000000000002'},boundError=null,sendCalls=0,rpcCalls=0;
Module._load=function(name){
 if(name==='@/lib/supabaseAdmin')return{supabaseAdmin:{rpc:async(name,args)=>{rpcCalls++;writes.push({name,args});return{data:true,error:name==='epew_bind_sent_appointment'?boundError:null};},from:table=>{
  const query={select:()=>query,eq:()=>query,limit:async()=>({data:optouts,error:null}),maybeSingle:async()=>({data:{value:template},error:null}),then:resolve=>resolve({data:eligibleRows,error:null})};return query;
 }}};
 if(name==='@/lib/communications/canSendApplicationSms')return{canSendApplicationSms:async()=>true};
 if(name==='@/lib/sent/sendTemplate')return{...original.apply(this,arguments),sendSentTemplate:async(input,options)=>{sendCalls++;if(!await options.eligible(input.phone,input.channel))throw new Error('consent blocked');return{messageId:'00000000-0000-4000-8000-000000000003',sandbox:false,status:'accepted'};}};
 if(name==='./messageProvider')return{messageClient:()=>{throw new Error('Twilio must not initialize while paused');}};
 return original.apply(this,arguments);
};
const {processSentAppointment,sentAppointmentEligible}=require('../lib/appointments/sentAppointment.ts');
const {processMessageReminders}=require('../lib/appointments/processMessageReminders.ts');
const row={id:'00000000-0000-4000-8000-000000000001',source_key:'controlled',starts_at:'2099-10-30T14:00:00Z',phone:'+12025550123',channel:'whatsapp',hours_before:24,payload:{language:'en'}};
test('Sent worker pauses before any queue mutation or provider initialization',async()=>{
 process.env.EPEW_APPOINTMENT_MESSAGE_PROVIDER='sent';delete process.env.EPEW_SENT_APPOINTMENT_LIVE_ENABLED;
 const before=rpcCalls;assert.equal((await processMessageReminders()).paused,true);assert.equal(rpcCalls,before);
 await assert.rejects(processSentAppointment(row),/live_sending_disabled/);
});
test('current channel eligibility and any historical STOP block the Sent path',async()=>{
 eligibleRows=[];assert.equal(await sentAppointmentEligible(row),false);
 eligibleRows=[{source_key:'controlled'}];optouts=[{phone:row.phone}];assert.equal(await sentAppointmentEligible(row),false);
 optouts=[];assert.equal(await sentAppointmentEligible(row),true);
});
test('approved-language configuration is required and accepted IDs bind durably',async()=>{
 process.env.EPEW_SENT_APPOINTMENT_LIVE_ENABLED='true';template=null;const before=sendCalls;
 await assert.rejects(processSentAppointment({...row,payload:{language:'pt'}}),/language_template_missing/);
 await assert.rejects(processSentAppointment(row),/language_template_missing/);assert.equal(sendCalls,before);
 template={id:'00000000-0000-4000-8000-000000000002'};writes=[];
 await processSentAppointment(row);assert.deepEqual(writes.map(x=>x.name),['epew_reserve_sent_appointment','epew_bind_sent_appointment']);
 boundError={code:'unavailable'};await assert.rejects(processSentAppointment(row),/acceptance_persistence_unknown/);boundError=null;
});
test('database binds early events, isolates providers, rejects unsafe cutover and preserves delivery evidence',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table epew_appointment_message_optouts(phone text,channel text,primary key(phone,channel));
 create table epew_appointment_message_deliveries(id uuid primary key,channel text,status text,attempts int,provider_message_id text unique,error_code text,updated_at timestamptz default now());`);
 await db.exec(readFileSync('supabase/migrations/20261026041000_sent_event_receiver.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261026062000_sent_appointment_binding.sql','utf8'));
 const d=row.id,m='00000000-0000-4000-8000-000000000003';
 await db.query("insert into epew_appointment_message_deliveries(id,channel,status,attempts) values($1,'whatsapp','processing',1)",[d]);
 assert.equal((await db.query('select epew_reserve_sent_appointment($1) ok',[d])).rows[0].ok,true);
 const record=async(event,time,key)=>db.query('select epew_record_sent_event($1,\'message\',$2,$3,\'whatsapp\',$4,null)',[key,event,m,{value:{account_id:'6318afbb-beb3-4007-ae43-dc1af34241ab',updated_at:time}}]);
 await record('message.delivered','2026-10-26T06:00:00Z','early');
 await db.query('select epew_bind_sent_appointment($1,$2)',[d,m]);
 const status=async()=>(await db.query('select status from epew_appointment_message_deliveries where id=$1',[d])).rows[0].status;
 assert.equal(await status(),'delivered');
 await record('message.queued','2026-10-26T05:59:59Z','old');assert.equal(await status(),'delivered');
 await record('message.read','2026-10-26T06:00:01Z','read');assert.equal(await status(),'read');
 await record('message.failed','2026-10-26T06:00:02Z','late-failed');assert.equal(await status(),'read');
 const legacy='00000000-0000-4000-8000-000000000004';
 await db.query("insert into epew_appointment_message_deliveries(id,channel,status,attempts) values($1,'sms','processing',2)",[legacy]);
 assert.equal((await db.query('select epew_reserve_sent_appointment($1) ok',[legacy])).rows[0].ok,false);
 await assert.rejects(db.query('select epew_bind_sent_appointment($1,$2)',[legacy,m]));
 // Terminal failures before routing use channel=auto and must not stay accepted.
 const gated='00000000-0000-4000-8000-000000000005',gm='00000000-0000-4000-8000-000000000006';
 await db.query("insert into epew_appointment_message_deliveries(id,channel,status,attempts) values($1,'sms','processing',1)",[gated]);
 await db.query('select epew_reserve_sent_appointment($1)',[gated]);
 await db.query('select epew_bind_sent_appointment($1,$2)',[gated,gm]);
 await db.query("select epew_record_sent_event('filtered','message','message.filtered',$1,'auto',$2,null)",[gm,{value:{account_id:'6318afbb-beb3-4007-ae43-dc1af34241ab',updated_at:'2026-10-26T06:00:03Z'}}]);
 const filtered=(await db.query('select status,error_code from epew_appointment_message_deliveries where id=$1',[gated])).rows[0];
 assert.deepEqual(filtered,{status:'failed',error_code:'sent_policy_filtered'});
 assert.equal((await db.query("select epew_sent_event_time('now') invalid")).rows[0].invalid,null);
 assert.equal((await db.query("select has_function_privilege('anon','epew_reserve_sent_appointment(uuid)','execute') allowed")).rows[0].allowed,false);
 }finally{await db.close();}
});
