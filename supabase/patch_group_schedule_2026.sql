-- Gold Cup 2026 group stage kickoffs (wall times 10 / 11 / 23 May — stored as timestamptz UTC+4)
begin;

update public.matches set scheduled_at = '2026-05-10 16:00:00+04'::timestamptz where stage = 'group' and slot_code = 'GA-1';
update public.matches set scheduled_at = '2026-05-10 17:10:00+04'::timestamptz where stage = 'group' and slot_code = 'GC-1';
update public.matches set scheduled_at = '2026-05-10 18:20:00+04'::timestamptz where stage = 'group' and slot_code = 'GD-1';
update public.matches set scheduled_at = '2026-05-10 19:30:00+04'::timestamptz where stage = 'group' and slot_code = 'GB-1';

update public.matches set scheduled_at = '2026-05-11 16:00:00+04'::timestamptz where stage = 'group' and slot_code = 'GD-3';
update public.matches set scheduled_at = '2026-05-11 17:10:00+04'::timestamptz where stage = 'group' and slot_code = 'GC-3';
update public.matches set scheduled_at = '2026-05-11 18:20:00+04'::timestamptz where stage = 'group' and slot_code = 'GA-3';
update public.matches set scheduled_at = '2026-05-11 19:30:00+04'::timestamptz where stage = 'group' and slot_code = 'GB-3';

update public.matches set scheduled_at = '2026-05-23 16:00:00+04'::timestamptz where stage = 'group' and slot_code = 'GC-2';
update public.matches set scheduled_at = '2026-05-23 17:10:00+04'::timestamptz where stage = 'group' and slot_code = 'GB-2';
update public.matches set scheduled_at = '2026-05-23 18:20:00+04'::timestamptz where stage = 'group' and slot_code = 'GA-2';
update public.matches set scheduled_at = '2026-05-23 19:30:00+04'::timestamptz where stage = 'group' and slot_code = 'GD-2';

commit;
