alter table public.epew_no_show_recovery_cases
drop constraint if exists epew_no_show_recovery_cases_status_check;

alter table public.epew_no_show_recovery_cases
add constraint epew_no_show_recovery_cases_status_check
check (
  status = any (
    array[
      'active'::text,
      'responded'::text,
      'rescheduled'::text,
      'completed'::text,
      'closed_due_to_inactivity'::text,
      'cancelled'::text
    ]
  )
);
