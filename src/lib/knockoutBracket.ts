/** Fixed Gold Cup quarter-final bracket (no pot draw). */

export type QfSlot = "QF1" | "QF2" | "QF3" | "QF4";

export type QuarterFinalDef = {
  slot: QfSlot;
  /** Group seed labels shown in UI (1st/2nd in group). */
  pairing: string;
  /** Display order on site (1 = first KO game). */
  order: number;
  orderLabel: string;
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
    homeTeamName: "Blue Phoenix",
    awayTeamName: "EAS Saints",
  },
  {
    slot: "QF2",
    pairing: "D1 vs C2",
    order: 2,
    orderLabel: "2nd game",
    homeTeamName: "Sabis Tigers",
    awayTeamName: "Star Eagles",
  },
  {
    slot: "QF3",
    pairing: "B1 vs A2",
    order: 3,
    orderLabel: "Pre-last game",
    homeTeamName: "MTK Eagles",
    awayTeamName: "132-134 MFC",
  },
  {
    slot: "QF4",
    pairing: "A1 vs B2",
    order: 4,
    orderLabel: "Last game",
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
