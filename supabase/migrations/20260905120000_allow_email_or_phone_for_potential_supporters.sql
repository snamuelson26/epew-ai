-- Potential supporters may be contacted by email, phone, or both.

alter table public.epew_entrepreneur_communication_contacts
  alter column phone drop not null,
  alter column email drop not null;

alter table public.epew_entrepreneur_communication_contacts
  drop constraint if exists epew_entrepreneur_communication_contacts_contact_method_check;

alter table public.epew_entrepreneur_communication_contacts
  add constraint epew_entrepreneur_communication_contacts_contact_method_check
  check (
    nullif(btrim(coalesce(phone, '')), '') is not null
    or nullif(btrim(coalesce(email, '')), '') is not null
  );
