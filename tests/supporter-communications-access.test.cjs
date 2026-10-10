const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
let user,staff,profile,calls;
const admin={from(table){const call={table,filters:[],insert:null};calls.push(call);const q={select(){return q},eq(k,v){call.filters.push([k,v]);return q},maybeSingle(){return Promise.resolve({data:table==='epew_supporter_staff'?staff:table==='supporters'?profile:table==='epew_supporter_threads'?{id:'thread'}:null,error:null})},insert(v){call.insert=v;return q},single(){return Promise.resolve({data:{id:'thread'},error:null})}};return q;}};
Module._load=function(name,parent,isMain){if(name==='@/lib/supabase/server')return {createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}})};if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:admin};if(name==='@/lib/communications/supporterAccess')return require('../lib/communications/supporterAccess.ts');if(name==='@/lib/enterprise/supporters/certificateEligibility')return {certificateEligible:()=>false};return original.apply(this,arguments)};
const {communicationAccess,accessibleThread}=require('../lib/communications/supporterAccess.ts');
const {POST}=require('../app/api/supporters/communications/route.ts');
const invite=require('../app/api/staff/supporter-relations/invite/route.ts');
function reset(){user={id:'own-user',email:'supporter@example.invalid',email_confirmed_at:'2026-10-01'};staff=null;profile={id:'own-profile',full_name:'Test'};calls=[];}
test('signed-out accounts cannot access the workspace',async()=>{reset();user=null;assert.equal(await communicationAccess(),null);assert.equal(calls.length,0)});
test('unverified staff email does not grant access',async()=>{reset();user.email_confirmed_at=null;staff={email:user.email,role:'advisor'};assert.equal(await communicationAccess(),null)});
test('an email with a different bound account cannot acquire staff permissions',async()=>{reset();staff={email:user.email,user_id:'someone-else',role:'director'};profile=null;assert.equal(await communicationAccess(),null)});
test('supporter conversation lookup enforces owner and excludes internal discussions',async()=>{reset();const a=await communicationAccess();await accessibleThread('foreign-thread',a);const query=calls.find(c=>c.table==='epew_supporter_threads');assert.deepEqual(query.filters,[['id','foreign-thread'],['supporter_id','own-profile'],['internal',false]])});
test('supporter cannot create a private staff discussion',async()=>{reset();const response=await POST(new Request('https://www.epew.us/api/supporters/communications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject:'Unauthorized',body:'Test',internal:true})}));assert.equal(response.status,403);assert.equal(calls.filter(c=>c.insert).length,0)});
test('advisor cannot send account invitations',async()=>{reset();staff={email:user.email,user_id:user.id,role:'advisor',display_name:'Test Advisor'};const response=await invite.POST();assert.equal(response.status,403)});
