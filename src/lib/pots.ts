import type { Database } from "./database.types";
import { computeStandingsForGroup } from "./standings";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

/** Group winners (Pot 1) and runners-up (Pot 2) from current standings. */
export function qualifiedPot(
  teams: TeamRow[],
  matches: MatchRow[],
): { pot1: TeamRow[]; pot2: TeamRow[] } {
  const pot1: TeamRow[] = [];
  const pot2: TeamRow[] = [];
  for (const L of ["A", "B", "C", "D"] as const) {
    const rows = computeStandingsForGroup(L, teams, matches);
    if (rows[0]) pot1.push(rows[0].team);
    if (rows[1]) pot2.push(rows[1].team);
  }
  return { pot1, pot2 };
}
