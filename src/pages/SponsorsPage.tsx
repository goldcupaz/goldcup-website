import { trackSponsorClick } from "../lib/websiteAnalytics";
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

const EXTERNAL_REL = "noopener noreferrer";

const HIVIDEO_URL = "https://hivideo.az/";
const NOOSHCARD_URL = "https://www.instagram.com/nooshcard?igsh=MWN1bWI0Y2oxcGM3aQ==";
const TIMSPORT_URL = "https://timsport.az/en";
const LIV_HOSPITAL_URL = "https://www.livhospital.az/";
const LUMI_URL = "https://www.instagram.com/lumi.coffeeco/";
const BUYUKFIRAT_URL = "https://www.instagram.com/buyukfirat/";
const AZERSUN_URL = "https://azersun.com/az";
const DREAMFEST_URL = "https://dreammusicfest.com/";
const STAR_COLLEGES_URL = "https://star.edu.az/";

type SponsorGridItem = {
  name: string;
  src: string;
  imgClassName?: string;
  tileClassName?: string;
  href?: string;
};

const OFFICIAL_AND_PARTNERS: SponsorGridItem[] = [
  {
    name: "HIVideo",
    src: officialHividoLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-hivido",
    href: HIVIDEO_URL,
  },
  {
    name: "Nooshcard",
    src: officialNeonNLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-noosh",
    href: NOOSHCARD_URL,
  },
  {
    name: "Allsports",
    src: officialAllSportsLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--allsports-xl sponsor-logo--page-allsports",
  },
  {
    name: "TIMsport",
    src: officialTimsportLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-timsport",
    href: TIMSPORT_URL,
  },
  {
    name: "Bona Dea · Liv Hospital",
    src: officialBonaDeaLivLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-bona-dea",
    href: LIV_HOSPITAL_URL,
  },
  {
    name: "Lumi",
    src: officialLumiLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-lumi",
    href: LUMI_URL,
  },
  {
    name: "Büyükfırat",
    src: officialBuyukfiratLogo,
    tileClassName: "sponsor-logo-tile--page-white",
    imgClassName: "sponsor-logo--official sponsor-logo--page-buyukfirat",
    href: BUYUKFIRAT_URL,
  },
];

function onSponsorClick(name: string, href: string, location: string) {
  trackSponsorClick({ sponsor: name, href, location });
}

export function SponsorsPage() {
  return (
    <main>
      <h1 className="page-title">Sponsors</h1>
      <p className="subtitle">Thank you to our sponsors and partners for supporting Gold Cup.</p>

      <section className="card sponsors-page-main">
        <h2 className="section-title">Main Sponsors</h2>
        <div className="main-sponsor-grid">
          <div className="sponsor-logo-tile sponsor-logo-tile--main sponsor-logo-tile--sponsors-main-white">
            <a
              className="sponsor-page-main-link"
              href={AZERSUN_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Azersun — opens in a new tab"
              onClick={() => onSponsorClick("Azersun", AZERSUN_URL, "sponsors_page_main")}
            >
              <div className="sponsor-logo-chip sponsor-logo-chip--sponsors-main">
                <img
                  className="sponsor-logo sponsor-logo--sponsors-main-azersun"
                  src={azersunLogo}
                  alt="Azersun — Gold Cup youth football tournament in Baku"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main sponsor-logo-tile--sponsors-main-white">
            <a
              className="sponsor-page-main-link"
              href={DREAMFEST_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Dream Fest — opens in a new tab"
              onClick={() => onSponsorClick("Dream Fest", DREAMFEST_URL, "sponsors_page_main")}
            >
              <div className="sponsor-logo-chip sponsor-logo-chip--sponsors-main">
                <img
                  className="sponsor-logo sponsor-logo--sponsors-main-dreamfest"
                  src={dreamFestLogo}
                  alt="Dream Fest — Gold Cup youth football tournament in Baku"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main sponsor-logo-tile--sponsors-main-white">
            <a
              className="sponsor-page-main-link"
              href={STAR_COLLEGES_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Star Colleges — opens in a new tab"
              onClick={() => onSponsorClick("Star Colleges", STAR_COLLEGES_URL, "sponsors_page_main")}
            >
              <div className="sponsor-logo-chip sponsor-logo-chip--sponsors-main">
                <img
                  className="sponsor-logo sponsor-logo--sponsors-main-star"
                  src={starCollegesLogo}
                  alt="Star Colleges — Gold Cup youth football tournament in Baku"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">Official Sponsors &amp; Partners</h2>
        <div className="sponsor-grid sponsor-grid--logos" aria-label="Official sponsors and partners">
          {OFFICIAL_AND_PARTNERS.map((s) => {
            const img = (
              <img
                className={`sponsor-logo sponsor-logo--free ${s.imgClassName ?? ""}`.trim()}
                src={s.src}
                alt={`${s.name} — Gold Cup Azerbaijan partner`}
                loading="lazy"
              />
            );
            return (
              <div
                key={s.name}
                className={`sponsor-logo-tile sponsor-logo-tile--official${s.tileClassName ? ` ${s.tileClassName}` : ""}`}
                aria-label={s.name}
              >
                {s.href ? (
                  <a
                    className="sponsor-page-official-link"
                    href={s.href}
                    target="_blank"
                    rel={EXTERNAL_REL}
                    aria-label={`${s.name} — opens in a new tab`}
                    onClick={() => onSponsorClick(s.name, s.href, "sponsors_page_official")}
                  >
                    {img}
                  </a>
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
