import nodemailer from "nodemailer";
import {
  APP_EMAIL_FROM_NAME,
  APP_FULL_NAME,
  APP_NAME,
  APP_SUPPORT_EMAIL,
  APP_TAGLINE,
} from "@/lib/branding";

export type AuthMailKind = "signup" | "login";

function smtpConfigured() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || APP_SUPPORT_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  return Boolean(user && pass);
}

function getTransport() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || APP_SUPPORT_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

function subjectFor(kind: AuthMailKind) {
  return kind === "signup"
    ? `Welcome to ${APP_NAME} — account ready`
    : `You signed in to ${APP_NAME}`;
}

function htmlBody(input: {
  kind: AuthMailKind;
  name: string;
  email: string;
}) {
  const title =
    input.kind === "signup"
      ? `Assalamu alaikum ${input.name}, your ${APP_NAME} account is ready.`
      : `Assalamu alaikum ${input.name}, you just signed in to ${APP_NAME}.`;
  const detail =
    input.kind === "signup"
      ? `Signup was successful for <strong>${input.email}</strong>. You can now use classes, revision tasks, and Quran listening.`
      : `Login was successful for <strong>${input.email}</strong>. If this was not you, reset your password or contact support.`;

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f7f5;font-family:Georgia,serif;color:#14261c;">
    <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #d7e5db;border-radius:16px;overflow:hidden;">
      <div style="background:#0d3b1f;padding:28px 24px;color:#fff;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;">${APP_NAME}</div>
        <div style="font-size:28px;margin-top:8px;font-weight:700;">${APP_FULL_NAME}</div>
        <div style="margin-top:8px;opacity:0.85;">${APP_TAGLINE}</div>
      </div>
      <div style="padding:28px 24px;line-height:1.6;">
        <p style="font-size:18px;margin:0 0 12px;">${title}</p>
        <p style="margin:0 0 16px;">${detail}</p>
        <p style="margin:0;color:#4b6354;font-size:14px;">This message was sent by ${APP_NAME} from ${APP_SUPPORT_EMAIL}.</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendAuthNotice(input: {
  to: string;
  name?: string;
  kind: AuthMailKind;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!input.to) return { ok: false, error: "Missing recipient" };
  if (!smtpConfigured()) {
    console.warn("[HRMS mail] SMTP_PASS / GMAIL_APP_PASSWORD not set — skipped");
    return { ok: false, skipped: true, error: "SMTP not configured" };
  }

  const transport = getTransport();
  if (!transport) {
    return { ok: false, skipped: true, error: "SMTP not configured" };
  }

  const fromUser = process.env.SMTP_USER || process.env.GMAIL_USER || APP_SUPPORT_EMAIL;
  const name = input.name?.trim() || input.to.split("@")[0] || "User";

  try {
    await transport.sendMail({
      from: `"${APP_EMAIL_FROM_NAME}" <${fromUser}>`,
      to: input.to,
      subject: subjectFor(input.kind),
      html: htmlBody({ kind: input.kind, name, email: input.to }),
      text:
        input.kind === "signup"
          ? `Welcome to ${APP_NAME}. Signup successful for ${input.to}.`
          : `You signed in to ${APP_NAME} as ${input.to}.`,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mail send failed";
    console.error("[HRMS mail]", message);
    return { ok: false, error: message };
  }
}
