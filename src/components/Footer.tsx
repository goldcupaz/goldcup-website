import { Link } from "react-router-dom";

import logo from "../assets/goldcup-logo.svg";
import azersunLogo from "../assets/sponsors/azersun.png";

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
          <div className="site-footer-head">Sponsors & Partners</div>
          <div className="footer-sponsor-grid">
            <div className="footer-sponsor-tile footer-sponsor-tile--main">
              <img className="sponsor-logo" src={azersunLogo} alt="Azersun logo" />
            </div>
            <div className="footer-sponsor-tile footer-sponsor-tile--main">Sponsor Logo</div>
            <div className="footer-sponsor-tile footer-sponsor-tile--main">Sponsor Logo</div>
          </div>
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

      <div className="site-footer-bottom">
        <span className="muted">© {new Date().getFullYear()} Gold Cup</span>
        <span className="site-footer-hash">#morethanagame</span>
      </div>
    </footer>
  );
}

