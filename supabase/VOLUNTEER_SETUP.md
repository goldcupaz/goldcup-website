# Volunteer portal (`/volunteer`)

Volunteers see **People counter** (per matchday) and **Team check** only — not the full admin console.

## 1. Migrations

Apply in order (or `supabase db push`):

- `20260509160000_volunteer_people_counter_score_rpc.sql` — `is_volunteer`, initial `people_counter`, score RPC, etc.
- `20260509200000_people_counter_matchdays.sql` — matchday rows `md3`–`md6` and `people_counter_adjust(counter_id, delta)`.

## 2. Shared Auth user (hidden email)

The UI is **password-only**. The app signs in with a **single** Supabase Auth email from env:

- **`VITE_VOLUNTEER_EMAIL`** — e.g. `volunteers@yourdomain.com` (must exist in **Authentication → Users**).

Password shown to volunteers:

- Default **`goldcupaz`** unless you set **`VITE_VOLUNTEER_PASSWORD`** in `.env` (must match the password for that Auth user in Supabase).

Create the user in Supabase with that password, then:

```sql
update public.profiles
set is_volunteer = true
where id = 'AUTH_USER_UUID_FOR_VITE_VOLUNTEER_EMAIL';
```

Keep `is_admin = false` so `/admin` stays separate.

## 3. Optional: four devices / four people

You can still create extra Auth users with `is_volunteer = true`, but the entrance UI only asks for the shared password; each would need the same `VITE_VOLUNTEER_EMAIL` flow unless you change the app. For simplicity, one shared volunteer user is enough.

## 4. Admin at the gate

Admins (`is_admin`) can also call `people_counter_adjust` and may use **`/volunteer`** or **Admin → Volunteer Portal**.

## 5. Match score RPC

`recompute_match_score_from_events` recalculates scores from timeline goals; only **`is_admin`** may call it.
