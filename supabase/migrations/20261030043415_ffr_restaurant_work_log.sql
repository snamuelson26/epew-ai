-- FFR restaurant work tracking. Only the existing administrator role may use
-- the server-verified operation. Customers and other staff get no new access.
create table public.epew_restaurant_work_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 title text not null check (length(btrim(title)) between 1 and 200),
 description text not null check (length(btrim(description)) between 1 and 4000),
 owner_label text not null check (length(btrim(owner_label)) between 1 and 200),
 status text not null default 'planned' check (status in ('planned','in_progress','blocked','ready_for_review','completed')),
 due_at timestamptz,
 created_by_user_id uuid not null,
 created_by_email text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.epew_restaurant_work_entries (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 task_id uuid not null references public.epew_restaurant_work_items(id),
 entry_kind text not null check (entry_kind in ('task_created','status_changed','progress','evidence','decision','correction')),
 body text not null check (length(btrim(body)) between 1 and 4000),
 evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
 corrects_entry_id uuid references public.epew_restaurant_work_entries(id),
 actor_user_id uuid not null,
 actor_email text not null,
 request_id uuid not null,
 request_action text not null,
 request_input jsonb not null,
 created_at timestamptz not null default now(),
 unique(actor_user_id, request_id),
 check ((entry_kind='correction')=(corrects_entry_id is not null)),
 check (entry_kind<>'evidence' or evidence_url is not null)
);
create index epew_restaurant_work_items_unit_idx on public.epew_restaurant_work_items(restaurant_unit_id,created_at desc);
create index epew_restaurant_work_entries_unit_idx on public.epew_restaurant_work_entries(restaurant_unit_id,created_at desc);
create index epew_restaurant_work_entries_task_idx on public.epew_restaurant_work_entries(task_id);
create index epew_restaurant_work_entries_correction_idx on public.epew_restaurant_work_entries(corrects_entry_id);
alter table public.epew_restaurant_work_items enable row level security;
alter table public.epew_restaurant_work_entries enable row level security;
revoke all on public.epew_restaurant_work_items,public.epew_restaurant_work_entries from public,anon,authenticated;
revoke all on public.epew_restaurant_work_items,public.epew_restaurant_work_entries from service_role;
grant select,insert,update on public.epew_restaurant_work_items to service_role;
grant select,insert on public.epew_restaurant_work_entries to service_role;

create or replace function private.epew_audit_restaurant_unit_change() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
 old_json jsonb; new_json jsonb;
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
 values (coalesce(new_json->>'restaurant_unit_id',old_json->>'restaurant_unit_id'),TG_TABLE_NAME,TG_OP,old_json,new_json,current_user,
 coalesce(auth.uid(),nullif(current_setting('epew.actor_user_id',true),'')::uuid),
 change_executor,change_authorization,change_reason,txid_current());
 if TG_OP='DELETE' then return OLD; end if;
 return NEW;
end $$;
create trigger epew_restaurant_work_items_audit before insert or update or delete on public.epew_restaurant_work_items for each row execute function private.epew_audit_restaurant_unit_change();
create trigger epew_restaurant_work_entries_audit before insert on public.epew_restaurant_work_entries for each row execute function private.epew_audit_restaurant_unit_change();
create trigger epew_restaurant_work_entries_append_only before update or delete or truncate on public.epew_restaurant_work_entries for each statement execute function private.epew_protect_restaurant_unit_audit();

create function public.epew_restaurant_work_operation(p_actor uuid,p_actor_email text,p_unit text,p_action text,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_task public.epew_restaurant_work_items;
 v_entry public.epew_restaurant_work_entries;
 v_request uuid := (p_input->>'request_id')::uuid;
 v_reason text := btrim(p_input->>'reason');
 v_kind text;
 v_expected timestamptz;
begin
 if p_actor is null or p_actor_email is null or not exists (
  select 1 from public.user_roles r where r.role='administrator'
  and (r.user_id=p_actor or (r.user_id is null and lower(r.email)=lower(p_actor_email)))
 ) then raise exception using errcode='42501',message='Administrator required'; end if;
 if p_unit is null or not exists(select 1 from public.epew_restaurant_units where restaurant_unit_id=p_unit) then
  raise exception using errcode='22023',message='Restaurant not found'; end if;
 if p_action not in ('create_task','update_task','add_entry') or p_action is null or v_request is null
 or v_reason is null or length(v_reason) not between 1 and 4000 then
  raise exception using errcode='22023',message='Invalid work request'; end if;
 -- Serialize retries of the same actor/request so a double-click cannot create two tasks.
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||v_request::text,0));
 select * into v_entry from public.epew_restaurant_work_entries where actor_user_id=p_actor and request_id=v_request;
 if found then
  if v_entry.restaurant_unit_id<>p_unit or v_entry.request_action<>p_action or v_entry.request_input<>p_input then
   raise exception using errcode='22023',message='Request ID already used for different input';
  end if;
  return jsonb_build_object('saved',true,'task_id',v_entry.task_id,'entry_id',v_entry.id,'replayed',true);
 end if;
 perform set_config('epew.change_reason',v_reason,true);
 perform set_config('epew.change_executor','EPEW administrator: '||p_actor_email,true);
 perform set_config('epew.change_authorization','Verified administrator session; restaurant work operation',true);
 perform set_config('epew.actor_user_id',p_actor::text,true);
 if p_action='create_task' then
  insert into public.epew_restaurant_work_items
  (restaurant_unit_id,title,description,owner_label,due_at,created_by_user_id,created_by_email)
  values(p_unit,btrim(p_input->>'title'),btrim(p_input->>'description'),btrim(p_input->>'owner'),nullif(p_input->>'due_at','')::timestamptz,p_actor,p_actor_email)
  returning * into v_task;
  v_kind:='task_created';
 else
  select * into v_task from public.epew_restaurant_work_items where id=(p_input->>'task_id')::uuid and restaurant_unit_id=p_unit for update;
  if not found then raise exception using errcode='22023',message='Task not found for restaurant'; end if;
  if p_action='update_task' then
   v_expected:=(p_input->>'expected_updated_at')::timestamptz;
   if v_expected is null or v_task.updated_at<>v_expected then
    raise exception using errcode='40001',message='Task changed; reload before updating'; end if;
   if p_input->>'status' is null or p_input->>'status' not in ('planned','in_progress','blocked','ready_for_review','completed') then
    raise exception using errcode='22023',message='Invalid status'; end if;
   update public.epew_restaurant_work_items set status=p_input->>'status' where id=v_task.id returning * into v_task;
   v_kind:='status_changed';
  else
   v_kind:=p_input->>'kind';
   if v_kind is null or v_kind not in ('progress','evidence','decision','correction') then
    raise exception using errcode='22023',message='Invalid entry kind'; end if;
   if v_kind='correction' and not exists (
    select 1 from public.epew_restaurant_work_entries
    where id=(p_input->>'corrects_entry_id')::uuid and task_id=v_task.id and restaurant_unit_id=p_unit
   ) then raise exception using errcode='22023',message='Correction must reference an entry on this task'; end if;
  end if;
 end if;
 insert into public.epew_restaurant_work_entries
 (restaurant_unit_id,task_id,entry_kind,body,evidence_url,corrects_entry_id,actor_user_id,actor_email,request_id,request_action,request_input)
 values(p_unit,v_task.id,v_kind,v_reason,nullif(p_input->>'evidence_url',''),
 case when v_kind='correction' then (p_input->>'corrects_entry_id')::uuid end,p_actor,p_actor_email,v_request,p_action,p_input)
 returning * into v_entry;
 return jsonb_build_object('saved',true,'task_id',v_task.id,'entry_id',v_entry.id,'replayed',false);
end $$;
revoke all on function public.epew_restaurant_work_operation(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.epew_restaurant_work_operation(uuid,text,text,text,jsonb) to service_role;
comment on table public.epew_restaurant_work_entries is 'Immutable restaurant work notes and corrections. Actor identity supplied only by verified server session. Owner labels identify responsibility; they do not grant account access.';
