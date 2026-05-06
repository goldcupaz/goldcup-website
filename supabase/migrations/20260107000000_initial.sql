-- Gold Cup tournament schema
-- Run in Supabase SQL Editor or via supabase db push

begin;

create extension if not exists "pgcrypto";

-- Profiles (admin flag)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_letter text not null check (group_letter in ('A', 'B', 'C', 'D')),
  group_order smallint not null check (group_order between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists teams_group_idx on public.teams (group_letter);

alter table public.teams enable row level security;

create policy "teams_select_public" on public.teams for select using (true);

create policy "teams_write_admin" on public.teams for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- Players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists players_team_idx on public.players (team_id);

alter table public.players enable row level security;

create policy "players_select_public" on public.players for select using (true);

create policy "players_write_admin" on public.players for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group', 'qf', 'sf', 'final', 'third')),
  slot_code text unique,
  group_letter text check (group_letter is null or group_letter in ('A', 'B', 'C', 'D')),
  home_team_id uuid references public.teams (id) on delete set null,
  away_team_id uuid references public.teams (id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'not_started'
    check (status in ('not_started', 'live', 'half_time', 'full_time')),
  home_score int not null default 0 check (home_score >= 0),
  away_score int not null default 0 check (away_score >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_stage_idx on public.matches (stage);
create index if not exists matches_scheduled_idx on public.matches (scheduled_at);

alter table public.matches enable row level security;

create policy "matches_select_public" on public.matches for select using (true);

create policy "matches_write_admin" on public.matches for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- Goals
create table if not exists public.match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  scorer_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists match_goals_match_idx on public.match_goals (match_id);

alter table public.match_goals enable row level security;

create policy "match_goals_select_public" on public.match_goals for select using (true);

create policy "match_goals_write_admin" on public.match_goals for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- Site settings (e.g. featured live match)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

alter table public.site_settings enable row level security;

create policy "site_settings_select_public" on public.site_settings for select using (true);

create policy "site_settings_write_admin" on public.site_settings for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- updated_at trigger for matches
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on signup (all new users: not admin by default)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
