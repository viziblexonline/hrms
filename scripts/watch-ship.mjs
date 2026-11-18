/**
 * Watch src/ (and key config files). After you Ctrl+S and stop editing
 * for DEBOUNCE_MS, automatically: commit → push → Vercel prod deploy.
 *
 * Run: npm run ship:watch
 */
import { watch } from "fs";
import { resolve, relative } from "path";
import { pathToFileURL } from "url";

const ROOT = resolve(process.cwd());
const DEBOUNCE_MS = 12000; // wait 12s after last save so typing isn't mid-ship
const WATCH_DIRS = ["src", "public", "supabase"];
const WATCH_FILES = [
  "tailwind.config.ts",
  "next.config.mjs",
  "next.config.js",
  "package.json",
];

let timer = null;
let shipping = false;
let pending = false;

async function runShip() {
  if (shipping) {
    pending = true;
    return;
  }
  shipping = true;
  console.log(`\n[ship:watch] Changes settled → commit / push / deploy…`);
  try {
    const mod = await import(
      pathToFileURL(resolve(ROOT, ".cursor/hooks/ship-core.mjs")).href
    );
    const result = mod.ship("manual Ctrl+S");
    console.log(`[ship:watch] ${result.message}`);
  } catch (err) {
    console.error("[ship:watch] failed:", err?.message || err);
  } finally {
    shipping = false;
    if (pending) {
      pending = false;
      schedule();
    }
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runShip();
  }, DEBOUNCE_MS);
  console.log(
    `[ship:watch] Save detected — shipping in ${DEBOUNCE_MS / 1000}s (save again to reset timer)`
  );
}

function shouldIgnore(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");
  if (!rel || rel.startsWith("..")) return true;
  if (rel.includes("node_modules") || rel.includes(".next")) return true;
  if (rel.includes(".git") || rel.startsWith(".env")) return true;
  if (rel.endsWith(".log")) return true;
  return false;
}

function onChange(filePath) {
  if (shouldIgnore(filePath)) return;
  schedule();
}

console.log("[ship:watch] Watching for Ctrl+S / file saves…");
console.log(`[ship:watch] Debounce: ${DEBOUNCE_MS / 1000}s after last save`);
console.log("[ship:watch] Live URL after deploy: https://hrms-two-kappa.vercel.app");
console.log("[ship:watch] Keep this terminal open while you edit.\n");

for (const dir of WATCH_DIRS) {
  const full = resolve(ROOT, dir);
  try {
    watch(full, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      onChange(resolve(full, filename));
    });
    console.log(`[ship:watch] watching ${dir}/`);
  } catch (err) {
    console.warn(`[ship:watch] skip ${dir}:`, err.message);
  }
}

for (const file of WATCH_FILES) {
  const full = resolve(ROOT, file);
  try {
    watch(full, () => onChange(full));
    console.log(`[ship:watch] watching ${file}`);
  } catch {
    /* optional file */
  }
}
