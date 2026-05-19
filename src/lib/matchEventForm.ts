import type { Database, MatchEventType } from "./database.types";
import { TIMELINE_EVENT_OPTIONS } from "./matchEventTimelineOptions";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

export const MANUAL_PLAYER_VALUE = "__manual__";

export function eventNeedsTeamPlayer(evType: MatchEventType): boolean {
  return TIMELINE_EVENT_OPTIONS.find((o) => o.value === evType)?.needsTeamPlayer ?? false;
}

export function isOwnGoalEvent(evType: MatchEventType): boolean {
  return evType === "own_goal";
}

/** Label for the team dropdown when picking roster. */
export function teamFieldLabel(evType: MatchEventType): string {
  if (evType === "own_goal") return "Team (player who scored own goal)";
  return "Team";
}

export function teamFieldHint(evType: MatchEventType): string | null {
  if (evType === "own_goal") {
    return "The opposing team receives +1 on the scoreboard. This does not count as a goal for the player in top scorers.";
  }
  return null;
}

export function rosterForSide(
  players: PlayerRow[],
  side: "home" | "away",
  homeTeamId: string | null,
  awayTeamId: string | null,
): PlayerRow[] {
  const tid = side === "home" ? homeTeamId : awayTeamId;
  if (!tid) return [];
  return players
    .filter((p) => p.team_id === tid)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function teamIdForSide(side: "home" | "away", homeTeamId: string | null, awayTeamId: string | null): string | null {
  return side === "home" ? homeTeamId : awayTeamId;
}

export type ResolvedEventPlayer = { team_id: string; player_name: string };

/**
 * Resolve team + player for goal / own_goal / card events.
 * team_id is always the selected side's team (for own goals: the conceding player's team).
 */
export function resolveEventPlayerPayload(
  evType: MatchEventType,
  side: "home" | "away",
  homeTeamId: string | null,
  awayTeamId: string | null,
  players: PlayerRow[],
  selectedPlayerId: string,
  manualName: string,
): ResolvedEventPlayer | null {
  if (!eventNeedsTeamPlayer(evType)) return null;

  const team_id = teamIdForSide(side, homeTeamId, awayTeamId);
  if (!team_id) return null;

  const roster = rosterForSide(players, side, homeTeamId, awayTeamId);

  if (roster.length === 0) {
    const name = manualName.trim();
    if (!name) return null;
    return { team_id, player_name: name };
  }

  if (selectedPlayerId === MANUAL_PLAYER_VALUE) {
    const name = manualName.trim();
    if (!name) return null;
    return { team_id, player_name: name };
  }

  if (!selectedPlayerId) return null;

  const pl = roster.find((p) => p.id === selectedPlayerId);
  if (!pl) return null;
  return { team_id, player_name: pl.name };
}

/** Initialize side + player fields when opening edit modal. */
export function initialSideAndPlayer(
  event: { team_id: string | null; player_name: string | null },
  homeTeamId: string | null,
  awayTeamId: string | null,
  players: PlayerRow[],
): { side: "home" | "away"; selectedPlayerId: string; manualName: string } {
  let side: "home" | "away" = "home";
  if (event.team_id === homeTeamId) side = "home";
  else if (event.team_id === awayTeamId) side = "away";

  const roster = rosterForSide(players, side, homeTeamId, awayTeamId);
  const name = (event.player_name ?? "").trim();
  const found = roster.find((p) => p.name === name);
  if (found) return { side, selectedPlayerId: found.id, manualName: "" };
  if (name) return { side, selectedPlayerId: MANUAL_PLAYER_VALUE, manualName: name };
  return { side, selectedPlayerId: "", manualName: "" };
}
