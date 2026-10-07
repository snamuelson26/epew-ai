create table public.epew_interaction_survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('account_creation')),
  account_role text not null check (account_role in ('entrepreneur', 'supporter', 'coach', 'partner')),
  status text not null check (status in ('submitted', 'skipped')),
  overall_satisfaction smallint check (overall_satisfaction between 1 and 5),
  goal_reached text check (goal_reached in ('yes', 'partly', 'no')),
  next_step_clarity smallint check (next_step_clarity between 1 and 5),
  help_satisfaction smallint check (help_satisfaction between 1 and 5),
  recommendation_score smallint check (recommendation_score between 0 and 10),
  discussion_clarity smallint check (discussion_clarity between 1 and 5),
  comments text check (char_length(comments) <= 2000),
  created_at timestamptz not null default now(),
  constraint epew_interaction_survey_once_per_account_role
    unique (user_id, interaction_type, account_role),
  constraint epew_interaction_survey_complete_response check (
    status = 'skipped' or (
      overall_satisfaction is not null and goal_reached is not null and
      next_step_clarity is not null and help_satisfaction is not null and
      recommendation_score is not null and discussion_clarity is not null
    )
  )
);

alter table public.epew_interaction_survey_responses enable row level security;
revoke all on public.epew_interaction_survey_responses from anon, authenticated;
grant select, insert on public.epew_interaction_survey_responses to authenticated;

create policy "Read own interaction surveys"
on public.epew_interaction_survey_responses for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Record own interaction survey once"
on public.epew_interaction_survey_responses for insert to authenticated
with check ((select auth.uid()) = user_id);
