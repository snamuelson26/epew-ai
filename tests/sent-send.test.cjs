const {test}=require('node:test');const assert=require('node:assert/strict');
const {sendSentTemplate}=require('../lib/sent/sendTemplate.ts');
const id='00000000-0000-4000-8000-000000000001';
const input={logicalId:'appointment:controlled:24h:sms',phone:'+12025550123',channel:'sms',templateId:id,parameters:{timeUntil:'24 hours'}};
function fixture(overrides={}){
 const calls=[];let consentChecks=0;
 const template={id,customer_id:'6318afbb-beb3-4007-ae43-dc1af34241ab',status:'APPROVED',category:'UTILITY',definition:{body:{multiChannel:{template:'Your appointment is in {{0:variable}}.',variables:[{name:'timeUntil'}]}}}};
 const options={apiKey:'synthetic-test-key',liveEnabled:false,smsApproved:false,
  eligible:async()=>{consentChecks++;return true;},
  fetcher:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({success:true,data:url.endsWith('/messages')?{recipients:[{message_id:id,to:input.phone,channel:input.channel}]}:template}),{status:url.endsWith('/messages')?202:200});},...overrides};
 return {calls,template,options,checks:()=>consentChecks};
}
test('sandbox is the default; one channel and deterministic idempotency prevent implicit fallback and duplicates',async()=>{
 const f=fixture();const result=await sendSentTemplate(input,f.options);assert.equal(result.sandbox,true);assert.equal(result.status,'accepted');
 const post=f.calls[1];const body=JSON.parse(post.options.body);assert.deepEqual(body.channel,['sms']);assert.equal(body.sandbox,true);assert.equal(f.checks(),1);
 assert.equal(post.options.headers['x-api-key'],'synthetic-test-key');
 const key=post.options.headers['Idempotency-Key'];await sendSentTemplate(input,f.options);assert.equal(f.calls[3].options.headers['Idempotency-Key'],key);
});
test('live mode is blocked without explicit enablement, SMS approval, current consent and an approved utility template',async()=>{
 const f=fixture();await assert.rejects(sendSentTemplate({...input,sandbox:false},f.options),/live_sending_disabled/);assert.equal(f.calls.length,0);
 f.options.liveEnabled=true;await assert.rejects(sendSentTemplate({...input,sandbox:false},f.options),/sms_not_approved/);assert.equal(f.calls.length,0);
 f.options.smsApproved=true;f.template.category='MARKETING';await assert.rejects(sendSentTemplate({...input,sandbox:false},f.options),/utility_template_not_approved/);
 f.template.category='UTILITY';f.options.eligible=async()=>false;await assert.rejects(sendSentTemplate({...input,sandbox:false},f.options),/consent_missing_or_suppressed/);
 assert.equal(f.calls.filter(x=>x.url.endsWith('/messages')).length,0);
});
test('mismatched variables, channel and ambiguous acceptance are rejected; 429 is returned without an automatic resend',async()=>{
 const f=fixture();await assert.rejects(sendSentTemplate({...input,parameters:{wrong:'value'}},f.options),/parameters_mismatch/);
 await assert.rejects(sendSentTemplate({...input,channel:'sent'},f.options),/invalid_request/);
 f.options.fetcher=async(url,opts)=>{f.calls.push({url,opts});return url.endsWith('/messages')?new Response('{}',{status:429,headers:{'Retry-After':'15'}}):new Response(JSON.stringify({success:true,data:f.template}));};
 await assert.rejects(sendSentTemplate(input,f.options),e=>e.status===429&&e.retryAfterSeconds===15);assert.equal(f.calls.filter(x=>x.url.endsWith('/messages')).length,1);
});
