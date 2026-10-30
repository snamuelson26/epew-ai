select set_config('epew.change_reason','Samuel Nelson approved network records and raffle separation',true),set_config('epew.change_executor','ChatGPT technical assistant',true),set_config('epew.change_authorization','User directive sections 7 through 14',true);
-- Separate meal rewards from ORGDH confirmations. No payments, ticket generation or draws.
create table public.epew_ffr_network_records (
 restaurant_unit_id text not null references public.epew_restaurant_units(restaurant_unit_id),
 kind text not null check(kind in ('menu','recipe','website','drawing','raffle','membership','order','location','zip_service','portal_link')),
 record_key text not null check(record_key ~ '^[A-Za-z0-9_.:-]{1,160}$'),
 version integer not null check(version>0), data jsonb not null check(jsonb_typeof(data)='object'),
 updated_at timestamptz not null default clock_timestamp(),
 primary key(restaurant_unit_id,kind,record_key)
);
create table public.epew_ffr_network_revisions (
 id uuid primary key default gen_random_uuid(),restaurant_unit_id text not null,kind text not null,record_key text not null,
 version integer not null,previous_data jsonb,data jsonb not null,reason text not null,
 actor_user_id uuid,actor_email text not null,request_id uuid not null,request_input jsonb not null,
 created_at timestamptz not null default clock_timestamp(),unique(actor_user_id,request_id),unique(restaurant_unit_id,kind,record_key,version)
);
create unique index ffr_one_portal_account on public.epew_ffr_network_records ((data->>'auth_user_id')) where kind='portal_link';
create unique index ffr_one_member_portal on public.epew_ffr_network_records ((data->>'member_id')) where kind='portal_link';
create index ffr_network_member_lookup on public.epew_ffr_network_records ((data->>'member_id'),kind);
create index ffr_network_revisions_unit on public.epew_ffr_network_revisions(restaurant_unit_id,created_at desc);
alter table public.epew_ffr_network_records enable row level security;
alter table public.epew_ffr_network_revisions enable row level security;
revoke all on public.epew_ffr_network_records,public.epew_ffr_network_revisions from public,anon,authenticated;
grant select,insert,update on public.epew_ffr_network_records to service_role;
grant select,insert on public.epew_ffr_network_revisions to service_role;
create trigger ffr_network_history_immutable before update or delete or truncate on public.epew_ffr_network_revisions for each statement execute function private.epew_protect_restaurant_unit_audit();
create function public.epew_ffr_network_save(p_actor uuid,p_actor_email text,p_unit text,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text:=p_input->>'kind'; rk text:=p_input->>'record_key'; d jsonb:=p_input->'data';
 old public.epew_ffr_network_records; rev public.epew_ffr_network_revisions; req uuid:=(p_input->>'request_id')::uuid;
 expected integer:=(p_input->>'expected_version')::integer; required text[]; allowed text[]; field text; drawing jsonb; tier jsonb; location_state text; member public.epew_ffr_members;
 start_time timestamptz; end_time timestamptz;
begin
 if p_actor is null or p_actor_email is null or not exists(select 1 from public.user_roles where role='administrator' and (user_id=p_actor or (user_id is null and lower(email)=lower(p_actor_email)))) then raise exception using errcode='42501',message='Administrator required';end if;
 if req is null or expected is null or expected<0 or coalesce(length(btrim(p_input->>'reason')),0) not between 1 and 4000 or d is null or jsonb_typeof(d)<>'object' then raise exception using errcode='22023',message='Invalid record';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||req::text,0));
 select * into rev from public.epew_ffr_network_revisions where actor_user_id=p_actor and request_id=req;
 if found then
  if rev.restaurant_unit_id<>p_unit or rev.request_input<>p_input then raise exception using errcode='22023',message='Request already used';end if;
  return jsonb_build_object('saved',true,'version',rev.version,'replayed',true);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_unit||k||rk,0));
 select * into old from public.epew_ffr_network_records where restaurant_unit_id=p_unit and kind=k and record_key=rk for update;
 if coalesce(old.version,0)<>expected then raise exception using errcode='40001',message='Record changed; reload';end if;
 case k
 when 'menu' then required:=array['menu_item_id','name','version']::text[];allowed:=array['menu_item_id','recipe_id','category','name','description','active','signature_item','meal_periods','pickup','delivery','qualifying_rewards_meal','vegan','vegetarian','allergens','pos_item_id','kitchen_station','version']::text[];
 when 'recipe' then required:=array['recipe_id','version','approval_status']::text[];allowed:=array['recipe_id','menu_item_id','ingredients','batch_quantity','batch_yield','preparation_method','portion','holding_method','cooking_temperature','packaging','modifiers','allergens','kitchen_station','version','approval_status','approved_by','approval_date']::text[];
 when 'website' then required:=array['work_id']::text[];allowed:=array['work_id','github_pr','branch','commit','review_status','staging_deployment','staging_qa','mobile_qa','desktop_qa','language_qa','samuel_approval','production_deployment']::text[];
 when 'drawing' then required:=array['drawing_id','raffle_year','draw_at','rules_reference']::text[];allowed:=array['rules_approved','drawing_id','raffle_year','draw_at','rules_reference','venue','notes']::text[];
 when 'raffle' then required:=array['member_id','drawing_id','raffle_year']::text[];allowed:=array['member_id','drawing_id','raffle_year','eligible','opted_in','entry_confirmed','date_entered','orgdh_reference_id','confirmed_ticket_count','notes']::text[];
 when 'membership' then required:=array['member_id','level','starts_at','expires_at','payment_reference']::text[];allowed:=array['member_id','level','state_code','starts_at','expires_at','payment_reference','notes']::text[];
 when 'order' then required:=array['order_id','channel','ordered_at','qualifying_meal_quantity','order_status','verification_reference']::text[];allowed:=array['order_id','member_id','channel','ordered_at','qualifying_meal_quantity','reward_used','order_status','pos_order_reference','marketplace_order_reference','verification_reference']::text[];
 when 'location' then required:=array['state_code','country_code','evidence']::text[];allowed:=array['state_code','country_code','latitude','longitude','operating','evidence']::text[];
 when 'zip_service' then required:=array['zip_code','served','expansion_flag','evidence']::text[];allowed:=array['zip_code','nearest_location','served','expansion_flag','evidence']::text[];
 when 'portal_link' then required:=array['member_id','auth_user_id','identity_evidence']::text[];allowed:=array['member_id','auth_user_id','identity_evidence']::text[];
 else raise exception using errcode='22023',message='Invalid record kind';end case;
 if exists(select 1 from jsonb_object_keys(d) as keys(key) where not(key=any(allowed))) then raise exception using errcode='22023',message='Unknown field';end if;
 foreach field in array required loop if coalesce(length(btrim(d->>field)),0)=0 then raise exception using errcode='22023',message='Missing required field';end if;end loop;

 case k
 when 'menu' then
  if d->'menu_item_id'<>'null'::jsonb and jsonb_typeof(d->'menu_item_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'recipe_id'<>'null'::jsonb and jsonb_typeof(d->'recipe_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'category'<>'null'::jsonb and jsonb_typeof(d->'category')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'name'<>'null'::jsonb and jsonb_typeof(d->'name')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'description'<>'null'::jsonb and jsonb_typeof(d->'description')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if jsonb_typeof(d->'active') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'signature_item') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if d->'meal_periods'<>'null'::jsonb and jsonb_typeof(d->'meal_periods')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if jsonb_typeof(d->'pickup') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'delivery') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'qualifying_rewards_meal') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'vegan') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'vegetarian') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if d->'allergens'<>'null'::jsonb and jsonb_typeof(d->'allergens')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'pos_item_id'<>'null'::jsonb and jsonb_typeof(d->'pos_item_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'kitchen_station'<>'null'::jsonb and jsonb_typeof(d->'kitchen_station')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'version'<>'null'::jsonb and jsonb_typeof(d->'version')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'recipe' then
  if d->'recipe_id'<>'null'::jsonb and jsonb_typeof(d->'recipe_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'menu_item_id'<>'null'::jsonb and jsonb_typeof(d->'menu_item_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'ingredients'<>'null'::jsonb and jsonb_typeof(d->'ingredients')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'batch_quantity'<>'null'::jsonb and jsonb_typeof(d->'batch_quantity')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'batch_yield'<>'null'::jsonb and jsonb_typeof(d->'batch_yield')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'preparation_method'<>'null'::jsonb and jsonb_typeof(d->'preparation_method')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'portion'<>'null'::jsonb and jsonb_typeof(d->'portion')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'holding_method'<>'null'::jsonb and jsonb_typeof(d->'holding_method')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'cooking_temperature'<>'null'::jsonb and jsonb_typeof(d->'cooking_temperature')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'packaging'<>'null'::jsonb and jsonb_typeof(d->'packaging')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'modifiers'<>'null'::jsonb and jsonb_typeof(d->'modifiers')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'allergens'<>'null'::jsonb and jsonb_typeof(d->'allergens')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'kitchen_station'<>'null'::jsonb and jsonb_typeof(d->'kitchen_station')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'version'<>'null'::jsonb and jsonb_typeof(d->'version')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'approval_status'<>'null'::jsonb and jsonb_typeof(d->'approval_status')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'approved_by'<>'null'::jsonb and jsonb_typeof(d->'approved_by')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'approval_date'<>'null'::jsonb and jsonb_typeof(d->'approval_date')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'website' then
  if d->'work_id'<>'null'::jsonb and jsonb_typeof(d->'work_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'github_pr'<>'null'::jsonb and jsonb_typeof(d->'github_pr')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'branch'<>'null'::jsonb and jsonb_typeof(d->'branch')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'commit'<>'null'::jsonb and jsonb_typeof(d->'commit')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'review_status'<>'null'::jsonb and jsonb_typeof(d->'review_status')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'staging_deployment'<>'null'::jsonb and jsonb_typeof(d->'staging_deployment')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'staging_qa'<>'null'::jsonb and jsonb_typeof(d->'staging_qa')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'mobile_qa'<>'null'::jsonb and jsonb_typeof(d->'mobile_qa')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'desktop_qa'<>'null'::jsonb and jsonb_typeof(d->'desktop_qa')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'language_qa'<>'null'::jsonb and jsonb_typeof(d->'language_qa')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'samuel_approval'<>'null'::jsonb and jsonb_typeof(d->'samuel_approval')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'production_deployment'<>'null'::jsonb and jsonb_typeof(d->'production_deployment')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'drawing' then
  if d->'drawing_id'<>'null'::jsonb and jsonb_typeof(d->'drawing_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'raffle_year'<>'null'::jsonb and jsonb_typeof(d->'raffle_year')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if d->'draw_at'<>'null'::jsonb and jsonb_typeof(d->'draw_at')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'rules_reference'<>'null'::jsonb and jsonb_typeof(d->'rules_reference')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'venue'<>'null'::jsonb and jsonb_typeof(d->'venue')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'notes'<>'null'::jsonb and jsonb_typeof(d->'notes')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'raffle' then
  if d->'member_id'<>'null'::jsonb and jsonb_typeof(d->'member_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'drawing_id'<>'null'::jsonb and jsonb_typeof(d->'drawing_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'raffle_year'<>'null'::jsonb and jsonb_typeof(d->'raffle_year')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if jsonb_typeof(d->'eligible') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'opted_in') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if jsonb_typeof(d->'entry_confirmed') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if d->'date_entered'<>'null'::jsonb and jsonb_typeof(d->'date_entered')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'orgdh_reference_id'<>'null'::jsonb and jsonb_typeof(d->'orgdh_reference_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'confirmed_ticket_count'<>'null'::jsonb and jsonb_typeof(d->'confirmed_ticket_count')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if d->'notes'<>'null'::jsonb and jsonb_typeof(d->'notes')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'membership' then
  if d->'member_id'<>'null'::jsonb and jsonb_typeof(d->'member_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'level'<>'null'::jsonb and jsonb_typeof(d->'level')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'state_code'<>'null'::jsonb and jsonb_typeof(d->'state_code')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'starts_at'<>'null'::jsonb and jsonb_typeof(d->'starts_at')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'expires_at'<>'null'::jsonb and jsonb_typeof(d->'expires_at')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'payment_reference'<>'null'::jsonb and jsonb_typeof(d->'payment_reference')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'notes'<>'null'::jsonb and jsonb_typeof(d->'notes')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'order' then
  if d->'order_id'<>'null'::jsonb and jsonb_typeof(d->'order_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'member_id'<>'null'::jsonb and jsonb_typeof(d->'member_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'channel'<>'null'::jsonb and jsonb_typeof(d->'channel')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'ordered_at'<>'null'::jsonb and jsonb_typeof(d->'ordered_at')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'qualifying_meal_quantity'<>'null'::jsonb and jsonb_typeof(d->'qualifying_meal_quantity')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if jsonb_typeof(d->'reward_used') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if d->'order_status'<>'null'::jsonb and jsonb_typeof(d->'order_status')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'pos_order_reference'<>'null'::jsonb and jsonb_typeof(d->'pos_order_reference')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'marketplace_order_reference'<>'null'::jsonb and jsonb_typeof(d->'marketplace_order_reference')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'verification_reference'<>'null'::jsonb and jsonb_typeof(d->'verification_reference')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'location' then
  if d->'state_code'<>'null'::jsonb and jsonb_typeof(d->'state_code')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'country_code'<>'null'::jsonb and jsonb_typeof(d->'country_code')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'latitude'<>'null'::jsonb and jsonb_typeof(d->'latitude')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if d->'longitude'<>'null'::jsonb and jsonb_typeof(d->'longitude')<>'number' then raise exception using errcode='22023',message='Number required';end if;
  if jsonb_typeof(d->'operating') is distinct from 'boolean' then raise exception using errcode='22023',message='Boolean required';end if;
  if d->'evidence'<>'null'::jsonb and jsonb_typeof(d->'evidence')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'zip_service' then
  if d->'zip_code'<>'null'::jsonb and jsonb_typeof(d->'zip_code')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'nearest_location'<>'null'::jsonb and jsonb_typeof(d->'nearest_location')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'served'<>'null'::jsonb and jsonb_typeof(d->'served')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'expansion_flag'<>'null'::jsonb and jsonb_typeof(d->'expansion_flag')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'evidence'<>'null'::jsonb and jsonb_typeof(d->'evidence')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 when 'portal_link' then
  if d->'member_id'<>'null'::jsonb and jsonb_typeof(d->'member_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'auth_user_id'<>'null'::jsonb and jsonb_typeof(d->'auth_user_id')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  if d->'identity_evidence'<>'null'::jsonb and jsonb_typeof(d->'identity_evidence')<>'string' then raise exception using errcode='22023',message='Text required';end if;
  null;
 else null;end case;
 if d?'member_id' and nullif(d->>'member_id','') is not null then
  select * into member from public.epew_ffr_members where member_id=d->>'member_id';
  if not found then raise exception using errcode='22023',message='Member not found';end if;
 end if;
 if k in ('raffle','membership','portal_link') and member.member_id is null then raise exception using errcode='22023',message='Member required';end if;
 if k in ('membership','portal_link') and member.restaurant_unit_id<>p_unit then raise exception using errcode='22023',message='Member home restaurant required';end if;
 if k='portal_link' then
  if rk<>member.member_id or (d->>'auth_user_id')::uuid is null then raise exception using errcode='22023',message='Verified account required';end if;
 end if;
 if k='menu' and rk<>d->>'menu_item_id' or k='recipe' and rk<>d->>'recipe_id' or k='drawing' and rk<>d->>'drawing_id' or k='order' and rk<>d->>'order_id' or k='membership' and rk<>d->>'member_id' then raise exception using errcode='22023',message='Record key must match identity';end if;
 if k='membership' then
  if d->>'level' not in ('MEMBER','ELITE','AMBASSADOR') or (d->>'level'='ELITE' and coalesce(d->>'state_code','')!~'^[A-Z]{2}$') then raise exception using errcode='22023',message='Invalid level or state';end if;
  start_time:=(d->>'starts_at')::timestamptz;end_time:=(d->>'expires_at')::timestamptz;
  if end_time<=start_time or end_time>start_time+interval '1 year' then raise exception using errcode='22023',message='Membership term must be within one year';end if;
 end if;
 if k='drawing' then
  if (d->>'raffle_year')::integer not between 2026 and 2100 or extract(year from ((d->>'draw_at')::timestamptz at time zone 'America/New_York'))<>(d->>'raffle_year')::integer then raise exception using errcode='22023',message='Drawing year mismatch';end if;
 end if;
 if k='raffle' then
  select data into tier from public.epew_ffr_network_records where kind='membership' and data->>'member_id'=member.member_id;
  select data->>'state_code' into location_state from public.epew_ffr_network_records where restaurant_unit_id=p_unit and kind='location' and record_key=p_unit;
  if tier is not null and ((tier->>'level'='MEMBER' and member.restaurant_unit_id<>p_unit) or (tier->>'level'='ELITE' and (location_state is null or location_state<>tier->>'state_code'))) then raise exception using errcode='22023',message='Membership scope does not cover restaurant';end if;
  select data into drawing from public.epew_ffr_network_records where restaurant_unit_id=p_unit and kind='drawing' and record_key=d->>'drawing_id';
  if drawing is null or (drawing->>'raffle_year')::integer<>(d->>'raffle_year')::integer or rk<>(d->>'member_id')||':'||(d->>'drawing_id') then raise exception using errcode='22023',message='Matching independent drawing required';end if;
  if (d->>'confirmed_ticket_count')::integer<0 then raise exception using errcode='22023',message='Invalid ticket count';end if;
  if coalesce((d->>'entry_confirmed')::boolean,false) and (not coalesce((drawing->>'rules_approved')::boolean,false) or not coalesce((d->>'eligible')::boolean,false) or not coalesce((d->>'opted_in')::boolean,false) or nullif(btrim(d->>'orgdh_reference_id'),'') is null or nullif(d->>'date_entered','') is null or (d->>'date_entered')::timestamptz>(drawing->>'draw_at')::timestamptz or not exists(select 1 from public.epew_ffr_network_records t where t.kind='membership' and t.data->>'member_id'=member.member_id and (t.data->>'starts_at')::timestamptz<=(d->>'date_entered')::timestamptz and (t.data->>'expires_at')::timestamptz>(d->>'date_entered')::timestamptz)) then raise exception using errcode='22023',message='Confirmed raffle requires opt-in, eligibility, valid paid membership and ORGDH evidence before drawing';end if;
 end if;
 if k='raffle' and (d->>'date_entered') is not null and (d->>'date_entered')::timestamptz>clock_timestamp() then raise exception using errcode='22023',message='Future entry confirmation forbidden';end if;
 if k='order' and ((d->>'qualifying_meal_quantity')::integer<0 or d->>'channel' not in ('counter','online_pickup','food_fans_delivery','third_party_delivery') or d->>'order_status' not in ('pending','completed','canceled','refunded')) then raise exception using errcode='22023',message='Invalid order';end if;
 if k='recipe' and d->>'approval_status'='approved' and (nullif(btrim(d->>'approved_by'),'') is null or nullif(d->>'approval_date','') is null) then raise exception using errcode='22023',message='Approval evidence required';end if;
 if k='zip_service' and (rk<>d->>'zip_code' or rk!~'^[0-9]{5}(-[0-9]{4})?$' or d->>'served' not in ('unknown','yes','no') or d->>'expansion_flag' not in ('unreviewed','review','not_flagged')) then raise exception using errcode='22023',message='Invalid ZIP review';end if;
 insert into public.epew_ffr_network_records values(p_unit,k,rk,expected+1,d,clock_timestamp()) on conflict(restaurant_unit_id,kind,record_key) do update set version=excluded.version,data=excluded.data,updated_at=excluded.updated_at;
 insert into public.epew_ffr_network_revisions(restaurant_unit_id,kind,record_key,version,previous_data,data,reason,actor_user_id,actor_email,request_id,request_input) values(p_unit,k,rk,expected+1,old.data,d,p_input->>'reason',p_actor,p_actor_email,req,p_input);
 return jsonb_build_object('saved',true,'version',expected+1);
end $$;
revoke all on function public.epew_ffr_network_save(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.epew_ffr_network_save(uuid,text,text,jsonb) to service_role;
-- All current and historical draws remain distinct; effective participation expires at the drawing cutoff.
create view public.epew_ffr_raffle_status with(security_invoker=true) as
select r.restaurant_unit_id,r.record_key,r.data->>'member_id' as member_id,(r.data->>'raffle_year')::integer as raffle_year,
 r.data->>'drawing_id' as drawing_id,(r.data->>'eligible')::boolean as eligible,(r.data->>'opted_in')::boolean as opted_in,
 (r.data->>'entry_confirmed')::boolean as entry_confirmed,r.data->>'date_entered' as date_entered,r.data->>'orgdh_reference_id' as orgdh_reference_id,r.data->>'notes' as notes,
 (d.data->>'draw_at')::timestamptz as expires_at,
 now()>=(d.data->>'draw_at')::timestamptz as expired,
 case when now()<(d.data->>'draw_at')::timestamptz and (r.data->>'eligible')::boolean and (r.data->>'opted_in')::boolean and (r.data->>'entry_confirmed')::boolean then (r.data->>'confirmed_ticket_count')::integer else 0 end as current_confirmed_tickets
from public.epew_ffr_network_records r join public.epew_ffr_network_records d on d.restaurant_unit_id=r.restaurant_unit_id and d.kind='drawing' and d.record_key=r.data->>'drawing_id' where r.kind='raffle';
-- Analytics use paid/completed ledger-linked receipts only; metadata cannot manufacture credits or inflate these counts.
create view public.epew_ffr_expansion_report with(security_invoker=true) as
with per_member as (
 select m.member_id,m.restaurant_unit_id,m.zip_code,count(o.id) filter(where o.payment_status='paid' and o.order_status='completed' and (o.qualifying_quantity=0 or o.qualifying_quantity>o.reversed_quantity)) as orders,
 coalesce(sum(o.qualifying_quantity-o.reversed_quantity) filter(where o.payment_status='paid' and o.order_status='completed'),0) as meals
 from public.epew_ffr_members m left join public.epew_ffr_orders o on o.member_id=m.member_id group by m.member_id,m.restaurant_unit_id,m.zip_code
)
select p.restaurant_unit_id,p.zip_code,count(*)::integer as member_count,sum(p.orders)::integer as order_count,
 round(100.0*count(*) filter(where p.orders>1)/nullif(count(*) filter(where p.orders>0),0),2) as repeat_order_rate_percent,
 round(sum(p.orders)::numeric/count(*),2) as average_orders_per_member,sum(p.meals)::integer as total_qualifying_meals,
 s.data->>'nearest_location' as nearest_location,coalesce(s.data->>'served','unknown') as currently_served,
 coalesce(s.data->>'expansion_flag','unreviewed') as potential_expansion_flag,s.data->>'evidence' as geography_evidence
from per_member p left join public.epew_ffr_network_records s on s.restaurant_unit_id=p.restaurant_unit_id and s.kind='zip_service' and s.record_key=p.zip_code group by p.restaurant_unit_id,p.zip_code,s.data;
create view public.epew_ffr_management_summary with(security_invoker=true) as
select u.restaurant_unit_id,count(m.member_id)::integer as total_members,
 count(*) filter(where m.membership_date>=date_trunc('week',now() at time zone 'America/New_York') at time zone 'America/New_York')::integer as new_this_week,
 count(*) filter(where m.membership_date>=date_trunc('month',now() at time zone 'America/New_York') at time zone 'America/New_York')::integer as new_this_month,
 count(*) filter(where m.membership_status='active')::integer as active_members,
 coalesce(sum(b.lifetime_qualifying_meals),0)::integer as meals_credited,coalesce(sum(b.free_meals_earned),0)::integer as free_meals_earned,
 coalesce(sum(b.free_meals_redeemed),0)::integer as free_meals_redeemed,coalesce(sum(b.free_meals_currently_available),0)::integer as outstanding_free_meals,
 count(*) filter(where exists(select 1 from public.epew_ffr_raffle_status r where r.member_id=m.member_id and r.eligible and r.opted_in and r.entry_confirmed and not r.expired))::integer as raffle_eligible_members
from public.epew_restaurant_units u left join public.epew_ffr_members m on m.restaurant_unit_id=u.restaurant_unit_id left join public.epew_ffr_reward_balances b on b.member_id=m.member_id group by u.restaurant_unit_id;
create view public.epew_ffr_member_segments with(security_invoker=true) as
select restaurant_unit_id,zip_code,preferred_language,count(*)::integer as members from public.epew_ffr_members group by restaurant_unit_id,zip_code,preferred_language;
revoke all on public.epew_ffr_raffle_status,public.epew_ffr_expansion_report,public.epew_ffr_management_summary,public.epew_ffr_member_segments from public,anon,authenticated;
grant select on public.epew_ffr_raffle_status,public.epew_ffr_expansion_report,public.epew_ffr_management_summary,public.epew_ffr_member_segments to service_role;
-- Retain v1 historical terms; current policy requires external ORGDH confirmations and drawing-day expiry.
insert into public.epew_ffr_program_rules(version,restaurant_unit_id,name,slogan,rules)
select 2,restaurant_unit_id,name,slogan,rules||'{"raffle_auto_purchase_tickets":false,"raffle_governance":"ORGDH Network; independent anniversary drawing per restaurant","raffle_membership_max_years":1,"raffle_ticket_expiry":"At the applicable drawing cutoff regardless of purchase date; historical records retained","paid_membership_levels":{"MEMBER":{"fee_cents":2500,"scope":"one restaurant"},"ELITE":{"fee_cents":10000,"scope":"one state"},"AMBASSADOR":{"fee_cents":50000,"scope":"USA and beyond"}},"meal_membership_remains_free":true,"raffle_ticket_aggregation":"ELITE and AMBASSADOR show externally confirmed counts only; no purchase conversion or cross-drawing reassignment"}'::jsonb from public.epew_ffr_program_rules where version=1;

-- Known location and announced drawing are drafts, not a claim of approved rules or opening.
insert into public.epew_ffr_network_records values
('FFR-001','location','FFR-001',1,'{"state_code":"NY","country_code":"US","latitude":null,"longitude":null,"operating":false,"evidence":"Verified master address: 116-32 Springfield Blvd, Cambria Heights, NY 11411; pre-opening"}',now()),
('FFR-001','drawing','FFR-001-2027',1,'{"drawing_id":"FFR-001-2027","raffle_year":2027,"draw_at":"2027-11-21T17:00:00-05:00","rules_approved":false,"rules_reference":"Pending ORGDH Network approval; no entries may be confirmed","venue":"TBA","notes":"Announced first anniversary drawing; date requires final ORGDH rules confirmation. No raffle executed or tickets issued."}',now());

insert into public.epew_ffr_network_revisions(restaurant_unit_id,kind,record_key,version,data,reason,actor_email,request_id,request_input)
select restaurant_unit_id,kind,record_key,version,data,'User-authorized baseline record; published location and announced drawing; approval remains pending','system:migration',gen_random_uuid(),jsonb_build_object('source','ffr_network_operations migration','authorization','Samuel Nelson sections 7 through 14') from public.epew_ffr_network_records;
