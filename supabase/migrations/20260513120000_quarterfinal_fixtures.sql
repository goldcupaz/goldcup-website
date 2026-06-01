-- Fixed quarter-final matchups (no pot draw)
-- QF1 C1 vs D2 · QF2 D1 vs C2 · QF3 B1 vs A2 · QF4 A1 vs B2

begin;

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000008',
  away_team_id = 'a0000001-0000-4000-8000-000000000006',
  scheduled_at = '2026-05-24 16:00:00+04'::timestamptz,
  sort_order = 100
where slot_code = 'QF1' and stage = 'qf';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000011',
  away_team_id = 'a0000001-0000-4000-8000-000000000004',
  scheduled_at = '2026-05-24 17:30:00+04'::timestamptz,
  sort_order = 101
where slot_code = 'QF2' and stage = 'qf';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000003',
  away_team_id = 'a0000001-0000-4000-8000-000000000007',
  scheduled_at = '2026-05-24 19:00:00+04'::timestamptz,
  sort_order = 102
where slot_code = 'QF3' and stage = 'qf';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000002',
  away_team_id = 'a0000001-0000-4000-8000-000000000005',
  scheduled_at = '2026-05-24 20:30:00+04'::timestamptz,
  sort_order = 103
where slot_code = 'QF4' and stage = 'qf';

commit;
