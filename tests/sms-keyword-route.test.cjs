const {test}=require('node:test');const assert=require('node:assert/strict');const Module=require('node:module');const original=Module._load;
let valid=true,params={From:'+12025550123',Body:'STOP'},writes=[],dbError=null;
Module._load=function(name){
 if(name==='@/lib/twilio/validateTwilioWebhook')return{validateTwilioWebhook:async()=>({valid,params})};
 if(name==='@/lib/supabaseAdmin')return{supabaseAdmin:{from:()=>({upsert:async data=>{writes.push(data);return{error:dbError}}})}};
 return original.apply(this,arguments);
};
const {POST}=require('../app/api/twilio/sms/route.ts');
const req=()=>new Request('https://example.invalid/api/twilio/sms',{method:'POST'});
test('untrusted webhook is rejected; STOP persists suppression before confirmation',async()=>{
 valid=false;assert.equal((await POST(req())).status,403);assert.equal(writes.length,0);valid=true;
 const r=await POST(req());assert.equal(r.status,200);assert.deepEqual(writes[0],{phone:'+12025550123',channel:'sms'});assert.match(await r.text(),/unsubscribed/);
 dbError={code:'unavailable'};assert.equal((await POST(req())).status,503);dbError=null;
});
test('HELP replies with support details; START does not remove STOP or grant consent',async()=>{
 writes=[];params={From:'+12025550123',Body:'HELP'};assert.match(await (await POST(req())).text(),/support@epew.us/);assert.equal(writes.length,0);
 params.Body='START';assert.doesNotMatch(await (await POST(req())).text(),/<Message>/);assert.equal(writes.length,0);
});
test('provider-handled opt-out is stored without duplicate automated response',async()=>{
 params={From:'+12025550123',Body:'STOP',OptOutType:'STOP'};assert.doesNotMatch(await (await POST(req())).text(),/<Message>/);
});
