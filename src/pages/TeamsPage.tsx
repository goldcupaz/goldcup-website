import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import { teamGoalsFromMatches, topGoalscorersFromEvents } from "../lib/tournamentStats";

export function TeamsPage() {
  const { teams, players, matches, matchEvents, loading, error } = useTournament();

  const topScorers = useMemo(() => topGoalscorersFromEvents(matchEvents).slice(0, 15), [matchEvents]);

  const teamTotals = useMemo(() => teamGoalsFromMatches(matches, teams), [matches, teams]);

  const highestScoring = useMemo(
    () => [...teamTotals].sort((a, b) => b.gf - a.gf || a.teamName.localeCompare(b.teamName)).slice(0, 10),
    [teamTotals],
  );

  const mostConceded = useMemo(
    () => [...teamTotals].sort((a, b) => b.ga - a.ga || a.teamName.localeCompare(b.teamName)).slice(0, 10),
    [teamTotals],
  );

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="teams-overview-page">
      <h1 className="page-title">Teams</h1>
      <p className="subtitle">Explore squads, standings-style stats, and rankings from live and completed matches.</p>
      {error && <div className="alert warn">{error}</div>}

      <div className="teams-rankings-grid">
        <section className="card teams-ranking-card">
          <h2 className="section-title">Top goalscorers</h2>
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            From timeline goal events · top 15
          </p>
          {topScorers.length === 0 ? (
            <p className="muted">No goals recorded yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="teams-ranking-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>G</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((r) => (
                    <tr key={`${r.rank}-${r.name}`}>
                      <td>{r.rank}</td>
                      <td style={{ fontWeight: 700 }}>{r.name}</td>
                      <td style={{ fontWeight: 900, color: "var(--gold)" }}>{r.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card teams-ranking-card">
          <h2 className="section-title">Highest goalscoring teams</h2>
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Total goals scored (current match scores when live)
          </p>
          {highestScoring.length === 0 ? (
            <p className="muted">No matches in play or finished yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="teams-ranking-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>GF</th>
                  </tr>
                </thead>
                <tbody>
                  {highestScoring.map((r, i) => (
                    <tr key={r.teamId}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{r.teamName}</td>
                      <td style={{ fontWeight: 900, color: "var(--gold)" }}>{r.gf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card teams-ranking-card">
          <h2 className="section-title">Most goals conceded</h2>
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Total goals against (current match scores when live)
          </p>
          {mostConceded.length === 0 ? (
            <p className="muted">No matches in play or finished yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="teams-ranking-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>GA</th>
                  </tr>
                </thead>
                <tbody>
                  {mostConceded.map((r, i) => (
                    <tr key={r.teamId}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{r.teamName}</td>
                      <td style={{ fontWeight: 900 }}>{r.ga}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">All teams</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          {players.length} player{players.length === 1 ? "" : "s"} registered · open a team for full roster and fixtures.
        </p>
        <div className="team-grid">
          {teams.map((t) => {
            const staff = [t.manager_1, t.manager_2].filter((x): x is string => !!(x && String(x).trim()));
            return (
              <Link key={t.id} className="team-card-btn team-card-link" to={`/teams/${t.id}`}>
                {t.name}
                <span className="muted" style={{ display: "block", fontWeight: 600, fontSize: 12, marginTop: 4 }}>
                  Group {t.group_letter}
                </span>
                {staff.length > 0 && (
                  <span className="muted teams-card-staff" style={{ display: "block", fontSize: 11, marginTop: 6 }}>
                    {staff.slice(0, 2).join(" · ")}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
