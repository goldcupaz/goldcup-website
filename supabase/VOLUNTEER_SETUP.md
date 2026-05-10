# Volunteer accounts (4 logins)

Volunteers use **`/volunteer`** with normal Supabase Auth (email + password). They only see **People counter** and **Team check**, not match editing or admin settings.

## 1. Run migrations

Apply `supabase/migrations/20260509160000_volunteer_people_counter_score_rpc.sql` (adds `profiles.is_volunteer`, `people_counter`, RPCs, realtime).

## 2. Create four Auth users

In Supabase Dashboard → **Authentication** → **Users** → **Add user** (or invite):

- Create four accounts (e.g. `volunteer1@…` … `volunteer4@…`) with passwords you share with gate staff.

Each new user gets a row in `public.profiles` from the `handle_new_user` trigger.

## 3. Grant volunteer flag

In **SQL Editor**, set `is_volunteer` for those users (replace UUIDs from Authentication → Users):

```sql
update public.profiles
set is_volunteer = true
where id in (
  'UUID-volunteer-1',
  'UUID-volunteer-2',
  'UUID-volunteer-3',
  'UUID-volunteer-4'
);
```

Keep `is_admin = false` for these rows so they cannot use the full **Admin** console.

## 4. Optional: admin also at the gate

Admins already pass `people_counter_adjust` / `people_counter_reset` checks and can open **`/volunteer`** as well as **Admin → People counter**.

## 5. Match score RPC

`recompute_match_score_from_events` runs on the database after timeline edits so **goal ↔ own goal** changes always refresh scores and standings. Only **`is_admin`** may call it.
