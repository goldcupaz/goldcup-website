/** Fixed Gold Cup quarter-final bracket (no pot draw). */

export type QfSlot = "QF1" | "QF2" | "QF3" | "QF4";

/** Wall-clock kickoff date for all QFs (UTC+4, same as group stage). */
export const QF_MATCHDAY = "2026-06-20" as const;

export type QuarterFinalDef = {
  slot: QfSlot;
  /** Group seed labels shown in UI (1st/2nd in group). */
  pairing: string;
  /** Display order on site (1 = first KO game). */
  order: number;
  orderLabel: string;
  /** Local kickoff–full-time window (80 min + 10 min buffer before next game). */
  timeWindow: string;
  /** Kickoff wall time (HH:MM, UTC+4) — matches `scheduled_at` in DB. */
  kickoffTime: string;
  homeTeamName: string;
  awayTeamName: string;
};

/** Canonical QF lineup — order: QF1 → QF2 → QF3 → QF4. */
export const QUARTER_FINALS: readonly QuarterFinalDef[] = [
  {
    slot: "QF1",
    pairing: "C1 vs D2",
    order: 1,
    orderLabel: "1st game",
    timeWindow: "16:00 – 17:20",
    kickoffTime: "16:00",
    homeTeamName: "Blue Phoenix",
    awayTeamName: "EAS Saints",
  },
  {
    slot: "QF2",
    pairing: "D1 vs C2",
    order: 2,
    orderLabel: "2nd game",
    timeWindow: "17:30 – 18:50",
    kickoffTime: "17:30",
    homeTeamName: "Sabis Tigers",
    awayTeamName: "Star Eagles",
  },
  {
    slot: "QF3",
    pairing: "B1 vs A2",
    order: 3,
    orderLabel: "Pre-last game",
    timeWindow: "19:00 – 20:20",
    kickoffTime: "19:00",
    homeTeamName: "MTK Eagles",
    awayTeamName: "132-134 MFC",
  },
  {
    slot: "QF4",
    pairing: "A1 vs B2",
    order: 4,
    orderLabel: "Last game",
    timeWindow: "20:30 – 21:50",
    kickoffTime: "20:30",
    homeTeamName: "Sahil FC",
    awayTeamName: "Sambo FC",
  },
] as const;

export const QF_BY_SLOT: Record<QfSlot, QuarterFinalDef> = Object.fromEntries(
  QUARTER_FINALS.map((q) => [q.slot, q]),
) as Record<QfSlot, QuarterFinalDef>;

export function qfDisplayLabel(slot: QfSlot): string {
  const q = QF_BY_SLOT[slot];
  return `${q.slot} · ${q.pairing} (${q.orderLabel})`;
}

export function qfScheduledAtIso(slot: QfSlot): string {
  const q = QF_BY_SLOT[slot];
  return `${QF_MATCHDAY} ${q.kickoffTime}:00+04`;
}

export function qfTimeWindow(slot: QfSlot): string {
  return QF_BY_SLOT[slot].timeWindow;
}

/** Team UUIDs from seed — used only in SQL migrations / docs. */
export const QF_TEAM_IDS = {
  "Blue Phoenix": "a0000001-0000-4000-8000-000000000008",
  "EAS Saints": "a0000001-0000-4000-8000-000000000006",
  "Sabis Tigers": "a0000001-0000-4000-8000-000000000001",
  "Star Eagles": "a0000001-0000-4000-8000-000000000004",
  "MTK Eagles": "a0000001-0000-4000-8000-000000000003",
  "132-134 MFC": "a0000001-0000-4000-8000-000000000007",
  "Sahil FC": "a0000001-0000-4000-8000-000000000002",
  "Sambo FC": "a0000001-0000-4000-8000-000000000005",
} as const;
