-- General inbound WhatsApp support. A phone is never treated as portal identity.
create table public.epew_whatsapp_support_messages (
 message_sid text primary key check(message_sid ~ '^(SM|MM)[0-9a-fA-F]{32}$'),
 phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 body text not null check(length(body) between 1 and 10000),
 media_count integer not null default 0 check(media_count between 0 and 10),
 received_at timestamptz not null default now()
);
create index on public.epew_whatsapp_support_messages(received_at desc);
create index on public.epew_whatsapp_support_messages(phone,received_at desc);
create table public.epew_whatsapp_support_replies (
 request_key uuid primary key,
 inbound_sid text not null references public.epew_whatsapp_support_messages(message_sid),
 actor_user_id uuid not null references auth.users(id),
 body text not null check(length(body) between 1 and 3000),
 status text not null default 'unknown' check(status in ('unknown','accepted','queued','sending','sent','delivered','read','failed','undelivered','canceled')),
 provider_sid text unique check(provider_sid is null or provider_sid ~ '^(SM|MM)[0-9a-fA-F]{32}$'),
 created_at timestamptz not null default now()
);
create index on public.epew_whatsapp_support_replies(inbound_sid,created_at);
create index on public.epew_whatsapp_support_replies(created_at desc);
alter table public.epew_whatsapp_support_messages enable row level security;
alter table public.epew_whatsapp_support_replies enable row level security;
revoke all on public.epew_whatsapp_support_messages,public.epew_whatsapp_support_replies from public,anon,authenticated;
grant select,insert on public.epew_whatsapp_support_messages to service_role;
grant select,insert,update on public.epew_whatsapp_support_replies to service_role;
