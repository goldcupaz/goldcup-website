import {
  FINAL_FIXTURE,
  QF_BY_SLOT,
  QF_TEAM_IDS,
  SF_BY_SLOT,
  SF_TEAM_IDS,
  THIRD_PLACE_FIXTURE,
  finalTeamIds,
  thirdPlaceTeamIds,
  type QfSlot,
  type SfSlot,
} from "./knockoutBracket";

export type MatchSides = {
  stage: string;
  slot_code: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
};

function bracketTeamName(match: MatchSides, side: "home" | "away"): string | null {
  if (match.stage === "qf" && match.slot_code && match.slot_code in QF_BY_SLOT) {
    const def = QF_BY_SLOT[match.slot_code as QfSlot];
    return side === "home" ? def.homeTeamName : def.awayTeamName;
  }
  if (match.stage === "sf" && match.slot_code && match.slot_code in SF_BY_SLOT) {
    const def = SF_BY_SLOT[match.slot_code as SfSlot];
    return side === "home" ? def.homeTeamName : def.awayTeamName;
  }
  if (match.stage === "final" && match.slot_code === FINAL_FIXTURE.slot) {
    return side === "home" ? FINAL_FIXTURE.homeTeamName : FINAL_FIXTURE.awayTeamName;
  }
  if (match.stage === "third" && match.slot_code === THIRD_PLACE_FIXTURE.slot) {
    return side === "home" ? THIRD_PLACE_FIXTURE.homeTeamName : THIRD_PLACE_FIXTURE.awayTeamName;
  }
  return null;
}

function bracketTeamId(match: MatchSides, side: "home" | "away"): string | null {
  const name = bracketTeamName(match, side);
  if (!name) return null;
  if (match.stage === "final" && match.slot_code === FINAL_FIXTURE.slot) {
    const ids = finalTeamIds();
    return side === "home" ? ids.homeTeamId : ids.awayTeamId;
  }
  if (match.stage === "third" && match.slot_code === THIRD_PLACE_FIXTURE.slot) {
    const ids = thirdPlaceTeamIds();
    return side === "home" ? ids.homeTeamId : ids.awayTeamId;
  }
  const ids = { ...QF_TEAM_IDS, ...SF_TEAM_IDS };
  return ids[name as keyof typeof ids] ?? null;
}

/** Home/away display name; QF/SF fall back to fixed bracket when DB teams are unset. */
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
  return bracketTeamName(match, side) ?? "TBD";
}

/** Resolved team id for admin saves / live events (QF/SF bracket when DB unset). */
export function resolveTeamId(match: MatchSides, side: "home" | "away"): string | null {
  const id = side === "home" ? match.home_team_id : match.away_team_id;
  if (id) return id;
  return bracketTeamId(match, side);
}

/** Effective home/away team ids (stored on match or fixed knockout bracket). */
export function resolveMatchTeamIds(match: MatchSides): {
  homeTeamId: string | null;
  awayTeamId: string | null;
} {
  return {
    homeTeamId: resolveTeamId(match, "home"),
    awayTeamId: resolveTeamId(match, "away"),
  };
}

export function koMatchNeedsTeamPersist(match: MatchSides): boolean {
  if (match.stage !== "qf" && match.stage !== "sf" && match.stage !== "final" && match.stage !== "third") return false;
  if (!match.slot_code) return false;
  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  if (!homeTeamId || !awayTeamId) return false;
  return !match.home_team_id || !match.away_team_id;
}

/** @deprecated Use koMatchNeedsTeamPersist */
export const qfMatchNeedsTeamPersist = koMatchNeedsTeamPersist;
