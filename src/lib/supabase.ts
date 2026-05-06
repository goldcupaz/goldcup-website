import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  typeof url === "string" && url.trim() !== "" && typeof anon === "string" && anon.trim() !== "",
);

// Dev-only: confirms Vite injected env (no full secrets). Remove once you’re happy env loading works.
if (import.meta.env.DEV) {
  const uOk = typeof url === "string" && url.trim() !== "";
  const kOk = typeof anon === "string" && anon.trim() !== "";
  let urlHint = "missing";
  if (uOk) {
    try {
      urlHint = `set (len=${url!.trim().length}, host=${new URL(url!.trim()).host})`;
    } catch {
      urlHint = `set (len=${url!.trim().length}, invalid URL?)`;
    }
  }
  console.info(
    "[GoldCup env]",
    "VITE_SUPABASE_URL:",
    urlHint,
    "| VITE_SUPABASE_ANON_KEY:",
    kOk ? `set (len=${anon!.trim().length}, starts with ${anon!.trim().slice(0, 10)}…)` : "missing",
  );
}

export const supabase: SupabaseClient<Database> = createClient(
  url?.trim() ?? "https://placeholder.supabase.co",
  anon?.trim() ?? "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
