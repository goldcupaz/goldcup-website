import { QF_BY_SLOT, QF_TEAM_IDS, type QfSlot } from "./knockoutBracket";

type MatchSides = {
  stage: string;
  slot_code: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
};

/** Home/away display name; quarter-finals fall back to fixed bracket when DB teams are unset. */
export function resolveTeamName(
  match: MatchSides,
  side: "home" | "away",
  nameById: Map<string, string>,
): string {
  const id = side === "home" ? match.home_team_id : match.away_team_id;
  if (id) {
    const name = nameById.get(id);
    if (name) return name;
  }
  if (match.stage === "qf" && match.slot_code && match.slot_code in QF_BY_SLOT) {
    const def = QF_BY_SLOT[match.slot_code as QfSlot];
    return side === "home" ? def.homeTeamName : def.awayTeamName;
  }
  return "TBD";
}

/** Resolved team id for admin saves / live events (QF bracket when DB unset). */
export function resolveTeamId(match: MatchSides, side: "home" | "away"): string | null {
  const id = side === "home" ? match.home_team_id : match.away_team_id;
  if (id) return id;
  if (match.stage === "qf" && match.slot_code && match.slot_code in QF_BY_SLOT) {
    const def = QF_BY_SLOT[match.slot_code as QfSlot];
    const key = (side === "home" ? def.homeTeamName : def.awayTeamName) as keyof typeof QF_TEAM_IDS;
    return QF_TEAM_IDS[key] ?? null;
  }
  return null;
}

/** Effective home/away team ids (stored on match or fixed QF bracket). */
export function resolveMatchTeamIds(match: MatchSides): {
  homeTeamId: string | null;
  awayTeamId: string | null;
} {
  return {
    homeTeamId: resolveTeamId(match, "home"),
    awayTeamId: resolveTeamId(match, "away"),
  };
}

export function qfMatchNeedsTeamPersist(match: MatchSides): boolean {
  if (match.stage !== "qf" || !match.slot_code || !(match.slot_code in QF_BY_SLOT)) return false;
  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  if (!homeTeamId || !awayTeamId) return false;
  return !match.home_team_id || !match.away_team_id;
}
