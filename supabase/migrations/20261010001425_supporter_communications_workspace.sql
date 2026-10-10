create table public.epew_supporter_staff (
 email text primary key check(email=lower(email)), user_id uuid references auth.users(id), display_name text not null,
 role text not null check(role in ('advisor','director')), active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.epew_supporter_threads (
 id uuid primary key default gen_random_uuid(), supporter_id uuid references public.supporters(id),
 subject text not null check(length(subject) between 1 and 200), recipient text not null,
 internal boolean not null default false, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(internal or supporter_id is not null)
);
create table public.epew_supporter_thread_messages (
 id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.epew_supporter_threads(id),
 sender_user_id uuid not null references auth.users(id), sender_name text not null,
 body text not null check(length(body) between 1 and 10000), created_at timestamptz not null default now()
);
create table public.epew_supporter_documents (
 id uuid primary key default gen_random_uuid(), supporter_id uuid references public.supporters(id),
 thread_id uuid references public.epew_supporter_threads(id), internal boolean not null default false,
 name text not null, storage_path text not null unique, uploaded_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), check(internal or supporter_id is not null)
);
create table public.epew_supporter_activity (
 id uuid primary key default gen_random_uuid(), actor_user_id uuid not null references auth.users(id),
 action text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
alter table public.epew_supporter_staff enable row level security;
alter table public.epew_supporter_threads enable row level security;
alter table public.epew_supporter_thread_messages enable row level security;
alter table public.epew_supporter_documents enable row level security;
alter table public.epew_supporter_activity enable row level security;
revoke all on public.epew_supporter_staff,public.epew_supporter_threads,public.epew_supporter_thread_messages,public.epew_supporter_documents,public.epew_supporter_activity from anon,authenticated;
grant all on public.epew_supporter_staff,public.epew_supporter_threads,public.epew_supporter_thread_messages,public.epew_supporter_documents,public.epew_supporter_activity to service_role;
create index epew_supporter_thread_owner on public.epew_supporter_threads(supporter_id,updated_at desc);
create index epew_supporter_messages_thread on public.epew_supporter_thread_messages(thread_id,created_at);
create index epew_supporter_documents_owner on public.epew_supporter_documents(supporter_id);
insert into public.epew_supporter_staff(email,user_id,display_name,role) values
 ('ynoslen@epew.us',null,'Yamiley Noslen','advisor'),
 ('snamuelson@gmail.com','5ea98a4a-b159-4979-8323-8abf13c3cf9d','Samuel Nelson','director'),
 ('samuelnelson@rocketmail.com','93ed5f31-21f7-461f-a174-edc4527f3d26','Samuel Nelson','director');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('epew-supporter-communications','epew-supporter-communications',false,10485760,array['application/pdf','image/png','image/jpeg']);
