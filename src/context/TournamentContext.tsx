import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type GoalRow = Database["public"]["Tables"]["match_goals"]["Row"];
type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];

export type TournamentContextValue = {
  loading: boolean;
  error: string | null;
  teams: TeamRow[];
  matches: MatchRow[];
  goals: GoalRow[];
  matchEvents: MatchEventRow[];
  players: PlayerRow[];
  currentLiveMatchId: string | null;
  refresh: () => Promise<void>;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

function parseLiveId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "id" in raw) {
    const v = (raw as { id: unknown }).id;
    if (v == null || v === "null") return null;
    return String(v);
  }
  if (typeof raw === "string") return raw || null;
  return null;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEventRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [currentLiveMatchId, setCurrentLiveMatchId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setError(null);
    try {
      const [tRes, mRes, gRes, evRes, pRes, sRes] = await Promise.all([
        supabase.from("teams").select("*").order("group_letter").order("group_order"),
        supabase.from("matches").select("*").order("sort_order"),
        supabase.from("match_goals").select("*").order("created_at"),
        supabase.from("match_events").select("*").order("event_order").order("created_at"),
        supabase.from("players").select("*").order("sort_order"),
        supabase.from("site_settings").select("*").eq("key", "current_live_match_id").maybeSingle(),
      ]);

      if (tRes.error) setError(tRes.error.message);
      else if (mRes.error) setError(mRes.error.message);
      else if (gRes.error) setError(gRes.error.message);
      else if (evRes.error) setError(evRes.error.message);
      else if (pRes.error) setError(pRes.error.message);
      else if (sRes.error) setError(sRes.error.message);

      if (tRes.data) setTeams(tRes.data as TeamRow[]);
      if (mRes.data) setMatches(mRes.data as MatchRow[]);
      if (gRes.data) setGoals(gRes.data as GoalRow[]);
      if (evRes.data) setMatchEvents(evRes.data as MatchEventRow[]);
      if (pRes.data) setPlayers(pRes.data as PlayerRow[]);

      if (sRes.data?.value !== undefined) setCurrentLiveMatchId(parseLiveId(sRes.data.value));
    } catch (e) {
      console.error("[TournamentProvider] refresh failed", e);
      setError(e instanceof Error ? e.message : "Failed to load tournament data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let channel: RealtimeChannel | null = null;
    try {
      channel = supabase
        .channel("tournament-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "match_goals" }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "match_events" }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => void refresh());

      void channel.subscribe();
    } catch (e) {
      console.error("[TournamentProvider] Realtime subscribe failed (app still works without live updates)", e);
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      error,
      teams,
      matches,
      goals,
      matchEvents,
      players,
      currentLiveMatchId,
      refresh,
    }),
    [loading, error, teams, matches, goals, matchEvents, players, currentLiveMatchId, refresh],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
