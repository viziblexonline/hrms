# Auto commit → push → deploy

## Manual edits (Ctrl+S)

1. Ek terminal mein rakhna:

```powershell
cd E:\Users\Administrator\Desktop\hrms
npm run ship:watch
```

2. Code edit karo → **Ctrl+S**
3. **12 seconds** baad (last save ke baad) automatically:
   - `git commit`
   - `git push`
   - `vercel --prod`

Live: https://hrms-two-kappa.vercel.app

`.env.local` commit nahi hota.

## Cursor agent edits

Agent turn khatam hone pe `.cursor/hooks` se bhi auto-ship chalta hai.

## One-shot ship (bina watch)

```powershell
npm run ship:watch
```

Ya turant ek baar:

```powershell
node -e "import('./.cursor/hooks/ship-core.mjs').then(m => console.log(m.ship('manual')))"
```
