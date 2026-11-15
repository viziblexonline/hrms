"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressRing } from "@/components/ProgressRing";
import { MosqueSilhouette } from "@/components/MosqueArt";
import { GoldenGesture } from "@/components/GoldenGesture";
import { RoleConnectionHub } from "@/components/RoleConnectionHub";
import { useAuth } from "@/lib/auth-context";
import {
  categoryLabel,
  getData,
  getStudentProgress,
  getTeacherClasses,
  getUnassignedStudents,
} from "@/lib/store";
import { AppData, SessionUser } from "@/lib/types";
import { AnimatedCard, FadeUp, motion } from "@/components/motion";

export default function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const load = () => setData(getData());
    load();
    window.addEventListener("hrms-data-updated", load);
    return () => window.removeEventListener("hrms-data-updated", load);
  }, []);

  if (!user || !data) {
    return <div className="text-slate-500">Loading...</div>;
  }

  if (user.role === "student") {
    return (
      <StudentDashboard data={data} user={user} userId={user.id} name={user.name} />
    );
  }
  if (user.role === "teacher") {
    return <TeacherDashboard data={data} user={user} teacherId={user.id} />;
  }
  return <AdminDashboard data={data} user={user} />;
}

function StudentDashboard({
  data,
  user,
  userId,
  name,
}: {
  data: AppData;
  user: SessionUser;
  userId: string;
  name: string;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when data snapshot changes
  const progress = useMemo(() => getStudentProgress(userId), [userId, data]);
  const me = data.users.find((u) => u.id === userId);
  const teacher = data.users.find((u) => u.id === me?.teacherId);
  const tasks = data.revisions
    .filter((r) => r.studentId === userId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const stats = [
    {
      label: "Memorized Surahs",
      value: progress.memorizedSurahs,
      icon: BookOpen,
      hint: "of recorded portions",
    },
    {
      label: "Revision Pending",
      value: progress.pendingTasks,
      icon: CalendarClock,
      hint: "tasks due soon",
    },
    {
      label: "Assessments",
      value: progress.assessmentCount,
      icon: ClipboardList,
      hint: `avg score ${progress.avgScore}%`,
    },
    {
      label: "Overall Progress",
      value: `${progress.overallProgress}%`,
      icon: TrendingUp,
      hint: "based on records",
    },
  ];

  return (
    <div>
      <TopBar />

      <div className="mb-5">
        <GoldenGesture
          title={`Assalamu Alaikum, ${name.split(" ")[0]}`}
          subtitle={
            teacher
              ? `Aapke teacher ${teacher.name} aapke saath connected hain — har ayah ek golden step.`
              : "Golden gesture: jab class link ho, teacher aapke journey ka hissa ban jaate hain."
          }
        />
      </div>

      <RoleConnectionHub data={data} user={user} />

      <motion.div
        className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-gold/20 bg-arch-fade px-6 py-8 text-white shadow-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MosqueSilhouette className="absolute bottom-0 right-0 w-2/3 text-white opacity-20" />
        <div className="pointer-events-none absolute inset-0 shimmer-gold opacity-20" />
        <div className="relative max-w-xl">
          <p className="font-display text-xl italic text-green-50">
            Keep going, every Ayah brings you closer to your goal.
          </p>
          <p className="mt-2 text-sm text-green-100/80">
            Your Hifz journey continues with HRMS
            {me?.className ? ` · ${me.className}` : ""}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/progress" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:scale-[1.02]">
              View Progress
            </Link>
            <Link href="/dashboard/revision" className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-bright transition hover:bg-gold/20">
              Revision Tasks
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <AnimatedCard key={s.label} delay={i * 0.07} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
                </div>
                <motion.div
                  className="rounded-xl bg-primary-soft p-2.5 text-primary"
                  whileHover={{ rotate: -8, scale: 1.08 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <FadeUp className="card lg:col-span-3" delay={0.1}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Revision</h2>
            <Link href="/dashboard/revision" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-medium">Surah / Ayah</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800">
                      {t.surah} ({t.ayahFrom}-{t.ayahTo})
                    </td>
                    <td className="py-3 text-slate-600">{t.dueDate}</td>
                    <td className="py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No revision tasks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </FadeUp>

        <FadeUp className="card lg:col-span-2" delay={0.18}>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Progress Overview</h2>
          <div className="flex justify-center">
            <ProgressRing value={progress.overallProgress} label="Hifz Progress" />
          </div>
          <div className="mt-6 space-y-3">
            <Bar label="Memorization" value={progress.memorizationPct} />
            <Bar label="Revision" value={progress.revisionPct} />
            <Bar label="Assessments" value={progress.assessmentPct} />
          </div>
        </FadeUp>
      </div>

      <FadeUp className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary-soft px-5 py-5 text-center" delay={0.25}>
        <p className="font-display text-lg italic text-primary">
          “And We have certainly made the Qur’an easy for remembrance…” — Al-Qamar 54:17
        </p>
      </FadeUp>
    </div>
  );
}

function TeacherDashboard({
  data,
  user,
  teacherId,
}: {
  data: AppData;
  user: SessionUser;
  teacherId: string;
}) {
  const myClasses = getTeacherClasses(data, teacherId);
  const students = data.users.filter(
    (u) => u.role === "student" && u.teacherId === teacherId && u.active
  );
  const pending = data.revisions.filter(
    (r) =>
      students.some((s) => s.id === r.studentId) &&
      (r.status === "pending" || r.status === "upcoming")
  );
  const recentAssessments = data.assessments
    .filter((a) => a.teacherId === teacherId)
    .slice(-5)
    .reverse();
  const unassigned = getUnassignedStudents(data);

  return (
    <div>
      <TopBar
        title="Teacher Dashboard"
        subtitle="Warm circle: admin → your classes → linked students"
      />
      <div className="mb-5">
        <GoldenGesture
          title={`JazakAllah, Ustadh ${user.name.split(" ")[0]}`}
          subtitle={`${students.length} students aapke saath connected · ${pending.length} open revision tasks`}
        />
      </div>
      <RoleConnectionHub data={data} user={user} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/students" className="btn-primary !px-4 !py-2 text-sm">
          Link students
        </Link>
        <Link href="/dashboard/revision" className="btn-gold !px-4 !py-2 text-sm">
          Assign / edit tasks
        </Link>
        <Link href="/dashboard/classes" className="btn-secondary !px-4 !py-2 text-sm">
          My classes
        </Link>
        <Link href="/dashboard/meetings" className="btn-secondary !px-4 !py-2 text-sm">
          Meet students
        </Link>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Classes" value={myClasses.length} />
        <StatCard label="Linked Students" value={students.length} />
        <StatCard label="Open Revision Tasks" value={pending.length} />
        <StatCard
          label="Unassigned Pool"
          value={unassigned.length}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {myClasses.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id);
          return (
            <div key={cls.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{cls.name}</h2>
                  <p className="text-xs text-slate-500">
                    {categoryLabel(cls.category)} • {classStudents.length}/
                    {cls.maxStudents} students
                  </p>
                </div>
                <Link
                  href="/dashboard/classes"
                  className="text-sm font-semibold text-primary"
                >
                  Manage
                </Link>
              </div>
              <div className="space-y-2">
                {classStudents.map((s) => {
                  const p = getStudentProgress(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500">{s.email}</div>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {p.overallProgress}%
                      </div>
                    </div>
                  );
                })}
                {classStudents.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No students yet — select from unassigned pool in Classes.
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {myClasses.length === 0 && (
          <div className="card text-sm text-slate-500 lg:col-span-2">
            Admin has not assigned you as a class teacher yet.
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Select Students</h2>
            <Link href="/dashboard/classes" className="text-sm font-semibold text-primary">
              Open Classes
            </Link>
          </div>
          <p className="mb-3 text-sm text-slate-500">
            Unassigned students available to enroll (max 50 per class):
          </p>
          <div className="space-y-2">
            {unassigned.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{s.name}</span>
                <span className="ml-2 text-xs text-slate-400">{s.email}</span>
              </div>
            ))}
            {unassigned.length === 0 && (
              <p className="text-sm text-slate-400">No unassigned students.</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Assessments</h2>
            <Link href="/dashboard/assessments" className="text-sm font-semibold text-primary">
              Open
            </Link>
          </div>
          <div className="space-y-3">
            {recentAssessments.map((a) => {
              const student = data.users.find((u) => u.id === a.studentId);
              return (
                <div key={a.id} className="rounded-xl border border-slate-100 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800">
                      {student?.name || "Student"}
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {a.score}% ({a.grade})
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {a.surah} {a.ayahFrom}-{a.ayahTo} • {a.date}
                  </div>
                </div>
              );
            })}
            {recentAssessments.length === 0 && (
              <p className="text-sm text-slate-400">No assessments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({
  data,
  user,
}: {
  data: AppData;
  user: SessionUser;
}) {
  const students = data.users.filter((u) => u.role === "student");
  const teachers = data.users.filter((u) => u.role === "teacher");
  const unassigned = getUnassignedStudents(data);
  const classes = data.classes.filter((c) => c.active);
  const linked = students.filter((s) => s.classId && s.teacherId).length;

  return (
    <div>
      <TopBar
        title="Administrator Dashboard"
        subtitle="Keep Admin → Teacher → Student warmly connected"
      />
      <div className="mb-5">
        <GoldenGesture
          title={`Welcome, ${user.name.split(" ")[0]}`}
          subtitle={`${linked}/${students.length} students linked · ${teachers.length} teachers · aapka golden role: circle ko jorna`}
        />
      </div>
      <RoleConnectionHub data={data} user={user} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={data.users.length} />
        <StatCard label="Students" value={students.length} />
        <StatCard label="Teachers" value={teachers.length} />
        <StatCard label="Classes" value={classes.length} />
        <StatCard label="Unassigned Students" value={unassigned.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Link href="/dashboard/classes" className="card-gold hover:shadow-gold">
          <h3 className="font-bold text-slate-900">Classes & Class Teachers</h3>
          <p className="mt-2 text-sm text-slate-500">
            Create category classes and assign which teacher leads each class.
          </p>
        </Link>
        <Link href="/dashboard/users" className="card hover:shadow-md">
          <h3 className="font-bold text-slate-900">User Management</h3>
          <p className="mt-2 text-sm text-slate-500">
            Create, update, and deactivate student/teacher accounts. View everyone.
          </p>
        </Link>
        <Link href="/dashboard/students" className="card-gold hover:shadow-gold">
          <h3 className="font-bold text-slate-900">Link Students ↔ Teachers</h3>
          <p className="mt-2 text-sm text-slate-500">
            Enroll, transfer, and keep every student warmly connected to a teacher.
          </p>
        </Link>
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 text-lg font-bold">All Classes Overview</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {classes.map((cls) => {
            const teacher = data.users.find((u) => u.id === cls.teacherId);
            const count = data.users.filter(
              (u) => u.role === "student" && u.classId === cls.id && u.active
            ).length;
            return (
              <div
                key={cls.id}
                className="rounded-xl border border-slate-100 px-3 py-3 text-sm"
              >
                <div className="font-semibold text-slate-900">{cls.name}</div>
                <div className="text-xs text-slate-500">
                  {categoryLabel(cls.category)} • Teacher:{" "}
                  {teacher?.name || "Not assigned"} • {count}/{cls.maxStudents}{" "}
                  students
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card mt-6">
        <h2 className="mb-4 text-lg font-bold">System Snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl bg-primary-soft p-4">
            <div className="text-2xl font-bold text-primary">{data.memorization.length}</div>
            <div className="text-slate-600">Memorization records</div>
          </div>
          <div className="rounded-xl bg-primary-soft p-4">
            <div className="text-2xl font-bold text-primary">{data.revisions.length}</div>
            <div className="text-slate-600">Revision tasks</div>
          </div>
          <div className="rounded-xl bg-primary-soft p-4">
            <div className="text-2xl font-bold text-primary">{data.assessments.length}</div>
            <div className="text-slate-600">Assessments</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-2 rounded-full bg-primary"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, value)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
