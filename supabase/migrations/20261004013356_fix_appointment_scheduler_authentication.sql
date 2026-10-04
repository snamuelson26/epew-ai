-- Dedicated scheduler credential; never returned to the client or stored in source.
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),
 'EPEW_APPOINTMENT_CRON_SECRET','Appointment reminder worker credential')
where not exists(select 1 from vault.secrets where name='EPEW_APPOINTMENT_CRON_SECRET');
insert into public.epew_internal_cron_tokens(action_key,token_hash,active)
select 'appointment-reminders',encode(extensions.digest(decrypted_secret,'sha256'),'hex'),true
from vault.decrypted_secrets where name='EPEW_APPOINTMENT_CRON_SECRET'
and not exists(select 1 from public.epew_internal_cron_tokens where action_key='appointment-reminders');
create or replace function epew_private.trigger_appointment_reminders() returns bigint
language plpgsql security invoker set search_path=pg_catalog as $$
declare secret text; request_id bigint;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='EPEW_APPOINTMENT_CRON_SECRET' limit 1;
 if secret is null then raise exception 'Appointment scheduler secret is missing'; end if;
 select net.http_get(url:='https://www.epew.us/api/internal/meetings/process-reminders',
 headers:=jsonb_build_object('Authorization','Bearer '||secret),timeout_milliseconds:=60000) into request_id;
 return request_id;
end $$;
revoke all on function epew_private.trigger_appointment_reminders() from public,anon,authenticated;
