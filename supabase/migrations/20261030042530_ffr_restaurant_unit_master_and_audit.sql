
create table public.epew_restaurant_units (
 restaurant_unit_id text primary key,
 business_name text not null,
 location_name text not null,
 address text not null,
 phone text not null,
 business_type text not null,
 brand text not null,
 network text not null,
 operational_status text not null,
 marketplace_status text not null,
 marketplace_launch_status text not null,
 epew_support_campaign_id text not null references public.entrepreneurs(public_business_id),
 ordering_url text,
 support_url text not null,
 pos_provider text,
 website_url text,
 approved_opening_date date,
 operating_hours jsonb,
 field_verification jsonb not null default '{}'::jsonb,
 unresolved_items jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (restaurant_unit_id ~ '^FFR-[0-9]{3,}$'),
 check (ordering_url is null or ordering_url ~ '^https://'),
 check (support_url ~ '^https://'),
 check (website_url is null or website_url ~ '^https://')
);
create table public.epew_restaurant_unit_campaigns (
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 epew_support_campaign_id text not null references public.entrepreneurs(public_business_id),
 relationship_status text not null,
 notes text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (restaurant_unit_id,epew_support_campaign_id)
);
create table public.epew_restaurant_unit_audit (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null,
 table_name text not null,
 operation text not null,
 old_record jsonb,
 new_record jsonb,
 database_actor text not null,
 actor_user_id uuid,
 executor text not null,
 authorization_source text not null,
 reason text not null,
 transaction_id bigint not null,
 occurred_at timestamptz not null default now()
);
create index epew_restaurant_unit_audit_unit_time_idx on public.epew_restaurant_unit_audit(restaurant_unit_id,occurred_at desc);
create index epew_restaurant_unit_campaigns_campaign_idx on public.epew_restaurant_unit_campaigns(epew_support_campaign_id);
alter table public.epew_restaurant_units enable row level security;
alter table public.epew_restaurant_unit_campaigns enable row level security;
alter table public.epew_restaurant_unit_audit enable row level security;
revoke all on public.epew_restaurant_units,public.epew_restaurant_unit_campaigns,public.epew_restaurant_unit_audit from public,anon,authenticated;
grant select,insert,update on public.epew_restaurant_units,public.epew_restaurant_unit_campaigns to service_role;
grant select,insert on public.epew_restaurant_unit_audit to service_role;
create function private.epew_audit_restaurant_unit_change() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
 old_json jsonb;
 new_json jsonb;
 change_reason text := nullif(current_setting('epew.change_reason',true),'');
 change_executor text := nullif(current_setting('epew.change_executor',true),'');
 change_authorization text := nullif(current_setting('epew.change_authorization',true),'');
begin
 if change_reason is null or change_executor is null or change_authorization is null then
  raise exception 'Restaurant changes require reason, executor and authorization source';
 end if;
 if TG_OP='UPDATE' and NEW.restaurant_unit_id<>OLD.restaurant_unit_id then
  raise exception 'Restaurant unit identity cannot be overwritten';
 end if;
 if TG_OP='UPDATE' then NEW.updated_at:=clock_timestamp(); end if;
 if TG_OP in ('UPDATE','DELETE') then old_json:=to_jsonb(OLD); end if;
 if TG_OP in ('INSERT','UPDATE') then new_json:=to_jsonb(NEW); end if;
 insert into public.epew_restaurant_unit_audit
 (restaurant_unit_id,table_name,operation,old_record,new_record,database_actor,actor_user_id,executor,authorization_source,reason,transaction_id)
 values (coalesce(new_json->>'restaurant_unit_id',old_json->>'restaurant_unit_id'),TG_TABLE_NAME,TG_OP,old_json,new_json,current_user,auth.uid(),change_executor,change_authorization,change_reason,txid_current());
 if TG_OP='DELETE' then return OLD; end if;
 return NEW;
end $$;
create function private.epew_protect_restaurant_unit_audit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Restaurant audit records are append-only'; end $$;
revoke all on function private.epew_audit_restaurant_unit_change(),private.epew_protect_restaurant_unit_audit() from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.epew_audit_restaurant_unit_change(),private.epew_protect_restaurant_unit_audit() to service_role;
create trigger epew_restaurant_units_audit before insert or update or delete on public.epew_restaurant_units for each row execute function private.epew_audit_restaurant_unit_change();
create trigger epew_restaurant_unit_campaigns_audit before insert or update or delete on public.epew_restaurant_unit_campaigns for each row execute function private.epew_audit_restaurant_unit_change();
create trigger epew_restaurant_unit_audit_append_only before update or delete or truncate on public.epew_restaurant_unit_audit for each statement execute function private.epew_protect_restaurant_unit_audit();
comment on table public.epew_restaurant_units is 'Authoritative restaurant operational master; restaurant identity is separate from EPEW support campaign identities. Backend access only pending scoped admin UI.';
comment on table public.epew_restaurant_unit_audit is 'Append-only before/after audit. Database actor and auth UID are recorded separately from executor and user-provided authorization provenance.';
