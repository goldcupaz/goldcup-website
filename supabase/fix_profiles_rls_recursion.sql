-- Fix infinite recursion on public.profiles RLS (run in Supabase SQL Editor)
begin;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_admin_all_safe" on public.profiles;
drop policy if exists "profiles_modify_admin_only" on public.profiles;

drop function if exists public.is_admin_user();

create function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin_user() is 'RLS-safe admin check for policies (never query profiles recursively).';

revoke all on function public.is_admin_user() from public;

grant execute on function public.is_admin_user() to authenticated;

grant execute on function public.is_admin_user() to service_role;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin_user());

-- Admins only: INSERT/UPDATE/DELETE and any extra SELECT paths (combined with SELECT policy via OR rules).
create policy "profiles_admin_all_safe"
  on public.profiles for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

commit;
