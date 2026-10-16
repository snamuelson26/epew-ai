const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
let calls=[],result={ok:true,messageId:'saved-message',status:'queued'},error=null;
Module._load=function(name){
 if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:{auth:{getUser:async(token)=>({data:{user:token==='valid'?{id:'real-owner'}:null},error:null})},rpc:async(name,args)=>{calls.push({name,args});return {data:result,error}}}};
 return original.apply(this,arguments);
};
const {POST}=require('../app/api/entrepreneurs/supporters/resend/route.ts');
function request(token='valid',body={contactId:'11111111-1111-1111-1111-111111111111',businessCode:'FFR-001',userId:'forged-owner'}){return new Request('https://example.invalid/api/resend',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)})}
test('resend uses authenticated identity, never caller-supplied owner',async()=>{calls=[];const r=await POST(request());assert.equal(r.status,200);assert.equal(calls[0].args.p_user_id,'real-owner');assert.equal((await r.json()).messageId,'saved-message')});
test('anonymous request cannot enqueue',async()=>{calls=[];assert.equal((await POST(request('bad'))).status,401);assert.equal(calls.length,0)});
test('paused or opted-out result is reported without success',async()=>{result={error:'Paused',httpStatus:409};const r=await POST(request());assert.equal(r.status,409);assert.equal((await r.json()).ok,undefined);result={ok:true,messageId:'saved-message',status:'queued'}});
test('invalid contact is rejected before database call',async()=>{calls=[];const r=await POST(request('valid',{contactId:'invalid',businessCode:'FFR-001'}));assert.equal(r.status,400);assert.equal(calls.length,0)});
