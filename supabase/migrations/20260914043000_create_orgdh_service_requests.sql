create table if not exists public.orgdh_service_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  business_name text,
  service_interest text not null,
  goal_description text not null,
  source_page text not null default '/services/orgdh-network',
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'in_progress', 'completed', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orgdh_service_requests enable row level security;

create index if not exists idx_orgdh_service_requests_status_created
  on public.orgdh_service_requests (status, created_at desc);

comment on table public.orgdh_service_requests is
  'Visitor requests for ORGDH Network business promotion, branding, design, and media services. Public submissions are accepted only through the validated server API.';
