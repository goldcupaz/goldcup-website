import type { Database } from "./database.types";
import { loserId, winnerId } from "./bracket";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export function getBySlot(matches: MatchRow[], code: string): MatchRow | null {
  return matches.find((m) => m.slot_code === code) ?? null;
}

export function teamName(teams: TeamRow[], id: string | null | undefined, fallback: string) {
  if (!id) return fallback;
  return teams.find((t) => t.id === id)?.name ?? fallback;
}

export function qfWinner(matches: MatchRow[], qfCode: string): string | null {
  const m = getBySlot(matches, qfCode);
  return m ? winnerId(m) : null;
}

export function sfComputed(
  matches: MatchRow[],
  sfCode: "SF1" | "SF2",
): { homeId: string | null; awayId: string | null } {
  if (sfCode === "SF1") {
    return {
      homeId: qfWinner(matches, "QF1"),
      awayId: qfWinner(matches, "QF3"),
    };
  }
  return {
    homeId: qfWinner(matches, "QF2"),
    awayId: qfWinner(matches, "QF4"),
  };
}

export function finalComputed(matches: MatchRow[]): { homeId: string | null; awayId: string | null } {
  const sf1 = getBySlot(matches, "SF1");
  const sf2 = getBySlot(matches, "SF2");
  return {
    homeId: sf1 ? winnerId(sf1) : null,
    awayId: sf2 ? winnerId(sf2) : null,
  };
}

export function thirdComputed(matches: MatchRow[]): { homeId: string | null; awayId: string | null } {
  const sf1 = getBySlot(matches, "SF1");
  const sf2 = getBySlot(matches, "SF2");
  return {
    homeId: sf1 ? loserId(sf1) : null,
    awayId: sf2 ? loserId(sf2) : null,
  };
}

/** Prefer stored match teams; otherwise show computed from previous rounds. */
export function sideName(
  m: MatchRow | null,
  side: "home" | "away",
  teams: TeamRow[],
  computedId: string | null,
  placeholder: string,
) {
  const stored = side === "home" ? m?.home_team_id : m?.away_team_id;
  const id = stored ?? computedId;
  return teamName(teams, id, placeholder);
}
