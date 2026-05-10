import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

import { AdminPage } from "./AdminPage";

function envAdminPassword(): string {
  const v = import.meta.env.ADMIN_PASSWORD;
  return typeof v === "string" ? v : "";
}

function envAdminEmail(): string {
  const v = import.meta.env.VITE_ADMIN_EMAIL;
  return typeof v === "string" ? v.trim() : "";
}

function AdminPasswordGate() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const expected = envAdminPassword();
  const email = envAdminEmail();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Configure Supabase (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).");
      return;
    }
    if (!expected) {
      setError("Set ADMIN_PASSWORD in .env and restart the dev server (value is injected at build time).");
      return;
    }
    if (!email) {
      setError("Set VITE_ADMIN_EMAIL to your Supabase Auth admin user email.");
      return;
    }
    if (password !== expected) {
      setError("Invalid password.");
      return;
    }

    setBusy(true);
    const { error: authErr } = await signIn(email, password);
    setBusy(false);
    if (authErr) {
      setError(
        `${authErr} — Ensure this user exists in Supabase Auth and their password matches ADMIN_PASSWORD.`,
      );
    }
  }

  return (
    <main className="admin-login-page">
      <h1 className="page-title">Admin</h1>
      <p className="subtitle">
        Enter the tournament admin password. This signs you into Supabase so saves respect database rules (your account
        must have <span className="kbd">is_admin</span> on <span className="kbd">public.profiles</span>).
      </p>

      <form className="card admin-login-card" onSubmit={(e) => void onSubmit(e)}>
        <div className="form-row">
          <label htmlFor="admin-pass">Password</label>
          <input
            id="admin-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
          />
        </div>
        {error && <div className="alert warn">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Unlock admin"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        MVP note: <span className="kbd">ADMIN_PASSWORD</span> is embedded at build time — use Supabase Auth policies for
        production hardening.
      </p>
    </main>
  );
}

/** /admin — password gate then full admin console (unchanged main experience for admins) */
export function AdminEntry() {
  const { session, loading, isAdmin, isVolunteer, signOut } = useAuth();

  if (loading) return <p className="empty">Loading…</p>;
  if (session && !isAdmin) {
    return (
      <main className="admin-login-page">
        <h1 className="page-title">Admin</h1>
        <p className="subtitle">
          {isVolunteer
            ? "Volunteer accounts use the Volunteer Portal — not this admin console."
            : "This account does not have admin rights on this project."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {isVolunteer && (
            <Link to="/volunteer" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              Open Volunteer Portal
            </Link>
          )}
          <button type="button" className="btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </main>
    );
  }
  if (session && isAdmin) return <AdminPage />;
  return <AdminPasswordGate />;
}
