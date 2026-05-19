import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Footer } from "./Footer";
import { PageViewTracker } from "./PageViewTracker";
import logo from "../assets/goldcup-logo.png";

export function Layout() {
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  const adminLabel = useMemo(() => (session ? "Admin" : "Admin / Login"), [session]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: PointerEvent) {
      const root = moreWrapRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moreOpen]);

  function closeMoreAndMaybeMenu() {
    setMoreOpen(false);
    setMenuOpen(false);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link" onClick={() => (setMenuOpen(false), setMoreOpen(false))}>
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
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => (setMenuOpen(false), setMoreOpen(false))}
          >
            Home
          </NavLink>
          <NavLink
            to="/fixtures"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => (setMenuOpen(false), setMoreOpen(false))}
          >
            Matches
          </NavLink>
          <NavLink
            to="/standings"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => (setMenuOpen(false), setMoreOpen(false))}
          >
            Standings
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={() => (setMenuOpen(false), setMoreOpen(false))}
          >
            Teams
          </NavLink>

          <div className="nav-more" ref={moreWrapRef}>
            <button
              type="button"
              className={moreOpen ? "nav-more-btn active" : "nav-more-btn"}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
            </button>
            <div
              className={`nav-more-menu${moreOpen ? " nav-more-menu--open" : ""}`}
              role="menu"
              aria-label="More"
              aria-hidden={!moreOpen}
            >
              <NavLink to="/groups" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                Groups
              </NavLink>
              <NavLink to="/knockout" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                Knockout Path
              </NavLink>
              <NavLink to="/sponsors" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                Sponsors
              </NavLink>
              <NavLink to="/about" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                About
              </NavLink>
              <NavLink to="/links" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                Links
              </NavLink>
              <NavLink to="/statistics" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                Statistics
              </NavLink>
              {isSupabaseConfigured && (
                <>
                  <NavLink to="/admin" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                    {adminLabel}
                  </NavLink>
                  <NavLink to="/volunteer" className="nav-more-item" onClick={closeMoreAndMaybeMenu}>
                    Volunteer Portal
                  </NavLink>
                </>
              )}
            </div>
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
      <PageViewTracker />
      <Outlet />
      <Footer />
    </div>
  );
}
