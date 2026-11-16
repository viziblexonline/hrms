import { SEED_DATA } from "./seed";
import {
  findMeetingConflicts,
  formatMeetingWindow,
  suggestFreeMeetingSlots,
} from "./meetings";
import {
  AppData,
  Assessment,
  ClassCategory,
  ClassRoom,
  ContactMessage,
  MAX_CLASS_SIZE,
  MemorizationRecord,
  MeetingProvider,
  MeetingStatus,
  OnlineMeeting,
  RevisionTask,
  SessionUser,
  TaskStatus,
  User,
} from "./types";

export {
  findMeetingConflicts,
  suggestFreeMeetingSlots,
  formatMeetingWindow,
  toDatetimeLocalValue,
} from "./meetings";

const DATA_KEY = "hrms_data_v3";
const SESSION_KEY = "hrms_session_v1";

function cloneSeed(): AppData {
  return JSON.parse(JSON.stringify(SEED_DATA)) as AppData;
}

function normalizeData(raw: Partial<AppData> | null): AppData {
  const seed = cloneSeed();
  if (!raw || !Array.isArray(raw.users)) return seed;

  const classes: ClassRoom[] = Array.isArray(raw.classes)
    ? raw.classes.map((c) => ({
        ...c,
        maxStudents: c.maxStudents || MAX_CLASS_SIZE,
      }))
    : seed.classes;

  const users = raw.users.map((u) => {
    if (u.role !== "student") return u;
    if (u.classId) {
      const cls = classes.find((c) => c.id === u.classId);
      if (cls) {
        return {
          ...u,
          className: cls.name,
          teacherId: cls.teacherId,
        };
      }
    }
    if (u.className && !u.classId) {
      const cls = classes.find((c) => c.name === u.className);
      if (cls) {
        return {
          ...u,
          classId: cls.id,
          teacherId: cls.teacherId || u.teacherId,
        };
      }
    }
    return u;
  });

  return {
    users,
    classes,
    memorization: raw.memorization || [],
    revisions: raw.revisions || [],
    assessments: raw.assessments || [],
    messages: raw.messages || [],
    meetings:
      Array.isArray(raw.meetings) && raw.meetings.length
        ? raw.meetings
        : seed.meetings,
  };
}

export function getData(): AppData {
  if (typeof window === "undefined") return cloneSeed();

  for (const key of [DATA_KEY, "hrms_data_v2", "hrms_data_v1"]) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const migrated = normalizeData(JSON.parse(raw) as AppData);
      localStorage.setItem(DATA_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      /* try next */
    }
  }

  const seed = cloneSeed();
  localStorage.setItem(DATA_KEY, JSON.stringify(seed));
  return seed;
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("hrms-data-updated"));
  // Cloud sync when Supabase is configured (fire-and-forget)
  void import("./supabase/config").then(({ isSupabaseConfigured }) => {
    if (!isSupabaseConfigured()) return;
    void import("./supabase/sync").then(({ pushAppDataToSupabase }) => {
      void pushAppDataToSupabase(data);
    });
  });
}

export function resetData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("hrms_data_v1");
    localStorage.removeItem("hrms_data_v2");
  }
  const seed = cloneSeed();
  saveData(seed);
  return seed;
}

export function getJitsiEmbedUrl(roomCode: string, displayName?: string) {
  const room = encodeURIComponent(roomCode.replace(/\s+/g, "-"));
  const user = displayName
    ? `#userInfo.displayName="${encodeURIComponent(displayName)}"`
    : "";
  return `https://meet.jit.si/${room}${user}`;
}

export function createMeeting(input: {
  title: string;
  description?: string;
  hostId: string;
  classId?: string;
  studentIds?: string[];
  provider: MeetingProvider;
  roomCode?: string;
  externalUrl?: string;
  scheduledAt: string;
  durationMins: number;
  forInternational?: boolean;
  /** If true, still create even when conflicts exist (not recommended). */
  force?: boolean;
}):
  | { ok: true; meeting: OnlineMeeting }
  | {
      ok: false;
      error: string;
      conflicts?: ReturnType<typeof findMeetingConflicts>;
      suggestions?: ReturnType<typeof suggestFreeMeetingSlots>;
    } {
  const data = getData();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Meeting title is required." };
  if (input.provider !== "jitsi" && !input.externalUrl?.trim()) {
    return {
      ok: false,
      error: "Please paste a Zoom or Google Meet link for this provider.",
    };
  }

  const durationMins = input.durationMins || 45;
  const conflicts = findMeetingConflicts(data, {
    scheduledAt: input.scheduledAt,
    durationMins,
    classId: input.classId,
    studentIds: input.studentIds,
    hostId: input.hostId,
  });

  if (conflicts.length > 0 && !input.force) {
    const first = conflicts[0];
    const window = formatMeetingWindow(
      first.meeting.scheduledAt,
      first.meeting.durationMins
    );
    const who =
      first.studentNames.length > 0
        ? first.studentNames.join(", ")
        : `Host ${first.hostName}`;
    const suggestions = suggestFreeMeetingSlots(
      data,
      {
        scheduledAt: input.scheduledAt,
        durationMins,
        classId: input.classId,
        studentIds: input.studentIds,
        hostId: input.hostId,
      },
      conflicts
    );
    return {
      ok: false,
      error: `Time clash: ${who} pehle se booked hain — "${first.meeting.title}" (${window.rangeLabel}, host: ${first.hostName}). Please pehle/baad ka free slot choose karein.`,
      conflicts,
      suggestions,
    };
  }

  const meeting: OnlineMeeting = {
    id: `mtg-${Date.now()}`,
    title,
    description: input.description?.trim() || undefined,
    hostId: input.hostId,
    classId: input.classId || undefined,
    studentIds:
      input.studentIds && input.studentIds.length
        ? Array.from(new Set(input.studentIds))
        : undefined,
    provider: input.provider,
    roomCode:
      input.roomCode?.trim().replace(/\s+/g, "-") ||
      `HRMS-${Date.now().toString(36).toUpperCase()}`,
    externalUrl: input.externalUrl?.trim() || undefined,
    scheduledAt: input.scheduledAt,
    durationMins,
    forInternational: !!input.forInternational,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  data.meetings.unshift(meeting);
  saveData(data);
  return { ok: true, meeting };
}

export function updateMeeting(
  id: string,
  patch: Partial<
    Pick<
      OnlineMeeting,
      | "title"
      | "description"
      | "classId"
      | "studentIds"
      | "provider"
      | "roomCode"
      | "externalUrl"
      | "scheduledAt"
      | "durationMins"
      | "forInternational"
      | "status"
    >
  >,
  options?: { hostId?: string; force?: boolean }
):
  | { ok: true; meeting: OnlineMeeting }
  | {
      ok: false;
      error: string;
      conflicts?: ReturnType<typeof findMeetingConflicts>;
      suggestions?: ReturnType<typeof suggestFreeMeetingSlots>;
    } {
  const data = getData();
  const meeting = data.meetings.find((m) => m.id === id);
  if (!meeting) return { ok: false, error: "Meeting not found." };

  const next = { ...meeting, ...patch };
  const conflicts = findMeetingConflicts(data, {
    scheduledAt: next.scheduledAt,
    durationMins: next.durationMins,
    classId: next.classId,
    studentIds: next.studentIds,
    hostId: options?.hostId || next.hostId,
    excludeMeetingId: id,
  });

  if (conflicts.length > 0 && !options?.force) {
    const first = conflicts[0];
    const window = formatMeetingWindow(
      first.meeting.scheduledAt,
      first.meeting.durationMins
    );
    const suggestions = suggestFreeMeetingSlots(
      data,
      {
        scheduledAt: next.scheduledAt,
        durationMins: next.durationMins,
        classId: next.classId,
        studentIds: next.studentIds,
        hostId: options?.hostId || next.hostId,
        excludeMeetingId: id,
      },
      conflicts
    );
    return {
      ok: false,
      error: `Reschedule clash: student/host already booked during ${window.rangeLabel} ("${first.meeting.title}").`,
      conflicts,
      suggestions,
    };
  }

  Object.assign(meeting, patch);
  saveData(data);
  return { ok: true, meeting };
}

export function updateMeetingStatus(id: string, status: MeetingStatus) {
  const data = getData();
  const m = data.meetings.find((x) => x.id === id);
  if (!m) return null;
  m.status = status;
  saveData(data);
  return m;
}

export function deleteMeeting(id: string) {
  const data = getData();
  data.meetings = data.meetings.filter((m) => m.id !== id);
  saveData(data);
}

export function getVisibleMeetings(
  data: AppData,
  userId: string,
  role: User["role"]
) {
  if (role === "admin") return data.meetings;
  if (role === "teacher") {
    const myClassIds = new Set(
      data.classes.filter((c) => c.teacherId === userId).map((c) => c.id)
    );
    const myStudentIds = new Set(
      data.users
        .filter((u) => u.role === "student" && u.teacherId === userId)
        .map((u) => u.id)
    );
    return data.meetings.filter(
      (m) =>
        m.hostId === userId ||
        (m.classId && myClassIds.has(m.classId)) ||
        (m.studentIds || []).some((id) => myStudentIds.has(id)) ||
        m.forInternational
    );
  }
  const me = data.users.find((u) => u.id === userId);
  return data.meetings.filter((m) => {
    if (m.studentIds?.includes(userId)) return true;
    if (m.forInternational) return true;
    if (!m.classId && !m.studentIds?.length) return true;
    return me?.classId === m.classId;
  });
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (!user) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("hrms-session-updated"));
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    teacherId: user.teacherId,
    classId: user.classId,
    className: user.className,
  };
}

export function login(email: string, password: string): SessionUser | null {
  const data = getData();
  const user = data.users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.active
  );
  if (!user) return null;
  const session = toSessionUser(user);
  setSession(session);
  return session;
}

export function logout() {
  setSession(null);
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  phone?: string;
}): { ok: true; user: SessionUser } | { ok: false; error: string } {
  const data = getData();
  if (input.role === "admin") {
    return {
      ok: false,
      error: "Admin accounts cannot be created from signup. Contact your institute.",
    };
  }
  if (input.role !== "student" && input.role !== "teacher") {
    return { ok: false, error: "Please choose Student or Teacher." };
  }
  if (data.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const user: User = {
    id: `u-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    phone: input.phone,
    active: true,
    createdAt: new Date().toISOString(),
  };
  // New students start unassigned until a teacher/admin enrolls them
  data.users.push(user);
  saveData(data);
  const session = toSessionUser(user);
  setSession(session);
  return { ok: true, user: session };
}

export function updateUser(id: string, patch: Partial<User>) {
  const data = getData();
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  data.users[idx] = { ...data.users[idx], ...patch, id };
  saveData(data);
  return data.users[idx];
}

/** Add/update a user in the shared directory (signup → admin Users list) */
export function upsertDirectoryUser(input: {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  phone?: string;
  className?: string;
  classId?: string;
  teacherId?: string;
  password?: string;
  active?: boolean;
}): User {
  const data = getData();
  const email = input.email.trim().toLowerCase();
  const idx = data.users.findIndex((u) => u.email.toLowerCase() === email);
  const next: User = {
    id: input.id,
    name: input.name.trim(),
    email,
    password: input.password || (idx >= 0 ? data.users[idx].password : ""),
    role: input.role,
    phone: input.phone,
    className: input.className,
    classId: input.classId,
    teacherId: input.teacherId,
    active: input.active !== false,
    createdAt:
      idx >= 0 ? data.users[idx].createdAt : new Date().toISOString(),
  };
  if (idx >= 0) data.users[idx] = { ...data.users[idx], ...next };
  else data.users.push(next);
  saveData(data);
  return next;
}

export function getClassStudentCount(data: AppData, classId: string) {
  return data.users.filter(
    (u) => u.role === "student" && u.classId === classId && u.active
  ).length;
}

export function getStudentsInClass(data: AppData, classId: string) {
  return data.users.filter(
    (u) => u.role === "student" && u.classId === classId && u.active
  );
}

export function getUnassignedStudents(data: AppData) {
  return data.users.filter(
    (u) => u.role === "student" && u.active && !u.classId
  );
}

export function getTeacherClasses(data: AppData, teacherId: string) {
  return data.classes.filter((c) => c.active && c.teacherId === teacherId);
}

export function createClass(input: {
  name: string;
  category: ClassCategory;
  teacherId?: string;
}): { ok: true; class: ClassRoom } | { ok: false; error: string } {
  const data = getData();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Class name is required." };
  if (data.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "A class with this name already exists." };
  }
  if (input.teacherId) {
    const teacher = data.users.find(
      (u) => u.id === input.teacherId && u.role === "teacher" && u.active
    );
    if (!teacher) return { ok: false, error: "Selected teacher not found." };
  }

  const room: ClassRoom = {
    id: `c-${Date.now()}`,
    name,
    category: input.category,
    teacherId: input.teacherId,
    maxStudents: MAX_CLASS_SIZE,
    active: true,
    createdAt: new Date().toISOString(),
  };
  data.classes.push(room);

  if (input.teacherId) {
    const teacher = data.users.find((u) => u.id === input.teacherId);
    if (teacher) teacher.className = room.name;
  }

  saveData(data);
  return { ok: true, class: room };
}

export function assignClassTeacher(
  classId: string,
  teacherId: string | ""
): { ok: true } | { ok: false; error: string } {
  const data = getData();
  const cls = data.classes.find((c) => c.id === classId);
  if (!cls) return { ok: false, error: "Class not found." };

  if (!teacherId) {
    cls.teacherId = undefined;
    data.users.forEach((u) => {
      if (u.role === "student" && u.classId === classId) {
        u.teacherId = undefined;
      }
    });
    saveData(data);
    return { ok: true };
  }

  const teacher = data.users.find(
    (u) => u.id === teacherId && u.role === "teacher" && u.active
  );
  if (!teacher) return { ok: false, error: "Teacher not found." };

  cls.teacherId = teacherId;
  teacher.className = cls.name;

  data.users.forEach((u) => {
    if (u.role === "student" && u.classId === classId) {
      u.teacherId = teacherId;
      u.className = cls.name;
    }
  });

  saveData(data);
  return { ok: true };
}

export function enrollStudentInClass(
  studentId: string,
  classId: string
): { ok: true } | { ok: false; error: string } {
  const data = getData();
  const student = data.users.find(
    (u) => u.id === studentId && u.role === "student" && u.active
  );
  if (!student) return { ok: false, error: "Student not found." };

  const cls = data.classes.find((c) => c.id === classId && c.active);
  if (!cls) return { ok: false, error: "Class not found." };
  if (!cls.teacherId) {
    return {
      ok: false,
      error: "Assign a class teacher first before enrolling students.",
    };
  }

  if (student.classId && student.classId !== classId) {
    return {
      ok: false,
      error: `${student.name} is already in another class. Remove them first.`,
    };
  }

  const count = getClassStudentCount(data, classId);
  if (!student.classId && count >= (cls.maxStudents || MAX_CLASS_SIZE)) {
    return {
      ok: false,
      error: `Class is full (max ${cls.maxStudents || MAX_CLASS_SIZE} students).`,
    };
  }

  student.classId = classId;
  student.className = cls.name;
  student.teacherId = cls.teacherId;
  saveData(data);
  return { ok: true };
}

export function removeStudentFromClass(
  studentId: string
): { ok: true } | { ok: false; error: string } {
  const data = getData();
  const student = data.users.find(
    (u) => u.id === studentId && u.role === "student"
  );
  if (!student) return { ok: false, error: "Student not found." };
  student.classId = undefined;
  student.className = undefined;
  student.teacherId = undefined;
  saveData(data);
  return { ok: true };
}

export function categoryLabel(category: ClassCategory) {
  const map: Record<ClassCategory, string> = {
    nazira: "Nazira",
    hifz: "Hifz",
    murajah: "Muraja'ah",
    intensive: "Intensive",
  };
  return map[category] || category;
}

export function addMemorization(
  record: Omit<MemorizationRecord, "id">
): MemorizationRecord {
  const data = getData();
  const item: MemorizationRecord = { ...record, id: `m-${Date.now()}` };
  data.memorization.push(item);
  saveData(data);
  return item;
}

export function addRevision(task: Omit<RevisionTask, "id">): RevisionTask {
  const data = getData();
  const item: RevisionTask = { ...task, id: `r-${Date.now()}` };
  data.revisions.push(item);
  saveData(data);
  return item;
}

export function updateRevisionStatus(id: string, status: TaskStatus) {
  const data = getData();
  const task = data.revisions.find((r) => r.id === id);
  if (!task) return null;
  task.status = status;
  task.completedAt =
    status === "completed" ? new Date().toISOString() : undefined;
  saveData(data);
  return task;
}

export function updateRevision(
  id: string,
  patch: Partial<Omit<RevisionTask, "id" | "assignedBy">>
): RevisionTask | null {
  const data = getData();
  const task = data.revisions.find((r) => r.id === id);
  if (!task) return null;
  Object.assign(task, patch);
  if (patch.status === "completed" && !task.completedAt) {
    task.completedAt = new Date().toISOString();
  }
  if (patch.status && patch.status !== "completed") {
    task.completedAt = undefined;
  }
  saveData(data);
  return task;
}

export function deleteRevision(id: string) {
  const data = getData();
  const before = data.revisions.length;
  data.revisions = data.revisions.filter((r) => r.id !== id);
  if (data.revisions.length === before) return false;
  saveData(data);
  return true;
}

/** Admin/teacher helper: move an enrolled student to another class (syncs teacher). */
export function transferStudentToClass(
  studentId: string,
  classId: string
): { ok: true } | { ok: false; error: string } {
  const data = getData();
  const student = data.users.find(
    (u) => u.id === studentId && u.role === "student" && u.active
  );
  if (!student) return { ok: false, error: "Student not found." };

  const cls = data.classes.find((c) => c.id === classId && c.active);
  if (!cls) return { ok: false, error: "Class not found." };
  if (!cls.teacherId) {
    return { ok: false, error: "Assign a class teacher before transferring students." };
  }

  if (student.classId === classId) {
    return { ok: false, error: "Student is already in this class." };
  }

  const count = getClassStudentCount(data, classId);
  if (count >= (cls.maxStudents || MAX_CLASS_SIZE)) {
    return { ok: false, error: `Class is full (max ${cls.maxStudents || MAX_CLASS_SIZE}).` };
  }

  student.classId = classId;
  student.className = cls.name;
  student.teacherId = cls.teacherId;
  saveData(data);
  return { ok: true };
}

export function getTeacherForStudent(data: AppData, studentId: string) {
  const student = data.users.find((u) => u.id === studentId);
  if (!student?.teacherId) return null;
  return data.users.find((u) => u.id === student.teacherId) || null;
}

export function addAssessment(record: Omit<Assessment, "id">): Assessment {
  const data = getData();
  const item: Assessment = { ...record, id: `a-${Date.now()}` };
  data.assessments.push(item);
  saveData(data);
  return item;
}

export function addContactMessage(
  msg: Omit<ContactMessage, "id" | "createdAt">
) {
  const data = getData();
  const item: ContactMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  data.messages.push(item);
  saveData(data);
  return item;
}

export function getStudentProgress(studentId: string) {
  const data = getData();
  const memorized = data.memorization.filter((m) => m.studentId === studentId);
  const revisions = data.revisions.filter((r) => r.studentId === studentId);
  const assessments = data.assessments.filter((a) => a.studentId === studentId);
  const uniqueSurahs = new Set(memorized.map((m) => m.surah));
  const pending = revisions.filter(
    (r) => r.status === "pending" || r.status === "overdue"
  ).length;
  const completed = revisions.filter((r) => r.status === "completed").length;
  const avgScore =
    assessments.length === 0
      ? 0
      : Math.round(
          assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length
        );
  const overall = Math.min(
    100,
    Math.round((uniqueSurahs.size / 114) * 100 + completed * 2)
  );

  return {
    memorizedSurahs: uniqueSurahs.size,
    memorizedRecords: memorized.length,
    pendingTasks: pending,
    completedTasks: completed,
    assessmentCount: assessments.length,
    avgScore,
    overallProgress: Math.min(overall, 100),
    memorizationPct: Math.min(100, Math.round((uniqueSurahs.size / 30) * 100)),
    revisionPct:
      revisions.length === 0
        ? 0
        : Math.round((completed / revisions.length) * 100),
    assessmentPct: Math.min(100, avgScore),
  };
}

export function gradeFromScore(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "C+";
  if (score >= 60) return "C";
  return "D";
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
