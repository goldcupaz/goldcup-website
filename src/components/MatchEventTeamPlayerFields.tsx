import type { ReactNode } from "react";

import type { Database, MatchEventType } from "../lib/database.types";
import {
  MANUAL_PLAYER_VALUE,
  eventNeedsTeamPlayer,
  rosterForSide,
  teamFieldHint,
  teamFieldLabel,
} from "../lib/matchEventForm";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

type Props = {
  evType: MatchEventType;
  side: "home" | "away";
  onSideChange: (side: "home" | "away") => void;
  homeTeam: TeamRow | undefined;
  awayTeam: TeamRow | undefined;
  homeTeamId: string | null;
  awayTeamId: string | null;
  players: PlayerRow[];
  selectedPlayerId: string;
  onSelectedPlayerIdChange: (id: string) => void;
  manualName: string;
  onManualNameChange: (name: string) => void;
  teamSelectId?: string;
  playerSelectId?: string;
  manualInputId?: string;
  compact?: boolean;
};

export function MatchEventTeamPlayerFields({
  evType,
  side,
  onSideChange,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  players,
  selectedPlayerId,
  onSelectedPlayerIdChange,
  manualName,
  onManualNameChange,
  teamSelectId = "ev-team",
  playerSelectId = "ev-player",
  manualInputId = "ev-manual",
  compact = false,
}: Props) {
  if (!eventNeedsTeamPlayer(evType)) return null;

  const roster = rosterForSide(players, side, homeTeamId, awayTeamId);
  const hint = teamFieldHint(evType);
  const rowStyle = compact ? { marginBottom: 0 } : undefined;

  function resetPlayerFields() {
    onSelectedPlayerIdChange("");
    onManualNameChange("");
  }

  return (
    <>
      {hint ? (
        <p className="muted" style={{ fontSize: 11, margin: "0 0 8px", lineHeight: 1.4 }}>
          {hint}
        </p>
      ) : null}
      <FormRow style={rowStyle}>
        <label htmlFor={teamSelectId}>{teamFieldLabel(evType)}</label>
        <select
          id={teamSelectId}
          value={side}
          onChange={(e) => {
            onSideChange(e.target.value as "home" | "away");
            resetPlayerFields();
          }}
        >
          <option value="home">{homeTeam?.name ?? "Home"}</option>
          <option value="away">{awayTeam?.name ?? "Away"}</option>
        </select>
      </FormRow>
      {roster.length > 0 ? (
        <FormRow style={rowStyle}>
          <label htmlFor={playerSelectId}>Player</label>
          <select id={playerSelectId} value={selectedPlayerId} onChange={(e) => onSelectedPlayerIdChange(e.target.value)}>
            <option value="">Select player…</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.is_goalkeeper ? `${p.name} (GK)` : p.name}
              </option>
            ))}
            <option value={MANUAL_PLAYER_VALUE}>Other — type name</option>
          </select>
        </FormRow>
      ) : null}
      {(roster.length === 0 || selectedPlayerId === MANUAL_PLAYER_VALUE) && (
        <FormRow style={rowStyle}>
          <label htmlFor={manualInputId}>{roster.length === 0 ? "Player name" : "Manual name"}</label>
          <input
            id={manualInputId}
            placeholder="Player name"
            value={manualName}
            onChange={(e) => onManualNameChange(e.target.value)}
          />
        </FormRow>
      )}
    </>
  );
}

function FormRow({ style, children }: { style?: { marginBottom: number }; children: ReactNode }) {
  return (
    <div className="form-row" style={style}>
      {children}
    </div>
  );
}
