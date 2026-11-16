import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

export function createCookieSupabase() {
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export async function requireAdminUser() {
  const supabase = createCookieSupabase();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role ||
    (user.user_metadata?.role as string | undefined) ||
    "student";

  if (role !== "admin") {
    return { ok: false as const, error: "Admin only" };
  }

  return {
    ok: true as const,
    supabase,
    user,
    profile: profile || {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || "Admin",
      role: "admin" as const,
    },
  };
}
