const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const {PGlite}=require('@electric-sql/pglite');
const secret='whsec_'+Buffer.alloc(32,7).toString('base64');
const endpoint='00000000-0000-4000-8000-000000000001';
const account='6318afbb-beb3-4007-ae43-dc1af34241ab';
const sender='+18667200014';
const message='00000000-0000-4000-8000-000000000002';
const event=(text='STOP',channel='sms')=>({field:'message',event:'message.received',value:{account_id:account,message_id:message,inbound_number:'+12025550123',outbound_number:sender,text,channel}});
function headers(body,time=Math.floor(Date.now()/1000),id=endpoint){
 const signature=createHmac('sha256',Buffer.alloc(32,7)).update(`${id}.${time}.`).update(body).digest('base64');
 return new Headers({'x-webhook-id':id,'x-webhook-timestamp':String(time),'x-webhook-signature':'v1,'+signature});
}
let calls=[],databaseError=null;
const original=Module._load;
Module._load=function(name){
 if(name==='@/lib/supabaseAdmin')return{supabaseAdmin:{rpc:async(name,args)=>{calls.push({name,args});return{error:databaseError}}}};
 return original.apply(this,arguments);
};
const {verifySentWebhook}=require('../lib/sent/verifyWebhook.ts');
const {parseSentEvent}=require('../lib/sent/parseEvent.ts');
const {POST}=require('../app/api/webhooks/sent/route.ts');
function configure(){process.env.SENT_DM_WEBHOOK_SECRET=secret;process.env.SENT_DM_WEBHOOK_ID=endpoint;process.env.SENT_DM_SENDER_NUMBER=sender;}
const request=(body,h=headers(body))=>new Request('https://example.invalid/api/webhooks/sent',{method:'POST',body,headers:h});

test('raw-body HMAC rejects tampering, expired/future signatures, wrong endpoint and malformed signatures',()=>{
 const body=Buffer.from(JSON.stringify(event())); const h=headers(body);
 assert.equal(verifySentWebhook(body,h,secret,endpoint),true);
 assert.equal(verifySentWebhook(Buffer.from(' ' + body),h,secret,endpoint),false);
 for(const offset of [-301,301])assert.equal(verifySentWebhook(body,headers(body,Math.floor(Date.now()/1000)+offset),secret,endpoint),false);
 assert.equal(verifySentWebhook(body,h,secret,'other'),false);
 h.set('x-webhook-signature','v1,bad');assert.equal(verifySentWebhook(body,h,secret,endpoint),false);
});
test('inbound identity and channel are scoped; STOP suppresses the matching channel; HELP and START do not grant consent',()=>{
 for(const channel of ['sms','whatsapp'])assert.equal(parseSentEvent(event('STOP',channel),sender).stopPhone,'+12025550123');
 for(const text of ['HELP','INFO','START','UNSTOP'])assert.equal(parseSentEvent(event(text),sender).stopPhone,null);
 const wrong=event();wrong.value.account_id='other';assert.throws(()=>parseSentEvent(wrong,sender));
 assert.throws(()=>parseSentEvent(event(),'+12025550124'));
 const first=parseSentEvent(event(),sender); const second=parseSentEvent(event('STOP '),sender);
 assert.equal(first.key,second.key);
 const outbound={field:'message',event:'message.delivered',value:{account_id:account,message_id:message,message_status:'DELIVERED',channel:'sms',updated_at:'2026-10-26T01:00:00Z'}};
 assert.notEqual(first.key,parseSentEvent(outbound,sender).key);
});
test('route fails closed without config/signature and acknowledges only after durable storage',async()=>{
 calls=[];configure();const body=JSON.stringify(event());
 delete process.env.SENT_DM_WEBHOOK_SECRET;assert.equal((await POST(request(body))).status,503);configure();
 assert.equal((await POST(request(body,new Headers()))).status,401);assert.equal(calls.length,0);
 assert.equal((await POST(request(body))).status,200);assert.equal(calls[0].args.p_stop_phone,'+12025550123');
 databaseError={code:'unavailable'};assert.equal((await POST(request(body))).status,503);databaseError=null;
 const bad=JSON.stringify({...event(),value:{...event().value,account_id:'wrong'}});assert.equal((await POST(request(bad))).status,400);
 assert.equal((await POST(request('x'.repeat(65537)))).status,413);
});
test('durable receiver deduplicates, preserves both channels and STOP across START, and restricts private data',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table epew_appointment_message_optouts(phone text,channel text,primary key(phone,channel));`);
 await db.exec(readFileSync('supabase/migrations/20261026041000_sent_event_receiver.sql','utf8'));
 const save=async(e)=>{const p=parseSentEvent(e,sender);await db.query('select epew_record_sent_event($1,$2,$3,$4,$5,$6,$7)',[p.key,p.field,p.name,p.messageId,p.channel,p.payload,p.stopPhone]);};
 await save(event());await save(event());
 assert.equal((await db.query('select count(*)::int n from epew_sent_events')).rows[0].n,1);
 const wa=event('STOP','whatsapp');wa.value.message_id='00000000-0000-4000-8000-000000000003';await save(wa);
 const start=event('START');start.value.message_id='00000000-0000-4000-8000-000000000004';await save(start);
 assert.equal((await db.query('select count(*)::int n from epew_appointment_message_optouts')).rows[0].n,2);
 assert.equal((await db.query("select has_table_privilege('anon','epew_sent_events','select') allowed")).rows[0].allowed,false);
 // A suppression write failure must roll back the event receipt too, permitting retry.
 await db.exec('alter table epew_appointment_message_optouts add constraint reject_test check(false) not valid');
 const fresh=event();fresh.value.message_id='00000000-0000-4000-8000-000000000005';fresh.value.inbound_number='+12025550124';
 const before=(await db.query('select count(*)::int n from epew_sent_events')).rows[0].n;
 await assert.rejects(save(fresh));assert.equal((await db.query('select count(*)::int n from epew_sent_events')).rows[0].n,before);
 } finally {await db.close();}
});
