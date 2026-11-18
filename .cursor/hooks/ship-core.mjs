/**
 * Shared commit → push → Vercel prod deploy.
 * Returns { ok, message }
 */
import { spawnSync } from "child_process";

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

  // Windows: shell:true so npx.cmd resolves; capture stderr from PowerShell noise
  const isWin = process.platform === "win32";
  const deploy = run(
    isWin ? "npx.cmd" : "npx",
    ["vercel", "--prod", "--yes"],
    {
      env: process.env,
      timeout: 280000,
      shell: isWin,
    }
  );

  const deployOut = `${deploy.stdout || ""}${deploy.stderr || ""}`.trim();
  const deployOk =
    deploy.status === 0 ||
    /Production:\s+https:\/\/hrms/i.test(deployOut) ||
    /Aliased\s+https:\/\/hrms/i.test(deployOut) ||
    /"status"\s*:\s*"ok"/i.test(deployOut);

  if (!deployOk) {
    return {
      ok: false,
      message: `Pushed ${branchName}, but Vercel deploy failed: ${deployOut.slice(0, 280) || `exit ${deploy.status}`}`,
    };
  }

  return {
    ok: true,
    message: `Shipped ${branchName}: commit + push + deploy → https://hrms-two-kappa.vercel.app`,
  };
}

// Allow: node .cursor/hooks/ship-core.mjs  OR  npm run ship
const isDirect =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("/.cursor/hooks/ship-core.mjs");

if (isDirect) {
  const result = ship("manual");
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}
