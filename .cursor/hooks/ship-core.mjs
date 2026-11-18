/**
 * Fast ship: commit → push (sync), then Vercel prod via scripts/run-deploy.mjs
 * in a detached process (reliable on Windows).
 */
import { spawn, spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SHIP_DIR = resolve(ROOT, ".ship");
const DEPLOY_META = resolve(SHIP_DIR, "deploy-meta.json");
const RUN_DEPLOY = resolve(ROOT, "scripts/run-deploy.mjs");
const LIVE_URL = "https://hrms-two-kappa.vercel.app";

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    shell: false,
    cwd: ROOT,
    ...opts,
  });
}

function git(args) {
  return run("git", args);
}

function ensureShipDir() {
  if (!existsSync(SHIP_DIR)) mkdirSync(SHIP_DIR, { recursive: true });
}

function readMeta() {
  try {
    return JSON.parse(readFileSync(DEPLOY_META, "utf8"));
  } catch {
    return { pid: null, running: false, queued: false };
  }
}

function writeMeta(meta) {
  ensureShipDir();
  writeFileSync(DEPLOY_META, JSON.stringify(meta, null, 2));
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function startDeployBackground() {
  ensureShipDir();
  const meta = readMeta();

  if (meta.running && isPidAlive(meta.pid)) {
    writeMeta({ ...meta, queued: true });
    return { started: false, queued: true };
  }

  // Fresh node process — survives after ship returns; writes its own meta/log
  const child = spawn(process.execPath, [RUN_DEPLOY], {
    cwd: ROOT,
    env: process.env,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  writeMeta({
    pid: child.pid,
    running: true,
    queued: false,
    startedAt: new Date().toISOString(),
  });

  return { started: true, queued: false, pid: child.pid };
}

export function ship(label = "Cursor") {
  const status = git(["status", "--porcelain"]);
  if (status.status !== 0) {
    return { ok: false, message: "git status failed" };
  }

  const dirty = (status.stdout || "").trim();
  if (!dirty) {
    return { ok: true, message: "No changes to ship", skipped: true };
  }

  git(["add", "-A"]);
  git([
    "reset",
    "HEAD",
    "--",
    ".env",
    ".env.local",
    ".env.*.local",
    "**/.env.local",
  ]);

  const staged = git(["diff", "--cached", "--name-only"]);
  const stagedFiles = (staged.stdout || "").trim();
  if (!stagedFiles) {
    return { ok: true, message: "Nothing staged (secrets excluded)", skipped: true };
  }

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const branchName = (branch.stdout || "main").trim();
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const message = `chore: auto-ship from ${label} (${stamp})`;

  const commit = run(
    "git",
    [
      "-c",
      "user.name=viziblexonline",
      "-c",
      "user.email=viziblexonline@users.noreply.github.com",
      "commit",
      "-m",
      message,
    ],
    { env: process.env }
  );

  if (commit.status !== 0) {
    const err = `${commit.stderr || ""}${commit.stdout || ""}`.trim();
    return { ok: false, message: `commit failed: ${err.slice(0, 240)}` };
  }

  const push = git(["push", "-u", "origin", "HEAD"]);
  if (push.status !== 0) {
    const err = `${push.stderr || ""}${push.stdout || ""}`.trim();
    return { ok: false, message: `push failed: ${err.slice(0, 240)}` };
  }

  const deploy = startDeployBackground();
  if (deploy.queued) {
    return {
      ok: true,
      message: `Pushed ${branchName}. Deploy running — next one queued. Live soon: ${LIVE_URL}`,
    };
  }

  return {
    ok: true,
    message: `Pushed ${branchName}. Deploy started → ${LIVE_URL} (wait ~40–60s, then Ctrl+F5)`,
  };
}

const isDirect =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("/.cursor/hooks/ship-core.mjs");

if (isDirect) {
  const result = ship("manual");
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}
