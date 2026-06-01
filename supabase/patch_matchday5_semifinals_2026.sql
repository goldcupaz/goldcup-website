-- Matchday 5 semifinals + penalty columns + QF2 correction (paste in Supabase SQL Editor)

begin;

alter table public.matches
  add column if not exists home_penalties smallint check (home_penalties is null or home_penalties >= 0),
  add column if not exists away_penalties smallint check (away_penalties is null or away_penalties >= 0);

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000011',
  away_team_id = 'a0000001-0000-4000-8000-000000000004'
where stage = 'qf' and slot_code = 'QF2';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000003',
  away_team_id = 'a0000001-0000-4000-8000-000000000006',
  scheduled_at = '2026-05-30 18:00:00+04'::timestamptz,
  sort_order = 200
where stage = 'sf' and slot_code = 'SF1';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000005',
  away_team_id = 'a0000001-0000-4000-8000-000000000011',
  scheduled_at = '2026-05-30 19:30:00+04'::timestamptz,
  sort_order = 201
where stage = 'sf' and slot_code = 'SF2';

commit;
