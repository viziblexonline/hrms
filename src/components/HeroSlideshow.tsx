"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Headphones, Video } from "lucide-react";
import Link from "next/link";
import { MosqueSilhouette } from "./MosqueArt";
import { useI18n } from "@/lib/i18n";

const slideMeta = [
  { id: 1, href: "/signup", icon: ArrowRight },
  { id: 2, href: "/login", icon: ArrowRight },
  { id: 3, href: "/listen", icon: Headphones },
  { id: 4, href: "/login", icon: Video },
] as const;

export function HeroSlideshow({ loggedIn }: { loggedIn?: boolean }) {
  const [index, setIndex] = useState(0);
  const { t, dir } = useI18n();
  const copy = t.hero.slides;

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % slideMeta.length), 5600);
    return () => clearInterval(timer);
  }, []);

  const meta = slideMeta[index];
  const slide = copy[index];
  const Icon = meta.icon;
  const href =
    loggedIn && meta.id === 4
      ? "/dashboard/meetings"
      : loggedIn && meta.id === 3
        ? "/dashboard/listen"
        : loggedIn && meta.id !== 3
          ? "/dashboard"
          : meta.href;

  return (
    <section className="page-shell pt-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-arch-fade text-white shadow-lift">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="pointer-events-none absolute inset-0 shimmer-bg opacity-25" />
        <MosqueSilhouette className="absolute bottom-0 left-0 w-full text-white opacity-20" />
        <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${meta.id}-${slide.title}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="relative grid min-h-[480px] items-center gap-8 px-6 py-14 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14"
          >
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-100/85">
                {slide.eyebrow}
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                {slide.title}
              </h1>
              <p className="mt-5 max-w-xl text-base text-green-50/90 sm:text-lg">
                {slide.text}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition hover:scale-[1.02]"
                >
                  <Icon className="h-4 w-4" />
                  {slide.cta}
                </Link>
                <Link
                  href={loggedIn ? "/dashboard/listen" : "/about"}
                  className="rounded-full border border-white/35 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {loggedIn ? t.nav.listen : t.nav.about}
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="ms-auto w-full max-w-sm rounded-[1.75rem] border border-white/20 bg-white/10 p-5 backdrop-blur-md animate-float">
                <div className="mb-4 flex items-center justify-between text-xs">
                  <span className="font-semibold tracking-wide">HRMS</span>
                  <span className="rounded-full bg-emerald-300/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-100">
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    t.dash.nav.revision,
                    t.dash.nav.meetings,
                    t.dash.nav.listen,
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm"
                    >
                      <div className="font-medium">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex((i) => (i - 1 + slideMeta.length) % slideMeta.length)}
            className="rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25"
          >
            {dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <div className="flex gap-2">
            {slideMeta.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex((i) => (i + 1) % slideMeta.length)}
            className="rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25"
          >
            {dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
