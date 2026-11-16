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
  fetchAllProfiles,
  fetchMyProfile,
  mergeProfilesIntoUsers,
  pushAppDataToSupabase,
} from "./supabase/sync";
import { getData, saveData, upsertDirectoryUser } from "./store";
import { APP_FULL_NAME, APP_NAME, APP_SUPPORT_EMAIL } from "./branding";

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
      upsertDirectoryUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone || undefined,
        className: profile.class_name || undefined,
        classId: profile.class_id || undefined,
        teacherId: profile.teacher_id || undefined,
        active: profile.active !== false,
      });
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
      if (fallback.email) {
        upsertDirectoryUser({
          id: fallback.id,
          name: fallback.name,
          email: fallback.email,
          role: fallback.role,
        });
      }
    }

    // Pull shared AppData, then merge every Supabase profile (signups → admin list)
    const remote = await fetchAppDataFromSupabase();
    if (remote && Array.isArray(remote.users)) {
      saveData(remote);
    }
    const profiles = await fetchAllProfiles();
    if (profiles.length > 0) {
      const current = getData();
      const mergedUsers = mergeProfilesIntoUsers(current.users, profiles);
      saveData({ ...current, users: mergedUsers });
    } else if (!remote || !Array.isArray(remote.users)) {
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
          if (!error) {
            await hydrateFromSupabase();
            await fetch("/api/auth/notify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kind: "login",
                email,
                name: email.split("@")[0],
              }),
            }).catch(() => undefined);
            return { ok: true };
          }
          // Demo seed accounts still work if not yet in Supabase Auth
          const local = doLogin(email, password);
          if (local) {
            setUser(local);
            return { ok: true };
          }
          return { ok: false, error: error.message };
        }
        const session = doLogin(email, password);
        if (!session) return { ok: false, error: "Invalid email or password." };
        setUser(session);
        return { ok: true };
      },
      signup: async ({ email, password, name, role }) => {
        if (supabaseEnabled) {
          // Server signup confirms email immediately (no "Email not confirmed" on login)
          const serverRes = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name, role }),
          }).catch(() => null);

          if (serverRes?.ok) {
            const created = (await serverRes.json().catch(() => null)) as {
              userId?: string;
            } | null;
            upsertDirectoryUser({
              id: created?.userId || `u-${Date.now()}`,
              name,
              email,
              role,
              password,
            });
            const supabase = tryCreateClient();
            if (!supabase) return { ok: false, error: "Supabase not configured." };
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (loginError) {
              return {
                ok: true,
                error: "Account created. Please sign in from the login page.",
              };
            }
            await hydrateFromSupabase();
            return { ok: true };
          }

          // Fallback: client signUp (needs Confirm email OFF, or user clicks confirm link)
          const supabase = tryCreateClient();
          if (!supabase) return { ok: false, error: "Supabase not configured." };
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role,
                full_name: name,
                app: APP_NAME,
                app_full_name: APP_FULL_NAME,
                support_email: APP_SUPPORT_EMAIL,
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) return { ok: false, error: error.message };

          upsertDirectoryUser({
            id: data.user?.id || `u-${Date.now()}`,
            name,
            email,
            role,
            password,
          });

          await fetch("/api/auth/notify", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "signup", email, name }),
          }).catch(() => undefined);

          if (!data.session) {
            return {
              ok: true,
              error: `Check inbox for the HRMS confirm link (from ${APP_SUPPORT_EMAIL}), then log in.`,
            };
          }
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
              prompt: "select_account consent",
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
