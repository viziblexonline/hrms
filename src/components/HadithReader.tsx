"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import {
  HADITH_COLLECTIONS,
  HADITHS,
  HadithCollection,
} from "@/lib/hadith";
import { useI18n } from "@/lib/i18n";
import clsx from "clsx";
import { motion } from "framer-motion";

export function HadithReader() {
  const { locale, t } = useI18n();
  const [collection, setCollection] = useState<HadithCollection | "all">("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(HADITHS[0]?.id || "");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HADITHS.filter((h) => {
      if (collection !== "all" && h.collection !== collection) return false;
      if (!q) return true;
      return (
        h.topic.toLowerCase().includes(q) ||
        h.english.toLowerCase().includes(q) ||
        h.urdu.includes(q) ||
        h.arabic.includes(q) ||
        h.narrator.toLowerCase().includes(q) ||
        h.number.includes(q)
      );
    });
  }, [collection, search]);

  const active = filtered.find((h) => h.id === activeId) || filtered[0];

  const collectionLabel = (id: HadithCollection) => {
    const c = HADITH_COLLECTIONS.find((x) => x.id === id);
    if (!c) return id;
    if (locale === "ur") return c.labelUr;
    if (locale === "ar") return c.labelAr;
    return c.label;
  };

  const translation = active
    ? locale === "ur"
      ? active.urdu
      : locale === "ar"
        ? active.arabic
        : active.english
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCollection("all")}
            className={clsx(
              "rounded-2xl px-3 py-1.5 text-xs font-semibold transition",
              collection === "all"
                ? "bg-primary text-white"
                : "bg-primary-mist text-primary hover:bg-primary-soft"
            )}
          >
            {t.hadith.all}
          </button>
          {HADITH_COLLECTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCollection(c.id)}
              className={clsx(
                "rounded-2xl px-3 py-1.5 text-xs font-semibold transition",
                collection === c.id
                  ? "bg-primary text-white"
                  : "bg-primary-mist text-primary hover:bg-primary-soft"
              )}
            >
              {collectionLabel(c.id)}
            </button>
          ))}
        </div>

        {active ? (
          <motion.article
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-primary/10 bg-white/90 p-6 shadow-sm ring-1 ring-gold/20"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{collectionLabel(active.collection)}</span>
              <span className="text-ink-mute">#{active.number}</span>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold-deep normal-case tracking-normal">
                {active.topic}
              </span>
            </div>

            <p
              className="mt-6 text-center font-arabic text-2xl leading-[2.1] text-ink sm:text-3xl"
              dir="rtl"
              lang="ar"
            >
              {active.arabic}
            </p>

            {locale !== "ar" && (
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
                {translation}
              </p>
            )}

            {locale === "en" && (
              <p className="mt-3 text-sm leading-relaxed text-ink-mute" dir="rtl" lang="ur">
                {active.urdu}
              </p>
            )}

            <p className="mt-6 border-t border-primary/10 pt-4 text-xs text-ink-mute">
              {t.hadith.narrator}: {active.narrator}
            </p>
          </motion.article>
        ) : (
          <div className="rounded-3xl border border-dashed border-primary/20 bg-white/60 p-10 text-center text-sm text-ink-mute">
            {t.hadith.empty}
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.hadith.search}
            className="w-full rounded-2xl border border-primary/15 bg-white py-2.5 pe-3 ps-9 text-sm outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <div className="max-h-[28rem] space-y-1 overflow-y-auto rounded-3xl border border-primary/10 bg-white/80 p-2">
          {filtered.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(h.id)}
              className={clsx(
                "w-full rounded-2xl px-3 py-2.5 text-start transition",
                active?.id === h.id
                  ? "bg-primary text-white"
                  : "hover:bg-primary-mist"
              )}
            >
              <p className="text-xs font-semibold opacity-80">
                {collectionLabel(h.collection)} · #{h.number}
              </p>
              <p className="mt-0.5 text-sm font-medium">{h.topic}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
