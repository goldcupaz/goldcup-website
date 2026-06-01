import { Link } from "react-router-dom";

import { GoldCupSocialLinks } from "../components/GoldCupSocialLinks";

export function FanzonePage() {
  return (
    <main className="fanzone-page">
      <h1 className="page-title">Gold Cup Fanzone</h1>
      <p className="subtitle">
        Welcome to the Gold Cup fan zone in Baku — follow live scores, connect on social media, and stay close to the
        youth football tournament atmosphere.
      </p>

      <section className="card">
        <h2 className="section-title">Follow the tournament</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Gold Cup AZ shares match updates, highlights, and announcements across official channels. Whether you support
          a school team or follow the full mini football tournament in Azerbaijan, the fan zone keeps you connected.
        </p>
        <GoldCupSocialLinks variant="list" source="fanzone_page" />
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">Registration &amp; tickets</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Teams and volunteers can register through our official forms. Visit the links page for registration and ticket
          information for this youth sports event in Baku.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link to="/links" className="home-link-more">
            Social &amp; registration →
          </Link>
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">Live match centre</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Follow the featured live match with scores and timeline updates during matchdays.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link to="/live" className="home-link-more">
            Live match →
          </Link>
        </p>
      </section>
    </main>
  );
}
