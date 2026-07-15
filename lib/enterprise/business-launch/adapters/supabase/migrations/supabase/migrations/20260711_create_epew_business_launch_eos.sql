begin;

/**
 * ============================================================
 * EPEW EOS — BUSINESS LAUNCH PERSISTENCE
 * ============================================================
 *
 * Design:
 * - Complete EOS objects are stored in payload JSONB.
 * - Frequently filtered values use indexed database columns.
 * - Financial transactions and history tables are append-only.
 * - Row Level Security is enabled.
 * - Browser access remains blocked until role policies are added.
 */

/**
 * ============================================================
 * UPDATED_AT TRIGGER FUNCTION
 * ============================================================
 */

create or replace function public.epew_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

/**
 * ============================================================
 * IMMUTABLE RECORD PROTECTION FUNCTION
 * ============================================================
 */

create or replace function public.epew_block_immutable_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception
    'This EOS record is immutable. Append a correction or reversal record instead.';
end;
$$;

/**
 * ============================================================
 * BUSINESS LAUNCH PLANS
 * ============================================================
 */

create table if not exists public.epew_business_launch_plans (
  id text primary key,

  business_id text not null,
  entrepreneur_id text not null,
  launch_plan_id text not null,

  status text not null,
  current_stage text not null,
  compliance_status text not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_business_launch_plans_payload_object
    check (jsonb_typeof(payload) = 'object'),

  constraint epew_business_launch_plans_launch_plan_id_unique
    unique (launch_plan_id)
);

create index if not exists
  epew_launch_plans_business_id_idx
on public.epew_business_launch_plans (business_id);

create index if not exists
  epew_launch_plans_entrepreneur_id_idx
on public.epew_business_launch_plans (entrepreneur_id);

create index if not exists
  epew_launch_plans_status_idx
on public.epew_business_launch_plans (status);

create index if not exists
  epew_launch_plans_current_stage_idx
on public.epew_business_launch_plans (current_stage);

create index if not exists
  epew_launch_plans_compliance_status_idx
on public.epew_business_launch_plans (compliance_status);

create index if not exists
  epew_launch_plans_created_at_idx
on public.epew_business_launch_plans (created_at desc);

create index if not exists
  epew_launch_plans_updated_at_idx
on public.epew_business_launch_plans (updated_at desc);

create index if not exists
  epew_launch_plans_payload_gin_idx
on public.epew_business_launch_plans
using gin (payload);

drop trigger if exists
  epew_business_launch_plans_set_updated_at
on public.epew_business_launch_plans;

create trigger
  epew_business_launch_plans_set_updated_at
before update
on public.epew_business_launch_plans
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * FINANCIAL TRANSACTIONS — APPEND ONLY
 * ============================================================
 */

create table if not exists public.epew_financial_transactions (
  id text primary key,

  business_id text not null,
  allocation_id text not null,

  transaction_type text not null,
  reference text,
  approved_by text not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_financial_transactions_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_financial_transactions_business_id_idx
on public.epew_financial_transactions (business_id);

create index if not exists
  epew_financial_transactions_allocation_id_idx
on public.epew_financial_transactions (allocation_id);

create index if not exists
  epew_financial_transactions_type_idx
on public.epew_financial_transactions (transaction_type);

create index if not exists
  epew_financial_transactions_reference_idx
on public.epew_financial_transactions (reference);

create index if not exists
  epew_financial_transactions_approved_by_idx
on public.epew_financial_transactions (approved_by);

create index if not exists
  epew_financial_transactions_created_at_idx
on public.epew_financial_transactions (created_at desc);

drop trigger if exists
  epew_financial_transactions_block_update
on public.epew_financial_transactions;

create trigger
  epew_financial_transactions_block_update
before update
on public.epew_financial_transactions
for each row
execute function public.epew_block_immutable_mutation();

drop trigger if exists
  epew_financial_transactions_block_delete
on public.epew_financial_transactions;

create trigger
  epew_financial_transactions_block_delete
before delete
on public.epew_financial_transactions
for each row
execute function public.epew_block_immutable_mutation();

/**
 * ============================================================
 * COMPLIANCE RECORDS
 * ============================================================
 */

create table if not exists public.epew_compliance_records (
  id text primary key,

  business_id text not null,
  launch_plan_id text not null,

  status text not null,
  compliance_status text not null,

  next_review_date timestamptz,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_compliance_records_payload_object
    check (jsonb_typeof(payload) = 'object'),

  constraint epew_compliance_records_launch_plan_unique
    unique (launch_plan_id)
);

create index if not exists
  epew_compliance_records_business_id_idx
on public.epew_compliance_records (business_id);

create index if not exists
  epew_compliance_records_launch_plan_id_idx
on public.epew_compliance_records (launch_plan_id);

create index if not exists
  epew_compliance_records_status_idx
on public.epew_compliance_records (status);

create index if not exists
  epew_compliance_records_compliance_status_idx
on public.epew_compliance_records (compliance_status);

create index if not exists
  epew_compliance_records_next_review_idx
on public.epew_compliance_records (next_review_date);

create index if not exists
  epew_compliance_records_updated_at_idx
on public.epew_compliance_records (updated_at desc);

drop trigger if exists
  epew_compliance_records_set_updated_at
on public.epew_compliance_records;

create trigger
  epew_compliance_records_set_updated_at
before update
on public.epew_compliance_records
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * BUSINESS REGISTRY
 * ============================================================
 */

create table if not exists public.epew_business_registry (
  id text primary key,

  business_id text not null,

  status text not null,
  category text not null,
  requirement_level text not null,

  verified boolean not null default false,

  expiration_date timestamptz,
  archived_at timestamptz,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_business_registry_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_business_registry_business_id_idx
on public.epew_business_registry (business_id);

create index if not exists
  epew_business_registry_category_idx
on public.epew_business_registry (category);

create index if not exists
  epew_business_registry_requirement_level_idx
on public.epew_business_registry (requirement_level);

create index if not exists
  epew_business_registry_status_idx
on public.epew_business_registry (status);

create index if not exists
  epew_business_registry_verified_idx
on public.epew_business_registry (verified);

create index if not exists
  epew_business_registry_expiration_idx
on public.epew_business_registry (expiration_date);

create index if not exists
  epew_business_registry_archived_at_idx
on public.epew_business_registry (archived_at);

create index if not exists
  epew_business_registry_active_idx
on public.epew_business_registry (
  business_id,
  category
)
where archived_at is null;

drop trigger if exists
  epew_business_registry_set_updated_at
on public.epew_business_registry;

create trigger
  epew_business_registry_set_updated_at
before update
on public.epew_business_registry
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * REGISTRY HISTORY — APPEND ONLY
 * ============================================================
 */

create table if not exists public.epew_registry_history (
  id text primary key,

  business_id text not null,
  registry_item_id text not null,

  status text not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_registry_history_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_registry_history_business_id_idx
on public.epew_registry_history (business_id);

create index if not exists
  epew_registry_history_item_id_idx
on public.epew_registry_history (registry_item_id);

create index if not exists
  epew_registry_history_status_idx
on public.epew_registry_history (status);

create index if not exists
  epew_registry_history_created_at_idx
on public.epew_registry_history (created_at desc);

drop trigger if exists
  epew_registry_history_block_update
on public.epew_registry_history;

create trigger
  epew_registry_history_block_update
before update
on public.epew_registry_history
for each row
execute function public.epew_block_immutable_mutation();

drop trigger if exists
  epew_registry_history_block_delete
on public.epew_registry_history;

create trigger
  epew_registry_history_block_delete
before delete
on public.epew_registry_history
for each row
execute function public.epew_block_immutable_mutation();

/**
 * ============================================================
 * COMMUNICATIONS
 * ============================================================
 */

create table if not exists public.epew_communications (
  id text primary key,

  business_id text not null,

  recipient_id text not null,
  recipient_role text not null,

  channel text not null,
  priority text not null,
  status text not null,

  scheduled_for timestamptz,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_communications_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_communications_business_id_idx
on public.epew_communications (business_id);

create index if not exists
  epew_communications_recipient_id_idx
on public.epew_communications (recipient_id);

create index if not exists
  epew_communications_recipient_role_idx
on public.epew_communications (recipient_role);

create index if not exists
  epew_communications_status_idx
on public.epew_communications (status);

create index if not exists
  epew_communications_channel_idx
on public.epew_communications (channel);

create index if not exists
  epew_communications_priority_idx
on public.epew_communications (priority);

create index if not exists
  epew_communications_scheduled_for_idx
on public.epew_communications (scheduled_for);

create index if not exists
  epew_communications_created_at_idx
on public.epew_communications (created_at desc);

drop trigger if exists
  epew_communications_set_updated_at
on public.epew_communications;

create trigger
  epew_communications_set_updated_at
before update
on public.epew_communications
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * COMMUNICATION HISTORY — APPEND ONLY
 * ============================================================
 */

create table if not exists public.epew_communication_history (
  id text primary key,

  business_id text not null,
  message_id text not null,

  status text not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_communication_history_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_communication_history_business_id_idx
on public.epew_communication_history (business_id);

create index if not exists
  epew_communication_history_message_id_idx
on public.epew_communication_history (message_id);

create index if not exists
  epew_communication_history_status_idx
on public.epew_communication_history (status);

create index if not exists
  epew_communication_history_created_at_idx
on public.epew_communication_history (created_at desc);

drop trigger if exists
  epew_communication_history_block_update
on public.epew_communication_history;

create trigger
  epew_communication_history_block_update
before update
on public.epew_communication_history
for each row
execute function public.epew_block_immutable_mutation();

drop trigger if exists
  epew_communication_history_block_delete
on public.epew_communication_history;

create trigger
  epew_communication_history_block_delete
before delete
on public.epew_communication_history
for each row
execute function public.epew_block_immutable_mutation();

/**
 * ============================================================
 * GROWTH METRICS — APPEND ONLY
 * ============================================================
 */

create table if not exists public.epew_growth_metrics (
  id text primary key,

  business_id text not null,

  metric_type text not null,
  quarter integer,

  period_start timestamptz not null,
  period_end timestamptz not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_growth_metrics_quarter_check
    check (
      quarter is null
      or quarter between 1 and 4
    ),

  constraint epew_growth_metrics_period_check
    check (period_end >= period_start),

  constraint epew_growth_metrics_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_growth_metrics_business_id_idx
on public.epew_growth_metrics (business_id);

create index if not exists
  epew_growth_metrics_type_idx
on public.epew_growth_metrics (metric_type);

create index if not exists
  epew_growth_metrics_quarter_idx
on public.epew_growth_metrics (quarter);

create index if not exists
  epew_growth_metrics_period_start_idx
on public.epew_growth_metrics (period_start);

create index if not exists
  epew_growth_metrics_period_end_idx
on public.epew_growth_metrics (period_end desc);

create index if not exists
  epew_growth_metrics_created_at_idx
on public.epew_growth_metrics (created_at desc);

drop trigger if exists
  epew_growth_metrics_block_update
on public.epew_growth_metrics;

create trigger
  epew_growth_metrics_block_update
before update
on public.epew_growth_metrics
for each row
execute function public.epew_block_immutable_mutation();

drop trigger if exists
  epew_growth_metrics_block_delete
on public.epew_growth_metrics;

create trigger
  epew_growth_metrics_block_delete
before delete
on public.epew_growth_metrics
for each row
execute function public.epew_block_immutable_mutation();

/**
 * ============================================================
 * COACH MEETINGS
 * ============================================================
 */

create table if not exists public.epew_coach_meetings (
  id text primary key,

  business_id text not null,
  coach_id text,

  attended boolean not null default false,
  meeting_date timestamptz not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_coach_meetings_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_coach_meetings_business_id_idx
on public.epew_coach_meetings (business_id);

create index if not exists
  epew_coach_meetings_coach_id_idx
on public.epew_coach_meetings (coach_id);

create index if not exists
  epew_coach_meetings_date_idx
on public.epew_coach_meetings (meeting_date desc);

create index if not exists
  epew_coach_meetings_attended_idx
on public.epew_coach_meetings (attended);

create index if not exists
  epew_coach_meetings_created_at_idx
on public.epew_coach_meetings (created_at desc);

drop trigger if exists
  epew_coach_meetings_set_updated_at
on public.epew_coach_meetings;

create trigger
  epew_coach_meetings_set_updated_at
before update
on public.epew_coach_meetings
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * GROWTH MILESTONES
 * ============================================================
 */

create table if not exists public.epew_growth_milestones (
  id text primary key,

  business_id text not null,

  status text not null,
  target_metric text,
  target_date timestamptz not null,

  payload jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint epew_growth_milestones_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists
  epew_growth_milestones_business_id_idx
on public.epew_growth_milestones (business_id);

create index if not exists
  epew_growth_milestones_status_idx
on public.epew_growth_milestones (status);

create index if not exists
  epew_growth_milestones_target_metric_idx
on public.epew_growth_milestones (target_metric);

create index if not exists
  epew_growth_milestones_target_date_idx
on public.epew_growth_milestones (target_date);

create index if not exists
  epew_growth_milestones_created_at_idx
on public.epew_growth_milestones (created_at desc);

drop trigger if exists
  epew_growth_milestones_set_updated_at
on public.epew_growth_milestones;

create trigger
  epew_growth_milestones_set_updated_at
before update
on public.epew_growth_milestones
for each row
execute function public.epew_set_updated_at();

/**
 * ============================================================
 * ROW LEVEL SECURITY
 * ============================================================
 */

alter table public.epew_business_launch_plans
  enable row level security;

alter table public.epew_financial_transactions
  enable row level security;

alter table public.epew_compliance_records
  enable row level security;

alter table public.epew_business_registry
  enable row level security;

alter table public.epew_registry_history
  enable row level security;

alter table public.epew_communications
  enable row level security;

alter table public.epew_communication_history
  enable row level security;

alter table public.epew_growth_metrics
  enable row level security;

alter table public.epew_coach_meetings
  enable row level security;

alter table public.epew_growth_milestones
  enable row level security;

/**
 * ============================================================
 * BLOCK DIRECT CLIENT ACCESS
 * ============================================================
 *
 * The server-side Supabase service-role client may access these
 * tables. Browser clients remain blocked until role-specific RLS
 * policies are added.
 */

revoke all
on table public.epew_business_launch_plans
from anon, authenticated;

revoke all
on table public.epew_financial_transactions
from anon, authenticated;

revoke all
on table public.epew_compliance_records
from anon, authenticated;

revoke all
on table public.epew_business_registry
from anon, authenticated;

revoke all
on table public.epew_registry_history
from anon, authenticated;

revoke all
on table public.epew_communications
from anon, authenticated;

revoke all
on table public.epew_communication_history
from anon, authenticated;

revoke all
on table public.epew_growth_metrics
from anon, authenticated;

revoke all
on table public.epew_coach_meetings
from anon, authenticated;

revoke all
on table public.epew_growth_milestones
from anon, authenticated;

commit;