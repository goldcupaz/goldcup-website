import { useMemo } from "react";
import { Link } from "react-router-dom";

import { BuyTicketsButton } from "../components/BuyTicketsButton";
import { SponsorLogoStrip } from "../components/SponsorLogoStrip";
import { useTournament } from "../context/TournamentContext";
import { FINAL_FIXTURE, SEMI_FINALS, THIRD_PLACE_FIXTURE } from "../lib/knockoutBracket";
import { formatHeroKickoff } from "../lib/heroKickoff";

const FINALISTS = new Set(["MTK Eagles", "Sambo FC"]);

function finalistStar(name: string): string {
  return FINALISTS.has(name) ? " ★" : "";
}

export function Home() {
  const { matches, loading, error } = useTournament();

  const finalMatch = useMemo(
    () => matches.find((m) => m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot) ?? null,
    [matches],
  );

  const thirdMatch = useMemo(
    () => matches.find((m) => m.stage === "third" && m.slot_code === THIRD_PLACE_FIXTURE.slot) ?? null,
    [matches],
  );

  const finalKickoff = formatHeroKickoff(finalMatch?.scheduled_at, "7 JUNE • 20:00");
  const thirdKickoff = formatHeroKickoff(thirdMatch?.scheduled_at, "7 JUNE • 18:00");

  const venue =
    finalMatch?.venue?.trim() || thirdMatch?.venue?.trim() || "Aquatic Palace";

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="home-page home-page--premium">
      <section className="uefa-hero" aria-labelledby="home-hero-title">
        <p className="uefa-hero__eyebrow">Gold Cup Azerbaijan</p>
        <h1 id="home-hero-title" className="uefa-hero__title">
          THE FINAL
        </h1>
        <p className="uefa-hero__matchup">
          {FINAL_FIXTURE.homeTeamName}
          <span className="uefa-hero__vs">vs</span>
          {FINAL_FIXTURE.awayTeamName}
        </p>
        <p className="uefa-hero__when">{finalKickoff}</p>
        <p className="uefa-hero__venue">{venue}</p>
        <div className="uefa-hero__actions">
          <BuyTicketsButton size="lg" />
          <Link to="/fixtures" className="btn btn-ghost btn-ghost--lg">
            View Fixtures
          </Link>
        </div>
      </section>

      <section className="uefa-mini-card card" aria-label="Third place match">
        <div className="uefa-mini-card__label">Third Place</div>
        <div className="uefa-mini-card__teams">
          {THIRD_PLACE_FIXTURE.homeTeamName}
          <span className="muted"> vs </span>
          {THIRD_PLACE_FIXTURE.awayTeamName}
        </div>
        <div className="uefa-mini-card__when">{thirdKickoff}</div>
      </section>

      {error && <div className="alert warn">{error}</div>}

      <section className="uefa-road card" aria-labelledby="road-final-heading">
        <h2 id="road-final-heading" className="section-title section-title--compact">
          Road to Final
        </h2>
        <ul className="uefa-road__list">
          {SEMI_FINALS.map((sf) => (
            <li key={sf.slot} className="uefa-road__item">
              <span className="uefa-road__sf">{sf.slot}</span>
              <span className="uefa-road__teams">
                {sf.homeTeamName}
                {finalistStar(sf.homeTeamName)}
                <span className="uefa-road__vs">vs</span>
                {sf.awayTeamName}
                {finalistStar(sf.awayTeamName)}
              </span>
            </li>
          ))}
        </ul>
        <p className="uefa-road__foot muted">
          <Link to="/knockout">Full knockout path →</Link>
        </p>
      </section>

      <section className="uefa-sponsors" aria-label="Sponsors">
        <h2 className="section-title section-title--compact uefa-sponsors__title">Partners</h2>
        <SponsorLogoStrip />
      </section>

      <section className="uefa-about card" aria-labelledby="home-about-heading">
        <h2 id="home-about-heading" className="section-title section-title--compact">
          About Gold Cup
        </h2>
        <p className="uefa-about__text">
          Youth mini football in Baku — fixtures, live scores, standings, and official tickets via iTicket.
        </p>
        <Link to="/about" className="home-link-more">
          More about the tournament →
        </Link>
      </section>

      <div className="seo-visually-hidden">
        <h2>Gold Cup Azerbaijan</h2>
        <p>
          Gold Cup Azerbaijan (Gold Cup AZ, Gold Cup Baku) is a youth football tournament in Baku and mini football
          tournament in Azerbaijan. School football tournament Baku, youth sports event Baku, football fan zone Baku.
          Official tickets at iTicket.
        </p>
      </div>
    </main>
  );
}
