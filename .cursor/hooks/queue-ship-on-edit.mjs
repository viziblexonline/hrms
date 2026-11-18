/**
 * afterFileEdit: touch a debounce flag file so watch-ship (if running) or
 * a lightweight timer can pick up — here we just acknowledge and exit fast.
 * Manual Ctrl+S shipping is handled by `npm run ship:watch`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

try {
  readFileSync(0, "utf8");
} catch {
  /* ignore */
}

try {
  const dir = resolve(process.cwd(), ".cursor");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, ".last-edit"), String(Date.now()), "utf8");
} catch {
  /* ignore */
}

console.log("{}");
process.exit(0);
