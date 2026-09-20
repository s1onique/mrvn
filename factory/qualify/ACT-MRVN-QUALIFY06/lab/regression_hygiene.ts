#!/usr/bin/env bun
// ACT-MRVN-06-CORRECTION01: regression_hygiene.ts
//
// Asserts that running the prior-ACT verifiers (MRVN-04 verify.ts,
// MRVN-05 verify_artifact.ts) does NOT mutate any durable evidence
// files under those ACTs' lab/ directory unless explicitly opted in.
//
// The reviewer disposition flagged that an MRVN-04 regression run
// during MRVN-06 overwrote the frozen MRVN-04/lab/results.json (which
// is the durable audit record for that ACT).  This gate is the
// structural enforcement.
//
// Usage:
//   bun factory/qualify/ACT-MRVN-QUALIFY06/lab/regression_hygiene.ts
//     --run
//
// Default mode (without --run) just lists what would change; with
// --run it also executes the verifiers and asserts post-hash equality.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..", "..");

const targets: { name: string; path: string }[] = [
  { name: "MRVN-04 results.json", path: resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY04/lab/results.json") },
  { name: "MRVN-05 artifact manifest", path: resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/artifact/manifest.json") },
];

function sha256(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exit: exitCode ?? 1, out, err };
}

async function main() {
  const runVerifiers = process.argv.includes("--run");

  const preHashes = new Map<string, string | null>();
  for (const t of targets) {
    if (t.path) preHashes.set(t.path, sha256(t.path));
  }

  let verifierResults: any[] = [];

  if (runVerifiers) {
    // MRVN-04 verify with --no-write (the regression-hygienic default).
    const verify = await run(["bun", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY04/lab/verify.ts"), "--no-write"]);
    verifierResults.push({ act: "MRVN-04 verify --no-write", exit: verify.exit });
    // MRVN-05 verify_artifact with --result-out to /tmp (no durable write).
    const verify05 = await run([
      "bun", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts"),
      "--artifact", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/artifact"),
      "--mode", "full",
      "--bend-runner", resolve(REPO, "bend2/main.ts"),
      "--result-out", "/tmp/mrvn06_regression_hygiene_artifact_verify.json",
    ]);
    verifierResults.push({ act: "MRVN-05 verify_artifact --result-out /tmp/...", exit: verify05.exit });
  }

  const postHashes = new Map<string, string | null>();
  for (const t of targets) {
    if (t.path) postHashes.set(t.path, sha256(t.path));
  }

  const drift: { name: string; path: string; pre: string | null; post: string | null }[] = [];
  for (const t of targets) {
    if (!t.path) continue;
    const pre = preHashes.get(t.path) ?? null;
    const post = postHashes.get(t.path) ?? null;
    if (pre !== post) {
      drift.push({ name: t.name, path: t.path, pre, post });
    }
  }

  const report = {
    act: "ACT-MRVN-QUALIFY06-CORRECTION01",
    timestamp: new Date().toISOString(),
    mode: runVerifiers ? "executed" : "static",
    verifier_results: verifierResults,
    drift_count: drift.length,
    drift,
    pass: drift.length === 0,
  };
  writeFileSync(resolve(import.meta.dir, "regression_hygiene_result.json"), JSON.stringify(report, null, 2));

  console.log("=== ACT-MRVN-06 regression hygiene gate ===");
  console.log(`mode: ${runVerifiers ? "executed" : "static"}`);
  for (const v of verifierResults) {
    console.log(`  ${v.act}: exit=${v.exit}`);
  }
  for (const t of targets) {
    if (!t.path) continue;
    const pre = preHashes.get(t.path) ?? null;
    const post = postHashes.get(t.path) ?? null;
    console.log(`  ${t.name}: pre=${pre?.slice(0, 12) ?? "(missing)"} post=${post?.slice(0, 12) ?? "(missing)"} ${pre === post ? "stable" : "DRIFT"}`);
  }
  console.log(`drift_count: ${drift.length}`);
  console.log("");
  console.log(drift.length === 0 ? "PASS: no durable evidence was mutated by regression runs" : "FAIL: regression runs mutated durable evidence");

  if (drift.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(2); });
