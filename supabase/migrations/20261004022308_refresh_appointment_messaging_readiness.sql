-- Refresh pending approvals automatically; once settled, recheck hourly.
create function epew_private.refresh_appointment_messaging_readiness() returns bigint
language plpgsql security invoker set search_path=pg_catalog as $$
declare token text; request_id bigint;
begin
 if not exists(select 1 from public.epew_appointment_message_config
   where updated_at<now()-interval '1 hour'
   or (updated_at<now()-interval '4 minutes' and (
     (key in ('sms','whatsapp') and value->>'ready'='false')
     or value->>'status' in('received','pending','pending_review','created')))) then return null; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='EPEW_APPOINTMENT_CRON_SECRET' limit 1;
 if token is null then raise exception 'Scheduler credential missing'; end if;
 select net.http_get(url:='https://www.epew.us/api/internal/meetings/messaging-setup',
 headers:=jsonb_build_object('Authorization','Bearer '||token),timeout_milliseconds:=60000) into request_id;
 return request_id;
end $$;
revoke all on function epew_private.refresh_appointment_messaging_readiness() from public,anon,authenticated;
select cron.schedule('epew-appointment-messaging-readiness','*/5 * * * *',
 'select epew_private.refresh_appointment_messaging_readiness();');
