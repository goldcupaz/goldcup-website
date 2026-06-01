import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BuyTicketsButton } from "../components/BuyTicketsButton";
import { PremiumMatchCard } from "../components/PremiumMatchCard";
import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import {
  FINAL_FIXTURE,
  QUARTER_FINALS,
  SEMI_FINALS,
  THIRD_PLACE_FIXTURE,
  FINAL_AFTERPARTY_LABEL,
  type SfSlot,
} from "../lib/knockoutBracket";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

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
  kind: "group" | "quarterfinals" | "semifinals" | "finals";
};

type KoStyledSection = {
  variant: string;
  dividerTitle: string;
  dividerIcon?: string;
  match: MatchRow;
};

type KoStyledMatchdayBucket = MatchdayBucket & {
  kind: "semifinals" | "finals";
  sections: KoStyledSection[];
};

function sfDividerTitle(slot: SfSlot): string {
  return slot === "SF1" ? "Semi-Final 1" : "Semi-Final 2";
}

const MD4_KEY = "matchday-4-quarterfinals";
const MD5_KEY = "matchday-5-semifinals";
const MD6_KEY = "matchday-6-finals";

const FIXTURE_TABS: { index: number; label: string }[] = [
  { index: 0, label: "Matchday 1" },
  { index: 1, label: "Matchday 2" },
  { index: 2, label: "Matchday 3" },
  { index: 3, label: "Quarterfinals" },
  { index: 4, label: "Semifinals" },
  { index: 5, label: "Finals" },
];

export function FixturesPage() {
  const { teams, matches, loading, error } = useTournament();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<number>(0);

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

  const matchday5: KoStyledMatchdayBucket | null = useMemo(() => {
    const sections: KoStyledSection[] = [];
    for (const def of SEMI_FINALS) {
      const m = matches.find((x) => x.stage === "sf" && x.slot_code === def.slot);
      if (!m) continue;
      sections.push({
        variant: def.slot.toLowerCase(),
        dividerTitle: sfDividerTitle(def.slot),
        match: m,
      });
    }
    if (sections.length === 0) return null;
    return {
      key: MD5_KEY,
      label: "Matchday 5 — Semifinals",
      subtitle: "Semi-Final 1 · Semi-Final 2",
      matches: sections.map((s) => s.match),
      sections,
      kind: "semifinals",
    };
  }, [matches]);

  const finalMatch = useMemo(() => {
    return matches.find((m) => m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot) ?? null;
  }, [matches]);

  const thirdPlaceMatch = useMemo(() => {
    return matches.find((m) => m.stage === "third" && m.slot_code === THIRD_PLACE_FIXTURE.slot) ?? null;
  }, [matches]);

  const matchday6: KoStyledMatchdayBucket | null = useMemo(() => {
    const sections: KoStyledSection[] = [];
    if (thirdPlaceMatch) {
      sections.push({ variant: "third", dividerTitle: "Third Place", match: thirdPlaceMatch });
    }
    if (finalMatch) {
      sections.push({ variant: "final", dividerTitle: "Final", dividerIcon: "🏆", match: finalMatch });
    }
    if (sections.length === 0) return null;
    return {
      key: MD6_KEY,
      label: "Matchday 6 — Finals",
      subtitle: "Third Place · Final",
      matches: sections.map((s) => s.match),
      sections,
      kind: "finals",
    };
  }, [finalMatch, thirdPlaceMatch]);

  const allMatchdaySections = useMemo(() => {
    const sections = [...groupMatchdays];
    if (matchday4) sections.push(matchday4);
    if (matchday5) sections.push(matchday5);
    if (matchday6) sections.push(matchday6);
    return sections;
  }, [groupMatchdays, matchday4, matchday5, matchday6]);

  const visibleSections = useMemo(() => {
    if (filter === 3) return matchday4 ? [matchday4] : [];
    if (filter === 4) return matchday5 ? [matchday5] : [];
    if (filter === 5) return matchday6 ? [matchday6] : [];
    const b = groupMatchdays[filter];
    return b ? [b] : [];
  }, [filter, groupMatchdays, matchday4, matchday5, matchday6]);

  if (loading && matches.length === 0) return <p className="empty">Loading…</p>;

  const hasAnyFixtures = allMatchdaySections.length > 0;

  function tabBucket(tabIndex: number): MatchdayBucket | null | undefined {
    if (tabIndex < 3) return groupMatchdays[tabIndex];
    if (tabIndex === 3) return matchday4;
    if (tabIndex === 4) return matchday5;
    if (tabIndex === 5) return matchday6;
    return null;
  }

  return (
    <main className="fixtures-page fixtures-page--premium">
      <header className="page-head-row">
        <h1 className="page-title">Fixtures</h1>
        <BuyTicketsButton size="sm" />
      </header>
      {error && <div className="alert warn">{error}</div>}

      {hasAnyFixtures && (
        <div className="fixtures-tabs-scroll">
          <div className="fixtures-tabs-inner fixtures-tabs-inner--premium" role="tablist" aria-label="Matchday filter">
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
              onOpen={goMatch}
            />
          ) : bucket.kind === "semifinals" || bucket.kind === "finals" ? (
            <KoStyledMatchdayCard
              key={bucket.key}
              bucket={bucket as KoStyledMatchdayBucket}
              nameById={nameById}
              onOpen={goMatch}
            />
          ) : (
            <GroupMatchdayCard key={bucket.key} bucket={bucket} nameById={nameById} onOpen={goMatch} />
          ),
        )}
      </div>

    </main>
  );
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
    <section className="matchday-card matchday-card--premium" aria-labelledby={`md-${bucket.key}`}>
      <header className="matchday-card-head matchday-card-head--compact">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
      </header>
      <div className="premium-match-list">
        {bucket.matches.map((m) => (
          <PremiumMatchCard key={m.id} match={m} nameById={nameById} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function QuarterfinalsMatchdayCard({
  bucket,
  nameById,
  onOpen,
}: {
  bucket: MatchdayBucket;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="matchday-card matchday-card--premium matchday-card--quarterfinals" aria-labelledby={`md-${bucket.key}`}>
      <header className="matchday-card-head matchday-card-head--compact">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
      </header>
      <div className="premium-match-list">
        {bucket.matches.map((m) => (
          <PremiumMatchCard key={m.id} match={m} nameById={nameById} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function KoStyledSectionDivider({
  title,
  variant,
  icon,
}: {
  title: string;
  variant: string;
  icon?: string;
}) {
  return (
    <div className={`finals-section-divider finals-section-divider--${variant}`} role="presentation">
      <span className="finals-section-divider__line" aria-hidden />
      <span className="finals-section-divider__label">
        {icon && (
          <span className="finals-section-divider__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </span>
      <span className="finals-section-divider__line" aria-hidden />
    </div>
  );
}

function KoStyledMatchdayCard({
  bucket,
  nameById,
  onOpen,
}: {
  bucket: KoStyledMatchdayBucket;
  nameById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  const cardMod = bucket.kind === "finals" ? "finals" : "semifinals";

  return (
    <section
      className={`matchday-card matchday-card--ko-styled matchday-card--${cardMod}`}
      aria-labelledby={`md-${bucket.key}`}
    >
      <header className="matchday-card-head matchday-card-head--compact">
        <h2 id={`md-${bucket.key}`} className="matchday-card-title">
          {bucket.label}
        </h2>
      </header>
      <div className="finals-matchday-sections">
        {bucket.sections.map((section, index) => (
          <div
            key={section.match.id}
            className={`finals-matchday-section finals-matchday-section--${section.variant}${index > 0 ? " finals-matchday-section--separated" : ""}`}
          >
            <KoStyledSectionDivider title={section.dividerTitle} variant={section.variant} icon={section.dividerIcon} />
            <PremiumMatchCard match={section.match} nameById={nameById} onOpen={onOpen} />
            {section.variant === "final" && (
              <div className="finals-afterparty" role="note">
                <span className="finals-afterparty__line" aria-hidden />
                <p className="finals-afterparty__text">
                  <span className="finals-afterparty__icon" aria-hidden="true">
                    ✦
                  </span>
                  {FINAL_AFTERPARTY_LABEL}
                </p>
                <span className="finals-afterparty__line" aria-hidden />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

