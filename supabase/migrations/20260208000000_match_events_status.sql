-- Match status: first half / second half live + timeline events table
-- Run once in Supabase SQL Editor (or supabase db push)

begin;

-- ---------------------------------------------------------------------------
-- match_events (ordered timeline per match)
-- ---------------------------------------------------------------------------
create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'match_started',
      'goal',
      'half_time',
      'yellow_card',
      'red_card',
      'full_time'
    )
  ),
  team_id uuid references public.teams (id) on delete set null,
  player_name text,
  event_order int not null default 0,
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

-- ---------------------------------------------------------------------------
-- matches.status: replace live with first/second half
-- ---------------------------------------------------------------------------
alter table public.matches drop constraint if exists matches_status_check;

update public.matches set status = 'live_first_half' where status = 'live';

alter table public.matches
  add constraint matches_status_check check (
    status in (
      'not_started',
      'live_first_half',
      'half_time',
      'live_second_half',
      'full_time'
    )
  );

-- Realtime (safe if already added, e.g. after running 20260107000001_realtime.sql)
do $pub$
begin
  alter publication supabase_realtime add table public.match_events;
exception
  when duplicate_object then null;
end
$pub$;

commit;
