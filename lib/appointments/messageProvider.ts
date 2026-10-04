import twilio from 'twilio';
import {supabaseAdmin} from '@/lib/supabaseAdmin';
import {reminderTemplates} from './messageText';
export function messageClient() {
 const sid=process.env.TWILIO_ACCOUNT_SID?.trim(),token=process.env.TWILIO_AUTH_TOKEN?.trim();
 if(!sid||!token) throw new Error('Twilio credentials are not configured');
 return twilio(sid,token,{timeout:10000,autoRetry:false});
}
export async function saveMessageConfig(key:string,value:unknown) {
 const {error}=await supabaseAdmin.from('epew_appointment_message_config').upsert({key,value,updated_at:new Date().toISOString()});
 if(error) throw error;
}
export async function messagingReadiness(createTemplates=false) {
 const client=messageClient();
 const from=(process.env.TWILIO_WHATSAPP_FROM_NUMBER||process.env.EPEW_TWILIO_WHATSAPP_NUMBER||'').replace(/^whatsapp:/,'').trim();
 const service=process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
 const smsNumber=(process.env.TWILIO_PHONE_NUMBER||process.env.TWILIO_FROM_NUMBER||process.env.EPEW_TWILIO_PHONE_NUMBER||'').trim();
 let sms:{ready:boolean;from?:string;service?:string;reason:string}={ready:false,reason:'No verified SMS sender found'};
 let whatsapp:{ready:boolean;from:string;reason:string}={ready:false,from,reason:'WhatsApp sender not registered'};
 try {
  const numbers=service?await client.messaging.v1.services(service).phoneNumbers.list({limit:30}):await client.incomingPhoneNumbers.list({phoneNumber:smsNumber,limit:2});
  for(const n of numbers) {
   const number=n.phoneNumber;
   if(/^\+1(800|833|844|855|866|877|888)/.test(number)) {
    const verification=await client.messaging.v1.tollfreeVerifications.list({tollfreePhoneNumberSid:n.sid,limit:10});
    if(verification.some(v=>v.status==='TWILIO_APPROVED')) {sms={ready:true,from:number,service,reason:'Toll-free sender approved'};break;}
    sms.reason=`Toll-free verification: ${verification[0]?.status||'not found'}`;
   } else if(service) {
    const campaigns=await client.messaging.v1.services(service).usAppToPerson.list({limit:10});
    if(campaigns.some(c=>c.campaignStatus==='VERIFIED')) {sms={ready:true,from:number,service,reason:'A2P campaign verified'};break;}
    sms.reason='SMS campaign verification is not complete';
   }
  }
 } catch(e) {sms.reason=`SMS verification lookup failed (${(e as {code?:number}).code||'provider error'})`;}
 try {
  const senders=await client.messaging.v2.channelsSenders.list({channel:'whatsapp',limit:100});
  let sender=senders.find(s=>s.senderId.replace(/^whatsapp:/,'')===from);
  const callback='https://www.epew.us/api/twilio/whatsapp/interview';
  if(sender && createTemplates && !sender.webhook?.callbackUrl) {
    sender=await client.messaging.v2.channelsSenders(sender.sid).update({webhook:{callbackUrl:callback,callbackMethod:'POST'}});
  }
  const stopHandlerReady=sender?.webhook?.callbackUrl===callback;
  whatsapp={ready:sender?.status==='ONLINE'&&stopHandlerReady,from,reason:!sender?'Configured WhatsApp number is not registered':!stopHandlerReady?'WhatsApp inbound STOP handling requires connection':sender.status};
 } catch(e) {whatsapp.reason=`WhatsApp sender lookup failed (${(e as {code?:number}).code||'provider error'})`;}
 await saveMessageConfig('sms',sms); await saveMessageConfig('whatsapp',whatsapp);
 const templates:Record<string,unknown>={};
 for(const [language,body] of Object.entries(reminderTemplates)) {
  const key=`template:${language}`;
  const {data,error}=await supabaseAdmin.from('epew_appointment_message_config').select('value').eq('key',key).maybeSingle();
  if(error) throw error;
  let sid=data?.value?.sid as string|undefined;
  try {
   if(!sid && createTemplates) {
    const name=`epew_appointment_reminder_${language}_v1`;
    const found=(await client.content.v1.contents.list({limit:200})).find(c=>c.friendlyName===name);
    const content=found||await client.content.v1.contents.create({friendlyName:name,language,variables:{'1':language==='en'?'24 hours':language==='fr'?'24 heures':language==='ht'?'24 èdtan':'24 horas','2':'October 15, 2026 at 10:00 AM'},types:{twilioText:{body}}});
    sid=content.sid; await saveMessageConfig(key,{sid,status:'created'});
   }
   if(!sid) {templates[language]={status:'not_created'};continue;}
   let approval=await client.content.v1.contents(sid).approvalFetch().fetch();
   let status=String(approval.whatsapp?.status||'unsubmitted');
   if(createTemplates && ['unsubmitted','unsubmitted_template',''].includes(status.toLowerCase())) {
    await client.content.v1.contents(sid).approvalCreate.create({name:`epew_appointment_reminder_${language}_v1`,category:'UTILITY'});
    approval=await client.content.v1.contents(sid).approvalFetch().fetch();status=String(approval.whatsapp?.status||'pending');
   }
   const value={sid,status,reason:approval.whatsapp?.rejection_reason||null};
   await saveMessageConfig(key,value); templates[language]=value;
  } catch(e) {const value={sid,status:'setup_error',code:(e as {code?:number}).code||null,message:(e as Error).message};await saveMessageConfig(key,value);templates[language]=value;}
 }
 return {sms,whatsapp,templates};
}
