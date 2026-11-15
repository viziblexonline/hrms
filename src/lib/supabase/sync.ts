"use client";

import { AppData } from "@/lib/types";
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
