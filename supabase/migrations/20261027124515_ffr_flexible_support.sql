begin;
alter table public.epew_independent_support_plans
  add column selected_entrepreneur_id uuid references public.entrepreneurs(id);
create index on public.epew_independent_support_plans(selected_entrepreneur_id);
alter table public.epew_independent_support_plans drop constraint epew_independent_support_plans_frequency_check;
alter table public.epew_independent_support_plans drop constraint epew_independent_support_plans_check;
alter table public.epew_independent_support_plans add constraint epew_support_plan_terms_check check (
 (frequency='one-time' and units=0 and base_cents>=50000)
 or (frequency='weekly' and units>=1 and base_cents=units*10000)
 or (frequency='monthly' and units>=1 and base_cents=units*(case when selected_entrepreneur_id is null then 40000 else 43334 end))
);
-- Keep selected cash contributions on their chosen business; never redirect them.
create or replace function public.epew_allocate_independent_payments() returns integer
language plpgsql security invoker set search_path=public as $$
declare v_payment record; v_business record; v_count integer := 0;
begin
 for v_payment in
   select p.*,s.selected_entrepreneur_id from public.epew_independent_support_payments p
   join public.epew_independent_support_plans s on s.id=p.plan_id
   where p.entrepreneur_id is null order by p.paid_at limit 100 for update of p skip locked
 loop
   select e.id,e.business_name into v_business from public.entrepreneurs e
   where e.qualified is true and e.marketplace_visibility is true and e.campaign_status='Campaign Active'
   and (v_payment.selected_entrepreneur_id is null or e.id=v_payment.selected_entrepreneur_id)
   order by (select coalesce(sum(p.amount_cents),0) from public.epew_independent_support_payments p where p.entrepreneur_id=e.id), e.created_at,e.id limit 1;
   if v_business.id is null then continue; end if;
   update public.epew_independent_support_payments set entrepreneur_id=v_business.id,business_name=v_business.business_name,allocated_at=now() where id=v_payment.id;
   update public.supporter_transactions set entrepreneur_id=v_business.id,selection_method=case when v_payment.selected_entrepreneur_id is null then 'epew_selected' else 'self_selected' end,updated_at=now() where id=v_payment.transaction_id;
   v_count := v_count+1;
 end loop;
 return v_count;
end $$;
revoke all on function public.epew_allocate_independent_payments() from public,anon,authenticated;
grant execute on function public.epew_allocate_independent_payments() to service_role;
commit;
