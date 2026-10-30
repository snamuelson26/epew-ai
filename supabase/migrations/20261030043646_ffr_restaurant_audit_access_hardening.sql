revoke delete,truncate on public.epew_restaurant_units,public.epew_restaurant_unit_campaigns from service_role;
revoke update,delete,truncate,references,trigger on public.epew_restaurant_unit_audit from service_role;
-- Work changes remain available only through the authenticated administrator API.
