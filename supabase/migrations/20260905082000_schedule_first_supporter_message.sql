-- EPEW Entrepreneur Communication System
-- Schedule the official first entrepreneur-to-supporter message for the next 9:30 AM America/New_York.
-- Enforce one official introduction message per entrepreneur/supporter contact.

create or replace function public.epew_schedule_first_supporter_message()
returns trigger
language plpgsql
as $$
declare
  local_created timestamp;
  local_target timestamp;
begin
  if new.message_type <> 'introduction' then
    return new;
  end if;

  -- Introduction messages are queued automatically unless already finalized.
  if new.delivery_status in ('draft', 'queued') then
    new.delivery_status := 'queued';
  end if;

  if new.scheduled_for is null and new.sent_at is null then
    local_created := timezone('America/New_York', coalesce(new.created_at, now()));
    local_target := date_trunc('day', local_created) + interval '9 hours 30 minutes';

    if local_created >= local_target then
      local_target := local_target + interval '1 day';
    end if;

    new.scheduled_for := local_target at time zone 'America/New_York';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_epew_schedule_first_supporter_message
  on public.epew_entrepreneur_communication_messages;

create trigger trg_epew_schedule_first_supporter_message
before insert on public.epew_entrepreneur_communication_messages
for each row
execute function public.epew_schedule_first_supporter_message();

create unique index if not exists uq_epew_first_message_per_contact
  on public.epew_entrepreneur_communication_messages (contact_id)
  where message_type = 'introduction';

comment on function public.epew_schedule_first_supporter_message() is
  'Queues the official first entrepreneur-to-supporter message for the next 9:30 AM America/New_York.';
