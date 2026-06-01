import type { MatchEventRow } from "./timeline";
import { sortMatchEvents } from "./timeline";

export function penaltyKickSymbol(eventType: "penalty_scored" | "penalty_missed"): string {
  return eventType === "penalty_scored" ? "✅" : "❌";
}

export function formatPenaltyKickLine(ev: MatchEventRow): string {
  const player = (ev.player_name ?? "").trim() || "Unknown";
  const sym = penaltyKickSymbol(ev.event_type as "penalty_scored" | "penalty_missed");
  return `${sym} ${player}`;
}

export function penaltyKicksForTeam(
  events: MatchEventRow[],
  teamId: string | null,
): MatchEventRow[] {
  if (!teamId) return [];
  return sortMatchEvents(events).filter((e) => e.team_id === teamId);
}
