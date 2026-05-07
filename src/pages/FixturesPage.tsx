import { useMemo, useState } from "react";

import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { formatKickoff, statusLabel } from "../lib/format";
import { isMatchInPlayOrBreak } from "../lib/matchStatus";

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
  matches: MatchRow[];
};

export function FixturesPage() {
  const { teams, matches, loading, error } = useTournament();
  const [filter, setFilter] = useState<"all" | number>(0);

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

  const matchdays = useMemo((): MatchdayBucket[] => {
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
        matches: list,
      };
    });

    if (noDate.length > 0) {
      buckets.push({
        key: "__tbd__",
        label: "Date TBD",
        matches: noDate,
      });
    }

    return buckets;
  }, [groupMatchesSorted]);

  const visibleMatchdays = useMemo(() => {
    if (filter === "all") return matchdays;
    const b = matchdays[filter];
    return b ? [b] : [];
  }, [matchdays, filter]);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  const mdTabs = [0, 1, 2] as const;

  return (
    <main>
      <h1 className="page-title">Fixtures / Results</h1>
      <p className="subtitle">Group stage schedule by matchday. Live matches are highlighted.</p>
      {error && <div className="alert warn">{error}</div>}

      {matchdays.length > 0 && (
        <div className="fixtures-tabs-scroll">
          <div className="fixtures-tabs-inner" role="tablist" aria-label="Matchday filter">
            {mdTabs.map((i) => {
              const bucket = matchdays[i];
              const disabled = !bucket || bucket.matches.length === 0;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  disabled={disabled}
                  aria-selected={filter === i}
                  className={`fixtures-tab${filter === i ? " active" : ""}`}
                  onClick={() => !disabled && setFilter(i)}
                >
                  Matchday {i + 1}
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
        {visibleMatchdays.length === 0 && <p className="empty">No group fixtures yet.</p>}
        {visibleMatchdays.map((bucket) => (
          <section key={bucket.key} className="matchday-card" aria-labelledby={`md-${bucket.key}`}>
            <header className="matchday-card-head">
              <h2 id={`md-${bucket.key}`} className="matchday-card-title">
                {bucket.label}
              </h2>
              <p className="matchday-card-sub">{bucket.matches.length} fixtures</p>
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
                      <tr key={m.id}>
                        <td>{formatKickoff(m.scheduled_at)}</td>
                        <td>{m.group_letter ?? "—"}</td>
                        <td style={{ fontWeight: 800 }}>{teamName(nameById, m.home_team_id)}</td>
                        <td className="muted fixture-hide-vs">vs</td>
                        <td style={{ fontWeight: 800 }}>{teamName(nameById, m.away_team_id)}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {finished || live ? `${m.home_score} – ${m.away_score}` : "—"}
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
        ))}
      </div>
    </main>
  );
}
