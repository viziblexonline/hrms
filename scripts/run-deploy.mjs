/**
 * Standalone Vercel prod deploy. Writes .ship/deploy-meta.json.
 * Invoked detached by ship-core so Ctrl+S doesn't wait.
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHIP_DIR = resolve(ROOT, ".ship");
const DEPLOY_LOG = resolve(SHIP_DIR, "deploy.log");
const DEPLOY_META = resolve(SHIP_DIR, "deploy-meta.json");

function ensureDir() {
  if (!existsSync(SHIP_DIR)) mkdirSync(SHIP_DIR, { recursive: true });
}

function readMeta() {
  try {
    return JSON.parse(readFileSync(DEPLOY_META, "utf8"));
  } catch {
    return {};
  }
}

function writeMeta(meta) {
  ensureDir();
  writeFileSync(DEPLOY_META, JSON.stringify(meta, null, 2));
}

function log(line) {
  ensureDir();
  appendFileSync(DEPLOY_LOG, `${line}\n`);
  console.log(line);
}

const startedAt = new Date().toISOString();
writeMeta({ pid: process.pid, running: true, queued: false, startedAt });
log(`---- deploy ${startedAt} ----`);

const isWin = process.platform === "win32";
const result = spawnSync(
  isWin ? "npx.cmd" : "npx",
  ["vercel", "deploy", "--prod", "--yes", "--archive=tgz"],
  {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: isWin,
    timeout: 280000,
  }
);

const out = `${result.stdout || ""}${result.stderr || ""}`.trim();
if (out) log(out.slice(-2000));

const ok =
  result.status === 0 ||
  /Aliased\s+https:\/\/hrms/i.test(out) ||
  /"status"\s*:\s*"ok"/i.test(out);

log(
  ok
    ? `[ok] live https://hrms-two-kappa.vercel.app`
    : `[fail] exit ${result.status}`
);

const prev = readMeta();
writeMeta({
  pid: null,
  running: false,
  queued: false,
  lastExit: result.status,
  lastOk: ok,
  finishedAt: new Date().toISOString(),
});

// Run one more deploy if saves happened while this one was building
if (prev.queued) {
  log("[ship] queued deploy starting…");
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

process.exit(ok ? 0 : 1);
