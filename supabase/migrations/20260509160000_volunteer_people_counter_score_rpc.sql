-- Volunteer flag, entrance people counter, server-side match score recompute (fixes own-goal edits)
begin;

-- ---------------------------------------------------------------------------
-- profiles.is_volunteer
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists is_volunteer boolean not null default false;

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

-- ---------------------------------------------------------------------------
-- Entrance people counter (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.people_counter (
  id text primary key,
  count int not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

insert into public.people_counter (id, count) values ('singleton', 0)
on conflict (id) do nothing;

alter table public.people_counter enable row level security;

drop policy if exists "people_counter_select_public" on public.people_counter;
create policy "people_counter_select_public" on public.people_counter for select using (true);

-- No direct writes: use RPCs below (security definer)

-- ---------------------------------------------------------------------------
-- RPC: adjust people counter (+1 / -1)
-- ---------------------------------------------------------------------------
create or replace function public.people_counter_adjust(p_delta int)
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  ok boolean;
  newc int;
begin
  select coalesce(p.is_admin or p.is_volunteer, false)
  into ok
  from public.profiles p
  where p.id = auth.uid();

  if not ok then
    raise exception 'not authorized';
  end if;

  update public.people_counter
  set
    count = greatest(0, count + coalesce(p_delta, 0)),
    updated_at = now()
  where id = 'singleton'
  returning count into newc;

  return coalesce(newc, 0);
end;
$$;

comment on function public.people_counter_adjust(int) is 'Volunteers/admins: atomically change entrance count.';

revoke all on function public.people_counter_adjust(int) from public;
grant execute on function public.people_counter_adjust(int) to authenticated;
grant execute on function public.people_counter_adjust(int) to service_role;

-- ---------------------------------------------------------------------------
-- RPC: reset people counter
-- ---------------------------------------------------------------------------
create or replace function public.people_counter_reset()
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  ok boolean;
  newc int;
begin
  select coalesce(p.is_admin or p.is_volunteer, false)
  into ok
  from public.profiles p
  where p.id = auth.uid();

  if not ok then
    raise exception 'not authorized';
  end if;

  update public.people_counter
  set count = 0, updated_at = now()
  where id = 'singleton'
  returning count into newc;

  return coalesce(newc, 0);
end;
$$;

revoke all on function public.people_counter_reset() from public;
grant execute on function public.people_counter_reset() to authenticated;
grant execute on function public.people_counter_reset() to service_role;

-- ---------------------------------------------------------------------------
-- RPC: recompute match score from goal + own_goal events (admin only)
-- ---------------------------------------------------------------------------
create or replace function public.recompute_match_score_from_events(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  hid uuid;
  aid uuid;
  nh int := 0;
  na int := 0;
  rec record;
  admin_ok boolean;
begin
  select coalesce(p.is_admin, false)
  into admin_ok
  from public.profiles p
  where p.id = auth.uid();

  if not admin_ok then
    raise exception 'not authorized';
  end if;

  select m.home_team_id, m.away_team_id
  into hid, aid
  from public.matches m
  where m.id = p_match_id;

  if hid is null or aid is null then
    return;
  end if;

  for rec in
    select e.event_type, e.team_id
    from public.match_events e
    where e.match_id = p_match_id
  loop
    if rec.event_type = 'goal' and rec.team_id is not null then
      if rec.team_id = hid then
        nh := nh + 1;
      elsif rec.team_id = aid then
        na := na + 1;
      end if;
    elsif rec.event_type = 'own_goal' and rec.team_id is not null then
      if rec.team_id = hid then
        na := na + 1;
      elsif rec.team_id = aid then
        nh := nh + 1;
      end if;
    end if;
  end loop;

  update public.matches
  set home_score = nh, away_score = na, updated_at = now()
  where id = p_match_id;
end;
$$;

comment on function public.recompute_match_score_from_events(uuid) is 'Admin: set match scores from timeline goal + own_goal rows.';

revoke all on function public.recompute_match_score_from_events(uuid) from public;
grant execute on function public.recompute_match_score_from_events(uuid) to authenticated;
grant execute on function public.recompute_match_score_from_events(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $pub$
begin
  alter publication supabase_realtime add table public.people_counter;
exception
  when duplicate_object then null;
end
$pub$;

commit;
