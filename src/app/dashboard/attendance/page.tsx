"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, ShieldAlert, UserX } from "lucide-react";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  getAttendanceForClassDate,
  getAttendanceStats,
  getStudentAttendance,
  getStudentsInClass,
  getTeacherClasses,
  getData,
  saveClassAttendance,
  todayDateKey,
} from "@/lib/store";
import {
  AppData,
  AttendanceStatus,
  ClassRoom,
} from "@/lib/types";
import clsx from "clsx";

const STATUS_OPTIONS: {
  id: AttendanceStatus;
  label: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "present",
    label: "Present",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Check,
  },
  {
    id: "late",
    label: "Late",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock3,
  },
  {
    id: "absent",
    label: "Absent",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
    icon: UserX,
  },
  {
    id: "excused",
    label: "Excused",
    tone: "bg-sky-50 text-sky-800 border-sky-200",
    icon: ShieldAlert,
  },
];

type MarkRow = {
  studentId: string;
  status: AttendanceStatus;
  notes: string;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [date, setDate] = useState(todayDateKey());
  const [classId, setClassId] = useState("");
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => setData(getData());

  useEffect(() => {
    reload();
    window.addEventListener("hrms-data-updated", reload);
    return () => window.removeEventListener("hrms-data-updated", reload);
  }, []);

  const classes = useMemo(() => {
    if (!data || !user) return [] as ClassRoom[];
    if (user.role === "teacher") return getTeacherClasses(data, user.id);
    if (user.role === "admin") return data.classes.filter((c) => c.active);
    return [] as ClassRoom[];
  }, [data, user]);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (!data || !classId) {
      setMarks([]);
      return;
    }
    const students = getStudentsInClass(data, classId);
    const existing = getAttendanceForClassDate(data, classId, date);
    setMarks(
      students.map((s) => {
        const row = existing.find((a) => a.studentId === s.id);
        return {
          studentId: s.id,
          status: row?.status || "present",
          notes: row?.notes || "",
        };
      })
    );
  }, [data, classId, date]);

  const stats = useMemo(() => getAttendanceStats(
    marks.map((m) => ({
      id: m.studentId,
      classId,
      studentId: m.studentId,
      teacherId: user?.id || "",
      date,
      status: m.status,
      markedAt: "",
    }))
  ), [marks, classId, date, user?.id]);

  if (!user || !data) {
    return <div className="text-slate-500">Loading...</div>;
  }

  if (user.role === "student") {
    const mine = getStudentAttendance(data, user.id);
    const mineStats = getAttendanceStats(mine);
    return (
      <div>
        <TopBar
          title="My Attendance"
          subtitle="Daily presence marked by your class teacher"
        />
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {(
            [
              ["Present", mineStats.present, "text-emerald-700"],
              ["Late", mineStats.late, "text-amber-700"],
              ["Absent", mineStats.absent, "text-rose-700"],
              ["Excused", mineStats.excused, "text-sky-700"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="card py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="card overflow-x-auto">
          {mine.length === 0 ? (
            <p className="text-sm text-slate-500">No attendance marked yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Class</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((row) => {
                  const room = data.classes.find((c) => c.id === row.classId);
                  const opt = STATUS_OPTIONS.find((s) => s.id === row.status);
                  return (
                    <tr key={row.id} className="border-b border-slate-50">
                      <td className="py-3 font-medium text-slate-800">{row.date}</td>
                      <td className="py-3 text-slate-600">{room?.name || "—"}</td>
                      <td className="py-3">
                        <span
                          className={clsx(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            opt?.tone
                          )}
                        >
                          {opt?.label}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{row.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  const students = classId ? getStudentsInClass(data, classId) : [];
  const selectedClass = classes.find((c) => c.id === classId);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) =>
      prev.map((m) => (m.studentId === studentId ? { ...m, status } : m))
    );
  };

  const setNotes = (studentId: string, notes: string) => {
    setMarks((prev) =>
      prev.map((m) => (m.studentId === studentId ? { ...m, notes } : m))
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setMarks((prev) => prev.map((m) => ({ ...m, status })));
  };

  const onSave = () => {
    if (!classId) {
      setMessage("Select a class first.");
      return;
    }
    setSaving(true);
    const result = saveClassAttendance({
      classId,
      teacherId: user.id,
      date,
      marks: marks.map((m) => ({
        studentId: m.studentId,
        status: m.status,
        notes: m.notes,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(
      `Attendance saved for ${selectedClass?.name || "class"} · ${date} (${result.count} students).`
    );
  };

  return (
    <div>
      <TopBar
        title="Class Attendance"
        subtitle="Mark daily presence for each of your classes — present, late, absent, or excused"
      />

      <div className="card mb-6 grid gap-4 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Class</span>
          <select
            className="input-base"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.length === 0 && <option value="">No classes assigned</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            className="input-base"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            className="btn-secondary !px-3 !py-2 text-xs"
            onClick={() => markAll("present")}
          >
            All present
          </button>
          <button
            type="button"
            className="btn-primary !px-4 !py-2"
            disabled={saving || !students.length}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save attendance"}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {(
          [
            ["Present", stats.present, "border-emerald-200 bg-emerald-50 text-emerald-800"],
            ["Late", stats.late, "border-amber-200 bg-amber-50 text-amber-800"],
            ["Absent", stats.absent, "border-rose-200 bg-rose-50 text-rose-800"],
            ["Excused", stats.excused, "border-sky-200 bg-sky-50 text-sky-800"],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className={clsx("rounded-2xl border px-4 py-3", tone)}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {selectedClass?.name || "Select class"} · {date}
          </h2>
          <p className="text-xs text-slate-500">
            {students.length} students · linked via Classes
          </p>
        </div>

        {students.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No students enrolled in this class yet. Open{" "}
            <a href="/dashboard/students" className="font-semibold text-primary">
              Students
            </a>{" "}
            to enroll, then mark attendance here.
          </p>
        ) : (
          students.map((student) => {
            const mark = marks.find((m) => m.studentId === student.id);
            return (
              <div
                key={student.id}
                className="rounded-2xl border border-primary/10 bg-primary-mist/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = mark?.status === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setStatus(student.id, opt.id)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? opt.tone + " ring-2 ring-offset-1 ring-primary/20"
                              : "border-slate-200 bg-white text-slate-500 hover:border-primary/30"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  className="input-base mt-3 bg-white"
                  placeholder="Optional note (reason for late / excused…)"
                  value={mark?.notes || ""}
                  onChange={(e) => setNotes(student.id, e.target.value)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
