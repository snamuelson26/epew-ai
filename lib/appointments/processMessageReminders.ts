import {canSendApplicationSms} from "@/lib/communications/canSendApplicationSms";
import {supabaseAdmin} from '@/lib/supabaseAdmin';
import {messageClient} from './messageProvider';
import {appointmentMessage} from './messageText';
import {processSentAppointment} from './sentAppointment';
export async function processMessageReminders() {
 const useSent=process.env.EPEW_APPOINTMENT_MESSAGE_PROVIDER==='sent';
 // Pause before preparing or claiming any queue rows. Deployment is not launch.
 if(useSent&&process.env.EPEW_SENT_APPOINTMENT_LIVE_ENABLED!=='true')return {accepted:0,blocked:0,failed:0,paused:true};
 const {error:prep}=await supabaseAdmin.rpc('epew_prepare_appointment_messages'); if(prep) throw prep;
 const {data:rows,error}=await supabaseAdmin.rpc('epew_claim_appointment_messages'); if(error) throw error;
 if(!rows?.length) return {accepted:0,blocked:0,failed:0};
 const stats={accepted:0,blocked:0,failed:0};
 for(const row of rows) {
  const update=async (value:Record<string,unknown>)=>{const {error}=await supabaseAdmin.from('epew_appointment_message_deliveries').update({...value,updated_at:new Date().toISOString()}).eq('id',row.id).eq('status','processing');if(error)throw error;};
  let submitted=false;
  try {
   const {data:current,error:currentError}=await supabaseAdmin.from('epew_appointment_mobile_recipients').select('source_key').eq('source_key',row.source_key).eq('starts_at',row.starts_at).eq('channel',row.channel).eq('phone',row.phone);
   if(currentError)throw currentError;
   if(!current?.length||Date.parse(row.starts_at)<=Date.now()) {await update({status:'cancelled'});continue;}
   if(useSent) {
    try {await processSentAppointment(row);stats.accepted++;}
    catch(e) {
     const err=e as {code?:string;status?:number;retryAfterSeconds?:number};
     const code=err.code||'sent_request_unknown';
     const unknown=['sent_request_unknown','sent_acceptance_persistence_unknown','sent_acceptance_unconfirmed','sent_acceptance_unknown','sent_provider_cutover_requires_reconciliation'].includes(code);
     const terminal=(!!err.status&&err.status>=400&&err.status<500&&err.status!==429&&err.status!==409)||code==='sent_consent_missing_or_suppressed';
     const retryAfter=Math.max(300,err.retryAfterSeconds||0);
     await update({status:unknown?'unknown':terminal?'failed':'blocked',error_code:code,next_attempt_at:new Date(Date.now()+retryAfter*1000).toISOString()});
     if(unknown||terminal)stats.failed++;else stats.blocked++;
    }
    continue;
   }
   // A row reserved by Sent must never fall back to Twilio after a configuration change.
   if(row.provider==='sent') {await update({status:'unknown',error_code:'sent_provider_reconciliation_required'});stats.blocked++;continue;}
   const client=messageClient();
   const {data:config,error:configError}=await supabaseAdmin.from('epew_appointment_message_config').select('value').eq('key',row.channel).maybeSingle();
   if(configError)throw configError;
   if(!config?.value?.ready) {await update({status:'blocked',error_code:'sender_not_ready',next_attempt_at:new Date(Date.now()+300000).toISOString()});stats.blocked++;continue;}
   if(row.channel==='sms' && !(await canSendApplicationSms(row.phone))) {await update({status:'cancelled',error_code:'sms_consent_missing_or_suppressed'});continue;}
   const message=appointmentMessage(row.payload.language,row.hours_before,row.starts_at);
   const statusCallback=`https://www.epew.us/api/twilio/appointment-message-status?id=${row.id}`;
   let options;
   if(row.channel==='whatsapp') {
    const {data:template,error:templateError}=await supabaseAdmin.from('epew_appointment_message_config').select('value').eq('key',`template:${message.lang}`).maybeSingle();
    if(templateError)throw templateError;
    const sid=template?.value?.sid;
    const approval=sid?await client.content.v1.contents(sid).approvalFetch().fetch():null;
    if(String(approval?.whatsapp?.status).toLowerCase()!=='approved') {await update({status:'blocked',error_code:'template_not_approved',next_attempt_at:new Date(Date.now()+300000).toISOString()});stats.blocked++;continue;}
    options={from:`whatsapp:${config.value.from}`,to:`whatsapp:${row.phone}`,contentSid:sid,contentVariables:JSON.stringify(message.variables),statusCallback};
   } else {
    options={from:config.value.from,...(config.value.service?{messagingServiceSid:config.value.service}:{}),to:row.phone,body:message.body,statusCallback};
   }
   submitted=true;
   const result=await client.messages.create(options);
   await update({status:'accepted',provider_message_id:result.sid,error_code:null}); stats.accepted++;
  } catch(e) {
   const error=e as {code?:number;status?:number};
   // A timeout/5xx after submission is ambiguous: await callback, do not send twice.
   const uncertain=submitted&&(!error.status||error.status>=500);
   const retry=!submitted||error.status===429;
   await update({status:uncertain?'unknown':retry&&row.attempts<10?'pending':'failed',error_code:String(error.code||'provider_error'),next_attempt_at:new Date(Date.now()+120000).toISOString()});
   if(error.code===21610)await supabaseAdmin.from('epew_appointment_message_optouts').upsert({phone:row.phone,channel:row.channel},{onConflict:'phone,channel'});
   stats.failed++;
  }
 }
 return stats;
}
