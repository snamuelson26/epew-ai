insert into public.epew_coach_schedule_windows (
  coach_id,
  day_of_week,
  available_from,
  available_until,
  is_overnight,
  timezone,
  is_active,
  effective_from
)
select
  '57f441d4-8e75-4987-9a33-7e08b3e90890'::uuid,
  d.day_of_week,
  '09:00'::time,
  '17:00'::time,
  false,
  'America/New_York',
  true,
  current_date
from generate_series(0, 6) as d(day_of_week)
where not exists (
  select 1
  from public.epew_coach_schedule_windows w
  where w.coach_id = '57f441d4-8e75-4987-9a33-7e08b3e90890'::uuid
    and w.day_of_week = d.day_of_week
    and w.available_from = '09:00'::time
    and w.available_until = '17:00'::time
    and w.is_active = true
);
