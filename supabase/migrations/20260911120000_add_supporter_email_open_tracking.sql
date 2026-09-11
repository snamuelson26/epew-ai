alter table public.epew_entrepreneur_communication_messages
  add column if not exists open_tracking_token uuid not null default gen_random_uuid(),
  add column if not exists opened_at timestamptz,
  add column if not exists last_opened_at timestamptz,
  add column if not exists open_count integer not null default 0;

create unique index if not exists epew_entrepreneur_communication_messages_open_tracking_token_uidx
  on public.epew_entrepreneur_communication_messages(open_tracking_token);

alter table public.epew_entrepreneur_communication_messages
  drop constraint if exists epew_entrepreneur_communication_messages_open_count_nonnegative;

alter table public.epew_entrepreneur_communication_messages
  add constraint epew_entrepreneur_communication_messages_open_count_nonnegative
  check (open_count >= 0);
