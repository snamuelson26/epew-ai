alter table public.epew_ffr_network_records drop constraint epew_ffr_network_records_kind_check;
alter table public.epew_ffr_network_records add constraint epew_ffr_network_records_kind_check check(kind in ('menu','recipe','website','drawing','raffle','membership','order','location','zip_service','portal_link','translation','qr','sign'));
alter function public.epew_ffr_network_save(uuid,text,text,jsonb) rename to epew_ffr_network_save_v1;
revoke all on function public.epew_ffr_network_save_v1(uuid,text,text,jsonb) from public,anon,authenticated;
create function public.epew_ffr_network_save(p_actor uuid,p_actor_email text,p_unit text,p_input jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text:=p_input->>'kind';rk text:=p_input->>'record_key';d jsonb:=p_input->'data';req uuid:=(p_input->>'request_id')::uuid;
old public.epew_ffr_network_records;rev public.epew_ffr_network_revisions;expected integer:=(p_input->>'expected_version')::integer;
allowed text[];required text[];field text;qr jsonb;attachment public.epew_restaurant_work_files;
begin
if k not in ('translation','qr','sign') then return public.epew_ffr_network_save_v1(p_actor,p_actor_email,p_unit,p_input);end if;
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
 when 'translation' then allowed:=array['page_id','translation_key','language_code','text','reviewed','approved','review_reference','approval_reference'];required:=array['page_id','translation_key','language_code'];
 if d->'page_id'<>'null'::jsonb and jsonb_typeof(d->'page_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'translation_key'<>'null'::jsonb and jsonb_typeof(d->'translation_key')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'language_code'<>'null'::jsonb and jsonb_typeof(d->'language_code')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'text'<>'null'::jsonb and jsonb_typeof(d->'text')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'reviewed'<>'null'::jsonb and jsonb_typeof(d->'reviewed')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'reviewed') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'approved'<>'null'::jsonb and jsonb_typeof(d->'approved')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'approved') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'review_reference'<>'null'::jsonb and jsonb_typeof(d->'review_reference')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'approval_reference'<>'null'::jsonb and jsonb_typeof(d->'approval_reference')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 when 'qr' then allowed:=array['qr_id','purpose','business_id','support_campaign_id','destination_url','version','generated_at','scan_tested','tested','test_evidence','approved','approval_reference','print_status','notes'];required:=array['qr_id','purpose','business_id','destination_url','version','print_status'];
 if d->'qr_id'<>'null'::jsonb and jsonb_typeof(d->'qr_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'purpose'<>'null'::jsonb and jsonb_typeof(d->'purpose')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'business_id'<>'null'::jsonb and jsonb_typeof(d->'business_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'support_campaign_id'<>'null'::jsonb and jsonb_typeof(d->'support_campaign_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'destination_url'<>'null'::jsonb and jsonb_typeof(d->'destination_url')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'version'<>'null'::jsonb and jsonb_typeof(d->'version')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'generated_at'<>'null'::jsonb and jsonb_typeof(d->'generated_at')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'scan_tested'<>'null'::jsonb and jsonb_typeof(d->'scan_tested')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'scan_tested') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'tested'<>'null'::jsonb and jsonb_typeof(d->'tested')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'tested') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'test_evidence'<>'null'::jsonb and jsonb_typeof(d->'test_evidence')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'approved'<>'null'::jsonb and jsonb_typeof(d->'approved')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'approved') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'approval_reference'<>'null'::jsonb and jsonb_typeof(d->'approval_reference')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'print_status'<>'null'::jsonb and jsonb_typeof(d->'print_status')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'notes'<>'null'::jsonb and jsonb_typeof(d->'notes')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 when 'sign' then allowed:=array['sign_id','side','width_inches','height_inches','artwork_version','artwork_file_id','sha256','source_library_id','content_approved','content_approval_reference','print_approved','print_approval_reference','print_status','order_qr_id','support_qr_id','includes','qa_notes'];required:=array['sign_id','side','width_inches','height_inches','artwork_version','artwork_file_id','sha256','print_status'];
 if d->'sign_id'<>'null'::jsonb and jsonb_typeof(d->'sign_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'side'<>'null'::jsonb and jsonb_typeof(d->'side')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'width_inches'<>'null'::jsonb and jsonb_typeof(d->'width_inches')<>'number' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'height_inches'<>'null'::jsonb and jsonb_typeof(d->'height_inches')<>'number' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'artwork_version'<>'null'::jsonb and jsonb_typeof(d->'artwork_version')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'artwork_file_id'<>'null'::jsonb and jsonb_typeof(d->'artwork_file_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'sha256'<>'null'::jsonb and jsonb_typeof(d->'sha256')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'source_library_id'<>'null'::jsonb and jsonb_typeof(d->'source_library_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'content_approved'<>'null'::jsonb and jsonb_typeof(d->'content_approved')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'content_approved') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'content_approval_reference'<>'null'::jsonb and jsonb_typeof(d->'content_approval_reference')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'print_approved'<>'null'::jsonb and jsonb_typeof(d->'print_approved')<>'boolean' then raise exception using errcode='22023',message='Invalid field type';end if;
 if not(d?'print_approved') then raise exception using errcode='22023',message='Boolean required';end if;
 if d->'print_approval_reference'<>'null'::jsonb and jsonb_typeof(d->'print_approval_reference')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'print_status'<>'null'::jsonb and jsonb_typeof(d->'print_status')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'order_qr_id'<>'null'::jsonb and jsonb_typeof(d->'order_qr_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'support_qr_id'<>'null'::jsonb and jsonb_typeof(d->'support_qr_id')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'includes'<>'null'::jsonb and jsonb_typeof(d->'includes')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
 if d->'qa_notes'<>'null'::jsonb and jsonb_typeof(d->'qa_notes')<>'string' then raise exception using errcode='22023',message='Invalid field type';end if;
else raise exception using errcode='22023',message='Invalid kind';end case;
if exists(select 1 from jsonb_object_keys(d) as keys(key) where not(key=any(allowed))) then raise exception using errcode='22023',message='Unknown field';end if;
foreach field in array required loop if coalesce(length(btrim(d->>field)),0)=0 then raise exception using errcode='22023',message='Missing required field';end if;end loop;
if k='translation' then
 if d->>'language_code'!~'^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$' or rk<>(d->>'page_id')||'.'||(d->>'translation_key')||':'||(d->>'language_code') then raise exception using errcode='22023',message='Invalid translation identity';end if;
 if old.data is not null and old.data->>'text' is distinct from d->>'text' then d:=d||'{"reviewed":false,"approved":false,"review_reference":null,"approval_reference":null}'::jsonb;end if;
 if (d->>'reviewed')::boolean and (nullif(btrim(d->>'text'),'') is null or nullif(btrim(d->>'review_reference'),'') is null) or (d->>'approved')::boolean and (not(d->>'reviewed')::boolean or nullif(btrim(d->>'approval_reference'),'') is null) then raise exception using errcode='22023',message='Review and approval evidence required';end if;
end if;
if k='qr' then
 if rk<>d->>'qr_id' or d->>'business_id'<>p_unit or d->>'purpose' not in ('order','support') or d->>'destination_url'!~'^https://' or d->>'print_status' not in ('not_printed','held','ready','printed') then raise exception using errcode='22023',message='Invalid QR record';end if;
 if nullif(d->>'generated_at','') is not null then perform (d->>'generated_at')::timestamptz;end if;
 if d->>'purpose'='support' and not exists(select 1 from public.epew_restaurant_unit_campaigns where restaurant_unit_id=p_unit and epew_support_campaign_id=d->>'support_campaign_id') then raise exception using errcode='22023',message='Separate support campaign required';end if;
 if old.data is not null and (old.data->>'destination_url' is distinct from d->>'destination_url' or old.data->>'version' is distinct from d->>'version') then d:=d||'{"tested":false,"scan_tested":false,"approved":false,"approval_reference":null,"print_status":"held"}'::jsonb;end if;
 if (d->>'tested')::boolean and nullif(btrim(d->>'test_evidence'),'') is null or (d->>'approved')::boolean and (not(d->>'tested')::boolean or nullif(btrim(d->>'approval_reference'),'') is null) then raise exception using errcode='22023',message='QR test and approval evidence required';end if;
 if d->>'print_status' in ('ready','printed') and not(d->>'approved')::boolean then raise exception using errcode='22023',message='QR production approval required';end if;
end if;
if k='sign' then
 if rk<>d->>'sign_id' or d->>'side' not in ('A','B') or (d->>'width_inches')::numeric<>47 or (d->>'height_inches')::numeric<>87 or d->>'sha256'!~'^[a-f0-9]{64}$' or d->>'print_status' not in ('held','ready','printed') then raise exception using errcode='22023',message='Invalid sign';end if;
 select * into attachment from public.epew_restaurant_work_files where id=(d->>'artwork_file_id')::uuid and restaurant_unit_id=p_unit and mime_type='image/png';
 if not found then raise exception using errcode='22023',message='Private artwork must be attached to restaurant';end if;
 if old.data is not null and (old.data->>'artwork_file_id' is distinct from d->>'artwork_file_id' or old.data->>'artwork_version' is distinct from d->>'artwork_version') then d:=d||'{"print_approved":false,"print_approval_reference":null,"print_status":"held"}'::jsonb;end if;
 if (d->>'content_approved')::boolean and nullif(btrim(d->>'content_approval_reference'),'') is null then raise exception using errcode='22023',message='Content approval evidence required';end if;
 if (d->>'print_approved')::boolean then
  if not(d->>'content_approved')::boolean or nullif(btrim(d->>'print_approval_reference'),'') is null then raise exception using errcode='22023',message='Print approval evidence required';end if;
  foreach field in array array['order_qr_id','support_qr_id'] loop
   select data into qr from public.epew_ffr_network_records where restaurant_unit_id=p_unit and kind='qr' and record_key=d->>field;
   if qr is null or not(qr->>'approved')::boolean or not(qr->>'tested')::boolean then raise exception using errcode='22023',message='Both QR destinations require production approval';end if;
  end loop;
 end if;
 if d->>'print_status' in ('ready','printed') and not(d->>'print_approved')::boolean then raise exception using errcode='22023',message='Print release required';end if;
end if;
insert into public.epew_ffr_network_records values(p_unit,k,rk,expected+1,d,clock_timestamp()) on conflict(restaurant_unit_id,kind,record_key) do update set version=excluded.version,data=excluded.data,updated_at=excluded.updated_at;
insert into public.epew_ffr_network_revisions(restaurant_unit_id,kind,record_key,version,previous_data,data,reason,actor_user_id,actor_email,request_id,request_input) values(p_unit,k,rk,expected+1,old.data,d,p_input->>'reason',p_actor,p_actor_email,req,p_input);
return jsonb_build_object('saved',true,'version',expected+1);
end $$;
revoke all on function public.epew_ffr_network_save(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.epew_ffr_network_save(uuid,text,text,jsonb) to service_role;
create view public.epew_ffr_translation_readiness with(security_invoker=true) as
select restaurant_unit_id,data->>'page_id' as page_id,data->>'translation_key' as translation_key,
max(data->>'text') filter(where data->>'language_code'='en') as english,
max(data->>'text') filter(where data->>'language_code'='ht') as haitian_creole,
max(data->>'text') filter(where data->>'language_code'='fr') as french,
max(data->>'text') filter(where data->>'language_code'='es') as spanish,
jsonb_object_agg(data->>'language_code',jsonb_build_object('text',data->'text','reviewed',data->'reviewed','approved',data->'approved','last_modified',updated_at)) as languages,
bool_and(coalesce((data->>'reviewed')::boolean,false)) as reviewed,
bool_and(coalesce((data->>'approved')::boolean,false)) as approved,max(updated_at) as last_modified
from public.epew_ffr_network_records where kind='translation' group by restaurant_unit_id,data->>'page_id',data->>'translation_key';
revoke all on public.epew_ffr_translation_readiness from public,anon,authenticated;
grant select on public.epew_ffr_translation_readiness to service_role;
