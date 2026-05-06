-- Optional: enable Postgres changes for Supabase Realtime (run if live updates do not stream)
-- Dashboard: Database → Replication → enable tables, or:

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_goals;
alter publication supabase_realtime add table public.site_settings;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.players;
