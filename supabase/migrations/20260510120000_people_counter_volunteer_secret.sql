-- Allow people counter updates with shared gate password (no Supabase Auth for volunteers)
begin;

drop function if exists public.people_counter_adjust(text, int);

create or replace function public.people_counter_adjust(
  p_counter_id text,
  p_delta int,
  p_secret text default null
)
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  ok boolean := false;
  newc int;
begin
  if p_counter_id is null or p_counter_id not in ('md3', 'md4', 'md5', 'md6') then
    raise exception 'invalid counter id';
  end if;

  if auth.uid() is not null then
    select coalesce(p.is_admin or p.is_volunteer, false)
    into ok
    from public.profiles p
    where p.id = auth.uid();
  end if;

  if not ok and coalesce(nullif(trim(p_secret), ''), '') = 'goldcupaz' then
    ok := true;
  end if;

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

comment on function public.people_counter_adjust(text, int, text) is 'Adjust matchday counter: admin/volunteer profile OR shared password.';

revoke all on function public.people_counter_adjust(text, int, text) from public;
grant execute on function public.people_counter_adjust(text, int, text) to anon;
grant execute on function public.people_counter_adjust(text, int, text) to authenticated;
grant execute on function public.people_counter_adjust(text, int, text) to service_role;

commit;
