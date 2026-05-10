import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Footer } from "../components/Footer";
import { PeopleCounterWidget } from "../components/PeopleCounterWidget";
import { VolunteerTeamCheck } from "../components/VolunteerTeamCheck";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import logo from "../assets/goldcup-logo.png";

type VolTab = "counter" | "verify";

export function VolunteerHub() {
  const { session, loading, isAdmin, isVolunteer, signIn, signOut } = useAuth();
  const [tab, setTab] = useState<VolTab>("counter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const allowed = isAdmin || isVolunteer;

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    if (!isSupabaseConfigured) {
      setLoginErr("Supabase is not configured.");
      return;
    }
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setLoginErr(error);
  }

  if (loading) return <p className="empty">Loading…</p>;

  if (!session) {
    return (
      <div className="volunteer-shell">
        <header className="volunteer-topbar">
          <Link to="/" className="volunteer-brand">
            <img src={logo} alt="" className="volunteer-logo" />
            <span>Gold Cup · Volunteers</span>
          </Link>
        </header>
        <main className="volunteer-main">
          <h1 className="page-title">Volunteer sign in</h1>
          <p className="subtitle">People counter and team verification only — not the full admin console.</p>
          <form className="card volunteer-login-card" onSubmit={(e) => void onLogin(e)}>
            <div className="form-row">
              <label htmlFor="vol-email">Email</label>
              <input
                id="vol-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="volunteer@example.com"
              />
            </div>
            <div className="form-row">
              <label htmlFor="vol-pass">Password</label>
              <input
                id="vol-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginErr && <div className="alert warn">{loginErr}</div>}
            <button type="submit" className="btn btn-primary volunteer-login-submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
            Accounts are created in Supabase Auth; organisers assign <span className="kbd">is_volunteer</span> on{" "}
            <span className="kbd">public.profiles</span>. See <span className="kbd">supabase/VOLUNTEER_SETUP.md</span>.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="volunteer-shell">
        <header className="volunteer-topbar">
          <Link to="/" className="volunteer-brand">
            <img src={logo} alt="" className="volunteer-logo" />
            <span>Gold Cup</span>
          </Link>
        </header>
        <main className="volunteer-main">
          <h1 className="page-title">Access</h1>
          <p className="subtitle">This area is only for volunteer or admin accounts.</p>
          <button type="button" className="btn btn-primary" onClick={() => void signOut()}>
            Sign out
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="volunteer-shell">
      <header className="volunteer-topbar">
        <Link to="/" className="volunteer-brand">
          <img src={logo} alt="" className="volunteer-logo" />
          <span>Gold Cup · Volunteers</span>
        </Link>
        <button type="button" className="btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <nav className="volunteer-tabs" aria-label="Volunteer sections">
        <button type="button" className={tab === "counter" ? "volunteer-tab volunteer-tab--active" : "volunteer-tab"} onClick={() => setTab("counter")}>
          People counter
        </button>
        <button type="button" className={tab === "verify" ? "volunteer-tab volunteer-tab--active" : "volunteer-tab"} onClick={() => setTab("verify")}>
          Team check
        </button>
      </nav>

      <main className="volunteer-main">
        {tab === "counter" && (
          <section className="card volunteer-panel">
            <h1 className="page-title volunteer-panel-title">People counter</h1>
            <p className="subtitle">Large buttons for entrance. Count syncs live across phones.</p>
            <PeopleCounterWidget />
          </section>
        )}
        {tab === "verify" && (
          <section className="card volunteer-panel">
            <h1 className="page-title volunteer-panel-title">Team / player check</h1>
            <p className="subtitle">Select a squad and confirm names against your list.</p>
            <VolunteerTeamCheck />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
