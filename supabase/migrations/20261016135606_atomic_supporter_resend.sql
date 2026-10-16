-- Server-only queue operation. Keep the one-original-introduction constraint.
create or replace function public.epew_queue_supporter_resend(p_user_id uuid, p_contact_id uuid, p_business_code text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 c public.epew_entrepreneur_communication_contacts%rowtype;
 original public.epew_entrepreneur_communication_messages%rowtype;
 queued public.epew_entrepreneur_communication_messages%rowtype;
 channel text;
begin
 select * into c from public.epew_entrepreneur_communication_contacts
 where id=p_contact_id and entrepreneur_user_id=p_user_id and business_code=p_business_code for update;
 if not found then return jsonb_build_object('error','Contact not found','httpStatus',404); end if;
 if c.opted_out_at is not null or c.status in ('paused','not_interested') or not c.weekly_follow_up_enabled then
  return jsonb_build_object('error','Communication is paused or this contact has opted out.','httpStatus',409);
 end if;
 -- The contact lock serializes simultaneous clicks, even before a queue row exists.
 select * into queued from public.epew_entrepreneur_communication_messages
 where contact_id=c.id and entrepreneur_user_id=p_user_id and business_code=p_business_code
 and message_type in ('introduction','supporter_follow_up')
 and (delivery_status in ('queued','sending') or (delivery_status in ('sent','delivered') and created_at>now()-interval '2 minutes'))
 order by created_at desc limit 1;
 if found then return jsonb_build_object('ok',true,'alreadyQueued',true,'messageId',queued.id,'status',queued.delivery_status,'scheduledFor',queued.scheduled_for); end if;
 select * into original from public.epew_entrepreneur_communication_messages
 where contact_id=c.id and entrepreneur_user_id=p_user_id and business_code=p_business_code and message_type='introduction'
 order by created_at desc limit 1;
 if not found then return jsonb_build_object('error','No original campaign message is available to resend.','httpStatus',404); end if;
 channel:=case when nullif(btrim(c.email),'') is not null then 'email' when nullif(btrim(c.phone),'') is not null then 'sms' end;
 if channel is null then return jsonb_build_object('error','No contact channel is available.','httpStatus',409); end if;
 insert into public.epew_entrepreneur_communication_messages
 (entrepreneur_user_id,contact_id,business_code,message_type,language,subject,body,sender_voice,delivery_channel,delivery_status,scheduled_for)
 values(p_user_id,c.id,p_business_code,'supporter_follow_up',original.language,original.subject,original.body,original.sender_voice,channel,'queued',now()) returning * into queued;
 return jsonb_build_object('ok',true,'alreadyQueued',false,'messageId',queued.id,'status',queued.delivery_status,'scheduledFor',queued.scheduled_for,'contactName',c.prospect_name,'channel',channel);
end $$;
revoke all on function public.epew_queue_supporter_resend(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.epew_queue_supporter_resend(uuid,uuid,text) to service_role;
