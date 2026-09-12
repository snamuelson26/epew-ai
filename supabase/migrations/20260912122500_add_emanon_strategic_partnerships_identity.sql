insert into public.epew_communication_sender_identities (
  identity_key,
  organization_name,
  display_name,
  title,
  department,
  email_address,
  reply_to_address,
  inbound_processing_address,
  metadata
)
values (
  'emanon_strategic_partnerships_director',
  'Emanon Institute',
  'Raella Noslen',
  'Director of Strategic Partnerships & Program Development',
  'Innovative Educational System',
  'partnership@emanoninstitute.org',
  'partnership@emanoninstitute.org',
  'partnership@inbound.emanoninstitute.org',
  '{"official":true,"outbound_provider":"resend","mailbox_provider":"existing_emanon_mail"}'::jsonb
)
on conflict (identity_key) do update set
  organization_name = excluded.organization_name,
  display_name = excluded.display_name,
  title = excluded.title,
  department = excluded.department,
  email_address = excluded.email_address,
  reply_to_address = excluded.reply_to_address,
  inbound_processing_address = excluded.inbound_processing_address,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = now();
