import type { Database } from "./database.types";

export type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];

export function sortMatchEvents(events: MatchEventRow[]): MatchEventRow[] {
  return [...events].sort((a, b) => {
    if (a.event_order !== b.event_order) return a.event_order - b.event_order;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/** Public-facing copy for a single timeline row (no minutes). */
export function formatTimelineLine(ev: MatchEventRow, teamNameById: Map<string, string>): string {
  const team = ev.team_id ? (teamNameById.get(ev.team_id) ?? "Unknown") : "";
  const player = (ev.player_name ?? "").trim();
  switch (ev.event_type) {
    case "match_started":
      return "Match started";
    case "goal":
      return `Goal by ${player} — ${team}`;
    case "half_time":
      return "Half time";
    case "yellow_card":
      return `Yellow card received by ${player} — ${team}`;
    case "red_card":
      return `Red card received by ${player} — ${team}`;
    case "full_time":
      return "Full time";
    default:
      return ev.event_type;
  }
}
