create table if not exists public.epew_operational_history (
  id uuid primary key default gen_random_uuid(),
  application_id bigint references public.entrepreneur_applications(id) on delete set null,
  entrepreneur_user_id uuid,
  event_type text not null,
  event_name text not null,
  event_description text,
  previous_status text,
  new_status text,
  occurred_at timestamptz not null default now(),

  actor_user_id uuid,
  actor_role text,
  actor_type text not null default 'system_automation',
  actor_name text,

  decision_made_by_user_id uuid,
  decision_made_by_role text,
  decision_made_by_type text,
  decision_made_by_name text,
  decision_organization text,
  decision_reason text,
  decision_at timestamptz,

  executed_by text,
  recorded_by text not null default 'EPEW EDE / IBOS',
  source_system text,
  communication_channel text,
  reference_type text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.epew_operational_history enable row level security;

create index if not exists idx_epew_operational_history_application_time
  on public.epew_operational_history(application_id, occurred_at desc);
create index if not exists idx_epew_operational_history_user_time
  on public.epew_operational_history(entrepreneur_user_id, occurred_at desc);
create index if not exists idx_epew_operational_history_event_type
  on public.epew_operational_history(event_type);
create index if not exists idx_epew_operational_history_decision_type
  on public.epew_operational_history(decision_made_by_type);
create index if not exists idx_epew_operational_history_reference
  on public.epew_operational_history(reference_type, reference_id);

alter table public.entrepreneur_applications
  add column if not exists application_submitted_at timestamptz;

update public.entrepreneur_applications
set application_submitted_at = created_at
where application_submitted_at is null;

create or replace function public.prevent_epew_operational_history_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'EPEW operational history is immutable; updates and deletes are not permitted.';
end;
$$;

drop trigger if exists trg_prevent_epew_operational_history_update on public.epew_operational_history;
create trigger trg_prevent_epew_operational_history_update
before update on public.epew_operational_history
for each row execute function public.prevent_epew_operational_history_mutation();

drop trigger if exists trg_prevent_epew_operational_history_delete on public.epew_operational_history;
create trigger trg_prevent_epew_operational_history_delete
before delete on public.epew_operational_history
for each row execute function public.prevent_epew_operational_history_mutation();

create or replace function public.record_entrepreneur_application_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.epew_operational_history (
      application_id, entrepreneur_user_id, event_type, event_name,
      event_description, occurred_at, actor_type, executed_by, source_system,
      reference_type, reference_id, metadata
    ) values (
      new.id, new.user_id, 'application_submitted', 'Application Submitted',
      'Entrepreneur application submitted to EPEW.',
      coalesce(new.application_submitted_at, new.created_at, now()),
      'entrepreneur', 'Entrepreneur Application Engine', 'EPEW Application',
      'entrepreneur_application', new.id::text,
      jsonb_build_object('status', new.status)
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.epew_operational_history (
        application_id, entrepreneur_user_id, event_type, event_name,
        previous_status, new_status, occurred_at, actor_type,
        executed_by, source_system, reference_type, reference_id
      ) values (
        new.id, new.user_id, 'application_status_changed', 'Application Status Changed',
        old.status, new.status, now(), 'system_automation',
        'Application Workflow Engine', 'EPEW Application',
        'entrepreneur_application', new.id::text
      );
    end if;

    if new.questionnaire_status is distinct from old.questionnaire_status then
      insert into public.epew_operational_history (
        application_id, entrepreneur_user_id, event_type, event_name,
        previous_status, new_status, occurred_at, actor_type,
        executed_by, source_system, reference_type, reference_id
      ) values (
        new.id, new.user_id, 'questionnaire_status_changed', 'Entrepreneur Questionnaire Status Changed',
        old.questionnaire_status, new.questionnaire_status, now(), 'system_automation',
        'Questionnaire Workflow Engine', 'EPEW Questionnaire',
        'entrepreneur_application', new.id::text
      );
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_record_entrepreneur_application_history on public.entrepreneur_applications;
create trigger trg_record_entrepreneur_application_history
after insert or update on public.entrepreneur_applications
for each row execute function public.record_entrepreneur_application_history();;
