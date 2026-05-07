import { useMemo } from "react";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import {
  finalComputed,
  getBySlot,
  sfComputed,
  sideName,
  thirdComputed,
} from "../lib/knockoutResolve";
import { computeStandingsForGroup } from "../lib/standings";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export function KnockoutPage() {
  const { teams, matches, loading, error } = useTournament();

  const qualified = useMemo(() => {
    const winners: string[] = [];
    const runners: string[] = [];
    for (const L of ["A", "B", "C", "D"] as const) {
      const rows = computeStandingsForGroup(L, teams, matches);
      winners.push(rows[0]?.team.name ?? "—");
      runners.push(rows[1]?.team.name ?? "—");
    }
    return { winners, runners };
  }, [teams, matches]);

  const qf1 = getBySlot(matches, "QF1");
  const qf2 = getBySlot(matches, "QF2");
  const qf3 = getBySlot(matches, "QF3");
  const qf4 = getBySlot(matches, "QF4");
  const sf1 = getBySlot(matches, "SF1");
  const sf2 = getBySlot(matches, "SF2");
  const fin = getBySlot(matches, "FINAL");
  const third = getBySlot(matches, "THIRD");

  const c_sf1 = sfComputed(matches, "SF1");
  const c_sf2 = sfComputed(matches, "SF2");
  const c_final = finalComputed(matches);
  const c_third = thirdComputed(matches);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main>
      <h1 className="page-title">Knockout path</h1>
      <p className="subtitle">
        Top two from each group qualify. Quarter-finals are built from Pot 1 (winners) and Pot 2 (runners-up) by admin
        assignment. Semi-finals and the final follow the fixed bracket.
      </p>
      {error && <div className="alert warn">{error}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="badge" style={{ marginBottom: 8 }}>
          Qualifiers (from standings)
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          <strong>Pot 1</strong> (1st): {qualified.winners.join(" · ")}
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          <strong>Pot 2</strong> (2nd): {qualified.runners.join(" · ")}
        </p>
      </div>

      <div className="bracket-scroll">
        <div className="bracket">
          <section className="round">
            <h3>Quarter-finals</h3>
            <MatchCard label="QF1" m={qf1} teams={teams} phH="Pot 1 team" phA="Pot 2 team" />
            <MatchCard label="QF2" m={qf2} teams={teams} phH="Pot 1 team" phA="Pot 2 team" />
            <MatchCard label="QF3" m={qf3} teams={teams} phH="Pot 1 team" phA="Pot 2 team" />
            <MatchCard label="QF4" m={qf4} teams={teams} phH="Pot 1 team" phA="Pot 2 team" />
          </section>
          <section className="round">
            <h3>Semi-finals</h3>
            <MatchCard
              label="SF1 · Winner QF1 vs Winner QF3"
              m={sf1}
              teams={teams}
              computedHome={c_sf1.homeId}
              computedAway={c_sf1.awayId}
              phH="Winner QF1"
              phA="Winner QF3"
            />
            <MatchCard
              label="SF2 · Winner QF2 vs Winner QF4"
              m={sf2}
              teams={teams}
              computedHome={c_sf2.homeId}
              computedAway={c_sf2.awayId}
              phH="Winner QF2"
              phA="Winner QF4"
            />
          </section>
          <section className="round">
            <h3>Finals</h3>
            <MatchCard
              label="Final"
              m={fin}
              teams={teams}
              computedHome={c_final.homeId}
              computedAway={c_final.awayId}
              phH="Winner SF1"
              phA="Winner SF2"
            />
            <MatchCard
              label="3rd place"
              m={third}
              teams={teams}
              computedHome={c_third.homeId}
              computedAway={c_third.awayId}
              phH="Loser SF1"
              phA="Loser SF2"
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function MatchCard(props: {
  label: string;
  m: MatchRow | null;
  teams: TeamRow[];
  phH: string;
  phA: string;
  computedHome?: string | null;
  computedAway?: string | null;
}) {
  const { label, m, teams, phH, phA, computedHome, computedAway } = props;
  const h = sideName(m, "home", teams, computedHome ?? null, phH);
  const a = sideName(m, "away", teams, computedAway ?? null, phA);
  const when = m?.scheduled_at ? formatKickoff(m.scheduled_at) : "";
  return (
    <div className="match-card">
      <div className="muted" style={{ fontSize: 11, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </div>
      {when && (
        <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
          {when}
        </div>
      )}
      <div className="match-line">
        <span>{h}</span>
        {m && (m.status === "full_time" || isMatchInPlayOrBreak(m.status)) ? (
          <span className="match-score">
            {m.home_score} – {m.away_score}
          </span>
        ) : (
          <span className="muted">vs</span>
        )}
        <span>{a}</span>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        {m ? statusLabel(m.status) : "—"}
      </div>
    </div>
  );
}
