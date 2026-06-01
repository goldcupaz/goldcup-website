import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { formatMatchScoreLineSpaced } from "../lib/matchScoreDisplay";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import { TeamNameWithQualification } from "../components/TeamNameWithQualification";
import { QUARTER_FINALS, qfDisplayLabel, type QfSlot } from "../lib/knockoutBracket";
import {
  finalComputed,
  getBySlot,
  sfComputed,
  sideName,
  thirdComputed,
} from "../lib/knockoutResolve";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export function KnockoutPage() {
  const { teams, matches, loading, error } = useTournament();

  const qfBySlot = useMemo(() => {
    const map = new Map<QfSlot, MatchRow | null>();
    for (const def of QUARTER_FINALS) {
      map.set(def.slot, getBySlot(matches, def.slot));
    }
    return map;
  }, [matches]);

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
        Fixed quarter-final bracket from group standings. Semi-finals: winners of QF1 &amp; QF3 meet in SF1; winners
        of QF2 &amp; QF4 in SF2.
      </p>
      {error && <div className="alert warn">{error}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="badge" style={{ marginBottom: 8 }}>
          Quarter-final order
        </div>
        <ol className="knockout-qf-order muted" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
          {QUARTER_FINALS.map((q) => (
            <li key={q.slot}>
              <strong>{q.orderLabel}</strong> — {q.homeTeamName} vs {q.awayTeamName} ·{" "}
              <strong>{q.timeWindow}</strong> ({q.pairing})
            </li>
          ))}
        </ol>
      </div>

      <div className="bracket-scroll">
        <div className="bracket">
          <section className="round">
            <h3>Quarter-finals</h3>
            {QUARTER_FINALS.map((def) => (
              <MatchCard
                key={def.slot}
                label={qfDisplayLabel(def.slot)}
                timeWindow={def.timeWindow}
                m={qfBySlot.get(def.slot) ?? null}
                teams={teams}
                phH={def.homeTeamName}
                phA={def.awayTeamName}
              />
            ))}
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
              label="Third Place Match"
              m={third}
              teams={teams}
              computedHome={c_third.homeId}
              computedAway={c_third.awayId}
              phH="Loser SF1"
              phA="Loser SF2"
            />
            <MatchCard
              label="Final"
              m={fin}
              teams={teams}
              computedHome={c_final.homeId}
              computedAway={c_final.awayId}
              phH="Winner SF1"
              phA="Winner SF2"
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
  timeWindow?: string;
  computedHome?: string | null;
  computedAway?: string | null;
}) {
  const { label, m, teams, phH, phA, timeWindow, computedHome, computedAway } = props;
  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);
  const h = sideName(m, "home", teams, computedHome ?? null, phH);
  const a = sideName(m, "away", teams, computedAway ?? null, phA);
  const when = m?.scheduled_at ? formatKickoff(m.scheduled_at) : "";
  const body = (
    <>
      <div className="muted" style={{ fontSize: 11, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </div>
      {timeWindow ? (
        <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
          {timeWindow}
        </div>
      ) : (
        when && (
          <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
            {when}
          </div>
        )
      )}
      <div className="match-line">
        <span>
          {m ? <TeamNameWithQualification match={m} side="home" nameById={nameById} /> : h}
        </span>
        {m && (m.status === "full_time" || isMatchInPlayOrBreak(m.status)) ? (
          <span className="match-score">
            {formatMatchScoreLineSpaced(m)}
          </span>
        ) : (
          <span className="muted">vs</span>
        )}
        <span>
          {m ? <TeamNameWithQualification match={m} side="away" nameById={nameById} /> : a}
        </span>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        {m ? statusLabel(m.status) : "—"}
      </div>
    </>
  );
  if (m?.id) {
    return (
      <Link to={`/matches/${m.id}`} className="match-card match-card--link">
        {body}
      </Link>
    );
  }
  return <div className="match-card">{body}</div>;
}
