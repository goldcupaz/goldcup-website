-- Per-matchday entrance counters (md3–md6); RPC takes counter id + delta
begin;

insert into public.people_counter (id, count) values
  ('md3', 0),
  ('md4', 0),
  ('md5', 0),
  ('md6', 0)
on conflict (id) do nothing;

drop function if exists public.people_counter_adjust(int);
drop function if exists public.people_counter_reset();

create or replace function public.people_counter_adjust(p_counter_id text, p_delta int)
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
  if p_counter_id is null or p_counter_id not in ('md3', 'md4', 'md5', 'md6') then
    raise exception 'invalid counter id';
  end if;

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
  where id = p_counter_id
  returning count into newc;

  return coalesce(newc, 0);
end;
$$;

comment on function public.people_counter_adjust(text, int) is 'Volunteers/admins: change count for one matchday counter (md3–md6).';

revoke all on function public.people_counter_adjust(text, int) from public;
grant execute on function public.people_counter_adjust(text, int) to authenticated;
grant execute on function public.people_counter_adjust(text, int) to service_role;

commit;
