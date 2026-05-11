import { FormEvent, useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { Footer } from "../components/Footer";
import { PeopleCounterWidget } from "../components/PeopleCounterWidget";
import { VolunteerTeamCheck } from "../components/VolunteerTeamCheck";
import {
  clearVolunteerSession,
  isVolunteerSessionOpen,
  setVolunteerSession,
  VOLUNTEER_PASSWORD,
} from "../lib/volunteerGate";
import logo from "../assets/goldcup-logo.png";

type VolTab = "counter" | "verify";

export function VolunteerHub() {
  const [unlocked, setUnlocked] = useState(isVolunteerSessionOpen);
  const [tab, setTab] = useState<VolTab>("counter");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);

  const tryUnlock = useCallback((e: FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    if (password !== VOLUNTEER_PASSWORD) {
      setLoginErr("Incorrect password. Please try again.");
      return;
    }
    setVolunteerSession();
    setUnlocked(true);
    setPassword("");
  }, [password]);

  function signOutVolunteer() {
    clearVolunteerSession();
    setUnlocked(false);
    setLoginErr(null);
  }

  if (!unlocked) {
    return (
      <div className="volunteer-shell">
        <header className="volunteer-topbar">
          <Link to="/" className="volunteer-brand">
            <img src={logo} alt="" className="volunteer-logo" />
            <span>Gold Cup · Volunteers</span>
          </Link>
        </header>
        <main className="volunteer-main">
          <h1 className="page-title">Volunteer access</h1>
          <p className="subtitle">Enter the gate password to open people counter and team check.</p>
          <form className="card volunteer-login-card" onSubmit={tryUnlock}>
            <div className="form-row">
              <label htmlFor="vol-pass">Password</label>
              <input
                id="vol-pass"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
              />
            </div>
            {loginErr && <div className="alert warn">{loginErr}</div>}
            <button type="submit" className="btn btn-primary volunteer-login-submit">
              Continue
            </button>
          </form>
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
        <button type="button" className="btn" onClick={signOutVolunteer}>
          Lock portal
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
            <p className="subtitle">Choose a matchday, then tap +1 or −1. Totals update live for everyone at the gate.</p>
            <PeopleCounterWidget />
          </section>
        )}
        {tab === "verify" && (
          <section className="card volunteer-panel">
            <h1 className="page-title volunteer-panel-title">Team / player check</h1>
            <p className="subtitle">Select a team and verify names on the list.</p>
            <VolunteerTeamCheck />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
