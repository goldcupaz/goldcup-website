alter table public.teams
add column if not exists manager_1 text,
add column if not exists manager_2 text;

alter table public.players
add column if not exists is_goalkeeper boolean not null default false;

