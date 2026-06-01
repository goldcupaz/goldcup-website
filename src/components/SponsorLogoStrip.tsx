import azersunLogo from "../assets/sponsors/azersun.png";
import dreamFestLogo from "../assets/sponsors/dreamfest.png";
import starCollegesLogo from "../assets/sponsors/star-colleges.png";
import officialHividoLogo from "../assets/sponsors/official-hivido.png";
import officialNeonNLogo from "../assets/sponsors/official-neon-n.png";
import officialAllSportsLogo from "../assets/sponsors/official-all-sports.png";

const STRIP_LOGOS = [
  { src: azersunLogo, alt: "Azersun" },
  { src: dreamFestLogo, alt: "Dream Fest" },
  { src: starCollegesLogo, alt: "Star Colleges" },
  { src: officialHividoLogo, alt: "HIVideo" },
  { src: officialNeonNLogo, alt: "Nooshcard" },
  { src: officialAllSportsLogo, alt: "All Sports" },
] as const;

export function SponsorLogoStrip() {
  return (
    <div className="sponsor-logo-strip" aria-label="Tournament sponsors">
      {STRIP_LOGOS.map((s) => (
        <div key={s.alt} className="sponsor-logo-strip__item">
          <img src={s.src} alt={`${s.alt} — Gold Cup Azerbaijan`} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
