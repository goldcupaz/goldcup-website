import { FormEvent, useState } from "react";

import type { Database, MatchEventType } from "../lib/database.types";
import { countPenaltyGoals } from "../lib/matchEventPenalties";
import { resolveEventPlayerPayload } from "../lib/matchEventForm";
import { resolveMatchTeamIds } from "../lib/matchTeamNames";
import { formatPenaltyKickLine } from "../lib/penaltyShootoutDisplay";
import type { MatchEventRow } from "../lib/timeline";
import { MatchEventTeamPlayerFields } from "./MatchEventTeamPlayerFields";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

type PenResult = "scored" | "missed";

type Props = {
  match: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: PlayerRow[];
  events: MatchEventRow[];
  onAdd: (row: { event_type: MatchEventType; team_id: string; player_name: string }) => void;
  onDelete: (id: string) => void;
  onSyncTotals?: (home: number, away: number) => void;
};

export function PenaltyShootoutAdmin({ match, teams, players, events, onAdd, onDelete, onSyncTotals }: Props) {
  const [side, setSide] = useState<"home" | "away">("home");
  const [result, setResult] = useState<PenResult>("scored");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [manualName, setManualName] = useState("");

  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  function addPenalty(e: FormEvent) {
    e.preventDefault();
    const evType: MatchEventType = result === "scored" ? "penalty_scored" : "penalty_missed";
    const resolved = resolveEventPlayerPayload(
      "goal",
      side,
      homeTeamId,
      awayTeamId,
      players,
      selectedPlayerId,
      manualName,
    );
    if (!resolved) return;
    onAdd({ event_type: evType, team_id: resolved.team_id, player_name: resolved.player_name });
    setSelectedPlayerId("");
    setManualName("");
  }

  const totals = countPenaltyGoals(events, homeTeamId, awayTeamId);

  return (
    <div className="penalty-shootout-admin" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
        Penalty shootout
      </h3>
      <p className="muted" style={{ fontSize: 11, margin: "0 0 10px" }}>
        Listed separately from the match timeline. Use score fields above for totals (e.g. 2–2 (4–3 pens)).
      </p>
      <ul className="admin-timeline-list">
        {events.map((ev) => (
          <li key={ev.id} className="admin-timeline-row">
            <span className="admin-timeline-text">{formatPenaltyKickLine(ev)}</span>
            <div className="admin-timeline-actions">
              <button type="button" className="btn btn-sm" onClick={() => void onDelete(ev.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {events.length === 0 && <li className="muted">No penalty kicks recorded.</li>}
      </ul>

      <div className="form-row" style={{ marginTop: 12 }}>
        <label>Add penalty kick</label>
        <form onSubmit={addPenalty} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <select value={result} onChange={(e) => setResult(e.target.value as PenResult)} aria-label="Result">
              <option value="scored">Scored</option>
              <option value="missed">Missed</option>
            </select>
          </div>
          <MatchEventTeamPlayerFields
            evType="goal"
            side={side}
            onSideChange={setSide}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onSelectedPlayerIdChange={setSelectedPlayerId}
            manualName={manualName}
            onManualNameChange={setManualName}
            teamSelectId="pen-ev-team"
            playerSelectId="pen-ev-player"
            manualInputId="pen-ev-manual"
            compact
          />
          <button type="submit" className="btn btn-primary">
            Add penalty kick
          </button>
        </form>
      </div>

      {onSyncTotals && events.length > 0 && (
        <p style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={() => onSyncTotals(totals.home, totals.away)}
            title="Set home/away penalty totals from scored kicks in this list"
          >
            Sync penalty totals ({totals.home}–{totals.away})
          </button>
        </p>
      )}
    </div>
  );
}
