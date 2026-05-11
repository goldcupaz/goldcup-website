import type { Database } from "./database.types";

import { countsForStandingsScore } from "./matchStatus";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

export type StandingRow = {
  team: TeamRow;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

function emptyRow(team: TeamRow): StandingRow {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
  };
}

function h2hStats(
  teamIds: Set<string>,
  groupFinishedMatches: MatchRow[],
): Map<string, { pts: number; gf: number; ga: number; gd: number }> {
  const stats = new Map<string, { pts: number; gf: number; ga: number }>();
  for (const id of teamIds) stats.set(id, { pts: 0, gf: 0, ga: 0 });

  for (const m of groupFinishedMatches) {
    if (m.status !== "full_time") continue;
    if (!m.home_team_id || !m.away_team_id) continue;
    if (!teamIds.has(m.home_team_id) || !teamIds.has(m.away_team_id)) continue;

    const h = m.home_team_id;
    const a = m.away_team_id;
    const hs = m.home_score;
    const as = m.away_score;

    const sh = stats.get(h)!;
    const sa = stats.get(a)!;
    sh.gf += hs;
    sh.ga += as;
    sa.gf += as;
    sa.ga += hs;

    if (hs > as) sh.pts += 3;
    else if (hs < as) sa.pts += 3;
    else {
      sh.pts += 1;
      sa.pts += 1;
    }
  }

  const out = new Map<string, { pts: number; gf: number; ga: number; gd: number }>();
  for (const [id, s] of stats)
    out.set(id, { pts: s.pts, gf: s.gf, ga: s.ga, gd: s.gf - s.ga });
  return out;
}

function deterministicDrawKey(teamId: string, salt: string): number {
  let h = 0;
  const str = teamId + salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function computeGroupStandings(
  groupLetter: string,
  teams: TeamRow[],
  groupMatches: MatchRow[],
): StandingRow[] {
  const byId: Record<string, StandingRow> = {};
  for (const t of teams) byId[t.id] = emptyRow(t);

  const relevant = groupMatches.filter(
    (m) =>
      m.stage === "group" &&
      m.group_letter === groupLetter &&
      countsForStandingsScore(m.status),
  );

  for (const m of relevant) {
    if (!m.home_team_id || !m.away_team_id) continue;

    const home = byId[m.home_team_id];
    const away = byId[m.away_team_id];
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;

    if (m.home_score > m.away_score) {
      home.wins += 1;
      home.pts += 3;
      away.losses += 1;
    } else if (m.home_score < m.away_score) {
      away.wins += 1;
      away.pts += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  for (const r of Object.values(byId)) r.gd = r.gf - r.ga;

  const rows = Object.values(byId);
  const allFinished = groupMatches.filter(
    (m) => m.stage === "group" && m.group_letter === groupLetter && m.status === "full_time",
  );

  /**
   * Tiebreak order (after points):
   * 1. Goal difference  2. Goals scored  3. Head-to-head (among teams tied on pts+GD+GF)
   * 4. Goals conceded (fewer better)  5. Deterministic draw
   */
  const sorted = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;

    const tiedTriple = rows.filter((r) => r.pts === a.pts && r.gd === a.gd && r.gf === a.gf);
    if (tiedTriple.length >= 2) {
      const setTied = new Set(tiedTriple.map((r) => r.team.id));
      const h2h = h2hStats(setTied, allFinished);
      const ha = h2h.get(a.team.id);
      const hb = h2h.get(b.team.id);
      if (ha && hb) {
        if (hb.pts !== ha.pts) return hb.pts - ha.pts;
        if (hb.gd !== ha.gd) return hb.gd - ha.gd;
        if (hb.gf !== ha.gf) return hb.gf - ha.gf;
      }
    }

    if (a.ga !== b.ga) return a.ga - b.ga;
    return deterministicDrawKey(a.team.id, "gc-tb-2026") - deterministicDrawKey(b.team.id, "gc-tb-2026");
  });

  return sorted;
}

export function computeStandingsForGroup(letter: string, teams: TeamRow[], matches: MatchRow[]) {
  return computeGroupStandings(
    letter,
    teams.filter((t) => t.group_letter === letter),
    matches,
  );
}
