import type { Session } from "@supabase/supabase-js";
import {
  createContext,
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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin, is_volunteer")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setIsAdmin(false);
          setIsVolunteer(false);
          return;
        }
        setIsAdmin(!!data?.is_admin);
        setIsVolunteer(!!data?.is_volunteer);
      } catch (e) {
        console.error("[AuthProvider] loadProfile failed", e);
        if (!cancelled) {
          setIsAdmin(false);
          setIsVolunteer(false);
        }
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session ?? null);
        if (data.session?.user) void loadProfile(data.session.user.id);
        else {
          setIsAdmin(false);
          setIsVolunteer(false);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("[AuthProvider] getSession failed", e);
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (sess?.user) void loadProfile(sess.user.id);
      else {
        setIsAdmin(false);
        setIsVolunteer(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ session, isAdmin, isVolunteer, loading, signIn, signOut }),
    [session, isAdmin, isVolunteer, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
