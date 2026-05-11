import { useCallback, useEffect, useMemo, useState } from "react";

import { PEOPLE_COUNTER_IDS, PEOPLE_COUNTER_MATCHDAYS } from "../lib/peopleCounterMatchdays";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

async function fetchAllCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const { data, error } = await supabase.from("people_counter").select("id, count").in("id", [...PEOPLE_COUNTER_IDS]);
  if (error || !data) return {};
  const out: Record<string, number> = {};
  for (const id of PEOPLE_COUNTER_IDS) out[id] = 0;
  for (const row of data) {
    if (row.id) out[row.id] = Number(row.count) || 0;
  }
  return out;
}

/**
 * Per–matchday entrance counts: large controls, realtime sync.
 */
export function PeopleCounterWidget() {
  const [selectedId, setSelectedId] = useState<string>(PEOPLE_COUNTER_MATCHDAYS[0]?.id ?? "md3");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedCount = counts[selectedId] ?? 0;

  const refresh = useCallback(async () => {
    setCounts(await fetchAllCounts());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("people-counter-matchdays")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "people_counter" },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const dayLabel = useMemo(() => {
    const d = PEOPLE_COUNTER_MATCHDAYS.find((x) => x.id === selectedId);
    return d ? `${d.title} — ${d.dateLine}` : selectedId;
  }, [selectedId]);

  async function adjust(delta: number) {
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.rpc("people_counter_adjust", {
      p_counter_id: selectedId,
      p_delta: delta,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const v = data as unknown;
    if (typeof v === "number" && Number.isFinite(v)) {
      setCounts((c) => ({ ...c, [selectedId]: v }));
    } else if (typeof v === "string" && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) setCounts((c) => ({ ...c, [selectedId]: n }));
      else void refresh();
    } else void refresh();
  }

  if (!isSupabaseConfigured) {
    return <p className="muted">Supabase is not configured.</p>;
  }

  return (
    <div className="people-counter people-counter--matchdays">
      {err && <div className="alert warn people-counter-alert">{err}</div>}

      <div className="people-counter-day-tabs" role="tablist" aria-label="Matchday">
        {PEOPLE_COUNTER_MATCHDAYS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={selectedId === d.id}
            className={selectedId === d.id ? "people-counter-day-tab people-counter-day-tab--active" : "people-counter-day-tab"}
            onClick={() => setSelectedId(d.id)}
          >
            <span className="people-counter-day-tab-title">{d.title}</span>
            <span className="people-counter-day-tab-date">{d.dateLine}</span>
            <span className="people-counter-day-tab-count">{counts[d.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <p className="muted people-counter-selected-label" style={{ fontSize: 13, marginTop: 12, marginBottom: 8 }}>
        Counting for: <strong>{dayLabel}</strong>
      </p>

      <div className="people-counter-total" aria-live="polite">
        <span className="people-counter-label">Total this day</span>
        <span className="people-counter-value">{selectedCount}</span>
      </div>
      <div className="people-counter-actions">
        <button
          type="button"
          className="btn people-counter-btn people-counter-btn--minus"
          disabled={busy}
          onClick={() => void adjust(-1)}
        >
          −1
        </button>
        <button
          type="button"
          className="btn people-counter-btn people-counter-btn--plus"
          disabled={busy}
          onClick={() => void adjust(1)}
        >
          +1
        </button>
      </div>
    </div>
  );
}
