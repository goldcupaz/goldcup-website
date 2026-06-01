import type { Database } from "../lib/database.types";
import { filterPenaltyShootoutEvents } from "../lib/matchEventPenalties";
import { resolveMatchTeamIds, resolveTeamName } from "../lib/matchTeamNames";
import { formatPenaltyKickLine, penaltyKicksForTeam } from "../lib/penaltyShootoutDisplay";
import type { MatchEventRow } from "../lib/timeline";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

type Props = {
  match: MatchRow;
  events: MatchEventRow[];
  teamNameById: Map<string, string>;
  className?: string;
  title?: string;
};

export function PenaltyShootoutTimeline({ match, events, teamNameById, className, title = "Penalty Shootout" }: Props) {
  const penEvents = filterPenaltyShootoutEvents(events.filter((e) => e.match_id === match.id));
  if (penEvents.length === 0) return null;

  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  const homeName = resolveTeamName(match, "home", teamNameById);
  const awayName = resolveTeamName(match, "away", teamNameById);
  const homeKicks = penaltyKicksForTeam(penEvents, homeTeamId);
  const awayKicks = penaltyKicksForTeam(penEvents, awayTeamId);

  return (
    <div className={className ? `penalty-shootout-block ${className}` : "penalty-shootout-block"}>
      <h3 className="live-timeline-title penalty-shootout-title">{title}</h3>
      <div className="penalty-shootout-teams">
        <PenaltyTeamList teamName={homeName} kicks={homeKicks} />
        <PenaltyTeamList teamName={awayName} kicks={awayKicks} />
      </div>
    </div>
  );
}

function PenaltyTeamList({ teamName, kicks }: { teamName: string; kicks: MatchEventRow[] }) {
  if (kicks.length === 0) return null;
  return (
    <div className="penalty-shootout-team">
      <div className="penalty-shootout-team-name">{teamName}:</div>
      <ul className="penalty-shootout-kicks">
        {kicks.map((ev) => (
          <li key={ev.id}>{formatPenaltyKickLine(ev)}</li>
        ))}
      </ul>
    </div>
  );
}
