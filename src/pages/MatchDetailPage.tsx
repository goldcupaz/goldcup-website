import { useEffect, useLayoutEffect, useMemo } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";

import { SeoHead } from "../components/SeoHead";
import { MatchTimelineSplit } from "../components/MatchTimelineSplit";
import { PenaltyShootoutTimeline } from "../components/PenaltyShootoutTimeline";
import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import { formatMatchScoreLineSpaced } from "../lib/matchScoreDisplay";
import { TeamNameWithQualification } from "../components/TeamNameWithQualification";
import { resolveTeamName } from "../lib/matchTeamNames";
import { matchRoundLabel } from "../lib/matchRoundLabels";
import { trackMatchPageOpen } from "../lib/websiteAnalytics";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function matchLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"} · ${m.slot_code ?? ""}`;
  return matchRoundLabel(m);
}

export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const location = useLocation();
  const { matches, matchEvents, teams, loading, error } = useTournament();

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const match = useMemo(() => {
    if (!matchId) return null;
    return matches.find((m) => m.id === matchId) ?? null;
  }, [matches, matchId]);

  const matchSeo = useMemo(() => {
    if (!match) {
      return {
        title: "Gold Cup Match | Gold Cup Azerbaijan",
        description:
          "Match details, live score, and timeline for Gold Cup Azerbaijan youth mini football tournament in Baku.",
      };
    }
    const home = resolveTeamName(match, "home", nameById);
    const away = resolveTeamName(match, "away", nameById);
    return {
      title: `${home} vs ${away} | Gold Cup Fixtures & Results`,
      description: `${home} vs ${away} at Gold Cup Azerbaijan — live score, match timeline, and results for this youth mini football tournament in Baku.`,
    };
  }, [match, nameById]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [matchId]);

  useEffect(() => {
    if (matchId && match) trackMatchPageOpen(matchId);
  }, [matchId, match?.id]);

  if (!matchId) return <Navigate to="/fixtures" replace />;

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  if (!loading && !match) {
    return (
      <main className="match-detail-page">
        <SeoHead pathname={location.pathname} title={matchSeo.title} description={matchSeo.description} />
        <p className="empty">Match not found.</p>
        <Link to="/fixtures" className="btn">
          Back to fixtures
        </Link>
      </main>
    );
  }

  if (!match) return <p className="empty">Loading…</p>;

  const live = isMatchInPlayOrBreak(match.status);
  const finished = match.status === "full_time";
  const showScore = finished || live;

  return (
    <main className="match-detail-page">
      <SeoHead pathname={location.pathname} title={matchSeo.title} description={matchSeo.description} />
      <div className="match-detail-back">
        <Link className="muted" to="/fixtures" style={{ fontWeight: 700, textDecoration: "none" }}>
          ← Fixtures
        </Link>
      </div>

      <h1 className="page-title match-detail-title">
        <TeamNameWithQualification match={match} side="home" nameById={nameById} />{" "}
        <span className="muted" style={{ fontWeight: 600 }}>
          vs
        </span>{" "}
        <TeamNameWithQualification match={match} side="away" nameById={nameById} />
      </h1>

      <div className="muted match-detail-meta">{matchLabel(match)}</div>
      {match.scheduled_at && <p className="muted match-detail-kick">{formatKickoff(match.scheduled_at)}</p>}
      {match.venue?.trim() && <p className="muted match-detail-kick">{match.venue.trim()}</p>}

      {error && <div className="alert warn">{error}</div>}

      <div className="card live-board live-featured-card match-detail-board">
        <div className="live-score-row live-score-row-compact">
          <div className="live-side">
            <div className="live-name">{resolveTeamName(match, "home", nameById)}</div>
          </div>
          <div className="live-center">
            <div className="live-score">
              {showScore ? formatMatchScoreLineSpaced(match) : "vs"}
            </div>
            <div className="live-status">{statusLabel(match.status)}</div>
          </div>
          <div className="live-side">
            <div className="live-name">{resolveTeamName(match, "away", nameById)}</div>
          </div>
        </div>

        <div className="live-timeline-block">
          <h3 className="live-timeline-title">Timeline</h3>
          <MatchTimelineSplit match={match} events={matchEvents} teamNameById={nameById} />
          <PenaltyShootoutTimeline match={match} events={matchEvents} teamNameById={nameById} />
        </div>
      </div>
    </main>
  );
}
