import { useMemo } from "react";

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
    <main>
      <h1 className="page-title">Standings</h1>
      <p className="subtitle">
        Group standings use current scores for live matches and half-time (points, GF/GA/GD update in real time) and lock
        in when each match finishes. Tiebreak: points, head-to-head (among finished fixtures), goal difference, goals scored,
        goals conceded (lower is better), then draw.
      </p>
      {error && <div className="alert warn">{error}</div>}
      <div className="grid-2">
        {tables.map(({ letter, rows }) => (
          <section key={letter} className="card">
            <div className="badge" style={{ marginBottom: 12 }}>
              Group {letter}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.team.id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 800 }}>{r.team.name}</td>
                      <td>{r.played}</td>
                      <td>{r.wins}</td>
                      <td>{r.draws}</td>
                      <td>{r.losses}</td>
                      <td>{r.gf}</td>
                      <td>{r.ga}</td>
                      <td>{r.gd}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 900 }}>{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
