-- Quarter-final kickoffs (wall times UTC+4; 10 min buffer between games)
-- QF1 16:00 · QF2 17:30 · QF3 19:00 · QF4 20:30 — all 20 June 2026

begin;

update public.matches set scheduled_at = '2026-06-20 16:00:00+04'::timestamptz
where stage = 'qf' and slot_code = 'QF1';

update public.matches set scheduled_at = '2026-06-20 17:30:00+04'::timestamptz
where stage = 'qf' and slot_code = 'QF2';

update public.matches set scheduled_at = '2026-06-20 19:00:00+04'::timestamptz
where stage = 'qf' and slot_code = 'QF3';

update public.matches set scheduled_at = '2026-06-20 20:30:00+04'::timestamptz
where stage = 'qf' and slot_code = 'QF4';

commit;
