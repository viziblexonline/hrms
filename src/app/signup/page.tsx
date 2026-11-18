"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Mail, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FormField } from "@/components/FormField";
import { QuranHeroImage } from "@/components/MosqueArt";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import {
  WEAK_PASSWORD_ALERT,
  getPasswordChecks,
  getPasswordStrength,
  isStrongPassword,
} from "@/lib/password";
import clsx from "clsx";
import { MotionButton, motion } from "@/components/motion";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { signup } = useAuth();
  const [role, setRole] = useState<Exclude<Role, "admin">>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles: { id: Exclude<Role, "admin">; label: string }[] = [
    { id: "student", label: t.roles.student },
    { id: "teacher", label: t.roles.teacher },
  ];

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError(WEAK_PASSWORD_ALERT);
      window.alert(WEAK_PASSWORD_ALERT);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signup({ name, email, password, role });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Signup failed");
      return;
    }
    // Confirmation email pending (HRMS-branded after SMTP setup)
    if (result.error?.includes("confirmation email")) {
      setError("");
      window.alert(result.error);
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0d3b1f] p-10 text-white lg:flex">
        <div className="absolute inset-0 pattern-dots opacity-15" />
        <Logo variant="dark" />
        <motion.div
          className="relative z-10 max-w-md"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-100/80">
            HRMS
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
            {t.auth.signupTitle}
          </h2>
          <p className="mt-4 text-green-50/90">{t.auth.signupHint}</p>
        </motion.div>
        <QuranHeroImage className="mt-8 min-h-[220px]" />
      </div>

      <div className="relative flex items-center justify-center bg-mesh-green px-4 py-10">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>
        <motion.div
          className="glass-panel w-full max-w-md p-8"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow">{t.auth.signupTitle}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            {t.auth.signupTitle}
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            Sign up as Student or Teacher. Admin is institute-managed.
          </p>

          <div className="mt-5">
            <GoogleSignInButton />
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-mute">
            <div className="h-px flex-1 bg-primary/10" />
            or email
            <div className="h-px flex-1 bg-primary/10" />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-primary-mist p-1.5">
            {roles.map((r) => (
              <motion.button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                whileTap={{ scale: 0.97 }}
                className={clsx(
                  "rounded-full px-2 py-2 text-sm font-semibold transition",
                  role === r.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink-soft hover:bg-white"
                )}
              >
                {r.label}
              </motion.button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <FormField
              label={t.auth.fullName}
              value={name}
              onChange={setName}
              placeholder="Muhammad Zakria"
              icon={User}
              required
            />
            <FormField
              label={t.auth.email}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon={Mail}
              required
            />
            <FormField
              label={t.auth.password}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Strong password"
              icon={Lock}
              required
            />

            {password.length > 0 && (
              <div className="rounded-2xl border border-primary/10 bg-white/80 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-soft">Password strength</span>
                  <span
                    className={clsx(
                      "font-bold",
                      strength.label === "Weak" && "text-rose-600",
                      strength.label === "Fair" && "text-amber-600",
                      strength.label === "Good" && "text-lime-700",
                      strength.label === "Strong" && "text-emerald-700"
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "h-1.5 flex-1 rounded-full",
                        i < strength.score ? strength.color : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li
                      key={c.id}
                      className={clsx(
                        "flex items-center gap-2 text-xs",
                        c.ok ? "text-emerald-700" : "text-slate-500"
                      )}
                    >
                      {c.ok ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FormField
              label={t.auth.confirmPassword}
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              icon={Lock}
              required
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </motion.div>
            )}

            <p className="text-center text-xs leading-relaxed text-ink-mute">
              {t.auth.agreePrefix}{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                {t.nav.terms}
              </Link>{" "}
              {t.auth.and}{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                {t.nav.privacy}
              </Link>
              .
            </p>

            <MotionButton
              type="submit"
              disabled={loading}
              className="btn-signup w-full"
            >
              {loading ? t.auth.creating : t.auth.signupBtn}
            </MotionButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-mute">
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-primary">
              {t.nav.login}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
