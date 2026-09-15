-- ORGDH uses the existing organization-scoped internal communication tables.
-- The legacy table names remain for compatibility with the Emanon deployment.

alter table public.emanon_staff_invites
  drop constraint if exists emanon_staff_invites_role_code_check;
alter table public.emanon_staff_invites
  add constraint emanon_staff_invites_role_code_check check (
    role_code in (
      'program_director',
      'strategic_partnerships_director',
      'general_marketing_director',
      'media_content_production_director',
      'branding_design_director',
      'social_media_marketing_director',
      'video_production_director'
    )
  );

alter table public.emanon_staff_members
  drop constraint if exists emanon_staff_members_role_code_check;
alter table public.emanon_staff_members
  add constraint emanon_staff_members_role_code_check check (
    role_code in (
      'program_director',
      'strategic_partnerships_director',
      'general_marketing_director',
      'media_content_production_director',
      'branding_design_director',
      'social_media_marketing_director',
      'video_production_director'
    )
  );

insert into public.emanon_organizations (
  organization_code,
  legal_name,
  display_name,
  profile_metadata
)
values (
  'ORGDH-NETWORK',
  'ORGDH Network',
  'ORGDH Network',
  jsonb_build_object(
    'epew_partner_profile_id', '0afbbd80-24e1-49db-959b-035d634b55f6',
    'epew_partner_actor_id', 'c018adb3-6e85-46e3-82e6-7917677f0842',
    'responsible_partner_email', 'marketingdirector@orgdh.org',
    'authority_model', 'single_responsible_partner_with_supervised_vendors'
  )
)
on conflict (organization_code) do update
set legal_name = excluded.legal_name,
    display_name = excluded.display_name,
    profile_metadata = public.emanon_organizations.profile_metadata || excluded.profile_metadata,
    updated_at = now();

insert into public.etvmc_actors (actor_key, actor_type, display_name, status, is_automated, metadata)
values
  ('orgdh-vendor-media-content-production', 'vendor', 'Volcy Therner', 'active', true,
   '{"organization":"ORGDH Network","title":"Media & Content Production Director","supervisor_email":"marketingdirector@orgdh.org"}'::jsonb),
  ('orgdh-vendor-branding-design', 'vendor', 'Tompson Elyas', 'active', true,
   '{"organization":"ORGDH Network","title":"Branding and Design Director","supervisor_email":"marketingdirector@orgdh.org"}'::jsonb),
  ('orgdh-vendor-social-media-marketing', 'vendor', 'Nayara Noslen', 'active', true,
   '{"organization":"ORGDH Network","title":"Social Media Marketing Director","supervisor_email":"marketingdirector@orgdh.org"}'::jsonb),
  ('orgdh-vendor-video-production', 'vendor', 'Amara Noslen', 'active', true,
   '{"organization":"ORGDH Network","title":"Video Production Director","supervisor_email":"marketingdirector@orgdh.org"}'::jsonb)
on conflict (actor_key) do update
set display_name = excluded.display_name,
    status = 'active',
    is_automated = true,
    metadata = public.etvmc_actors.metadata || excluded.metadata,
    updated_at = now();

insert into public.etvmc_vendor_profiles (
  actor_id,
  legal_name,
  display_name,
  vendor_code,
  portal_status,
  compliance_status,
  primary_email,
  maximum_active_jobs,
  accepts_automatic_matching,
  metadata
)
select
  a.id,
  v.legal_name,
  v.display_name,
  v.vendor_code,
  'active',
  'qualified',
  v.email,
  5,
  false,
  jsonb_build_object(
    'organization', 'ORGDH Network',
    'partner_actor_id', 'c018adb3-6e85-46e3-82e6-7917677f0842',
    'supervisor_email', 'marketingdirector@orgdh.org',
    'role_model', 'supervised_internal_vendor',
    'service_scope', v.service_scope
  )
from (
  values
    ('orgdh-vendor-media-content-production', 'Volcy Therner', 'Volcy Therner', 'VND-ORGDH-MEDIA-001', 'mediaproduction@orgdh.org', 'media_and_content_production'),
    ('orgdh-vendor-branding-design', 'Tompson Elyas', 'Tompson Elyas', 'VND-ORGDH-BRAND-001', 'brandingdesign@orgdh.org', 'branding_and_design'),
    ('orgdh-vendor-social-media-marketing', 'Nayara Noslen', 'Nayara Noslen', 'VND-ORGDH-SOCIAL-001', 'socialmedia@orgdh.org', 'social_media_marketing'),
    ('orgdh-vendor-video-production', 'Amara Noslen', 'Amara Noslen', 'VND-ORGDH-VIDEO-001', 'videoproductions@orgdh.org', 'video_production')
) as v(actor_key, legal_name, display_name, vendor_code, email, service_scope)
join public.etvmc_actors a on a.actor_key = v.actor_key
on conflict (actor_id) do update
set legal_name = excluded.legal_name,
    display_name = excluded.display_name,
    portal_status = 'active',
    compliance_status = 'qualified',
    primary_email = excluded.primary_email,
    accepts_automatic_matching = false,
    metadata = public.etvmc_vendor_profiles.metadata || excluded.metadata,
    updated_at = now();

insert into public.epew_communication_sender_identities (
  identity_key,
  organization_name,
  display_name,
  title,
  department,
  email_address,
  reply_to_address,
  is_active,
  metadata
)
values
  ('orgdh-general-marketing-director', 'ORGDH Network', 'Dorian Noslen', 'General Marketing Director', 'Marketing', 'marketingdirector@orgdh.org', 'marketingdirector@orgdh.org', true, '{"internal_only":true,"epew_partner_responsible":true}'::jsonb),
  ('orgdh-media-production-director', 'ORGDH Network', 'Volcy Therner', 'Media & Content Production Director', 'Media & Content Production', 'mediaproduction@orgdh.org', 'mediaproduction@orgdh.org', true, '{"internal_only":true,"role_model":"vendor"}'::jsonb),
  ('orgdh-branding-design-director', 'ORGDH Network', 'Tompson Elyas', 'Branding and Design Director', 'Branding & Design', 'brandingdesign@orgdh.org', 'brandingdesign@orgdh.org', true, '{"internal_only":true,"role_model":"vendor"}'::jsonb),
  ('orgdh-social-media-director', 'ORGDH Network', 'Nayara Noslen', 'Social Media Marketing Director', 'Social Media Marketing', 'socialmedia@orgdh.org', 'socialmedia@orgdh.org', true, '{"internal_only":true,"role_model":"vendor"}'::jsonb),
  ('orgdh-video-production-director', 'ORGDH Network', 'Amara Noslen', 'Video Production Director', 'Video Production', 'videoproductions@orgdh.org', 'videoproductions@orgdh.org', true, '{"internal_only":true,"role_model":"vendor"}'::jsonb)
on conflict (identity_key) do update
set organization_name = excluded.organization_name,
    display_name = excluded.display_name,
    title = excluded.title,
    department = excluded.department,
    email_address = excluded.email_address,
    reply_to_address = excluded.reply_to_address,
    is_active = true,
    metadata = public.epew_communication_sender_identities.metadata || excluded.metadata,
    updated_at = now();

with org as (
  select id from public.emanon_organizations where organization_code = 'ORGDH-NETWORK'
), invite_data(email, full_name, title, role_code, permissions, token_hash) as (
  values
    ('marketingdirector@orgdh.org', 'Dorian Noslen', 'General Marketing Director', 'general_marketing_director',
     '{"access_role":"partner","send_messages":true,"receive_messages":true,"view_history":true,"issue_assignments":true,"issue_follow_ups":true,"receive_attachments":true,"manage_orgdh_communication":true,"supervise_vendors":true,"epew_partner_responsible":true}'::jsonb,
     '3b97e8f5d56ee234097a2c244aff00d7f94b66494ff45776a17a311188228dd8'),
    ('mediaproduction@orgdh.org', 'Volcy Therner', 'Media & Content Production Director', 'media_content_production_director',
     '{"access_role":"vendor","send_messages":true,"receive_messages":true,"view_history":true,"submit_reports":true,"send_attachments":true,"receive_assignments":true,"supervised_by_email":"marketingdirector@orgdh.org","service_scope":"media_and_content_production"}'::jsonb,
     '537bd6e8f754688073eed41b11bccb7357432cfd23a421667cc8a7a1e3da0418'),
    ('brandingdesign@orgdh.org', 'Tompson Elyas', 'Branding and Design Director', 'branding_design_director',
     '{"access_role":"vendor","send_messages":true,"receive_messages":true,"view_history":true,"submit_reports":true,"send_attachments":true,"receive_assignments":true,"supervised_by_email":"marketingdirector@orgdh.org","service_scope":"branding_and_design"}'::jsonb,
     'd7dfaecf453331b06c991642c8b95b548943ba3ec614a0c68b3f9a760d3ba48a'),
    ('socialmedia@orgdh.org', 'Nayara Noslen', 'Social Media Marketing Director', 'social_media_marketing_director',
     '{"access_role":"vendor","send_messages":true,"receive_messages":true,"view_history":true,"submit_reports":true,"send_attachments":true,"receive_assignments":true,"supervised_by_email":"marketingdirector@orgdh.org","service_scope":"social_media_marketing"}'::jsonb,
     'e103108888e7acd6ea8cb9595d11886d1498933d25c906915844ed2f7e56744e'),
    ('videoproductions@orgdh.org', 'Amara Noslen', 'Video Production Director', 'video_production_director',
     '{"access_role":"vendor","send_messages":true,"receive_messages":true,"view_history":true,"submit_reports":true,"send_attachments":true,"receive_assignments":true,"supervised_by_email":"marketingdirector@orgdh.org","service_scope":"video_production"}'::jsonb,
     'a7a4fafae62e6ef23d2fa116956e5068a6a071b93ae17b4b850f7149dbcb7da1')
)
insert into public.emanon_staff_invites (
  organization_id,
  email,
  full_name,
  title,
  role_code,
  permissions,
  token_hash,
  expires_at
)
select org.id, invite_data.email, invite_data.full_name, invite_data.title,
       invite_data.role_code, invite_data.permissions, invite_data.token_hash,
       now() + interval '14 days'
from org cross join invite_data
on conflict (organization_id, email) do update
set full_name = excluded.full_name,
    title = excluded.title,
    role_code = excluded.role_code,
    permissions = excluded.permissions,
    token_hash = excluded.token_hash,
    status = 'pending',
    expires_at = excluded.expires_at,
    accepted_at = null;
