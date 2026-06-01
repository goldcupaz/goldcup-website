import { Link } from "react-router-dom";

import { BuyTicketsButton } from "../components/BuyTicketsButton";
import { GoldCupSocialLinks } from "../components/GoldCupSocialLinks";

export function FanzonePage() {
  return (
    <main className="fanzone-page fanzone-page--premium">
      <h1 className="page-title">Fanzone</h1>
      <p className="subtitle fanzone-page__lead">Follow Gold Cup Azerbaijan on matchday.</p>

      <section className="card fanzone-tickets-card">
        <h2 className="section-title section-title--compact">Official tickets</h2>
        <BuyTicketsButton size="lg" />
      </section>

      <section className="card">
        <h2 className="section-title section-title--compact">Social</h2>
        <GoldCupSocialLinks variant="list" source="fanzone_page" />
      </section>

      <p className="muted fanzone-page__links">
        <Link to="/live">Live match →</Link>
        {" · "}
        <Link to="/links">Registration →</Link>
      </p>
    </main>
  );
}
