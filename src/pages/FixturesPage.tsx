import { Fragment, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";
import { FINAL_FIXTURE, QUARTER_FINALS, SEMI_FINALS } from "../lib/knockoutBracket";
import { formatMatchScoreLine } from "../lib/matchScoreDisplay";
import { stageSortKey } from "../lib/matchSort";
import { TeamNameWithQualification } from "../components/TeamNameWithQualification";
import { resolveTeamName } from "../lib/matchTeamNames";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function teamName(map: Map<string, string>, id: string | null) {
  if (!id) return "TBD";
  return map.get(id) ?? "TBD";
}

/** Local calendar date YYYY-MM-DD for grouping kickoffs in the viewer's timezone */
function localDateKey(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

function matchdayHeading(dayNum: number, representativeIso: string): string {
  try {
    const d = new Date(representativeIso);
    const nice = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
    return `Matchday ${dayNum} — ${nice}`;
  } catch {
    return `Matchday ${dayNum}`;
  }
}

type MatchdayBucket = {
  key: string;
  label: string;
  subtitle: string;
  matches: MatchRow[];
  kind: "group" | "quarterfinals" | "semifinals" | "final";
};

const MD4_KEY = "matchday-4-quarterfinals";
const MD5_KEY = "matchday-5-semifinals";
const MD6_KEY = "matchday-6-final";

const FIXTURE_TABS: { index: number; label: string }[] = [
  { index: 0, label: "Matchday 1" },
  { index: 1, label: "Matchday 2" },
  { index: 2, label: "Matchday 3" },
  { index: 3, label: "Matchday 4 — Quarterfinals" },
  { index: 4, label: "Matchday 5 — Semifinals" },
  { index: 5, label: "Matchday 6 — Final" },
];

export function FixturesPage() {
  const { teams, matches, loading, error } = useTournament();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | number>(0);

  function goMatch(id: string) {
    navigate(`/matches/${id}`);
  }

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  const groupMatchesSorted = useMemo(() => {
    return matches
      .filter((m) => m.stage === "group")
      .slice()
      .sort((a, b) => {
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
        return ta - tb;
      });
  }, [matches]);

  const groupMatchdays = useMemo((): MatchdayBucket[] => {
    const withDates: MatchRow[] = [];
    const noDate: MatchRow[] = [];
    for (const m of groupMatchesSorted) {
      if (localDateKey(m.scheduled_at)) withDates.push(m);
      else noDate.push(m);
    }

    const byKey = new Map<string, MatchRow[]>();
    for (const m of withDates) {
      const k = localDateKey(m.scheduled_at)!;
      const arr = byKey.get(k) ?? [];
      arr.push(m);
      byKey.set(k, arr);
    }

    const sortedKeys = [...byKey.keys()].sort();

    const buckets: MatchdayBucket[] = sortedKeys.map((key, idx) => {
      const list = byKey.get(key)!;
      list.sort((a, b) => {
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return ta - tb;
      });
      const firstIso = list[0]?.scheduled_at ?? "";
      return {
        key,
        label: matchdayHeading(idx + 1, firstIso),
        subtitle: `${list.length} fixtures`,
        matches: list,
        kind: "group",
      };
    });

    if (noDate.length > 0) {
      buckets.push({
        key: "__tbd__",
        label: "Date TBD",
        subtitle: `${noDate.length} fixtures`,
        matches: noDate,
        kind: "group",
      });
    }

    return buckets;
  }, [groupMatchesSorted]);

  const quarterfinalMatches = useMemo(() => {
    return QUARTER_FINALS.map((def) => matches.find((m) => m.stage === "qf" && m.slot_code === def.slot) ?? null).filter(
      (m): m is MatchRow => m !== null,
    );
  }, [matches]);

  const matchday4: MatchdayBucket | null = useMemo(() => {
    if (quarterfinalMatches.length === 0) return null;
    return {
      key: MD4_KEY,
      label: "Matchday 4 — Quarterfinals",
      subtitle: "Quarterfinals",
      matches: quarterfinalMatches,
      kind: "quarterfinals",
    };
  }, [quarterfinalMatches]);

  const semifinalMatches = useMemo(() => {
    return SEMI_FINALS.map((def) => matches.find((m) => m.stage === "sf" && m.slot_code === def.slot) ?? null).filter(
      (m): m is MatchRow => m !== null,
    );
  }, [matches]);

  const matchday5: MatchdayBucket | null = useMemo(() => {
    if (semifinalMatches.length === 0) return null;
    return {
      key: MD5_KEY,
      label: "Matchday 5 — Semifinals",
      subtitle: "Semifinals",
      matches: semifinalMatches,
      kind: "semifinals",
    };
  }, [semifinalMatches]);

  const finalMatch = useMemo(() => {
    return matches.find((m) => m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot) ?? null;
  }, [matches]);

  const matchday6: MatchdayBucket | null = useMemo(() => {
    if (!finalMatch) return null;
    return {
      key: MD6_KEY,
      label: "Matchday 6 — Final",
      subtitle: `${FINAL_FIXTURE.homeTeamName} vs ${FINAL_FIXTURE.awayTeamName}`,
      matches: [finalMatch],
      kind: "final",
    };
  }, [finalMatch]);

  const allMatchdaySections = useMemo(() => {
    const sections = [...groupMatchdays];
    if (matchday4) sections.push(matchday4);
    if (matchday5) sections.push(matchday5);
    if (matchday6) sections.push(matchday6);
    return sections;
  }, [groupMatchdays, matchday4, matchday5, matchday6]);

  const visibleSections = useMemo(() => {
    if (filter === "all") return allMatchdaySections;
    if (filter === 3) return matchday4 ? [matchday4] : [];
    if (filter === 4) return matchday5 ? [matchday5] : [];
    if (filter === 5) return matchday6 ? [matchday6] : [];
    const b = groupMatchdays[filter];
    return b ? [b] : [];
  }, [allMatchdaySections, filter, groupMatchdays, matchday4, matchday5, matchday6]);

  const laterKnockoutMatches = useMemo(() => {
    return matches
      .filter((m) => m.stage === "third")
      .slice()
      .sort((a, b) => {
        const sa = stageSortKey(a.stage);
        const sb = stageSortKey(b.stage);
        if (sa !== sb) return sa - sb;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
        return ta - tb;
      });
  }, [matches]);

  const qfTimeBySlot = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of QUARTER_FINALS) map.set(q.slot, q.timeWindow);
    return map;
  }, []);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  const hasAnyFixtures = allMatchdaySections.length > 0 || laterKnockoutMatches.length > 0;

  function tabBucket(tabIndex: number): MatchdayBucket | null | undefined {
    if (tabIndex < 3) return groupMatchdays[tabIndex];
    if (tabIndex === 3) return matchday4;
    if (tabIndex === 4) return matchday5;
    if (tabIndex === 5) return matchday6;
    return null;
  }

  return (
    <main>
      <h1 className="page-title">Fixtures / Results</h1>
      <p className="subtitle">
        Group stage by matchday, quarter-finals, semi-finals, final, then 3rd place. Live matches are highlighted.
      </p>
      {error && <div className="alert warn">{error}</div>}

      {hasAnyFixtures && (
        <div className="fixtures-tabs-scroll">
          <div className="fixtures-tabs-inner" role="tablist" aria-label="Matchday filter">
            {FIXTURE_TABS.map(({ index, label }) => {
              const bucket = tabBucket(index);
              const disabled = !bucket || bucket.matches.length === 0;
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  disabled={disabled}
                  aria-selected={filter === index}
                  className={`fixtures-tab${filter === index ? " active" : ""}`}
                  onClick={() => !disabled && setFilter(index)}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={`fixtures-tab${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
          </div>
        </div>
      )}

      <div className="matchday-stack">
        {visibleSections.length === 0 && <p className="empty">No fixtures yet.</p>}
        {visibleSections.map((bucket) =>
          bucket.kind === "quarterfinals" ? (
            <QuarterfinalsMatchdayCard
              key={bucket.key}
              bucket={bucket}
              nameById={nameById}
              qfTimeBySlot={qfTimeBySlot}
              onOpen={goMatch}
            />
          ) : bucket.kind === "semifinals" || bucket.kind === "final" ? (
            <KnockoutMatchdayCard
              key={bucket.key}
              bucket={bucket}
              nameById={nameById}
              onOpen={goMatch}
            />
          ) : (
            <GroupMatchdayCard key={bucket.key} bucket={bucket} nameById={nameById} onOpen={goMatch} />
          ),
        )}
      </div>

      {laterKnockoutMatches.length > 0 && filter === "all" && (
        <section className="matchday-card fixtures-knockout-section" style={{ marginTop: 20 }}>
          <header className="matchday-card-head">
            <h2 className="matchday-card-title">3rd place</h2>
            <p className="matchday-card-sub">Bronze medal match</p>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kickoff</th>
                  <th>Round</th>
                  <th>Home</th>
                  <th className="fixture-hide-vs" aria-hidden />
                  <th>Away</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {laterKnockoutMatches.map((m) => (
                  <KnockoutFixtureRow key={m.id} m={m} nameById={nameById} onOpen={goMatch} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function openMatchKey(e: KeyboardEvent, id: string, onOpen: (id: string) => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onOpen(id);
  }
}

function GroupMatchdayCard({
  bucket,
  nameById,
  onOpen,
}: {
  bucket: MatchdayBucket;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="matchday-card" aria-labelledby={`md-${bucket.key}`}>
      <header className="matchday-card-head">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
        <p className="matchday-card-sub">{bucket.subtitle}</p>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kickoff</th>
              <th>Group</th>
              <th>Home</th>
              <th className="fixture-hide-vs" aria-hidden />
              <th>Away</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bucket.matches.map((m) => {
              const live = isMatchInPlayOrBreak(m.status);
              const finished = m.status === "full_time";
              return (
                <tr
                  key={m.id}
                  className="fixture-row fixture-row--clickable"
                  tabIndex={0}
                  role="link"
                  aria-label={`Open match ${teamName(nameById, m.home_team_id)} vs ${teamName(nameById, m.away_team_id)}`}
                  onClick={() => onOpen(m.id)}
                  onKeyDown={(e) => openMatchKey(e, m.id, onOpen)}
                >
                  <td>{formatKickoff(m.scheduled_at)}</td>
                  <td>{m.group_letter ?? "—"}</td>
                  <td style={{ fontWeight: 800 }}>{teamName(nameById, m.home_team_id)}</td>
                  <td className="muted fixture-hide-vs">vs</td>
                  <td style={{ fontWeight: 800 }}>{teamName(nameById, m.away_team_id)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {finished || live ? formatMatchScoreLine(m) : "—"}
                  </td>
                  <td>
                    {live ? <span className="badge live">LIVE</span> : <span>{statusLabel(m.status)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function QuarterfinalsMatchdayCard({
  bucket,
  nameById,
  qfTimeBySlot,
  onOpen,
}: {
  bucket: MatchdayBucket;
  nameById: Map<string, string>;
  qfTimeBySlot: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="matchday-card matchday-card--quarterfinals" aria-labelledby={`md-${bucket.key}`}>
      <header className="matchday-card-head">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
        <p className="matchday-card-sub">{bucket.subtitle}</p>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Round</th>
              <th>Home</th>
              <th className="fixture-hide-vs" aria-hidden />
              <th>Away</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bucket.matches.map((m, idx) => {
              const live = isMatchInPlayOrBreak(m.status);
              const finished = m.status === "full_time";
              const slot = m.slot_code ?? "";
              const timeLabel = qfTimeBySlot.get(slot) ?? formatKickoff(m.scheduled_at);
              const showBuffer = idx < bucket.matches.length - 1;
              return (
                <Fragment key={m.id}>
                  <tr
                    className="fixture-row fixture-row--clickable"
                    tabIndex={0}
                    role="link"
                    aria-label={`Open match ${resolveTeamName(m, "home", nameById)} vs ${resolveTeamName(m, "away", nameById)}`}
                    onClick={() => onOpen(m.id)}
                    onKeyDown={(e) => openMatchKey(e, m.id, onOpen)}
                  >
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{timeLabel}</td>
                    <td>{slot || "QF"}</td>
                    <td style={{ fontWeight: 800 }}>{resolveTeamName(m, "home", nameById)}</td>
                    <td className="muted fixture-hide-vs">vs</td>
                    <td style={{ fontWeight: 800 }}>{resolveTeamName(m, "away", nameById)}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {finished || live ? formatMatchScoreLine(m) : "—"}
                    </td>
                    <td>
                      {live ? <span className="badge live">LIVE</span> : <span>{statusLabel(m.status)}</span>}
                    </td>
                  </tr>
                  {showBuffer && (
                    <tr className="fixtures-qf-buffer" aria-hidden>
                      <td colSpan={7}>
                        <span className="fixtures-qf-buffer-line" />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KnockoutMatchdayCard({
  bucket,
  nameById,
  onOpen,
}: {
  bucket: MatchdayBucket;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="matchday-card" aria-labelledby={`md-${bucket.key}`}>
      <header className="matchday-card-head">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
        <p className="matchday-card-sub">{bucket.subtitle}</p>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kickoff</th>
              <th>Round</th>
              <th>Home</th>
              <th className="fixture-hide-vs" aria-hidden />
              <th>Away</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bucket.matches.map((m) => (
              <KnockoutFixtureRow key={m.id} m={m} nameById={nameById} onOpen={onOpen} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KnockoutFixtureRow({
  m,
  nameById,
  onOpen,
}: {
  m: MatchRow;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  const live = isMatchInPlayOrBreak(m.status);
  const finished = m.status === "full_time";
  const roundLabel = m.slot_code ?? m.stage;

  return (
    <tr
      className="fixture-row fixture-row--clickable"
      tabIndex={0}
      role="link"
      aria-label={`Open match ${teamName(nameById, m.home_team_id)} vs ${teamName(nameById, m.away_team_id)}`}
      onClick={() => onOpen(m.id)}
      onKeyDown={(e) => openMatchKey(e, m.id, onOpen)}
    >
      <td>{formatKickoff(m.scheduled_at)}</td>
      <td style={{ fontSize: 12, fontWeight: 700 }}>{roundLabel}</td>
      <td style={{ fontWeight: 800 }}>
        <TeamNameWithQualification match={m} side="home" nameById={nameById} />
      </td>
      <td className="muted fixture-hide-vs">vs</td>
      <td style={{ fontWeight: 800 }}>
        <TeamNameWithQualification match={m} side="away" nameById={nameById} />
      </td>
      <td style={{ fontVariantNumeric: "tabular-nums" }}>
        {finished || live ? formatMatchScoreLine(m) : "—"}
      </td>
      <td>
        {live ? <span className="badge live">LIVE</span> : <span>{statusLabel(m.status)}</span>}
      </td>
    </tr>
  );
}
