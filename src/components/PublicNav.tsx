"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { CalendarDays, LogIn, Menu, X } from "lucide-react";
import { useMemo, useState } from "react";

const DATE_LOCALE: Record<string, string> = {
  en: "en-US",
  ur: "ur-PK",
  ar: "ar",
};

function formatShortDate(locale: string) {
  return new Date().toLocaleDateString(DATE_LOCALE[locale] || locale, {
    month: "short",
    day: "numeric",
  });
}

export function PublicNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const todayLabel = useMemo(() => formatShortDate(locale), [locale]);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const links = [
    { href: "/", label: t.nav.home, key: "home" },
    { href: "/listen", label: t.nav.listen, key: "listen" },
    { href: "/about", label: t.nav.about, key: "about" },
    { href: "/contact", label: t.nav.contact, key: "contact" },
    {
      href: user ? "/dashboard/meetings" : "/login",
      label: t.nav.meetings,
      key: "meetings",
    },
  ];

  const isActive = (link: { href: string; key: string }) =>
    pathname === link.href ||
    (link.key === "meetings" && pathname.startsWith("/dashboard/meetings")) ||
    (link.key === "listen" &&
      (pathname === "/listen" || pathname.startsWith("/dashboard/listen")));

  return (
    <motion.header
      className="sticky top-0 z-40 px-3 pt-3 sm:px-4"
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-primary/10 bg-white/80 px-3 py-2 shadow-nav backdrop-blur-xl sm:px-5">
        <Logo showSubtitle={false} />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                isActive(link)
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-soft hover:bg-primary-soft hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" className="hidden sm:block" />
          {user ? (
            <Link href="/dashboard" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
              {t.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-white/90 px-2.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-primary-soft hover:text-primary sm:inline-flex"
              >
                <LogIn className="h-4 w-4 shrink-0 text-primary" />
                <span>{t.nav.login}</span>
              </Link>
              <Link href="/signup" className="btn-signup !px-4 !py-2 text-xs sm:text-sm">
                {t.nav.signup}
              </Link>
            </>
          )}
          <button
            type="button"
            className="rounded-full border border-primary/15 p-2 text-primary lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-primary/10 bg-white/95 p-3 shadow-card backdrop-blur lg:hidden">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "block rounded-2xl px-4 py-2.5 text-sm font-medium",
                isActive(link) ? "bg-primary-soft text-primary" : "text-ink-soft"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 space-y-2 border-t border-primary/10 px-2 pt-3">
            <LanguageSwitcher variant="panel" />
            {!user && (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-2.5 text-sm font-medium text-ink-soft"
                >
                  <LogIn className="h-4 w-4 text-primary" />
                  {t.nav.login}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="btn-signup flex-1 !px-3 !py-2.5 text-center text-sm"
                >
                  {t.nav.signup}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
}
