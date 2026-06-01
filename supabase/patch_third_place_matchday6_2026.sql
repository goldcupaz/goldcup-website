-- Third place match on Matchday 6 + optional venue column
-- Run in Supabase SQL Editor.

begin;

alter table public.matches add column if not exists venue text;

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000011',
  away_team_id = 'a0000001-0000-4000-8000-000000000006',
  scheduled_at = '2026-06-07 16:00:00+04'::timestamptz,
  sort_order = 299
where stage = 'third' and slot_code = 'THIRD';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000003',
  away_team_id = 'a0000001-0000-4000-8000-000000000005',
  scheduled_at = '2026-06-07 19:00:00+04'::timestamptz,
  sort_order = 300
where stage = 'final' and slot_code = 'FINAL';

commit;
