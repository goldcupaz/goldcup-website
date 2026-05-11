import type { Database } from "./database.types";
import { countsForStandingsScore } from "./matchStatus";
import { teamGoalsFromMatches } from "./tournamentStats";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];

export type RankedValue = { rank: number; label: string; value: number; sub?: string };

function nameByTeamId(teams: TeamRow[]): Map<string, string> {
  return new Map(teams.map((t) => [t.id, t.name] as const));
}

/** Matches counted toward standings-style stats per team. */
export function matchesPlayedByTeam(matches: MatchRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of matches) {
    if (!countsForStandingsScore(x.status)) continue;
    if (!x.home_team_id || !x.away_team_id) continue;
    m.set(x.home_team_id, (m.get(x.home_team_id) ?? 0) + 1);
    m.set(x.away_team_id, (m.get(x.away_team_id) ?? 0) + 1);
  }
  return m;
}

export function teamWinsFromMatches(matches: MatchRow[]): Map<string, number> {
  const wins = new Map<string, number>();
  for (const x of matches) {
    if (!countsForStandingsScore(x.status)) continue;
    if (!x.home_team_id || !x.away_team_id) continue;
    if (x.home_score > x.away_score) wins.set(x.home_team_id, (wins.get(x.home_team_id) ?? 0) + 1);
    else if (x.away_score > x.home_score) wins.set(x.away_team_id, (wins.get(x.away_team_id) ?? 0) + 1);
  }
  return wins;
}

export function cardCountsByTeam(events: MatchEventRow[], card: "yellow_card" | "red_card"): Map<string, number> {
  const c = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== card) continue;
    if (!e.team_id) continue;
    c.set(e.team_id, (c.get(e.team_id) ?? 0) + 1);
  }
  return c;
}

export type TopScorerRow = { rank: number; playerName: string; teamName: string; goals: number };

export function topScorersWithTeams(events: MatchEventRow[], teams: TeamRow[], limit = 25): TopScorerRow[] {
  const tmap = nameByTeamId(teams);
  const counts = new Map<string, { playerName: string; teamName: string; goals: number }>();
  for (const e of events) {
    if (e.event_type !== "goal") continue;
    if (!e.team_id) continue;
    const n = (e.player_name ?? "").trim();
    if (!n) continue;
    const key = `${e.team_id}::${n.toLowerCase()}`;
    const teamName = tmap.get(e.team_id) ?? "Unknown";
    const cur = counts.get(key);
    if (cur) cur.goals += 1;
    else counts.set(key, { playerName: n, teamName, goals: 1 });
  }
  const sorted = [...counts.values()].sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
  return sorted.slice(0, limit).map((r, i) => ({ rank: i + 1, playerName: r.playerName, teamName: r.teamName, goals: r.goals }));
}

export type OwnGoalRow = { rank: number; playerName: string; teamName: string; ownGoals: number };

export function ownGoalLeaders(events: MatchEventRow[], teams: TeamRow[], limit = 15): OwnGoalRow[] {
  const tmap = nameByTeamId(teams);
  const counts = new Map<string, { playerName: string; teamName: string; ownGoals: number }>();
  for (const e of events) {
    if (e.event_type !== "own_goal") continue;
    if (!e.team_id) continue;
    const n = (e.player_name ?? "").trim() || "Unknown";
    const key = `${e.team_id}::${n.toLowerCase()}`;
    const teamName = tmap.get(e.team_id) ?? "Unknown";
    const cur = counts.get(key);
    if (cur) cur.ownGoals += 1;
    else counts.set(key, { playerName: n, teamName, ownGoals: 1 });
  }
  const sorted = [...counts.values()].sort((a, b) => b.ownGoals - a.ownGoals || a.playerName.localeCompare(b.playerName));
  return sorted.slice(0, limit).map((r, i) => ({ rank: i + 1, playerName: r.playerName, teamName: r.teamName, ownGoals: r.ownGoals }));
}

function toRanked(
  items: { id: string; name: string; value: number }[],
  sort: "desc" | "asc",
): RankedValue[] {
  const s = [...items].sort((a, b) => (sort === "desc" ? b.value - a.value : a.value - b.value || a.name.localeCompare(b.name)));
  return s.map((x, i) => ({ rank: i + 1, label: x.name, value: x.value }));
}

export function buildTeamStatBlocks(matches: MatchRow[], teams: TeamRow[]) {
  const played = matchesPlayedByTeam(matches);
  const totals = teamGoalsFromMatches(matches, teams);
  const wins = teamWinsFromMatches(matches);

  const withGd = totals.map((t) => ({
    id: t.teamId,
    name: t.teamName,
    gf: t.gf,
    ga: t.ga,
    gd: t.gf - t.ga,
    wins: wins.get(t.teamId) ?? 0,
    played: played.get(t.teamId) ?? 0,
  }));

  const mostGoalsScored = toRanked(
    withGd.map((x) => ({ id: x.id, name: x.name, value: x.gf })),
    "desc",
  );
  const mostGoalsConceded = toRanked(
    withGd.filter((x) => x.played > 0).map((x) => ({ id: x.id, name: x.name, value: x.ga })),
    "desc",
  );
  const leastGoalsConceded = toRanked(
    withGd.filter((x) => x.played > 0).map((x) => ({ id: x.id, name: x.name, value: x.ga })),
    "asc",
  );
  const mostWins = toRanked(
    withGd.map((x) => ({ id: x.id, name: x.name, value: x.wins })),
    "desc",
  );
  const bestGd = toRanked(
    withGd.filter((x) => x.played > 0).map((x) => ({ id: x.id, name: x.name, value: x.gd })),
    "desc",
  );

  return { mostGoalsScored, mostGoalsConceded, leastGoalsConceded, mostWins, bestGd };
}

export function buildDisciplineBlocks(events: MatchEventRow[], teams: TeamRow[]) {
  const tmap = nameByTeamId(teams);
  const yellow = cardCountsByTeam(events, "yellow_card");
  const red = cardCountsByTeam(events, "red_card");

  const yList = [...yellow.entries()]
    .map(([id, value]) => ({ id, name: tmap.get(id) ?? id, value }))
    .filter((x) => x.value > 0);
  const rList = [...red.entries()]
    .map(([id, value]) => ({ id, name: tmap.get(id) ?? id, value }))
    .filter((x) => x.value > 0);

  return {
    mostYellows: toRanked(yList, "desc"),
    mostReds: toRanked(rList, "desc"),
  };
}
