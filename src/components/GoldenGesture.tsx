"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/** Warm golden welcome ribbon — salaam / barakah accent */
export function GoldenGesture({
  title = "Assalamu Alaikum",
  subtitle = "A golden gesture of barakah for your Hifz journey",
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-[1.5rem] border border-gold/35 bg-gold-fade text-ink shadow-gold ${
        compact ? "px-4 py-3" : "px-5 py-4 sm:px-6 sm:py-5"
      }`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0 shimmer-gold opacity-40" />
      <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-gold/25 blur-2xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-gold-bright/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center gap-4">
        <motion.div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-arch-fade text-gold-bright shadow-nav ring-2 ring-gold/50"
          animate={{ rotate: [0, -6, 6, 0], y: [0, -2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {/* Stylized open-hand / salaam gesture */}
          <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
            <path
              d="M16 28c0-6 3-12 8-16"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M24 12v18M20 14v14M28 14v14M32 16v12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M16 28c2 8 6 12 12 12s8-3 10-8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="36" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
          </svg>
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-gold-bright" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
            Golden Gesture
          </p>
          <h2
            className={`font-display font-semibold tracking-tight text-ink ${
              compact ? "text-lg" : "text-xl sm:text-2xl"
            }`}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
