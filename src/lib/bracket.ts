import type { Database } from "./database.types";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export function winnerId(m: MatchRow): string | null {
  if (m.status !== "full_time" || !m.home_team_id || !m.away_team_id) return null;
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;
  if (
    m.home_score === m.away_score &&
    m.home_penalties != null &&
    m.away_penalties != null &&
    m.home_penalties !== m.away_penalties
  ) {
    return m.home_penalties > m.away_penalties ? m.home_team_id : m.away_team_id;
  }
  return null;
}

export function loserId(m: MatchRow): string | null {
  const w = winnerId(m);
  if (!w || !m.home_team_id || !m.away_team_id) return null;
  return w === m.home_team_id ? m.away_team_id : m.home_team_id;
}

export function teamById(teams: TeamRow[], id: string | null): TeamRow | null {
  if (!id) return null;
  return teams.find((t) => t.id === id) ?? null;
}
