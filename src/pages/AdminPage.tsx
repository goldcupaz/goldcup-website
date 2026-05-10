import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import type { Database, MatchEventType } from "../lib/database.types";
import { statusOptionLabel } from "../lib/format";
import { formatTimelineLine, sortMatchEvents } from "../lib/timeline";
import { sortMatchesForAdminPicker } from "../lib/matchSort";
import { qualifiedPot } from "../lib/pots";
import { supabase } from "../lib/supabase";
import { finalComputed, getBySlot, thirdComputed } from "../lib/knockoutResolve";
import { winnerId } from "../lib/bracket";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type MatchStatus = Database["public"]["Tables"]["matches"]["Row"]["status"];

const STATUSES: MatchStatus[] = [
  "not_started",
  "live_first_half",
  "half_time",
  "live_second_half",
  "full_time",
];

const LIVE_STATUS_STRIP: { value: MatchStatus; label: string; title?: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "live_first_half", label: "Live", title: "First half" },
  { value: "half_time", label: "Half Time" },
  { value: "live_second_half", label: "Live", title: "Second half" },
  { value: "full_time", label: "Full Time" },
];

const TIMELINE_EVENT_OPTIONS: { value: MatchEventType; label: string; needsTeamPlayer: boolean }[] = [
  { value: "match_started", label: "Match started", needsTeamPlayer: false },
  { value: "goal", label: "Goal", needsTeamPlayer: true },
  { value: "own_goal", label: "Own goal", needsTeamPlayer: true },
  { value: "half_time", label: "Half time", needsTeamPlayer: false },
  { value: "yellow_card", label: "Yellow card", needsTeamPlayer: true },
  { value: "red_card", label: "Red card", needsTeamPlayer: true },
  { value: "full_time", label: "Full time", needsTeamPlayer: false },
];

export function AdminPage() {
  const { session, isAdmin, loading: authLoading, signOut } = useAuth();
  const { teams, matches, matchEvents, players, currentLiveMatchId, refresh, refreshTeamsAndPlayers } =
    useTournament();
  const [tab, setTab] = useState<"live" | "matches" | "qf" | "teams" | "bracket">("live");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { pot1, pot2 } = useMemo(() => qualifiedPot(teams, matches), [teams, matches]);

  const matchesForLivePick = useMemo(() => sortMatchesForAdminPicker(matches), [matches]);

  const liveMatch = useMemo(() => {
    if (!currentLiveMatchId) return null;
    return matches.find((m) => m.id === currentLiveMatchId) ?? null;
  }, [currentLiveMatchId, matches]);

  if (authLoading) return <p className="empty">Loading…</p>;
  if (!session) {
    return (
      <main className="admin-page">
        <p className="empty">Not signed in.</p>
        <Link to="/admin" className="btn">
          Back to admin login
        </Link>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <h1 className="page-title">Admin access</h1>
        <div className="card">
          <p className="muted">
            You are signed in, but your profile does not have admin rights. In Supabase SQL Editor run (use your user id
            from Authentication → Users):
          </p>
          <pre className="muted" style={{ fontSize: 12, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {`update public.profiles set is_admin = true
where id = 'YOUR_USER_UUID';`}
          </pre>
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  const groupMatches = matches.filter((m) => m.stage === "group").sort((a, b) => a.sort_order - b.sort_order);
  const koMatches = matches.filter((m) => m.stage !== "group").sort((a, b) => a.sort_order - b.sort_order);

  async function notify(msgText: string, error?: string | null) {
    setMsg(msgText);
    setErr(error ?? null);
    await refresh();
  }

  /** Set which match is featured on the Live tab. */
  async function setLiveMatch(matchId: string | null) {
    const value = { id: matchId };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "current_live_match_id", value }, { onConflict: "key" });
    if (error) {
      await notify("", error.message);
      return;
    }
    await notify("Featured live match updated.");
  }

  async function saveMatch(patch: Partial<MatchRow> & { id: string }) {
    const { id, ...rest } = patch;
    const { error } = await supabase.from("matches").update(rest).eq("id", id);
    if (error) await notify("", error.message);
    else await notify("Match saved.");
  }

  async function addMatchEvent(
    matchId: string,
    row: { event_type: MatchEventType; team_id?: string | null; player_name?: string | null },
  ) {
    const existing = matchEvents.filter((e) => e.match_id === matchId);
    const nextOrder = existing.length === 0 ? 0 : Math.max(...existing.map((e) => e.event_order)) + 1;
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      event_type: row.event_type,
      team_id: row.team_id ?? null,
      player_name: row.player_name?.trim() ? row.player_name.trim() : null,
      event_order: nextOrder,
    });
    if (error) {
      await notify("", error.message);
      return;
    }
    if (row.event_type === "own_goal" && row.team_id) {
      const m = matches.find((x) => x.id === matchId);
      if (m?.home_team_id && m.away_team_id) {
        let nh = Number(m.home_score) || 0;
        let na = Number(m.away_score) || 0;
        if (row.team_id === m.home_team_id) na += 1;
        else if (row.team_id === m.away_team_id) nh += 1;
        const { error: scoreErr } = await supabase
          .from("matches")
          .update({ home_score: nh, away_score: na })
          .eq("id", matchId);
        if (scoreErr) {
          await notify("", `Own goal logged but score update failed: ${scoreErr.message}`);
          return;
        }
      }
    }
    await notify("Timeline event added.");
  }

  async function deleteMatchEvent(eventId: string) {
    const ev = matchEvents.find((e) => e.id === eventId);
    const { error } = await supabase.from("match_events").delete().eq("id", eventId);
    if (error) {
      await notify("", error.message);
      return;
    }
    let scoreErr: string | null = null;
    if (ev?.event_type === "own_goal" && ev.team_id) {
      const m = matches.find((x) => x.id === ev.match_id);
      if (m?.home_team_id && m.away_team_id) {
        let nh = Number(m.home_score) || 0;
        let na = Number(m.away_score) || 0;
        if (ev.team_id === m.home_team_id) na = Math.max(0, na - 1);
        else if (ev.team_id === m.away_team_id) nh = Math.max(0, nh - 1);
        const { error: e2 } = await supabase.from("matches").update({ home_score: nh, away_score: na }).eq("id", m.id);
        scoreErr = e2?.message ?? null;
      }
    }
    if (scoreErr) await notify("Timeline event removed.", `Score rollback failed: ${scoreErr}`);
    else await notify("Timeline event removed.");
  }

  function sameGroup(aid: string | null, bid: string | null) {
    if (!aid || !bid) return false;
    const a = teams.find((t) => t.id === aid);
    const b = teams.find((t) => t.id === bid);
    return !!a && !!b && a.group_letter === b.group_letter;
  }

  async function saveQf(slot: "QF1" | "QF2" | "QF3" | "QF4", homeId: string, awayId: string) {
    const hid = homeId || null;
    const aid = awayId || null;
    if (hid && aid && sameGroup(hid, aid)) {
      await notify("", "Pot 1 and Pot 2 teams cannot be from the same group.");
      return;
    }
    const m = getBySlot(matches, slot);
    if (!m) return;
    await saveMatch({ id: m.id, home_team_id: hid, away_team_id: aid });
  }

  async function syncBracket() {
    const qf1 = getBySlot(matches, "QF1");
    const qf2 = getBySlot(matches, "QF2");
    const qf3 = getBySlot(matches, "QF3");
    const qf4 = getBySlot(matches, "QF4");
    const sf1 = getBySlot(matches, "SF1");
    const sf2 = getBySlot(matches, "SF2");
    const fin = getBySlot(matches, "FINAL");
    const third = getBySlot(matches, "THIRD");
    if (!sf1 || !sf2 || !fin || !third) return;

    const w1 = qf1 ? winnerId(qf1) : null;
    const w2 = qf2 ? winnerId(qf2) : null;
    const w3 = qf3 ? winnerId(qf3) : null;
    const w4 = qf4 ? winnerId(qf4) : null;

    const { error: e1 } = await supabase
      .from("matches")
      .update({ home_team_id: w1, away_team_id: w3 })
      .eq("id", sf1.id);
    if (e1) {
      await notify("", e1.message);
      return;
    }
    const { error: e2 } = await supabase
      .from("matches")
      .update({ home_team_id: w2, away_team_id: w4 })
      .eq("id", sf2.id);
    if (e2) {
      await notify("", e2.message);
      return;
    }

    const { data: fresh, error: fe } = await supabase.from("matches").select("*").order("sort_order");
    if (fe || !fresh) {
      await notify("", fe?.message ?? "Could not reload matches.");
      return;
    }
    const mlist = fresh as MatchRow[];
    const cF = finalComputed(mlist);
    const cT = thirdComputed(mlist);

    if (cF.homeId && cF.awayId) {
      const { error: e3 } = await supabase
        .from("matches")
        .update({ home_team_id: cF.homeId, away_team_id: cF.awayId })
        .eq("id", fin.id);
      if (e3) {
        await notify("", e3.message);
        return;
      }
    }
    if (cT.homeId && cT.awayId) {
      const { error: e4 } = await supabase
        .from("matches")
        .update({ home_team_id: cT.homeId, away_team_id: cT.awayId })
        .eq("id", third.id);
      if (e4) {
        await notify("", e4.message);
        return;
      }
    }

    await notify(
      "Bracket synced: semi-final slots updated from quarter-finals. Final / 3rd place updated when semi-finals have winners.",
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <h1 className="page-title admin-page-title">Admin</h1>
        <div className="admin-page-actions">
          <Link to="/" className="btn" style={{ textDecoration: "none" }}>
            Public site
          </Link>
          <button type="button" className="btn" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {msg && <div className="alert">{msg}</div>}
      {err && <div className="alert warn">{err}</div>}

      <div className="admin-tab-bar">
        {(
          [
            ["live", "Live match"],
            ["matches", "Fixtures & results"],
            ["qf", "Quarter-finals"],
            ["teams", "Teams & players"],
            ["bracket", "Sync bracket"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? "btn btn-primary" : "btn"}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <section className="card admin-grid">
          <div>
            <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Featured live match
            </h2>
            <p className="muted">Visitors see this match on the Live tab. Realtime updates apply.</p>
            <div className="form-row">
              <label htmlFor="livePick">Match</label>
              <select
                id="livePick"
                className="select"
                value={currentLiveMatchId ?? ""}
                onChange={(e) => void setLiveMatch(e.target.value || null)}
              >
                <option value="">None</option>
                {matchesForLivePick.map((m) => {
                  const hn = m.home_team_id ? teams.find((t) => t.id === m.home_team_id)?.name : "TBD";
                  const an = m.away_team_id ? teams.find((t) => t.id === m.away_team_id)?.name : "TBD";
                  const stageTag =
                    m.stage === "group"
                      ? `Group ${m.group_letter ?? "?"}`
                      : m.stage === "qf"
                        ? "QF"
                        : m.stage === "sf"
                          ? "SF"
                          : m.stage === "third"
                            ? "3rd"
                            : m.stage === "final"
                              ? "Final"
                              : m.stage;
                  const when = m.scheduled_at
                    ? new Date(m.scheduled_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "TBD";
                  const label = [m.slot_code, m.group_letter].filter(Boolean).join(" ") || m.stage;
                  return (
                    <option key={m.id} value={m.id}>
                      [{stageTag}] {when} · {label} · {hn} vs {an}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {liveMatch && (
            <LiveEditor
              key={liveMatch.id}
              match={liveMatch}
              teams={teams}
              players={players}
              events={sortMatchEvents(matchEvents.filter((e) => e.match_id === liveMatch.id))}
              onSave={(p) => void saveMatch(p)}
              onAddEvent={(row) => void addMatchEvent(liveMatch.id, row)}
              onDeleteEvent={(id) => void deleteMatchEvent(id)}
            />
          )}
        </section>
      )}

      {tab === "matches" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Group stage
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>When</th>
                  <th>Home</th>
                  <th>Away</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {groupMatches.map((m) => (
                  <GroupMatchRow key={m.id} m={m} teams={teams} onSave={(p) => void saveMatch(p)} />
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 24, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Knockout
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>When</th>
                  <th>Match-up</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {koMatches.map((m) => (
                  <KoMatchRow key={m.id} m={m} teams={teams} onSave={(p) => void saveMatch(p)} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "qf" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Quarter-final draw
          </h2>
          <p className="muted">
            Home side should be a Pot 1 (group winner) team and away a Pot 2 (runner-up) team. Same-group pairings are
            blocked.
          </p>
          <div className="muted" style={{ marginBottom: 12 }}>
            <strong>Pot 1</strong>: {pot1.map((t) => t.name).join(", ") || "—"} &nbsp;|&nbsp; <strong>Pot 2</strong>:{" "}
            {pot2.map((t) => t.name).join(", ") || "—"}
          </div>
          {(["QF1", "QF2", "QF3", "QF4"] as const).map((slot) => {
            const qm = getBySlot(matches, slot);
            if (!qm) return null;
            return (
              <QfRow
                key={slot}
                slot={slot}
                match={qm}
                pot1={pot1}
                pot2={pot2}
                onSave={(hid, aid) => void saveQf(slot, hid, aid)}
              />
            );
          })}
        </section>
      )}

      {tab === "teams" && (
        <TeamsEditor
          teams={teams}
          players={players}
          onAdminNotify={notify}
          refreshTeamsAndPlayers={refreshTeamsAndPlayers}
        />
      )}

      {tab === "bracket" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Sync semi-finals & finals
          </h2>
          <p className="muted">
            After quarter-finals are final, press to copy winners into SF1/SF2. After both semi-finals are final, Final
            and 3rd place teams are filled (fixed tree: SF1 vs SF3 branch, SF2 vs SF4 branch).
          </p>
          <button type="button" className="btn btn-primary" onClick={() => void syncBracket()}>
            Sync bracket from results
          </button>
        </section>
      )}
    </main>
  );
}

function GroupMatchRow({
  m,
  teams,
  onSave,
}: {
  m: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
}) {
  const [hs, setHs] = useState(String(m.home_score));
  const [as, setAs] = useState(String(m.away_score));
  const [st, setSt] = useState<MatchStatus>(m.status);
  const [when, setWhen] = useState(m.scheduled_at ? m.scheduled_at.slice(0, 16) : "");

  useEffect(() => {
    setSt(m.status);
    setHs(String(m.home_score));
    setAs(String(m.away_score));
  }, [m.id, m.status, m.home_score, m.away_score]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: m.id,
      home_score: Number(hs),
      away_score: Number(as),
      status: st,
      scheduled_at: when ? new Date(when).toISOString() : null,
    });
  }

  return (
    <tr>
      <td style={{ fontSize: 11 }}>{m.slot_code}</td>
      <td>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ minWidth: 0 }} />
      </td>
      <td>{teams.find((t) => t.id === m.home_team_id)?.name}</td>
      <td>{teams.find((t) => t.id === m.away_team_id)?.name}</td>
      <td>
        <input
          style={{ width: 48 }}
          value={hs}
          onChange={(e) => setHs(e.target.value)}
          inputMode="numeric"
        />{" "}
        –{" "}
        <input style={{ width: 48 }} value={as} onChange={(e) => setAs(e.target.value)} inputMode="numeric" />
      </td>
      <td>
        <select value={st} onChange={(e) => setSt(e.target.value as MatchStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusOptionLabel(s)}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button type="button" className="btn" onClick={submit}>
          Save
        </button>
      </td>
    </tr>
  );
}

function KoMatchRow({
  m,
  teams,
  onSave,
}: {
  m: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
}) {
  const [hs, setHs] = useState(String(m.home_score));
  const [as, setAs] = useState(String(m.away_score));
  const [st, setSt] = useState<MatchStatus>(m.status);
  const [when, setWhen] = useState(m.scheduled_at ? m.scheduled_at.slice(0, 16) : "");

  useEffect(() => {
    setSt(m.status);
    setHs(String(m.home_score));
    setAs(String(m.away_score));
  }, [m.id, m.status, m.home_score, m.away_score]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: m.id,
      home_score: Number(hs),
      away_score: Number(as),
      status: st,
      scheduled_at: when ? new Date(when).toISOString() : null,
    });
  }

  return (
    <tr>
      <td>{m.slot_code}</td>
      <td>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </td>
      <td>
        {m.home_team_id ? teams.find((t) => t.id === m.home_team_id)?.name : "—"} vs{" "}
        {m.away_team_id ? teams.find((t) => t.id === m.away_team_id)?.name : "—"}
      </td>
      <td>
        <input style={{ width: 48 }} value={hs} onChange={(e) => setHs(e.target.value)} /> –{" "}
        <input style={{ width: 48 }} value={as} onChange={(e) => setAs(e.target.value)} />
      </td>
      <td>
        <select value={st} onChange={(e) => setSt(e.target.value as MatchStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusOptionLabel(s)}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button type="button" className="btn" onClick={submit}>
          Save
        </button>
      </td>
    </tr>
  );
}

function QfRow({
  slot,
  match,
  pot1,
  pot2,
  onSave,
}: {
  slot: "QF1" | "QF2" | "QF3" | "QF4";
  match: MatchRow;
  pot1: Database["public"]["Tables"]["teams"]["Row"][];
  pot2: Database["public"]["Tables"]["teams"]["Row"][];
  onSave: (homeId: string, awayId: string) => void;
}) {
  const [h, setH] = useState(match.home_team_id ?? "");
  const [a, setA] = useState(match.away_team_id ?? "");

  useEffect(() => {
    setH(match.home_team_id ?? "");
    setA(match.away_team_id ?? "");
  }, [match.home_team_id, match.away_team_id]);

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 0" }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{slot}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
        <div className="form-row">
          <label>Pot 1 (home)</label>
          <select value={h} onChange={(e) => setH(e.target.value)}>
            <option value="">—</option>
            {pot1.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Gr {t.group_letter})
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Pot 2 (away)</label>
          <select value={a} onChange={(e) => setA(e.target.value)}>
            <option value="">—</option>
            {pot2.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Gr {t.group_letter})
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onSave(h, a)}>
          Save
        </button>
      </div>
    </div>
  );
}

const MANUAL_PLAYER_VALUE = "__manual__";

function LiveEditor({
  match,
  teams,
  players,
  events,
  onSave,
  onAddEvent,
  onDeleteEvent,
}: {
  match: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: PlayerRow[];
  events: MatchEventRow[];
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
  onAddEvent: (row: {
    event_type: MatchEventType;
    team_id?: string | null;
    player_name?: string | null;
  }) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const [hs, setHs] = useState(String(match.home_score));
  const [as, setAs] = useState(String(match.away_score));
  const [evType, setEvType] = useState<MatchEventType>("goal");
  const [side, setSide] = useState<"home" | "away">("home");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [manualName, setManualName] = useState("");

  useEffect(() => {
    setHs(String(match.home_score));
    setAs(String(match.away_score));
    setEvType("goal");
    setSide("home");
    setSelectedPlayerId("");
    setManualName("");
  }, [match.id, match.home_score, match.away_score, match.home_team_id, match.away_team_id]);

  useEffect(() => {
    setSelectedPlayerId("");
    setManualName("");
  }, [evType, side]);

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const teamNameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  function pickTeamId(): string | null {
    return side === "home" ? match.home_team_id : match.away_team_id;
  }

  const roster = useMemo(() => {
    const tid = pickTeamId();
    if (!tid) return [];
    return players.filter((p) => p.team_id === tid).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [players, side, match.home_team_id, match.away_team_id]);

  function submitScore(e: FormEvent) {
    e.preventDefault();
    onSave({ id: match.id, home_score: Number(hs), away_score: Number(as) });
  }

  const needsDetail = TIMELINE_EVENT_OPTIONS.find((o) => o.value === evType)?.needsTeamPlayer ?? false;

  function addTimeline(e: FormEvent) {
    e.preventDefault();
    if (needsDetail) {
      const tid = pickTeamId();
      if (!tid) return;

      let nameOut: string | null = null;
      if (roster.length === 0) {
        if (!manualName.trim()) return;
        nameOut = manualName.trim();
      } else if (selectedPlayerId === MANUAL_PLAYER_VALUE) {
        if (!manualName.trim()) return;
        nameOut = manualName.trim();
      } else if (selectedPlayerId) {
        const pl = roster.find((p) => p.id === selectedPlayerId);
        if (!pl) return;
        nameOut = pl.name;
      } else {
        return;
      }

      onAddEvent({ event_type: evType, team_id: tid, player_name: nameOut });
    } else {
      onAddEvent({ event_type: evType, team_id: null, player_name: null });
    }
    setSelectedPlayerId("");
    setManualName("");
  }

  function setStatus(next: MatchStatus) {
    onSave({ id: match.id, status: next });
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {homeTeam?.name ?? "Home"} vs {awayTeam?.name ?? "Away"}
      </h2>
      <div style={{ marginBottom: 14 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
          Match status
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LIVE_STATUS_STRIP.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.title}
              className={match.status === s.value ? "btn btn-primary" : "btn"}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submitScore} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Score</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input style={{ width: 56 }} value={hs} onChange={(e) => setHs(e.target.value)} />
              <span>–</span>
              <input style={{ width: 56 }} value={as} onChange={(e) => setAs(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Update score
          </button>
        </div>
      </form>

      <h3 style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Timeline</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
        {events.map((ev) => (
          <li
            key={ev.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ flex: 1 }}>{formatTimelineLine(ev, teamNameById)}</span>
            <button type="button" className="btn" onClick={() => onDeleteEvent(ev.id)}>
              Delete
            </button>
          </li>
        ))}
        {events.length === 0 && <li className="muted">No events yet.</li>}
      </ul>

      <div className="form-row">
        <label>Add timeline event</label>
        <form onSubmit={addTimeline} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select value={evType} onChange={(e) => setEvType(e.target.value as MatchEventType)}>
            {TIMELINE_EVENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {needsDetail && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <label>Team</label>
                <select value={side} onChange={(e) => setSide(e.target.value as "home" | "away")}>
                  <option value="home">{homeTeam?.name ?? "Home"}</option>
                  <option value="away">{awayTeam?.name ?? "Away"}</option>
                </select>
              </div>
              {roster.length > 0 ? (
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>Player</label>
                  <select
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
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{roster.length === 0 ? "Player name (no roster)" : "Manual name"}</label>
                  <input
                    placeholder="Player name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <button type="submit" className="btn btn-primary">
            Add event
          </button>
        </form>
      </div>
    </div>
  );
}

function TeamsEditor({
  teams,
  players,
  onAdminNotify,
  refreshTeamsAndPlayers,
}: {
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: Database["public"]["Tables"]["players"]["Row"][];
  onAdminNotify: (msg: string, error?: string | null) => Promise<void>;
  refreshTeamsAndPlayers: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(teams[0]?.id ?? "");
  const [teamEdit, setTeamEdit] = useState({
    name: "",
    letter: "A" as "A" | "B" | "C" | "D",
    order: 1,
    manager1: "",
    manager2: "",
  });

  useEffect(() => {
    if (teams.length === 0) return;
    if (!selected || !teams.some((x) => x.id === selected)) {
      setSelected(teams[0]!.id);
    }
  }, [teams, selected]);

  useEffect(() => {
    const t = teams.find((x) => x.id === selected);
    if (t)
      setTeamEdit({
        name: t.name,
        letter: t.group_letter as "A" | "B" | "C" | "D",
        order: t.group_order,
        manager1: t.manager_1 ?? "",
        manager2: t.manager_2 ?? "",
      });
  }, [selected, teams]);

  const roster = players.filter((p) => p.team_id === selected).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const [name, setName] = useState("");
  const [isGk, setIsGk] = useState(false);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [playerOk, setPlayerOk] = useState<string | null>(null);
  const [teamErr, setTeamErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGk, setEditGk] = useState(false);

  /** Only true when the failure is clearly missing DB columns — avoids false retries that drop GK/managers. */
  function isSchemaOrMissingColumn(error: { message?: string; code?: string } | null) {
    if (!error) return false;
    const c = error.code;
    if (c === "42703" || c === "PGRST204") return true;
    const msg = error.message ?? "";
    const low = msg.toLowerCase();
    if (/is_goalkeeper|manager_1|manager_2/i.test(msg)) return true;
    if (low.includes("schema cache")) return true;
    if ((low.includes("column") || low.includes("field")) && (low.includes("does not exist") || low.includes("unknown")))
      return true;
    return false;
  }

  async function addPlayer(e: FormEvent) {
    e.preventDefault();
    setPlayerErr(null);
    setPlayerOk(null);
    if (!selected || !teams.some((x) => x.id === selected)) {
      const err = !teams.length ? "No teams loaded yet." : "Select a team first.";
      setPlayerErr(err);
      await onAdminNotify("", err);
      return;
    }
    if (!name.trim()) {
      const err = "Enter a player name.";
      setPlayerErr(err);
      return;
    }

    const base = {
      team_id: selected,
      name: name.trim(),
      sort_order: roster.length,
    };

    let { error } = await supabase.from("players").insert({ ...base, is_goalkeeper: isGk });
    if (error && isSchemaOrMissingColumn(error)) {
      const retry = await supabase.from("players").insert(base);
      error = retry.error;
      if (!error && isGk) {
        setPlayerOk("Player added without GK flag — enable is_goalkeeper in Supabase (see migration).");
        setName("");
        setIsGk(false);
        await refreshTeamsAndPlayers();
        await onAdminNotify(
          "Player saved. GK not stored: add is_goalkeeper column (run latest migration).",
          null,
        );
        return;
      }
    }

    if (error) {
      const msg =
        `${error.message}. If this persists, check Supabase RLS policies and that the players table migration is applied.`;
      setPlayerErr(msg);
      await onAdminNotify("", msg);
      return;
    }

    setName("");
    setIsGk(false);
    setPlayerOk("Player added.");
    await refreshTeamsAndPlayers();
    await onAdminNotify("Player added.", null);
  }

  async function updateTeam(e: FormEvent) {
    e.preventDefault();
    const t = teams.find((x) => x.id === selected);
    if (!t) return;
    setTeamErr(null);

    const withManagers = {
      name: teamEdit.name,
      group_letter: teamEdit.letter,
      group_order: teamEdit.order,
      manager_1: teamEdit.manager1.trim() ? teamEdit.manager1.trim() : null,
      manager_2: teamEdit.manager2.trim() ? teamEdit.manager2.trim() : null,
    };

    let { error } = await supabase.from("teams").update(withManagers).eq("id", t.id);
    if (error && isSchemaOrMissingColumn(error)) {
      const { error: e2 } = await supabase
        .from("teams")
        .update({
          name: teamEdit.name,
          group_letter: teamEdit.letter,
          group_order: teamEdit.order,
        })
        .eq("id", t.id);
      error = e2;
      if (!error) {
        await refreshTeamsAndPlayers();
        await onAdminNotify(
          "Team saved without managers — add manager_1/manager_2 columns (run latest migration).",
          null,
        );
        return;
      }
    }

    if (error) {
      const msg = error.message ?? "Could not save team.";
      setTeamErr(msg);
      await onAdminNotify("", msg);
      return;
    }
    await refreshTeamsAndPlayers();
    await onAdminNotify("Team saved.", null);
  }

  async function deletePlayer(playerId: string) {
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) {
      await onAdminNotify("", error.message);
      return;
    }
    await refreshTeamsAndPlayers();
    await onAdminNotify("Player removed.", null);
  }

  async function saveEditedPlayer(original: PlayerRow) {
    setPlayerErr(null);
    setPlayerOk(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setPlayerErr("Name cannot be empty.");
      return;
    }

    let { error } = await supabase
      .from("players")
      .update({ name: trimmed, is_goalkeeper: editGk })
      .eq("id", original.id);

    let gkDropped = false;
    if (error && isSchemaOrMissingColumn(error)) {
      const r2 = await supabase.from("players").update({ name: trimmed }).eq("id", original.id);
      error = r2.error;
      if (!error && editGk) gkDropped = true;
    }

    if (error) {
      setPlayerErr(error.message);
      await onAdminNotify("", error.message);
      return;
    }
    setEditingId(null);
    await refreshTeamsAndPlayers();
    if (gkDropped) {
      await onAdminNotify(
        "",
        "Name saved; GK flag skipped — add players.is_goalkeeper column (run latest migration).",
      );
    } else {
      await onAdminNotify("Player updated.", null);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Teams & players
      </h2>
      <div className="form-row">
        <label>Team</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (Group {t.group_letter})
            </option>
          ))}
        </select>
      </div>

      {teamErr && (
        <div className="alert warn" style={{ marginTop: 12 }}>
          {teamErr}
        </div>
      )}

      {selected && (
        <div className="teams-editor-split">
          <form onSubmit={updateTeam} className="teams-editor-panel">
            <div className="admin-subhead">Team details</div>
            <div className="grid-2 teams-editor-fields">
              <div className="form-row">
                <label>Team name</label>
                <input
                  value={teamEdit.name}
                  onChange={(e) => setTeamEdit((o) => ({ ...o, name: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label>Group</label>
                <select
                  value={teamEdit.letter}
                  onChange={(e) => setTeamEdit((o) => ({ ...o, letter: e.target.value as "A" | "B" | "C" | "D" }))}
                >
                  {(["A", "B", "C", "D"] as const).map((L) => (
                    <option key={L} value={L}>
                      {L}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row teams-editor-span-2">
                <label>Order in group (1–3)</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={teamEdit.order}
                  onChange={(e) => setTeamEdit((o) => ({ ...o, order: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="admin-subhead" style={{ marginTop: 16 }}>
              Managers / Coaches
            </div>
            <div className="grid-2 teams-editor-fields">
              <div className="form-row">
                <label>Manager 1</label>
                <input
                  value={teamEdit.manager1}
                  onChange={(e) => setTeamEdit((o) => ({ ...o, manager1: e.target.value }))}
                  placeholder="Manager / Coach name"
                />
              </div>
              <div className="form-row">
                <label>Manager 2</label>
                <input
                  value={teamEdit.manager2}
                  onChange={(e) => setTeamEdit((o) => ({ ...o, manager2: e.target.value }))}
                  placeholder="Manager / Coach name"
                />
              </div>
            </div>

            <button type="submit" className="btn teams-editor-save" style={{ marginTop: 12 }}>
              Save team
            </button>
          </form>

          <div className="teams-editor-panel teams-editor-panel--players">
            <div className="admin-subhead">Players</div>
            {playerErr && <div className="alert warn">{playerErr}</div>}
            {playerOk && <div className="alert">{playerOk}</div>}
            <form onSubmit={addPlayer}>
              <div className="form-row">
                <label>New player</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
              </div>
              <label className="check-row">
                <input type="checkbox" checked={isGk} onChange={(e) => setIsGk(e.target.checked)} />
                <span>Goalkeeper (GK)</span>
              </label>
              <button type="submit" className="btn btn-primary teams-editor-add-player">
                Add player
              </button>
            </form>

            <ul className="admin-player-list">
              {roster.map((p) => {
                const gk = p.is_goalkeeper === true;
                return (
                  <li key={p.id} className={gk ? "admin-player-row admin-player-row--gk" : "admin-player-row"}>
                    {editingId === p.id ? (
                      <div className="admin-player-edit">
                        <div className="form-row" style={{ marginBottom: 0 }}>
                          <label>Name</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <label className="check-row" style={{ marginTop: 8 }}>
                          <input type="checkbox" checked={editGk} onChange={(e) => setEditGk(e.target.checked)} />
                          <span>Goalkeeper (GK)</span>
                        </label>
                        <div className="admin-player-edit-actions">
                          <button type="button" className="btn btn-primary" onClick={() => void saveEditedPlayer(p)}>
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setEditingId(null);
                              setPlayerErr(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="admin-player-name">
                          {gk && <span className="gk-badge">GK</span>}
                          {p.name}
                        </span>
                        <div className="admin-player-actions">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setEditingId(p.id);
                              setEditName(p.name);
                              setEditGk(gk);
                              setPlayerErr(null);
                              setPlayerOk(null);
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn" onClick={() => void deletePlayer(p.id)}>
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
