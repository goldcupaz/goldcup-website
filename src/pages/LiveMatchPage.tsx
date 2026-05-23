import { useMemo } from "react";
import { Link } from "react-router-dom";

import { MatchTimelineSplit } from "../components/MatchTimelineSplit";
import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { resolveTeamName } from "../lib/matchTeamNames";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function matchLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"} · ${m.slot_code ?? ""}`;
  return m.slot_code ?? m.stage;
}

export function LiveMatchPage() {
  const { matches, matchEvents, teams, currentLiveMatchId, loading, error } = useTournament();

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const liveMatch = useMemo(() => {
    if (!currentLiveMatchId) return null;
    return matches.find((m) => m.id === currentLiveMatchId) ?? null;
  }, [matches, currentLiveMatchId]);

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
        Featured match with live score, status, and timeline; then recent full-time results with their timelines.
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
            <Link to={`/matches/${liveMatch.id}`} className="live-board-score-link">
              <div className="live-meta muted">{matchLabel(liveMatch)}</div>
              <div className="live-score-row live-score-row-compact">
                <div className="live-side">
                  <div className="live-name">{resolveTeamName(liveMatch, "home", nameById)}</div>
                </div>
                <div className="live-center">
                  <div className="live-score">
                    {liveMatch.home_score} – {liveMatch.away_score}
                  </div>
                  <div className="live-status">{statusLabel(liveMatch.status)}</div>
                </div>
                <div className="live-side">
                  <div className="live-name">{resolveTeamName(liveMatch, "away", nameById)}</div>
                </div>
              </div>
              <span className="live-open-match-hint muted">Open match page →</span>
            </Link>
            <div className="live-timeline-block">
              <h3 className="live-timeline-title">Timeline</h3>
              <MatchTimelineSplit match={liveMatch} events={matchEvents} teamNameById={nameById} />
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
              const hn = resolveTeamName(m, "home", nameById);
              const an = resolveTeamName(m, "away", nameById);
              return (
                <Link key={m.id} to={`/matches/${m.id}`} className="card live-finished-card live-finished-card--link">
                  <div className="live-finished-head">
                    <span className="live-finished-label">{matchLabel(m)}</span>
                    <span className="muted live-finished-when">{formatKickoff(m.scheduled_at)}</span>
                  </div>
                  <div className="live-finished-score-row">
                    <div className="live-finished-side">
                      <div className="live-finished-team">{hn}</div>
                    </div>
                    <div className="live-finished-center">
                      <span className="live-finished-score">
                        {m.home_score} – {m.away_score}
                      </span>
                      <span className="badge">Full Time</span>
                    </div>
                    <div className="live-finished-side">
                      <div className="live-finished-team">{an}</div>
                    </div>
                  </div>
                  <div className="live-timeline-archive-wrap">
                    <MatchTimelineSplit match={m} events={matchEvents} teamNameById={nameById} />
                  </div>
                  <span className="live-open-match-hint muted">Open match page →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
