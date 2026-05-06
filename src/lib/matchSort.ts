import type { Database } from "./database.types";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

/** Group stage first, then knockout: QF → SF → 3rd place → Final; earliest kickoff first. */
export function stageSortKey(stage: MatchRow["stage"]): number {
  switch (stage) {
    case "group":
      return 0;
    case "qf":
      return 1;
    case "sf":
      return 2;
    case "third":
      return 3;
    case "final":
      return 4;
    default:
      return 99;
  }
}

function kickoffMs(m: MatchRow): number {
  if (!m.scheduled_at) return Number.MAX_SAFE_INTEGER;
  const t = new Date(m.scheduled_at).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

/** Featured picker: group first, then KO; within each stage, by date/time then sort_order. */
export function sortMatchesForAdminPicker(matches: MatchRow[]): MatchRow[] {
  return [...matches].sort((a, b) => {
    const sa = stageSortKey(a.stage);
    const sb = stageSortKey(b.stage);
    if (sa !== sb) return sa - sb;
    const ta = kickoffMs(a);
    const tb = kickoffMs(b);
    if (ta !== tb) return ta - tb;
    return a.sort_order - b.sort_order;
  });
}
