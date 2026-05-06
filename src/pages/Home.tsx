import { Link } from "react-router-dom";

export function Home() {
  return (
    <main>
      <h1 className="page-title">Gold Cup</h1>
      <p className="subtitle">
        Official tournament hub — groups, live scores, fixtures, and the knockout path. Updates are stored in the cloud so
        every fan sees the same match state.
      </p>
      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase" }}>Live</h2>
          <p className="muted">Follow the featured match with score, status, and goal scorers.</p>
          <Link to="/live" className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            Open live match
          </Link>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Fixtures & standings
          </h2>
          <p className="muted">Group stage results feed the standings table automatically.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link to="/fixtures" className="btn">
              Fixtures
            </Link>
            <Link to="/standings" className="btn">
              Standings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
