import { NextResponse } from "next/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { sendAuthNotice } from "@/lib/mail";
import {
  APP_FULL_NAME,
  APP_NAME,
  APP_SUPPORT_EMAIL,
} from "@/lib/branding";

type Body = {
  email?: string;
  password?: string;
  name?: string;
  role?: "student" | "teacher";
};

export async function POST(request: Request) {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server signup not configured. Add SUPABASE_SERVICE_ROLE_KEY, or turn Confirm email OFF in Supabase Auth.",
      },
      { status: 503 }
    );
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
  const role = body.role === "teacher" ? "teacher" : "student";

  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Valid email and strong password required." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      full_name: name,
      app: APP_NAME,
      app_full_name: APP_FULL_NAME,
      support_email: APP_SUPPORT_EMAIL,
    },
  });

  if (error) {
    // If user exists but unconfirmed, confirm + update password so login works
    if (/already|registered|exists/i.test(error.message)) {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = listed.data.users.find(
        (u) => u.email?.toLowerCase() === email
      );
      if (existing) {
        const { error: updErr } = await admin.auth.admin.updateUserById(
          existing.id,
          {
            password,
            email_confirm: true,
            user_metadata: {
              ...existing.user_metadata,
              name,
              role,
              full_name: name,
            },
          }
        );
        if (updErr) {
          return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });
        }
        await sendAuthNotice({ to: email, name, kind: "signup" });
        return NextResponse.json({ ok: true, confirmed: true, existing: true });
      }
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ ok: false, error: "User create failed" }, { status: 500 });
  }

  await sendAuthNotice({ to: email, name, kind: "signup" });
  return NextResponse.json({ ok: true, confirmed: true, userId: data.user.id });
}
