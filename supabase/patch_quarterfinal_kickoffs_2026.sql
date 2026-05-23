-- Gold Cup 2026 quarter-final kickoffs (paste in Supabase SQL Editor)
-- Wall times UTC+4; 10-minute buffers: 17:20→17:30, 18:50→19:00, 20:20→20:30

begin;

update public.matches set scheduled_at = '2026-06-20 16:00:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF1';
update public.matches set scheduled_at = '2026-06-20 17:30:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF2';
update public.matches set scheduled_at = '2026-06-20 19:00:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF3';
update public.matches set scheduled_at = '2026-06-20 20:30:00+04'::timestamptz where stage = 'qf' and slot_code = 'QF4';

commit;
