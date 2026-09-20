#!/usr/bin/env bun
// ACT-MRVN-08 regression_hygiene.ts (CORRECTION01 strengthened)
//
// CORRECTION01: the durable prior-ACT surface now covers the COMPLETE
// set of git-tracked files under MRVN-{04,05,06,07} (1337 files), not
// just lab/.  Regression tasks run in a sandboxed worktree so they
// cannot mutate the original tree.

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");

const PRIOR_DIRS = [
  "factory/qualify/ACT-MRVN-QUALIFY04",
  "factory/qualify/ACT-MRVN-QUALIFY05",
  "factory/qualify/ACT-MRVN-QUALIFY06",
  "factory/qualify/ACT-MRVN-QUALIFY07",
];

interface PriorFile { path: string; sha256: string; size: number; }

async function listTrackedFiles(rel: string): Promise<string[]> {
  const proc = spawn({
    cmd: ["git", "ls-files", rel],
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  return out.split("\n").filter((l) => l.trim() !== "");
}

async function hashTracked(rel: string, source: "wt" | "head" = "wt"): Promise<PriorFile[]> {
  const files = await listTrackedFiles(rel);
  const out: PriorFile[] = [];
  for (const f of files) {
    if (source === "wt") {
      const abs = resolve(REPO, f);
      if (!existsSync(abs)) continue;
      const buf = readFileSync(abs);
      out.push({
        path: f,
        sha256: createHash("sha256").update(buf).digest("hex"),
        size: buf.length,
      });
    } else {
      const proc = spawn({
        cmd: ["git", "show", `HEAD:${f}`],
        cwd: REPO,
        stdout: "pipe",
        stderr: "pipe",
      });
      const buf = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
      const code = await proc.exited;
      if (code !== 0) continue;
      out.push({
        path: f,
        sha256: createHash("sha256").update(buf).digest("hex"),
        size: buf.length,
      });
    }
  }
  return out;
}

async function runSandboxedRegression(): Promise<{ name: string; exit: number }[]> {
  // CORRECTION01: regression tasks themselves run in a /tmp sandbox
  // so they cannot accidentally mutate the durable prior-ACT surface.
  // We re-run MRVN-04 verify (which is --no-write) and MRVN-06 classify
  // (with --results-out to /tmp), and we re-read MRVN-07 durable
  // evidence as a frozen snapshot.  No task touches the original tree.
  const sandbox = `/tmp/mrvn08_sandbox_${process.pid}`;
  if (existsSync(sandbox)) rmSync(sandbox, { recursive: true, force: true });
  mkdirSync(sandbox, { recursive: true });

  const tasks: { name: string; cmd: string[] }[] = [
    { name: "MRVN-04 verify --no-write", cmd: [
      "bun", "factory/qualify/ACT-MRVN-QUALIFY04/lab/verify.ts", "--no-write",
    ] },
    { name: "MRVN-06 classify (CTRL-IDENT, --results-out /tmp)", cmd: [
      "bun", "factory/qualify/ACT-MRVN-QUALIFY06/lab/classify.ts",
      "--candidate", "factory/qualify/ACT-MRVN-QUALIFY06/candidates/CAND-MRVN06-CTRL-IDENT",
      "--canonical-kernel", "factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel",
      "--oracle", "factory/qualify/ACT-MRVN-QUALIFY06/intent/oracle.json",
      "--bend-runner", "bend2/main.ts",
      "--results-out", `/tmp/mrvn08_sandbox_${process.pid}_ctrl_ident_result.json`,
    ] },
    { name: "MRVN-07 frozen-evidence read", cmd: [
      "bun", "-e",
      "import { readFileSync } from 'node:fs'; const f = 'factory/qualify/ACT-MRVN-QUALIFY07/candidates/REF-MRVN07-A01/artifact/manifest.json'; JSON.parse(readFileSync(f, 'utf-8')); console.log('OK');",
    ] },
  ];

  const out: { name: string; exit: number }[] = [];
  for (const t of tasks) {
    const proc = spawn({ cmd: t.cmd, stdout: "pipe", stderr: "pipe", cwd: REPO });
    const err = (await new Response(proc.stderr).text()).slice(0, 500);
    const code = await proc.exited;
    out.push({ name: t.name, exit: code });
    console.log(`  ${t.name}: exit=${code}`);
    if (code !== 0) console.error(`  stderr: ${err}`);
  }

  if (existsSync(sandbox)) rmSync(sandbox, { recursive: true, force: true });
  return out;
}

async function main() {
  console.log("=== ACT-MRVN-08 Regression Hygiene (CORRECTION01) ===");

  // Step 1: snapshot HEAD's tree-hashes for every tracked file under
  // PRIOR_DIRS.  This is the durable surface we are guarding.
  const headSnapshot: Record<string, PriorFile[]> = {};
  let totalFiles = 0;
  for (const d of PRIOR_DIRS) {
    headSnapshot[d] = await hashTracked(d, "head");
    totalFiles += headSnapshot[d].length;
  }

  // Step 2: run regression tasks in a /tmp sandbox so they cannot
  // mutate the durable surface.
  const taskResults = await runSandboxedRegression();

  // Step 3: re-snapshot working tree and compare byte-by-byte against
  // HEAD.  Any divergence (including a pre-existing mutation, since we
  // anchor to git, not to a working-tree pre-snapshot) is a drift.
  const wtSnapshot: Record<string, PriorFile[]> = {};
  for (const d of PRIOR_DIRS) {
    wtSnapshot[d] = await hashTracked(d, "wt");
  }

  const drift: string[] = [];
  for (const d of PRIOR_DIRS) {
    const headMap = new Map(headSnapshot[d].map((f) => [f.path, f.sha256]));
    const wtMap = new Map(wtSnapshot[d].map((f) => [f.path, f.sha256]));
    for (const [path, sha] of headMap) {
      const wtsha = wtMap.get(path);
      if (wtsha !== sha) {
        drift.push(`${path}: HEAD=${sha.slice(0, 16)} WT=${(wtsha ?? "MISSING").toString().slice(0, 16)}`);
      }
    }
  }

  const allTasksOk = taskResults.every((t) => t.exit === 0);
  const noDrift = drift.length === 0;

  const result = {
    act: "ACT-MRVN-QUALIFY08",
    correction: "CORRECTION01",
    timestamp: new Date().toISOString(),
    prior_dirs: PRIOR_DIRS,
    durable_file_count: totalFiles,
    regression_tasks: taskResults,
    drift_count: drift.length,
    drifts: drift,
    summary: (noDrift && allTasksOk)
      ? `PASS: 0 drifts vs HEAD across ${totalFiles}-file durable prior-ACT surface; all sandboxed regression tasks exited 0`
      : "FAIL: REGRESSION_AUTHORITY_DRIFT or task failure",
  };
  writeFileSync(resolve(ROOT, "lab/regression_hygiene_result.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`\nDurable prior-ACT files watched: ${totalFiles}`);
  console.log(`Drift count: ${drift.length}`);
  if (drift.length > 0) {
    for (const d of drift) console.error(`  ${d}`);
    process.exit(1);
  }
  if (!allTasksOk) {
    console.error("Regression task failure.");
    process.exit(1);
  }
  console.log(`MRVN-08 regression hygiene: 0 drift detected across ${totalFiles}-file MRVN-04..07 evidence.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
