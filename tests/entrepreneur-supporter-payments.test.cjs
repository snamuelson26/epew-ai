const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
let actor={id:'owner'},owned=true,businessExists=true,dbError=false,queries=[];
const client={auth:{getUser:async()=>({data:{user:actor},error:null})},from(table){
 const q={table,filters:[],rangeArgs:null};queries.push(q);
 const builder={select(fields){q.fields=fields;return builder},eq(k,v){q.filters.push([k,v]);return builder},in(k,v){q.filters.push([k,v]);return builder},order(){return builder},range(a,b){q.rangeArgs=[a,b];return builder},limit(){return builder},maybeSingle(){return builder},then(resolve,reject){
 const result=dbError?{error:{message:'private failure'}}:table==='entrepreneur_applications'?{data:owned?[{id:45,business_name:'Owned business'},{id:46,business_name:'Other owned business'}]:[]}:table==='entrepreneurs'?{data:businessExists?{id:'business-id',business_name:'Owned business',public_business_id:'TEST-001'}:null}:table==='supporter_transactions'?{data:[{id:'payment',supporter_id:'supporter',amount:'100.00',units:1,frequency:'weekly',status:'pending',created_at:'2026-11-08T01:00:00Z'}],count:65}:{data:[{id:'supporter',full_name:'Test Supporter',email:'private@example.invalid'}]};
 return Promise.resolve(result).then(resolve,reject);
 }};return builder;
}};
Module._load=function(name){if(name==='@/lib/supabase/server')return {createClient:async()=>client};if(name==='@/lib/supabaseAdmin')return {supabaseAdmin:client};return original.apply(this,arguments)};
const {GET}=require('../app/api/entrepreneurs/supporter-payments/route.ts');
const request=(query='applicationId=45')=>new Request('https://www.epew.us/api/entrepreneurs/supporter-payments?'+query);
test('anonymous requests do not read any payment records',async()=>{actor=null;queries=[];assert.equal((await GET(request())).status,401);assert.equal(queries.length,0);actor={id:'owner'}});
test('another user application is rejected before business and payment lookup',async()=>{owned=false;queries=[];assert.equal((await GET(request())).status,404);assert.equal(queries.length,1);assert.deepEqual(queries[0].filters,[['user_id','owner']]);owned=true});
test('invalid scope and page are rejected',async()=>{for(const query of ['applicationId=bad','applicationId=45&page=-1'])assert.equal((await GET(request(query))).status,400)});
test('payment records are scoped and paginated without exposing private contact or provider fields',async()=>{queries=[];const response=await GET(request('applicationId=45&page=2'));const result=await response.json();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');const paymentQuery=queries.find(q=>q.table==='supporter_transactions');assert.deepEqual(paymentQuery.filters,[['entrepreneur_id','business-id']]);assert.deepEqual(paymentQuery.rangeArgs,[50,99]);assert.equal(result.count,65);assert.equal(result.transactions[0].supporter,'Test Supporter');assert.equal(result.transactions[0].status,'pending');assert.equal(result.transactions[0].email,undefined);assert.equal(result.transactions[0].supporter_id,undefined)});
test('missing business returns genuine empty history without reading other businesses',async()=>{businessExists=false;queries=[];const result=await (await GET(request())).json();assert.equal(result.count,0);assert.equal(queries.some(q=>q.table==='supporter_transactions'),false);businessExists=true});
test('database failure is not presented as zero support',async()=>{dbError=true;const response=await GET(request());assert.equal(response.status,503);assert.equal((await response.json()).transactions,undefined);dbError=false});

test('a direct link without a business offers owned choices without reading payments',async()=>{queries=[];const response=await GET(request(''));const result=await response.json();assert.equal(response.status,200);assert.equal(result.selectionRequired,true);assert.equal(result.accounts.length,2);assert.deepEqual(queries[0].filters,[['user_id','owner']]);assert.equal(queries.length,1)});
test('a stale link shows only owned business choices and never silently switches to their payments',async()=>{queries=[];const response=await GET(request('applicationId=999'));const result=await response.json();assert.equal(response.status,404);assert.deepEqual(result.accounts.map(a=>a.id),['45','46']);assert.equal(result.transactions,undefined);assert.equal(queries.length,1)});
