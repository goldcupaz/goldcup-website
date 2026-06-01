import { Link } from "react-router-dom";

import { GoldCupSocialLinks } from "./GoldCupSocialLinks";
import { ITICKET_URL, EXTERNAL_LINK_REL } from "../lib/tickets";
import { trackSponsorClick } from "../lib/websiteAnalytics";
import logo from "../assets/goldcup-logo.png";
import azersunLogo from "../assets/sponsors/azersun.png";
import dreamFestLogo from "../assets/sponsors/dreamfest.png";
import starCollegesLogo from "../assets/sponsors/star-colleges.png";
import officialHividoLogo from "../assets/sponsors/official-hivido.png";
import officialNeonNLogo from "../assets/sponsors/official-neon-n.png";
import officialAllSportsLogo from "../assets/sponsors/official-all-sports.png";
import officialTimsportLogo from "../assets/sponsors/official-timsport.png";
import officialBonaDeaLivLogo from "../assets/sponsors/official-bona-dea-liv.png";
import officialLumiLogo from "../assets/sponsors/official-lumi.png";
import officialBuyukfiratLogo from "../assets/sponsors/official-buyukfirat.png";

type OfficialSlot =
  | { kind: "placeholder" }
  | {
      kind: "img";
      src: string;
      alt: string;
      zoomClass: string;
      href?: string;
      slotClass?: string;
    };

const EXTERNAL_REL = "noopener noreferrer";

const AZERSUN_URL = "https://azersun.com/az";
const DREAMFEST_URL = "https://dreammusicfest.com/";
const STAR_COLLEGES_URL = "https://star.edu.az/";
const HIVIDEO_URL = "https://hivideo.az/";
const NOOSHCARD_URL = "https://www.instagram.com/nooshcard?igsh=MWN1bWI0Y2oxcGM3aQ==";
const TIMSPORT_URL = "https://timsport.az/en";
const LIV_HOSPITAL_URL = "https://www.livhospital.az/";
const LUMI_URL = "https://www.instagram.com/lumi.coffeeco/";
const BUYUKFIRAT_URL = "https://www.instagram.com/buyukfirat/";
function onSponsorClick(name: string, href: string, location: string) {
  trackSponsorClick({ sponsor: name, href, location });
}

const OFFICIAL_SPONSOR_SLOTS: OfficialSlot[] = [
  {
    kind: "img",
    src: officialHividoLogo,
    alt: "HIVideo",
    zoomClass: "sponsor-official-img--hivido-footer",
    href: HIVIDEO_URL,
  },
  {
    kind: "img",
    src: officialNeonNLogo,
    alt: "Nooshcard",
    zoomClass: "sponsor-official-img--zoom-lg",
    href: NOOSHCARD_URL,
  },
  {
    kind: "img",
    src: officialAllSportsLogo,
    alt: "All Sports",
    zoomClass: "sponsor-official-img--zoom-xl",
  },
  {
    kind: "img",
    src: officialTimsportLogo,
    alt: "TIMSPORT",
    zoomClass: "sponsor-official-img--timsport-footer",
    href: TIMSPORT_URL,
  },
  {
    kind: "img",
    src: officialBonaDeaLivLogo,
    alt: "Bona Dea · Liv Hospital",
    zoomClass: "sponsor-official-img--bona-dea-footer",
    href: LIV_HOSPITAL_URL,
  },
  {
    kind: "img",
    src: officialLumiLogo,
    alt: "Lumi",
    zoomClass: "sponsor-official-img--lumi-footer",
    href: LUMI_URL,
  },
  {
    kind: "img",
    src: officialBuyukfiratLogo,
    alt: "Büyükfırat",
    zoomClass: "sponsor-official-img--buyukfirat-footer",
    href: BUYUKFIRAT_URL,
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img
            className="site-footer-logo"
            src={logo}
            alt="Gold Cup Azerbaijan logo"
            width={48}
            height={48}
            loading="lazy"
          />
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
          <div className="site-footer-head" style={{ marginTop: 14 }}>
            Follow Gold Cup
          </div>
          <GoldCupSocialLinks variant="footer" source="footer_about" />
        </div>

        <div className="site-footer-sponsors">
          <div className="site-footer-head">Links</div>
          <div className="site-footer-links">
            <a className="site-footer-link" href={ITICKET_URL} target="_blank" rel={EXTERNAL_LINK_REL}>
              Tickets
            </a>
            <Link className="site-footer-link" to="/sponsors">
              Sponsors
            </Link>
            <Link className="site-footer-link" to="/fanzone">
              Fanzone
            </Link>
            <Link className="site-footer-link" to="/rules">
              Rules
            </Link>
            <Link className="site-footer-link" to="/about">
              About
            </Link>
            <Link className="site-footer-link" to="/statistics">
              Statistics
            </Link>
            <Link className="site-footer-link" to="/links">
              Social &amp; registration
            </Link>
            <Link className="site-footer-link" to="/volunteer">
              Volunteer
            </Link>
            <Link className="site-footer-link" to="/admin">
              Admin
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
            <a
              className="footer-sponsor-link"
              href={AZERSUN_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Azersun — opens in a new tab"
              onClick={() => onSponsorClick("Azersun", AZERSUN_URL, "footer_main")}
            >
              <img
                className="sponsor-logo sponsor-logo--free sponsor-logo--footer-azersun"
                src={azersunLogo}
                alt="Azersun — Gold Cup youth football tournament in Baku"
                loading="lazy"
              />
            </a>
          </div>
          <div className="sponsor-row-item">
            <a
              className="footer-sponsor-link"
              href={DREAMFEST_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Dream Fest — opens in a new tab"
              onClick={() => onSponsorClick("Dream Fest", DREAMFEST_URL, "footer_main")}
            >
              <img
                className="sponsor-logo sponsor-logo--free sponsor-logo--footer-dreamfest"
                src={dreamFestLogo}
                alt="Dream Fest — Gold Cup youth football tournament in Baku"
                loading="lazy"
              />
            </a>
          </div>
          <div className="sponsor-row-item">
            <a
              className="footer-sponsor-link footer-sponsor-link--star"
              href={STAR_COLLEGES_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Star Colleges — opens in a new tab"
              onClick={() => onSponsorClick("Star Colleges", STAR_COLLEGES_URL, "footer_main")}
            >
              <div className="sponsor-logo-chip">
                <img
                  className="sponsor-logo sponsor-logo--star"
                  src={starCollegesLogo}
                  alt="Star Colleges — Gold Cup youth football tournament in Baku"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
        </div>

        <div className="official-sponsors-block">
          <div className="official-sponsors-title">Official Sponsors</div>
          <div className="official-sponsors-grid" aria-label="Official sponsor logos">
            {OFFICIAL_SPONSOR_SLOTS.map((slot, i) => (
              <div
                key={i}
                className={`official-sponsor-slot${slot.kind === "img" && slot.slotClass ? ` ${slot.slotClass}` : ""}`}
              >
                {slot.kind === "placeholder" ? (
                  <span className="official-sponsor-placeholder">Sponsor Logo</span>
                ) : slot.href ? (
                  <a
                    className="official-sponsor-link"
                    href={slot.href}
                    target="_blank"
                    rel={EXTERNAL_REL}
                    aria-label={`${slot.alt} — opens in a new tab`}
                    onClick={() => onSponsorClick(slot.alt, slot.href, "footer_official")}
                  >
                    <img
                      className={`sponsor-official-img ${slot.zoomClass}`}
                      src={slot.src}
                      alt={`${slot.alt} — Gold Cup Azerbaijan partner`}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <img
                    className={`sponsor-official-img ${slot.zoomClass}`}
                    src={slot.src}
                    alt={`${slot.alt} — Gold Cup Azerbaijan partner`}
                    loading="lazy"
                  />
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
