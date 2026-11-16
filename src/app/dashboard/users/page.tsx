"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { getData, saveData, updateUser } from "@/lib/store";
import { isStrongPassword, WEAK_PASSWORD_ALERT } from "@/lib/password";
import {
  fetchAllProfiles,
  mergeProfilesIntoUsers,
} from "@/lib/supabase/sync";
import { AppData, Role, User } from "@/lib/types";

const defaultPasswordFor = (role: Role) =>
  role === "teacher" ? "Teacher@123" : role === "admin" ? "Admin@123" : "Student@123";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: defaultPasswordFor("student"),
    role: "student" as Role,
    phone: "",
    className: "",
  });

  const reload = () => setData(getData());

  const syncFromProfiles = async () => {
    const local = getData();
    const profiles = await fetchAllProfiles();
    if (profiles.length === 0) {
      setData(local);
      return;
    }
    const merged = {
      ...local,
      users: mergeProfilesIntoUsers(local.users, profiles),
    };
    saveData(merged);
    setData(merged);
  };

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    void syncFromProfiles();
    const onUpdate = () => reload();
    window.addEventListener("hrms-data-updated", onUpdate);
    return () => window.removeEventListener("hrms-data-updated", onUpdate);
  }, []);

  if (!user || !data || user.role !== "admin") {
    return <div className="text-slate-500">Loading...</div>;
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!isStrongPassword(form.password)) {
      setError(WEAK_PASSWORD_ALERT);
      return;
    }
    if (data.users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError("Email already exists in HRMS.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/admin-create-user", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
        className: form.className.trim(),
      }),
    }).catch(() => null);
    setLoading(false);

    const json = (await res?.json().catch(() => null)) as
      | {
          ok?: boolean;
          error?: string;
          userId?: string;
        }
      | null;

    if (!res?.ok || !json?.ok) {
      setError(json?.error || "Could not create login account.");
      return;
    }

    const next: User = {
      id: json.userId || `u-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim() || undefined,
      className: form.className.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveData({ ...data, users: [...data.users, next] });
    setMessage(
      `${form.role === "teacher" ? "Teacher" : form.role === "admin" ? "Admin" : "Student"} created. They can log in with this email/password.`
    );
    setForm({
      name: "",
      email: "",
      password: defaultPasswordFor("student"),
      role: "student",
      phone: "",
      className: "",
    });
  };

  return (
    <div>
      <TopBar
        title="User Management"
        subtitle="Signup + admin-created teachers/students appear here"
      />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => void syncFromProfiles()}
        >
          Refresh from signups
        </button>
      </div>

      <form onSubmit={onCreate} className="card mb-6 grid gap-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-lg font-bold">Create Teacher / Student</h2>
        <input
          className="input-base"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input-base"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input-base"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <select
          className="input-base"
          value={form.role}
          onChange={(e) => {
            const role = e.target.value as Role;
            setForm({
              ...form,
              role,
              password: defaultPasswordFor(role),
            });
          }}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Administrator</option>
        </select>
        <input
          className="input-base"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="input-base"
          placeholder="Class name (optional)"
          value={form.className}
          onChange={(e) => setForm({ ...form, className: e.target.value })}
        />
        <div className="md:col-span-3">
          <p className="mb-2 text-xs text-slate-500">
            Password needs 8+ chars with upper, lower, number, and special character.
            Defaults: Student@123 / Teacher@123 / Admin@123
          </p>
          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          {message && <p className="mb-3 text-sm text-primary">{message}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Class</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="py-3">
                  <div className="font-semibold text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="py-3 capitalize text-slate-600">{u.role}</td>
                <td className="py-3 text-slate-600">{u.className || "—"}</td>
                <td className="py-3">
                  <StatusBadge status={u.active ? "active" : "inactive"} />
                </td>
                <td className="py-3">
                  <button
                    disabled={u.id === user.id}
                    onClick={() => updateUser(u.id, { active: !u.active })}
                    className="text-sm font-semibold text-primary hover:underline disabled:opacity-40"
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
