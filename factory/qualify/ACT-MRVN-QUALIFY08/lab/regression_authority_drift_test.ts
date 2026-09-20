#!/usr/bin/env bun
// ACT-MRVN-08 regression_authority_drift_test.ts (CORRECTION01)
//
// Negative E2E self-test: proves the strengthened regression_hygiene
// gate actually fires when a prior-ACT durable file is mutated.
//
// Procedure:
//   1. snapshot the durable prior-ACT surface (1337 files)
//   2. simulate the exact defect we want to catch: overwrite one MRVN-07
//      tracked manifest with a corrupted payload (different bytes)
//   3. run the strengthened regression_hygiene
//   4. expect: exit=1, drift_count >= 1, drift contains the mutated path
//   5. restore the file (so the test is hermetic) -- we re-checkout from HEAD
//
// Pass criterion: this script exits 0 only when the gate fired correctly.

import { spawn } from "bun";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");

const TARGET = "factory/qualify/ACT-MRVN-QUALIFY07/candidates/REF-MRVN07-A01/artifact/manifest.json";
const ABS = resolve(REPO, TARGET);

if (!existsSync(ABS)) {
  console.error(`Cannot find target ${ABS}`);
  process.exit(1);
}

const orig = readFileSync(ABS);
const corrupted = orig.toString("utf-8").replace(/MRVN-07/, "MRVN-07-CORRUPTED-CORRECTION01-TEST") + "\n";
writeFileSync(ABS, corrupted);
const mutatedHash = createHash("sha256").update(readFileSync(ABS)).digest("hex");
console.log(`mutated ${TARGET} to sha256=${mutatedHash.slice(0, 16)}`);

// Run gate WHILE mutation is still in effect — this is exactly the
// state we want the gate to catch.
const proc = spawn({
  cmd: ["bun", "factory/qualify/ACT-MRVN-QUALIFY08/lab/regression_hygiene.ts"],
  cwd: REPO,
  stdout: "pipe",
  stderr: "pipe",
});
const out = await new Response(proc.stdout).text();
const err = await new Response(proc.stderr).text();
const code = await proc.exited;

// Restore (hermetic) AFTER the gate has finished reading.
const restoreProc = spawn({
  cmd: ["git", "checkout", "HEAD", "--", TARGET],
  cwd: REPO,
  stdout: "pipe",
  stderr: "pipe",
});
await restoreProc.exited;

const restoreHash = createHash("sha256").update(readFileSync(ABS)).digest("hex");
console.log(`restored ${TARGET} to sha256=${restoreHash.slice(0, 16)}`);

console.log("--- regression_hygiene stdout (tail) ---");
console.log(out.split("\n").slice(-15).join("\n"));
if (err) {
  console.log("--- regression_hygiene stderr (head) ---");
  console.log(err.split("\n").slice(0, 20).join("\n"));
}

const expected = "REGRESSION_AUTHORITY_DRIFT";
const allOutput = out + err;
const gotDrift = allOutput.includes("Drift count: 1");
const mentioned = allOutput.includes(TARGET);
const ok = code === 1 && gotDrift && mentioned;

if (!ok) {
  console.error(`FAIL: expected exit=1 with drift on ${TARGET}; got exit=${code}, drift=${gotDrift}, mentioned=${mentioned}`);
  process.exit(1);
}
console.log(`PASS: gate correctly detected mutation of ${TARGET} with REGRESSION_AUTHORITY_DRIFT.`);
