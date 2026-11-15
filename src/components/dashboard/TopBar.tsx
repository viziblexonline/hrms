"use client";

import { Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { interpolate, useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  const roleLabel =
    user.role === "student"
      ? t.roles.student
      : user.role === "teacher"
        ? t.roles.teacher
        : t.roles.admin;

  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow mb-2">{t.dash.workspace}</p>
        {title ? (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm text-ink-mute">{subtitle}</p>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {interpolate(t.dash.greeting, { name: user.name.split(" ")[0] })}
            </h1>
            <p className="mt-1.5 text-sm text-ink-mute">{t.dash.greetingHint}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher className="hidden sm:block" />
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            placeholder={t.common.search}
            className="w-56 rounded-full border border-primary/15 bg-white/90 py-2 pe-3 ps-9 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <button className="relative rounded-full border border-primary/15 bg-white p-2.5 text-ink-soft hover:bg-primary-soft">
          <Bell className="h-4 w-4" />
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-white px-2.5 py-1.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-arch-fade text-xs font-bold text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="pe-1 leading-tight">
            <div className="text-sm font-semibold text-ink">{user.name}</div>
            <div className="text-[11px] text-ink-mute">{roleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
