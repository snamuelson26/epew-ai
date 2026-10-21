const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
let actor={id:'verified-actor',email_confirmed_at:'2026-10-21'},calls=[],dbError=null;
const client={auth:{getUser:async()=>({data:{user:actor},error:null})},rpc:async(name,args)=>{calls.push(args);return {data:{saved:true,id:'persisted-id'},error:dbError}}};
Module._load=function(name){if(name==='@/lib/supabase/server')return {createClient:async()=>client};if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:client};return original.apply(this,arguments)};
const {GET,POST}=require('../app/api/entrepreneurs/help/route.ts');
const valid={action:'create',application_id:1,request_key:'00000000-0000-4000-8000-000000000020',category:'access',description:'My page is not loading.',help_needed:'Please help me continue.',locale:'en',p_actor:'forged-admin'};
function req(body=valid,origin='https://example.invalid'){return new Request('https://example.invalid/api/entrepreneurs/help',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)})}
test('anonymous access is refused',async()=>{actor=null;calls=[];assert.equal((await GET(new Request('https://example.invalid/api/entrepreneurs/help'))).status,401);assert.equal(calls.length,0);actor={id:'verified-actor',email_confirmed_at:'2026-10-21'}});
test('cross-origin writes are refused before a database call',async()=>{calls=[];assert.equal((await POST(req(valid,'https://other.invalid'))).status,403);assert.equal(calls.length,0)});
test('caller cannot forge actor; success requires persisted record',async()=>{calls=[];const r=await POST(req());assert.equal(r.status,200);assert.equal(calls[0].p_actor,'verified-actor');assert.equal(calls[0].p_input.p_actor,undefined);assert.equal(r.headers.get('cache-control'),'private, no-store')});
test('missing storage fails closed without reporting a saved request',async()=>{dbError={code:'PGRST202'};const r=await POST(req());assert.equal(r.status,503);assert.equal((await r.json()).saved,undefined);dbError=null});
test('malformed fields are rejected',async()=>{calls=[];assert.equal((await POST(req({...valid,description:''}))).status,400);assert.equal(calls.length,0)});
