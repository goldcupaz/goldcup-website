-- Production patch: QF2 teams, final fixture, penalty shootout event types
-- Run in Supabase SQL Editor after other Gold Cup patches.

begin;

alter table public.match_events drop constraint if exists match_events_event_type_check;

alter table public.match_events add constraint match_events_event_type_check check (
  event_type in (
    'match_started',
    'goal',
    'own_goal',
    'half_time',
    'yellow_card',
    'red_card',
    'full_time',
    'penalty_scored',
    'penalty_missed'
  )
);

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000011',
  away_team_id = 'a0000001-0000-4000-8000-000000000004'
where stage = 'qf' and slot_code = 'QF2';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000003',
  away_team_id = 'a0000001-0000-4000-8000-000000000005',
  scheduled_at = '2026-06-07 19:00:00+04'::timestamptz,
  sort_order = 300
where stage = 'final' and slot_code = 'FINAL';

commit;
