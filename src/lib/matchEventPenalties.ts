import type { Database, MatchEventType } from "./database.types";
import type { MatchEventRow } from "./timeline";

export const PENALTY_SHOOTOUT_EVENT_TYPES = ["penalty_scored", "penalty_missed"] as const;
export type PenaltyShootoutEventType = (typeof PENALTY_SHOOTOUT_EVENT_TYPES)[number];

export function isPenaltyShootoutEventType(t: MatchEventType): t is PenaltyShootoutEventType {
  return t === "penalty_scored" || t === "penalty_missed";
}

export function isMainTimelineEventType(t: MatchEventType): boolean {
  return !isPenaltyShootoutEventType(t);
}

export function filterMainTimelineEvents(events: MatchEventRow[]): MatchEventRow[] {
  return events.filter((e) => isMainTimelineEventType(e.event_type));
}

export function filterPenaltyShootoutEvents(events: MatchEventRow[]): MatchEventRow[] {
  return events.filter((e) => isPenaltyShootoutEventType(e.event_type));
}

export function countPenaltyGoals(
  events: MatchEventRow[],
  homeTeamId: string | null,
  awayTeamId: string | null,
): { home: number; away: number } {
  let home = 0;
  let away = 0;
  if (!homeTeamId || !awayTeamId) return { home, away };
  for (const e of events) {
    if (e.event_type !== "penalty_scored" || !e.team_id) continue;
    if (e.team_id === homeTeamId) home += 1;
    else if (e.team_id === awayTeamId) away += 1;
  }
  return { home, away };
}
