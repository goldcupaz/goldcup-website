import type { Database, MatchEventType } from "./database.types";

export type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];

export function isClockTimelineEvent(t: MatchEventType): boolean {
  return t === "match_started" || t === "half_time" || t === "full_time";
}

export function sortMatchEvents(events: MatchEventRow[]): MatchEventRow[] {
  return [...events].sort((a, b) => {
    const ma = a.event_minute ?? null;
    const mb = b.event_minute ?? null;
    if (ma != null && mb != null && ma !== mb) return ma - mb;
    if (ma != null && mb == null) return -1;
    if (ma == null && mb != null) return 1;
    if (a.event_order !== b.event_order) return a.event_order - b.event_order;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

function minutePrefix(ev: MatchEventRow): string {
  const m = ev.event_minute ?? null;
  if (m == null || !Number.isFinite(m) || m < 0) return "";
  return `${m}\u2032 `;
}

function noteSuffix(ev: MatchEventRow): string {
  const n = (ev.event_note ?? "").trim();
  return n ? ` · ${n}` : "";
}

/** Public-facing copy for a single timeline row (optional minute + note from admin). */
export function formatTimelineLine(ev: MatchEventRow, teamNameById: Map<string, string>): string {
  const team = ev.team_id ? (teamNameById.get(ev.team_id) ?? "Unknown") : "";
  const player = (ev.player_name ?? "").trim();
  const pre = minutePrefix(ev);
  const suf = noteSuffix(ev);
  let core: string;
  switch (ev.event_type) {
    case "match_started":
      core = "Match started";
      break;
    case "goal":
      core = `Goal by ${player} — ${team}`;
      break;
    case "own_goal":
      core = player ? `Own goal by ${player}` : "Own goal";
      break;
    case "half_time":
      core = "Half time";
      break;
    case "yellow_card":
      core = `Yellow card received by ${player} — ${team}`;
      break;
    case "red_card":
      core = `Red card received by ${player} — ${team}`;
      break;
    case "full_time":
      core = "Full time";
      break;
    default:
      core = ev.event_type;
  }
  return pre + core + suf;
}
