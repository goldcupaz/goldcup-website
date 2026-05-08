import type { Database } from "./database.types";
import { countsForStandingsScore } from "./matchStatus";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];

export type PlayerGoalRow = { rank: number; name: string; goals: number };
export type TeamGoalsRow = { teamId: string; teamName: string; gf: number; ga: number };

/**
 * Goal events → ranked list. Keys by team + name so duplicate names on different squads stay separate.
 * Optional teamId filters to one squad (team detail page).
 */
export function topGoalscorersFromEvents(events: MatchEventRow[], opts?: { teamId?: string }): PlayerGoalRow[] {
  const counts = new Map<string, { displayName: string; goals: number }>();

  for (const e of events) {
    if (e.event_type !== "goal") continue;
    if (!e.team_id) continue;
    if (opts?.teamId && e.team_id !== opts.teamId) continue;
    const n = (e.player_name ?? "").trim();
    if (!n) continue;
    const key = `${e.team_id}::${n.toLowerCase()}`;
    const cur = counts.get(key);
    if (cur) cur.goals += 1;
    else counts.set(key, { displayName: n, goals: 1 });
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1].goals !== a[1].goals) return b[1].goals - a[1].goals;
    return a[1].displayName.localeCompare(b[1].displayName);
  });

  return sorted.map(([, v], i) => ({
    rank: i + 1,
    name: v.displayName,
    goals: v.goals,
  }));
}

/** Per-team GF/GA from match scores (all stages), including live / half time / full time. */
export function teamGoalsFromMatches(matches: MatchRow[], teams: TeamRow[]): TeamGoalsRow[] {
  const agg = new Map<string, { gf: number; ga: number }>();

  function bump(id: string, gf: number, ga: number) {
    const s = agg.get(id) ?? { gf: 0, ga: 0 };
    s.gf += gf;
    s.ga += ga;
    agg.set(id, s);
  }

  for (const m of matches) {
    if (!countsForStandingsScore(m.status)) continue;
    if (!m.home_team_id || !m.away_team_id) continue;
    bump(m.home_team_id, m.home_score, m.away_score);
    bump(m.away_team_id, m.away_score, m.home_score);
  }

  return teams.map((t) => {
    const s = agg.get(t.id) ?? { gf: 0, ga: 0 };
    return { teamId: t.id, teamName: t.name, gf: s.gf, ga: s.ga };
  });
}
