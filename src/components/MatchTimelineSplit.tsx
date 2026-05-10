import type { Database } from "../lib/database.types";
import { formatTimelineLine, isClockTimelineEvent, sortMatchEvents } from "../lib/timeline";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];

function teamLabel(map: Map<string, string>, id: string | null) {
  if (!id) return "TBD";
  return map.get(id) ?? "TBD";
}

function eventSide(ev: MatchEventRow, match: MatchRow): "home" | "away" | "neutral" {
  if (isClockTimelineEvent(ev.event_type)) return "neutral";
  if (!match.home_team_id || !match.away_team_id) return "neutral";
  if (!ev.team_id) return "neutral";
  if (ev.team_id === match.home_team_id) return "home";
  if (ev.team_id === match.away_team_id) return "away";
  return "neutral";
}

type Props = {
  match: MatchRow;
  events: MatchEventRow[];
  teamNameById: Map<string, string>;
  className?: string;
};

/**
 * Chronological timeline: home team left, away right; match started / half / full time centered.
 */
export function MatchTimelineSplit({ match, events, teamNameById, className }: Props) {
  const sorted = sortMatchEvents(events.filter((e) => e.match_id === match.id));
  const homeName = teamLabel(teamNameById, match.home_team_id);
  const awayName = teamLabel(teamNameById, match.away_team_id);

  return (
    <div className={className ? `match-timeline-split ${className}` : "match-timeline-split"}>
      <div className="match-timeline-split-head">
        <div className="match-timeline-split-team match-timeline-split-team--home">{homeName}</div>
        <div className="match-timeline-split-team match-timeline-split-team--away">{awayName}</div>
      </div>
      <div className="match-timeline-split-body">
        {sorted.length === 0 ? (
          <p className="muted match-timeline-split-empty">No timeline events yet.</p>
        ) : null}
        {sorted.map((ev) => {
          const side = eventSide(ev, match);
          const line = formatTimelineLine(ev, teamNameById);
          if (side === "neutral") {
            return (
              <div key={ev.id} className="match-timeline-split-neutral">
                {line}
              </div>
            );
          }
          return (
            <div key={ev.id} className={`match-timeline-split-row match-timeline-split-row--${side}`}>
              <div className="match-timeline-split-cell match-timeline-split-cell--home">
                {side === "home" ? <span className="match-timeline-split-line">{line}</span> : null}
              </div>
              <div className="match-timeline-split-cell match-timeline-split-cell--away">
                {side === "away" ? <span className="match-timeline-split-line">{line}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
