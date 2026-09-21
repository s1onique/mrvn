#!/usr/bin/env bun
// ACT-MRVN-09 regression_authority_drift_test.ts (CORRECTION02)
//
// Negative E2E self-test: proves the strengthened regression_hygiene
// gate actually fires when a prior-ACT durable file is mutated.
//
// Procedure (CORRECTION02 extends CORRECTION01):
//   1. snapshot the durable prior-ACT surface (WATCHED_PRIOR_ACTS =
//      {04, 05, 06, 07, 08}, now ~1696 files incl. MRVN-08)
//   2a. simulate the exact defect we want to catch against MRVN-07:
//      overwrite one MRVN-07 tracked manifest with a corrupted payload.
//   2b. simulate the same defect against MRVN-08 (now in the watched
//      surface per CORRECTION02): overwrite one MRVN-08 REPORT file
//      with a corrupted payload.
//   3.  for each mutation in turn:
//      restore the file, run regression_hygiene WHILE mutation is in
//      effect, observe exit=1 + drift on the mutated path, restore.
//   4.  exit 0 only if both gates fired correctly.
//
// Pass criterion: this script exits 0 only when the gate fired correctly
// on both MRVN-07 and MRVN-08 mutations.

import { spawn } from "bun";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");

// Two independent mutations: one against MRVN-07 (CORRECTION01), one
// against MRVN-08 (CORRECTION02).  Each is restored hermetically.
interface Target { path: string; modeLabel: string; }

const TARGETS: Target[] = [
  {
    path: "factory/qualify/ACT-MRVN-QUALIFY07/candidates/REF-MRVN07-A01/artifact/manifest.json",
    modeLabel: "MRVN-07",
  },
  {
    path: "factory/qualify/ACT-MRVN-QUALIFY08/REPORT.md",
    modeLabel: "MRVN-08",
  },
];

async function runGate(): Promise<{ out: string; err: string; code: number }> {
  const proc = spawn({
    cmd: ["bun", "factory/qualify/ACT-MRVN-QUALIFY09/lab/regression_hygiene.ts"],
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { out, err, code };
}

async function restoreFromHead(target: string): Promise<void> {
  const restoreProc = spawn({
    cmd: ["git", "checkout", "HEAD", "--", target],
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
  });
  await restoreProc.exited;
}

let allPass = true;
for (const t of TARGETS) {
  const ABS = resolve(REPO, t.path);
  if (!existsSync(ABS)) {
    console.error(`Cannot find target ${ABS}`);
    process.exit(1);
  }
  const orig = readFileSync(ABS);
  const corrupted = orig.toString("utf-8").replace(
    new RegExp(t.modeLabel.replace(/-/g, "\\-")),
    `${t.modeLabel}-CORRUPTED-CORRECTION02-TEST`,
  ) + "\n";
  writeFileSync(ABS, corrupted);
  const mutatedHash = createHash("sha256").update(readFileSync(ABS)).digest("hex");
  console.log(`\n[${t.modeLabel}] mutated ${t.path} to sha256=${mutatedHash.slice(0, 16)}`);

  // Run gate WHILE mutation is still in effect.
  const { out, err, code } = await runGate();

  // Restore (hermetic) AFTER the gate has finished reading.
  await restoreFromHead(t.path);

  const restoreHash = createHash("sha256").update(readFileSync(ABS)).digest("hex");
  console.log(`[${t.modeLabel}] restored ${t.path} to sha256=${restoreHash.slice(0, 16)}`);

  console.log(`--- regression_hygiene stdout (tail, ${t.modeLabel}) ---`);
  console.log(out.split("\n").slice(-15).join("\n"));
  if (err) {
    console.log(`--- regression_hygiene stderr (head, ${t.modeLabel}) ---`);
    console.log(err.split("\n").slice(0, 20).join("\n"));
  }

  const allOutput = out + err;
  const gotDrift = allOutput.includes("Drift count:");
    const driftDeclared = parseInt((allOutput.match(/Drift count: (\d+)/) ?? [, "0"])[1] ?? "0", 10) >= 1;
  const mentioned = allOutput.includes(t.path);
  const ok = code === 1 && gotDrift && driftDeclared && mentioned;
  if (!ok) {
    console.error(`[${t.modeLabel}] FAIL: expected exit=1 with drift on ${t.path}; got exit=${code}, drift=${driftDeclared}, mentioned=${mentioned}`);
    allPass = false;
    continue;
  }
  console.log(`[${t.modeLabel}] PASS: gate correctly detected mutation of ${t.path} with REGRESSION_AUTHORITY_DRIFT.`);
}

if (!allPass) {
  console.error("\nFAIL: at least one negative control did not fire correctly.");
  process.exit(1);
}
console.log("\nPASS: both negative controls (MRVN-07 + MRVN-08 mutations) fired correctly.");
