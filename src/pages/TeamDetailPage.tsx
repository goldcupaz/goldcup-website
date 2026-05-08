import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { topGoalscorersFromEvents } from "../lib/tournamentStats";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function teamName(map: Map<string, string>, id: string | null) {
  if (!id) return "TBD";
  return map.get(id) ?? "TBD";
}

function matchLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"} · ${m.slot_code ?? ""}`;
  return m.slot_code ?? m.stage;
}

function sortMatches(a: MatchRow, b: MatchRow): number {
  const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : a.sort_order;
  const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : b.sort_order;
  if (ta !== tb) return ta - tb;
  return a.sort_order - b.sort_order;
}

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { teams, matches, matchEvents, players, loading, error } = useTournament();

  const team = teams.find((t) => t.id === teamId);

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const roster = useMemo(() => {
    if (!teamId) return [];
    return players
      .filter((p) => p.team_id === teamId)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [players, teamId]);

  const managers = useMemo(() => {
    if (!team) return [];
    return [team.manager_1, team.manager_2].filter((x): x is string => !!(x && x.trim()));
  }, [team]);

  const teamMatches = useMemo(() => {
    if (!teamId) return [];
    return matches
      .filter((m) => m.home_team_id === teamId || m.away_team_id === teamId)
      .sort(sortMatches);
  }, [matches, teamId]);

  const { upcoming, previous } = useMemo(() => {
    const up: MatchRow[] = [];
    const prev: MatchRow[] = [];
    for (const m of teamMatches) {
      if (m.status === "full_time") prev.push(m);
      else up.push(m);
    }
    return { upcoming: up, previous: prev.reverse() };
  }, [teamMatches]);

  const scorerRows = useMemo(
    () => topGoalscorersFromEvents(matchEvents, { teamId: teamId ?? undefined }).slice(0, 20),
    [matchEvents, teamId],
  );

  if (!teamId) return <Navigate to="/teams" replace />;

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;
  if (!loading && !team) return <Navigate to="/teams" replace />;
  if (!team) return <p className="empty">Loading…</p>;

  return (
    <main className="team-detail-page">
      <div className="team-detail-back">
        <Link className="muted" to="/teams" style={{ fontWeight: 700, textDecoration: "none" }}>
          ← Teams
        </Link>
      </div>

      <h1 className="page-title">{team.name}</h1>
      <p className="subtitle">Group {team.group_letter} · Squad, fixtures, and scoring from match timelines.</p>
      {error && <div className="alert warn">{error}</div>}

      <>
          {managers.length > 0 && (
            <section className="card team-detail-block">
              <h2 className="section-title">Managers / Coaches</h2>
              <div className="team-managers-list">
                {managers.map((m, i) => (
                  <span key={`${m}-${i}`} className="team-manager-pill">
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="card team-detail-block">
            <h2 className="section-title">Squad</h2>
            {roster.length === 0 ? (
              <p className="muted">No players listed yet.</p>
            ) : (
              <ul className="team-detail-roster">
                {roster.map((p) => {
                  const gk = !!p.is_goalkeeper;
                  return (
                    <li key={p.id} className={gk ? "team-detail-player team-detail-player--gk" : "team-detail-player"}>
                      {gk && <span className="gk-badge">GK</span>}
                      {p.name}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card team-detail-block">
            <h2 className="section-title">Top goalscorers</h2>
            {scorerRows.length === 0 ? (
              <p className="muted">No goal events logged for this team yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="team-scorers-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorerRows.map((r) => (
                      <tr key={r.name + r.rank}>
                        <td>{r.rank}</td>
                        <td style={{ fontWeight: 800 }}>{r.name}</td>
                        <td style={{ fontWeight: 900, color: "var(--gold)" }}>{r.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card team-detail-block">
            <h2 className="section-title">Previous matches</h2>
            {previous.length === 0 ? (
              <p className="muted">No finished matches yet.</p>
            ) : (
              <ul className="team-match-list">
                {previous.map((m) => (
                  <li key={m.id} className="team-match-row">
                    <div className="team-match-meta muted">{matchLabel(m)}</div>
                    <div className="team-match-scoreline">
                      <span>{teamName(nameById, m.home_team_id)}</span>
                      <strong className="team-match-score">
                        {m.home_score}–{m.away_score}
                      </strong>
                      <span>{teamName(nameById, m.away_team_id)}</span>
                    </div>
                    {m.scheduled_at && (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {formatKickoff(m.scheduled_at)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card team-detail-block">
            <h2 className="section-title">Upcoming matches</h2>
            {upcoming.length === 0 ? (
              <p className="muted">No upcoming or live fixtures on record.</p>
            ) : (
              <ul className="team-match-list">
                {upcoming.map((m) => (
                  <li key={m.id} className="team-match-row">
                    <div className="team-match-meta muted">{matchLabel(m)}</div>
                    <div className="team-match-scoreline">
                      <span>{teamName(nameById, m.home_team_id)}</span>
                      <strong className="team-match-score">
                        {m.home_score}–{m.away_score}
                      </strong>
                      <span>{teamName(nameById, m.away_team_id)}</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span className="badge">{statusLabel(m.status)}</span>
                    </div>
                    {m.scheduled_at && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {formatKickoff(m.scheduled_at)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
      </>
    </main>
  );
}
