-- ============================================================================
-- Gold Cup — full schema + seed (paste entire file into Supabase SQL Editor → Run)
--
-- Safe to re-run for schema/policies (idempotent drops). The SEED section DELETES
-- all rows in match_events, match_goals, matches, players, teams and re-inserts Gold Cup data.
-- Does not delete auth users or profiles.
--
-- Tables:
--   public.profiles     — ties auth.users to is_admin (RLS)
--   public.teams        — clubs; GROUPS are modeled as teams.group_letter ∈ {A,B,C,D} (no separate groups table)
--   public.players      — roster per team (shown on Teams tab)
--   public.matches      — group stage + knockout (QF/SF/Final/3rd); STANDINGS are computed in the app from these rows
--   public.match_goals  — legacy goal rows (optional; Live tab uses match_events)
--   public.match_events — ordered timeline per match (goals, cards, match started / half / full time)
--   public.site_settings — featured live match id (JSON {"id":"<uuid>"} or {"id":null})
--
-- After running: refresh the website. Optionally run supabase/migrations/20260107000001_realtime.sql for realtime.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

/* ---------------------------------------------------------------------------
   profiles
--------------------------------------------------------------------------- */
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  is_volunteer boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_volunteer boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

/* ---------------------------------------------------------------------------
   teams
--------------------------------------------------------------------------- */
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_letter text not null check (group_letter in ('A', 'B', 'C', 'D')),
  group_order smallint not null check (group_order between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists teams_group_idx on public.teams (group_letter);

alter table public.teams enable row level security;

drop policy if exists "teams_select_public" on public.teams;
create policy "teams_select_public" on public.teams for select using (true);

drop policy if exists "teams_write_admin" on public.teams;
create policy "teams_write_admin" on public.teams for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   players
--------------------------------------------------------------------------- */
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists players_team_idx on public.players (team_id);

alter table public.players enable row level security;

drop policy if exists "players_select_public" on public.players;
create policy "players_select_public" on public.players for select using (true);

drop policy if exists "players_write_admin" on public.players;
create policy "players_write_admin" on public.players for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   matches
--------------------------------------------------------------------------- */
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group', 'qf', 'sf', 'final', 'third')),
  slot_code text unique,
  group_letter text check (group_letter is null or group_letter in ('A', 'B', 'C', 'D')),
  home_team_id uuid references public.teams (id) on delete set null,
  away_team_id uuid references public.teams (id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'not_started'
    check (
      status in (
        'not_started',
        'live_first_half',
        'half_time',
        'live_second_half',
        'full_time'
      )
    ),
  home_score int not null default 0 check (home_score >= 0),
  away_score int not null default 0 check (away_score >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_stage_idx on public.matches (stage);
create index if not exists matches_scheduled_idx on public.matches (scheduled_at);

alter table public.matches enable row level security;

drop policy if exists "matches_select_public" on public.matches;
create policy "matches_select_public" on public.matches for select using (true);

drop policy if exists "matches_write_admin" on public.matches;
create policy "matches_write_admin" on public.matches for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   match_goals (scorers shown on Live tab / admin)
--------------------------------------------------------------------------- */
create table if not exists public.match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  scorer_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists match_goals_match_idx on public.match_goals (match_id);

alter table public.match_goals enable row level security;

drop policy if exists "match_goals_select_public" on public.match_goals;
create policy "match_goals_select_public" on public.match_goals for select using (true);

drop policy if exists "match_goals_write_admin" on public.match_goals;
create policy "match_goals_write_admin" on public.match_goals for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   match_events (ordered live timeline)
--------------------------------------------------------------------------- */
create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'match_started',
      'goal',
      'own_goal',
      'half_time',
      'yellow_card',
      'red_card',
      'full_time'
    )
  ),
  team_id uuid references public.teams (id) on delete set null,
  player_name text,
  event_order int not null default 0,
  event_minute int,
  event_note text,
  created_at timestamptz not null default now()
);

create index if not exists match_events_match_order_idx on public.match_events (match_id, event_order, created_at);

alter table public.match_events enable row level security;

drop policy if exists "match_events_select_public" on public.match_events;
create policy "match_events_select_public" on public.match_events for select using (true);

drop policy if exists "match_events_write_admin" on public.match_events;
create policy "match_events_write_admin" on public.match_events for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   site_settings
--------------------------------------------------------------------------- */
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings for select using (true);

drop policy if exists "site_settings_write_admin" on public.site_settings;
create policy "site_settings_write_admin" on public.site_settings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

/* ---------------------------------------------------------------------------
   triggers
--------------------------------------------------------------------------- */
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row
  execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin, is_volunteer)
  values (new.id, false, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

/* ===========================================================================
   SEED — Gold Cup 12 teams, group fixtures, knockout shells
   Slot map (group_order 1..3 = X1, X2, X3):
     A1 Sahil FC · A2 132-134 MFC · A3 Cobras Locas
     B1 MTK Eagles · B2 Sambo FC · B3 Sparta Nova
     C1 Sabis Tigers · C2 Blue Phoenix · C3 Ebra FC
     D1 Star Eagles · D2 EAS Saints · D3 Shusha Falcons
   =========================================================================== */

delete from public.match_events;
delete from public.match_goals;
delete from public.matches;
delete from public.players;
delete from public.teams;

insert into public.teams (id, name, group_letter, group_order) values
  ('a0000001-0000-4000-8000-000000000001', 'Sabis Tigers',    'C', 1),
  ('a0000001-0000-4000-8000-000000000002', 'Sahil FC',        'A', 1),
  ('a0000001-0000-4000-8000-000000000003', 'MTK Eagles',      'B', 1),
  ('a0000001-0000-4000-8000-000000000004', 'Star Eagles',     'D', 1),
  ('a0000001-0000-4000-8000-000000000005', 'Sambo FC',        'B', 2),
  ('a0000001-0000-4000-8000-000000000006', 'EAS Saints',      'D', 2),
  ('a0000001-0000-4000-8000-000000000007', '132-134 MFC',     'A', 2),
  ('a0000001-0000-4000-8000-000000000008', 'Blue Phoenix',    'C', 2),
  ('a0000001-0000-4000-8000-000000000009', 'Cobras Locas',    'A', 3),
  ('a0000001-0000-4000-8000-000000000010', 'Sparta Nova',     'B', 3),
  ('a0000001-0000-4000-8000-000000000011', 'Ebra FC',         'C', 3),
  ('a0000001-0000-4000-8000-000000000012', 'Shusha Falcons',  'D', 3);

-- Placeholder roster (Teams tab): Player 1–10 per squad (edit in admin anytime)
insert into public.players (team_id, name, sort_order)
select t.id, 'Player ' || g.n::text, g.n
from public.teams t
cross join generate_series(1, 10) as g(n);

-- Group stage: round-robin (+ official 2026 kickoffs, local UTC+4 — see MATCHDAY comments)
insert into public.matches (id, stage, slot_code, group_letter, home_team_id, away_team_id, scheduled_at, status, home_score, away_score, sort_order) values
  ('b0000001-0000-4000-8000-000000000001', 'group', 'GA-1', 'A', 'a0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000007', '2026-05-10 16:00:00+04', 'not_started', 0, 0, 10),
  ('b0000001-0000-4000-8000-000000000002', 'group', 'GA-2', 'A', 'a0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000009', '2026-05-23 18:20:00+04', 'not_started', 0, 0, 11),
  ('b0000001-0000-4000-8000-000000000003', 'group', 'GA-3', 'A', 'a0000001-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000009', '2026-05-11 18:20:00+04', 'not_started', 0, 0, 12),
  ('b0000001-0000-4000-8000-000000000004', 'group', 'GB-1', 'B', 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000005', '2026-05-10 19:30:00+04', 'not_started', 0, 0, 20),
  ('b0000001-0000-4000-8000-000000000005', 'group', 'GB-2', 'B', 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000010', '2026-05-23 17:10:00+04', 'not_started', 0, 0, 21),
  ('b0000001-0000-4000-8000-000000000006', 'group', 'GB-3', 'B', 'a0000001-0000-4000-8000-000000000005', 'a0000001-0000-4000-8000-000000000010', '2026-05-11 19:30:00+04', 'not_started', 0, 0, 22),
  ('b0000001-0000-4000-8000-000000000007', 'group', 'GC-1', 'C', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000008', '2026-05-10 17:10:00+04', 'not_started', 0, 0, 30),
  ('b0000001-0000-4000-8000-000000000008', 'group', 'GC-2', 'C', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000011', '2026-05-23 16:00:00+04', 'not_started', 0, 0, 31),
  ('b0000001-0000-4000-8000-000000000009', 'group', 'GC-3', 'C', 'a0000001-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000011', '2026-05-11 17:10:00+04', 'not_started', 0, 0, 32),
  ('b0000001-0000-4000-8000-000000000010', 'group', 'GD-1', 'D', 'a0000001-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000006', '2026-05-10 18:20:00+04', 'not_started', 0, 0, 40),
  ('b0000001-0000-4000-8000-000000000011', 'group', 'GD-2', 'D', 'a0000001-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000012', '2026-05-23 19:30:00+04', 'not_started', 0, 0, 41),
  ('b0000001-0000-4000-8000-000000000012', 'group', 'GD-3', 'D', 'a0000001-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000012', '2026-05-11 16:00:00+04', 'not_started', 0, 0, 42);

-- Knockout (fixed QF bracket; SF/Final/3rd synced from results via admin)
insert into public.matches (id, stage, slot_code, group_letter, home_team_id, away_team_id, scheduled_at, status, home_score, away_score, sort_order) values
  ('c0000001-0000-4000-8000-000000000001', 'qf', 'QF1', null, 'a0000001-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000006', '2026-05-24 16:00:00+04', 'not_started', 0, 0, 100),
  ('c0000001-0000-4000-8000-000000000002', 'qf', 'QF2', null, 'a0000001-0000-4000-8000-000000000011', 'a0000001-0000-4000-8000-000000000004', '2026-05-24 17:30:00+04', 'not_started', 0, 0, 101),
  ('c0000001-0000-4000-8000-000000000003', 'qf', 'QF3', null, 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000007', '2026-05-24 19:00:00+04', 'not_started', 0, 0, 102),
  ('c0000001-0000-4000-8000-000000000004', 'qf', 'QF4', null, 'a0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000005', '2026-05-24 20:30:00+04', 'not_started', 0, 0, 103),
  ('c0000001-0000-4000-8000-000000000005', 'sf', 'SF1', null, 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000006', '2026-05-30 18:00:00+04', 'not_started', 0, 0, 200),
  ('c0000001-0000-4000-8000-000000000006', 'sf', 'SF2', null, 'a0000001-0000-4000-8000-000000000005', 'a0000001-0000-4000-8000-000000000011', '2026-05-30 19:30:00+04', 'not_started', 0, 0, 201),
  ('c0000001-0000-4000-8000-000000000008', 'third', 'THIRD', null, 'a0000001-0000-4000-8000-000000000011', 'a0000001-0000-4000-8000-000000000006', '2026-06-07 18:00:00+04', 'not_started', 0, 0, 299),
  ('c0000001-0000-4000-8000-000000000007', 'final', 'FINAL', null, 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000005', '2026-06-07 20:00:00+04', 'not_started', 0, 0, 300);

insert into public.site_settings (key, value) values
  ('current_live_match_id', '{"id": null}'::jsonb)
on conflict (key) do update set value = excluded.value;

commit;
