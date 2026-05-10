import type { MatchEventType } from "./database.types";

export const TIMELINE_EVENT_OPTIONS: { value: MatchEventType; label: string; needsTeamPlayer: boolean }[] = [
  { value: "match_started", label: "Match started", needsTeamPlayer: false },
  { value: "goal", label: "Goal", needsTeamPlayer: true },
  { value: "own_goal", label: "Own goal", needsTeamPlayer: true },
  { value: "half_time", label: "Half time", needsTeamPlayer: false },
  { value: "yellow_card", label: "Yellow card", needsTeamPlayer: true },
  { value: "red_card", label: "Red card", needsTeamPlayer: true },
  { value: "full_time", label: "Full time", needsTeamPlayer: false },
];
