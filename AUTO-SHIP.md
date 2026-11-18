# Auto commit → push → deploy (fast)

## Manual edits (Ctrl+S)

1. Terminal open rakho:

```powershell
cd E:\Users\Administrator\Desktop\hrms
npm run ship:watch
```

2. Code edit → **Ctrl+S**
3. **~3 seconds** baad:
   - `git commit` + `git push` **turant**
   - Vercel deploy **background** mein (wait nahi)
4. Live site usually **~40–60s** baad update (Vercel build)  
   https://hrms-two-kappa.vercel.app

`.env.local` commit nahi hota. Deploy log: `.ship/deploy.log`

## One-shot

```powershell
npm run ship
```
