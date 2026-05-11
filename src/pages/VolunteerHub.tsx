import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Footer } from "../components/Footer";
import { PeopleCounterWidget } from "../components/PeopleCounterWidget";
import { VolunteerTeamCheck } from "../components/VolunteerTeamCheck";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import logo from "../assets/goldcup-logo.png";

type VolTab = "counter" | "verify";

function volunteerPasswordExpected(): string {
  const v = import.meta.env.VITE_VOLUNTEER_PASSWORD;
  return typeof v === "string" && v.length > 0 ? v : "goldcupaz";
}

function volunteerAuthEmail(): string {
  const v = import.meta.env.VITE_VOLUNTEER_EMAIL;
  return typeof v === "string" ? v.trim() : "";
}

export function VolunteerHub() {
  const { session, loading, isAdmin, isVolunteer, signIn, signOut } = useAuth();
  const [tab, setTab] = useState<VolTab>("counter");
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
    const email = volunteerAuthEmail();
    if (!email) {
      setLoginErr(
        "Volunteer login is not configured. Set VITE_VOLUNTEER_EMAIL in .env to the shared volunteer Supabase Auth user.",
      );
      return;
    }
    const expected = volunteerPasswordExpected();
    if (password !== expected) {
      setLoginErr("Wrong password.");
      return;
    }
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      setLoginErr(
        `${error} — Check that this email exists in Supabase Auth and the account password matches the volunteer password.`,
      );
      return;
    }
    setPassword("");
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
          <h1 className="page-title">Volunteer entrance</h1>
          <p className="subtitle">Password only — people counter and team check. Not the admin console.</p>
          <form className="card volunteer-login-card" onSubmit={(e) => void onLogin(e)}>
            <div className="form-row">
              <label htmlFor="vol-pass">Password</label>
              <input
                id="vol-pass"
                type="password"
                autoComplete="off"
                inputMode="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            {loginErr && <div className="alert warn">{loginErr}</div>}
            <button type="submit" className="btn btn-primary volunteer-login-submit" disabled={busy}>
              {busy ? "Opening…" : "Continue"}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
            Organisers set <span className="kbd">VITE_VOLUNTEER_EMAIL</span> (hidden shared Auth user) and optionally{" "}
            <span className="kbd">VITE_VOLUNTEER_PASSWORD</span> (defaults to <span className="kbd">goldcupaz</span>). That
            user needs <span className="kbd">is_volunteer = true</span> on <span className="kbd">public.profiles</span>. See{" "}
            <span className="kbd">supabase/VOLUNTEER_SETUP.md</span>.
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
          <p className="subtitle">This portal needs a volunteer-enabled account for the configured email.</p>
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
        <button
          type="button"
          className={tab === "counter" ? "volunteer-tab volunteer-tab--active" : "volunteer-tab"}
          onClick={() => setTab("counter")}
        >
          People counter
        </button>
        <button
          type="button"
          className={tab === "verify" ? "volunteer-tab volunteer-tab--active" : "volunteer-tab"}
          onClick={() => setTab("verify")}
        >
          Team check
        </button>
      </nav>

      <main className="volunteer-main">
        {tab === "counter" && (
          <section className="card volunteer-panel">
            <h1 className="page-title volunteer-panel-title">People counter</h1>
            <p className="subtitle">Pick a matchday, then use +1 / −1. Counts sync live across devices.</p>
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
