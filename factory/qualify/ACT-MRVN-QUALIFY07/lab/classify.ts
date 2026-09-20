#!/usr/bin/env bun
// ACT-MRVN-07 classify.ts
//
// Classifies a single refactor candidate.  See ACT §9-§10 for the
// full algorithm.
//
// Phases:
//   0. Authority binding (law hash, intent hash, toolchain closure).
//   1. 180-cell behavior generation (Bend) and intent comparison.
//   2. Canonical PROOF run (byte-identical).
//   3. (Optional) REPROOF runs, up to MAX_REPROOF_ATTEMPTS = 3.
//   4. Artifact build + MRVN-05 verify --mode full (when --verify-artifact-full).
//   5. Final classification.
//
// Exit codes:
//   0 -- candidate fully classified
//   1 -- authority or classification failure (e.g. SEMANTIC_DRIFT or NO_ROBUSTNESS_CLASSIFICATION)
//   2 -- invocation error

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");

const CANONICAL_LAWS_SHA256 = "0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8";
const CANONICAL_PROOF_SHA256 = "c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8";
const INTENT_ORACLE_SHA256 = "a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9";
const TOOLCHAIN_CLOSURE = {
  "bend2/main.ts": "34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb",
  "bend2/bend.ts": "fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859",
  "bend2/comp.ts": "c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54",
  "bend2/base.bend": "b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a",
};

interface CliArgs {
  candidate: string;
  canonicalKernel: string;
  oracle: string;
  bendRunner: string;
  resultsOut: string;
  verifyArtifactFull: boolean;
  artifactRequired: boolean;
  maxReproofAttempts: number;
  // Per ACT-MRVN-07-CORRECTION01: artifact verification is MANDATORY for
  // authoritative runs.  Default is on; opt-out requires --allow-no-artifact.
  skipArtifact: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const o: any = {
    verifyArtifactFull: true,  // mandatory by default for authoritative runs
    artifactRequired: true,    // missing/failing artifact -> NO_ROBUSTNESS_CLASSIFICATION
    maxReproofAttempts: 3,
    skipArtifact: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => { const v = argv[++i]; if (v === undefined) throw new Error("missing value after " + a); return v; };
    if (a === "--candidate") o.candidate = next();
    else if (a === "--canonical-kernel") o.canonicalKernel = next();
    else if (a === "--oracle") o.oracle = next();
    else if (a === "--bend-runner") o.bendRunner = next();
    else if (a === "--results-out") o.resultsOut = next();
    else if (a === "--verify-artifact-full") o.verifyArtifactFull = true;
    else if (a === "--no-verify-artifact") o.verifyArtifactFull = false;
    else if (a === "--artifact-required") o.artifactRequired = true;
    else if (a === "--no-artifact-required") o.artifactRequired = false;
    else if (a === "--allow-no-artifact") { o.verifyArtifactFull = false; o.artifactRequired = false; o.skipArtifact = true; }
    else if (a === "--max-reproof-attempts") o.maxReproofAttempts = parseInt(next(), 10);
    else throw new Error("unknown flag: " + a);
  }
  for (const k of ["candidate", "canonicalKernel", "oracle", "bendRunner", "resultsOut"]) {
    if (!o[k]) throw new Error("missing --" + k);
  }
  return o;
}

function sha256File(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

async function runCmd(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

async function runBend(filePath: string): Promise<{ exit: number; out: string; err: string }> {
  return await runCmd(["bun", BEND, filePath]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candDir = resolve(args.candidate);
  const candMain = resolve(candDir, "main.bend");
  const candLaws = resolve(candDir, "LAWS.bend");
  const candProof = resolve(candDir, "PROOF.bend");

  const result: any = {
    candidate_id: "",
    family: "",
    description: "",
    implementation_sha256: sha256File(candMain),
    laws_sha256: sha256File(candLaws),
    intent_sha256: sha256File(args.oracle),
    proof: {
      canonical: "absent",
      reproof: "absent",
      canonical_sha256: sha256File(candProof),
      reproof_sha256: null,
    },
    behavior: { cells: 0, diff_count: 0, diffs: [] },
    intent_status: "NOT_CHECKED",
    artifact: { present: false, verify: "absent", artifact_id: null, failures: 0 },
    classification: "INCOMPLETE",
    rationale: [],
  };

  result.candidate_id = candDir.split("/").pop()!;

  const descPath = resolve(candDir, "descriptor.json");
  if (existsSync(descPath)) {
    const desc = JSON.parse(readFileSync(descPath, "utf-8"));
    result.family = desc.family ?? "";
    result.description = desc.description ?? "";
  }

  // ------------- Phase 0: authority binding -------------

  if (result.laws_sha256 !== CANONICAL_LAWS_SHA256) {
    result.classification = "DIFFERENT_SPECIFICATION";
    result.rationale.push(`laws_sha256 mismatch: got ${result.laws_sha256}, expected ${CANONICAL_LAWS_SHA256}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  if (result.intent_sha256 !== INTENT_ORACLE_SHA256) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`intent_oracle_sha256 mismatch`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  for (const [rel, expectedSha] of Object.entries(TOOLCHAIN_CLOSURE)) {
    const live = sha256File(resolve(REPO, rel));
    if (live !== expectedSha) {
      result.classification = "TOOLCHAIN_MISMATCH";
      result.rationale.push(`toolchain drift: ${rel} got ${live} expected ${expectedSha}`);
      writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
      console.log(`${result.candidate_id}: ${result.classification}`);
      process.exit(1);
    }
  }


  // ------------- Phase 1: behavior generation and comparison -------------

  const candBehaviorDir = resolve(candDir, "_behavior");
  if (!existsSync(candBehaviorDir)) mkdirSync(candBehaviorDir, { recursive: true });
  const candDumpPath = resolve(candBehaviorDir, "_dump.bend");

  const genRes = await runCmd([
    "bun", resolve(ROOT, "lab/gen_behavior_driver.ts"),
    "--impl", candMain,
    "--out", candDumpPath,
  ]);
  if (genRes.exit !== 0) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`gen_behavior_driver failed: ${genRes.err}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }

  const bendRes = await runBend(candDumpPath);
  if (bendRes.exit !== 0) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`Bend dump failed: exit=${bendRes.exit}\n${bendRes.err}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  const bendText = (bendRes.out + bendRes.err).trim();
  if (!(bendText.startsWith('"') && bendText.endsWith('"'))) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push("dump output is not a quoted string");
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  const body = bendText.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const rows = body.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  result.behavior.cells = rows.length;
  if (rows.length !== 180) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`dump has ${rows.length} rows, expected 180`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }

  const oracle = JSON.parse(readFileSync(args.oracle, "utf-8"));
  if (oracle.cell_count !== 180) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`oracle cell_count=${oracle.cell_count}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  const oracleMap = new Map<string, string>();
  for (const r of oracle.rows) {
    oracleMap.set(`${r.actor}|${r.capability}|${r.lifecycle}|${r.evidence}`, r.decision);
  }
  const bendMap = new Map<string, string>();
  for (const row of rows) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    bendMap.set(row.slice(0, eq), row.slice(eq + 1));
  }
  let diffCount = 0;
  for (const [k, oracleDec] of oracleMap) {
    const bendDec = bendMap.get(k);
    if (bendDec === undefined || bendDec !== oracleDec) {
      diffCount++;
      result.behavior.diffs.push({
        actor: k.split("|")[0],
        capability: k.split("|")[1],
        lifecycle: k.split("|")[2],
        evidence: k.split("|")[3],
        expected: oracleDec,
        observed: bendDec ?? "(missing)",
      });
    }
  }
  result.behavior.diff_count = diffCount;
  result.intent_status = diffCount === 0 ? "EQUIVALENT" : "DIVERGENT";

  const behaviorJson = {
    candidate_id: result.candidate_id,
    cells: result.behavior.cells,
    diff_count: result.behavior.diff_count,
    diffs: result.behavior.diffs,
    behavior_dump_sha256: sha256File(candDumpPath),
    behavior_dump_path: "_behavior/_dump.bend",
  };
  writeFileSync(resolve(candDir, "behavior.json"), JSON.stringify(behaviorJson, null, 2) + "\n");

  if (diffCount !== 0) {
    result.classification = "SEMANTIC_DRIFT";
    result.rationale.push(`behavior divergence: ${diffCount} cell(s)`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification} (${diffCount} diffs)`);
    process.exit(1);
  }

  // ------------- Phase 2: canonical proof run -------------

  if (result.proof.canonical_sha256 !== CANONICAL_PROOF_SHA256) {
    result.proof.canonical = "fail";
    result.rationale.push(`PROOF.bend sha256 mismatch: got ${result.proof.canonical_sha256} expected ${CANONICAL_PROOF_SHA256}`);
  } else {
    const proofRes = await runBend(candProof);
    if (proofRes.exit === 0 && proofRes.out.trim() === "All terms check.") {
      result.proof.canonical = "pass";
    } else {
      result.proof.canonical = "fail";
      result.rationale.push(`canonical PROOF failed: exit=${proofRes.exit}, out=${proofRes.out.slice(0, 200)}`);
    }
  }

  // ------------- Phase 3: reproof attempts -------------

  if (result.proof.canonical !== "pass") {
    for (let attempt = 1; attempt <= args.maxReproofAttempts; attempt++) {
      const reproofPath = resolve(candDir, "REPROOF.bend");
      if (!existsSync(reproofPath)) {
        result.rationale.push(`reproof attempt ${attempt}: REPROOF.bend missing`);
        break;
      }
      const reproofSha = sha256File(reproofPath);
      const reproofRes = await runBend(reproofPath);
      const reproofOk = reproofRes.exit === 0 && reproofRes.out.trim() === "All terms check.";
      result.rationale.push(`reproof attempt ${attempt}: exit=${reproofRes.exit}, pass=${reproofOk}, sha256=${reproofSha}`);
      if (reproofOk) {
        result.proof.reproof = "pass";
        result.proof.reproof_sha256 = reproofSha;
        break;
      } else {
        result.rationale.push(`reproof attempt ${attempt} stdout: ${reproofRes.out.slice(0, 200)}`);
        result.rationale.push(`reproof attempt ${attempt} stderr: ${reproofRes.err.slice(0, 200)}`);
      }
    }
  }

  if (result.proof.reproof === "pass") {
    const genRes2 = await runCmd([
      "bun", resolve(ROOT, "lab/gen_behavior_driver.ts"),
      "--impl", candMain,
      "--out", candDumpPath,
    ]);
    const bendRes2 = await runBend(candDumpPath);
    const t2 = (bendRes2.out + bendRes2.err).trim();
    const b2 = t2.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
    const r2 = b2.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const m2 = new Map<string, string>();
    for (const row of r2) {
      const eq = row.indexOf("=");
      if (eq < 0) continue;
      m2.set(row.slice(0, eq), row.slice(eq + 1));
    }
    let drift2 = 0;
    for (const [k, v] of oracleMap) {
      if (m2.get(k) !== v) drift2++;
    }
    if (drift2 !== 0) {
      result.classification = "SEMANTIC_DRIFT";
      result.rationale.push(`semantic drift after reproof: ${drift2} cell(s)`);
      writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
      console.log(`${result.candidate_id}: ${result.classification} (post-reproof drift)`);
      process.exit(1);
    }
  }

  // ------------- Phase 4.5: artifact build and verify -------------

  // Determine the "intended" classification BEFORE the artifact gate, so that
  // we know whether to attempt auto-building the artifact.
  let intendedClassification: string;
  if (result.proof.canonical === "pass") {
    intendedClassification = "ROBUST";
  } else if (result.proof.reproof === "pass") {
    intendedClassification = "REPROOF_REQUIRED";
  } else if (result.proof.canonical === "fail") {
    intendedClassification = "PROOF_REPAIR_FAILED";
  } else {
    intendedClassification = "UNRESOLVED_PROOF";
  }
  result.intended_classification = intendedClassification;

  let artifactGates = true;
  if (args.verifyArtifactFull && !args.skipArtifact) {
    const artifactDir = resolve(candDir, "artifact");
    const buildScript = resolve(ROOT, "lab/build_artifact.ts");
    const verifyScript = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts");

    // Auto-build the artifact ONLY when the candidate would otherwise be
    // ROBUST or REPROOF_REQUIRED.  For other classes we record "not built"
    // and proceed.
    const shouldBuild =
      intendedClassification === "ROBUST" || intendedClassification === "REPROOF_REQUIRED";
    if (!existsSync(artifactDir) && shouldBuild) {
      // build_artifact.ts --candidate expects the candidate_id (looked up
      // in candidates.json), not the directory path.
      const candidateId = basename(candDir);
      const buildRes = await runCmd([
        "bun", buildScript,
        "--candidate", candidateId,
        "--classification", intendedClassification,
      ]);
      if (buildRes.exit !== 0) {
        result.artifact.present = false;
        result.artifact.verify = "build_failed";
        result.rationale.push(`artifact build FAILED: ${(buildRes.out + buildRes.err).slice(0, 500)}`);
        artifactGates = false;
      }
    }
    if (existsSync(artifactDir)) {
      result.artifact.present = true;
      const verifyRes = await runCmd([
        "bun", verifyScript,
        "--artifact", artifactDir,
        "--mode", "full",
        "--bend-runner", BEND,
      ]);
      if (verifyRes.exit === 0) {
        result.artifact.verify = "pass";
        try {
          result.artifact.artifact_id = JSON.parse(readFileSync(resolve(artifactDir, "manifest.json"), "utf-8")).artifact_id;
        } catch { result.artifact.artifact_id = null; }
      } else {
        result.artifact.verify = "fail";
        result.artifact.failures = (verifyRes.out + verifyRes.err).split("\n").filter((l) => /FAIL|ERROR|MISMATCH/.test(l)).length;
        result.rationale.push(`artifact verify FAILED: ${(verifyRes.out + verifyRes.err).slice(0, 500)}`);
      }
    } else {
      result.artifact.present = false;
      result.rationale.push("artifact absent");
    }
    if (args.artifactRequired && shouldBuild && (!result.artifact.present || result.artifact.verify !== "pass")) {
      artifactGates = false;
    }
  }

  // ------------- Phase 5: final classification -------------

  if (!artifactGates) {
    result.classification = "NO_ROBUSTNESS_CLASSIFICATION";
  } else if (intendedClassification === "ROBUST") {
    result.classification = "ROBUST";
  } else if (intendedClassification === "REPROOF_REQUIRED") {
    result.classification = "REPROOF_REQUIRED";
  } else if (intendedClassification === "PROOF_REPAIR_FAILED") {
    result.classification = "PROOF_REPAIR_FAILED";
  } else {
    result.classification = "UNRESOLVED_PROOF";
  }

  writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
  console.log(`${result.candidate_id}: classification=${result.classification}`);
  console.log(`  intent_status=${result.intent_status} diff_count=${result.behavior.diff_count}`);
  console.log(`  proof.canonical=${result.proof.canonical} proof.reproof=${result.proof.reproof}`);
  console.log(`  artifact.verify=${result.artifact.verify}`);

  if (result.classification === "NO_ROBUSTNESS_CLASSIFICATION") {
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });

