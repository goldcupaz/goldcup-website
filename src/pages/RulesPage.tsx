import { Link } from "react-router-dom";

export function RulesPage() {
  return (
    <main>
      <h1 className="page-title">Rules &amp; Fair Play</h1>
      <p className="subtitle">
        Gold Cup Azerbaijan is run with clear rules so every school team can compete fairly in this youth mini football
        tournament in Baku.
      </p>

      <section className="card">
        <h2 className="section-title">Competition format</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          The tournament follows a group stage, quarter-finals, semi-finals, third-place match, and final. Fixtures,
          standings, and results are published on this website so coaches, players, and families always know what is
          next.
        </p>
        <p className="muted" style={{ marginTop: 10 }}>
          <Link to="/fixtures">View fixtures &amp; results →</Link>
          {" · "}
          <Link to="/standings">Standings →</Link>
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">Fair play</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Respect for opponents, referees, and officials is required at all times. Unsporting behaviour, dissent, and
          dangerous play may result in disciplinary action. Gold Cup promotes competitive but respectful youth football.
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">Match conduct</h2>
        <ul className="muted" style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Teams must arrive on time and ready for scheduled kickoffs.</li>
          <li>Squad lists and player eligibility are confirmed before the tournament.</li>
          <li>Decisions of match officials are final on the day.</li>
          <li>Organisers may adjust schedules for safety or operational reasons with notice where possible.</li>
        </ul>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">More information</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          For mission, sponsors, and the full tournament story, see the About page.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link to="/about" className="home-link-more">
            About Gold Cup →
          </Link>
        </p>
      </section>
    </main>
  );
}
