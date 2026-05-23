-- Deprecated: use patch_quarterfinal_fixtures_full_2026.sql (teams + kickoffs together).
-- Gold Cup 2026 quarter-final kickoffs only (wall times UTC+4)

begin;

update public.matches set scheduled_at = '2026-06-20 16:00:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF1';
update public.matches set scheduled_at = '2026-06-20 17:30:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF2';
update public.matches set scheduled_at = '2026-06-20 19:00:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF3';
update public.matches set scheduled_at = '2026-06-20 20:30:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF4';

commit;
