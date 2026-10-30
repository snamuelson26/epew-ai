-- Opaque deterministic training IDs support every topic, including Pickup/delivery,
-- and employee IDs of the full allowed length without changing employee identity.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.epew_ffr_workforce_save(uuid,text,text,jsonb)'::regprocedure) into definition;
 if position('new_key:=rk||' in definition)=0 then raise exception 'Expected workforce function revision not found';end if;
 definition:=replace(definition,$old$new_key:=rk||':'||replace(lower(planned->>'topic'),' ','_');$old$,$new$new_key:='TR-'||md5(rk||':'||(planned->>'topic'));$new$);
 execute definition;
end $migration$;
