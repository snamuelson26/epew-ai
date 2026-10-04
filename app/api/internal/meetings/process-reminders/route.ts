import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { EPEW_EMAIL_FROM, resend } from '@/lib/email/resend';
import { Appointment, reminderEmail } from '@/lib/appointments/reminderEmail';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({error:'Unauthorized'}, {status:401});
  }
  try {
    if (!resend) throw new Error('Email delivery is not configured');
    const {data: queued,error: queueError} = await supabaseAdmin.rpc('epew_prepare_appointment_reminders');
    if (queueError) throw queueError;
    const {data: rows,error: claimError} = await supabaseAdmin.rpc('epew_claim_appointment_reminders');
    if (claimError) throw claimError;
    let sent=0, failed=0, skipped=0;
    for (const row of rows || []) {
      const update = async (values: Record<string,unknown>) => {
        const {error} = await supabaseAdmin.from('epew_appointment_reminders').update(values)
          .eq('id',row.id).eq('status','processing').eq('attempts',row.attempts);
        if (error) throw error;
      };
      try {
        // Re-read immediately before sending: cancellation, rescheduling, and
        // changed recipient preferences invalidate the old queued reminder.
        const {data: current,error} = await supabaseAdmin.from('epew_appointment_recipients')
          .select('source_key').eq('source_key',row.source_key).eq('starts_at',row.starts_at).eq('email',row.email);
        if (error) throw error;
        if (!current?.length || Date.parse(row.starts_at)<=Date.now()) {
          await update({status:'cancelled'}); skipped++; continue;
        }
        const {data: suppressed,error: suppressionError} = await supabaseAdmin.from('epew_email_deliveries')
          .select('id').ilike('recipient_email',row.email)
          .in('provider_status',['email.bounced','email.complained','email.suppressed']).limit(1);
        if (suppressionError) throw suppressionError;
        if (suppressed?.length) { await update({status:'suppressed'}); skipped++; continue; }
        const message = reminderEmail(row.payload as Appointment,row.hours_before);
        // Payload and key stay stable across retries. Resend deduplicates even
        // when delivery succeeded but this worker lost the acknowledgement.
        const result = await resend.emails.send({from:EPEW_EMAIL_FROM,to:row.email,...message},
          {idempotencyKey:`appointment-reminder:${row.id}`});
        if (result.error || !result.data?.id) {
          const code = result.error?.statusCode;
          const retry = !code || code===429 || code>=500;
          await update({status:retry && row.attempts<5?'pending':'failed',
            next_attempt_at:new Date(Date.now()+Math.min(8,2**row.attempts)*60000).toISOString(),
            error_message:result.error?.message || 'Email provider did not acknowledge the message'});
          failed++; continue;
        }
        await update({status:'sent',sent_at:new Date().toISOString(),provider_message_id:result.data.id,error_message:null});
        // Use the existing delivery audit/webhook system for delivered/bounced status.
        const {error:auditError} = await supabaseAdmin.from('epew_email_deliveries').upsert({
          application_id:row.payload.application_id,recipient_email:row.email,recipient_name:row.payload.recipient_name,
          message_type:'appointment_reminder',subject:message.subject,idempotency_key:`appointment-reminder:${row.id}`,
          status:'sent',provider_status:'email.sent',provider_message_id:result.data.id,sent_at:new Date().toISOString(),
          metadata:{reminderId:row.id,sourceKey:row.source_key,startsAt:row.starts_at,hoursBefore:row.hours_before},
        },{onConflict:'idempotency_key',ignoreDuplicates:true});
        if (auditError) console.error('Appointment reminder audit write failed',row.id,auditError.code);
        sent++;
      } catch {
        await update({status:row.attempts<5?'pending':'failed',next_attempt_at:new Date(Date.now()+120000).toISOString(),error_message:'Delivery attempt failed; check provider and scheduler logs.'});
        failed++;
      }
      // Stay below the provider's default requests/second limit.
      await new Promise(resolve=>setTimeout(resolve,600));
    }
    return Response.json({queued,sent,failed,skipped},{headers:{'Cache-Control':'no-store'}});
  } catch {
    console.error('Appointment reminder processor failed');
    return Response.json({error:'Unable to process appointment reminders'},{status:500});
  }
}
