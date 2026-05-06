import type { MatchStatus } from "./database.types";

export function statusLabel(s: MatchStatus): string {
  switch (s) {
    case "not_started":
      return "Not Started";
    case "live":
      return "Live";
    case "half_time":
      return "Half Time";
    case "full_time":
      return "Full Time";
    default:
      return s;
  }
}

export function formatKickoff(iso: string | null): string {
  if (!iso) return "TBD";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
