-- Launch workstreams and immutable rewards accounting. No POS provider or payment
-- gateway is activated by this migration.
alter table public.epew_restaurant_work_items add column workstream_code text,
 add column start_at timestamptz, add column completed_at timestamptz,
 add column notes text not null default '',
 add column approval_status text not null default 'not_requested' check(approval_status in ('not_requested','pending','approved','rejected')),
 add column blocker text not null default '', add column next_action text not null default '',
 add column created_by_label text,
 alter column created_by_user_id drop not null,
 alter column created_by_email drop not null;
alter table public.epew_restaurant_work_items add constraint ffr_work_dates check(due_at is null or start_at is null or due_at>=start_at);
create unique index ffr_launch_workstream_unique on public.epew_restaurant_work_items(restaurant_unit_id,workstream_code) where workstream_code is not null;
select set_config('epew.change_reason','User-authorized launch workspace: adopt supplied statuses',true),
 set_config('epew.change_executor','ChatGPT technical assistant',true),
 set_config('epew.change_authorization','Samuel Nelson directive 2026-10-30, FFR-001 launch workspace',true);
alter table public.epew_restaurant_work_items drop constraint epew_restaurant_work_items_status_check;
update public.epew_restaurant_work_items set status='not_started' where status='planned';
alter table public.epew_restaurant_work_items alter column status set default 'not_started';
alter table public.epew_restaurant_work_items add constraint epew_restaurant_work_items_status_check check(status in ('not_started','in_progress','waiting','blocked','ready_for_review','approved','completed'));
insert into public.epew_restaurant_work_items
(restaurant_unit_id,workstream_code,title,description,owner_label,next_action,created_by_label)
select 'FFR-001',code,title,'Prepare, verify and submit the '||title||' workstream with evidence for launch approval.',
'Unassigned','Assign a responsible person and confirm scope, dates and evidence.','ChatGPT technical assistant'
from (values ('website','Website'),('menu','Menu'),('recipes','Recipes'),('pos','POS'),('equipment','Equipment'),('packaging','Packaging'),('staffing','Staffing'),('membership','Membership'),('ordering','Ordering'),('delivery','Delivery'),('qr_codes','QR Codes'),('compliance','Compliance'),('marketing','Marketing'),('soft_opening','Soft Opening'),('grand_opening','Grand Opening')) as streams(code,title)
where exists(select 1 from public.epew_restaurant_units where restaurant_unit_id='FFR-001');
create or replace function public.epew_restaurant_work_operation(p_actor uuid,p_actor_email text,p_unit text,p_action text,p_input jsonb)
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
   if p_input->>'status' is null or p_input->>'status' not in ('not_started','in_progress','waiting','blocked','ready_for_review','approved','completed') then
    raise exception using errcode='22023',message='Invalid status'; end if;
   update public.epew_restaurant_work_items set
   status=p_input->>'status',
   owner_label=case when p_input?'owner' then btrim(p_input->>'owner') else owner_label end,
   start_at=case when p_input?'start_at' then nullif(p_input->>'start_at','')::timestamptz else start_at end,
   due_at=case when p_input?'due_at' then nullif(p_input->>'due_at','')::timestamptz else due_at end,
   completed_at=case when p_input->>'status'='completed' then coalesce(completed_at,clock_timestamp()) else null end,
   notes=case when p_input?'notes' then p_input->>'notes' else notes end,
   approval_status=case when p_input?'approval_status' then p_input->>'approval_status' else approval_status end,
   blocker=case when p_input?'blocker' then p_input->>'blocker' else blocker end,
   next_action=case when p_input?'next_action' then p_input->>'next_action' else next_action end
   where id=v_task.id returning * into v_task;
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

create table public.epew_ffr_program_rules (
 version integer primary key,
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 name text not null, slogan text not null, rules jsonb not null,
 effective_at timestamptz not null default now()
);
insert into public.epew_ffr_program_rules values (1,'FFR-001','Food Fans Rewards Membership','Eat • Earn • Participate • Enjoy',
'{"membership_fee_cents":0,"meals_per_reward":25,"qualifying_meal_min_exclusive_cents":1500,"active_member_credits_expire":false,"supersedes":"30-day inactivity expiration of meal credits","earned_reward_valid_hours":72,"online_request_lead_hours":2,"free_coffee":"Benefit retained; frequency and conditions require finalization","orgdh_raffle":"Separate optional $25 ORGDH membership; no raffle eligibility or tickets are granted by free enrollment","raffle_extra_ticket_inactivity_days":30,"raffle_base_ticket_expires_on_inactivity":false,"raffle_drawing":"2027-11-21T17:00:00-05:00","raffle_website":"orgdhgivesback.org","raffle_venue":"TBA","pos_integration":"pending_provider_verification"}'::jsonb,now());
create table public.epew_ffr_members (
 member_id text primary key default ('FFRM-'||replace(gen_random_uuid()::text,'-','')),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 full_name text not null check(length(btrim(full_name)) between 1 and 200),
 mobile_number text not null check(mobile_number ~ '^\+[1-9][0-9]{7,14}$'),
 email text not null check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 zip_code text not null check(zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
 preferred_language text not null check(length(preferred_language) between 2 and 60),
 membership_date timestamptz not null default now(),
 membership_status text not null default 'active' check(membership_status in ('active','inactive','suspended')),
 sms_consent boolean not null default false, email_consent boolean not null default false,
 consent_evidence text not null,
 raffle_opt_in boolean not null default false,
 raffle_eligibility_year integer check(raffle_eligibility_year between 2026 and 2100),
 raffle_eligibility_evidence text,
 created_by_user_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(raffle_eligibility_year is null or (raffle_opt_in and length(btrim(raffle_eligibility_evidence))>0))
);
create index epew_ffr_members_zip_idx on public.epew_ffr_members(restaurant_unit_id,zip_code);
create index epew_ffr_members_mobile_idx on public.epew_ffr_members(mobile_number);
create table public.epew_ffr_orders (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 member_id text not null references public.epew_ffr_members(member_id),
 order_id text not null check(length(btrim(order_id)) between 1 and 200),
 payment_status text not null check(payment_status in ('paid','unpaid','refunded')),
 order_status text not null check(order_status in ('completed','canceled')),
 lines jsonb not null check(jsonb_typeof(lines)='array'),
 qualifying_quantity integer not null check(qualifying_quantity between 0 and 10000),
 reversed_quantity integer not null default 0 check(reversed_quantity>=0 and reversed_quantity<=qualifying_quantity),
 receipt_reference text not null,
 source text not null default 'manager_verified_receipt',
 recorded_by_user_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(restaurant_unit_id,order_id)
);
create index epew_ffr_orders_member_idx on public.epew_ffr_orders(member_id,created_at desc);
create table public.epew_ffr_reward_grants (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 member_id text not null references public.epew_ffr_members(member_id),
 cycle_number integer not null check(cycle_number>0),
 status text not null default 'available' check(status in ('available','redeemed','revoked')),
 earned_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '72 hours'),
 redeemed_at timestamptz, redemption_order_id text,
 online_requested_at timestamptz, fulfillment_at timestamptz, fulfillment_method text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(member_id,cycle_number)
);
create index epew_ffr_reward_grants_available_idx on public.epew_ffr_reward_grants(member_id,status,expires_at);
create table public.epew_ffr_reward_ledger (
 transaction_id uuid primary key default gen_random_uuid(),
 ledger_sequence bigint generated always as identity unique,
 member_id text not null references public.epew_ffr_members(member_id),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 order_id text,
 transaction_date date not null default ((clock_timestamp() at time zone 'America/New_York')::date),
 transaction_type text not null check(transaction_type in ('meal_credit','reward_earned','reward_redeemed','adjustment','refund_reversal')),
 quantity integer not null check(quantity<>0),
 credit_delta integer not null, free_meal_delta integer not null default 0,
 qualifying_meal_delta integer not null default 0,
 balance_before integer not null, balance_after integer not null,
 free_meal_balance_before integer not null, free_meal_balance_after integer not null,
 grant_id uuid references public.epew_ffr_reward_grants(id),
 reason text not null check(length(btrim(reason)) between 1 and 4000),
 recorded_by_user_id uuid not null, recorded_by text not null,
 request_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 check(balance_after=balance_before+credit_delta),
 check(free_meal_balance_after=free_meal_balance_before+free_meal_delta)
);
create index epew_ffr_reward_ledger_member_idx on public.epew_ffr_reward_ledger(member_id,created_at);
create index epew_ffr_reward_ledger_order_idx on public.epew_ffr_reward_ledger(restaurant_unit_id,order_id);
create table public.epew_ffr_reward_requests (
 id uuid primary key default gen_random_uuid(),
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 actor_user_id uuid not null, request_id uuid not null,
 action text not null, input jsonb not null, result jsonb not null,
 created_at timestamptz not null default now(), unique(actor_user_id,request_id)
);

do $$ declare t text; begin
 foreach t in array array['epew_ffr_program_rules','epew_ffr_members','epew_ffr_orders','epew_ffr_reward_grants','epew_ffr_reward_ledger','epew_ffr_reward_requests'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
  execute format('create trigger ffr_audit_insert before insert on public.%I for each row execute function private.epew_audit_restaurant_unit_change()',t);
 end loop;
 foreach t in array array['epew_ffr_program_rules','epew_ffr_reward_ledger','epew_ffr_reward_requests'] loop
  execute format('create trigger ffr_append_only before update or delete or truncate on public.%I for each statement execute function private.epew_protect_restaurant_unit_audit()',t);
 end loop;
 foreach t in array array['epew_ffr_members','epew_ffr_orders','epew_ffr_reward_grants'] loop
  execute format('grant update on public.%I to service_role',t);
  execute format('create trigger ffr_audit_update before update on public.%I for each row execute function private.epew_audit_restaurant_unit_change()',t);
 end loop;
end $$;

grant usage,select on sequence public.epew_ffr_reward_ledger_ledger_sequence_seq to service_role;

create function private.epew_ffr_post_ledger(p_member text,p_unit text,p_order text,p_type text,p_quantity integer,p_credit integer,p_free integer,p_qualifying integer,p_grant uuid,p_reason text,p_actor uuid,p_email text,p_request uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare b integer; f integer; result uuid;
begin
 select coalesce(sum(credit_delta),0)::integer,coalesce(sum(free_meal_delta),0)::integer into b,f from public.epew_ffr_reward_ledger where member_id=p_member;
 insert into public.epew_ffr_reward_ledger(member_id,restaurant_unit_id,order_id,transaction_type,quantity,credit_delta,free_meal_delta,qualifying_meal_delta,balance_before,balance_after,free_meal_balance_before,free_meal_balance_after,grant_id,reason,recorded_by_user_id,recorded_by,request_id)
 values(p_member,p_unit,p_order,p_type,p_quantity,p_credit,p_free,p_qualifying,b,b+p_credit,f,f+p_free,p_grant,p_reason,p_actor,p_email,p_request) returning transaction_id into result;
 return result;
end $$;
revoke all on function private.epew_ffr_post_ledger(text,text,text,text,integer,integer,integer,integer,uuid,text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.epew_ffr_post_ledger(text,text,text,text,integer,integer,integer,integer,uuid,text,uuid,text,uuid) to service_role;

create function public.epew_ffr_rewards_operation(p_actor uuid,p_actor_email text,p_unit text,p_action text,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 request uuid := (p_input->>'request_id')::uuid;
 reason text := btrim(p_input->>'reason');
 member public.epew_ffr_members; ord public.epew_ffr_orders; reward public.epew_ffr_reward_grants;
 prior public.epew_ffr_reward_requests;
 amount integer; credits integer; cycle integer; line jsonb; qty integer;
 result jsonb; requested timestamptz; fulfilled timestamptz;
begin
 if p_actor is null or p_actor_email is null or not exists(select 1 from public.user_roles r where r.role='administrator' and (r.user_id=p_actor or (r.user_id is null and lower(r.email)=lower(p_actor_email)))) then raise exception using errcode='42501',message='Authorized manager required'; end if;
 if request is null or reason is null or length(reason) not between 1 and 4000 or p_unit is null or not exists(select 1 from public.epew_restaurant_units where restaurant_unit_id=p_unit) then raise exception using errcode='22023',message='Invalid request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||request::text,0));
 select * into prior from public.epew_ffr_reward_requests where actor_user_id=p_actor and request_id=request;
 if found then
  if prior.restaurant_unit_id<>p_unit or prior.action<>p_action or prior.input<>p_input then raise exception using errcode='22023',message='Request ID reused with different input'; end if;
  return prior.result||jsonb_build_object('replayed',true);
 end if;
 perform set_config('epew.change_reason',reason,true);
 perform set_config('epew.change_executor','Authorized manager: '||p_actor_email,true);
 perform set_config('epew.change_authorization','Verified administrator session; Food Fans rewards',true);
 perform set_config('epew.actor_user_id',p_actor::text,true);
 if p_action='enroll' then
  insert into public.epew_ffr_members(restaurant_unit_id,full_name,mobile_number,email,zip_code,preferred_language,sms_consent,email_consent,consent_evidence,raffle_opt_in,created_by_user_id)
  values(p_unit,btrim(p_input->>'full_name'),btrim(p_input->>'mobile_number'),lower(btrim(p_input->>'email')),p_input->>'zip_code',p_input->>'preferred_language',coalesce((p_input->>'sms_consent')::boolean,false),coalesce((p_input->>'email_consent')::boolean,false),btrim(p_input->>'consent_evidence'),coalesce((p_input->>'raffle_opt_in')::boolean,false),p_actor)
  returning * into member;
  if length(member.consent_evidence)=0 then raise exception using errcode='22023',message='Consent record required'; end if;
  result:=jsonb_build_object('saved',true,'member_id',member.member_id);
 else
  select * into member from public.epew_ffr_members where member_id=p_input->>'member_id' and restaurant_unit_id=p_unit for update;
  if not found then raise exception using errcode='22023',message='Member not found for restaurant'; end if;
  if member.membership_status<>'active' and p_action not in ('refund_order','update_member') then raise exception using errcode='22023',message='Membership is not active'; end if;
  if p_action='update_member' then
   if (p_input->>'expected_updated_at')::timestamptz is distinct from member.updated_at then raise exception using errcode='40001',message='Member changed; reload'; end if;
   update public.epew_ffr_members set
   full_name=case when p_input?'full_name' then btrim(p_input->>'full_name') else full_name end,
   mobile_number=case when p_input?'mobile_number' then btrim(p_input->>'mobile_number') else mobile_number end,
   email=case when p_input?'email' then lower(btrim(p_input->>'email')) else email end,
   zip_code=case when p_input?'zip_code' then p_input->>'zip_code' else zip_code end,
   preferred_language=case when p_input?'preferred_language' then p_input->>'preferred_language' else preferred_language end,
   membership_status=p_input->>'membership_status',sms_consent=(p_input->>'sms_consent')::boolean,email_consent=(p_input->>'email_consent')::boolean,
   consent_evidence=btrim(p_input->>'consent_evidence'),raffle_opt_in=(p_input->>'raffle_opt_in')::boolean,
   raffle_eligibility_year=nullif(p_input->>'raffle_eligibility_year','')::integer,raffle_eligibility_evidence=nullif(p_input->>'raffle_eligibility_evidence','')
   where member_id=member.member_id;
  elsif p_action='record_order' then
   if jsonb_typeof(p_input->'lines')<>'array' or jsonb_array_length(p_input->'lines') not between 1 and 100 then raise exception using errcode='22023',message='Invalid meal lines'; end if;
   amount:=0;
   for line in select value from jsonb_array_elements(p_input->'lines') loop
    qty:=(line->>'quantity')::integer;
    if qty is null or qty not between 1 and 100 or (line->>'unit_price_cents')::integer is null or (line->>'unit_price_cents')::integer not between 0 and 1000000 or line->>'kind' is null or line->>'kind' not in ('meal','addon') or line->>'is_reward' is null then raise exception using errcode='22023',message='Invalid meal line'; end if;
    if line->>'kind'='meal' and not (line->>'is_reward')::boolean and (line->>'unit_price_cents')::integer>1500 then amount:=amount+qty; end if;
   end loop;
   if p_input->>'payment_status'<>'paid' or p_input->>'order_status'<>'completed' then amount:=0; end if;
   if nullif(btrim(p_input->>'receipt_reference'),'') is null then raise exception using errcode='22023',message='Verified receipt reference required'; end if;
   insert into public.epew_ffr_orders(restaurant_unit_id,member_id,order_id,payment_status,order_status,lines,qualifying_quantity,receipt_reference,recorded_by_user_id)
   values(p_unit,member.member_id,btrim(p_input->>'order_id'),p_input->>'payment_status',p_input->>'order_status',p_input->'lines',amount,btrim(p_input->>'receipt_reference'),p_actor)
   on conflict(restaurant_unit_id,order_id) do nothing returning * into ord;
   if not found then
    select * into ord from public.epew_ffr_orders where restaurant_unit_id=p_unit and order_id=btrim(p_input->>'order_id');
    if ord.member_id<>member.member_id or ord.lines<>p_input->'lines' or ord.payment_status<>p_input->>'payment_status' or ord.order_status<>p_input->>'order_status' then raise exception using errcode='22023',message='Order already recorded with different details'; end if;
    amount:=0;
   end if;
   if amount>0 then perform private.epew_ffr_post_ledger(member.member_id,p_unit,ord.order_id,'meal_credit',amount,amount,0,amount,null,reason,p_actor,p_actor_email,request); end if;
  elsif p_action='refund_order' then
   select * into ord from public.epew_ffr_orders where restaurant_unit_id=p_unit and member_id=member.member_id and order_id=p_input->>'order_id' for update;
   amount:=(p_input->>'quantity')::integer;
   if not found or amount is null or amount<1 or amount>ord.qualifying_quantity-ord.reversed_quantity or nullif(btrim(p_input->>'receipt_reference'),'') is null then raise exception using errcode='22023',message='Invalid refund quantity or proof'; end if;
   update public.epew_ffr_orders set reversed_quantity=reversed_quantity+amount where id=ord.id;
   perform private.epew_ffr_post_ledger(member.member_id,p_unit,ord.order_id,'refund_reversal',-amount,-amount,0,-amount,null,reason||' Refund reference: '||(p_input->>'receipt_reference'),p_actor,p_actor_email,request);
  elsif p_action='adjust' then
   amount:=(p_input->>'quantity')::integer;
   if amount is null or amount=0 or amount not between -100 and 100 then raise exception using errcode='22023',message='Adjustment must be nonzero and within 100 meals'; end if;
   perform private.epew_ffr_post_ledger(member.member_id,p_unit,null,'adjustment',amount,amount,0,amount,null,reason,p_actor,p_actor_email,request);
  elsif p_action='redeem' then
   select * into reward from public.epew_ffr_reward_grants where id=(p_input->>'grant_id')::uuid and member_id=member.member_id and restaurant_unit_id=p_unit for update;
   requested:=(p_input->>'online_requested_at')::timestamptz; fulfilled:=(p_input->>'fulfillment_at')::timestamptz;
   if not found or reward.status<>'available' or requested is null or fulfilled is null or requested<reward.earned_at or requested>reward.expires_at or fulfilled>reward.expires_at or fulfilled>clock_timestamp() or fulfilled<requested+interval '2 hours'
    or p_input->>'fulfillment_method' is null or p_input->>'fulfillment_method' not in ('pickup','delivery') or nullif(btrim(p_input->>'order_id'),'') is null or nullif(btrim(p_input->>'receipt_reference'),'') is null then raise exception using errcode='22023',message='Redemption requires a valid online request, two-hour lead time and completed fulfillment before expiry'; end if;
   update public.epew_ffr_reward_grants set status='redeemed',redeemed_at=fulfilled,redemption_order_id=p_input->>'order_id',online_requested_at=requested,fulfillment_at=fulfilled,fulfillment_method=p_input->>'fulfillment_method' where id=reward.id;
   perform private.epew_ffr_post_ledger(member.member_id,p_unit,p_input->>'order_id','reward_redeemed',-1,0,-1,0,reward.id,reason||' Online order reference: '||(p_input->>'receipt_reference'),p_actor,p_actor_email,request);
  else raise exception using errcode='22023',message='Unknown rewards action'; end if;
  -- Refunds/corrections revoke unused entitlements first. Already-redeemed rewards
  -- create a credit deficit that later purchases repay; no money is charged.
  select coalesce(sum(credit_delta),0)::integer into credits from public.epew_ffr_reward_ledger where member_id=member.member_id;
  while credits<0 loop
   select * into reward from public.epew_ffr_reward_grants where member_id=member.member_id and status='available' order by cycle_number desc limit 1 for update;
   exit when not found;
   update public.epew_ffr_reward_grants set status='revoked' where id=reward.id;
   perform private.epew_ffr_post_ledger(member.member_id,p_unit,p_input->>'order_id','refund_reversal',-1,25,-1,0,reward.id,'Revoke unused reward after refund/adjustment: '||reason,p_actor,p_actor_email,request);
   credits:=credits+25;
  end loop;
  if member.membership_status='active' then
   while credits>=25 loop
    select coalesce(max(cycle_number),0)+1 into cycle from public.epew_ffr_reward_grants where member_id=member.member_id;
    insert into public.epew_ffr_reward_grants(restaurant_unit_id,member_id,cycle_number) values(p_unit,member.member_id,cycle) returning * into reward;
    perform private.epew_ffr_post_ledger(member.member_id,p_unit,p_input->>'order_id','reward_earned',1,-25,1,0,reward.id,'25 qualifying meals completed; cycle '||cycle,p_actor,p_actor_email,request);
    credits:=credits-25;
   end loop;
  end if;
  if (select coalesce(sum(qualifying_meal_delta),0) from public.epew_ffr_reward_ledger where member_id=member.member_id)<0 then
   raise exception using errcode='22023',message='Correction exceeds lifetime qualifying meals';
  end if;
  result:=jsonb_build_object('saved',true,'member_id',member.member_id);
 end if;
 insert into public.epew_ffr_reward_requests(restaurant_unit_id,actor_user_id,request_id,action,input,result) values(p_unit,p_actor,request,p_action,p_input,result);
 return result;
end $$;
revoke all on function public.epew_ffr_rewards_operation(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.epew_ffr_rewards_operation(uuid,text,text,text,jsonb) to service_role;

create view public.epew_ffr_reward_balances with (security_invoker=true) as
select m.member_id,m.restaurant_unit_id,
 coalesce(l.current_credits,0) as current_qualifying_meal_count,
 coalesce(l.lifetime_qualifying,0) as lifetime_qualifying_meals,
 coalesce(g.earned,0) as free_meals_earned,coalesce(g.redeemed,0) as free_meals_redeemed,
 coalesce(g.available,0) as free_meals_currently_available,
 coalesce(g.cycle,0) as reward_cycle_number,
 (select max(o.created_at) from public.epew_ffr_orders o where o.member_id=m.member_id and o.qualifying_quantity>o.reversed_quantity) as last_qualifying_order,
 (select o.order_id from public.epew_ffr_orders o where o.member_id=m.member_id and o.qualifying_quantity>o.reversed_quantity order by o.created_at desc limit 1) as last_qualifying_order_id
from public.epew_ffr_members m
left join lateral(select sum(credit_delta)::integer as current_credits,sum(qualifying_meal_delta)::integer as lifetime_qualifying from public.epew_ffr_reward_ledger where member_id=m.member_id) l on true
left join lateral(select count(*)::integer as earned,count(*) filter(where status='redeemed')::integer as redeemed,
count(*) filter(where status='available' and expires_at>clock_timestamp() and m.membership_status='active')::integer as available,max(cycle_number) as cycle from public.epew_ffr_reward_grants where member_id=m.member_id) g on true;
revoke all on public.epew_ffr_reward_balances from public,anon,authenticated;
grant select on public.epew_ffr_reward_balances to service_role;
comment on table public.epew_ffr_reward_ledger is 'Permanent signed movements. balance_before/after are meal-credit balances; 25 credits are consumed for each earned reward. Negative balances after redeemed-reward refunds are carried forward, never charged. Availability is derived from individual grants, not a mutable counter.';

create view public.epew_ffr_member_geography with (security_invoker=true) as
select restaurant_unit_id,left(zip_code,5) as zip_code,count(*)::integer as member_count,
count(*) filter(where membership_status='active')::integer as active_members
from public.epew_ffr_members group by restaurant_unit_id,left(zip_code,5);
revoke all on public.epew_ffr_member_geography from public,anon,authenticated;
grant select on public.epew_ffr_member_geography to service_role;
