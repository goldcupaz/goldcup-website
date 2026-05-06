import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import type { Database } from "../lib/database.types";
import { statusLabel } from "../lib/format";
import { sortMatchesForAdminPicker } from "../lib/matchSort";
import { qualifiedPot } from "../lib/pots";
import { supabase } from "../lib/supabase";
import { finalComputed, getBySlot, thirdComputed } from "../lib/knockoutResolve";
import { winnerId } from "../lib/bracket";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type MatchStatus = Database["public"]["Tables"]["matches"]["Row"]["status"];

const STATUSES: MatchStatus[] = ["not_started", "live", "half_time", "full_time"];

export function AdminPage() {
  const { session, isAdmin, loading: authLoading, signOut } = useAuth();
  const { teams, matches, goals, players, currentLiveMatchId, refresh } = useTournament();
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

  async function addGoal(matchId: string, teamId: string, scorerName: string) {
    const { error } = await supabase.from("match_goals").insert({
      match_id: matchId,
      team_id: teamId,
      scorer_name: scorerName.trim(),
    });
    if (error) await notify("", error.message);
    else await notify("Goal added.");
  }

  async function deleteGoal(goalId: string) {
    const { error } = await supabase.from("match_goals").delete().eq("id", goalId);
    if (error) await notify("", error.message);
    else await notify("Goal removed.");
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
              goals={goals.filter((g) => g.match_id === liveMatch.id)}
              onSave={(p) => void saveMatch(p)}
              onAddGoal={(teamId, name) => void addGoal(liveMatch.id, teamId, name)}
              onDeleteGoal={(id) => void deleteGoal(id)}
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

      {tab === "teams" && <TeamsEditor teams={teams} players={players} refresh={refresh} />}

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
              {statusLabel(s)}
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
              {statusLabel(s)}
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

function LiveEditor({
  match,
  teams,
  goals,
  onSave,
  onAddGoal,
  onDeleteGoal,
}: {
  match: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  goals: Database["public"]["Tables"]["match_goals"]["Row"][];
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
  onAddGoal: (teamId: string, name: string) => void;
  onDeleteGoal: (id: string) => void;
}) {
  const [st, setSt] = useState<MatchStatus>(match.status);
  const [hs, setHs] = useState(String(match.home_score));
  const [as, setAs] = useState(String(match.away_score));
  const [scorer, setScorer] = useState("");
  const [side, setSide] = useState<"home" | "away">("home");

  useEffect(() => {
    setSt(match.status);
    setHs(String(match.home_score));
    setAs(String(match.away_score));
    setScorer("");
    setSide("home");
  }, [match.id, match.status, match.home_score, match.away_score, match.home_team_id, match.away_team_id]);

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);

  function submitScore(e: FormEvent) {
    e.preventDefault();
    onSave({ id: match.id, status: st, home_score: Number(hs), away_score: Number(as) });
  }

  function add(e: FormEvent) {
    e.preventDefault();
    const tid =
      side === "home" ? match.home_team_id : match.away_team_id;
    if (!tid || !scorer.trim()) return;
    onAddGoal(tid, scorer.trim());
    setScorer("");
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {homeTeam?.name ?? "Home"} vs {awayTeam?.name ?? "Away"}
      </h2>
      <form onSubmit={submitScore} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={st} onChange={(e) => setSt(e.target.value as MatchStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Score</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input style={{ width: 56 }} value={hs} onChange={(e) => setHs(e.target.value)} />
              <span>–</span>
              <input style={{ width: 56 }} value={as} onChange={(e) => setAs(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Update score / status
          </button>
        </div>
      </form>

      <div className="form-row">
        <label>Add goal scorer</label>
        <form onSubmit={add} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end" }}>
          <select value={side} onChange={(e) => setSide(e.target.value as "home" | "away")}>
            <option value="home">{homeTeam?.name ?? "Home"}</option>
            <option value="away">{awayTeam?.name ?? "Away"}</option>
          </select>
          <input placeholder="Player name" value={scorer} onChange={(e) => setScorer(e.target.value)} />
          <button type="submit" className="btn">
            Add
          </button>
        </form>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {goals.map((g) => (
          <li key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>
              <strong>{teams.find((t) => t.id === g.team_id)?.name}</strong> — {g.scorer_name}
            </span>
            <button type="button" className="btn" onClick={() => onDeleteGoal(g.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamsEditor({
  teams,
  players,
  refresh,
}: {
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: Database["public"]["Tables"]["players"]["Row"][];
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(teams[0]?.id ?? "");
  const [teamEdit, setTeamEdit] = useState({
    name: "",
    letter: "A" as "A" | "B" | "C" | "D",
    order: 1,
  });

  useEffect(() => {
    const t = teams.find((x) => x.id === selected);
    if (t)
      setTeamEdit({
        name: t.name,
        letter: t.group_letter as "A" | "B" | "C" | "D",
        order: t.group_order,
      });
  }, [selected, teams]);

  const roster = players.filter((p) => p.team_id === selected);
  const [name, setName] = useState("");

  async function addPlayer(e: FormEvent) {
    e.preventDefault();
    if (!selected || !name.trim()) return;
    const { error } = await supabase.from("players").insert({
      team_id: selected,
      name: name.trim(),
      sort_order: roster.length,
    });
    if (!error) {
      setName("");
      void refresh();
    }
  }

  async function updateTeam(e: FormEvent) {
    e.preventDefault();
    const t = teams.find((x) => x.id === selected);
    if (!t) return;
    const { error } = await supabase
      .from("teams")
      .update({
        name: teamEdit.name,
        group_letter: teamEdit.letter,
        group_order: teamEdit.order,
      })
      .eq("id", t.id);
    if (!error) void refresh();
  }

  async function deletePlayer(playerId: string) {
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) {
      console.error(error);
      return;
    }
    void refresh();
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

      {selected && (
        <form onSubmit={updateTeam} style={{ marginBottom: 20 }}>
          <div className="grid-2">
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
            <div className="form-row">
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
          <button type="submit" className="btn">
            Save team
          </button>
        </form>
      )}

      <form onSubmit={addPlayer}>
        <div className="form-row">
          <label>New player</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        </div>
        <button type="submit" className="btn btn-primary">
          Add player
        </button>
      </form>

      <ul className="admin-player-list">
        {roster.map((p) => (
          <li key={p.id} className="admin-player-row">
            <span>{p.name}</span>
            <button
              type="button"
              className="btn"
              onClick={() => void deletePlayer(p.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
