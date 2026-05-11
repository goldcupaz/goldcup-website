# Volunteer portal

- **`/volunteer`** — password-only gate in the browser (`goldcupaz`), then people counter + team check.
- **People counter** — run migrations through `20260510120000_people_counter_volunteer_secret.sql` so anonymous clients can adjust counts when the correct gate password is sent to the RPC (see that file).

Admin login and the rest of the site are unchanged.
