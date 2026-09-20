#!/usr/bin/env bun
// ACT-MRVN-06 classify.ts
//
// The candidate classifier.  See ACT §23-§28 for the full algorithm.
//
// Phase 1: Verify law-hash binding.
// Phase 2: Run canonical PROOF.bend; on fail, try REPROOF.bend; then COUNTEREXAMPLE.bend.
// Phase 3: Generate behavior dump (always).
// Phase 4: Compare behavior to oracle.
// Phase 5: Final classification per ACT §10.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");

function parseArgs(argv: string[]): {
  candidate: string; canonicalKernel: string; oracle: string;
  bendRunner: string; resultsOut: string;
  expectedClass: string | null; includeBindingTests: boolean;
  verifyArtifactFull: boolean; artifactRequired: boolean;
} {
  const o: any = {
    includeBindingTests: false, expectedClass: null,
    verifyArtifactFull: false, artifactRequired: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => { const v = argv[++i]; if (v === undefined) throw new Error("missing value after " + a); return v; };
    if (a === "--candidate") o.candidate = next();
    else if (a === "--canonical-kernel") o.canonicalKernel = next();
    else if (a === "--oracle") o.oracle = next();
    else if (a === "--bend-runner") o.bendRunner = next();
    else if (a === "--results-out") o.resultsOut = next();
    else if (a === "--include-binding-tests") o.includeBindingTests = true;
    else if (a === "--expected-class") o.expectedClass = next();
    else if (a === "--verify-artifact-full") o.verifyArtifactFull = true;
    else if (a === "--artifact-required") o.artifactRequired = true;
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

async function runBend(filePath: string): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({
    cmd: ["bun", BEND, filePath],
    stdout: "pipe", stderr: "pipe",
    cwd: REPO,
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

interface CandidateResult {
  candidate_id: string;
  implementation_sha256: string;
  laws_sha256: string;
  intent_sha256: string;
  proof: {
    canonical: "pass" | "fail" | "absent";
    reproof: "pass" | "fail" | "absent";
    counterexample: "pass" | "fail" | "absent";
    canonical_sha256: string | null;
    reproof_sha256: string | null;
    counterexample_sha256: string | null;
  };
  law_status: "SATISFIED" | "REFUTED" | "UNRESOLVED" | "UNKNOWN";
  behavior: {
    cells: number;
    diff_count: number;
    diffs: { actor: string; capability: string; lifecycle: string; evidence: string; expected: string; observed: string }[];
  };
  intent_status: "EQUIVALENT" | "DIVERGENT" | "NOT_CHECKED";
  artifact: {
    present: boolean;
    verify: "pass" | "fail" | "absent" | "skipped";
    artifact_id: string | null;
    failures: number;
  };
  classification: string;
  rationale: string[];
  expected_class?: string;
  expected_mismatch?: boolean;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candDir = resolve(args.candidate);
  const canonDir = resolve(args.canonicalKernel);
  const oraclePath = resolve(args.oracle);

  const candLawsPath = resolve(candDir, "LAWS.bend");
  const candImplPath = resolve(candDir, "main.bend");
  const candProofPath = resolve(candDir, "PROOF.bend");
  const candReproofPath = resolve(candDir, "REPROOF.bend");
  const candCounterPath = resolve(candDir, "COUNTEREXAMPLE.bend");
  const canonLawsPath = resolve(canonDir, "LAWS.bend");

  const candLawsSha = sha256File(candLawsPath);
  const candImplSha = sha256File(candImplPath);
  const canonLawsSha = sha256File(canonLawsPath);
  const oracleText = readFileSync(oraclePath, "utf-8");
  const oracleSha = createHash("sha256").update(oracleText).digest("hex");
  const oracleJson = JSON.parse(oracleText) as { intent_text_sha256: string; cell_count: number; rows: any[] };
  if (oracleJson.cell_count !== 180) {
    console.error("FAIL: oracle has wrong cell count:", oracleJson.cell_count);
    process.exit(1);
  }
  const oracleMap = new Map<string, string>();
  for (const r of oracleJson.rows) {
    oracleMap.set(`${r.actor}|${r.capability}|${r.lifecycle}|${r.evidence}`, r.decision);
  }

  const result: CandidateResult = {
    candidate_id: basename(candDir),
    implementation_sha256: candImplSha ?? "",
    laws_sha256: candLawsSha ?? "",
    intent_sha256: oracleSha,
    proof: {
      canonical: "absent", reproof: "absent", counterexample: "absent",
      canonical_sha256: null, reproof_sha256: null, counterexample_sha256: null,
    },
    law_status: "UNKNOWN",
    behavior: { cells: 0, diff_count: 0, diffs: [] },
    intent_status: "NOT_CHECKED",
    artifact: { present: false, verify: "absent", artifact_id: null, failures: 0 },
    classification: "INCOMPLETE",
    rationale: [],
  };

  // Phase 1: law-hash binding.
  if (candLawsSha !== canonLawsSha) {
    result.classification = "DIFFERENT_SPECIFICATION";
    result.rationale.push(`LAWS.bend hash mismatch (cand=${candLawsSha}, canon=${canonLawsSha})`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    console.error("FAIL: LAWS.bend hash mismatch");
    process.exit(1);
  }

  // Phase 2: PROOF / REPROOF / COUNTEREXAMPLE.
  if (existsSync(candProofPath)) {
    result.proof.canonical_sha256 = sha256File(candProofPath);
    const r = await runBend(candProofPath);
    result.proof.canonical = r.exit === 0 ? "pass" : "fail";
  }
  if (result.proof.canonical !== "pass" && existsSync(candReproofPath)) {
    result.proof.reproof_sha256 = sha256File(candReproofPath);
    const r = await runBend(candReproofPath);
    result.proof.reproof = r.exit === 0 ? "pass" : "fail";
  }
  if (result.proof.canonical !== "pass" && result.proof.reproof !== "pass") {
    if (existsSync(candCounterPath)) {
      result.proof.counterexample_sha256 = sha256File(candCounterPath);
      const r = await runBend(candCounterPath);
      const text = (r.out + r.err).trim();
      result.proof.counterexample = (r.exit === 0 && /True\{\}/.test(text)) ? "pass" : "fail";
    }
  }

  if (result.proof.canonical === "pass") {
    result.law_status = "SATISFIED";
    result.rationale.push("canonical PROOF passes");
  } else if (result.proof.reproof === "pass") {
    result.law_status = "SATISFIED";
    result.rationale.push("canonical PROOF fails; REPROOF passes");
  } else if (result.proof.counterexample === "pass") {
    result.law_status = "REFUTED";
    result.rationale.push("canonical PROOF fails; COUNTEREXAMPLE proves violation");
  } else {
    result.law_status = "UNRESOLVED";
    result.rationale.push("canonical PROOF fails; no positive artifact");
  }

  // Phase 3: behavior generation.  Always done (even for REFUTED), so
  // we can record diff_count and supply a behavior.json witness.
  const behaviorDir = resolve(candDir, "_behavior");
  mkdirSync(behaviorDir, { recursive: true });
  const dumpPath = resolve(behaviorDir, "_dump.bend");
  const dumpProc = spawn({
    cmd: ["bun", resolve(ROOT, "lab/gen_behavior_driver.ts"),
          "--impl", candImplPath, "--out", dumpPath],
    stdout: "pipe", stderr: "pipe",
  });
  const dumpErr = await new Response(dumpProc.stderr).text();
  await dumpProc.exited;
  if (dumpProc.exitCode !== 0) {
    result.classification = "BEHAVIOR_GENERATION_FAILED";
    result.rationale.push("gen_behavior_driver failed: " + dumpErr);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const runProc = spawn({
    cmd: ["bun", BEND, dumpPath],
    stdout: "pipe", stderr: "pipe",
    cwd: REPO,
  });
  const runOut = await new Response(runProc.stdout).text();
  const runErr = await new Response(runProc.stderr).text();
  await runProc.exited;
  if (runProc.exitCode !== 0) {
    result.classification = "BEHAVIOR_GENERATION_FAILED";
    result.rationale.push("Bend dump failed: " + runErr);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    process.exit(1);
  }
  const text = (runOut + runErr).trim();
  if (!(text.startsWith('"') && text.endsWith('"'))) {
    result.classification = "BEHAVIOR_GENERATION_FAILED";
    result.rationale.push("dump output not a string literal");
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    process.exit(1);
  }
  const body = text.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const rows = body.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);

  if (rows.length !== 180) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`dump has ${rows.length} rows, expected 180`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    process.exit(1);
  }
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row)) {
      result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
      result.rationale.push(`duplicate row: ${row}`);
      writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
      process.exit(1);
    }
    seen.add(row);
  }

  const bendMap = new Map<string, string>();
  for (const row of rows) {
    const eq = row.indexOf("=");
    if (eq < 0) continue;
    bendMap.set(row.slice(0, eq), row.slice(eq + 1));
  }
  if (bendMap.size !== 180) {
    result.classification = "BEHAVIOR_EVIDENCE_MISMATCH";
    result.rationale.push(`unique cells ${bendMap.size}, expected 180`);
    writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
    process.exit(1);
  }

  result.behavior.cells = bendMap.size;
  const diffs: { actor: string; capability: string; lifecycle: string; evidence: string; expected: string; observed: string }[] = [];
  for (const [k, oracleDec] of oracleMap) {
    const bendDec = bendMap.get(k);
    if (bendDec === undefined) {
      const parts = k.split("|");
      diffs.push({ actor: parts[0], capability: parts[1], lifecycle: parts[2], evidence: parts[3], expected: oracleDec, observed: "(missing)" });
    } else if (bendDec !== oracleDec) {
      const parts = k.split("|");
      diffs.push({ actor: parts[0], capability: parts[1], lifecycle: parts[2], evidence: parts[3], expected: oracleDec, observed: bendDec });
    }
  }
  for (const [k, bendDec] of bendMap) {
    if (!oracleMap.has(k)) {
      const parts = k.split("|");
      diffs.push({ actor: parts[0], capability: parts[1], lifecycle: parts[2], evidence: parts[3], expected: "(missing)", observed: bendDec });
    }
  }
  result.behavior.diff_count = diffs.length;
  result.behavior.diffs = diffs;
  result.intent_status = diffs.length === 0 ? "EQUIVALENT" : "DIVERGENT";

  // Phase 4.5 (ACT-MRVN-06-CORRECTION01): portable artifact verification.
  //
  // MUST run BEFORE Phase 4 classification so the classifier can
  // downgrade SPECIFICATION_GAP / EQUIVALENT_SURVIVOR to
  // NO_GAP_CLASSIFICATION when the artifact is missing or fails
  // MRVN-05 --mode full.
  //
  // A SPECIFICATION_GAP or EQUIVALENT_SURVIVOR classification is ONLY
  // authoritative if the candidate's portable proof-carrying artifact
  // exists on disk AND passes MRVN-05 --mode full verification.
  //
  // This closes the fake-artifact attack vector identified in the
  // CORRECTION01 reviewer disposition: a candidate with a forged or
  // absent artifact cannot claim SPECIFICATION_GAP / EQUIVALENT_SURVIVOR.
  const artifactDir = resolve(candDir, "artifact");
  const artifactManifestPath = resolve(artifactDir, "manifest.json");
  if (!existsSync(artifactManifestPath)) {
    result.artifact = { present: false, verify: "absent", artifact_id: null, failures: 0 };
  } else {
    result.artifact.present = true;
    try {
      const manifestJson = JSON.parse(readFileSync(artifactManifestPath, "utf-8")) as any;
      result.artifact.artifact_id = manifestJson.artifact_id ?? null;
    } catch { /* leave null */ }
    if (args.verifyArtifactFull) {
      const verifyArgs = [
        "bun", resolve(ROOT, "..", "ACT-MRVN-QUALIFY05/lab/verify_artifact.ts"),
        "--artifact", artifactDir,
        "--mode", "full",
        "--bend-runner", BEND,
        "--result-out", `${candDir}/_artifact_verify.json`,
        // ACT-MRVN-06-CORRECTION02:
        // The --allow-toolchain-drift flag is REMOVED from every
        // authoritative MRVN-06 artifact verification path.  The
        // reviewer (formal methods / proof-carrying artifacts)
        // identified that waiving this check explicitly disables the
        // hash-bound toolchain closure MRVN-05 deliberately made
        // adversarial.  A toolchain mismatch between the artifact's
        // declared toolchain_closure and the live bend2/{main,bend,
        // comp,base} MUST now be a TOOLCHAIN_MISMATCH failure,
        // downgrading SPECIFICATION_GAP / EQUIVALENT_SURVIVOR to
        // NO_GAP_CLASSIFICATION with exit 1.
      ];
      const verifyProc = spawn({
        cmd: verifyArgs,
        stdout: "pipe", stderr: "pipe",
        cwd: REPO,
      });
      const verifyOut = await new Response(verifyProc.stdout).text();
      const verifyErr = await new Response(verifyProc.stderr).text();
      await verifyProc.exited;
      if (verifyProc.exitCode === 0 && existsSync(`${candDir}/_artifact_verify.json`)) {
        const vresult = JSON.parse(readFileSync(`${candDir}/_artifact_verify.json`, "utf-8")) as any;
        const failures = Array.isArray(vresult.failures) ? vresult.failures.length : 0;
        result.artifact.verify = (failures === 0 && vresult.proof === "pass") ? "pass" : "fail";
        result.artifact.failures = failures;
        if (result.artifact.verify !== "pass") {
          result.rationale.push(`artifact FULL verify FAIL: ${failures} failure(s); ${verifyErr.trim().slice(-200)}`);
        }
      } else {
        result.artifact.verify = "fail";
        result.artifact.failures = -1;
        result.rationale.push(`artifact FULL verify process exited ${verifyProc.exitCode}; ${verifyErr.trim().slice(-200)}`);
      }
    } else {
      result.artifact.verify = "skipped";
    }
  }

  result.proof.canonical_sha256 = result.proof.canonical_sha256 ?? null;
  result.proof.reproof_sha256 = result.proof.reproof_sha256 ?? null;
  result.proof.counterexample_sha256 = result.proof.counterexample_sha256 ?? null;

  // Phase 4: classification.
  //
  // ACT-MRVN-06-CORRECTION01: SPECIFICATION_GAP and EQUIVALENT_SURVIVOR
  // require a portable proof artifact that passes MRVN-05 --mode full.
  // If --verify-artifact-full was passed and verification failed (or
  // the artifact is absent), the candidate is downgraded to
  // NO_GAP_CLASSIFICATION.  This is the FALSIFICATION_AUTHORITY_GAP
  // signal: the underlying mathematical claim may still be true, but
  // the MRVN-06 portable falsification packet is not authoritative.
  let artifactGatesGap = true;
  if (args.verifyArtifactFull) {
    if (!result.artifact.present) {
      artifactGatesGap = false;
      result.rationale.push("artifact absent: portable proof-carrying artifact missing on disk");
    } else if (result.artifact.verify !== "pass") {
      artifactGatesGap = false;
      result.rationale.push(`artifact verify FAIL: ${result.artifact.failures} failure(s)`);
    }
  }
  if (result.law_status === "SATISFIED") {
    if (!artifactGatesGap) {
      result.classification = "NO_GAP_CLASSIFICATION";
    } else if (result.intent_status === "EQUIVALENT") {
      result.classification = "EQUIVALENT_SURVIVOR";
    } else {
      result.classification = "SPECIFICATION_GAP";
    }
  } else if (result.law_status === "REFUTED") {
    result.classification = "LAW_REFUTED";
  } else if (result.law_status === "UNRESOLVED") {
    result.classification = "UNRESOLVED";
  }

  if (args.expectedClass) {
    result.expected_class = args.expectedClass;
    result.expected_mismatch = args.expectedClass !== result.classification;
  }

  // Persist behavior.json.
  const behaviorJson = {
    candidate_id: result.candidate_id,
    cells: result.behavior.cells,
    diff_count: result.behavior.diff_count,
    diffs: result.behavior.diffs,
    behavior_dump_sha256: createHash("sha256").update(readFileSync(dumpPath)).digest("hex"),
    behavior_dump_path: "_behavior/_dump.bend",
  };
  writeFileSync(resolve(candDir, "behavior.json"), JSON.stringify(behaviorJson, null, 2) + "\n");

  writeFileSync(args.resultsOut, JSON.stringify(result, null, 2));
  console.log(`candidate: ${result.candidate_id}`);
  console.log(`  classification: ${result.classification}`);
  console.log(`  law_status:     ${result.law_status}`);
  console.log(`  intent_status:  ${result.intent_status}`);
  console.log(`  artifact:       present=${result.artifact.present} verify=${result.artifact.verify} failures=${result.artifact.failures}`);
  console.log(`  proof.canonical: ${result.proof.canonical}`);
  console.log(`  proof.reproof:   ${result.proof.reproof}`);
  console.log(`  proof.counterexample: ${result.proof.counterexample}`);
  console.log(`  diff_count:      ${result.behavior.diff_count}`);

  // ACT-MRVN-06-CORRECTION01: exit code reflects classifier verdict.
  // Exit 1 means "the candidate failed to discharge a final-state
  // authority gate"; exit 0 means "candidate is fully classified".
  // NO_GAP_CLASSIFICATION is a failure gate, not a benign verdict.
  if (result.classification === "NO_GAP_CLASSIFICATION" ||
      result.classification === "INCOMPLETE") {
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });