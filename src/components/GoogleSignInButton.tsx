"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { APP_SUPPORT_EMAIL } from "@/lib/branding";
import { motion } from "framer-motion";

export function GoogleSignInButton({
  label = "Continue with Google · HRMS",
}: {
  label?: string;
}) {
  const { loginWithGoogle, supabaseEnabled } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setLoading(true);
    setError("");
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Google sign-in failed");
    }
  };

  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-soft/60 disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Redirecting…" : label}
      </motion.button>
      {supabaseEnabled ? (
        <p className="text-center text-[11px] text-ink-mute">
          After Google sign-in, HRMS emails you from {APP_SUPPORT_EMAIL}.
        </p>
      ) : (
        <p className="text-center text-[11px] text-amber-700">
          Google login activates after Supabase + Google Client ID setup.
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.7 3.9 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.5l3 2.2C7.8 7.5 9.7 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.7 3.9 14.6 3 12 3 8.5 3 5.5 5 3.9 7.5z"
        opacity="0"
      />
      <path
        fill="#4285F4"
        d="M12 21c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3C5.4 18.9 8.5 21 12 21z"
      />
      <path
        fill="#FBBC05"
        d="M6.9 13.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7L3.9 7.9C3.3 9.1 3 10.5 3 12s.3 2.9.9 4.1l3-2.4z"
      />
    </svg>
  );
}
