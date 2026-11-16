"use client";

import { AppData, User } from "@/lib/types";
import { tryCreateClient } from "./client";
import { isSupabaseConfigured } from "./config";

/** Load AppData payload from Supabase (authenticated). */
export async function fetchAppDataFromSupabase(): Promise<AppData | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = tryCreateClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_data")
    .select("payload")
    .eq("id", "main")
    .maybeSingle();

  if (error || !data?.payload) return null;
  return data.payload as AppData;
}

/** Persist AppData payload to Supabase. */
export async function pushAppDataToSupabase(payload: AppData): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = tryCreateClient();
  if (!supabase) return false;

  const { error } = await supabase.from("app_data").upsert({
    id: "main",
    payload,
    updated_at: new Date().toISOString(),
  });

  return !error;
}

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "admin";
  phone?: string | null;
  avatar?: string | null;
  teacher_id?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  active: boolean;
};

export async function fetchMyProfile(): Promise<ProfileRow | null> {
  const supabase = tryCreateClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function updateMyProfileRole(role: "student" | "teacher") {
  const supabase = tryCreateClient();
  if (!supabase) return { ok: false as const, error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** All auth profiles — admin Users list ke liye */
export async function fetchAllProfiles(): Promise<ProfileRow[]> {
  const supabase = tryCreateClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ProfileRow[];
}

export function profileToDirectoryUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: "",
    role: profile.role,
    phone: profile.phone || undefined,
    avatar: profile.avatar || undefined,
    teacherId: profile.teacher_id || undefined,
    classId: profile.class_id || undefined,
    className: profile.class_name || undefined,
    active: profile.active !== false,
    createdAt: new Date().toISOString(),
  };
}

/** Merge Supabase profiles into AppData.users (signup users admin ko dikhein) */
export function mergeProfilesIntoUsers(
  existing: User[],
  profiles: ProfileRow[]
): User[] {
  const byEmail = new Map<string, User>();
  for (const u of existing) {
    byEmail.set(u.email.toLowerCase(), u);
  }
  for (const p of profiles) {
    const email = p.email.toLowerCase();
    const prev = byEmail.get(email);
    const fromProfile = profileToDirectoryUser(p);
    byEmail.set(email, {
      ...fromProfile,
      password: prev?.password || "",
      // Keep class assignment fields if profile empty but local has them
      teacherId: fromProfile.teacherId || prev?.teacherId,
      classId: fromProfile.classId || prev?.classId,
      className: fromProfile.className || prev?.className,
      phone: fromProfile.phone || prev?.phone,
      createdAt: prev?.createdAt || fromProfile.createdAt,
    });
  }
  return Array.from(byEmail.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
