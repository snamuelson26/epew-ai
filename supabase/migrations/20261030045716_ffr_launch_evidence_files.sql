insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('epew-restaurant-evidence','epew-restaurant-evidence',false,20971520,
array['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;
do $$ begin if exists(select 1 from storage.buckets where id='epew-restaurant-evidence' and public) then raise exception 'Restaurant evidence bucket must be private'; end if; end $$;
create table public.epew_restaurant_work_files (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 task_id uuid not null references public.epew_restaurant_work_items(id),
 bucket text not null default 'epew-restaurant-evidence' check(bucket='epew-restaurant-evidence'),
 object_key text not null unique,
 file_name text not null,
 mime_type text not null,
 size_bytes integer not null check(size_bytes between 1 and 20971520),
 uploaded_by_user_id uuid not null,
 uploaded_by_email text not null,
 reason text not null check(length(btrim(reason)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index epew_restaurant_work_files_task_idx on public.epew_restaurant_work_files(task_id);
alter table public.epew_restaurant_work_files enable row level security;
revoke all on public.epew_restaurant_work_files from public,anon,authenticated,service_role;
grant select,insert on public.epew_restaurant_work_files to service_role;
create trigger ffr_work_file_audit before insert on public.epew_restaurant_work_files for each row execute function private.epew_audit_restaurant_unit_change();
create trigger ffr_work_files_append_only before update or delete or truncate on public.epew_restaurant_work_files for each statement execute function private.epew_protect_restaurant_unit_audit();
create function public.epew_restaurant_attach_file(p_actor uuid,p_email text,p_unit text,p_task uuid,p_object_key text,p_name text,p_mime text,p_size integer,p_reason text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if p_actor is null or p_email is null or not exists(select 1 from public.user_roles r where r.role='administrator' and (r.user_id=p_actor or (r.user_id is null and lower(r.email)=lower(p_email)))) then raise exception using errcode='42501',message='Administrator required'; end if;
 if not exists(select 1 from public.epew_restaurant_work_items where id=p_task and restaurant_unit_id=p_unit)
 or p_object_key not like p_unit||'/'||p_task::text||'/%'
 or not exists(select 1 from storage.objects where bucket_id='epew-restaurant-evidence' and name=p_object_key)
 then raise exception using errcode='22023',message='Task or private object not verified'; end if;
 perform set_config('epew.change_reason',p_reason,true);
 perform set_config('epew.change_executor','EPEW administrator: '||p_email,true);
 perform set_config('epew.change_authorization','Verified administrator session; launch evidence upload',true);
 perform set_config('epew.actor_user_id',p_actor::text,true);
 insert into public.epew_restaurant_work_files(restaurant_unit_id,task_id,object_key,file_name,mime_type,size_bytes,uploaded_by_user_id,uploaded_by_email,reason)
 values(p_unit,p_task,p_object_key,p_name,p_mime,p_size,p_actor,p_email,p_reason) returning id into result;
 return result;
end $$;
revoke all on function public.epew_restaurant_attach_file(uuid,text,text,uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.epew_restaurant_attach_file(uuid,text,text,uuid,text,text,text,integer,text) to service_role;
