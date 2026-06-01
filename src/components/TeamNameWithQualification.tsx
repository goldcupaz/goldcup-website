import { showsSemifinalQualificationStar } from "../lib/knockoutBracket";
import { resolveMatchTeamIds, resolveTeamId, resolveTeamName, type MatchSides } from "../lib/matchTeamNames";

type Props = {
  match: MatchSides;
  side: "home" | "away";
  nameById: Map<string, string>;
  className?: string;
};

export function TeamNameWithQualification({ match, side, nameById, className }: Props) {
  const name = resolveTeamName(match, side, nameById);
  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  const teamId = side === "home" ? homeTeamId : awayTeamId;
  const showStar = showsSemifinalQualificationStar(match, name, teamId ?? resolveTeamId(match, side));

  if (!showStar) {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={className}>
      {name}{" "}
      <span className="team-qualified-star" title="Qualified for semi-finals" aria-label="Qualified">
        ★
      </span>
    </span>
  );
}
