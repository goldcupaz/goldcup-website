-- Quarter-finals: May 24 2026 teams + kickoffs (UTC+4)

begin;

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000008',
  away_team_id = 'a0000001-0000-4000-8000-000000000006',
  scheduled_at = '2026-05-24 16:00:00+04'::timestamptz,
  sort_order = 100
where stage = 'qf' and slot_code = 'QF1';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000001',
  away_team_id = 'a0000001-0000-4000-8000-000000000004',
  scheduled_at = '2026-05-24 17:30:00+04'::timestamptz,
  sort_order = 101
where stage = 'qf' and slot_code = 'QF2';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000003',
  away_team_id = 'a0000001-0000-4000-8000-000000000007',
  scheduled_at = '2026-05-24 19:00:00+04'::timestamptz,
  sort_order = 102
where stage = 'qf' and slot_code = 'QF3';

update public.matches set
  home_team_id = 'a0000001-0000-4000-8000-000000000002',
  away_team_id = 'a0000001-0000-4000-8000-000000000005',
  scheduled_at = '2026-05-24 20:30:00+04'::timestamptz,
  sort_order = 103
where stage = 'qf' and slot_code = 'QF4';

commit;
