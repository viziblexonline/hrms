/**
 * After each Cursor agent turn finishes: commit → push → Vercel production deploy
 * when there are local changes (skips .env* and secrets).
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";

// Consume hook stdin (required)
try {
  readFileSync(0, "utf8");
} catch {
  /* ignore */
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    shell: false,
    ...opts,
  });
}

function git(args) {
  return run("git", args);
}

const status = git(["status", "--porcelain"]);
if (status.status !== 0) {
  console.log("{}");
  process.exit(0);
}

const dirty = (status.stdout || "").trim();
if (!dirty) {
  console.log("{}");
  process.exit(0);
}

// Stage everything except env/secrets
git(["add", "-A"]);
git(["reset", "HEAD", "--", ".env", ".env.local", ".env.*.local", "**/.env.local"]);

const staged = git(["diff", "--cached", "--name-only"]);
const stagedFiles = (staged.stdout || "").trim();
if (!stagedFiles) {
  console.log("{}");
  process.exit(0);
}

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const branchName = (branch.stdout || "main").trim();
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const message = `chore: auto-ship from Cursor (${stamp})`;

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
  const err = `${commit.stderr || ""}${commit.stdout || ""}`;
  console.error("[auto-ship] commit failed:", err.trim());
  console.log(
    JSON.stringify({
      followup_message: `Auto-ship commit failed: ${err.trim().slice(0, 200)}`,
    })
  );
  process.exit(0);
}

const push = git(["push", "-u", "origin", "HEAD"]);
if (push.status !== 0) {
  const err = `${push.stderr || ""}${push.stdout || ""}`;
  console.error("[auto-ship] push failed:", err.trim());
  console.log(
    JSON.stringify({
      followup_message: `Committed locally but push failed: ${err.trim().slice(0, 200)}`,
    })
  );
  process.exit(0);
}

// Prefer npx.cmd on Windows (ExecutionPolicy blocks npx.ps1)
const isWin = process.platform === "win32";
const vercelCmd = isWin ? "npx.cmd" : "npx";
const deploy = run(vercelCmd, ["vercel", "--prod", "--yes"], {
  env: process.env,
  timeout: 280000,
});

if (deploy.status !== 0) {
  const err = `${deploy.stderr || ""}${deploy.stdout || ""}`;
  console.error("[auto-ship] deploy failed:", err.trim());
  console.log(
    JSON.stringify({
      followup_message: `Pushed ${branchName}, but Vercel deploy failed. Try: npx.cmd vercel --prod --yes`,
    })
  );
  process.exit(0);
}

console.log(
  JSON.stringify({
    followup_message: `Auto-ship done on ${branchName}: commit + push + Vercel production deploy. Live: https://hrms-two-kappa.vercel.app`,
  })
);
process.exit(0);
