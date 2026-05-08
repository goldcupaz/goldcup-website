import { NavLink, Outlet, Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Footer } from "./Footer";
import logo from "../assets/goldcup-logo.png";

export function Layout() {
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const adminLabel = useMemo(() => (session ? "Admin" : "Admin / Login"), [session]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link" onClick={() => setMenuOpen(false)}>
            <img className="brand-logo" src={logo} alt="Gold Cup logo" />
            <span className="brand-name">Gold Cup</span>
          </Link>
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>

        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink
            to="/fixtures"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            Matches
          </NavLink>
          <NavLink
            to="/standings"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            Standings
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => setMenuOpen(false)}
          >
            Teams
          </NavLink>

          <div className="nav-more">
            <button
              type="button"
              className={moreOpen ? "nav-more-btn active" : "nav-more-btn"}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
            </button>
            {moreOpen && (
              <div className="nav-more-menu" role="menu" aria-label="More">
                <NavLink to="/groups" className="nav-more-item" onClick={() => (setMoreOpen(false), setMenuOpen(false))}>
                  Groups
                </NavLink>
                <NavLink
                  to="/knockout"
                  className="nav-more-item"
                  onClick={() => (setMoreOpen(false), setMenuOpen(false))}
                >
                  Knockout Path
                </NavLink>
                <NavLink
                  to="/sponsors"
                  className="nav-more-item"
                  onClick={() => (setMoreOpen(false), setMenuOpen(false))}
                >
                  Sponsors
                </NavLink>
                <NavLink to="/about" className="nav-more-item" onClick={() => (setMoreOpen(false), setMenuOpen(false))}>
                  About
                </NavLink>
                <NavLink to="/links" className="nav-more-item" onClick={() => (setMoreOpen(false), setMenuOpen(false))}>
                  Links
                </NavLink>
                {isSupabaseConfigured && (
                  <NavLink
                    to="/admin"
                    className="nav-more-item"
                    onClick={() => (setMoreOpen(false), setMenuOpen(false))}
                  >
                    {adminLabel}
                  </NavLink>
                )}
              </div>
            )}
          </div>
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
      <Footer />
    </div>
  );
}
