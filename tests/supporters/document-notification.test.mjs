import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationPlan, dispatchDocumentNotification } from '../../lib/enterprise/supporters/documentNotification.ts';
const valid = () => ({transactionId:'transaction-test',supporterId:'supporter-test',payment:'received',paymentVerified:true,documents:{letterPublished:true,certificatePublished:true},phone:'+12025550123',permissions:{sms:true,whatsapp:true},optedOut:false,language:'en'});
test('requires authoritative receipt, both published documents and permission',()=>{
  for(const payment of ['pending','failed','refunded','disputed']) assert.deepEqual(notificationPlan({...valid(),payment}),[]);
  assert.deepEqual(notificationPlan({...valid(),paymentVerified:false}),[]);
  assert.deepEqual(notificationPlan({...valid(),documents:{letterPublished:true,certificatePublished:false}}),[]);
  assert.deepEqual(notificationPlan({...valid(),optedOut:true}),[]);
  assert.deepEqual(notificationPlan({...valid(),phone:'not-a-number'}),[]);
  assert.deepEqual(notificationPlan({...valid(),permissions:{sms:true,whatsapp:false}}).map(x=>x.channel),['sms']);
});
test('concurrent processing sends once per channel and distinguishes acceptance from delivery',async()=>{
  const claims=new Set(); const sends=[];
  const deps={load:async()=>valid(),ready:async()=>true,claim:async key=>{if(claims.has(key))return false;claims.add(key);return true;},send:async m=>{sends.push(m);return 'provider-test';},record:async()=>{}};
  const results=await Promise.all([dispatchDocumentNotification('transaction-test',deps),dispatchDocumentNotification('transaction-test',deps)]);
  assert.equal(sends.length,2);assert.equal(new Set(sends.map(x=>x.key)).size,2);
  assert.equal(results.flat().filter(x=>x.status==='accepted').length,2);
  assert.equal(results.flat().filter(x=>x.status==='duplicate_blocked').length,2);
});
test('permission withdrawal after claim cancels sending',async()=>{
  let claimed=false;let sends=0;
  const deps={load:async()=>({...valid(),optedOut:claimed}),ready:async()=>true,claim:async()=>{claimed=true;return true;},send:async()=>{sends++;return 'id';},record:async()=>{}};
  const result=await dispatchDocumentNotification('transaction-test',deps);
  assert.equal(sends,0);assert.ok(result.every(x=>x.status==='cancelled'));
});
test('unknown provider outcome is retained and never blindly retried',async()=>{
  const claims=new Set();const states=[];
  const deps={load:async()=>valid(),ready:async()=>true,claim:async key=>{if(claims.has(key))return false;claims.add(key);return true;},send:async()=>{throw Error('timeout');},record:async(key,status)=>states.push(status)};
  await dispatchDocumentNotification('transaction-test',deps);
  const again=await dispatchDocumentNotification('transaction-test',deps);
  assert.deepEqual(states,['unknown','unknown']);assert.ok(again.every(x=>x.status==='duplicate_blocked'));
});
test('unavailable channels do not claim or send',async()=>{
  let claims=0;const deps={load:async()=>valid(),ready:async()=>false,claim:async()=>{claims++;return true;},send:async()=>{throw Error('must not send');},record:async()=>{}};
  const result=await dispatchDocumentNotification('transaction-test',deps);assert.equal(claims,0);assert.ok(result.every(x=>x.status==='channel_unavailable'));
});
