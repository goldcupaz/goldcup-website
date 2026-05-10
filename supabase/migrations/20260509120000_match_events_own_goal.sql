-- Allow own_goal timeline events (player's team scores for opponent)
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
    'full_time'
  )
);

commit;
