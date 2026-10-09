-- Queue new entrepreneur support requests immediately instead of next morning.
create or replace function public.epew_schedule_first_supporter_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.message_type = 'introduction' and new.delivery_status in ('draft', 'queued') then
    new.delivery_status := 'queued';
    if new.sent_at is null then
      new.scheduled_for := coalesce(new.scheduled_for, now());
    end if;
  end if;
  return new;
end;
$$;
comment on function public.epew_schedule_first_supporter_message() is
  'Queues new entrepreneur support requests immediately; the portal dispatches on submission and the outbox recovers delays.';
