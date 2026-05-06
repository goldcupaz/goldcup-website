import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

const links = [
  ["/", "Home"],
  ["/groups", "Groups"],
  ["/standings", "Standings"],
  ["/fixtures", "Fixtures / Results"],
  ["/live", "Live Match"],
  ["/teams", "Teams"],
  ["/knockout", "Knockout Path"],
] as const;

export function Layout() {
  const { session } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <span>Gold Cup</span>
        </div>
        <nav className="nav" aria-label="Main">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {label}
            </NavLink>
          ))}
          {isSupabaseConfigured && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : undefined)}>
              {session ? "Admin" : "Admin login"}
            </NavLink>
          )}
        </nav>
      </header>
      {!isSupabaseConfigured && (
        <div className="alert warn">
          Add <span className="kbd">VITE_SUPABASE_URL</span> and{" "}
          <span className="kbd">VITE_SUPABASE_ANON_KEY</span> in Netlify (or <span className="kbd">.env</span> locally).
          See <span className="kbd">README.md</span>.
        </div>
      )}
      <Outlet />
    </div>
  );
}
