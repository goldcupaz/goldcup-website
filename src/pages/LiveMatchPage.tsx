import { useMemo } from "react";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function teamName(map: Map<string, string>, id: string | null) {
  if (!id) return "TBD";
  return map.get(id) ?? "TBD";
}

function goalsForMatch(
  match: MatchRow,
  goals: Database["public"]["Tables"]["match_goals"]["Row"][],
): { home: string[]; away: string[] } {
  const mg = goals.filter((g) => g.match_id === match.id);
  const home: string[] = [];
  const away: string[] = [];
  for (const g of mg) {
    if (g.team_id === match.home_team_id) home.push(g.scorer_name);
    else if (g.team_id === match.away_team_id) away.push(g.scorer_name);
  }
  return { home, away };
}

function matchLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"} · ${m.slot_code ?? ""}`;
  return m.slot_code ?? m.stage;
}

export function LiveMatchPage() {
  const { matches, goals, teams, currentLiveMatchId, loading, error } = useTournament();

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const liveMatch = useMemo(() => {
    if (!currentLiveMatchId) return null;
    return matches.find((m) => m.id === currentLiveMatchId) ?? null;
  }, [matches, currentLiveMatchId]);

  const featuredGoals = useMemo(() => {
    if (!liveMatch) return { home: [] as string[], away: [] as string[] };
    return goalsForMatch(liveMatch, goals);
  }, [liveMatch, goals]);

  const finishedArchive = useMemo(() => {
    const list = matches.filter((m) => m.status === "full_time");
    const exclude = currentLiveMatchId;
    const filtered = exclude ? list.filter((m) => m.id !== exclude) : list;
    return filtered.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return tb - ta;
    });
  }, [matches, currentLiveMatchId]);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="live-page">
      <h1 className="page-title">Live match</h1>
      <p className="subtitle">
        Featured match from the tournament feed, then recent full-time results with scorers.
      </p>
      {error && <div className="alert warn">{error}</div>}

      <section className="live-section">
        <h2 className="live-section-title">Featured match</h2>
        {!currentLiveMatchId || !liveMatch ? (
          <div className="card live-featured-card">
            <p className="muted" style={{ margin: 0 }}>
              No match is featured yet. An admin can choose one under Admin → Live match.
            </p>
          </div>
        ) : (
          <div className="live-board live-featured-card">
            <div className="live-meta muted">{matchLabel(liveMatch)}</div>
            <div className="live-score-row">
              <div className="live-side">
                <div className="live-name">{teamName(nameById, liveMatch.home_team_id)}</div>
                <div className="live-goals">
                  Goal scorers
                  <ul>
                    {featuredGoals.home.map((n, i) => (
                      <li key={`fh${i}`}>{n}</li>
                    ))}
                    {featuredGoals.home.length === 0 && <li className="muted">—</li>}
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
                <div className="live-name">{teamName(nameById, liveMatch.away_team_id)}</div>
                <div className="live-goals">
                  Goal scorers
                  <ul>
                    {featuredGoals.away.map((n, i) => (
                      <li key={`fa${i}`}>{n}</li>
                    ))}
                    {featuredGoals.away.length === 0 && <li className="muted">—</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="live-section">
        <h2 className="live-section-title">Previously finished</h2>
        {finishedArchive.length === 0 ? (
          <p className="muted">No full-time results yet.</p>
        ) : (
          <div className="live-archive">
            {finishedArchive.map((m) => {
              const g = goalsForMatch(m, goals);
              const hn = teamName(nameById, m.home_team_id);
              const an = teamName(nameById, m.away_team_id);
              return (
                <article key={m.id} className="card live-finished-card">
                  <div className="live-finished-head">
                    <span className="live-finished-label">{matchLabel(m)}</span>
                    <span className="muted live-finished-when">{formatKickoff(m.scheduled_at)}</span>
                  </div>
                  <div className="live-finished-score-row">
                    <div className="live-finished-side">
                      <div className="live-finished-team">{hn}</div>
                      <ul className="live-finished-goals">
                        {g.home.map((n, i) => (
                          <li key={`${m.id}h${i}`}>{n}</li>
                        ))}
                        {g.home.length === 0 && <li className="muted">—</li>}
                      </ul>
                    </div>
                    <div className="live-finished-center">
                      <span className="live-finished-score">
                        {m.home_score} – {m.away_score}
                      </span>
                      <span className="badge">Full Time</span>
                    </div>
                    <div className="live-finished-side">
                      <div className="live-finished-team">{an}</div>
                      <ul className="live-finished-goals">
                        {g.away.map((n, i) => (
                          <li key={`${m.id}a${i}`}>{n}</li>
                        ))}
                        {g.away.length === 0 && <li className="muted">—</li>}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
