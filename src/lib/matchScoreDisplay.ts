/** Match row fields used for score line display. */
export type ScoreDisplayMatch = {
  home_score: number;
  away_score: number;
  home_penalties?: number | null;
  away_penalties?: number | null;
};

export function hasPenaltyScore(m: ScoreDisplayMatch): boolean {
  return m.home_penalties != null && m.away_penalties != null;
}

/** e.g. `2–2 (4–3 pens)` or `2–1` */
export function formatMatchScoreLine(m: ScoreDisplayMatch): string {
  const base = `${m.home_score}–${m.away_score}`;
  if (!hasPenaltyScore(m)) return base;
  return `${base} (${m.home_penalties}–${m.away_penalties} pens)`;
}

/** Spaced en-dash variant for large score displays. */
export function formatMatchScoreLineSpaced(m: ScoreDisplayMatch): string {
  const base = `${m.home_score} – ${m.away_score}`;
  if (!hasPenaltyScore(m)) return base;
  return `${base} (${m.home_penalties}–${m.away_penalties} pens)`;
}

export function parseOptionalPenaltyField(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}
