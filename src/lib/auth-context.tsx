"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSession,
  login as doLogin,
  logout as doLogout,
  setSession,
} from "./store";
import { SessionUser } from "./types";
import { isSupabaseConfigured } from "./supabase/config";
import { tryCreateClient } from "./supabase/client";
import {
  fetchAppDataFromSupabase,
  fetchMyProfile,
  pushAppDataToSupabase,
} from "./supabase/sync";
import { getData, saveData } from "./store";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  supabaseEnabled: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (input: {
    email: string;
    password: string;
    name: string;
    role: "student" | "teacher";
  }) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToSession(profile: {
  id: string;
  email: string;
  name: string;
  role: SessionUser["role"];
  avatar?: string | null;
  teacher_id?: string | null;
  class_id?: string | null;
  class_name?: string | null;
}): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    avatar: profile.avatar || undefined,
    teacherId: profile.teacher_id || undefined,
    classId: profile.class_id || undefined,
    className: profile.class_name || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseEnabled = isSupabaseConfigured();

  const hydrateFromSupabase = useCallback(async () => {
    const supabase = tryCreateClient();
    if (!supabase) {
      setUser(getSession());
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setSession(null);
      setUser(null);
      return;
    }

    const profile = await fetchMyProfile();
    if (profile) {
      const sessionUser = profileToSession(profile);
      setSession(sessionUser);
      setUser(sessionUser);
    } else {
      const fallback: SessionUser = {
        id: session.user.id,
        email: session.user.email || "",
        name:
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "User",
        role: (session.user.user_metadata?.role as SessionUser["role"]) || "student",
        avatar: session.user.user_metadata?.avatar_url,
      };
      setSession(fallback);
      setUser(fallback);
    }

    // Pull shared AppData from Supabase once authenticated
    const remote = await fetchAppDataFromSupabase();
    if (remote && Array.isArray(remote.users)) {
      saveData(remote);
    } else {
      // Seed cloud with local/demo data on first connect
      await pushAppDataToSupabase(getData());
    }
  }, []);

  const refresh = useCallback(async () => {
    if (supabaseEnabled) {
      await hydrateFromSupabase();
      return;
    }
    setUser(getSession());
  }, [hydrateFromSupabase, supabaseEnabled]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (supabaseEnabled) {
          await hydrateFromSupabase();
        } else {
          setUser(getSession());
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onUpdate = () => {
      if (!supabaseEnabled) setUser(getSession());
    };
    window.addEventListener("hrms-session-updated", onUpdate);
    window.addEventListener("storage", onUpdate);

    const supabase = tryCreateClient();
    const { data: sub } =
      supabase?.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          return;
        }
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await hydrateFromSupabase();
        }
      }) || { data: { subscription: null } };

    return () => {
      mounted = false;
      window.removeEventListener("hrms-session-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
      sub.subscription?.unsubscribe();
    };
  }, [hydrateFromSupabase, supabaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      supabaseEnabled,
      login: async (email, password) => {
        if (supabaseEnabled) {
          const supabase = tryCreateClient();
          if (!supabase) return { ok: false, error: "Supabase not configured." };
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) return { ok: false, error: error.message };
          await hydrateFromSupabase();
          return { ok: true };
        }
        const session = doLogin(email, password);
        if (!session) return { ok: false, error: "Invalid email or password." };
        setUser(session);
        return { ok: true };
      },
      signup: async ({ email, password, name, role }) => {
        if (supabaseEnabled) {
          const supabase = tryCreateClient();
          if (!supabase) return { ok: false, error: "Supabase not configured." };
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, role, full_name: name },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) return { ok: false, error: error.message };
          await hydrateFromSupabase();
          return { ok: true };
        }
        // Local fallback uses store.registerUser via dynamic import pattern
        const { registerUser } = await import("./store");
        const result = registerUser({ name, email, password, role });
        if (!result.ok) return { ok: false, error: result.error };
        setUser(result.user);
        return { ok: true };
      },
      loginWithGoogle: async () => {
        if (!supabaseEnabled) {
          return {
            ok: false,
            error:
              "Google Sign-In needs Supabase. Add NEXT_PUBLIC_SUPABASE_URL / ANON_KEY and enable Google provider.",
          };
        }
        const supabase = tryCreateClient();
        if (!supabase) return { ok: false, error: "Supabase not configured." };

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      logout: async () => {
        if (supabaseEnabled) {
          const supabase = tryCreateClient();
          await supabase?.auth.signOut();
        }
        doLogout();
        setUser(null);
      },
      refresh,
    }),
    [user, loading, supabaseEnabled, hydrateFromSupabase, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
