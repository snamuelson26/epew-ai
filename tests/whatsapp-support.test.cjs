const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let actor = {id:'admin'}, rows=[], previous=null, reservationError=null, outboundCalls=0, windowDate=new Date().toISOString(), optedOut=false;
let failStorage=false, inserted=[], updates=[], payload=null, allowedStates=[];
function query(table) {
 const q={select(){return q},eq(){return q},in(_column,values){allowedStates=values;return q},or(){return q},order(){return q},limit(){return q},
  maybeSingle:async()=>({data:table==='epew_whatsapp_support_messages'?{phone:'+15555550123',received_at:windowDate}:table==='epew_appointment_message_optouts'?(optedOut?{phone:'+15555550123'}:null):previous,error:null}),
  insert:async(data)=>{inserted.push(data);return {error:reservationError}},
  upsert:()=>({select:async()=>({data:rows,error:failStorage?{code:'offline'}:null})}),
  update(data){updates.push(data);return q},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}
 }; return q;
}
const db={from:query};
let valid=true, params={AccountSid:'ACtest',MessageSid:'SM'+'1'.repeat(32),MessageStatus:'delivered'};
Module._load=function(name){
 if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:db};
 if(name==='@/lib/whatsapp/support-admin')return {supportAdministrator:async()=>actor};
 if(name==='@/lib/twilio/validateTwilioWebhook')return {validateTwilioWebhook:async()=>({valid,params})};
 if(name==='twilio')return {__esModule:true,default:()=>({messages:{create:async(input)=>{payload=input;outboundCalls++;return {sid:'SM'+'2'.repeat(32),status:'queued'}}}})};
 return original.apply(this,arguments);
};
const support=require('../lib/whatsapp/support-inbox.ts');
const api=require('../app/api/admin/whatsapp-support/route.ts');
const callback=require('../app/api/twilio/whatsapp/support-status/route.ts');
process.env.TWILIO_ACCOUNT_SID='ACtest';process.env.TWILIO_AUTH_TOKEN='test-only';process.env.TWILIO_WHATSAPP_FROM_NUMBER='+18667200014';process.env.EPEW_PUBLIC_BASE_URL='https://www.epew.us';
const input={inbound_sid:'SM'+'1'.repeat(32),request_key:'00000000-0000-4000-8000-000000000001',body:'We can help you continue.'};
function request(body=input,origin='https://www.epew.us'){return new Request('https://www.epew.us/api/admin/whatsapp-support',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})}
test('receipt is sent only after durable insertion; duplicate webhook has no second receipt',async()=>{rows=[{message_sid:input.inbound_sid}];assert.equal(await support.saveSupportMessage('+15555550123',{MessageSid:input.inbound_sid,Body:'Help'}),true);rows=[];assert.equal(await support.saveSupportMessage('+15555550123',{MessageSid:input.inbound_sid,Body:'Help'}),false);failStorage=true;await assert.rejects(()=>support.saveSupportMessage('+15555550123',{MessageSid:input.inbound_sid,Body:'Help'}));failStorage=false;});
test('anonymous/non-admin and cross-origin send attempts cannot reach provider',async()=>{outboundCalls=0;actor=null;assert.equal((await api.POST(request())).status,403);assert.equal((await api.GET()).status,403);actor={id:'admin'};assert.equal((await api.POST(request(input,'https://evil.invalid'))).status,403);assert.equal(outboundCalls,0)});
test('stale windows, future timestamps and opt-outs fail closed',async()=>{outboundCalls=0;windowDate=new Date(Date.now()-25*3600000).toISOString();assert.equal((await api.POST(request())).status,409);assert.equal(support.withinSupportWindow(new Date(Date.now()+10000).toISOString()),false);windowDate=new Date().toISOString();optedOut=true;assert.equal((await api.POST(request())).status,409);optedOut=false;assert.equal(outboundCalls,0)});
test('caller-supplied destination cannot redirect a reply; unique reservation precedes provider call',async()=>{inserted=[];outboundCalls=0;const r=await api.POST(request({...input,to:'+19999999999'}));assert.equal(r.status,200);assert.equal(outboundCalls,1);assert.equal(payload.to,'whatsapp:+15555550123');assert.equal(payload.from,'whatsapp:+18667200014');assert.match(payload.body,/^EPEW Support:/);assert.equal(inserted[0].status,'unknown');assert.equal(inserted[0].actor_user_id,'admin');});
test('same key never resends and cannot be reused for changed message',async()=>{previous={inbound_sid:input.inbound_sid,body:input.body,status:'unknown',provider_sid:null};outboundCalls=0;const r=await api.POST(request());assert.equal((await r.json()).duplicate,true);assert.equal(outboundCalls,0);assert.equal((await api.POST(request({...input,body:'Different'}))).status,409);previous=null;reservationError={code:'23505'};assert.equal((await api.POST(request())).status,409);assert.equal(outboundCalls,0);reservationError=null;});
test('callback requires valid signature/account and records delivery without regressing final states',async()=>{const req=new Request('https://www.epew.us/api/twilio/whatsapp/support-status?request_key='+input.request_key);valid=false;assert.equal((await callback.POST(req)).status,403);valid=true;params.AccountSid='ACwrong';assert.equal((await callback.POST(req)).status,403);params.AccountSid='ACtest';updates=[];assert.equal((await callback.POST(req)).status,200);assert.equal(updates[0].status,'delivered');assert.equal(updates[0].provider_sid,params.MessageSid);assert.equal(allowedStates.includes('read'),false);});
