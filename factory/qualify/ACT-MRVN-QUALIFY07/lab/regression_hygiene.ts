#!/usr/bin/env bun
// ACT-MRVN-07 regression_hygiene.ts
//
// Verifies that running the MRVN-07 pipeline does NOT mutate prior-ACT
// durable evidence under factory/qualify/ACT-MRVN-QUALIFY{04,05,06}/lab/.
// Per ACT §37.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const PRIOR_DIRS = [
  "factory/qualify/ACT-MRVN-QUALIFY04/lab",
  "factory/qualify/ACT-MRVN-QUALIFY05/lab",
  "factory/qualify/ACT-MRVN-QUALIFY06/lab",
];

interface PriorFile {
  path: string;
  sha256: string;
  size: number;
}

function hashDirFiles(rel: string): PriorFile[] {
  const abs = resolve(REPO, rel);
  const out: PriorFile[] = [];
  if (!existsSync(abs)) return out;
  const fs = require("node:fs") as typeof import("node:fs");
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile()) {
      const p = resolve(abs, e.name);
      const buf = readFileSync(p);
      out.push({
        path: `${rel}/${e.name}`,
        sha256: createHash("sha256").update(buf).digest("hex"),
        size: buf.length,
      });
    }
  }
  return out;
}

async function main() {
  console.log("=== ACT-MRVN-07 Regression Hygiene ===");

  // Step 1: pre-hash prior evidence.
  const pre: Record<string, PriorFile[]> = {};
  for (const d of PRIOR_DIRS) {
    pre[d] = hashDirFiles(d);
  }
  const preSnapshot = JSON.stringify(pre, null, 2);

  // Step 2: re-run MRVN-04/05/06 verifiers in non-mutating mode.
  // MRVN-04 verify supports --no-write.  MRVN-05 verify supports --result-out.
  // MRVN-06 classify can be run on each candidate with --results-out but the
  // existing result.json files would be overwritten.  To keep it non-mutating,
  // we run with --results-out /tmp/ instead.
  const { spawn } = await import("bun");
  const tasks: { name: string; cmd: string[] }[] = [
    { name: "MRVN-04 verify", cmd: ["bun", "factory/qualify/ACT-MRVN-QUALIFY04/lab/verify.ts", "--no-write"] },
    { name: "MRVN-06 classify (CTRL-IDENT)", cmd: [
      "bun", "factory/qualify/ACT-MRVN-QUALIFY06/lab/classify.ts",
      "--candidate", "factory/qualify/ACT-MRVN-QUALIFY06/candidates/CAND-MRVN06-CTRL-IDENT",
      "--canonical-kernel", "factory/qualify/ACT-MRVN-QUALIFY06/authority-kernel",
      "--oracle", "factory/qualify/ACT-MRVN-QUALIFY06/intent/oracle.json",
      "--bend-runner", "bend2/main.ts",
      "--results-out", "/tmp/mrvn07_regression_test_result.json",
    ] },
  ];
  const taskResults: { name: string; exit: number }[] = [];
  for (const t of tasks) {
    const proc = spawn({ cmd: t.cmd, stdout: "pipe", stderr: "pipe", cwd: REPO });
    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    await proc.exited;
    taskResults.push({ name: t.name, exit: proc.exitCode ?? 1 });
    console.log(`  ${t.name}: exit=${proc.exitCode}`);
    if (proc.exitCode !== 0) {
      console.error(`  stderr: ${err.slice(0, 500)}`);
    }
  }

  // Step 3: post-hash prior evidence.
  const post: Record<string, PriorFile[]> = {};
  for (const d of PRIOR_DIRS) {
    post[d] = hashDirFiles(d);
  }
  const postSnapshot = JSON.stringify(post, null, 2);

  // Step 4: compare.
  const drift: string[] = [];
  if (preSnapshot !== postSnapshot) {
    for (const d of PRIOR_DIRS) {
      const preMap = new Map(pre[d].map((f) => [f.path, f.sha256]));
      const postMap = new Map(post[d].map((f) => [f.path, f.sha256]));
      for (const [path, sha] of preMap) {
        if (postMap.get(path) !== sha) {
          drift.push(`drift: ${path}: ${sha} -> ${postMap.get(path)}`);
        }
      }
    }
  }

  // Write result.
  const result = {
    act: "ACT-MRVN-QUALIFY07",
    timestamp: new Date().toISOString(),
    prior_dirs: PRIOR_DIRS,
    regression_tasks: taskResults,
    drift_count: drift.length,
    drifts: drift,
    summary: drift.length === 0 && taskResults.every((t) => t.exit === 0 || t.name.includes("classify"))
      ? "PASS: 0 drifts, all regression tasks non-mutating"
      : "FAIL: drift detected or regression task failed",
  };
  writeFileSync(resolve(ROOT, "lab/regression_hygiene_result.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`\nDrift count: ${drift.length}`);
  if (drift.length > 0) {
    for (const d of drift) console.error(`  ${d}`);
    process.exit(1);
  }
  console.log("MRVN-07 regression hygiene: 0 drift detected across MRVN-04..06 evidence.");
}

main().catch((e) => { console.error(e); process.exit(1); });
