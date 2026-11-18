/**
 * Cursor agent `stop` hook → ship changes.
 */
import { readFileSync } from "fs";
import { ship } from "./ship-core.mjs";

try {
  readFileSync(0, "utf8");
} catch {
  /* ignore */
}

const result = ship("Cursor agent");
if (!result.skipped) {
  console.error(`[auto-ship] ${result.message}`);
}
console.log(
  JSON.stringify({
    followup_message: result.ok
      ? result.skipped
        ? undefined
        : result.message
      : result.message,
  })
);
process.exit(0);
