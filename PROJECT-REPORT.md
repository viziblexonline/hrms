# PROJECT REPORT

## Hifz Revision Management System (HRMS)

**Better Records | Better Revision | Brighter Future**

---

| Field | Detail |
|-------|--------|
| **Project Title** | Hifz Revision Management System (HRMS) |
| **Project Type** | Web Application |
| **Submitted by** | 1. Abdullah &nbsp;&nbsp; 2. Zakria |
| **Technology** | Next.js 14, TypeScript, Tailwind CSS, Supabase |
| **Repository** | https://github.com/viziblexonline/hrms |
| **Live URL** | https://hrms-two-kappa.vercel.app |
| **Document Type** | Final Project Report |

---

## DECLARATION

We hereby declare that this project report titled **“Hifz Revision Management System (HRMS)”** is our original work, completed under mutual contribution as stated in the Team Contribution section. The information presented in this report is true to the best of our knowledge.

| Name | Role in Project | Signature |
|------|-----------------|-----------|
| Abdullah | Design / UI-UX | ____________ |
| Zakria | Database & Connection | ____________ |

**Date:** ____________

---

## ACKNOWLEDGEMENT

We thank our teachers and mentors for guidance during the development of HRMS. We also acknowledge the open-source tools (Next.js, Supabase, Tailwind CSS, Framer Motion) that made this system possible.

---

## ABSTRACT

Hifz Revision Management System (HRMS) is a role-based web application designed for Quran Hifz institutions. It digitizes student progress tracking, revision task management, assessments, online meeting scheduling, and Quran audio listening.

The system supports three user roles: **Student**, **Teacher**, and **Admin**. Each role has a dedicated dashboard and feature set. The application can run in local demo mode (browser storage) or in production mode with **Supabase** authentication and database.

**Abdullah** was responsible for visual design, UI/UX, branding, and frontend screens. **Zakria** was responsible for database design, Supabase connection, authentication integration, data sync, and email configuration.

**Keywords:** HRMS, Hifz, Revision Management, Next.js, Supabase, Role-based Access, Web Application

---

## TABLE OF CONTENTS

1. Introduction  
2. Problem Statement  
3. Objectives  
4. Scope of the Project  
5. System Requirements  
6. Methodology / Tech Stack  
7. System Analysis  
8. System Design  
9. Implementation  
10. Features Module-wise  
11. Testing  
12. Team Contribution (Equal Division)  
13. Presentation Plan (Abdullah & Zakria)  
14. Limitations & Future Work  
15. Conclusion  
16. References / Appendices  

---

# CHAPTER 1 — INTRODUCTION

Hifz education requires continuous revision (muraja‘ah), teacher supervision, and record keeping. Many madaris still use notebooks, WhatsApp groups, or informal sheets. This creates missed deadlines, unclear class assignment, and weak reporting.

**HRMS** provides one digital platform where:

- Students see their progress, revision tasks, assessments, and meetings  
- Teachers manage classes, assign revision, conduct assessments, and schedule sessions  
- Admins manage users, teachers, classes, and overall reports  

The product tagline is: **Better Records | Better Revision | Brighter Future**.

---

# CHAPTER 2 — PROBLEM STATEMENT

Existing paper-based or chat-based Hifz tracking suffers from:

1. No central record of memorization and revision  
2. Weak link between student, class, and teacher  
3. Difficulty comparing assessment history  
4. Meeting time clashes for the same students  
5. No integrated place for listening practice + progress + reports  

HRMS addresses these problems with a structured, role-based web system.

---

# CHAPTER 3 — OBJECTIVES

| Sr. | Objective |
|-----|-----------|
| 1 | Develop separate dashboards for Student, Teacher, and Admin |
| 2 | Link students ↔ classes ↔ teachers with enrollment rules (max 50 students per class) |
| 3 | Track memorization, revision tasks, and graded assessments |
| 4 | Schedule online meetings with conflict detection and free-slot suggestions |
| 5 | Provide in-app Quran listening (qari + surah) |
| 6 | Integrate real authentication (email + Google) via Supabase, with local demo fallback |
| 7 | Support multilingual UI: English, Urdu, and Arabic (RTL) |

---

# CHAPTER 4 — SCOPE OF THE PROJECT

### In Scope
- Public website (Home, About, Contact, Listen, Login, Signup)  
- Role-based dashboard modules  
- Class / student / teacher / user management  
- Revision, assessments, progress, reports  
- Online meetings (Jitsi / Zoom / Google Meet links)  
- Supabase auth + database sync  
- Branded auth notification emails  

### Out of Scope (Future)
- Fully normalized relational tables for every entity  
- Native mobile apps  
- Automated Zoom/Meet API booking  
- Parent portal / PDF report export  

---

# CHAPTER 5 — SYSTEM REQUIREMENTS

### 5.1 Hardware (minimum)
- PC / laptop with modern browser  
- Internet connection (for Supabase / Google / audio CDN)

### 5.2 Software
| Item | Requirement |
|------|-------------|
| OS | Windows / macOS / Linux |
| Runtime | Node.js (LTS) |
| Browser | Chrome / Edge / Firefox (latest) |
| Hosting | Vercel (production) |
| Backend service | Supabase project |

### 5.3 Functional Requirements (summary)
- FR1: User can sign up / log in (email or Google)  
- FR2: System assigns role-based navigation  
- FR3: Teacher/Admin can manage classes and enroll students  
- FR4: Revision tasks can be created, edited, completed  
- FR5: Assessments store score, grade, feedback  
- FR6: Meetings detect schedule conflicts  
- FR7: Users can listen to Quran audio in-app  
- FR8: Reports show student progress summary  

### 5.4 Non-Functional Requirements
- Usable on desktop and mobile browsers  
- Clear visual hierarchy and Islamic-inspired UI  
- Secure production auth via Supabase  
- Multilingual interface  

---

# CHAPTER 6 — METHODOLOGY / TECH STACK

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend framework | Next.js 14 (App Router) | Pages, routing, API routes |
| Language | TypeScript | Type-safe domain models |
| Styling | Tailwind CSS | Responsive UI theme |
| Motion | Framer Motion | Animations |
| Icons | Lucide React | Consistent icons |
| Auth & Database | Supabase (Auth + Postgres) | Users, profiles, shared data |
| Email | Nodemailer + Gmail SMTP | Welcome / login notices |
| Meetings | Jitsi embed (+ Zoom / Meet URLs) | Online sessions |
| Audio | Quran CDN APIs | Surah playback |
| Deployment | Vercel | Production hosting |

**Development approach:** Iterative web development — UI screens first, then domain store, then Supabase auth/database connection, then email and deploy.

---

# CHAPTER 7 — SYSTEM ANALYSIS

### 7.1 Users (Actors)

| Actor | Description |
|-------|-------------|
| Student | Views progress, completes revision, joins meetings, listens |
| Teacher | Manages class students, assigns revision, assessments, meetings |
| Admin | Full control: users, teachers, classes, reports |

### 7.2 High-Level Flow

```
Public Website  →  Authentication  →  Role Dashboard  →  Modules
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              localStorage         Supabase Auth        Supabase app_data
              (demo mode)          + profiles           (JSON sync)
```

### 7.3 Roles & Features Matrix

| Feature | Student | Teacher | Admin |
|---------|:-------:|:-------:|:-----:|
| Dashboard home | ✓ | ✓ | ✓ |
| Own progress | ✓ | — | — |
| Revision | view/complete | create/edit | create/edit |
| Assessments | view own | create/manage | — |
| Schedule | ✓ | ✓ | — |
| Meetings | join/view | create/manage | create/manage |
| Quran Listen | ✓ | ✓ | ✓ |
| Classes | — | manage own | full |
| Students | — | assigned | full |
| Teachers | — | — | ✓ |
| Users | — | — | ✓ |
| Reports | own | class students | all |
| Settings | ✓ | ✓ | ✓ |

---

# CHAPTER 8 — SYSTEM DESIGN

### 8.1 Architecture
- **Presentation layer:** React pages & components (Abdullah — design)  
- **Application layer:** Auth context, store helpers, meeting logic  
- **Data layer:** localStorage demo OR Supabase Postgres (Zakria — DB & connect)

### 8.2 Domain Model (Data Entities)

| Entity | Purpose |
|--------|---------|
| User | Student / Teacher / Admin profile & links |
| ClassRoom | Nazira, Hifz, Muraja‘ah, Intensive (max 50) |
| MemorizationRecord | Surah + ayah range memorized |
| RevisionTask | Assigned revision with status |
| Assessment | Score, grade, mistakes, feedback |
| OnlineMeeting | Host, class/students, provider, schedule |
| ContactMessage | Public contact form messages |

### 8.3 Database Design (Supabase)

**Table: `profiles`**
- Linked to `auth.users`  
- Fields: id, email, name, role, phone, avatar, teacher_id, class_id, class_name, active, timestamps  

**Table: `app_data`**
- Stores shared application JSON payload (`users`, `classes`, `revisions`, `assessments`, `meetings`, …)  
- Enables fast migration from local demo structure to cloud  

**Security:** Row Level Security (RLS) policies for authenticated access; public signup cannot create admin role.

### 8.4 UI Design Concept
- Islamic arch / gold–green visual language  
- Logo, Mosque silhouette art, hero slideshow  
- Role Connection Hub and Golden Gesture on dashboard  
- Language support: English, Urdu, Arabic with RTL  

---

# CHAPTER 9 — IMPLEMENTATION

### 9.1 Project Structure

```
src/app/                 → routes (public + dashboard + API)
src/components/          → UI components
src/lib/                 → store, auth, meetings, i18n, supabase, mail
supabase/                → schema.sql + email HTML templates
```

### 9.2 Dual Mode Implementation
1. **Demo mode:** If Supabase env is missing, app uses `localStorage` + seed users.  
2. **Production mode:** Supabase Auth (email + Google), profile creation trigger, `app_data` sync.

### 9.3 Key Implementation Files

| Area | Main files |
|------|------------|
| Design / UI | `src/components/*`, dashboard pages, `branding.ts`, `i18n/*`, Tailwind theme |
| Database | `supabase/schema.sql` |
| Connection | `src/lib/supabase/config.ts`, `client.ts`, `server.ts`, `sync.ts` |
| Auth | `auth-context.tsx`, `/auth/callback`, Google button |
| Data logic | `types.ts`, `store.ts`, `seed.ts`, `meetings.ts` |
| Email | `mail.ts`, `/api/auth/notify`, email templates |

### 9.4 How to Run

```bash
npm install
npm run dev
```

For production auth: configure `.env.local` as per `SETUP-SUPABASE.md` and `SETUP-EMAIL.md`.

### 9.5 Demo Accounts (localStorage mode only)

| Role | Email | Password |
|------|-------|----------|
| Student | zakria@hrms.edu.pk | student123 |
| Teacher | ahmed@hrms.edu.pk | teacher123 |
| Admin | admin@hrms.edu.pk | admin123 |

---

# CHAPTER 10 — FEATURES (MODULE-WISE)

### 10.1 Authentication & Accounts
Email/password signup-login, Continue with Google, auth callback, optional branded emails.

### 10.2 Classes & People
Create classes, assign teachers, enroll/remove/transfer students, max class size 50, admin user management.

### 10.3 Academic Flow
Memorization records, revision assign/edit/status, assessments with grading, progress stats, searchable reports.

### 10.4 Meetings
Jitsi / Zoom / Google Meet, class or selected students, conflict detection, free slot suggestions, status lifecycle.

### 10.5 Quran Listening Studio
Qari + surah picker, search, playback controls, fallback audio URL, public and dashboard listen pages.

### 10.6 Public Site
Landing, about, contact, terms, privacy, multilingual switcher.

---

# CHAPTER 11 — TESTING

| Test case | Expected result | Status |
|-----------|-----------------|--------|
| Open home page | Landing UI loads | Pass |
| Language switch EN/UR/AR | Text + RTL update | Pass |
| Demo login (teacher) | Dashboard opens with teacher nav | Pass |
| Demo login (student) | Student progress modules visible | Pass |
| Demo login (admin) | Users/teachers management visible | Pass |
| Create/edit revision (teacher) | Task saved and listed | Pass |
| Meeting conflict check | Warning / suggestions shown | Pass |
| Quran listen play | Audio plays / fallback works | Pass |
| Supabase Google login (when configured) | Redirect + session + dashboard | Pass* |
| Auth notify email (when SMTP set) | Mail sent from HRMS address | Pass* |

\* Depends on environment configuration.

---

# CHAPTER 12 — TEAM CONTRIBUTION (EQUAL)

Work was divided equally between two members according to skill ownership.

| Member | Contribution area | Approximate share |
|--------|-------------------|-------------------|
| **Abdullah** | Design, UI/UX, branding, layouts, pages, visual components, frontend presentation | **50%** |
| **Zakria** | Database design, Supabase schema, connection/sync, auth backend, email, data layer | **50%** |

### 12.1 Abdullah — Design / Frontend

- Visual design system (colors, theme, motion)  
- Logo, Mosque art, hero, promo banners  
- Public pages (Home, About, Contact, Login, Signup)  
- Dashboard chrome (Sidebar, TopBar) and screen layouts  
- Feature screen UI: Progress, Revision, Assessments, Meetings, Listen, Reports  
- Multilingual UI presentation (EN / UR / AR)  
- UX components: Golden Gesture, Role Connection Hub, Progress Ring, Status badges  

### 12.2 Zakria — Database & Connection

- Supabase project and SQL schema (`profiles`, `app_data`, RLS)  
- Client/server Supabase configuration and env wiring  
- Auth integration (email/password + Google OAuth + callback)  
- Cloud sync (`push` / `fetch` app data)  
- Domain data layer (`types`, `store`, `seed`, meetings logic)  
- Email SMTP + notify API + email templates  
- Setup documentation and deployment environment notes  

---

# CHAPTER 13 — PRESENTATION PLAN (EQUAL SPEAKING)

**Total time:** about 10–12 minutes + demo + Q&A  
**Speaking split:** Abdullah ~50% · Zakria ~50%

### Abdullah presents (Design & Screens)

| Part | Content | Time |
|------|---------|------|
| 1 | Title, team intro, tagline | 20s |
| 2 | Problem & objectives | 45s |
| 3 | Design system & branding | 1 min |
| 4 | Public site + multilingual UI | 1 min |
| 5 | Login/dashboard UI + feature screens | ~2 min |
| 6 | Live UI demo | 1.5–2 min |

**Demo script (Abdullah):** Landing → language switch → Teacher login → Sidebar/modules → Listen briefly.

### Zakria presents (Database & Connection)

| Part | Content | Time |
|------|---------|------|
| 1 | Architecture overview | 45s |
| 2 | Database schema & RLS | 1–1.5 min |
| 3 | Supabase connect + sync | 1 min |
| 4 | Auth (email + Google) | 1 min |
| 5 | Data layer (store / demo vs cloud) + email | ~1.5 min |
| 6 | Limitations, future work, conclusion | 45s |

**Opening (Abdullah):** Introduce team and HRMS purpose; state that Abdullah covers design and Zakria covers database/connection.  

**Closing (Zakria):** Summarize that design makes HRMS usable and database/connection makes data secure and shared; thank the audience.

### Suggested 12 Slides

1. Title & team — Abdullah  
2. Problem — Abdullah  
3. Design system — Abdullah  
4. Public pages & i18n — Abdullah  
5. Dashboard screens — Abdullah  
6. Live UI demo — Abdullah  
7. Architecture — Zakria  
8. Database schema — Zakria  
9. Connection & sync — Zakria  
10. Auth + email — Zakria  
11. Data layer — Zakria  
12. Conclusion & Q&A — Zakria (both answer Q&A)

### Viva / Q&A Guide

| Question | Answered by |
|----------|-------------|
| Design theme / UI choices | Abdullah |
| Multilingual / RTL | Abdullah |
| How screens differ by role | Abdullah |
| Where is data stored? | Zakria |
| What tables exist? | Zakria |
| How Google login works? | Zakria |
| Meeting conflict logic | Zakria |
| Email sending | Zakria |

---

# CHAPTER 14 — LIMITATIONS AND FUTURE WORK

| Current limitation | Future improvement |
|--------------------|--------------------|
| Domain data stored as one JSON blob in `app_data` | Normalize into separate SQL tables |
| Client-heavy writes | Stronger server APIs + RLS per table |
| Basic reports | Charts, PDF export, parent portal |
| Manual meeting external links | Deeper Zoom/Meet API integration |
| Demo seed passwords | Keep demo-only; never treat as production security |

---

# CHAPTER 15 — CONCLUSION

HRMS successfully provides a practical digital platform for Hifz institutions. It connects Admin, Teacher, and Student through classes; tracks revision and assessments; supports conflict-aware online meetings; and includes a Quran listening studio.

Equal teamwork delivered a complete product:

- **Abdullah** delivered the design and user-facing experience  
- **Zakria** delivered the database, connection, and authentication backbone  

Together, the system is presentable as a full-stack academic project with both strong UI and working cloud data integration.

---

# CHAPTER 16 — REFERENCES / APPENDICES

### References
1. Next.js Documentation — https://nextjs.org/docs  
2. Supabase Documentation — https://supabase.com/docs  
3. Tailwind CSS Documentation — https://tailwindcss.com/docs  
4. Framer Motion Documentation — https://www.framer.com/motion/  
5. Project repository — https://github.com/viziblexonline/hrms  

### Appendix A — Setup Documents
- `README.md`  
- `SETUP-SUPABASE.md`  
- `SETUP-EMAIL.md`  

### Appendix B — Important Paths
- Schema: `supabase/schema.sql`  
- Auth context: `src/lib/auth-context.tsx`  
- Store: `src/lib/store.ts`  
- Sync: `src/lib/supabase/sync.ts`  

---

**End of Project Report**

**Prepared by:** Abdullah (Design) · Zakria (Database & Connection)  
**Project:** Hifz Revision Management System (HRMS)
