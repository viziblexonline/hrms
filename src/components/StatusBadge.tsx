"use client";

import { TaskStatus } from "@/lib/types";
import clsx from "clsx";
import { motion } from "framer-motion";

const styles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  upcoming: "bg-sky-50 text-sky-700 border-sky-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StatusBadge({
  status,
}: {
  status: TaskStatus | "active" | "inactive" | string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {status}
    </motion.span>
  );
}
