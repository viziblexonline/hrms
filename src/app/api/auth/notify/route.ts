import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";
import { sendAuthNotice, AuthMailKind } from "@/lib/mail";

type Body = {
  kind?: AuthMailKind;
  email?: string;
  name?: string;
};

export async function POST(request: Request) {
  let kind: AuthMailKind = "login";
  let email = "";
  let name = "";

  try {
    const body = (await request.json()) as Body;
    if (body.kind === "signup" || body.kind === "login") kind = body.kind;
    if (typeof body.email === "string") email = body.email.trim().toLowerCase();
    if (typeof body.name === "string") name = body.name.trim();
  } catch {
    /* default login */
  }

  if (isSupabaseConfigured()) {
    const { url, anonKey } = getSupabaseEnv();
    const cookieStore = cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name: n, value, options }) =>
              cookieStore.set(n, value, options)
            );
          } catch {
            /* ignore */
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      email = user.email;
      name =
        name ||
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email.split("@")[0];
    }
  }

  // Signup with confirm-email ON may have no session yet — still notify
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const result = await sendAuthNotice({
    to: email,
    name: name || email.split("@")[0],
    kind,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
