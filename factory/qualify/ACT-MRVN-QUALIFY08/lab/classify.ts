#!/usr/bin/env bun
// ACT-MRVN-QUALIFY08 classify.ts
//
// Classifies a single proof-break candidate.  See ACT §19-§24.
//
// Phases:
//   0. Authority binding (law hash, intent hash, toolchain closure).
//   1. Implementation validity (parse, type, affine) -- via behavior dump.
//   2. 180-cell behavior generation (Bend) and intent comparison.
//   3. Canonical PROOF run (byte-identical).
//   4. (Optional) REPROOF runs, up to MAX_REPROOF_ATTEMPTS = 3.
//   5. Artifact build + MRVN-05 verify --mode full.
//   6. Final classification.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");

const CANONICAL_IMPL_SHA256 = "eea5d84f80bf9bf3671fad7d47447539891debb010063402174c4c86f0cbf4eb";
const CANONICAL_LAWS_SHA256 = "0feed5f8c080d2c2173fbd213f942938a37dd5ed97d99460bd33ae986d631dc8";
const CANONICAL_PROOF_SHA256 = "c6479516767ef22206df57ff90dd51c85e110c8cacab23cfdcd1276191aa69d8";
const INTENT_ORACLE_SHA256 = "a9c2df5ad4dc40a180bdcf8ca4645c74103cbf312cb5a33c5a973dd87cf852c9";
const TOOLCHAIN_CLOSURE = {
  "bend2/main.ts": "34a8a791b02ce92f247bda4cabcd3ff4eabe500002fedbec4867b5db77ee1feb",
  "bend2/bend.ts": "fe3c2b0b306fccbe44efec349d8f339b6efdaceb090b3d3049c74a1a6015c859",
  "bend2/comp.ts": "c181ac038d7f7d4ed0e1bb81c513e64285347627e0b3a13a98cb86a1d1568f54",
  "bend2/base.bend": "b2d53bbd83639c3ae27260b318efa09de9df6006a556ac6ef41c104ea164917a",
};
const MAX_REPROOF_ATTEMPTS = 3;

interface CliArgs {
  candidate: string;
  canonicalKernel: string;
  oracle: string;
  bendRunner: string;
  resultsOut: string;
  expectedClassification: string | null;
  verifyArtifactFull: boolean;
  artifactRequired: boolean;
  skipArtifact: boolean;
  authorReproof: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const o: any = {
    verifyArtifactFull: true,
    artifactRequired: true,
    skipArtifact: false,
    authorReproof: false,
    expectedClassification: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => { const v = argv[++i]; if (v === undefined) throw new Error("missing value after " + a); return v; };
    if (a === "--candidate") o.candidate = next();
    else if (a === "--canonical-kernel") o.canonicalKernel = next();
    else if (a === "--oracle") o.oracle = next();
    else if (a === "--bend-runner") o.bendRunner = next();
    else if (a === "--results-out") o.resultsOut = next();
    else if (a === "--expected-classification") o.expectedClassification = next();
    else if (a === "--verify-artifact-full") o.verifyArtifactFull = true;
    else if (a === "--no-verify-artifact") o.verifyArtifactFull = false;
    else if (a === "--artifact-required") o.artifactRequired = true;
    else if (a === "--no-artifact-required") o.artifactRequired = false;
    else if (a === "--allow-no-artifact") { o.verifyArtifactFull = false; o.artifactRequired = false; o.skipArtifact = true; }
    else if (a === "--author-reproof") o.authorReproof = true;
    else if (a === "--no-reproof") o.authorReproof = false;
    else throw new Error("unknown flag: " + a);
  }
  for (const k of ["candidate", "canonicalKernel", "oracle", "bendRunner", "resultsOut"]) {
    if (o[k] === undefined) throw new Error("missing required flag: --" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()));
  }
  return o as CliArgs;
}

function sha256File(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch { return null; }
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
      canonical_sha256: sha256File(candProof),
      canonical_failure_kind: null,
      canonical_failure_excerpt: null,
      reproof: "absent",
      reproof_sha256: null,
      reproof_attempts: 0,
      reproof_kind: null,
    },
    behavior: { cells: 0, diff_count: 0, diffs: [], run1_sha256: null, run2_sha256: null },
    intent_status: "NOT_CHECKED",
    artifact: { present: false, verify: "absent", artifact_id: null, failures: 0 },
    classification: "INCOMPLETE",
    rationale: [],
    intended_classification: args.expectedClassification,
    agent_provenance: { attempts: 0, files_edited: [], law_edit_attempts: 0, escape_hatch_attempts: 0 },
  };

  result.candidate_id = basename(candDir);

  const descPath = resolve(candDir, "descriptor.json");
  if (existsSync(descPath)) {
    try {
      const desc = JSON.parse(readFileSync(descPath, "utf-8"));
      result.family = desc.family ?? "";
      result.description = desc.description ?? "";
    } catch { /* ignore */ }
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

  // ------------- Phase 1: behavior generation -------------
  const candBehaviorDir = resolve(candDir, "_behavior");
  if (!existsSync(candBehaviorDir)) mkdirSync(candBehaviorDir, { recursive: true });
  const candDumpPath = resolve(candBehaviorDir, "_dump.bend");

  const genRes = await runCmd([
    "bun", resolve(ROOT, "lab/gen_behavior_driver.ts"),
    "--impl", candMain,
    "--out", candDumpPath,
  ]);
  if (genRes.exit !== 0) {
    result.classification = "FRONTEND_LIMIT";
    result.rationale.push(`gen_behavior_driver failed: exit=${genRes.exit}; output: ${(genRes.err + genRes.out).slice(0, 500)}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }

  const bend1 = await runBend(candDumpPath);
  if (bend1.exit !== 0) {
    result.classification = "FRONTEND_LIMIT";
    result.rationale.push(`Bend dump run1 failed: exit=${bend1.exit}\n${(bend1.err + bend1.out).slice(0, 500)}`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  const body1 = (bend1.out + bend1.err).trim();
  const unquote = (s: string): string => {
    if (!(s.startsWith('"') && s.endsWith('"'))) return s;
    return s.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  };
  const rows1 = unquote(body1).split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  result.behavior.cells = rows1.length;
  result.behavior.run1_sha256 = createHash("sha256").update(body1).digest("hex");

  if (rows1.length !== 180) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`dump has ${rows1.length} rows, expected 180`);
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
  for (const row of rows1) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    bendMap.set(row.slice(0, eq), row.slice(eq + 1));
  }
  let diffCount = 0;
  for (const [k, oracleDec] of oracleMap) {
    const bendDec = bendMap.get(k);
    if (bendDec === undefined || bendDec !== oracleDec) {
      diffCount++;
      if (result.behavior.diffs.length < 20) {
        result.behavior.diffs.push({ key: k, expected: oracleDec, observed: bendDec ?? null });
      }
    }
  }
  result.behavior.diff_count = diffCount;
  if (diffCount > 0) {
    result.intent_status = "SEMANTIC_DRIFT";
    result.classification = "SEMANTIC_DRIFT";
    result.rationale.push(`behavior drift: ${diffCount}/180 cells differ from oracle`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.log(`${result.candidate_id}: ${result.classification}`);
    process.exit(1);
  }
  result.intent_status = "PASS_180_OF_180";

  // Run 2 for determinism on semantic-equivalent candidates
  const bend2 = await runBend(candDumpPath);
  if (bend2.exit === 0) {
    const body2 = (bend2.out + bend2.err).trim();
    result.behavior.run2_sha256 = createHash("sha256").update(body2).digest("hex");
    if (result.behavior.run2_sha256 !== result.behavior.run1_sha256) {
      result.rationale.push(`non-deterministic behavior between run1 and run2`);
    }
  }

  // ------------- Phase 2: canonical PROOF run -------------
  const canonicalProof = await runBend(candProof);
  if (canonicalProof.exit === 0) {
    result.proof.canonical = "pass";
  } else {
    result.proof.canonical = "fail";
    const errText = (canonicalProof.err + canonicalProof.out).trim();
    if (errText.includes("a defined name")) {
      result.proof.canonical_failure_kind = "INTERFACE_FAILURE";
    } else if (errText.includes("an undestructed scrutinee")) {
      result.proof.canonical_failure_kind = "AFFINE_BINDER_VIOLATION";
    } else if (errText.includes("expected")) {
      result.proof.canonical_failure_kind = "DEFINITIONAL_EQUALITY_FAILURE";
    } else {
      result.proof.canonical_failure_kind = "OTHER_PROOF_FAILURE";
    }
    result.proof.canonical_failure_excerpt = errText.split("\n").slice(0, 6).join(" | ");
    writeFileSync(resolve(candDir, "canonical-proof-failure.txt"), errText + "\n");
  }

  // ------------- Phase 3: REPROOF run (only if canonical fails) -------------
  if (result.proof.canonical === "fail" && args.authorReproof) {
    const reproofPath = resolve(candDir, "REPROOF.bend");
    if (existsSync(reproofPath)) {
      let attempt = 0;
      let lastOut = "";
      let lastErr = "";
      while (attempt < MAX_REPROOF_ATTEMPTS) {
        attempt++;
        result.proof.reproof_attempts = attempt;
        const reproofResult = await runBend(reproofPath);
        lastOut = reproofResult.out;
        lastErr = reproofResult.err;
        result.proof.reproof_sha256 = sha256File(reproofPath);
        if (reproofResult.exit === 0) {
          result.proof.reproof = "pass";
          result.proof.reproof_kind = "REPROOF_PASS";
          writeFileSync(resolve(candDir, "reproof-success.txt"), `exit=0\nattempts=${attempt}\n${reproofResult.out}\n`);
          break;
        }
      }
      if (result.proof.reproof !== "pass") {
        result.proof.reproof = "unresolved";
        result.proof.reproof_kind = "REPROOF_UNRESOLVED";
        writeFileSync(resolve(candDir, "reproof-failure.txt"), `attempts=${attempt}\n${lastErr}\n${lastOut}\n`);
      }
    }
  }

  // ------------- Phase 4: artifact build + verify -------------
  let artifactPass = true;
  if (args.verifyArtifactFull && !args.skipArtifact) {
    const artifactDir = resolve(candDir, "artifact");
    const payloadDir = resolve(artifactDir, "payload");
    if (!existsSync(payloadDir)) mkdirSync(payloadDir, { recursive: true });
    copyFileSync(candMain, resolve(payloadDir, "main.bend"));
    copyFileSync(candLaws, resolve(payloadDir, "LAWS.bend"));
    const proofSrc = existsSync(resolve(candDir, "REPROOF.bend"))
      ? resolve(candDir, "REPROOF.bend")
      : candProof;
    copyFileSync(proofSrc, resolve(payloadDir, "PROOF.bend"));

    const buildScript = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/build_artifact.ts");
    const verifyScript = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts");
    const schemaPath = resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/schema/proof-artifact-v1.schema.json");

    const buildCmd = [
      "bun", buildScript,
      "--source", payloadDir,
      "--out", artifactDir,
      "--schema", schemaPath,
      "--subject-name", result.candidate_id,
      "--subject-kind", "bend-module-set",
      "--bend-runner", BEND,
      "--repo", REPO,
      "--source-commit", "",
      "--build-command", `bun factory/qualify/ACT-MRVN-QUALIFY08/lab/classify.ts (candidate ${result.candidate_id})`,
    ];
    const buildRes = await runCmd(buildCmd);
    if (buildRes.exit !== 0) {
      result.artifact.verify = "build_failed";
      result.artifact.failures = 1;
      result.rationale.push(`artifact build failed: ${(buildRes.err + buildRes.out).slice(0, 500)}`);
      artifactPass = false;
    } else {
      result.artifact.present = true;
      try {
        const manifest = JSON.parse(readFileSync(resolve(artifactDir, "manifest.json"), "utf-8")) as any;
        result.artifact.artifact_id = manifest.artifact_id ?? null;
      } catch { /* ignore */ }
      const verifyRes = await runCmd([
        "bun", verifyScript,
        "--artifact", artifactDir,
        "--mode", "full",
        "--bend-runner", BEND,
      ]);
      if (verifyRes.exit === 0) {
        result.artifact.verify = "pass";
      } else {
        result.artifact.verify = "fail";
        result.artifact.failures = (verifyRes.err + verifyRes.out).split("\n").filter((l) => /FAIL|ERROR|MISMATCH/.test(l)).length;
        result.rationale.push(`artifact verify FAILED: ${(verifyRes.err + verifyRes.out).slice(0, 500)}`);
        artifactPass = false;
      }
    }
  }

  // ------------- Phase 5: final classification -------------
  if (result.proof.canonical === "pass") {
    if (args.artifactRequired && (!artifactPass || result.artifact.verify !== "pass")) {
      result.classification = "NO_PROOF_BREAK_CLASSIFICATION";
    } else {
      result.classification = "CANONICAL_PROOF_SURVIVED";
    }
  } else {
    if (result.proof.canonical_failure_kind !== "DEFINITIONAL_EQUALITY_FAILURE" &&
        result.proof.canonical_failure_kind !== "OTHER_PROOF_FAILURE") {
      result.classification = "INTERFACE_BINDING_FAILURE";
    } else if (result.proof.reproof === "pass") {
      if (args.artifactRequired && (!artifactPass || result.artifact.verify !== "pass")) {
        result.classification = "NO_PROOF_BREAK_CLASSIFICATION";
      } else {
        result.classification = "EXTENSIONAL_PROOF_BREAK";
      }
    } else if (result.proof.reproof === "unresolved" || result.proof.reproof === "absent") {
      result.classification = "REPROOF_UNRESOLVED";
    } else {
      result.classification = "REPROOF_UNRESOLVED";
    }
  }

  writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
  console.log(`${result.candidate_id}: classification=${result.classification}`);
  console.log(`  intent_status=${result.intent_status} diff_count=${result.behavior.diff_count}`);
  console.log(`  proof.canonical=${result.proof.canonical} proof.reproof=${result.proof.reproof}`);
  console.log(`  artifact.verify=${result.artifact.verify}`);
  if (result.classification === "NO_PROOF_BREAK_CLASSIFICATION") {
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });



