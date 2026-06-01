-- SF / final / third place kickoff times (UTC+4)
-- SF1 18:00 · SF2 19:30 · Third 18:00 · Final 20:00

begin;

update public.matches set scheduled_at = '2026-05-30 18:00:00+04'::timestamptz
where stage = 'sf' and slot_code = 'SF1';

update public.matches set scheduled_at = '2026-05-30 19:30:00+04'::timestamptz
where stage = 'sf' and slot_code = 'SF2';

update public.matches set scheduled_at = '2026-06-07 18:00:00+04'::timestamptz
where stage = 'third' and slot_code = 'THIRD';

update public.matches set scheduled_at = '2026-06-07 20:00:00+04'::timestamptz
where stage = 'final' and slot_code = 'FINAL';

commit;
