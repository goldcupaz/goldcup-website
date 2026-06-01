import type { KeyboardEvent } from "react";

import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import { koTimeWindowForMatch } from "../lib/knockoutBracket";
import { formatMatchScoreLine } from "../lib/matchScoreDisplay";
import { matchRoundLabel } from "../lib/matchRoundLabels";
import { resolveTeamName } from "../lib/matchTeamNames";
import { TeamNameWithQualification } from "./TeamNameWithQualification";
import { TeamBadge } from "./TeamBadge";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

type Props = {
  match: MatchRow;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
};

function openMatchKey(e: KeyboardEvent, id: string, onOpen: (id: string) => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onOpen(id);
  }
}

function roundLabel(m: MatchRow): string {
  if (m.stage === "group") return `Group ${m.group_letter ?? "?"}`;
  return matchRoundLabel(m);
}

function timeLabel(m: MatchRow): string {
  if (m.scheduled_at) return formatKickoff(m.scheduled_at);
  const window = koTimeWindowForMatch(m);
  if (window) return window.split("–")[0]?.trim() ?? window;
  return "TBD";
}

export function PremiumMatchCard({ match, nameById, onOpen }: Props) {
  const live = isMatchInPlayOrBreak(match.status);
  const finished = match.status === "full_time";
  const showScore = finished || live;
  const homeName = resolveTeamName(match, "home", nameById);
  const awayName = resolveTeamName(match, "away", nameById);

  return (
    <article
      className={`premium-match-card${live ? " premium-match-card--live" : ""}`}
      tabIndex={0}
      role="link"
      aria-label={`${homeName} vs ${awayName}`}
      onClick={() => onOpen(match.id)}
      onKeyDown={(e) => openMatchKey(e, match.id, onOpen)}
    >
      <div className="premium-match-card__meta">
        <span className="premium-match-card__time">{timeLabel(match)}</span>
        <span className="premium-match-card__round">{roundLabel(match)}</span>
        {live ? (
          <span className="badge live premium-match-card__live">LIVE</span>
        ) : (
          <span className="premium-match-card__status">{statusLabel(match.status)}</span>
        )}
      </div>
      <div className="premium-match-card__teams">
        <div className="premium-match-card__side premium-match-card__side--home">
          <TeamBadge name={homeName} />
          <span className="premium-match-card__name">
            <TeamNameWithQualification match={match} side="home" nameById={nameById} />
          </span>
        </div>
        <div className="premium-match-card__center">
          <span className="premium-match-card__score">{showScore ? formatMatchScoreLine(match) : "VS"}</span>
        </div>
        <div className="premium-match-card__side premium-match-card__side--away">
          <span className="premium-match-card__name">
            <TeamNameWithQualification match={match} side="away" nameById={nameById} />
          </span>
          <TeamBadge name={awayName} />
        </div>
      </div>
    </article>
  );
}
