const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
let lookupError,insertError,existing,user,inserts;
const chain={select(){return this},eq(){return this},limit(){return this},async maybeSingle(){return {data:existing,error:lookupError}},insert(){inserts++;return {select(){return {single:async()=>({data:insertError?null:{id:'acceptance-id',accepted_at:'2026-10-16T12:00:00Z'},error:insertError})}}}}};
Module._load=function(name){if(name==='@/lib/supabase/server')return {createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}})};if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:{from(table){return table==='supporters'?{select(){return {eq(){return {maybeSingle:async()=>({data:{id:'supporter-id'},error:null})}}}}}:chain}}};return original.apply(this,arguments)};
const {POST}=require('../app/api/supporters/platform-participation-agreement/accept/route.ts');
function reset(){lookupError=null;insertError=null;existing=null;user={id:'user-id'};inserts=0}
function request(accepted=true){return new Request('https://example.invalid/api/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accepted})})}
test('missing table never reports acceptance',async()=>{reset();lookupError={code:'42P01'};const r=await POST(request());assert.equal(r.status,503);assert.equal((await r.json()).accepted,false);assert.equal(inserts,0)});
test('missing schema cache during insert never reports acceptance',async()=>{reset();insertError={code:'PGRST205'};const r=await POST(request());assert.equal(r.status,503);assert.equal((await r.json()).accepted,false)});
test('saved acceptance returns persisted ID',async()=>{reset();const r=await POST(request());assert.equal(r.status,200);const j=await r.json();assert.equal(j.accepted,true);assert.equal(j.acceptanceId,'acceptance-id')});
test('existing acceptance is returned without another insert',async()=>{reset();existing={id:'existing-id',accepted:true,accepted_at:'2026-10-16'};const j=await(await POST(request())).json();assert.equal(j.acceptanceId,'existing-id');assert.equal(inserts,0)});
test('anonymous request is denied',async()=>{reset();user=null;assert.equal((await POST(request())).status,401);assert.equal(inserts,0)});
test('unchecked agreement is denied',async()=>{reset();assert.equal((await POST(request(false))).status,400);assert.equal(inserts,0)});
