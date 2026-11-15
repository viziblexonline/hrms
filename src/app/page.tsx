"use client";

import Link from "next/link";
import {
  BarChart3,
  BookMarked,
  ClipboardCheck,
  FileText,
  Headphones,
  Video,
} from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { MosqueSilhouette } from "@/components/MosqueArt";
import { Logo } from "@/components/Logo";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { MidPageBanner, PromoBanners } from "@/components/PromoBanners";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  FadeUp,
  MotionButton,
  Stagger,
  StaggerItem,
  motion,
} from "@/components/motion";

const featureMeta = [
  { key: "progress" as const, icon: BarChart3, href: "/dashboard/progress" },
  { key: "revision" as const, icon: BookMarked, href: "/dashboard/revision" },
  { key: "meetings" as const, icon: Video, href: "/dashboard/meetings" },
  { key: "listening" as const, icon: Headphones, href: "/listen" },
  { key: "assessments" as const, icon: ClipboardCheck, href: "/dashboard/assessments" },
  { key: "reports" as const, icon: FileText, href: "/dashboard/reports" },
];

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <PublicNav />
      <HeroSlideshow loggedIn={!!user} />
      <PromoBanners loggedIn={!!user} />

      <div className="page-shell">
        <MidPageBanner />
      </div>

      <section className="page-shell py-14">
        <FadeUp className="mb-8 max-w-2xl">
          <p className="eyebrow">{t.home.coreTools}</p>
          <h2 className="section-title mt-2">{t.home.everythingNeeds}</h2>
        </FadeUp>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureMeta.map((f) => {
            const Icon = f.icon;
            const copy = t.home.features[f.key];
            const href =
              f.href === "/listen" ? "/listen" : user ? f.href : "/login";
            return (
              <StaggerItem key={f.key}>
                <Link href={href} className="card group block h-full transition hover:-translate-y-0.5 hover:shadow-lift">
                  <motion.div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-mist text-primary transition group-hover:bg-arch-fade group-hover:text-white"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <h3 className="font-display text-xl font-semibold text-ink">
                    {copy.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-mute">{copy.desc}</p>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="page-shell pb-14">
        <div className="grid overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-card lg:grid-cols-2">
          <div className="bg-arch-fade p-8 text-white pattern-arch sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-100">
              {t.home.spotlight}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">
              {t.home.spotlightTitle}
            </h2>
            <p className="mt-3 text-sm text-green-50/90">{t.home.spotlightText}</p>
            <div className="mt-6">
              <Link href={user ? "/dashboard/meetings" : "/signup"}>
                <MotionButton className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary">
                  {user ? t.common.openMeetings : t.common.createAccount}
                </MotionButton>
              </Link>
            </div>
          </div>
          <div className="relative min-h-[260px] bg-mesh-green p-8 sm:p-10">
            <MosqueSilhouette className="absolute bottom-0 end-0 w-2/3 text-primary opacity-15" />
            <div className="relative space-y-3">
              {t.home.spotlightItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm font-medium text-ink shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-arch-fade py-14 text-center text-white">
        <MosqueSilhouette className="absolute bottom-0 left-0 w-full text-white opacity-20" />
        <FadeUp>
          <p className="relative font-display text-2xl italic text-green-50 sm:text-3xl">
            {t.home.ayah}
          </p>
          <p className="relative mt-3 text-sm text-green-100/80">{t.home.ayahRef}</p>
        </FadeUp>
      </section>

      <footer className="border-t border-primary/10 bg-[#0b1f12] text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo variant="dark" showSubtitle />
          <div className="flex flex-wrap gap-5 text-sm">
            <Link href="/" className="hover:text-white">{t.nav.home}</Link>
            <Link href="/listen" className="hover:text-white">{t.nav.listen}</Link>
            <Link href="/about" className="hover:text-white">{t.nav.about}</Link>
            <Link href="/contact" className="hover:text-white">{t.nav.contact}</Link>
            <Link href="/privacy" className="hover:text-white">{t.nav.privacy}</Link>
            <Link href="/terms" className="hover:text-white">{t.nav.terms}</Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} HRMS — {t.home.footerTag}
        </div>
      </footer>
    </div>
  );
}
