# Hifz Revision Management System (HRMS)

Role-based app for Quran Hifz progress, revision, assessments, meetings, and listening.

**GitHub:** https://github.com/viziblexonline/hrms

## Features

- Student / Teacher / Admin dashboards
- Class linking, revision tasks (create + edit), assessments
- Conflict-aware online meetings + Quran listening studio
- Golden Gesture + role connection hub
- **Supabase** database + **real auth** (email + **Continue with Google**)
- Local demo mode if Supabase env is missing

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Auth + Postgres)
- Framer Motion, Lucide

## Quick start (local demo)

```bash
npm install
npm run dev
```

Demo accounts (localStorage mode only):

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Student | zakria@hrms.edu.pk    | student123  |
| Teacher | ahmed@hrms.edu.pk     | teacher123  |
| Admin   | admin@hrms.edu.pk     | admin123    |

## Supabase + Google Sign-In

Full steps: **[SETUP-SUPABASE.md](SETUP-SUPABASE.md)**

1. Create Supabase project → copy URL + anon key into `.env.local`
2. Run `supabase/schema.sql` in SQL Editor
3. Google Cloud OAuth Client ID/Secret → Supabase Auth → Google provider
4. Redirect URI: `https://YOUR_REF.supabase.co/auth/v1/callback`
5. Login page → **Continue with Google**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

## Deploy (Vercel)

Import this GitHub repo on Vercel, add the same env vars, then add your Vercel URL to Google + Supabase redirect allow-lists.
