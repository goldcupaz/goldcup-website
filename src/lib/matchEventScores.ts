import type { MatchEventType } from "./database.types";

export function isScoringEventType(t: MatchEventType): boolean {
  return t === "goal" || t === "own_goal";
}

/**
 * Derive match score from goal + own_goal timeline events only.
 * Goal: team_id is scorer's team (+1 that side).
 * Own goal: team_id is the conceding player's team (+1 to opponent).
 */
export function computeScoresFromScoringEvents(
  homeTeamId: string | null,
  awayTeamId: string | null,
  events: { event_type: MatchEventType; team_id: string | null }[],
): { home: number; away: number } {
  let home = 0;
  let away = 0;
  if (!homeTeamId || !awayTeamId) return { home, away };

  for (const e of events) {
    if (e.event_type === "goal" && e.team_id) {
      if (e.team_id === homeTeamId) home += 1;
      else if (e.team_id === awayTeamId) away += 1;
    } else if (e.event_type === "own_goal" && e.team_id) {
      if (e.team_id === homeTeamId) away += 1;
      else if (e.team_id === awayTeamId) home += 1;
    }
  }
  return { home, away };
}
