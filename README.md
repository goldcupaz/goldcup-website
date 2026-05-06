# Gold Cup — live tournament site

React + Vite single-page app with **Supabase** (Postgres + Auth + Row Level Security + optional Realtime) and **Netlify** hosting. All scores, fixtures, standings inputs, and admin edits are stored in Supabase — not in local-only JavaScript.

## Local development

1. Install **Node.js 20+** (includes `npm`).
2. In the **project root** (`GOLDCUP/`), install and start the Vite dev server:
  ```bash
   npm install
   npm run dev
  ```
3. Open **only** this URL in the browser (do **not** double‑click `index.html`; Vite must serve the app):
  **[http://localhost:5173](http://localhost:5173)**  
   The dev server is fixed to port `5173` (`strictPort` — if it’s busy, stop the other process or change the port in `vite.config.ts`).

### Environment variables

Copy `.env.example` to `.env` and set:

- **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** from Supabase → **Project Settings → API**
- **`ADMIN_PASSWORD`** — MVP admin gate (embedded at build time via `vite.config`; set the same value as **Netlify environment variable** `ADMIN_PASSWORD` for production builds)
- **`VITE_ADMIN_EMAIL`** — email of a Supabase Auth user whose **password matches `ADMIN_PASSWORD`**

**Save the file to disk** (`Cmd+S` / `Ctrl+S`). After changing `.env`, **restart** `npm run dev`.

Admin UI: **[http://localhost:5173/admin](http://localhost:5173/admin)** — enter `ADMIN_PASSWORD`; the app signs into Supabase with `VITE_ADMIN_EMAIL` + that password so writes respect RLS (`profiles.is_admin` must still be true for that user).

### Blank page?

- Confirm the terminal shows `Local: http://localhost:5173/` and no red stack traces.
- Use the **Console** tab (F12): errors from React or imports will appear there.
- Run `npm install` again if `node_modules` is missing or corrupted.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run **`supabase/goldcup_full_setup.sql`** once (copy-paste the whole file).  
   That creates **`profiles`**, **`teams`**, **`players`**, **`matches`**, **`match_goals`**, **`site_settings`**, RLS policies, triggers, and inserts **Gold Cup teams + fixtures + placeholder players**.  
   There is **no separate `groups` or `standings` table**: groups live on **`teams.group_letter`**; standings are **computed in the app** from **`matches`** with `stage = 'group'` and `status = 'full_time'`.
3. **Authentication → Providers**: enable **Email** (password). Create an admin user under **Authentication → Users** with email **`VITE_ADMIN_EMAIL`** and password matching **`ADMIN_PASSWORD`**.
4. Promote that user to admin (replace the UUID with theirs from the Users table):
  ```sql
   update public.profiles
   set is_admin = true
   where id = 'YOUR_USER_UUID';
  ```
5. **Real-time**: If the Live tab does not update automatically, confirm tables are listed under **Database → Replication**, or run **`supabase/migrations/20260107000001_realtime.sql`**.

## Netlify deployment

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import from Git**, pick the repo.
3. Build settings:
  - **Build command:** `npm run build`
  - **Publish directory:** `dist`
  (already set in `[netlify.toml](./netlify.toml)`.)
4. Under **Site settings → Environment variables**, add (all required at **build** time):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `ADMIN_PASSWORD` (MVP gate; same value as your Supabase Auth admin user password)
  - `VITE_ADMIN_EMAIL` (that admin user’s email)

## Custom domain on Netlify

1. **Domain management → Add domain** and follow DNS checks.
2. At your DNS host, add the records Netlify shows (usually **A/AAAA** for apex or **CNAME** for `www`).
3. Enable **HTTPS** (Let’s Encrypt) in Netlify once DNS propagates.

Treating this as “support for a custom domain” — Netlify handles TLS and redirects; you only point DNS.

## Roles & security

- **Public (anon key):** read-only access to teams, players, matches, goals, and `site_settings` (for the featured live match id).
- **Authenticated admins:** full read/write on those tables via RLS (`profiles.is_admin = true`).
- **`ADMIN_PASSWORD` MVP:** the string is compiled into the client bundle — fine for a controlled tournament site; replace with a backend or Supabase-only auth when you need stronger secrecy.
- Never expose the **service role** key in the browser; the anon key is safe with RLS.

## Project structure

- `src/pages/` — public tabs (Home, Groups, Standings, Fixtures, Live, Teams, Knockout) and `AdminPage` + `AdminLogin`.
- `src/context/` — tournament data + Supabase Realtime refetch; auth + admin flag.
- `src/lib/standings.ts` — group standings and tie-breakers.
- `supabase/migrations/` — schema, optional realtime publication.
- `supabase/seed.sql` — sample tournament data.

## Older single-file version

The previous all-in-one `index.html` ceremony page has been replaced by this app. Use Git history if you still need that file.