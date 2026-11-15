"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  School,
  Shield,
  UserRound,
} from "lucide-react";
import { AppData, Role, SessionUser } from "@/lib/types";
import { getTeacherClasses, getUnassignedStudents } from "@/lib/store";

type HubProps = {
  data: AppData;
  user: SessionUser;
};

function Node({
  label,
  name,
  hint,
  active,
  icon: Icon,
  href,
}: {
  label: string;
  name: string;
  hint: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative rounded-2xl border px-4 py-3 text-center transition ${
        active
          ? "border-gold/50 bg-white shadow-gold ring-1 ring-gold/30"
          : "border-slate-200 bg-white/70 opacity-80"
      }`}
    >
      <div
        className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${
          active ? "bg-gold-fade text-gold-deep" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-ink">{name}</p>
      <p className="mt-0.5 text-[11px] text-ink-mute">{hint}</p>
      {active && (
        <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-4 w-4 text-emerald-600" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block min-w-[8.5rem] flex-1">
        {inner}
      </Link>
    );
  }
  return <div className="min-w-[8.5rem] flex-1">{inner}</div>;
}

function Connector({ ok }: { ok: boolean }) {
  return (
    <div className="hidden items-center px-1 sm:flex">
      <div
        className={`h-0.5 w-8 rounded-full ${
          ok ? "bg-gradient-to-r from-gold to-primary" : "bg-slate-200"
        }`}
      />
      <ArrowRight
        className={`h-3.5 w-3.5 ${ok ? "text-primary" : "text-slate-300"}`}
      />
    </div>
  );
}

export function RoleConnectionHub({ data, user }: HubProps) {
  const admins = data.users.filter((u) => u.role === "admin" && u.active);
  const admin = admins[0];

  if (user.role === "student") {
    const me = data.users.find((u) => u.id === user.id);
    const teacher = data.users.find((u) => u.id === me?.teacherId);
    const linked = !!(me?.classId && teacher);
    return (
      <section className="card-gold mb-6">
        <Header
          title="Your learning circle"
          text={
            linked
              ? "Admin ne class banayi, teacher ne aapko link kiya — ab aap connected ho."
              : "Abhi class link pending hai. Teacher / admin aapko enroll karega."
          }
        />
        <div className="mt-4 flex flex-wrap items-stretch justify-center gap-2">
          <Node
            label="Admin"
            name={admin?.name || "Institute Admin"}
            hint="Sets up classes"
            active={!!admin}
            icon={Shield}
          />
          <Connector ok={!!teacher} />
          <Node
            label="Teacher"
            name={teacher?.name || "Awaiting teacher"}
            hint={teacher ? teacher.email : "Not linked yet"}
            active={!!teacher}
            icon={UserRound}
            href={teacher ? "/dashboard/meetings" : undefined}
          />
          <Connector ok={linked} />
          <Node
            label="You · Student"
            name={me?.name || user.name}
            hint={me?.className || "No class yet"}
            active={linked}
            icon={GraduationCap}
            href="/dashboard/revision"
          />
        </div>
        <Actions
          role="student"
          linked={linked}
          extra={
            linked
              ? [
                  { href: "/dashboard/revision", label: "My tasks" },
                  { href: "/dashboard/meetings", label: "Meet teacher" },
                ]
              : [{ href: "/dashboard/meetings", label: "Browse meetings" }]
          }
        />
      </section>
    );
  }

  if (user.role === "teacher") {
    const classes = getTeacherClasses(data, user.id);
    const students = data.users.filter(
      (u) => u.role === "student" && u.teacherId === user.id && u.active
    );
    const unassigned = getUnassignedStudents(data);
    const linked = classes.length > 0;
    return (
      <section className="card-gold mb-6">
        <Header
          title="Teacher connection hub"
          text="Admin aapko class assign karta hai → aap students link karte ho → tasks & meetings se circle warm rehta hai."
        />
        <div className="mt-4 flex flex-wrap items-stretch justify-center gap-2">
          <Node
            label="Admin"
            name={admin?.name || "Admin"}
            hint="Assigns your classes"
            active={!!admin}
            icon={Shield}
            href="/dashboard/classes"
          />
          <Connector ok={linked} />
          <Node
            label="You · Teacher"
            name={user.name}
            hint={`${classes.length} class · ${students.length} students`}
            active
            icon={UserRound}
          />
          <Connector ok={students.length > 0} />
          <Node
            label="Students"
            name={
              students.length
                ? `${students.slice(0, 2).map((s) => s.name.split(" ")[0]).join(", ")}${students.length > 2 ? "…" : ""}`
                : "Pool waiting"
            }
            hint={
              unassigned.length
                ? `${unassigned.length} unassigned ready`
                : "All linked"
            }
            active={students.length > 0}
            icon={GraduationCap}
            href="/dashboard/students"
          />
        </div>
        <Actions
          role="teacher"
          linked={linked}
          extra={[
            { href: "/dashboard/students", label: "Link students" },
            { href: "/dashboard/revision", label: "Assign tasks" },
            { href: "/dashboard/meetings", label: "Schedule meeting" },
          ]}
        />
      </section>
    );
  }

  // admin
  const teachers = data.users.filter((u) => u.role === "teacher" && u.active);
  const students = data.users.filter((u) => u.role === "student" && u.active);
  const linkedStudents = students.filter((s) => s.classId && s.teacherId);
  const unassigned = getUnassignedStudents(data);
  const classesWithTeacher = data.classes.filter((c) => c.active && c.teacherId);

  return (
    <section className="card-gold mb-6">
      <Header
        title="Institute connection hub"
        text="Aap teeno roles ka bridge ho: class + teacher assign → students enroll → Hifz circle connected."
      />
      <div className="mt-4 flex flex-wrap items-stretch justify-center gap-2">
        <Node
          label="You · Admin"
          name={user.name}
          hint={`${data.classes.filter((c) => c.active).length} classes`}
          active
          icon={Shield}
        />
        <Connector ok={classesWithTeacher.length > 0} />
        <Node
          label="Teachers"
          name={`${teachers.length} active`}
          hint={`${classesWithTeacher.length} leading a class`}
          active={teachers.length > 0}
          icon={School}
          href="/dashboard/teachers"
        />
        <Connector ok={linkedStudents.length > 0} />
        <Node
          label="Students"
          name={`${linkedStudents.length}/${students.length} linked`}
          hint={
            unassigned.length
              ? `${unassigned.length} still unassigned`
              : "Everyone linked"
          }
          active={linkedStudents.length > 0}
          icon={GraduationCap}
          href="/dashboard/students"
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Stat tip="Classes with teacher" value={classesWithTeacher.length} />
        <Stat tip="Linked students" value={linkedStudents.length} />
        <Stat tip="Awaiting enrollment" value={unassigned.length} warn />
      </div>
      <Actions
        role="admin"
        linked
        extra={[
          { href: "/dashboard/classes", label: "Assign class teachers" },
          { href: "/dashboard/students", label: "Link / transfer students" },
          { href: "/dashboard/meetings", label: "Oversee meetings" },
        ]}
      />
    </section>
  );
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
          Connected circle
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{text}</p>
      </div>
      <span className="rounded-full border border-gold/40 bg-gold-fade px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-deep">
        Friendly link
      </span>
    </div>
  );
}

function Actions({
  extra,
}: {
  role: Role;
  linked: boolean;
  extra: { href: string; label: string }[];
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {extra.map((a) => (
        <Link
          key={a.href + a.label}
          href={a.href}
          className="rounded-full border border-gold/40 bg-white px-3.5 py-1.5 text-xs font-semibold text-gold-deep transition hover:bg-gold-fade"
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}

function Stat({
  tip,
  value,
  warn,
}: {
  tip: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white/80 px-3 py-2.5">
      <p className="text-[11px] text-ink-mute">{tip}</p>
      <p
        className={`text-xl font-bold ${
          warn && value > 0 ? "text-amber-600" : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
