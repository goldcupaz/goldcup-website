import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "../lib/supabase";

async function fetchCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.from("people_counter").select("count").eq("id", "singleton").maybeSingle();
  if (error || data == null) return 0;
  return Number(data.count) || 0;
}

/**
 * Entrance headcount: large controls, realtime sync. Used on /volunteer and Admin → People counter.
 */
export function PeopleCounterWidget() {
  const [count, setCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setCount(await fetchCount());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("people-counter-live")
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

  async function adjust(delta: number) {
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.rpc("people_counter_adjust", { p_delta: delta });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const v = data as unknown;
    if (typeof v === "number" && Number.isFinite(v)) setCount(v);
    else if (typeof v === "string" && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) setCount(n);
      else void refresh();
    } else void refresh();
  }

  async function reset() {
    if (!window.confirm("Reset people counter to zero?")) return;
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.rpc("people_counter_reset");
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const v = data as unknown;
    if (typeof v === "number" && Number.isFinite(v)) setCount(v);
    else if (typeof v === "string" && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) setCount(n);
      else void refresh();
    } else void refresh();
  }

  if (!isSupabaseConfigured) {
    return <p className="muted">Supabase is not configured.</p>;
  }

  return (
    <div className="people-counter">
      {err && <div className="alert warn people-counter-alert">{err}</div>}
      <div className="people-counter-total" aria-live="polite">
        <span className="people-counter-label">Total</span>
        <span className="people-counter-value">{count}</span>
      </div>
      <div className="people-counter-actions">
        <button type="button" className="btn people-counter-btn people-counter-btn--minus" disabled={busy} onClick={() => void adjust(-1)}>
          −1
        </button>
        <button type="button" className="btn people-counter-btn people-counter-btn--plus" disabled={busy} onClick={() => void adjust(1)}>
          +1
        </button>
      </div>
      <button type="button" className="btn people-counter-reset" disabled={busy} onClick={() => void reset()}>
        Reset to 0
      </button>
    </div>
  );
}
