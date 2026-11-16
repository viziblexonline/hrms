# HRMS emails from zakria.haq123@gmail.com

Auth emails (signup confirm / magic link) Supabase bhejta hai.
Default pe ye `noreply@mail.app.supabase.co` se aati hain.
**HRMS naam + aapka Gmail** ke liye Custom SMTP lagana zaroori hai.

## App mailer (Google + every login/signup)

HRMS ab **Continue with Google** aur email login/signup pe khud mail bhejta hai:

- From: **HRMS \<zakria.haq123@gmail.com\>**
- Subject: Welcome / You signed in to HRMS

`.env.local` (aur Vercel env) mein same Gmail App Password lagao:

```
SMTP_USER=zakria.haq123@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

Supabase Custom SMTP alag se confirm/magic emails ke liye ON rakho (neeche).

## 1) Gmail App Password banao

1. Google Account → https://myaccount.google.com/security  
2. **2-Step Verification** ON karo (zaroori)  
3. https://myaccount.google.com/apppasswords  
4. App: `Mail` / name: `HRMS Supabase` → Create  
5. 16-character password copy karo (spaces hata sakte ho)

## 2) Supabase Custom SMTP

1. https://supabase.com/dashboard/project/sagozbatwxdpdrzbglej/auth/smtp  
   (ya Authentication → Emails → SMTP Settings)  
2. **Enable Custom SMTP** ON  
3. Values:

| Field | Value |
|--------|--------|
| Sender email | `zakria.haq123@gmail.com` |
| Sender name | `HRMS` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `zakria.haq123@gmail.com` |
| Password | *(Gmail App Password)* |

4. Save

## 3) Email templates (HRMS branding)

Supabase → **Authentication → Email Templates**

- **Confirm signup** subject: `Confirm your HRMS account`
- Body: paste `supabase/email-templates/confirm-signup.html`
- **Magic Link** subject: `Your HRMS sign-in link`
- Body: paste `supabase/email-templates/magic-link.html`

## 4) Google “Continue with Google” screen pe HRMS naam

Google Cloud → **OAuth consent screen** → App name = **`HRMS`** (not “Project default”)  
Save → users ko “HRMS wants to access…” dikhega.

## 5) Test (SMTP prove karne ka tarika)

1. Google mat dabao  
2. **Naye** email se Sign Up (password form)  
3. Us naye inbox mein: From **HRMS \<zakria.haq123@gmail.com\>**  
4. `zakria.haq123@gmail.com` → **Sent** mein bhi wahi mail dikhni chahiye  
5. Confirm link → dashboard  

Agar Sent ab bhi khali:
- SMTP password = **App Password** (16 chars), normal Gmail password nahi  
- Host `smtp.gmail.com`, Port `587`, Sender = `zakria.haq123@gmail.com`  
- Supabase → **Logs → Auth** mein `smtp` / `535` errors  
- Temporary: Authentication → Providers → Email → **Confirm email** OFF (login chalega, lekin mail test nahi hoga)

App Password yahan paste kar doge to `.env.local` mein note rakh sakte ho (SMTP dashboard mein manually paste).
