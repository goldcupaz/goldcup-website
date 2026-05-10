import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthState = {
  session: Session | null;
  isAdmin: boolean;
  isVolunteer: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("is_admin, is_volunteer")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        const r2 = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
        if (r2.error) {
          setIsAdmin(false);
          setIsVolunteer(false);
          return;
        }
        setIsAdmin(!!r2.data?.is_admin);
        setIsVolunteer(false);
        return;
      }

      setIsAdmin(!!data?.is_admin);
      setIsVolunteer(!!data?.is_volunteer);
    } catch (e) {
      console.error("[AuthProvider] loadProfile failed", e);
      setIsAdmin(false);
      setIsVolunteer(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          console.error("[AuthProvider] getSession", error);
          setLoading(false);
          return;
        }
        setSession(data.session ?? null);
        if (data.session?.user) await loadProfile(data.session.user.id);
        else {
          setIsAdmin(false);
          setIsVolunteer(false);
        }
      } catch (e) {
        console.error("[AuthProvider] init session", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      void (async () => {
        if (sess?.user) await loadProfile(sess.user.id);
        else {
          setIsAdmin(false);
          setIsVolunteer(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) await loadProfile(data.user.id);
      return { error: null };
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsVolunteer(false);
  }, []);

  const value = useMemo(
    () => ({ session, isAdmin, isVolunteer, loading, signIn, signOut }),
    [session, isAdmin, isVolunteer, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
