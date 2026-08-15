-- =========================================================
-- EPEW – EDE – IBOS
-- Participant Availability Timezone
-- =========================================================

alter table public.epew_participant_availability
add column if not exists participant_timezone text
not null
default 'America/New_York';

comment on column public.epew_participant_availability.participant_timezone is
'Timezone used to interpret the participant-submitted availability windows for private EMCC scheduling.';
