-- Disciplinary points deduction (standings only; does not alter match stats)
--
-- Writes to teams remain restricted by existing policy teams_write_admin (is_admin only).
-- Anonymous and non-admin sessions cannot update teams; volunteer portal has no access here.

alter table public.teams
  add column if not exists points_deduction integer not null default 0;

alter table public.teams
  drop constraint if exists teams_points_deduction_non_negative;

alter table public.teams
  add constraint teams_points_deduction_non_negative check (points_deduction >= 0);

comment on column public.teams.points_deduction is
  'Points subtracted from standings only (match W/D/L and goals unchanged). Editable by admins via teams RLS.';
