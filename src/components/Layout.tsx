import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { seoForPath } from "../lib/seo";
import { ITICKET_URL, EXTERNAL_LINK_REL } from "../lib/tickets";
import { Footer } from "./Footer";
import { GoldCupSocialLinks } from "./GoldCupSocialLinks";
import { PageViewTracker } from "./PageViewTracker";
import { SeoHead } from "./SeoHead";
import logo from "../assets/goldcup-logo.png";

export function Layout() {
  const { session } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  const adminLabel = useMemo(() => (session ? "Admin" : "Admin / Login"), [session]);
  const routeSeo = useMemo(() => seoForPath(location.pathname), [location.pathname]);

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

  function closeNav() {
    setMoreOpen(false);
    setMenuOpen(false);
  }

  return (
    <div className="shell">
      <header className="topbar topbar--premium">
        <div className="brand">
          <Link to="/" className="brand-link" onClick={closeNav}>
            <img className="brand-logo" src={logo} alt="Gold Cup Azerbaijan logo" width={40} height={40} />
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

        <nav className={menuOpen ? "nav nav-open nav--premium" : "nav nav--premium"} aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)} onClick={closeNav}>
            Home
          </NavLink>
          <NavLink
            to="/fixtures"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={closeNav}
          >
            Fixtures
          </NavLink>
          <NavLink
            to="/standings"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={closeNav}
          >
            Standings
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) => (isActive ? "active" : undefined)}
            onClick={closeNav}
          >
            Teams
          </NavLink>
          <a
            href={ITICKET_URL}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            className="nav-tickets-external"
            onClick={closeNav}
          >
            Tickets
          </a>

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
              <NavLink to="/tickets" className="nav-more-item" onClick={closeNav}>
                Tickets page
              </NavLink>
              <NavLink to="/sponsors" className="nav-more-item" onClick={closeNav}>
                Sponsors
              </NavLink>
              <NavLink to="/fanzone" className="nav-more-item" onClick={closeNav}>
                Fanzone
              </NavLink>
              <NavLink to="/rules" className="nav-more-item" onClick={closeNav}>
                Rules
              </NavLink>
              <NavLink to="/about" className="nav-more-item" onClick={closeNav}>
                About
              </NavLink>
              <NavLink to="/statistics" className="nav-more-item" onClick={closeNav}>
                Statistics
              </NavLink>
              <NavLink to="/groups" className="nav-more-item" onClick={closeNav}>
                Groups
              </NavLink>
              <NavLink to="/knockout" className="nav-more-item" onClick={closeNav}>
                Knockout path
              </NavLink>
              <NavLink to="/links" className="nav-more-item" onClick={closeNav}>
                Social &amp; registration
              </NavLink>
              <NavLink to="/live" className="nav-more-item" onClick={closeNav}>
                Live match
              </NavLink>
              <div className="nav-more-divider" role="separator" />
              <div className="nav-more-social-label">Follow Gold Cup</div>
              <GoldCupSocialLinks variant="menu" source="nav_more" onItemClick={closeNav} />
              {isSupabaseConfigured && (
                <>
                  <div className="nav-more-divider" role="separator" />
                  <NavLink to="/admin" className="nav-more-item" onClick={closeNav}>
                    {adminLabel}
                  </NavLink>
                  <NavLink to="/volunteer" className="nav-more-item" onClick={closeNav}>
                    Volunteer portal
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
      {routeSeo && !/^\/matches\/[^/]+$/.test(location.pathname) && (
        <SeoHead pathname={location.pathname} {...routeSeo} />
      )}
      <PageViewTracker />
      <Outlet />
      <Footer />
    </div>
  );
}
