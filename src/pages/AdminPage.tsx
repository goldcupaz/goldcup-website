import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import type { Database, MatchEventType } from "../lib/database.types";
import { isoToDatetimeLocalValue, statusOptionLabel } from "../lib/format";
import { AdminMatchEventModal, type MatchEventEditPayload } from "../components/AdminMatchEventModal";
import { MatchEventTeamPlayerFields } from "../components/MatchEventTeamPlayerFields";
import { eventNeedsTeamPlayer, resolveEventPlayerPayload } from "../lib/matchEventForm";
import { AdminAnalytics } from "../components/AdminAnalytics";
import { AdminStandingsAdjustments } from "../components/AdminStandingsAdjustments";
import { PeopleCounterWidget } from "../components/PeopleCounterWidget";
import { VolunteerTeamCheck } from "../components/VolunteerTeamCheck";
import { PenaltyShootoutAdmin } from "../components/PenaltyShootoutAdmin";
import { computeScoresFromScoringEvents } from "../lib/matchEventScores";
import {
  filterMainTimelineEvents,
  filterPenaltyShootoutEvents,
  isPenaltyShootoutEventType,
} from "../lib/matchEventPenalties";
import { TIMELINE_EVENT_OPTIONS } from "../lib/matchEventTimelineOptions";
import { formatTimelineLine, sortMatchEvents } from "../lib/timeline";
import { sortMatchesForAdminPicker } from "../lib/matchSort";
import {
  QUARTER_FINALS,
  QF_BY_SLOT,
  SEMI_FINALS,
  SF_BY_SLOT,
  qfAdminFixtureLabel,
  qfScheduledAtIso,
  qfTeamIdsForSlot,
  sfAdminFixtureLabel,
  sfScheduledAtIso,
  sfTimeWindow,
  sfTeamIdsForSlot,
  finalAdminFixtureLabel,
  finalScheduledAtIso,
  finalTeamIds,
  THIRD_PLACE_FIXTURE,
  FINAL_FIXTURE,
  thirdPlaceAdminFixtureLabel,
  thirdPlaceScheduledAtIso,
  thirdPlaceTeamIds,
  type QfSlot,
  type SfSlot,
} from "../lib/knockoutBracket";
import { matchRoundLabel } from "../lib/matchRoundLabels";
import { parseOptionalPenaltyField } from "../lib/matchScoreDisplay";
import { TeamNameWithQualification } from "../components/TeamNameWithQualification";
import { SF_QUALIFIED_STAR_TEAM_ID } from "../lib/knockoutBracket";
import { koMatchNeedsTeamPersist, resolveMatchTeamIds, resolveTeamName } from "../lib/matchTeamNames";
import { AdminMatchScoreInputs } from "../components/AdminMatchScoreInputs";
import { supabase } from "../lib/supabase";
import { getBySlot } from "../lib/knockoutResolve";
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

export function AdminPage() {
  const { session, isAdmin, loading: authLoading, signOut } = useAuth();
  const { teams, matches, matchEvents, players, currentLiveMatchId, refresh, refreshTeamsAndPlayers } =
    useTournament();
  const [tab, setTab] = useState<
    "live" | "matches" | "qf" | "teams" | "standingsAdj" | "volunteer" | "bracket" | "analytics"
  >("live");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const matchesForLivePick = useMemo(() => sortMatchesForAdminPicker(matches), [matches]);

  const nameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

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
  const qfMatches = matches.filter((m) => m.stage === "qf").sort((a, b) => a.sort_order - b.sort_order);
  const sfMatches = matches.filter((m) => m.stage === "sf").sort((a, b) => a.sort_order - b.sort_order);
  const finalMatches = matches.filter((m) => m.stage === "final").sort((a, b) => a.sort_order - b.sort_order);
  const thirdMatches = matches.filter((m) => m.stage === "third").sort((a, b) => a.sort_order - b.sort_order);

  async function notify(msgText: string, error?: string | null) {
    setMsg(msgText);
    setErr(error ?? null);
    await refresh();
  }

  /** Set which match is featured on the Live tab. */
  async function setLiveMatch(matchId: string | null) {
    if (matchId) {
      const picked = matches.find((m) => m.id === matchId);
      if (picked && koMatchNeedsTeamPersist(picked)) {
        const { homeTeamId, awayTeamId } = resolveMatchTeamIds(picked);
        const { error: te } = await supabase
          .from("matches")
          .update({ home_team_id: homeTeamId, away_team_id: awayTeamId })
          .eq("id", picked.id);
        if (te) {
          await notify("", te.message);
          return;
        }
      }
    }
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

  async function applySemifinalFixtures() {
    let ok = 0;
    for (const def of SEMI_FINALS) {
      const m = getBySlot(matches, def.slot);
      if (!m) continue;
      const { homeTeamId, awayTeamId } = sfTeamIdsForSlot(def.slot);
      const { error } = await supabase
        .from("matches")
        .update({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          scheduled_at: sfScheduledAtIso(def.slot),
          sort_order: 199 + ok,
        })
        .eq("id", m.id);
      if (error) {
        await notify("", `SF ${def.slot}: ${error.message}`);
        return;
      }
      ok += 1;
    }
    await notify(ok ? `Semi-finals updated (${ok} matches).` : "No semi-final rows found in database.");
  }

  async function applyFinalFixture() {
    const m = matches.find((x) => x.stage === "final" && x.slot_code === FINAL_FIXTURE.slot);
    if (!m) {
      await notify("No final row found in database.");
      return;
    }
    const { homeTeamId, awayTeamId } = finalTeamIds();
    const { error } = await supabase
      .from("matches")
      .update({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        scheduled_at: finalScheduledAtIso(),
        sort_order: 300,
      })
      .eq("id", m.id);
    if (error) {
      await notify("", error.message);
      return;
    }
    await notify("Final updated (MTK Eagles vs Sambo FC).");
  }

  async function applyThirdPlaceFixture() {
    const m = matches.find((x) => x.stage === "third" && x.slot_code === THIRD_PLACE_FIXTURE.slot);
    if (!m) {
      await notify("No third place row found in database.");
      return;
    }
    const { homeTeamId, awayTeamId } = thirdPlaceTeamIds();
    const { error } = await supabase
      .from("matches")
      .update({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        scheduled_at: thirdPlaceScheduledAtIso(),
        sort_order: 299,
      })
      .eq("id", m.id);
    if (error) {
      await notify("", error.message);
      return;
    }
    await notify("Third place match updated (Ebra FC vs EAS Saints).");
  }

  async function applyMatchday6Fixtures() {
    const third = matches.find((x) => x.stage === "third" && x.slot_code === THIRD_PLACE_FIXTURE.slot);
    const fin = matches.find((x) => x.stage === "final" && x.slot_code === FINAL_FIXTURE.slot);
    if (!third || !fin) {
      await notify("Missing final or third place row in database.");
      return;
    }
    const tIds = thirdPlaceTeamIds();
    const { error: e1 } = await supabase
      .from("matches")
      .update({
        home_team_id: tIds.homeTeamId,
        away_team_id: tIds.awayTeamId,
        scheduled_at: thirdPlaceScheduledAtIso(),
        sort_order: 299,
      })
      .eq("id", third.id);
    if (e1) {
      await notify("", e1.message);
      return;
    }
    const fIds = finalTeamIds();
    const { error: e2 } = await supabase
      .from("matches")
      .update({
        home_team_id: fIds.homeTeamId,
        away_team_id: fIds.awayTeamId,
        scheduled_at: finalScheduledAtIso(),
        sort_order: 300,
      })
      .eq("id", fin.id);
    if (e2) {
      await notify("", e2.message);
      return;
    }
    await notify("Matchday 6 updated: Final (MTK vs Sambo) and Third Place (Ebra vs EAS Saints).");
  }

  async function applyQuarterfinalFixtures() {
    let ok = 0;
    for (const def of QUARTER_FINALS) {
      const m = getBySlot(matches, def.slot);
      if (!m) continue;
      const { homeTeamId, awayTeamId } = qfTeamIdsForSlot(def.slot);
      const { error } = await supabase
        .from("matches")
        .update({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          scheduled_at: qfScheduledAtIso(def.slot),
          sort_order: 99 + def.order,
        })
        .eq("id", m.id);
      if (error) {
        await notify("", `QF ${def.slot}: ${error.message}`);
        return;
      }
      ok += 1;
    }
    await notify(ok ? `Quarter-finals updated (${ok} matches).` : "No quarter-final rows found in database.");
  }

  /** Recompute match score from goal + own_goal events (client logic; own_goal credits opponent). */
  async function syncMatchScoreToTimeline(matchId: string): Promise<string | null> {
    const { data: m, error: e1 } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id")
      .eq("id", matchId)
      .maybeSingle();
    if (e1) return `Score sync: ${e1.message}`;
    const { homeTeamId, awayTeamId } = resolveMatchTeamIds(m);
    if (!homeTeamId || !awayTeamId) return null;

    const { data: evs, error: e2 } = await supabase
      .from("match_events")
      .select("event_type, team_id")
      .eq("match_id", matchId);
    if (e2) return `Score sync: ${e2.message}`;

    const { home, away } = computeScoresFromScoringEvents(
      homeTeamId,
      awayTeamId,
      (evs ?? []) as { event_type: MatchEventType; team_id: string | null }[],
    );
    const { error: e3 } = await supabase.from("matches").update({ home_score: home, away_score: away }).eq("id", matchId);
    if (e3) return `Score sync: ${e3.message}`;
    return null;
  }

  async function addMatchEvent(
    matchId: string,
    row: {
      event_type: MatchEventType;
      team_id?: string | null;
      player_name?: string | null;
      event_minute?: number | null;
      event_note?: string | null;
    },
  ) {
    const existing = matchEvents.filter((e) => e.match_id === matchId);
    const nextOrder = existing.length === 0 ? 0 : Math.max(...existing.map((e) => e.event_order)) + 1;
    const basePayload = {
      match_id: matchId,
      event_type: row.event_type,
      team_id: row.team_id ?? null,
      player_name: row.player_name?.trim() ? row.player_name.trim() : null,
      event_order: nextOrder,
    };
    const fullPayload = {
      ...basePayload,
      event_minute: row.event_minute ?? null,
      event_note: row.event_note?.trim() ? row.event_note.trim() : null,
    };

    let { error } = await supabase.from("match_events").insert(fullPayload);
    if (error) {
      const hint = (error.message ?? "").toLowerCase();
      if (
        hint.includes("column") ||
        hint.includes("schema") ||
        hint.includes("event_minute") ||
        hint.includes("event_note") ||
        hint.includes("does not exist")
      ) {
        ({ error } = await supabase.from("match_events").insert(basePayload));
      }
    }
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (row.event_type === "own_goal" && (msg.includes("check") || msg.includes("constraint"))) {
        await notify(
          "",
          "Could not save Own Goal. Run migration supabase/migrations/20260509120000_match_events_own_goal.sql in Supabase.",
        );
      } else {
        await notify("", error.message);
      }
      return;
    }
    if (!isPenaltyShootoutEventType(row.event_type)) {
      const syncErr = await syncMatchScoreToTimeline(matchId);
      if (syncErr) {
        await notify("Timeline event added.", syncErr);
        return;
      }
    }
    await notify(isPenaltyShootoutEventType(row.event_type) ? "Penalty kick added." : "Timeline event added.");
  }

  async function updateMatchEvent(eventId: string, matchId: string, patch: MatchEventEditPayload) {
    const ev = matchEvents.find((e) => e.id === eventId);
    let { data, error } = await supabase.from("match_events").update(patch).eq("id", eventId).select("id").maybeSingle();
    if (error) {
      const hint = (error.message ?? "").toLowerCase();
      if (
        hint.includes("column") ||
        hint.includes("schema") ||
        hint.includes("event_minute") ||
        hint.includes("event_note") ||
        hint.includes("does not exist")
      ) {
        const { event_minute: _em, event_note: _en, ...rest } = patch;
        ({ data, error } = await supabase.from("match_events").update(rest).eq("id", eventId).select("id").maybeSingle());
      }
    }
    if (error) {
      await notify("", error.message);
      return;
    }
    if (!data) {
      await notify("", "Event update failed (no row returned).");
      return;
    }
    const wasPenalty = ev && isPenaltyShootoutEventType(ev.event_type);
    const isPenalty = isPenaltyShootoutEventType(patch.event_type);
    if (!wasPenalty && !isPenalty) {
      const syncErr = await syncMatchScoreToTimeline(matchId);
      if (syncErr) {
        await notify("Timeline event updated.", syncErr);
        return;
      }
    }
    await notify(wasPenalty || isPenalty ? "Penalty kick updated." : "Timeline event updated.");
  }

  async function deleteMatchEvent(eventId: string) {
    const ev = matchEvents.find((e) => e.id === eventId);
    const mid = ev?.match_id;
    const { error } = await supabase.from("match_events").delete().eq("id", eventId);
    if (error) {
      await notify("", error.message);
      return;
    }
    if (mid && ev && !isPenaltyShootoutEventType(ev.event_type)) {
      const syncErr = await syncMatchScoreToTimeline(mid);
      if (syncErr) {
        await notify("Timeline event removed.", syncErr);
        return;
      }
    }
    await notify(ev && isPenaltyShootoutEventType(ev.event_type) ? "Penalty kick removed." : "Timeline event removed.");
  }

  async function syncBracket() {
    const qf1 = getBySlot(matches, "QF1");
    const qf2 = getBySlot(matches, "QF2");
    const qf3 = getBySlot(matches, "QF3");
    const qf4 = getBySlot(matches, "QF4");
    const sf1 = getBySlot(matches, "SF1");
    const sf2 = getBySlot(matches, "SF2");
    if (!sf1 || !sf2) return;

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

    await notify(
      "Bracket synced: semi-final slots updated from quarter-finals. Use “Apply Matchday 6 fixtures” for final and third place teams.",
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
            ["qf", "QF bracket"],
            ["teams", "Teams & players"],
            ["standingsAdj", "Standings Adjustments"],
            ["volunteer", "Volunteer Portal"],
            ["bracket", "Sync bracket"],
            ["analytics", "Analytics"],
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
                  const hn = resolveTeamName(m, "home", nameById);
                  const an = resolveTeamName(m, "away", nameById);
                  const qfSlot = m.stage === "qf" && m.slot_code && m.slot_code in QF_BY_SLOT ? (m.slot_code as QfSlot) : null;
                  const sfSlot = m.stage === "sf" && m.slot_code && m.slot_code in SF_BY_SLOT ? (m.slot_code as SfSlot) : null;
                  const optionLabel = qfSlot
                    ? qfAdminFixtureLabel(qfSlot)
                    : sfSlot
                      ? sfAdminFixtureLabel(sfSlot)
                      : m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot
                        ? finalAdminFixtureLabel()
                        : m.stage === "third" && m.slot_code === THIRD_PLACE_FIXTURE.slot
                          ? thirdPlaceAdminFixtureLabel()
                          : (() => {
                        const stageTag =
                          m.stage === "group"
                            ? `Group ${m.group_letter ?? "?"}`
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
                        return `[${stageTag}] ${when} · ${label} · ${hn} vs ${an}`;
                      })();
                  return (
                    <option key={m.id} value={m.id}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {liveMatch && (() => {
            const allEv = sortMatchEvents(matchEvents.filter((e) => e.match_id === liveMatch.id));
            return (
              <LiveEditor
                key={liveMatch.id}
                match={liveMatch}
                teams={teams}
                players={players}
                mainEvents={filterMainTimelineEvents(allEv)}
                penaltyEvents={filterPenaltyShootoutEvents(allEv)}
                onSave={(p) => void saveMatch(p)}
                onAddEvent={(row) => void addMatchEvent(liveMatch.id, row)}
                onAddPenalty={(row) =>
                  void addMatchEvent(liveMatch.id, {
                    event_type: row.event_type,
                    team_id: row.team_id,
                    player_name: row.player_name,
                  })
                }
                onUpdateEvent={(eventId, patch) => updateMatchEvent(eventId, liveMatch.id, patch)}
                onDeleteEvent={(id) => void deleteMatchEvent(id)}
              />
            );
          })()}
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
            Quarter-finals · May 24
          </h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
            Fixed bracket. If teams show as TBD, click <strong>Apply QF fixtures</strong> on the QF bracket tab (or run the
            Supabase patch).
          </p>
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
                {qfMatches.map((m) => (
                  <KoMatchRow key={m.id} m={m} teams={teams} nameById={nameById} onSave={(p) => void saveMatch(p)} />
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 24, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Matchday 5 — Semi-finals
          </h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
            SF1 MTK Eagles vs EAS Saints · SF2 Sambo FC vs Ebra FC. Penalty fields optional (e.g. 2–2 (4–3 pens)).
          </p>
          <button
            type="button"
            className="btn"
            style={{ marginBottom: 10 }}
            onClick={() => void applySemifinalFixtures()}
          >
            Apply SF fixtures to database
          </button>
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
                {sfMatches.map((m) => (
                  <KoMatchRow key={m.id} m={m} teams={teams} nameById={nameById} onSave={(p) => void saveMatch(p)} />
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 24, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Matchday 6 — Finals
          </h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
            Third Place: Ebra FC vs EAS Saints · Final: MTK Eagles vs Sambo FC. Penalty shootout kicks on the Live tab.
          </p>
          <button
            type="button"
            className="btn"
            style={{ marginBottom: 10 }}
            onClick={() => void applyMatchday6Fixtures()}
          >
            Apply Matchday 6 fixtures to database
          </button>
          {[...finalMatches, ...thirdMatches]
            .sort((a, b) => {
              if (a.stage === "final" && b.stage === "third") return -1;
              if (a.stage === "third" && b.stage === "final") return 1;
              return a.sort_order - b.sort_order;
            })
            .map((m) => (
              <div key={m.id} style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  {matchRoundLabel(m)}
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>When / venue</th>
                        <th>Match-up</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      <KoMatchRow m={m} teams={teams} nameById={nameById} onSave={(p) => void saveMatch(p)} showVenue />
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </section>
      )}

      {tab === "qf" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Quarter-finals (fixed) · May 24
          </h2>
          <p className="muted">
            Bracket is set — no draw. Scores and status are edited below or under <strong>Fixtures &amp; results</strong>.
            After QFs finish, use <strong>Sync bracket</strong> for semi-finals and finals.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginBottom: 14 }}
            onClick={() => void applyQuarterfinalFixtures()}
          >
            Apply QF fixtures to database
          </button>
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
                {qfMatches.map((m) => (
                  <KoMatchRow key={m.id} m={m} teams={teams} nameById={nameById} onSave={(p) => void saveMatch(p)} />
                ))}
              </tbody>
            </table>
          </div>
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

      {tab === "standingsAdj" && (
        <AdminStandingsAdjustments teams={teams} matches={matches} onRefresh={refreshTeamsAndPlayers} />
      )}

      {tab === "analytics" && <AdminAnalytics />}

      {tab === "volunteer" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Volunteer Portal
          </h2>
          <p className="muted">
            Per–matchday entrance counts and roster checks — same tools as the public <Link to="/volunteer">Volunteer Portal</Link>.
          </p>
          <h3 className="admin-volunteer-subtitle">People counter</h3>
          <PeopleCounterWidget />
          <h3 className="admin-volunteer-subtitle" style={{ marginTop: 24 }}>
            Team / player verification
          </h3>
          <VolunteerTeamCheck />
        </section>
      )}

      {tab === "bracket" && (
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Sync semi-finals & finals
          </h2>
          <p className="muted">
            After quarter-finals are final, press to copy winners into SF1 (QF1 + QF3) and SF2 (QF2 + QF4). After both
            semi-finals are final, Final and 3rd place teams are filled automatically.
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
  nameById,
  onSave,
  showVenue = false,
}: {
  m: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  nameById: Map<string, string>;
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
  showVenue?: boolean;
}) {
  const qfSlot = m.stage === "qf" && m.slot_code && m.slot_code in QF_BY_SLOT ? (m.slot_code as QfSlot) : null;
  const sfSlot = m.stage === "sf" && m.slot_code && m.slot_code in SF_BY_SLOT ? (m.slot_code as SfSlot) : null;
  const finalSlot = m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot;
  const thirdSlot = m.stage === "third" && m.slot_code === THIRD_PLACE_FIXTURE.slot;
  const bracketIds = qfSlot
    ? qfTeamIdsForSlot(qfSlot)
    : sfSlot
      ? sfTeamIdsForSlot(sfSlot)
      : finalSlot
        ? finalTeamIds()
        : thirdSlot
          ? thirdPlaceTeamIds()
          : null;
  const editableTeams = m.stage === "qf" || m.stage === "sf" || m.stage === "final" || m.stage === "third";

  const [hs, setHs] = useState(String(m.home_score));
  const [as, setAs] = useState(String(m.away_score));
  const [hp, setHp] = useState(m.home_penalties != null ? String(m.home_penalties) : "");
  const [ap, setAp] = useState(m.away_penalties != null ? String(m.away_penalties) : "");
  const [st, setSt] = useState<MatchStatus>(m.status);
  const [homeId, setHomeId] = useState(m.home_team_id ?? bracketIds?.homeTeamId ?? "");
  const [awayId, setAwayId] = useState(m.away_team_id ?? bracketIds?.awayTeamId ?? "");
  const [venue, setVenue] = useState(m.venue ?? "");
  const [when, setWhen] = useState(() => {
    if (m.scheduled_at) return isoToDatetimeLocalValue(m.scheduled_at);
    if (qfSlot) return isoToDatetimeLocalValue(qfScheduledAtIso(qfSlot));
    if (sfSlot) return isoToDatetimeLocalValue(sfScheduledAtIso(sfSlot));
    if (finalSlot) return isoToDatetimeLocalValue(finalScheduledAtIso());
    if (thirdSlot) return isoToDatetimeLocalValue(thirdPlaceScheduledAtIso());
    return "";
  });

  useEffect(() => {
    setSt(m.status);
    setHs(String(m.home_score));
    setAs(String(m.away_score));
    setHp(m.home_penalties != null ? String(m.home_penalties) : "");
    setAp(m.away_penalties != null ? String(m.away_penalties) : "");
    setHomeId(m.home_team_id ?? bracketIds?.homeTeamId ?? "");
    setAwayId(m.away_team_id ?? bracketIds?.awayTeamId ?? "");
    setVenue(m.venue ?? "");
    if (m.scheduled_at) setWhen(isoToDatetimeLocalValue(m.scheduled_at));
    else if (qfSlot) setWhen(isoToDatetimeLocalValue(qfScheduledAtIso(qfSlot)));
    else if (sfSlot) setWhen(isoToDatetimeLocalValue(sfScheduledAtIso(sfSlot)));
    else if (finalSlot) setWhen(isoToDatetimeLocalValue(finalScheduledAtIso()));
    else if (thirdSlot) setWhen(isoToDatetimeLocalValue(thirdPlaceScheduledAtIso()));
  }, [
    m.id,
    m.status,
    m.home_score,
    m.away_score,
    m.home_penalties,
    m.away_penalties,
    m.home_team_id,
    m.away_team_id,
    m.scheduled_at,
    m.venue,
    qfSlot,
    sfSlot,
    finalSlot,
    thirdSlot,
    bracketIds?.homeTeamId,
    bracketIds?.awayTeamId,
  ]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: m.id,
      home_team_id: homeId || null,
      away_team_id: awayId || null,
      home_score: Number(hs),
      away_score: Number(as),
      home_penalties: parseOptionalPenaltyField(hp),
      away_penalties: parseOptionalPenaltyField(ap),
      status: st,
      scheduled_at: when ? new Date(when).toISOString() : null,
      ...(showVenue ? { venue: venue.trim() ? venue.trim() : null } : {}),
    });
  }

  const matchdayLabel =
    qfSlot ? "Matchday 4" : sfSlot ? "Matchday 5" : finalSlot || thirdSlot ? "Matchday 6" : null;

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 700 }}>{matchRoundLabel(m)}</div>
        {matchdayLabel && <div className="muted" style={{ fontSize: 10 }}>{matchdayLabel}</div>}
      </td>
      <td>
        {qfSlot || sfSlot ? (
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <div className="muted">{qfSlot ? QF_BY_SLOT[qfSlot].timeWindow : sfTimeWindow(sfSlot!)}</div>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              style={{ marginTop: 6, maxWidth: "100%" }}
            />
          </div>
        ) : finalSlot || thirdSlot ? (
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <div className="muted">{finalSlot ? FINAL_FIXTURE.timeWindow : THIRD_PLACE_FIXTURE.timeWindow}</div>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              style={{ marginTop: 6, maxWidth: "100%" }}
            />
            {showVenue && (
              <input
                type="text"
                placeholder="Venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                style={{ marginTop: 6, maxWidth: "100%" }}
              />
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            {showVenue && (
              <input
                type="text"
                placeholder="Venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                style={{ maxWidth: "100%" }}
              />
            )}
          </div>
        )}
      </td>
      <td>
        {editableTeams ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
            <select className="select" value={homeId} onChange={(e) => setHomeId(e.target.value)}>
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {m.stage === "sf" && t.id === SF_QUALIFIED_STAR_TEAM_ID ? " ★" : ""}
                </option>
              ))}
            </select>
            <span className="muted" style={{ fontSize: 11, textAlign: "center" }}>
              vs
            </span>
            <select className="select" value={awayId} onChange={(e) => setAwayId(e.target.value)}>
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {m.stage === "sf" && t.id === SF_QUALIFIED_STAR_TEAM_ID ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <TeamNameWithQualification match={m} side="home" nameById={nameById} /> vs{" "}
            <TeamNameWithQualification match={m} side="away" nameById={nameById} />
          </>
        )}
      </td>
      <td>
        <AdminMatchScoreInputs
          homeScore={hs}
          awayScore={as}
          homePenalties={hp}
          awayPenalties={ap}
          onHomeScore={setHs}
          onAwayScore={setAs}
          onHomePenalties={setHp}
          onAwayPenalties={setAp}
          showPenalties={m.stage === "sf" || m.stage === "qf" || m.stage === "final" || m.stage === "third"}
          compact
        />
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

function LiveEditor({
  match,
  teams,
  players,
  mainEvents,
  penaltyEvents,
  onSave,
  onAddEvent,
  onAddPenalty,
  onUpdateEvent,
  onDeleteEvent,
}: {
  match: MatchRow;
  teams: Database["public"]["Tables"]["teams"]["Row"][];
  players: PlayerRow[];
  mainEvents: MatchEventRow[];
  penaltyEvents: MatchEventRow[];
  onSave: (p: Partial<MatchRow> & { id: string }) => void;
  onAddEvent: (row: {
    event_type: MatchEventType;
    team_id?: string | null;
    player_name?: string | null;
    event_minute?: number | null;
    event_note?: string | null;
  }) => void;
  onAddPenalty: (row: { event_type: MatchEventType; team_id: string; player_name: string }) => void;
  onUpdateEvent: (eventId: string, patch: MatchEventEditPayload) => void | Promise<void>;
  onDeleteEvent: (id: string) => void | Promise<void>;
}) {
  const [hs, setHs] = useState(String(match.home_score));
  const [as, setAs] = useState(String(match.away_score));
  const [hp, setHp] = useState(match.home_penalties != null ? String(match.home_penalties) : "");
  const [ap, setAp] = useState(match.away_penalties != null ? String(match.away_penalties) : "");
  const [evType, setEvType] = useState<MatchEventType>("goal");
  const [side, setSide] = useState<"home" | "away">("home");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [manualName, setManualName] = useState("");
  const [addMinuteStr, setAddMinuteStr] = useState("");
  const [addNote, setAddNote] = useState("");
  const [editingEvent, setEditingEvent] = useState<MatchEventRow | null>(null);
  const persistedTeamsForMatch = useRef<string | null>(null);

  const { homeTeamId, awayTeamId } = useMemo(() => resolveMatchTeamIds(match), [match]);

  useEffect(() => {
    setHs(String(match.home_score));
    setAs(String(match.away_score));
    setHp(match.home_penalties != null ? String(match.home_penalties) : "");
    setAp(match.away_penalties != null ? String(match.away_penalties) : "");
    setEvType("goal");
    setSide("home");
    setSelectedPlayerId("");
    setManualName("");
    setAddMinuteStr("");
    setAddNote("");
    setEditingEvent(null);
    persistedTeamsForMatch.current = null;
  }, [match.id, match.home_score, match.away_score, match.home_penalties, match.away_penalties, match.home_team_id, match.away_team_id]);

  useEffect(() => {
    if (!koMatchNeedsTeamPersist(match)) return;
    if (persistedTeamsForMatch.current === match.id) return;
    if (!homeTeamId || !awayTeamId) return;
    persistedTeamsForMatch.current = match.id;
    onSave({ id: match.id, home_team_id: homeTeamId, away_team_id: awayTeamId });
  }, [match, homeTeamId, awayTeamId, onSave]);

  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);
  const teamNameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name] as const)), [teams]);

  function submitScore(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: match.id,
      home_score: Number(hs),
      away_score: Number(as),
      home_penalties: parseOptionalPenaltyField(hp),
      away_penalties: parseOptionalPenaltyField(ap),
    });
  }

  function parseAddMinute(): number | null {
    const t = addMinuteStr.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || n > 200) return null;
    return Math.floor(n);
  }

  function addTimeline(e: FormEvent) {
    e.preventDefault();
    const event_minute = parseAddMinute();
    const event_note = addNote.trim() ? addNote.trim() : null;

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
      onAddEvent({
        event_type: evType,
        team_id: resolved.team_id,
        player_name: resolved.player_name,
        event_minute,
        event_note,
      });
    } else {
      onAddEvent({ event_type: evType, team_id: null, player_name: null, event_minute, event_note });
    }
    setSelectedPlayerId("");
    setManualName("");
    setAddMinuteStr("");
    setAddNote("");
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
            <AdminMatchScoreInputs
              homeScore={hs}
              awayScore={as}
              homePenalties={hp}
              awayPenalties={ap}
              onHomeScore={setHs}
              onAwayScore={setAs}
              onHomePenalties={setHp}
              onAwayPenalties={setAp}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update score
          </button>
        </div>
      </form>

      <h3 style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Timeline</h3>
      <p className="muted" style={{ fontSize: 11, margin: "0 0 10px" }}>
        Score is kept in sync with <strong>Goal</strong> and <strong>Own Goal</strong> events (own goals credit the opposing team). Use &quot;Update score&quot; only if you need a manual override.
      </p>
      <ul className="admin-timeline-list">
        {mainEvents.map((ev) => (
          <li key={ev.id} className="admin-timeline-row">
            <span className="admin-timeline-text">{formatTimelineLine(ev, teamNameById)}</span>
            <div className="admin-timeline-actions">
              <button type="button" className="btn btn-sm" onClick={() => setEditingEvent(ev)}>
                Edit
              </button>
              <button type="button" className="btn btn-sm" onClick={() => void onDeleteEvent(ev.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {mainEvents.length === 0 && <li className="muted">No events yet.</li>}
      </ul>

      {editingEvent && (
        <AdminMatchEventModal
          key={editingEvent.id}
          match={match}
          event={editingEvent}
          teams={teams}
          players={players}
          onClose={() => setEditingEvent(null)}
          onSave={async (payload) => {
            await onUpdateEvent(editingEvent.id, payload);
          }}
          onDelete={async () => {
            await onDeleteEvent(editingEvent.id);
          }}
        />
      )}

      <div className="form-row">
        <label>Add timeline event</label>
        <form onSubmit={addTimeline} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
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
            teamSelectId="live-ev-team"
            playerSelectId="live-ev-player"
            manualInputId="live-ev-manual"
            compact
          />
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Minute (optional)</label>
            <input
              inputMode="numeric"
              placeholder="e.g. 34"
              value={addMinuteStr}
              onChange={(e) => setAddMinuteStr(e.target.value)}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Note (optional)</label>
            <textarea rows={2} placeholder="Shown on public timeline" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">
            Add event
          </button>
        </form>
      </div>

      <PenaltyShootoutAdmin
        match={match}
        teams={teams}
        players={players}
        events={penaltyEvents}
        onAdd={onAddPenalty}
        onDelete={(id) => void onDeleteEvent(id)}
        onSyncTotals={(home, away) =>
          onSave({
            id: match.id,
            home_penalties: home,
            away_penalties: away,
          })
        }
      />
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
