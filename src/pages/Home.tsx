import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import { computeStandingsForGroup } from "../lib/standings";
import { MatchTimelineSplit } from "../components/MatchTimelineSplit";
import { filterMainTimelineEvents } from "../lib/matchEventPenalties";
import { sortMatchEvents } from "../lib/timeline";
import { qfDisplayLabel, qfTimeWindow, type QfSlot } from "../lib/knockoutBracket";
import { formatMatchScoreLineSpaced } from "../lib/matchScoreDisplay";
import { resolveTeamName } from "../lib/matchTeamNames";
import logo from "../assets/goldcup-logo.png";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

const GROUP_LETTERS = ["A", "B", "C", "D"] as const;
const UPCOMING_LIMIT = 10;
const TIMELINE_PREVIEW = 6;

function teamName(map: Map<string, string>, id: string | null) {
  if (!id) return "TBD";
  return map.get(id) ?? "TBD";
}

function matchLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"} · ${m.slot_code ?? ""}`;
  if (m.stage === "qf" && m.slot_code) {
    const slot = m.slot_code as QfSlot;
    return `${qfDisplayLabel(slot)} · ${qfTimeWindow(slot)}`;
  }
  return m.slot_code ?? m.stage;
}

function sortByKickoff(a: MatchRow, b: MatchRow): number {
  const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
  const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  return a.sort_order - b.sort_order;
}

export function Home() {
  const { teams, matches, matchEvents, currentLiveMatchId, loading, error } = useTournament();

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const liveCard = useMemo(() => {
    if (currentLiveMatchId) {
      const m = matches.find((x) => x.id === currentLiveMatchId);
      if (m) return { mode: "featured" as const, match: m };
    }
    const upcoming = matches.filter((m) => m.status === "not_started").sort(sortByKickoff);
    const now = Date.now();
    const withTime = upcoming.filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() >= now);
    const next = withTime[0] ?? upcoming[0] ?? null;
    if (next) return { mode: "next" as const, match: next };
    return { mode: "none" as const, match: null };
  }, [currentLiveMatchId, matches]);

  const timelinePreview = useMemo(() => {
    if (liveCard.mode === "none" || !liveCard.match) return [];
    const all = sortMatchEvents(
      filterMainTimelineEvents(matchEvents.filter((e) => e.match_id === liveCard.match.id)),
    );
    return all.slice(-TIMELINE_PREVIEW);
  }, [liveCard, matchEvents]);

  const upcomingList = useMemo(() => {
    return matches
      .filter((m) => m.status === "not_started" && (!currentLiveMatchId || m.id !== currentLiveMatchId))
      .sort(sortByKickoff)
      .slice(0, UPCOMING_LIMIT);
  }, [matches, currentLiveMatchId]);

  const standingsByGroup = useMemo(() => {
    return GROUP_LETTERS.map((L) => ({
      letter: L,
      rows: computeStandingsForGroup(L, teams, matches),
    }));
  }, [teams, matches]);

  const showLivePulse =
    liveCard.mode === "featured" && liveCard.match && isMatchInPlayOrBreak(liveCard.match.status);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="home-page">
      <header className="home-hero">
        <div className="home-hero-row">
          <img
            className="home-hero-logo"
            src={logo}
            alt="Gold Cup Azerbaijan logo — youth football tournament in Baku"
            width={88}
            height={88}
            fetchPriority="high"
          />
          <div>
            <h1 className="page-title home-title">Gold Cup Azerbaijan</h1>
            <p className="subtitle home-subtitle">Youth Mini Football Tournament in Baku</p>
          </div>
        </div>
      </header>

      <section className="card home-seo-intro" aria-labelledby="home-about-heading">
        <h2 id="home-about-heading" className="section-title">
          About Gold Cup Azerbaijan
        </h2>
        <p className="home-seo-text">
          Gold Cup Azerbaijan is a youth mini football tournament in Baku bringing together school teams, young players,
          supporters, sponsors, media coverage, a fan zone, and a professional matchday atmosphere. The website includes
          fixtures, standings, live match updates, team pages, statistics, sponsors, and tournament news.
        </p>
        <p className="muted home-seo-keywords">
          Follow Gold Cup AZ and Gold Cup Baku for schedules and results from this school football tournament in Baku — a
          leading mini football tournament in Azerbaijan and youth sports event in the capital.
        </p>
      </section>

      {error && <div className="alert warn">{error}</div>}

      <section className="card home-live-card">
        <div className="home-section-head">
          <h2 className="home-section-title">
            {liveCard.mode === "featured" ? "Live match" : liveCard.mode === "next" ? "Next match" : "Live match"}
          </h2>
          {liveCard.match && (
            <div className="home-section-links">
              <Link to={`/matches/${liveCard.match.id}`} className="home-link-more">
                Match page →
              </Link>
              <Link to="/live" className="home-link-more">
                Live tab →
              </Link>
            </div>
          )}
        </div>

        {!liveCard.match ? (
          <p className="muted" style={{ margin: 0 }}>
            No upcoming matches scheduled yet.
          </p>
        ) : (
          <>
            <div className="home-live-meta muted">{matchLabel(liveCard.match)}</div>
            <div className="home-live-teams">
              <span className="home-live-team">{resolveTeamName(liveCard.match, "home", nameById)}</span>
              <div className="home-live-center">
                <span className="home-live-score">
                  {formatMatchScoreLineSpaced(liveCard.match)}
                </span>
                <span className={`home-live-status${showLivePulse ? " home-live-status--pulse" : ""}`}>
                  {liveCard.mode === "featured" ? statusLabel(liveCard.match.status) : "Not started"}
                </span>
              </div>
              <span className="home-live-team">{resolveTeamName(liveCard.match, "away", nameById)}</span>
            </div>
            {liveCard.match.scheduled_at && liveCard.mode === "next" && (
              <p className="muted home-live-kickoff">{formatKickoff(liveCard.match.scheduled_at)}</p>
            )}
            {timelinePreview.length > 0 ? (
              <div className="home-timeline-preview">
                <span className="home-timeline-label">Latest</span>
                <MatchTimelineSplit
                  className="home-timeline-split"
                  match={liveCard.match}
                  events={timelinePreview}
                  teamNameById={nameById}
                />
              </div>
            ) : (
              <p className="muted home-timeline-empty">No timeline events yet.</p>
            )}
          </>
        )}
      </section>

      <section className="card home-fixtures-card">
        <div className="home-section-head">
          <h2 className="home-section-title">Upcoming fixtures</h2>
          <Link to="/fixtures" className="home-link-more">
            All matches →
          </Link>
        </div>
        {upcomingList.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No scheduled not-started matches.
          </p>
        ) : (
          <ul className="home-fixture-list">
            {upcomingList.map((m) => (
              <li key={m.id}>
                <Link to={`/matches/${m.id}`} className="home-fixture-row home-fixture-row--link">
                  <div className="home-fixture-line1">
                    <span className="home-fixture-when">{m.scheduled_at ? formatKickoff(m.scheduled_at) : "TBD"}</span>
                    <span className="home-fixture-meta">{matchLabel(m)}</span>
                  </div>
                  <div className="home-fixture-teams">
                    {resolveTeamName(m, "home", nameById)} <span className="muted">vs</span>{" "}
                    {resolveTeamName(m, "away", nameById)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-standings-preview">
        <div className="home-section-head">
          <h2 className="home-section-title">Standings</h2>
          <Link to="/standings" className="home-link-more">
            Full tables →
          </Link>
        </div>
        <div className="home-standings-grid">
          {standingsByGroup.map(({ letter, rows }) => (
            <section key={letter} className="home-group-card">
              <div className="home-group-badge">Group {letter}</div>
              <div className="table-wrap home-standings-wrap">
                <table className="home-standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GD</th>
                      <th className="home-th-pts">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.team.id}>
                        <td>{i + 1}</td>
                        <td className="home-td-team">{r.team.name}</td>
                        <td>{r.played}</td>
                        <td>{r.wins}</td>
                        <td>{r.draws}</td>
                        <td>{r.losses}</td>
                        <td>{r.gd > 0 ? `+${r.gd}` : `${r.gd}`}</td>
                        <td className="home-td-pts">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
        <p className="muted standings-footnote" style={{ marginTop: 12, fontSize: 12, marginBottom: 0 }}>
          *Points may include disciplinary deductions.
        </p>
      </section>
    </main>
  );
}
