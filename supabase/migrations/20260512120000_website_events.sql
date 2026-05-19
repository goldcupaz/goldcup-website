-- Website analytics events (public insert, admin read)

begin;

create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists website_events_created_idx on public.website_events (created_at desc);
create index if not exists website_events_name_idx on public.website_events (event_name);
create index if not exists website_events_page_path_idx on public.website_events (page_path) where page_path is not null;

alter table public.website_events enable row level security;

drop policy if exists "website_events_insert_public" on public.website_events;
create policy "website_events_insert_public" on public.website_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "website_events_select_admin" on public.website_events;
create policy "website_events_select_admin" on public.website_events
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

comment on table public.website_events is 'Anonymous website analytics; admins read via dashboard.';

commit;
