import { Link } from "react-router-dom";

import logo from "../assets/goldcup-logo.png";
import azersunLogo from "../assets/sponsors/azersun.png";
import dreamFestLogo from "../assets/sponsors/dreamfest.png";
import starCollegesLogo from "../assets/sponsors/star-colleges.png";
import officialHividoLogo from "../assets/sponsors/official-hivido.png";
import officialNeonNLogo from "../assets/sponsors/official-neon-n.png";
import officialAllSportsLogo from "../assets/sponsors/official-all-sports.png";
import officialTimsportLogo from "../assets/sponsors/official-timsport.png";

const OFFICIAL_SPONSOR_SLOTS = [
  { kind: "img" as const, src: officialHividoLogo, alt: "HIVideo", zoomClass: "sponsor-official-img--zoom-lg" },
  { kind: "img" as const, src: officialNeonNLogo, alt: "Partner logo", zoomClass: "sponsor-official-img--zoom-lg" },
  { kind: "img" as const, src: officialAllSportsLogo, alt: "All Sports", zoomClass: "sponsor-official-img--zoom-md" },
  { kind: "img" as const, src: officialTimsportLogo, alt: "TIMSPORT", zoomClass: "sponsor-official-img--zoom-md" },
  { kind: "placeholder" as const },
  { kind: "placeholder" as const },
  { kind: "placeholder" as const },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img className="site-footer-logo" src={logo} alt="Gold Cup logo" />
          <div>
            <div className="site-footer-title">Gold Cup</div>
            <div className="site-footer-tag">#morethanagame</div>
          </div>
        </div>

        <div className="site-footer-about">
          <div className="site-footer-head">About Gold Cup</div>
          <p className="site-footer-text">
            Gold Cup is a youth football tournament created to bring competition, atmosphere, and community together.
            Our goal is to give teams a professional tournament experience both on and off the pitch.
          </p>
          <a className="site-footer-link" href="#" onClick={(e) => e.preventDefault()} aria-label="Instagram (placeholder)">
            Instagram →
          </a>
        </div>

        <div className="site-footer-sponsors">
          <div className="site-footer-head">Links</div>
          <div className="site-footer-links">
            <Link className="site-footer-link" to="/sponsors">
              Sponsors
            </Link>
            <Link className="site-footer-link" to="/about">
              About
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer-sponsorbar">
        <div className="site-footer-head" style={{ marginBottom: 10 }}>
          Sponsors & Partners
        </div>
        <div className="sponsor-row sponsor-row--footer" aria-label="Sponsor logos">
          <div className="sponsor-row-item">
            <img
              className="sponsor-logo sponsor-logo--free sponsor-logo--footer-azersun"
              src={azersunLogo}
              alt="Azersun logo"
            />
          </div>
          <div className="sponsor-row-item">
            <img
              className="sponsor-logo sponsor-logo--free sponsor-logo--footer-dreamfest"
              src={dreamFestLogo}
              alt="Dream Fest logo"
            />
          </div>
          <div className="sponsor-row-item">
            <div className="sponsor-logo-chip">
              <img className="sponsor-logo sponsor-logo--star" src={starCollegesLogo} alt="Star Colleges logo" />
            </div>
          </div>
        </div>

        <div className="official-sponsors-block">
          <div className="official-sponsors-title">Official Sponsors</div>
          <div className="official-sponsors-grid" aria-label="Official sponsor logos">
            {OFFICIAL_SPONSOR_SLOTS.map((slot, i) => (
              <div key={i} className="official-sponsor-slot">
                {slot.kind === "placeholder" ? (
                  <span className="official-sponsor-placeholder">Sponsor Logo</span>
                ) : (
                  <img className={`sponsor-official-img ${slot.zoomClass}`} src={slot.src} alt={slot.alt} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span className="muted">© {new Date().getFullYear()} Gold Cup</span>
        <span className="site-footer-hash">#morethanagame</span>
      </div>
    </footer>
  );
}

