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
   - `https://hrms-two-kappa.vercel.app`
5. Authorized redirect URIs (IMPORTANT):
   - `https://sagozbatwxdpdrzbglej.supabase.co/auth/v1/callback`
6. Copy **Client ID** + **Client Secret**
7. Supabase → **Authentication → Providers → Google** → Enable  
   - paste Client ID + Secret → Save
8. Supabase → **Authentication → URL Configuration** (**phone Google login ke liye zaroori**)
   - Site URL: `https://hrms-two-kappa.vercel.app`
   - Redirect URLs:
     - `https://hrms-two-kappa.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3001/auth/callback`

**Phone pe “This site can’t be reached”:** aksar Google ke baad `localhost` pe bhej deta hai.  
Phone se hamesha ye kholo (localhost nahi): https://hrms-two-kappa.vercel.app/login  
Aur upar wali Site URL + Redirect URLs Save karo.

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

## Auth emails from HRMS (zakria.haq123@gmail.com)

See **[SETUP-EMAIL.md](SETUP-EMAIL.md)** — Custom SMTP + HRMS email templates.

## Fix “Email not confirmed” on login

**Option A (recommended):** Authentication → Providers → **Email** → **Confirm email** = **OFF** → Save  
Phir Authentication → Users → teacher user → Confirm / ya dubara signup.

**Option B (app auto-confirm):** Project Settings → API → copy **`service_role`** secret →  
`.env.local` + Vercel env:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Iske baad signup pe email auto-confirmed hoti hai, turant login chalega.

## Auth note

- **Real auth** = Supabase Auth (email + Google)
- Google Client ID Google Cloud + Supabase pe set hota hai
- Bina env ke app pehle jaisi **localStorage demo** mode mein chalti hai
