import azersunLogo from "../assets/sponsors/azersun.png";
import dreamFestLogo from "../assets/sponsors/dreamfest.png";
import starCollegesLogo from "../assets/sponsors/star-colleges.png";
import officialHividoLogo from "../assets/sponsors/official-hivido.png";
import officialNeonNLogo from "../assets/sponsors/official-neon-n.png";
import officialAllSportsLogo from "../assets/sponsors/official-all-sports.png";
import officialTimsportLogo from "../assets/sponsors/official-timsport.png";
import officialBonaDeaLivLogo from "../assets/sponsors/official-bona-dea-liv.png";

type SponsorGridItem = {
  name: string;
  src: string;
  imgClassName?: string;
  tileClassName?: string;
};

const OFFICIAL_AND_PARTNERS: SponsorGridItem[] = [
  { name: "HIVideo", src: officialHividoLogo, tileClassName: "sponsor-logo-tile--img-white", imgClassName: "sponsor-logo--official" },
  { name: "Nooshcard", src: officialNeonNLogo, imgClassName: "sponsor-logo--official" },
  { name: "Allsports", src: officialAllSportsLogo, imgClassName: "sponsor-logo--official sponsor-logo--allsports-xl" },
  { name: "TIMsport", src: officialTimsportLogo, imgClassName: "sponsor-logo--official" },
  { name: "Bona Dea · Liv Hospital", src: officialBonaDeaLivLogo, imgClassName: "sponsor-logo--official sponsor-logo--bona-dea" },
];

export function SponsorsPage() {
  return (
    <main>
      <h1 className="page-title">Sponsors</h1>
      <p className="subtitle">Thank you to our sponsors and partners for supporting Gold Cup.</p>

      <section className="card">
        <h2 className="section-title">Main Sponsors</h2>
        <div className="main-sponsor-grid">
          <div className="sponsor-logo-tile sponsor-logo-tile--main">
            <div className="sponsor-logo-chip">
              <img className="sponsor-logo" src={azersunLogo} alt="Azersun logo" />
            </div>
          </div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main">
            <div className="sponsor-logo-chip">
              <img className="sponsor-logo" src={dreamFestLogo} alt="Dream Fest logo" />
            </div>
          </div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main">
            <div className="sponsor-logo-chip">
              <img className="sponsor-logo" src={starCollegesLogo} alt="Star Colleges logo" />
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">Official Sponsors &amp; Partners</h2>
        <div className="sponsor-grid sponsor-grid--logos" aria-label="Official sponsors and partners">
          {OFFICIAL_AND_PARTNERS.map((s) => (
            <div
              key={s.name}
              className={`sponsor-logo-tile sponsor-logo-tile--official${s.tileClassName ? ` ${s.tileClassName}` : ""}`}
              aria-label={s.name}
            >
              <img className={`sponsor-logo sponsor-logo--free ${s.imgClassName ?? ""}`.trim()} src={s.src} alt={`${s.name} logo`} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

