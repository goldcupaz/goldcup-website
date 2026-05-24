import { FormEvent, useEffect, useState } from "react";

import type { Database, MatchEventType } from "../lib/database.types";
import {
  eventNeedsTeamPlayer,
  initialSideAndPlayer,
  resolveEventPlayerPayload,
} from "../lib/matchEventForm";
import { TIMELINE_EVENT_OPTIONS } from "../lib/matchEventTimelineOptions";
import { resolveMatchTeamIds } from "../lib/matchTeamNames";
import { MatchEventTeamPlayerFields } from "./MatchEventTeamPlayerFields";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

export type MatchEventEditPayload = {
  event_type: MatchEventType;
  team_id: string | null;
  player_name: string | null;
  event_order: number;
  event_minute: number | null;
  event_note: string | null;
};

type Props = {
  match: MatchRow;
  event: MatchEventRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: PlayerRow[];
  onClose: () => void;
  onSave: (payload: MatchEventEditPayload) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function AdminMatchEventModal({ match, event, teams, players, onClose, onSave, onDelete }: Props) {
  const [evType, setEvType] = useState<MatchEventType>(event.event_type);
  const [side, setSide] = useState<"home" | "away">("home");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [manualName, setManualName] = useState("");
  const [eventOrder, setEventOrder] = useState(String(event.event_order));
  const [minuteStr, setMinuteStr] = useState(
    event.event_minute != null && Number.isFinite(event.event_minute) ? String(event.event_minute) : "",
  );
  const [note, setNote] = useState(event.event_note ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { homeTeamId, awayTeamId } = resolveMatchTeamIds(match);
  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setEvType(event.event_type);
    setEventOrder(String(event.event_order));
    setMinuteStr(
      event.event_minute != null && Number.isFinite(event.event_minute) ? String(event.event_minute) : "",
    );
    setNote(event.event_note ?? "");
    const init = initialSideAndPlayer(event, homeTeamId, awayTeamId, players);
    setSide(init.side);
    setSelectedPlayerId(init.selectedPlayerId);
    setManualName(init.manualName);
  }, [event, homeTeamId, awayTeamId, players]);

  function parseMinute(): number | null {
    const t = minuteStr.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || n > 200) return null;
    return Math.floor(n);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const orderNum = Number.parseInt(eventOrder, 10);
    const event_order = Number.isFinite(orderNum) ? orderNum : event.event_order;

    let team_id: string | null = null;
    let player_name: string | null = null;

    if (eventNeedsTeamPlayer(evType)) {
      const resolved = resolveEventPlayerPayload(
        evType,
        side,
        homeTeamId,
        awayTeamId,
        players,
        selectedPlayerId,
        manualName,
      );
      if (!resolved) return;
      team_id = resolved.team_id;
      player_name = resolved.player_name;
    }

    const event_minute = parseMinute();
    const event_note = note.trim() ? note.trim() : null;

    setSaving(true);
    try {
      await onSave({
        event_type: evType,
        team_id,
        player_name,
        event_order,
        event_minute,
        event_note,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this timeline event? Score will be recalculated from remaining goals.")) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop admin-event-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal admin-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-event-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-event-modal-head">
          <h2 id="admin-event-modal-title" className="admin-event-modal-title">
            Edit timeline event
          </h2>
          <button type="button" className="btn admin-event-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="admin-event-modal-form" onSubmit={submit}>
          <div className="form-row">
            <label htmlFor="adm-ev-type">Event type</label>
            <select
              id="adm-ev-type"
              value={evType}
              onChange={(e) => {
                setEvType(e.target.value as MatchEventType);
                setSelectedPlayerId("");
                setManualName("");
              }}
            >
              {TIMELINE_EVENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <MatchEventTeamPlayerFields
            evType={evType}
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
            teamSelectId="adm-ev-team"
            playerSelectId="adm-ev-player"
            manualInputId="adm-ev-manual"
          />

          <div className="form-row">
            <label htmlFor="adm-ev-minute">Minute (optional)</label>
            <input
              id="adm-ev-minute"
              inputMode="numeric"
              placeholder="e.g. 23"
              value={minuteStr}
              onChange={(e) => setMinuteStr(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="adm-ev-order">Sort order</label>
            <input
              id="adm-ev-order"
              inputMode="numeric"
              value={eventOrder}
              onChange={(e) => setEventOrder(e.target.value)}
            />
            <span className="muted" style={{ fontSize: 11 }}>
              Lower numbers appear first when minutes match.
            </span>
          </div>

          <div className="form-row">
            <label htmlFor="adm-ev-note">Note (optional)</label>
            <textarea
              id="adm-ev-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shown on timeline after the event text"
            />
          </div>

          <div className="admin-event-modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn admin-event-modal-delete"
              onClick={() => void handleDelete()}
              disabled={saving || deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || deleting}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
