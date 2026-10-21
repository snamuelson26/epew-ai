-- Private applicant assistance. A case and its portal alerts commit together.
create table public.epew_applicant_help_cases (
 id uuid primary key default gen_random_uuid(),
 application_id bigint not null references public.entrepreneur_applications(id),
 applicant_user_id uuid not null references auth.users(id),
 request_key uuid not null,
 category text not null check (category in ('access','questionnaire','documents','interview','coach','financial','language','other')),
 description text not null check (length(description) between 10 and 3000),
 help_needed text not null check (length(help_needed) between 5 and 1500),
 locale text not null check (locale in ('en','ht','fr','es')),
 responsible_team text not null check (responsible_team in ('technical','finance','program')),
 status text not null default 'open' check (status in ('open','in_progress','waiting_on_applicant','resolved')),
 next_action text,
 response_due_at timestamptz not null default now()+interval '24 hours',
 first_staff_reply_at timestamptz,
 resolved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(applicant_user_id,request_key)
);
create index on public.epew_applicant_help_cases(application_id,updated_at desc);
create index on public.epew_applicant_help_cases(status,response_due_at);
create table public.epew_applicant_help_events (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.epew_applicant_help_cases(id),
 actor_user_id uuid not null references auth.users(id),
 actor_kind text not null check(actor_kind in ('applicant','staff')),
 body text not null check(length(body) between 1 and 5000),
 status text not null,
 created_at timestamptz not null default now()
);
create index on public.epew_applicant_help_events(case_id,created_at);
-- Portal notifications, not assertions of email/SMS/WhatsApp delivery.
create table public.epew_applicant_help_alerts (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.epew_applicant_help_events(id),
 audience text not null check(audience in ('administration','coach','applicant')),
 recipient_user_id uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index on public.epew_applicant_help_alerts(recipient_user_id,created_at desc);
alter table public.epew_applicant_help_cases enable row level security;
alter table public.epew_applicant_help_events enable row level security;
alter table public.epew_applicant_help_alerts enable row level security;
revoke all on public.epew_applicant_help_cases,public.epew_applicant_help_events,public.epew_applicant_help_alerts from public,anon,authenticated;
grant select,insert,update on public.epew_applicant_help_cases,public.epew_applicant_help_events,public.epew_applicant_help_alerts to service_role;

create function public.epew_applicant_help_staff(p_actor uuid,p_application bigint)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.user_roles r join auth.users u on u.id=p_actor
  where u.email_confirmed_at is not null and r.role='administrator'
  and (r.user_id=p_actor or (r.user_id is null and lower(r.email)=lower(u.email))))
 or exists(select 1 from public.coach_assignments a
  join public.epew_coach_agent_accounts ca on ca.coach_id=a.coach_id
  join public.epew_coaches c on c.id=ca.coach_id
  join auth.users u on u.id=ca.user_id and lower(u.email)=lower(c.email)
  where a.application_id=p_application and a.ended_at is null
  and a.assignment_status in ('assigned','accepted','active')
  and ca.user_id=p_actor and ca.active and u.email_confirmed_at is not null
  and c.status in ('available','busy','away'));
$$;
revoke all on function public.epew_applicant_help_staff(uuid,bigint) from public,anon,authenticated;
grant execute on function public.epew_applicant_help_staff(uuid,bigint) to service_role;

create function public.epew_applicant_help_operation(p_actor uuid,p_action text,p_input jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 u auth.users; a public.entrepreneur_applications; c public.epew_applicant_help_cases;
 event_id uuid; staff boolean; body text; wanted_status text; case_rows jsonb; app_rows jsonb;
begin
 select * into u from auth.users where id=p_actor and email_confirmed_at is not null;
 if not found then raise exception 'Verified login required' using errcode='42501'; end if;
 if p_action in ('list','staff_list') then
  if p_action='staff_list' and not exists(select 1 from public.entrepreneur_applications ea where public.epew_applicant_help_staff(p_actor,ea.id)) then
   raise exception 'Staff access required' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',ea.id,'business_name',ea.business_name,'full_name',ea.full_name) order by ea.id),'[]') into app_rows
  from public.entrepreneur_applications ea where
   (p_action='list' and (ea.user_id::text=p_actor::text or (ea.user_id is null and lower(trim(ea.email))=lower(u.email))))
   or (p_action='staff_list' and public.epew_applicant_help_staff(p_actor,ea.id));
  select coalesce(jsonb_agg(x.row order by x.updated_at desc),'[]') into case_rows from (
   select h.updated_at,to_jsonb(h)-'request_key'-'applicant_user_id' || jsonb_build_object(
    'applicant_name',ea.full_name,'business_name',ea.business_name,
    'overdue',h.status<>'resolved' and h.response_due_at<now(),
    'events',(select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'actor_kind',e.actor_kind,'body',e.body,'status',e.status,'created_at',e.created_at) order by e.created_at,e.id),'[]') from public.epew_applicant_help_events e where e.case_id=h.id)) as row
   from public.epew_applicant_help_cases h join public.entrepreneur_applications ea on ea.id=h.application_id
   where (p_action='list' and h.applicant_user_id=p_actor)
    or (p_action='staff_list' and public.epew_applicant_help_staff(p_actor,h.application_id))
   order by h.updated_at desc limit 200
  ) x;
  return jsonb_build_object('applications',app_rows,'cases',case_rows);
 elsif p_action='create' then
  select * into a from public.entrepreneur_applications where id=(p_input->>'application_id')::bigint
   and (user_id::text=p_actor::text or (user_id is null and lower(trim(email))=lower(u.email)));
  if not found then raise exception 'Application access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('applicant-help:'||p_actor::text,0));
  select * into c from public.epew_applicant_help_cases where applicant_user_id=p_actor and request_key=(p_input->>'request_key')::uuid;
  if found then
   if c.application_id<>a.id or c.category<>coalesce(p_input->>'category','') or c.description<>trim(coalesce(p_input->>'description','')) or c.help_needed<>trim(coalesce(p_input->>'help_needed','')) or c.locale<>coalesce(p_input->>'locale','') then
    raise exception 'Request key already used for another submission' using errcode='22023';
   end if;
   return jsonb_build_object('saved',true,'id',c.id,'duplicate',true);
  end if;
  if (select count(*) from public.epew_applicant_help_cases where applicant_user_id=p_actor and created_at>now()-interval '1 hour')>=5 then
   raise exception 'Please add a reply to an existing request before creating more requests' using errcode='P0001';
  end if;
  insert into public.epew_applicant_help_cases(application_id,applicant_user_id,request_key,category,description,help_needed,locale,responsible_team)
  values(a.id,p_actor,(p_input->>'request_key')::uuid,p_input->>'category',trim(p_input->>'description'),trim(p_input->>'help_needed'),p_input->>'locale',
   case when p_input->>'category'='access' then 'technical' when p_input->>'category'='financial' then 'finance' else 'program' end) returning * into c;
  body:=c.description || E'\n\n' || c.help_needed;
  staff:=false;
 elsif p_action in ('reply','update','reopen') then
  select * into c from public.epew_applicant_help_cases where id=(p_input->>'case_id')::uuid for update;
  if not found then raise exception 'Request unavailable' using errcode='42501'; end if;
  staff:=public.epew_applicant_help_staff(p_actor,c.application_id);
  if c.applicant_user_id<>p_actor and not staff then raise exception 'Request unavailable' using errcode='42501'; end if;
  -- Applicant's own submissions are always applicant actions, even when they are also admin.
  if c.applicant_user_id=p_actor then staff:=false; end if;
  if p_action='update' and not staff then raise exception 'Staff update required' using errcode='42501'; end if;
  if p_action='reopen' and c.applicant_user_id<>p_actor then raise exception 'Applicant action required' using errcode='42501'; end if;
  body:=trim(coalesce(p_input->>'body',''));
  if length(body) not between 1 and 5000 then raise exception 'A reply is required' using errcode='22023'; end if;
  wanted_status:=case when p_action='reopen' then 'open' when p_action='update' then p_input->>'status' else c.status end;
  if wanted_status is null or wanted_status not in ('open','in_progress','waiting_on_applicant','resolved') then raise exception 'Invalid status' using errcode='22023'; end if;
  if p_action='reply' and c.status='resolved' then raise exception 'Reopen this request before replying' using errcode='22023'; end if;
  update public.epew_applicant_help_cases set status=wanted_status,updated_at=now(),
   next_action=case when staff then body else next_action end,
   first_staff_reply_at=case when staff then coalesce(first_staff_reply_at,now()) else first_staff_reply_at end,
   response_due_at=case when staff or p_action='reopen' then now()+interval '24 hours' else response_due_at end,
   resolved_at=case when wanted_status='resolved' then coalesce(resolved_at,now()) else null end
   where id=c.id returning * into c;
 else raise exception 'Unsupported operation' using errcode='22023'; end if;
 insert into public.epew_applicant_help_events(case_id,actor_user_id,actor_kind,body,status)
 values(c.id,p_actor,case when staff then 'staff' else 'applicant' end,body,c.status) returning id into event_id;
 if staff then
  insert into public.epew_applicant_help_alerts(event_id,audience,recipient_user_id) values(event_id,'applicant',c.applicant_user_id);
 else
  -- Always retain an administrative alert, even without an assigned/connected coach.
  insert into public.epew_applicant_help_alerts(event_id,audience) values(event_id,'administration');
  insert into public.epew_applicant_help_alerts(event_id,audience,recipient_user_id)
  select distinct event_id,'coach',ca.user_id from public.coach_assignments ass
   join public.epew_coach_agent_accounts ca on ca.coach_id=ass.coach_id
   join public.epew_coaches ec on ec.id=ca.coach_id
   join auth.users cu on cu.id=ca.user_id and lower(cu.email)=lower(ec.email)
   where ass.application_id=c.application_id and ass.ended_at is null
   and ass.assignment_status in ('assigned','accepted','active') and ca.active and ca.user_id is not null
   and ec.status in ('available','busy','away') and cu.email_confirmed_at is not null;
 end if;
 return jsonb_build_object('saved',true,'id',c.id,'status',c.status,'channel','portal');
end;
$$;
revoke all on function public.epew_applicant_help_operation(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.epew_applicant_help_operation(uuid,text,jsonb) to service_role;
