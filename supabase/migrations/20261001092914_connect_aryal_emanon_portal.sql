-- A portal code identifies a shared workspace, not a single account.
-- Retain per-user ownership and all existing RLS policies.
alter table public.organization_portal_profiles
  drop constraint organization_portal_profiles_profile_code_key;
alter table public.organization_portal_profiles
  add constraint organization_portal_profiles_user_profile_code_key
  unique (auth_user_id, profile_code);

do $$
begin
  if not exists (
    select 1 from public.emanon_staff_members s
    join public.emanon_organizations o on o.id=s.organization_id
    join auth.users u on u.id=s.user_id
    join public.user_roles r on r.user_id=s.user_id and r.role='emanon_staff'
    where s.email='programdirector@emanoninstitute.org'
      and u.email=s.email and u.email_confirmed_at is not null
      and s.status='active' and s.role_code='program_director'
      and o.organization_code='EMANON-INSTITUTE'
  ) then raise exception 'Confirmed Emanon Program Director membership required'; end if;

  insert into public.organization_portal_profiles
    (auth_user_id,entity_id,profile_code,display_name,external_sender,status,modules)
  select s.user_id,p.entity_id,p.profile_code,p.display_name,p.external_sender,'active',p.modules
  from public.emanon_staff_members s
  join public.emanon_organizations o on o.id=s.organization_id
  cross join lateral (
    select * from public.organization_portal_profiles
    where profile_code='EMANON-001' and status='active'
    order by created_at limit 1
  ) p
  where s.email='programdirector@emanoninstitute.org'
    and s.role_code='program_director' and s.status='active'
    and o.organization_code='EMANON-INSTITUTE'
  on conflict (auth_user_id,entity_id) do update
    set status='active',updated_at=now();

  if not exists (
    select 1 from public.organization_portal_profiles p
    join public.emanon_staff_members s on s.user_id=p.auth_user_id
    where s.email='programdirector@emanoninstitute.org'
      and p.profile_code='EMANON-001' and p.status='active'
  ) then raise exception 'Emanon portal attachment failed'; end if;
end $$;
