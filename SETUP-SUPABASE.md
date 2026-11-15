# HRMS → Supabase + Google Sign-In

GitHub repo: https://github.com/viziblexonline/hrms

## 1) Create Supabase project

1. Open https://supabase.com/dashboard and create a project.
2. **Project Settings → API** se copy karo:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Local file banao: `.env.local` (`.env.example` se copy)

## 2) Run database schema

1. Supabase → **SQL Editor** → New query
2. Paste / run: [`supabase/schema.sql`](supabase/schema.sql)
3. Confirm tables: `profiles`, `app_data`

## 3) Google “Continue with Google” (Client ID)

Google OAuth **Client ID + Secret** Supabase Auth provider mein lagte hain (Railway nahi).

1. https://console.cloud.google.com → create/select project  
2. **APIs & Services → OAuth consent screen** (External) configure  
3. **Credentials → Create OAuth client ID → Web application**
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - your Vercel URL (baad mein)
5. Authorized redirect URIs (IMPORTANT):
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Copy **Client ID** + **Client Secret**
7. Supabase → **Authentication → Providers → Google** → Enable  
   - paste Client ID + Secret → Save
8. Supabase → **Authentication → URL Configuration**
   - Site URL: `http://localhost:3001` (dev) / your production URL
   - Redirect URLs: `http://localhost:3001/auth/callback` and production `/auth/callback`

`.env.local` mein bhi Client ID rakh sakte ho (documentation):

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
```

App Google login **Supabase OAuth** se chalati hai — button Login/Signup pe “Continue with Google”.

## 4) Local run

```bash
npm install
npm run dev
```

Open Login → **Continue with Google** ya email/password signup.

## 5) Vercel deploy (optional next)

1. https://vercel.com → Import `viziblexonline/hrms`
2. Environment variables add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy
4. Google + Supabase redirect URLs mein Vercel domain add karo

## Auth note

- **Real auth** = Supabase Auth (email + Google)
- “Railway authentication” is project mein zaroori nahi — Google Client ID Google Cloud + Supabase pe set hota hai
- Bina env ke app pehle jaisi **localStorage demo** mode mein chalti hai
