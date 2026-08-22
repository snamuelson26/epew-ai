create or replace function public.epew_store_zoom_meeting_secret(
  p_meeting_id text,
  p_zoom_host_url text,
  p_zoom_start_url text,
  p_zoom_passcode text,
  p_rtms_access_context jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, emcc_private
as $$
begin
  insert into emcc_private.zoom_meeting_secrets (
    meeting_id,
    zoom_host_url,
    zoom_start_url,
    zoom_passcode,
    rtms_access_context,
    updated_at
  )
  values (
    p_meeting_id,
    p_zoom_host_url,
    p_zoom_start_url,
    p_zoom_passcode,
    coalesce(p_rtms_access_context, '{}'::jsonb),
    now()
  )
  on conflict (meeting_id)
  do update set
    zoom_host_url = excluded.zoom_host_url,
    zoom_start_url = excluded.zoom_start_url,
    zoom_passcode = excluded.zoom_passcode,
    rtms_access_context = excluded.rtms_access_context,
    updated_at = now();
end;
$$;

revoke all on function public.epew_store_zoom_meeting_secret(
  text,
  text,
  text,
  text,
  jsonb
) from public;

revoke all on function public.epew_store_zoom_meeting_secret(
  text,
  text,
  text,
  text,
  jsonb
) from anon;

revoke all on function public.epew_store_zoom_meeting_secret(
  text,
  text,
  text,
  text,
  jsonb
) from authenticated;

grant execute on function public.epew_store_zoom_meeting_secret(
  text,
  text,
  text,
  text,
  jsonb
) to service_role;
