import { useMemo } from "react";

import { useTournament } from "../context/TournamentContext";
import { statusLabel } from "../lib/format";

export function LiveMatchPage() {
  const { matches, goals, teams, currentLiveMatchId, loading, error } = useTournament();

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const liveMatch = useMemo(() => {
    if (!currentLiveMatchId) return null;
    return matches.find((m) => m.id === currentLiveMatchId) ?? null;
  }, [matches, currentLiveMatchId]);

  const goalLists = useMemo(() => {
    if (!liveMatch) return { home: [] as string[], away: [] as string[] };
    const mg = goals.filter((g) => g.match_id === liveMatch.id);
    const home: string[] = [];
    const away: string[] = [];
    for (const g of mg) {
      if (g.team_id === liveMatch.home_team_id) home.push(g.scorer_name);
      else if (g.team_id === liveMatch.away_team_id) away.push(g.scorer_name);
    }
    return { home, away };
  }, [liveMatch, goals]);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  if (!currentLiveMatchId || !liveMatch)
    return (
      <main>
        <h1 className="page-title">Live match</h1>
        <p className="empty">
          No match is set as live yet. An administrator can pick the featured match in the admin panel.
        </p>
        {error && <div className="alert warn">{error}</div>}
      </main>
    );

  const hn = liveMatch.home_team_id ? nameById.get(liveMatch.home_team_id) ?? "Home" : "Home";
  const an = liveMatch.away_team_id ? nameById.get(liveMatch.away_team_id) ?? "Away" : "Away";

  return (
    <main>
      <h1 className="page-title">Live match</h1>
      {error && <div className="alert warn">{error}</div>}
      <div className="live-board">
        <div className="live-score-row">
          <div className="live-side">
            <div className="live-name">{hn}</div>
            <div className="live-goals">
              Goal scorers
              <ul>
                {goalLists.home.map((n, i) => (
                  <li key={`h${i}`}>{n}</li>
                ))}
                {goalLists.home.length === 0 && <li className="muted">—</li>}
              </ul>
            </div>
          </div>
          <div className="live-center">
            <div className="live-score">
              {liveMatch.home_score} – {liveMatch.away_score}
            </div>
            <div className="live-status">{statusLabel(liveMatch.status)}</div>
          </div>
          <div className="live-side">
            <div className="live-name">{an}</div>
            <div className="live-goals">
              Goal scorers
              <ul>
                {goalLists.away.map((n, i) => (
                  <li key={`a${i}`}>{n}</li>
                ))}
                {goalLists.away.length === 0 && <li className="muted">—</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
