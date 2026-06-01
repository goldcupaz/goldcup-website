/** Fixed Gold Cup quarter-final bracket (no pot draw). */

export type QfSlot = "QF1" | "QF2" | "QF3" | "QF4";

/** Wall-clock kickoff date for all QFs (UTC+4, same as group stage). */
export const QF_MATCHDAY = "2026-05-24" as const;

export const QF_MATCHDAY_LABEL = "May 24" as const;

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
    timeWindow: "04:00 PM – 05:20 PM",
    kickoffTime: "16:00",
    homeTeamName: "Blue Phoenix",
    awayTeamName: "EAS Saints",
  },
  {
    slot: "QF2",
    pairing: "Ebra FC vs Star Eagles",
    order: 2,
    orderLabel: "2nd game",
    timeWindow: "05:30 PM – 06:50 PM",
    kickoffTime: "17:30",
    homeTeamName: "Ebra FC",
    awayTeamName: "Star Eagles",
  },
  {
    slot: "QF3",
    pairing: "B1 vs A2",
    order: 3,
    orderLabel: "Pre-last game",
    timeWindow: "07:00 PM – 08:20 PM",
    kickoffTime: "19:00",
    homeTeamName: "MTK Eagles",
    awayTeamName: "132-134 MFC",
  },
  {
    slot: "QF4",
    pairing: "A1 vs B2",
    order: 4,
    orderLabel: "Last game",
    timeWindow: "08:30 PM – 09:50 PM",
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

/** Team UUIDs from seed — used in SQL migrations and admin QF sync. */
export const QF_TEAM_IDS = {
  "Blue Phoenix": "a0000001-0000-4000-8000-000000000008",
  "EAS Saints": "a0000001-0000-4000-8000-000000000006",
  "Sabis Tigers": "a0000001-0000-4000-8000-000000000001",
  "Star Eagles": "a0000001-0000-4000-8000-000000000004",
  "MTK Eagles": "a0000001-0000-4000-8000-000000000003",
  "132-134 MFC": "a0000001-0000-4000-8000-000000000007",
  "Sahil FC": "a0000001-0000-4000-8000-000000000002",
  "Sambo FC": "a0000001-0000-4000-8000-000000000005",
  "Ebra FC": "a0000001-0000-4000-8000-000000000011",
} as const;

export type SfSlot = "SF1" | "SF2";

export const SF_MATCHDAY = "2026-05-30" as const;
export const SF_MATCHDAY_LABEL = "May 30" as const;

export type SemiFinalDef = {
  slot: SfSlot;
  homeTeamName: string;
  awayTeamName: string;
  kickoffTime: string;
};

export const SEMI_FINALS: readonly SemiFinalDef[] = [
  {
    slot: "SF1",
    homeTeamName: "MTK Eagles",
    awayTeamName: "EAS Saints",
    kickoffTime: "18:00",
  },
  {
    slot: "SF2",
    homeTeamName: "Sambo FC",
    awayTeamName: "Ebra FC",
    kickoffTime: "20:00",
  },
] as const;

export const SF_BY_SLOT: Record<SfSlot, SemiFinalDef> = Object.fromEntries(
  SEMI_FINALS.map((s) => [s.slot, s]),
) as Record<SfSlot, SemiFinalDef>;

export const SF_TEAM_IDS = {
  "MTK Eagles": "a0000001-0000-4000-8000-000000000003",
  "EAS Saints": "a0000001-0000-4000-8000-000000000006",
  "Sambo FC": "a0000001-0000-4000-8000-000000000005",
  "Ebra FC": "a0000001-0000-4000-8000-000000000011",
} as const;

/** Semifinal fixture: show ★ next to this team (confirmed qualifier). */
export const SF_QUALIFIED_STAR_TEAM_ID = SF_TEAM_IDS["Sambo FC"];

export function showsSemifinalQualificationStar(
  match: { stage: string },
  teamName: string,
  teamId?: string | null,
): boolean {
  if (match.stage !== "sf") return false;
  if (teamId === SF_QUALIFIED_STAR_TEAM_ID) return true;
  return teamName === "Sambo FC";
}

export function qfTeamIdsForSlot(slot: QfSlot): { homeTeamId: string; awayTeamId: string } {
  const def = QF_BY_SLOT[slot];
  return {
    homeTeamId: QF_TEAM_IDS[def.homeTeamName as keyof typeof QF_TEAM_IDS],
    awayTeamId: QF_TEAM_IDS[def.awayTeamName as keyof typeof QF_TEAM_IDS],
  };
}

/** Admin live-picker / dropdown label for a quarter-final. */
export function qfAdminFixtureLabel(slot: QfSlot): string {
  const def = QF_BY_SLOT[slot];
  return `${def.slot} · ${QF_MATCHDAY_LABEL} · ${def.timeWindow} · ${def.homeTeamName} vs ${def.awayTeamName}`;
}

export function sfScheduledAtIso(slot: SfSlot): string {
  const s = SF_BY_SLOT[slot];
  return `${SF_MATCHDAY} ${s.kickoffTime}:00+04`;
}

export function sfTeamIdsForSlot(slot: SfSlot): { homeTeamId: string; awayTeamId: string } {
  const def = SF_BY_SLOT[slot];
  return {
    homeTeamId: SF_TEAM_IDS[def.homeTeamName as keyof typeof SF_TEAM_IDS],
    awayTeamId: SF_TEAM_IDS[def.awayTeamName as keyof typeof SF_TEAM_IDS],
  };
}

export function sfAdminFixtureLabel(slot: SfSlot): string {
  const def = SF_BY_SLOT[slot];
  return `${def.slot} · ${SF_MATCHDAY_LABEL} · ${def.homeTeamName} vs ${def.awayTeamName}`;
}

export const FINAL_MATCHDAY = "2026-06-07" as const;
export const FINAL_MATCHDAY_LABEL = "June 7" as const;

export const FINAL_FIXTURE = {
  slot: "FINAL" as const,
  homeTeamName: "MTK Eagles",
  awayTeamName: "Sambo FC",
  kickoffTime: "19:00",
};

export function finalScheduledAtIso(): string {
  return `${FINAL_MATCHDAY} ${FINAL_FIXTURE.kickoffTime}:00+04`;
}

export function finalTeamIds(): { homeTeamId: string; awayTeamId: string } {
  return {
    homeTeamId: QF_TEAM_IDS["MTK Eagles"],
    awayTeamId: QF_TEAM_IDS["Sambo FC"],
  };
}

export function finalAdminFixtureLabel(): string {
  return `Final · ${FINAL_MATCHDAY_LABEL} · ${FINAL_FIXTURE.homeTeamName} vs ${FINAL_FIXTURE.awayTeamName}`;
}

export const THIRD_PLACE_FIXTURE = {
  slot: "THIRD" as const,
  homeTeamName: "Ebra FC",
  awayTeamName: "EAS Saints",
  kickoffTime: "16:00",
};

export function thirdPlaceScheduledAtIso(): string {
  return `${FINAL_MATCHDAY} ${THIRD_PLACE_FIXTURE.kickoffTime}:00+04`;
}

export function thirdPlaceTeamIds(): { homeTeamId: string; awayTeamId: string } {
  return {
    homeTeamId: QF_TEAM_IDS["Ebra FC"],
    awayTeamId: QF_TEAM_IDS["EAS Saints"],
  };
}

export function thirdPlaceAdminFixtureLabel(): string {
  return `Third Place · ${FINAL_MATCHDAY_LABEL} · ${THIRD_PLACE_FIXTURE.homeTeamName} vs ${THIRD_PLACE_FIXTURE.awayTeamName}`;
}

/** Apply both Matchday 6 fixtures (final + third place) in display order. */
export const MATCHDAY_6_FIXTURES = [
  { kind: "final" as const, def: FINAL_FIXTURE },
  { kind: "third" as const, def: THIRD_PLACE_FIXTURE },
] as const;
