import {NextRequest} from 'next/server';
import {validateTwilioWebhook} from '@/lib/twilio/validateTwilioWebhook';
import {supabaseAdmin} from '@/lib/supabaseAdmin';
export async function POST(request:NextRequest) {
 const {valid,params}=await validateTwilioWebhook(request);
 if(!valid)return new Response('Forbidden',{status:403});
 const id=new URL(request.url).searchParams.get('id');
 if(!id||!/^(SM|MM)[a-f0-9]{32}$/i.test(params.MessageSid||''))return new Response('Invalid',{status:400});
 const {data:row,error}=await supabaseAdmin.from('epew_appointment_message_deliveries').select('id,phone,channel,status,provider_message_id').eq('id',id).maybeSingle();
 if(error)return new Response('Retry',{status:503});
 if(!row||params.To!==`${row.channel==='whatsapp'?'whatsapp:':''}${row.phone}`||(row.provider_message_id&&row.provider_message_id!==params.MessageSid))return new Response('Not found',{status:404});
 const status=params.MessageStatus;
 const mapped=status==='read'?'read':status==='delivered'?'delivered':['failed','undelivered','canceled'].includes(status)?'failed':'accepted';
 // Ignore out-of-order callbacks that would regress a delivered/read message.
 if((row.status==='failed'&&mapped==='accepted')||row.status==='read'||(row.status==='delivered'&&mapped!=='read'))return new Response('OK');
 const {error:updateError}=await supabaseAdmin.from('epew_appointment_message_deliveries').update({status:mapped,provider_message_id:params.MessageSid,error_code:params.ErrorCode||null,updated_at:new Date().toISOString()}).eq('id',id).eq('status',row.status);
 if(updateError)return new Response('Retry',{status:503});
 if(params.ErrorCode==='21610')await supabaseAdmin.from('epew_appointment_message_optouts').upsert({phone:row.phone,channel:row.channel},{onConflict:'phone,channel'});
 return new Response('OK');
}
