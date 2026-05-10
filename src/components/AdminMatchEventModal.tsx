import { FormEvent, useEffect, useMemo, useState } from "react";

import type { Database, MatchEventType } from "../lib/database.types";
import { TIMELINE_EVENT_OPTIONS } from "../lib/matchEventTimelineOptions";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

const MANUAL_PLAYER_VALUE = "__manual__";

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

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);

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
    if (event.team_id === match.home_team_id) setSide("home");
    else if (event.team_id === match.away_team_id) setSide("away");
    else setSide("home");

    const tid =
      event.team_id === match.home_team_id || event.team_id === match.away_team_id ? event.team_id : null;
    const roster = tid
      ? players.filter((p) => p.team_id === tid).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      : [];
    const name = (event.player_name ?? "").trim();
    const found = roster.find((p) => p.name === name);
    if (found) {
      setSelectedPlayerId(found.id);
      setManualName("");
    } else if (name) {
      setSelectedPlayerId(MANUAL_PLAYER_VALUE);
      setManualName(name);
    } else {
      setSelectedPlayerId("");
      setManualName("");
    }
  }, [event, match.home_team_id, match.away_team_id, players]);

  function pickTeamId(): string | null {
    return side === "home" ? match.home_team_id : match.away_team_id;
  }

  const roster = useMemo(() => {
    const tid = side === "home" ? match.home_team_id : match.away_team_id;
    if (!tid) return [];
    return players.filter((p) => p.team_id === tid).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [players, side, match.home_team_id, match.away_team_id]);

  const needsDetail = TIMELINE_EVENT_OPTIONS.find((o) => o.value === evType)?.needsTeamPlayer ?? false;

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

    if (needsDetail) {
      const tid = pickTeamId();
      if (!tid) return;
      team_id = tid;
      if (roster.length === 0) {
        if (!manualName.trim()) return;
        player_name = manualName.trim();
      } else if (selectedPlayerId === MANUAL_PLAYER_VALUE) {
        if (!manualName.trim()) return;
        player_name = manualName.trim();
      } else if (selectedPlayerId) {
        const pl = roster.find((p) => p.id === selectedPlayerId);
        if (!pl) return;
        player_name = pl.name;
      } else {
        return;
      }
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

          {needsDetail && (
            <>
              <div className="form-row">
                <label htmlFor="adm-ev-team">Team</label>
                <select
                  id="adm-ev-team"
                  value={side}
                  onChange={(e) => {
                    setSide(e.target.value as "home" | "away");
                    setSelectedPlayerId("");
                    setManualName("");
                  }}
                >
                  <option value="home">{homeTeam?.name ?? "Home"}</option>
                  <option value="away">{awayTeam?.name ?? "Away"}</option>
                </select>
              </div>
              {roster.length > 0 ? (
                <div className="form-row">
                  <label htmlFor="adm-ev-player">Player</label>
                  <select
                    id="adm-ev-player"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                  >
                    <option value="">Select player…</option>
                    {roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.is_goalkeeper ? `${p.name} (GK)` : p.name}
                      </option>
                    ))}
                    <option value={MANUAL_PLAYER_VALUE}>Other — type name</option>
                  </select>
                </div>
              ) : null}
              {(roster.length === 0 || selectedPlayerId === MANUAL_PLAYER_VALUE) && (
                <div className="form-row">
                  <label htmlFor="adm-ev-manual">{roster.length === 0 ? "Player name" : "Manual name"}</label>
                  <input
                    id="adm-ev-manual"
                    placeholder="Player name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

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
            <textarea id="adm-ev-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shown on timeline after the event text" />
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
