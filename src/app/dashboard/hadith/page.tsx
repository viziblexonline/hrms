"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/dashboard/TopBar";
import { HadithReader } from "@/components/HadithReader";
import { FadeUp } from "@/components/motion";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export default function DashboardHadithPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "teacher") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "teacher") {
    return (
      <div className="py-16 text-center text-sm text-ink-mute">
        {t.common.loading}
      </div>
    );
  }

  return (
    <div>
      <TopBar title={t.hadith.title} subtitle={t.hadith.subtitle} />
      <FadeUp>
        <HadithReader />
      </FadeUp>
    </div>
  );
}
