import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/supabase/server-auth";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { sendAuthNotice } from "@/lib/mail";
import {
  APP_FULL_NAME,
  APP_NAME,
  APP_SUPPORT_EMAIL,
} from "@/lib/branding";
import { isStrongPassword } from "@/lib/password";

type Body = {
  email?: string;
  password?: string;
  name?: string;
  role?: "student" | "teacher" | "admin";
  phone?: string;
  className?: string;
};

export async function POST(request: Request) {
  const gate = await requireAdminUser();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const name = body.name?.trim() || email.split("@")[0] || "User";
  const role =
    body.role === "teacher" || body.role === "admin" || body.role === "student"
      ? body.role
      : "student";
  const phone = body.phone?.trim() || "";
  const className = body.className?.trim() || "";

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required." }, { status: 400 });
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Password must be 8+ chars with upper, lower, number, and special character.",
      },
      { status: 400 }
    );
  }

  const meta = {
    name,
    role,
    full_name: name,
    phone,
    class_name: className,
    app: APP_NAME,
    app_full_name: APP_FULL_NAME,
    support_email: APP_SUPPORT_EMAIL,
  };

  let userId = "";
  const admin = tryCreateAdminClient();

  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = listed.data.users.find(
          (u) => u.email?.toLowerCase() === email
        );
        if (!existing) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }
        const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { ...existing.user_metadata, ...meta },
        });
        if (updErr) {
          return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });
        }
        userId = existing.id;
      } else {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
    } else {
      userId = data.user?.id || "";
    }
  } else {
    // No service role: create via Auth signup on a detached client
    const { url, anonKey } = getSupabaseEnv();
    const detached = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await detached.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    userId = data.user?.id || "";
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: "User create failed" }, { status: 500 });
  }

  // Ensure profile role/fields (trigger may demote admin role)
  const { error: profileErr } = await gate.supabase
    .from("profiles")
    .update({
      name,
      role,
      phone: phone || null,
      class_name: className || null,
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileErr) {
    // Profile row may not exist yet — try upsert if policy allows; otherwise ignore
    await gate.supabase.from("profiles").upsert({
      id: userId,
      email,
      name,
      role,
      phone: phone || null,
      class_name: className || null,
      active: true,
      updated_at: new Date().toISOString(),
    });
  }

  await sendAuthNotice({ to: email, name, kind: "signup" });

  return NextResponse.json({
    ok: true,
    userId,
    email,
    name,
    role,
    phone,
    className,
  });
}
