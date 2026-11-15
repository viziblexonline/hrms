"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FormField } from "@/components/FormField";
import { MosqueSilhouette } from "@/components/MosqueArt";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { MotionButton, motion } from "@/components/motion";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("zakria@hrms.edu.pk");
  const [password, setPassword] = useState("student123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Login failed");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-arch-fade p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="pointer-events-none absolute inset-0 shimmer-bg opacity-20" />
        <Logo variant="dark" />
        <motion.div
          className="relative z-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-100/80">
            {t.auth.welcomeBack}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
            {t.auth.workspaceAwaits}
          </h1>
          <p className="mt-4 font-display text-xl italic text-green-50/90">
            “And We have certainly made the Qur’an easy for remembrance…”
          </p>
          <p className="mt-2 text-sm text-green-100/75">— Al-Qamar 54:17</p>
        </motion.div>
        <MosqueSilhouette className="absolute bottom-0 left-0 w-full text-white opacity-25" />
      </div>

      <div className="relative flex items-center justify-center bg-mesh-green px-4 py-10">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>
        <motion.div
          className="glass-panel w-full max-w-md p-8"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow">{t.auth.signIn}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            {t.auth.welcomeBackTitle}
          </h1>
          <p className="mt-1 text-sm text-ink-mute">{t.auth.loginHint}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <FormField
              label={t.auth.email}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon={Mail}
              required
              autoComplete="email"
            />
            <FormField
              label={t.auth.password}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={Lock}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-primary/30 text-primary focus:ring-primary"
                />
                {t.auth.remember}
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </motion.div>
            )}

            <MotionButton
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t.auth.loggingIn : t.auth.loginBtn}
            </MotionButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-mute">
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="font-semibold text-primary">
              {t.nav.signup}
            </Link>
          </p>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary-mist/80 p-3 text-xs text-ink-soft">
            <p className="font-semibold text-primary">Demo</p>
            <p>Student: zakria@hrms.edu.pk / student123</p>
            <p>Teacher: ahmed@hrms.edu.pk / teacher123</p>
            <p>Admin: admin@hrms.edu.pk / admin123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
