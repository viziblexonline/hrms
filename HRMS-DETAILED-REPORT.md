# HRMS — Complete Detailed Technical Report

**Hifz Revision Management System**  
**Better Records | Better Revision | Brighter Future**

| Field | Detail |
|-------|--------|
| Project | Hifz Revision Management System (HRMS) |
| Type | Full-stack web application |
| Stack | Next.js 14 · TypeScript · Tailwind · Supabase · Nodemailer |
| Repo | https://github.com/viziblexonline/hrms |
| Live | https://hrms-two-kappa.vercel.app |
| Modes | Local demo (`localStorage`) · Production (Supabase Auth + Postgres) |

---

## 1. Executive Summary

HRMS is a **role-based web app** for Quran Hifz institutes. It digitizes:

- Class / teacher / student linking  
- Memorization & revision tracking  
- Graded assessments  
- Conflict-aware online meetings  
- In-app Quran listening  
- Multilingual UI (English, Urdu, Arabic + RTL)

Three roles drive the product: **Student**, **Teacher**, **Admin**.  
The app runs in **demo mode** (browser `localStorage` + seed data) when Supabase env is missing, and in **cloud mode** when Supabase URL + anon key are configured.

---

## 2. Technology Stack (Detailed)

### 2.1 Core

| Technology | Version / Lib | Why it is used |
|------------|---------------|----------------|
| **Next.js** | 14.2 (App Router) | File-based routing, Server Components + Client Components, API routes, Vercel deploy |
| **React** | 18 | UI composition, Context providers |
| **TypeScript** | 5 | Domain models (`User`, `ClassRoom`, `RevisionTask`, …) and safer refactors |
| **Tailwind CSS** | 3.4 | Utility-first styling, Islamic green/gold theme, responsive layout |
| **Framer Motion** | 14 | Page transitions, sidebar motion, hero / gesture animations |
| **Lucide React** | icons | Consistent dashboard & public icons |
| **clsx** | — | Conditional class names |

### 2.2 Backend / Data / Auth

| Technology | Role |
|------------|------|
| **Supabase Auth** | Email/password + Google OAuth sessions |
| **Supabase Postgres** | `profiles` + `app_data` tables, RLS |
| **@supabase/supabase-js** | Browser client |
| **@supabase/ssr** | Cookie-based server client (auth callback) |
| **Service Role key** | Admin API: signup / create user without email-confirm friction |
| **Nodemailer + Gmail SMTP** | Branded welcome / login notice emails |
| **Jitsi Meet** | In-app embed rooms; Zoom / Google Meet as external URL providers |
| **Quran audio CDN** | Surah playback in Listen studio |

### 2.3 Fonts & i18n

| Piece | Detail |
|-------|--------|
| Outfit | UI sans (`--font-sans`) |
| Fraunces | Display headings (`--font-display`) |
| Noto Naskh Arabic | Arabic / Urdu script (`--font-arabic`) |
| LanguageProvider | EN / UR / AR dictionaries + `dir="rtl"` |

### 2.4 Hosting & Tooling

- **Vercel** — production hosting  
- **ESLint** (`eslint-config-next`) — lint  
- **Node.js LTS** — local `npm run dev`

---

## 3. System Architecture

### 3.1 Layered Architecture

HRMS follows a **3-layer** client-centric architecture with optional cloud persistence:

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  src/app/* pages · src/components/* · Tailwind · Motion     │
│  Public site + Role-filtered Dashboard (Sidebar RBAC)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  APPLICATION / DOMAIN LAYER                                 │
│  AuthProvider (Context) · store.ts · meetings.ts · i18n     │
│  Business rules: enroll, revision, grade, conflict detect   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  DATA / INFRASTRUCTURE LAYER                                │
│  Demo: localStorage (hrms_data_v3 + hrms_session_v1)        │
│  Cloud: Supabase Auth · profiles · app_data (JSONB)         │
│  sync.ts push/pull · API routes (signup, notify, admin)     │
│  mail.ts (Nodemailer) · schema.sql (RLS + trigger)          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Dual-Mode Runtime

| Mode | Trigger | Session | Domain data |
|------|---------|---------|-------------|
| **Demo** | `NEXT_PUBLIC_SUPABASE_*` missing | `localStorage` session | `localStorage` AppData + seed |
| **Production** | Supabase configured | Supabase Auth session + `profiles` | `app_data.payload` JSONB synced with local cache |

`saveData()` always writes locally, then **fire-and-forget** `pushAppDataToSupabase()` when cloud is enabled.

### 3.3 Folder Map

```
src/app/                  → Next.js App Router (pages + API)
  api/auth/               → signup, notify, admin-create-user
  auth/callback/          → OAuth / magic code exchange
  dashboard/              → protected role modules
  login|signup|…          → public marketing & auth pages
src/components/           → UI (Logo, Sidebar, QuranPlayer, …)
src/lib/
  types.ts                → domain TypeScript models
  store.ts                → CRUD + session + progress helpers
  seed.ts                 → demo seed dataset
  meetings.ts             → conflict & free-slot algorithms
  auth-context.tsx        → React auth facade (demo + Supabase)
  supabase/               → config, client, server, admin, sync
  mail.ts · branding.ts   → email + product identity
  i18n/                   → dictionaries + LanguageContext
supabase/
  schema.sql              → Postgres tables, trigger, RLS
  email-templates/        → Supabase branded HTML templates
```

### 3.4 Provider Tree

```
RootLayout
  └─ LanguageProvider          (locale + RTL)
       └─ AuthProvider         (user session + hydrate/sync)
            └─ pages / dashboard layout
```

Dashboard layout gates children: if no `user` after load → redirect `/login`.

---

## 4. Design Patterns Used

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Repository / Store facade** | `store.ts` | Single API for get/save AppData and all domain mutations |
| **Context + Provider** | `AuthProvider`, `LanguageProvider` | Global session & i18n without prop drilling |
| **Strategy / Dual adapter** | Auth + persistence | Same UI works with localStorage OR Supabase |
| **RBAC (Role-Based Access Control)** | `Sidebar` `roles[]` filter | Nav items shown only for allowed roles |
| **Protected layout** | `dashboard/layout.tsx` | Route guard for authenticated users |
| **Observer / Custom events** | `hrms-data-updated`, `hrms-session-updated` | Cross-component refresh without Redux |
| **Seed + Normalize** | `normalizeData`, key migration v1→v3 | Backward-compatible demo data upgrades |
| **Document / JSON blob** | `app_data.payload` | Fast migrate of entire AppData shape to cloud |
| **Trigger pattern (DB)** | `handle_new_user` on `auth.users` | Auto-create `profiles` row on signup |
| **Result object** | `createMeeting` → `{ ok, meeting }` or `{ ok:false, conflicts }` | Explicit success/failure without exceptions |
| **Server Actions style API routes** | `/api/auth/*` | Privileged ops (service role, SMTP) stay on server |
| **Adapter** | `profileToSession`, `mergeProfilesIntoUsers` | Map DB rows ↔ domain `User` / `SessionUser` |
| **Composition** | Dashboard chrome + page modules | Sidebar + MobileTopBar wrap feature pages |

HRMS does **not** use Redux/Zustand; domain state is **document-oriented** (`AppData`) with imperative store helpers.

---

## 5. End-to-End Flows

### 5.1 High-Level User Journey

```
Public site (Home / About / Listen / Contact)
        │
        ▼
   Login or Signup  ──email/password──►  Auth (demo store OR Supabase)
        │                 │
        │                 └──Google OAuth──► /auth/callback ──► session
        ▼
   AuthProvider hydrates session + (optional) pulls app_data + profiles
        ▼
   /dashboard  (role-specific Sidebar)
        ▼
   Modules: Progress · Revision · Assessments · Meetings · Classes · …
```

### 5.2 Email / Password Login (Demo Mode)

1. User submits email + password on `/login`.  
2. `AuthProvider.login` → `store.login` compares against `AppData.users`.  
3. On match → `setSession(SessionUser)` → `localStorage` `hrms_session_v1`.  
4. Redirect to `/dashboard`.  
5. Sidebar filters nav by `user.role`.

### 5.3 Email / Password Signup (Production)

1. Client calls `POST /api/auth/signup` (preferred) or client `signUp`.  
2. Server uses **service role** `admin.createUser` with `email_confirm: true`, metadata `{ name, role }`.  
3. Postgres trigger `on_auth_user_created` → `handle_new_user()` inserts `profiles`.  
4. Role rules: only bootstrap `admin@hrms.edu.pk` can be admin from signup; public cannot self-assign admin.  
5. Optional `sendAuthNotice` welcome email via Nodemailer.  
6. User logs in → session cookies / client session → hydrate profile.

### 5.4 Google OAuth Flow

1. `loginWithGoogle` → Supabase `signInWithOAuth({ provider: 'google' })`.  
2. Google → Supabase callback → app `/auth/callback?code=…`.  
3. Server exchanges code for session (`@supabase/ssr` + cookies).  
4. Sends login/signup notice email if SMTP configured.  
5. Redirect `/dashboard`; client `onAuthStateChange` + `hydrateFromSupabase`.

### 5.5 Data Sync Flow (Cloud)

```
UI mutation (e.g. addRevision)
    → store.saveData(AppData)
        → localStorage.setItem("hrms_data_v3", …)
        → dispatch "hrms-data-updated"
        → pushAppDataToSupabase({ id: "main", payload })
              → upsert public.app_data

On login / AuthProvider mount:
    → fetchAppDataFromSupabase()
    → if remote users exist → saveData(remote)
    → fetchAllProfiles() → mergeProfilesIntoUsers → saveData
    → else if empty remote → push local seed/current data
```

### 5.6 Class Enrollment Flow

```
Admin/Teacher creates ClassRoom (category, max 50)
    → assignClassTeacher(classId, teacherId)
    → enrollStudentInClass(studentId, classId)
         checks capacity (MAX_CLASS_SIZE = 50)
         sets student.classId, className, teacherId from class
    → transferStudentToClass / removeStudentFromClass as needed
```

Student’s teacher is **derived from class** (`teacherId` synced), not a free-floating assignment only.

### 5.7 Academic (Revision → Assessment → Progress)

```
Teacher/Admin: addRevision(surah, ayah range, dueDate, studentId)
Student: updateRevisionStatus → completed
Teacher: addAssessment(score → gradeFromScore, mistakes, feedback)
getStudentProgress aggregates:
  unique memorized surahs, pending/completed tasks, avg score, % rings
Reports page: searchable summaries by role scope
```

### 5.8 Meeting Scheduling Flow

```
createMeeting({ host, class OR studentIds, provider, time, duration })
    → findMeetingConflicts (overlap of participant calendars)
    → if conflicts && !force → return suggestions (suggestFreeMeetingSlots)
    → else save meeting (status: scheduled)
Student/Teacher: join via Jitsi embed URL or external Zoom/Meet link
Host: updateMeetingStatus → live | ended
```

Conflict = time ranges overlap **and** shared students (or host clash rules in `meetings.ts`).

### 5.9 Contact Form Flow

Public `/contact` → `addContactMessage` stored in `AppData.messages` (synced in cloud blob).

---

## 6. Functionality (Module-wise)

### 6.1 Public Website

| Route | Function |
|-------|----------|
| `/` | Landing, branding, CTAs, hero slideshow |
| `/about` | Institute / product story |
| `/listen` | Public Quran listening studio |
| `/contact` | Contact form → messages store |
| `/login` · `/signup` | Auth entry |
| `/terms` · `/privacy` | Legal pages |
| Language switcher | EN / UR / AR |

### 6.2 Authentication

- Email/password login & signup  
- Continue with Google  
- Auth callback + optional branded emails  
- Admin create-user API  
- Logout clears session (and Supabase signOut when enabled)

### 6.3 Dashboard (shared chrome)

- Sticky sidebar (desktop) + mobile drawer  
- Role badge, language switcher, logout  
- Page transitions via Framer Motion  
- Golden Gesture / Role Connection Hub (visual role linking)

### 6.4 By Role

**Student**

- Home overview  
- Own progress rings & memorization  
- View/complete revision tasks  
- View own assessments  
- Schedule & join meetings  
- Quran listen  
- Own reports · settings  

**Teacher**

- Manage own classes & enrolled students  
- Create/edit revision tasks  
- Create assessments  
- Schedule meetings (conflict-aware)  
- Class-scoped reports  

**Admin**

- Full classes, students, teachers, users  
- Revision / meetings / listen / reports (global)  
- User directory (merged with Supabase profiles in cloud mode)

### 6.5 Domain Operations (store API highlights)

| Function | Behavior |
|----------|----------|
| `createClass` / `assignClassTeacher` | Class lifecycle |
| `enrollStudentInClass` | Cap at 50; sync teacher/class fields |
| `addMemorization` / `addRevision` / `updateRevision` | Academic records |
| `addAssessment` + `gradeFromScore` | A+ … D from numeric score |
| `createMeeting` / `updateMeeting` / `deleteMeeting` | Meetings + conflict gate |
| `getStudentProgress` | Derived KPIs for UI rings/reports |
| `getVisibleMeetings` | Role-filtered meeting lists |

### 6.6 Quran Listening

- Qari + surah picker, search  
- Playback controls (`QuranPlayer`)  
- CDN audio with fallback URL strategy (`quran.ts`)

---

## 7. Database — Detailed Explanation

### 7.1 Design Philosophy

HRMS uses a **hybrid database design**:

1. **Normalized auth identity** → `auth.users` (Supabase-managed) + `public.profiles`  
2. **Document-style domain dump** → single row `public.app_data` with JSONB `payload`

This was chosen so the existing TypeScript `AppData` shape (built for `localStorage`) could move to the cloud **without rewriting every entity into SQL tables first**.

### 7.2 Entity-Relationship (Logical Domain)

Even though most domain entities live inside JSON, logically:

```
User (role: student|teacher|admin)
  │
  ├── student ──belongs to──► ClassRoom ──assigned──► Teacher (User)
  │
  ├── MemorizationRecord (studentId, surah, ayahFrom/To, date)
  ├── RevisionTask (studentId, status, dueDate, assignedBy)
  ├── Assessment (studentId, teacherId, score, grade, …)
  └── OnlineMeeting (hostId, classId?, studentIds?, schedule, provider)

ContactMessage (public form; not tied to auth user)
```

**Class categories:** `nazira` | `hifz` | `murajah` | `intensive`  
**Task status:** `pending` | `completed` | `upcoming` | `overdue`  
**Meeting provider:** `jitsi` | `zoom` | `google_meet`  
**Meeting status:** `scheduled` | `live` | `ended`  
**Max class size:** 50 (`MAX_CLASS_SIZE`)

### 7.3 Physical Tables (Postgres)

#### Table A — `public.profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | **FK → `auth.users(id)` ON DELETE CASCADE** |
| `email` | `text` UNIQUE NOT NULL | Login email |
| `name` | `text` NOT NULL | Display name |
| `role` | `text` CHECK | `student` \| `teacher` \| `admin` (default `student`) |
| `phone` | `text` | Optional |
| `avatar` | `text` | URL (e.g. Google avatar) |
| `teacher_id` | `uuid` FK → `profiles(id)` | SET NULL on delete |
| `class_id` | `text` | Class id string (matches AppData class ids) |
| `class_name` | `text` | Denormalized label for quick display |
| `active` | `boolean` | Default true |
| `created_at` / `updated_at` | `timestamptz` | Defaults `now()` |

**Purpose:** Durable identity + role for every authenticated user. Used for session hydration and admin user lists.

#### Table B — `public.app_data`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Fixed key `'main'` (single document) |
| `payload` | `jsonb` NOT NULL | Full `AppData` object |
| `updated_at` | `timestamptz` | Bumped on upsert |

**`payload` shape (application JSON):**

```json
{
  "users": [ /* User[] — directory copy; passwords empty in cloud merges */ ],
  "classes": [ /* ClassRoom[] */ ],
  "memorization": [ /* MemorizationRecord[] */ ],
  "revisions": [ /* RevisionTask[] */ ],
  "assessments": [ /* Assessment[] */ ],
  "messages": [ /* ContactMessage[] */ ],
  "meetings": [ /* OnlineMeeting[] */ ]
}
```

Seed insert ensures one row exists: `id = 'main'`.

### 7.4 Trigger: Auto Profile Creation

Function `public.handle_new_user()` (SECURITY DEFINER):

1. Reads `raw_user_meta_data.role` / `name` / `full_name` / `avatar_url`.  
2. Validates role ∈ {student, teacher, admin}.  
3. **Security:** if email is `admin@hrms.edu.pk` → force admin; else if requested admin → demote to student.  
4. `INSERT … ON CONFLICT DO UPDATE` into `profiles`.

Attached as:

```sql
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 7.5 Row Level Security (RLS)

| Table | Policy | Effect |
|-------|--------|--------|
| `profiles` | SELECT authenticated | Any logged-in user can read profiles (directory) |
| `profiles` | UPDATE own | `auth.uid() = id` |
| `profiles` | UPDATE any (admin) | Caller’s profile.role = `admin` |
| `app_data` | SELECT / INSERT / UPDATE authenticated | Shared institute document for signed-in users |

Anon users have **no** access to these tables (login page does not need them).

### 7.6 Auth Schema (Supabase-managed)

`auth.users` holds credentials, OAuth identities, `raw_user_meta_data`.  
App never writes passwords into `app_data` for cloud-created users (`password: ""` in merges).

### 7.7 Data Consistency Model

| Concern | Approach |
|---------|----------|
| Auth truth | Supabase `auth.users` + `profiles` |
| Operational truth (classes, tasks, …) | `app_data.payload` (+ localStorage cache) |
| Profile ↔ directory User | `mergeProfilesIntoUsers` on hydrate |
| Class ↔ student fields | Normalized in `normalizeData` / enroll helpers |
| Concurrent edits | Last-write-wins on whole JSON document (limitation) |

### 7.8 Why Not Fully Normalized Yet?

**Pros of current JSONB document:** fast port from demo, one sync path, flexible fields.  
**Cons:** weak SQL querying, coarse RLS, race conditions on concurrent teachers.  

**Future:** split into `classes`, `revisions`, `assessments`, `meetings` tables with per-row RLS (listed in project limitations).

### 7.9 Demo DB Equivalent

Without Supabase:

| “Table” | Storage key |
|---------|-------------|
| AppData | `localStorage["hrms_data_v3"]` (migrates v1/v2) |
| Session | `localStorage["hrms_session_v1"]` |

Seed users (demo only) live in `seed.ts`.

---

## 8. Security Notes

- Public signup cannot become admin (trigger + API role clamp).  
- Service role key used **only** on server API routes.  
- RLS enabled on both app tables.  
- Demo passwords are **not** production security.  
- OAuth callback exchanges code server-side into httpOnly-capable cookies via SSR helper.  
- `app_data` writable by any authenticated user — acceptable for small institute MVP; tighten in future normalization.

---

## 9. Architecture Diagram (Text)

```
                    ┌──────────────┐
                    │   Browser    │
                    │  Next.js UI  │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     AuthProvider     store.ts        Components
           │               │
     ┌─────┴─────┐   saveData/getData
     ▼           ▼         │
 Demo session  Supabase    ├─► localStorage
             Auth Client   └─► sync.push → Postgres app_data
                   │
                   ▼
            profiles ◄── trigger ── auth.users
                   │
         API routes (Node on Vercel)
           signup / notify / admin-create
                   │
                   ▼
              Nodemailer SMTP
```

---

## 10. Testing Snapshot (from project QA)

| Area | Result |
|------|--------|
| Public pages + i18n RTL | Pass |
| Demo role logins + nav RBAC | Pass |
| Revision create/edit | Pass |
| Meeting conflict + suggestions | Pass |
| Quran audio | Pass |
| Google + email notify | Pass when env configured |

---

## 11. Limitations & Future Work

1. Normalize `app_data` JSON into relational tables + finer RLS  
2. Stronger server-side mutation APIs (less client trust)  
3. Charts / PDF reports / parent portal  
4. Deeper Zoom/Meet API booking  
5. Real-time sync (Supabase Realtime) for multi-teacher edits  

---

## 12. Conclusion

HRMS is a **full-stack academic product** with:

- Clear **layered architecture** and **RBAC**  
- Practical **design patterns** (store facade, dual-mode adapters, triggers, result objects)  
- Documented **auth, sync, class, academic, and meeting flows**  
- A **hybrid database**: relational profiles + JSONB domain document  
- Modern **Next.js + Supabase + TypeScript** stack suitable for demo and cloud deploy  

For the formal academic write-up (declaration, contribution split, presentation plan), see also **`PROJECT-REPORT.md`**.

---

**Prepared for:** Complete technical understanding of HRMS  
**Source of truth in code:** `src/lib/*`, `supabase/schema.sql`, `src/app/**`
