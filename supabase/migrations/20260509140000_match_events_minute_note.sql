-- Optional minute and note on timeline events (admin + display)
begin;

alter table public.match_events add column if not exists event_minute int;
alter table public.match_events add column if not exists event_note text;

commit;
