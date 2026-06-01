type Props = {
  homeScore: string;
  awayScore: string;
  homePenalties: string;
  awayPenalties: string;
  onHomeScore: (v: string) => void;
  onAwayScore: (v: string) => void;
  onHomePenalties: (v: string) => void;
  onAwayPenalties: (v: string) => void;
  showPenalties?: boolean;
  compact?: boolean;
};

/** Admin score + optional penalty shootout fields. */
export function AdminMatchScoreInputs({
  homeScore,
  awayScore,
  homePenalties,
  awayPenalties,
  onHomeScore,
  onAwayScore,
  onHomePenalties,
  onAwayPenalties,
  showPenalties = true,
  compact = false,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : 6, minWidth: compact ? 100 : 120 }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ width: 40 }}
          value={homeScore}
          onChange={(e) => onHomeScore(e.target.value)}
          inputMode="numeric"
          aria-label="Home score"
        />
        <span>–</span>
        <input
          style={{ width: 40 }}
          value={awayScore}
          onChange={(e) => onAwayScore(e.target.value)}
          inputMode="numeric"
          aria-label="Away score"
        />
      </div>
      {showPenalties && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
          <span className="muted">Pens</span>
          <input
            style={{ width: 36 }}
            value={homePenalties}
            onChange={(e) => onHomePenalties(e.target.value)}
            inputMode="numeric"
            placeholder="—"
            aria-label="Home penalties"
          />
          <span>–</span>
          <input
            style={{ width: 36 }}
            value={awayPenalties}
            onChange={(e) => onAwayPenalties(e.target.value)}
            inputMode="numeric"
            placeholder="—"
            aria-label="Away penalties"
          />
        </div>
      )}
    </div>
  );
}
