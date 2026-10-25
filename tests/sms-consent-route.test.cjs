const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
const {SMS_DISCLOSURE_VERSION}=require('../lib/communications/smsConsentPolicy.ts');
let actor={id:'00000000-0000-4000-8000-000000000001',email:'sms-test@example.invalid',email_confirmed_at:'2026-10-25'},writes=[],storageError=null;
const db={from:()=>({select(){return this},eq(){return this},order(){return this},limit(){return this},maybeSingle:async()=>({data:null,error:null}),insert:async(data)=>{writes.push(data);return{error:storageError}}})};
Module._load=function(name){
 if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>({data:{user:actor},error:null})}})};
 if(name==='@supabase/supabase-js')return{createClient:()=>db};
 return original.apply(this,arguments);
};
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='controlled-test-only';
const {POST}=require('../app/api/entrepreneurs/reminder-contact/route.ts');
function req(body,origin='https://example.invalid'){return new Request('https://example.invalid/api/entrepreneurs/reminder-contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})}
const valid={communication_language:'English',email:'sms-test@example.invalid',phone:'+12025550123',priority_channel:'email',sms_disclosure_version:SMS_DISCLOSURE_VERSION};
test('save without SMS or email subscription succeeds; legacy general consent cannot grant SMS',async()=>{
 writes=[];const r=await POST(req({...valid,weekly_information_consent:true}));assert.equal(r.status,200);
 assert.equal(writes.length,1);assert.equal(writes[0].sms_consent,false);assert.equal(writes[0].email_information_consent,false);assert.equal(writes[0].weekly_information_consent,false);assert.equal(writes[0].sms_consented_at,null);
});
test('SMS consent stores verified actor, phone, timestamp, source, language and disclosure version independently',async()=>{
 writes=[];assert.equal((await POST(req({...valid,sms_consent:true,consented_at:'forged',source:'forged'}))).status,200);
 const w=writes[0];assert.equal(w.sms_consent,true);assert.equal(w.email_information_consent,false);assert.equal(w.sms_consent_phone,valid.phone);assert.equal(w.user_id,actor.id);assert.match(w.sms_consented_at,/^2026-/);assert.equal(w.sms_disclosure_version,SMS_DISCLOSURE_VERSION);assert.equal(w.sms_consent_language,'en');assert.match(w.sms_consent_source,/epew.us\/entrepreneurs/);
});
test('phone, disclosure, identity and origin validation fail closed',async()=>{
 writes=[];
 for(const body of [{...valid,sms_consent:true,phone:''},{...valid,sms_consent:true,sms_disclosure_version:'old'}])assert.equal((await POST(req(body))).status,400);
 assert.equal((await POST(req({...valid,email:'other@example.invalid'}))).status,403);
 assert.equal((await POST(req(valid,'https://other.invalid'))).status,403);
 const saved=actor;actor=null;assert.equal((await POST(req(valid))).status,401);actor=saved;
 assert.equal(writes.length,0);
});
test('database failure never reports successful preference capture',async()=>{
 storageError={code:'unavailable'};assert.equal((await POST(req(valid))).status,500);storageError=null;
});

test('disclosure language remains English when the preferred communication language is Haitian Creole',async()=>{
 writes=[];assert.equal((await POST(req({...valid,communication_language:'Haitian Creole',sms_consent:true}))).status,200);
 assert.equal(writes[0].communication_language,'ht');assert.equal(writes[0].sms_consent_language,'en');
});
