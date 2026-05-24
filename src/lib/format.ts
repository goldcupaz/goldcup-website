import type { MatchStatus } from "./database.types";

/** Short label for public UI (both half-live states show as "Live"). */
export function statusLabel(s: MatchStatus): string {
  switch (s) {
    case "not_started":
      return "Not Started";
    case "live_first_half":
    case "live_second_half":
      return "Live";
    case "half_time":
      return "Half Time";
    case "full_time":
      return "Full Time";
    default:
      return s;
  }
}

/** Fixture / admin dropdown: distinguish the two "Live" phases. */
export function statusOptionLabel(s: MatchStatus): string {
  switch (s) {
    case "live_first_half":
      return "Live (1st half)";
    case "live_second_half":
      return "Live (2nd half)";
    default:
      return statusLabel(s);
  }
}

/** Value for `<input type="datetime-local" />` in the viewer's local timezone. */
export function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
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
