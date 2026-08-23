create or replace function public.epew_trigger_establishment_no_show_cleanup()
returns bigint
language plpgsql
security definer
set search_path = public, extensions, vault, net
as $$
declare
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'EPEW_CRON_SECRET'
  limit 1;

  if v_secret is null then
    raise exception 'EPEW_CRON_SECRET is not configured in Vault';
  end if;

  select net.http_get(
    url := 'https://www.epew.us/api/internal/meetings/process-no-shows',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || v_secret
    ),
    timeout_milliseconds := 10000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.epew_trigger_establishment_no_show_cleanup() from public;
grant execute on function public.epew_trigger_establishment_no_show_cleanup() to postgres;

do $$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'epew-emcc-no-show-recovery-every-minute'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'epew-emcc-no-show-recovery-every-minute',
  '* * * * *',
  'select public.epew_trigger_establishment_no_show_cleanup();'
);
