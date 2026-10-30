-- Samuel Nelson adopted Food Fans Meal Coding Standard, October 30 2026.
-- Registry only: not a POS import, portion approval, recipe approval or reward activation.
create table public.epew_ffr_meal_components (
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 component_code text not null, component_type text not null,
 display_name text not null check(length(trim(display_name))>0), kitchen_name text not null,
 active_status text not null default 'active' check(active_status in ('active','inactive')),
 recipe_id text, allergens jsonb, qualifying_rewards_status text not null default 'pending' check(qualifying_rewards_status in ('pending','eligible','ineligible')),
 production_status text not null default 'pending_validation' check(production_status in ('pending_validation','approved')),
 version integer not null default 1, updated_at timestamptz not null default now(),
 primary key(restaurant_unit_id,component_code),
 check ((component_type='base' and component_code ~ '^[A-Z]$') or (component_type='protein' and component_code ~ '^[1-9][0-9]*$') or (component_type='vegetable' and component_code ~ '^[1-9][0-9]*A$') or (component_type='juice' and component_code ~ '^[1-9][0-9]*J$') or (component_type='sauce' and component_code ~ '^C[1-9][0-9]*$')),
 check(production_status<>'approved' or (recipe_id is not null and allergens is not null))
);
create table public.epew_ffr_meal_definitions (
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 meal_type text not null, display_name text not null, portion_profile text not null,
 included_component_types jsonb, selected_codes jsonb not null default '[]'::jsonb check(jsonb_typeof(selected_codes)='array'),
 portion_quantities jsonb, status text not null default 'draft' check(status in ('draft','approved')),
 notes text not null, version integer not null default 1, updated_at timestamptz not null default now(),
 primary key(restaurant_unit_id,meal_type), check(status<>'approved' or (portion_quantities is not null and included_component_types is not null))
);
create table public.epew_ffr_meal_coding_standards (
 restaurant_unit_id text primary key references public.epew_restaurant_units(restaurant_unit_id),
 standard_name text not null, version integer not null, policy jsonb not null,
 approved_by text not null, approval_reference text not null, updated_at timestamptz not null default now()
);
create table public.epew_ffr_meal_coding_audit (
 id uuid primary key default gen_random_uuid(), table_name text not null, action text not null,
 before_data jsonb, after_data jsonb, reason text not null, actor text not null, created_at timestamptz not null default now()
);
alter table public.epew_ffr_meal_components enable row level security;
alter table public.epew_ffr_meal_definitions enable row level security;
alter table public.epew_ffr_meal_coding_standards enable row level security;
alter table public.epew_ffr_meal_coding_audit enable row level security;
revoke all on public.epew_ffr_meal_components,public.epew_ffr_meal_definitions,public.epew_ffr_meal_coding_standards,public.epew_ffr_meal_coding_audit from public,anon,authenticated;
grant select,insert,update on public.epew_ffr_meal_components,public.epew_ffr_meal_definitions,public.epew_ffr_meal_coding_standards to service_role;
grant select,insert on public.epew_ffr_meal_coding_audit to service_role;
create function public.epew_ffr_meal_code_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare reason text:=current_setting('epew.meal_change_reason',true); actor text:=current_setting('epew.meal_change_actor',true);
begin
 if tg_op='DELETE' then raise exception 'Retain codes and history; mark discontinued components inactive'; end if;
 if tg_table_name='epew_ffr_meal_coding_audit' then raise exception 'Meal coding audit is immutable'; end if;
 if coalesce(trim(reason),'')='' or coalesce(trim(actor),'')='' then raise exception 'Meal coding changes require actor and reason'; end if;
 if tg_op='UPDATE' then
  if new.restaurant_unit_id<>old.restaurant_unit_id then raise exception 'Restaurant identity is immutable'; end if;
  if tg_table_name='epew_ffr_meal_components' then
   if new.component_code<>old.component_code or new.component_type<>old.component_type or new.display_name<>old.display_name then raise exception 'Never reassign a food code; allocate a new code'; end if;
   if old.active_status='inactive' and new.active_status<>'inactive' then raise exception 'Retired codes cannot be reused'; end if;
  end if;
  new.version:=old.version+1;new.updated_at:=now();
 end if;
 insert into public.epew_ffr_meal_coding_audit(table_name,action,before_data,after_data,reason,actor)
 values(tg_table_name,tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new),reason,actor);
 return new;
end $$;
revoke all on function public.epew_ffr_meal_code_guard() from public,anon,authenticated;
create trigger meal_component_guard before insert or update or delete on public.epew_ffr_meal_components for each row execute function public.epew_ffr_meal_code_guard();
create trigger meal_definition_guard before insert or update or delete on public.epew_ffr_meal_definitions for each row execute function public.epew_ffr_meal_code_guard();
create trigger meal_standard_guard before insert or update or delete on public.epew_ffr_meal_coding_standards for each row execute function public.epew_ffr_meal_code_guard();
create trigger meal_audit_guard before update or delete on public.epew_ffr_meal_coding_audit for each row execute function public.epew_ffr_meal_code_guard();
select set_config('epew.meal_change_reason','Samuel adopted the exact 30-code Food Fans Meal Coding Standard; seed official identities and draft meal profiles.',true);
select set_config('epew.meal_change_actor','system:technical-assistant',true);
insert into public.epew_ffr_meal_components(restaurant_unit_id,component_code,component_type,display_name,kitchen_name) values
('FFR-001','A','base','White rice','White rice'),
('FFR-001','B','base','Rice and beans','Rice and beans'),
('FFR-001','C','base','Cornmeal','Cornmeal'),
('FFR-001','D','base','Mushroom rice','Mushroom rice'),
('FFR-001','E','base','Brown rice','Brown rice'),
('FFR-001','F','base','Bulgur','Bulgur'),
('FFR-001','G','base','Quinoa','Quinoa'),
('FFR-001','1','protein','Stewed chicken','Stewed chicken'),
('FFR-001','2','protein','Fried chicken','Fried chicken'),
('FFR-001','3','protein','Jerk chicken','Jerk chicken'),
('FFR-001','4','protein','Beef','Beef'),
('FFR-001','5','protein','Turkey','Turkey'),
('FFR-001','6','protein','Grilled salmon','Grilled salmon'),
('FFR-001','7','protein','Grilled fish','Grilled fish'),
('FFR-001','8','protein','Fried pork','Fried pork'),
('FFR-001','1A','vegetable','Mixed vegetables','Mixed vegetables'),
('FFR-001','2A','vegetable','Vegetable stew','Vegetable stew'),
('FFR-001','3A','vegetable','Garden salad','Garden salad'),
('FFR-001','4A','vegetable','Green plantains','Green plantains'),
('FFR-001','5A','vegetable','Sweet plantains','Sweet plantains'),
('FFR-001','6A','vegetable','Avocado','Avocado'),
('FFR-001','1J','juice','Carrot','Carrot'),
('FFR-001','2J','juice','Beet-ginger','Beet-ginger'),
('FFR-001','3J','juice','Green juice','Green juice'),
('FFR-001','4J','juice','Orange-carrot-ginger','Orange-carrot-ginger'),
('FFR-001','5J','juice','Passion fruit','Passion fruit'),
('FFR-001','C1','sauce','Bean sauce','Bean sauce'),
('FFR-001','C2','sauce','Mango-ginger','Mango-ginger'),
('FFR-001','C3','sauce','Lemon-herb','Lemon-herb'),
('FFR-001','C4','sauce','House sauce','House sauce');
insert into public.epew_ffr_meal_coding_standards values ('FFR-001','Food Fans Meal Coding Standard',1,'{"principle": "The meal label sets the portions and inclusions; the codes identify the food.", "customer_display": "Show full food names; customers are not required to know codes.", "code_reuse": "Never reuse retired codes. Mark inactive and retain audit history.", "reserved_ranges": {"base": "H-Z", "protein": "9-99", "vegetable": "7A-99A", "juice": "6J-99J", "sauce": "C5-C99"}, "reserved_status": "Unassigned; allocation requires a new approved component, not an active food.", "code_scope": "Food Fans shared standard; restaurant_unit_id remains separate.", "legacy_menu": "Earlier numbered dish/base/extra codes are legacy references, not these component identities. Do not automatically remap.", "pos_status": "Not connected or imported.", "portion_status": "Numeric quantities and inclusion rules require kitchen approval; no automatic scaling yet.", "example": {"internal": "Combo: B + 3 + 1A + C2 + 5J", "customer": "Rice and beans + jerk chicken + mixed vegetables + mango-ginger sauce + passion fruit drink.", "status": "Illustration only; not a priced approved menu item."}}'::jsonb,'Samuel Nelson','Explicit adoption and instruction to enter into EPEW in ChatGPT, October 30 2026',now());
insert into public.epew_ffr_meal_definitions(restaurant_unit_id,meal_type,display_name,portion_profile,notes) values ('FFR-001','family_4','Family 4','family_4','Profile identity approved; quantities, included types, default selections and prices pending. Empty selected_codes means no defaults approved.');
insert into public.epew_ffr_meal_definitions(restaurant_unit_id,meal_type,display_name,portion_profile,notes) values ('FFR-001','kids','Kids','kids','Profile identity approved; quantities, included types, default selections and prices pending. Empty selected_codes means no defaults approved.');
insert into public.epew_ffr_meal_definitions(restaurant_unit_id,meal_type,display_name,portion_profile,notes) values ('FFR-001','combo','Combo','combo_standard','Profile identity approved; quantities, included types, default selections and prices pending. Empty selected_codes means no defaults approved.');
with inserted as (
 insert into public.epew_ffr_network_records(restaurant_unit_id,kind,record_key,version,data)
 select restaurant_unit_id,'menu','COMP-'||component_code,1,jsonb_build_object(
 'menu_item_id','COMP-'||component_code,'recipe_id',null,'category','Coding standard / '||component_type,
 'name',component_code||' — '||display_name,'description','Official component identity. Meal type controls portions. Recipe, allergens, portions and reward eligibility pending. Canonical record: epew_ffr_meal_components. Legacy menu numbers are separate.',
 'active',false,'signature_item',false,'meal_periods',null,'pickup',false,'delivery',false,'qualifying_rewards_meal',false,
 'vegan',false,'vegetarian',false,'allergens','Unknown — review pending; false dietary/reward flags mean not verified, not a determination.','pos_item_id',null,'kitchen_station',null,'version','meal-coding-standard-v1')
 from public.epew_ffr_meal_components where restaurant_unit_id='FFR-001'
 returning *
)
insert into public.epew_ffr_network_revisions(restaurant_unit_id,kind,record_key,version,previous_data,data,reason,actor_user_id,actor_email,request_id,request_input)
select restaurant_unit_id,kind,record_key,version,null,data,'Samuel adopted official component codes; internal preparation records only.',null,'system:technical-assistant',gen_random_uuid(),jsonb_build_object('source','meal-coding-standard-v1') from inserted;
-- Registry snapshots are read-only here; update the audited canonical registry first.
create function public.epew_ffr_protect_component_snapshot() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if old.kind='menu' and old.record_key like 'COMP-%' and exists(select 1 from public.epew_ffr_meal_components where restaurant_unit_id=old.restaurant_unit_id and 'COMP-'||component_code=old.record_key) then
 raise exception 'Official component snapshots are read-only. Update the audited meal coding registry; do not overwrite through the legacy menu editor.';
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
revoke all on function public.epew_ffr_protect_component_snapshot() from public,anon,authenticated;
create trigger protect_meal_component_snapshot before update or delete on public.epew_ffr_network_records for each row execute function public.epew_ffr_protect_component_snapshot();
insert into public.epew_operational_history(event_type,event_name,event_description,new_status,actor_type,actor_name,executed_by,recorded_by,reference_type,reference_id,metadata)
values ('ffr_meal_coding_standard_adopted','Food Fans Meal Coding Standard entered','Samuel approved 30 component identities, three draft portion profiles and permanent non-reuse controls. Codes visible as internal preparation rows in Opening menu. Numeric portion automation and Clover integration remain pending.','recorded','technical_assistant','ChatGPT technical assistant','ChatGPT technical assistant','ChatGPT technical assistant','restaurant_unit','FFR-001',jsonb_build_object('components',30,'meal_profiles',3,'pos_imported',false,'prices_approved',false,'portions_approved',false,'canonical_components','epew_ffr_meal_components'));
