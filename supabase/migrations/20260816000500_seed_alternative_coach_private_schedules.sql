-- EPEW EMCC
-- 24/7 private Coach scheduling foundation
-- One 24-hour availability window per day, seven days per week.

delete from public.epew_coach_schedule_windows
where coach_id in (
  '57f441d4-8e75-4987-9a33-7e08b3e90890'::uuid, -- Daniel Pierre
  'd4eb0cd5-97ee-4f91-8027-4242fbdf1595'::uuid, -- Olivia Martin
  'af11677e-b392-411f-b207-c76910a7e76d'::uuid, -- Sophia Bennett
  'fb197c26-6a79-49be-baad-f1b3abc15b95'::uuid  -- Michael Laurent
);

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
  coaches.coach_id,
  d.day_of_week,
  '00:00'::time,
  '00:00'::time,
  true,
  'America/New_York',
  true,
  current_date
from (
  values
    ('57f441d4-8e75-4987-9a33-7e08b3e90890'::uuid),
    ('d4eb0cd5-97ee-4f91-8027-4242fbdf1595'::uuid),
    ('af11677e-b392-411f-b207-c76910a7e76d'::uuid),
    ('fb197c26-6a79-49be-baad-f1b3abc15b95'::uuid)
) as coaches(coach_id)
cross join generate_series(0, 6) as d(day_of_week);
