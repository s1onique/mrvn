#!/usr/bin/env bun
// ACT-MRVN-QUALIFY08 run_classifications.ts
//
// Classifies each candidate via classify.ts and aggregates results.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");
const CANONICAL_KERNEL = resolve(ROOT, "baseline");
const ORACLE = resolve(CANONICAL_KERNEL, "oracle.json");
const CLASSIFY_SCRIPT = resolve(ROOT, "lab/classify.ts");
const CANDIDATES_DIR = resolve(ROOT, "candidates");

async function runCmd(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

async function classifyOne(id: string): Promise<{ id: string; classification: string; exit: number; out: string }> {
  const cdir = resolve(CANDIDATES_DIR, id);
  const resultsPath = resolve(cdir, "result.json");
  const cmd = [
    "bun", CLASSIFY_SCRIPT,
    "--candidate", cdir,
    "--canonical-kernel", CANONICAL_KERNEL,
    "--oracle", ORACLE,
    "--bend-runner", BEND,
    "--results-out", resultsPath,
    "--no-reproof",  // we'll add reproof after we see canonical-failure candidates
  ];
  const r = await runCmd(cmd);
  const stdout = (r.out || "") + (r.err || "");
  return { id, classification: "PENDING", exit: r.exit, out: stdout };
}

async function main() {
  const manifestPath = resolve(ROOT, "lab/candidates.json");
  if (!existsSync(manifestPath)) {
    console.error("missing candidates.json; run gen_candidates.ts first");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const candidates = manifest.candidates as any[];
  const summary: any = {
    act: "ACT-MRVN-QUALIFY08",
    candidate_count: candidates.length,
    classifications: {} as Record<string, number>,
    per_family: {} as Record<string, any>,
    candidates: [] as any[],
    canonical_proof: {
      survived: 0,
      genuine_failures: 0,
      interface_failures: 0,
      frontend_limits: 0,
    },
    family_metrics: {} as Record<string, any>,
    started_at: new Date().toISOString(),
  };
  for (const fam of manifest.families) {
    summary.per_family[fam.letter] = {
      name: fam.name,
      minimum: fam.minimum,
      generated: fam.generated,
      classifications: {} as Record<string, number>,
    };
    summary.family_metrics[fam.letter] = {
      attempts: fam.generated,
      valid_bend: 0,
      semantic_equivalent: 0,
      canonical_proof_survived: 0,
      canonical_proof_failed: 0,
      reproof_passed: 0,
      proof_break_witnesses: 0,
      frontend_limits: 0,
    };
  }
  for (const c of candidates) {
    const r = await classifyOne(c.candidate_id);
    const resultPath = resolve(CANDIDATES_DIR, c.candidate_id, "result.json");
    let cls = "PENDING";
    let details: any = {};
    if (existsSync(resultPath)) {
      try {
        const rj = JSON.parse(readFileSync(resultPath, "utf-8")) as any;
        cls = rj.classification ?? "PENDING";
        details = rj;
      } catch { /* ignore */ }
    } else {
      // classification didn't produce result; classify as INCOMPLETE
      cls = "INCOMPLETE";
    }
    summary.classifications[cls] = (summary.classifications[cls] ?? 0) + 1;
    if (summary.per_family[c.family]) {
      summary.per_family[c.family].classifications[cls] = (summary.per_family[c.family].classifications[cls] ?? 0) + 1;
    }
    if (summary.family_metrics[c.family]) {
      const fm = summary.family_metrics[c.family];
      if (cls === "FRONTEND_LIMIT") fm.frontend_limits++;
      if (cls === "CANONICAL_PROOF_SURVIVED") fm.canonical_proof_survived++;
      if (cls === "EXTENSIONAL_PROOF_BREAK") { fm.canonical_proof_failed++; fm.proof_break_witnesses++; fm.reproof_passed++; }
      if (cls === "SEMANTIC_DRIFT") fm.semantic_equivalent = 0; // explicit no-eq
      if (cls === "INTERFACE_BINDING_FAILURE") fm.frontend_limits++;
      if (cls === "REPROOF_UNRESOLVED") { fm.canonical_proof_failed++; }
      if (cls === "CANONICAL_PROOF_SURVIVED" || cls === "EXTENSIONAL_PROOF_BREAK" || cls === "REPROOF_UNRESOLVED") {
        fm.valid_bend = fm.valid_bend + 1;
      }
      if (cls === "EXTENSIONAL_PROOF_BREAK" || (details.behavior && details.behavior.diff_count === 0 && cls !== "SEMANTIC_DRIFT")) {
        fm.semantic_equivalent++;
      }
    }
    summary.candidates.push({
      candidate_id: c.candidate_id,
      family: c.family,
      classification: cls,
      diff_count: details.behavior?.diff_count ?? -1,
      canonical_proof_exit: details.proof?.canonical ?? "absent",
      reproof: details.proof?.reproof ?? "absent",
      artifact_verify: details.artifact?.verify ?? "absent",
    });
    if (cls === "CANONICAL_PROOF_SURVIVED") summary.canonical_proof.survived++;
    if (cls === "EXTENSIONAL_PROOF_BREAK") summary.canonical_proof.genuine_failures++;
    if (cls === "INTERFACE_BINDING_FAILURE") summary.canonical_proof.interface_failures++;
    if (cls === "FRONTEND_LIMIT") summary.canonical_proof.frontend_limits++;
    console.log(`${c.candidate_id}: ${cls} (exit=${r.exit})`);
  }
  summary.finished_at = new Date().toISOString();
  writeFileSync(resolve(ROOT, "lab/results.json"), JSON.stringify(summary, null, 2));
  console.log(`\nclassifications: ${JSON.stringify(summary.classifications)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
