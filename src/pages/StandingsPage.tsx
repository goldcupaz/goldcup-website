import { useMemo } from "react";
import { Link } from "react-router-dom";

import { TeamBadge } from "../components/TeamBadge";
import { useTournament } from "../context/TournamentContext";
import { computeStandingsForGroup } from "../lib/standings";

const LETTERS = ["A", "B", "C", "D"] as const;

export function StandingsPage() {
  const { teams, matches, loading, error } = useTournament();

  const tables = useMemo(() => {
    return LETTERS.map((L) => ({
      letter: L,
      rows: computeStandingsForGroup(L, teams, matches),
    }));
  }, [teams, matches]);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="standings-page standings-page--premium">
      <h1 className="page-title">Standings</h1>
      {error && <div className="alert warn">{error}</div>}
      <div className="standings-premium-grid">
        {tables.map(({ letter, rows }) => (
          <section key={letter} className="card standings-group-card">
            <div className="standings-group-card__head">
              <span className="badge">Group {letter}</span>
            </div>
            <div className="table-wrap">
              <table className="standings-table-compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th className="standings-priority">W</th>
                    <th className="standings-priority">GD</th>
                    <th className="standings-priority standings-th-pts">PTS</th>
                    <th className="standings-secondary">P</th>
                    <th className="standings-secondary">D</th>
                    <th className="standings-secondary">L</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.team.id}>
                      <td>{i + 1}</td>
                      <td className="standings-team-cell">
                        <TeamBadge name={r.team.name} size="sm" />
                        <Link to={`/teams/${r.team.id}`} className="standings-team-link">
                          {r.team.name}
                        </Link>
                      </td>
                      <td className="standings-priority">{r.wins}</td>
                      <td className="standings-priority">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className="standings-priority standings-td-pts">{r.pts}</td>
                      <td className="standings-secondary">{r.played}</td>
                      <td className="standings-secondary">{r.draws}</td>
                      <td className="standings-secondary">{r.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
      <p className="muted standings-footnote standings-footnote--compact">*Points may include disciplinary deductions.</p>
    </main>
  );
}
