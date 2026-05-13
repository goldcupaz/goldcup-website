import { useMemo, useState } from "react";

import type { Database } from "../lib/database.types";
import { computeStandingsForGroup } from "../lib/standings";
import { supabase } from "../lib/supabase";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

const LETTERS = ["A", "B", "C", "D"] as const;

function savedDeduction(t: TeamRow): number {
  return Math.max(0, Math.floor(Number(t.points_deduction) || 0));
}

export function AdminStandingsAdjustments({
  teams,
  matches,
  onRefresh,
}: {
  teams: TeamRow[];
  matches: MatchRow[];
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const groups = useMemo(() => {
    return LETTERS.map((L) => ({
      letter: L,
      rows: computeStandingsForGroup(L, teams, matches),
    }));
  }, [teams, matches]);

  function deductionFor(teamId: string): number {
    if (Object.prototype.hasOwnProperty.call(draft, teamId)) return draft[teamId]!;
    const t = teams.find((x) => x.id === teamId);
    return savedDeduction(t ?? ({} as TeamRow));
  }

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const t of teams) {
      const saved = savedDeduction(t);
      const eff = Object.prototype.hasOwnProperty.call(draft, t.id) ? draft[t.id]! : saved;
      if (eff !== saved) n += 1;
    }
    return n;
  }, [teams, draft]);

  async function saveChanges() {
    setLocalMsg(null);
    setLocalErr(null);
    const updates: { id: string; points_deduction: number }[] = [];
    for (const t of teams) {
      const next = deductionFor(t.id);
      if (next !== savedDeduction(t)) updates.push({ id: t.id, points_deduction: next });
    }
    if (updates.length === 0) {
      setLocalMsg("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      for (const u of updates) {
        const { error } = await supabase.from("teams").update({ points_deduction: u.points_deduction }).eq("id", u.id);
        if (error) throw new Error(error.message);
      }
      setDraft({});
      setLocalMsg(`Saved ${updates.length} team(s).`);
      await onRefresh();
    } catch (e) {
      setLocalErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Standings Adjustments
      </h2>
      <p className="muted">
        Deduct points for discipline only. Match results, goals, and W/D/L stay unchanged. Public standings use final
        points (match points minus deduction). Only admins can update this field.
      </p>
      {localMsg && (
        <p className="muted" style={{ marginTop: 8 }}>
          {localMsg}
        </p>
      )}
      {localErr && (
        <p className="warn" style={{ marginTop: 8 }}>
          {localErr}
        </p>
      )}

      {groups.map(({ letter, rows }) => (
        <div key={letter} style={{ marginTop: 22 }}>
          <div className="badge" style={{ marginBottom: 10 }}>
            Group {letter}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Normal P</th>
                  <th>Points deduction</th>
                  <th>Final P</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = deductionFor(r.team.id);
                  const finalPreview = r.normalPts - d;
                  return (
                    <tr key={r.team.id}>
                      <td style={{ fontWeight: 700 }}>{r.team.name}</td>
                      <td>{r.normalPts}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          step={1}
                          value={d}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === "" ? 0 : Math.max(0, Math.min(99, Math.floor(Number(raw))));
                            setDraft((prev) => ({ ...prev, [r.team.id]: v }));
                          }}
                          aria-label={`Points deduction for ${r.team.name}`}
                          style={{ width: 72 }}
                        />
                      </td>
                      <td style={{ color: "var(--gold)", fontWeight: 800 }}>{finalPreview}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary" disabled={saving || dirtyCount === 0} onClick={() => void saveChanges()}>
          {saving ? "Saving…" : dirtyCount === 0 ? "No changes" : `Save changes (${dirtyCount})`}
        </button>
      </div>
    </section>
  );
}
