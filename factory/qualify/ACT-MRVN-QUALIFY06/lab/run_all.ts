#!/usr/bin/env bun
// ACT-MRVN-06 run_all.ts
//
// Orchestrator: takes the candidate manifest, generates each
// candidate's main.bend, classifies it, and writes per-candidate
// result.json + a global summary.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");

interface CandidateSpec {
  candidate_id: string;
  family: string;
  description: string;
  expected_class?: string;
  descriptor: any;
}

function parseManifest() {
  const path = resolve(ROOT, "lab/candidates.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

async function main() {
  // ACT-MRVN-06-CORRECTION01: wipe stale lab/results.json so the global
  // summary is freshly computed from this run.  Without this, the
  // per-candidate reclassification (--verify-artifact-full) would mix
  // with stale entries from a prior run.
  const resultsPath = resolve(ROOT, "lab/results.json");
  if (existsSync(resultsPath)) {
    try { unlinkSync(resultsPath); } catch { /* best effort */ }
  }
  const manifest = parseManifest();

  const canonLawsPath = resolve(ROOT, "authority-kernel/LAWS.bend");
  const oraclePath = resolve(ROOT, "intent/oracle.json");
  const canonLawsSha = createHash("sha256").update(readFileSync(canonLawsPath)).digest("hex");
  const oracleSha = createHash("sha256").update(readFileSync(oraclePath)).digest("hex");
  if (canonLawsSha !== manifest.canonical_laws_sha256) {
    console.error(`FAIL: canonical LAWS.bend hash drift (${canonLawsSha} != ${manifest.canonical_laws_sha256})`);
    process.exit(1);
  }
  if (oracleSha !== manifest.intent_oracle_sha256) {
    console.error(`FAIL: intent oracle hash drift (${oracleSha} != ${manifest.intent_oracle_sha256})`);
    process.exit(1);
  }

  const summary: any = {
    act: "ACT-MRVN-QUALIFY06",
    timestamp: new Date().toISOString(),
    canonical_laws_sha256: canonLawsSha,
    intent_oracle_sha256: oracleSha,
    counts: {
      total: 0, law_satisfied: 0, law_refuted: 0, unresolved: 0,
      equivalent_survivors: 0, specification_gaps: 0,
      different_specification: 0, behavior_evidence_mismatch: 0,
      canonical_proof_survivors: 0, reproof_survivors: 0,
    },
    classifications: {},
    candidates: [],
  };

  for (const spec of manifest.candidates) {
    summary.counts.total++;
    console.log("");
    console.log(`=== ${spec.candidate_id} (family=${spec.family}) ===`);
    const candDir = resolve(ROOT, "candidates", spec.candidate_id);
    mkdirSync(candDir, { recursive: true });

    const descPath = resolve(candDir, "descriptor.json");
    writeFileSync(descPath, JSON.stringify(spec.descriptor, null, 2) + "\n");

    const lawsPath = resolve(candDir, "LAWS.bend");
    const canonLawsBytes = readFileSync(canonLawsPath);
    writeFileSync(lawsPath, canonLawsBytes);
    const candLawsSha = createHash("sha256").update(canonLawsBytes).digest("hex");
    if (candLawsSha !== canonLawsSha) {
      console.error(`  FAIL: LAWS.bend hash mismatch for ${spec.candidate_id}`);
      process.exit(1);
    }

    const proofPath = resolve(candDir, "PROOF.bend");
    writeFileSync(proofPath, readFileSync(resolve(ROOT, "authority-kernel/PROOF.bend")));

    const implPath = resolve(candDir, "main.bend");
    const genRes = await run([
      "bun", resolve(ROOT, "lab/make_candidate.ts"),
      "--descriptor", descPath,
      "--out", implPath,
    ]);
    if (genRes.exit !== 0) {
      console.error("  FAIL: make_candidate failed:");
      console.error(genRes.err);
      process.exit(1);
    }

    if (spec.descriptor.reproof) {
      writeFileSync(resolve(candDir, "REPROOF.bend"), readFileSync(spec.descriptor.reproof));
    }
    if (spec.descriptor.counterexample) {
      writeFileSync(resolve(candDir, "COUNTEREXAMPLE.bend"), readFileSync(spec.descriptor.counterexample));
    }
    // Auto-generate a counterexample for any candidate whose expected_class
    // is LAW_REFUTED and which has a `law_refutation_witness` in its descriptor.
    if (spec.expected_class === "LAW_REFUTED" && spec.descriptor.law_refutation_witness && !spec.descriptor.counterexample) {
      const w = spec.descriptor.law_refutation_witness;
      const exp = spec.descriptor.law_refutation_expected;
      if (!w || !exp) {
        console.error(`  FAIL: LAW_REFUTED candidate ${spec.candidate_id} missing law_refutation_witness/expected`);
        process.exit(1);
      }
      const ceProc = await run([
        "bun", resolve(ROOT, "lab/make_counterexample.ts"),
        "--witness", w,
        "--expected", exp,
        "--out", resolve(candDir, "COUNTEREXAMPLE.bend"),
      ]);
      if (ceProc.exit !== 0) {
        console.error(`  FAIL: counterexample generation failed for ${spec.candidate_id}`);
        console.error(ceProc.err);
        process.exit(1);
      }
    }

    const classifyArgs = [
      "bun", resolve(ROOT, "lab/classify.ts"),
      "--candidate", candDir,
      "--canonical-kernel", resolve(ROOT, "authority-kernel"),
      "--oracle", oraclePath,
      "--bend-runner", resolve(ROOT, "../../../bend2/main.ts"),
      "--results-out", resolve(candDir, "result.json"),
    ];
    if (spec.expected_class) {
      classifyArgs.push("--expected-class", spec.expected_class);
    }
    const clsRes = await run(classifyArgs);

    const resultPath = resolve(candDir, "result.json");
    if (!existsSync(resultPath)) {
      console.error("  FAIL: result.json missing");
      console.error(clsRes.out);
      console.error(clsRes.err);
      process.exit(1);
    }
    const provisionalResult = JSON.parse(readFileSync(resultPath, "utf-8")) as any;

    // ACT-MRVN-06-CORRECTION01 pipeline:
    //   1) provisional classify (no artifact verify, since artifact not built yet)
    //   2) build artifact for every survivor/gap candidate
    //   3) re-classify with --verify-artifact-full and --artifact-required
    //      so the final classification is gated on a verifying portable artifact.
    const survivorsAndGaps = ["EQUIVALENT_SURVIVOR", "SPECIFICATION_GAP"];
    let result: any = provisionalResult;
    if (survivorsAndGaps.includes(provisionalResult.classification)) {
      const buildRes = await run([
        "bun", resolve(ROOT, "lab/build_candidate_artifacts.ts"),
        "--candidates-root", resolve(ROOT, "candidates"),
        "--only", spec.candidate_id,
      ]);
      if (buildRes.exit !== 0) {
        console.error(`  FAIL: artifact build failed for ${spec.candidate_id}`);
        console.error(buildRes.out);
        console.error(buildRes.err);
        process.exit(1);
      }
      const reclassifyArgs = [
        "bun", resolve(ROOT, "lab/classify.ts"),
        "--candidate", candDir,
        "--canonical-kernel", resolve(ROOT, "authority-kernel"),
        "--oracle", oraclePath,
        "--bend-runner", resolve(ROOT, "../../../bend2/main.ts"),
        "--results-out", resolve(candDir, "result.json"),
        "--verify-artifact-full",
        "--artifact-required",
      ];
      if (spec.expected_class) {
        reclassifyArgs.push("--expected-class", spec.expected_class);
      }
      const recRes = await run(reclassifyArgs);
      // reclassifier may exit non-zero on NO_GAP_CLASSIFICATION; that is fine,
      // we still read the result.json it wrote.
      if (existsSync(resultPath)) {
        result = JSON.parse(readFileSync(resultPath, "utf-8")) as any;
      }
      if (!existsSync(resultPath)) {
        console.error("  FAIL: re-classify result.json missing");
        console.error(recRes.out);
        console.error(recRes.err);
        process.exit(1);
      }
    }

    const c = result.classification;
    summary.classifications[c] = (summary.classifications[c] ?? 0) + 1;
    if (c === "EQUIVALENT_SURVIVOR") summary.counts.equivalent_survivors++;
    if (c === "SPECIFICATION_GAP") summary.counts.specification_gaps++;
    if (c === "LAW_REFUTED") summary.counts.law_refuted++;
    if (c === "UNRESOLVED") summary.counts.unresolved++;
    if (c === "DIFFERENT_SPECIFICATION") summary.counts.different_specification++;
    if (c === "BEHAVIOR_EVIDENCE_MISMATCH") summary.counts.behavior_evidence_mismatch++;
    if (c === "EQUIVALENT_SURVIVOR" || c === "SPECIFICATION_GAP") {
      summary.counts.law_satisfied++;
    }
    if (result.law_status === "SATISFIED") {
      if (result.proof.canonical === "pass") summary.counts.canonical_proof_survivors++;
      if (result.proof.reproof === "pass") summary.counts.reproof_survivors++;
    }
    summary.candidates.push({
      candidate_id: spec.candidate_id,
      family: spec.family,
      expected_class: spec.expected_class ?? null,
      classification: c,
      law_status: result.law_status,
      intent_status: result.intent_status,
      diff_count: result.behavior.diff_count,
      proof: result.proof,
      implementation_sha256: result.implementation_sha256,
      laws_sha256: result.laws_sha256,
      intent_sha256: result.intent_sha256,
      expected_mismatch: result.expected_mismatch ?? null,
    });
  }

  const summaryPath = resolve(ROOT, "lab/results.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log("");
  console.log("=== ACT-MRVN-06 summary ===");
  console.log(`total candidates: ${summary.counts.total}`);
  console.log(`law_satisfied:    ${summary.counts.law_satisfied}`);
  console.log(`equivalent_survivors: ${summary.counts.equivalent_survivors}`);
  console.log(`specification_gaps:    ${summary.counts.specification_gaps}`);
  console.log(`law_refuted:      ${summary.counts.law_refuted}`);
  console.log(`unresolved:       ${summary.counts.unresolved}`);
  console.log(`different_specification: ${summary.counts.different_specification}`);
  console.log(`canonical_proof_survivors: ${summary.counts.canonical_proof_survivors}`);
  console.log(`reproof_survivors:        ${summary.counts.reproof_survivors}`);
}

main().catch((e) => { console.error(e); process.exit(2); });