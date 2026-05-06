-- Reassign groups + group-stage fixtures (same stable team/match UUIDs).
-- Run in SQL Editor if DB already exists and you do not want to re-run full seed.
--
-- A1 Sahil FC · A2 132-134 MFC · A3 Cobras Locas
-- B1 MTK Eagles · B2 Sambo FC · B3 Sparta Nova
-- C1 Sabis Tigers · C2 Blue Phoenix · C3 Ebra FC
-- D1 Star Eagles · D2 EAS Saints · D3 Shusha Falcons

begin;

update public.teams set group_letter = 'A', group_order = 1 where id = 'a0000001-0000-4000-8000-000000000002'; -- Sahil FC
update public.teams set group_letter = 'A', group_order = 2 where id = 'a0000001-0000-4000-8000-000000000007'; -- 132-134 MFC
update public.teams set group_letter = 'A', group_order = 3 where id = 'a0000001-0000-4000-8000-000000000009'; -- Cobras Locas

update public.teams set group_letter = 'B', group_order = 1 where id = 'a0000001-0000-4000-8000-000000000003'; -- MTK Eagles
update public.teams set group_letter = 'B', group_order = 2 where id = 'a0000001-0000-4000-8000-000000000005'; -- Sambo FC
update public.teams set group_letter = 'B', group_order = 3 where id = 'a0000001-0000-4000-8000-000000000010'; -- Sparta Nova

update public.teams set group_letter = 'C', group_order = 1 where id = 'a0000001-0000-4000-8000-000000000001'; -- Sabis Tigers
update public.teams set group_letter = 'C', group_order = 2 where id = 'a0000001-0000-4000-8000-000000000008'; -- Blue Phoenix
update public.teams set group_letter = 'C', group_order = 3 where id = 'a0000001-0000-4000-8000-000000000011'; -- Ebra FC

update public.teams set group_letter = 'D', group_order = 1 where id = 'a0000001-0000-4000-8000-000000000004'; -- Star Eagles
update public.teams set group_letter = 'D', group_order = 2 where id = 'a0000001-0000-4000-8000-000000000006'; -- EAS Saints
update public.teams set group_letter = 'D', group_order = 3 where id = 'a0000001-0000-4000-8000-000000000012'; -- Shusha Falcons

update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000002', away_team_id = 'a0000001-0000-4000-8000-000000000007' where slot_code = 'GA-1';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000002', away_team_id = 'a0000001-0000-4000-8000-000000000009' where slot_code = 'GA-2';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000007', away_team_id = 'a0000001-0000-4000-8000-000000000009' where slot_code = 'GA-3';

update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000003', away_team_id = 'a0000001-0000-4000-8000-000000000005' where slot_code = 'GB-1';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000003', away_team_id = 'a0000001-0000-4000-8000-000000000010' where slot_code = 'GB-2';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000005', away_team_id = 'a0000001-0000-4000-8000-000000000010' where slot_code = 'GB-3';

update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000001', away_team_id = 'a0000001-0000-4000-8000-000000000008' where slot_code = 'GC-1';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000001', away_team_id = 'a0000001-0000-4000-8000-000000000011' where slot_code = 'GC-2';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000008', away_team_id = 'a0000001-0000-4000-8000-000000000011' where slot_code = 'GC-3';

update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000004', away_team_id = 'a0000001-0000-4000-8000-000000000006' where slot_code = 'GD-1';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000004', away_team_id = 'a0000001-0000-4000-8000-000000000012' where slot_code = 'GD-2';
update public.matches set home_team_id = 'a0000001-0000-4000-8000-000000000006', away_team_id = 'a0000001-0000-4000-8000-000000000012' where slot_code = 'GD-3';

commit;
