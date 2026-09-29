begin;
create table public.epew_independent_support_plans (
 id uuid primary key default gen_random_uuid(),
 supporter_id uuid not null references public.supporters(id),
 frequency text not null check (frequency in ('one-time','weekly','monthly')),
 units integer not null check (units between 0 and 20),
 base_cents bigint not null check (base_cents > 0),
 additional_cents bigint not null default 0 check (additional_cents >= 0),
 status text not null default 'pending' check (status in ('pending','active','completed','cancelled','past_due')),
 stripe_session_id text unique,
 stripe_subscription_id text unique,
 stripe_customer_id text,
 last_checked_at timestamptz,
 created_at timestamptz not null default now(),
 check ((frequency='one-time' and units=0 and base_cents>=50000) or (frequency='weekly' and units>=1 and base_cents=units*10000) or (frequency='monthly' and units>=1 and base_cents=units*40000)),
 check (base_cents+additional_cents<=99999999)
);
create table public.epew_independent_support_payments (
 id uuid primary key default gen_random_uuid(),
 plan_id uuid not null references public.epew_independent_support_plans(id),
 payment_key text not null unique,
 transaction_id uuid not null unique references public.supporter_transactions(id),
 initial_payment boolean not null,
 amount_cents bigint not null check (amount_cents>0),
 additional_cents bigint not null check (additional_cents>=0),
 entrepreneur_id uuid references public.entrepreneurs(id),
 business_name text,
 allocated_at timestamptz,
 paid_at timestamptz not null default now()
);
create unique index on public.epew_independent_support_payments(plan_id) where initial_payment;
create index on public.epew_independent_support_plans(supporter_id);
create index on public.epew_independent_support_payments(plan_id);
alter table public.epew_independent_support_plans enable row level security;
alter table public.epew_independent_support_payments enable row level security;
revoke all on public.epew_independent_support_plans,public.epew_independent_support_payments from anon,authenticated;
grant all on public.epew_independent_support_plans,public.epew_independent_support_payments to service_role;

-- One transaction creates both the payment receipt and the existing financial ledger entry.
-- Invoice IDs are shared by checkout and renewal events to prevent duplicate credit.
create function public.epew_record_independent_payment(p_plan uuid,p_key text,p_amount bigint,p_initial boolean,p_customer text,p_subscription text default null,p_session text default null,p_invoice text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_plan public.epew_independent_support_plans; v_id uuid; v_transaction uuid; v_extra bigint;
begin
 select * into strict v_plan from public.epew_independent_support_plans where id=p_plan for update;
 select id into v_id from public.epew_independent_support_payments where payment_key=p_key and plan_id=p_plan;
 if v_id is not null then return v_id; end if;
 if (v_plan.frequency='one-time' and (not p_initial or p_subscription is not null)) or (v_plan.frequency<>'one-time' and p_subscription is null) then raise exception 'Invalid payment kind'; end if;
 if v_plan.stripe_subscription_id is not null and v_plan.stripe_subscription_id is distinct from p_subscription then raise exception 'Subscription mismatch'; end if;
 if v_plan.stripe_customer_id is not null and v_plan.stripe_customer_id is distinct from p_customer then raise exception 'Customer mismatch'; end if;
 if p_initial and exists(select 1 from public.epew_independent_support_payments where plan_id=p_plan and initial_payment) then raise exception 'Initial payment already recorded'; end if;
 v_extra := case when p_initial then v_plan.additional_cents else 0 end;
 if p_amount <> v_plan.base_cents+v_extra then raise exception 'Payment amount mismatch'; end if;
 insert into public.supporter_transactions(supporter_id,amount,units,frequency,payment_type,status,stripe_checkout_session_id,stripe_invoice_id,stripe_customer_id,stripe_subscription_id,selection_method)
 values(v_plan.supporter_id,p_amount/100.0,0,v_plan.frequency,case when v_plan.frequency='one-time' then 'one-time' else 'subscription' end,'paid',p_session,p_invoice,p_customer,p_subscription,'epew_selected') returning id into v_transaction;
 insert into public.epew_independent_support_payments(plan_id,payment_key,transaction_id,amount_cents,additional_cents,initial_payment)
 values(p_plan,p_key,v_transaction,p_amount,v_extra,p_initial) returning id into v_id;
 update public.epew_independent_support_plans set status=case when status='cancelled' then status when frequency='one-time' then 'completed' else 'active' end,stripe_customer_id=p_customer,stripe_subscription_id=p_subscription where id=p_plan;
 return v_id;
end $$;
revoke all on function public.epew_record_independent_payment(uuid,text,bigint,boolean,text,text,text,text) from public,anon,authenticated;
grant execute on function public.epew_record_independent_payment(uuid,text,bigint,boolean,text,text,text,text) to service_role;

-- Match paid cash contributions only to campaigns already authorized to accept support.
create function public.epew_allocate_independent_payments() returns integer language plpgsql security invoker set search_path=public as $$
declare v_payment record; v_business record; v_count integer := 0;
begin
 for v_payment in select * from public.epew_independent_support_payments where entrepreneur_id is null order by paid_at limit 100 for update skip locked loop
   select e.id,e.business_name into v_business from public.entrepreneurs e
   where e.qualified is true and e.marketplace_visibility is true and e.campaign_status='Campaign Active'
   order by (select coalesce(sum(p.amount_cents),0) from public.epew_independent_support_payments p where p.entrepreneur_id=e.id), e.created_at,e.id limit 1;
   if v_business.id is null then exit; end if;
   update public.epew_independent_support_payments set entrepreneur_id=v_business.id,business_name=v_business.business_name,allocated_at=now() where id=v_payment.id;
   update public.supporter_transactions set entrepreneur_id=v_business.id,updated_at=now() where id=v_payment.transaction_id;
   v_count := v_count+1;
 end loop;
 return v_count;
end $$;
revoke all on function public.epew_allocate_independent_payments() from public,anon,authenticated;
grant execute on function public.epew_allocate_independent_payments() to service_role;
create table public.epew_whatsapp_interviews (
 application_id bigint primary key references public.entrepreneur_applications(id),
 phone text not null unique check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 token_hash text unique,
 token_expires_at timestamptz,
 verified_at timestamptz,
 choosing_language boolean not null default true,
 locked_until timestamptz,
 lock_token uuid,
 created_at timestamptz not null default now()
);
create table public.epew_whatsapp_interview_messages (
 message_sid text primary key,
 application_id bigint not null references public.entrepreneur_applications(id),
 status text not null default 'processing' check(status in ('processing','ready','sent','failed')),
 reply text,
 created_at timestamptz not null default now()
);
alter table public.epew_whatsapp_interviews enable row level security;
alter table public.epew_whatsapp_interview_messages enable row level security;
revoke all on public.epew_whatsapp_interviews,public.epew_whatsapp_interview_messages from anon,authenticated;
grant all on public.epew_whatsapp_interviews,public.epew_whatsapp_interview_messages to service_role;
-- Commit the answer, interview progress and prepared reply atomically before sending.
create function public.epew_save_whatsapp_turn(p_application bigint,p_message text,p_state jsonb,p_reply text,p_choosing boolean,p_complete boolean,p_lock uuid)
returns void language plpgsql security invoker set search_path=public as $$
begin
 perform 1 from public.epew_whatsapp_interviews where application_id=p_application and lock_token=p_lock and locked_until>now() for update;
 if not found then raise exception 'Interview lock expired'; end if;
 update public.entrepreneur_applications set interview_notes=p_state::text,interview_type='whatsapp',
 interview_status=case when p_complete then 'Completed' else 'In Progress' end,
 review_status=case when p_complete then 'Interview Completed' else 'Interview In Progress' end,
 qualification_status=case when p_complete then 'Pending Review' else qualification_status end,
 application_decision=case when p_complete then 'Pending' else application_decision end,
 commitment_score=coalesce((p_state->'scores'->>'commitment')::integer,commitment_score),
 organization_score=coalesce((p_state->'scores'->>'organization')::integer,organization_score),
 communication_score=coalesce((p_state->'scores'->>'communication')::integer,communication_score),
 leadership_score=coalesce((p_state->'scores'->>'leadership')::integer,leadership_score),
 business_potential_score=coalesce((p_state->'scores'->>'business_potential')::integer,business_potential_score),
 readiness_score=coalesce((p_state->'scores'->>'readiness')::integer,readiness_score)
 where id=p_application;
 update public.epew_whatsapp_interview_messages set status='ready',reply=p_reply where message_sid=p_message and application_id=p_application;
 if not found then raise exception 'Missing message'; end if;
 update public.epew_whatsapp_interviews set choosing_language=p_choosing where application_id=p_application;
end $$;
revoke all on function public.epew_save_whatsapp_turn(bigint,text,jsonb,text,boolean,boolean,uuid) from public,anon,authenticated;
grant execute on function public.epew_save_whatsapp_turn(bigint,text,jsonb,text,boolean,boolean,uuid) to service_role;
commit;
