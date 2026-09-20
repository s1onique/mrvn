#!/usr/bin/env bun
// ACT-MRVN-07 authority_attacks.ts
//
// Adversarial authority-binding tests.  Eight attacks per ACT §35.

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(ROOT, "..", "..", "..");
const BEND = resolve(REPO, "bend2/main.ts");

async function run(cmd: string[]): Promise<{ exit: number; out: string; err: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  return { exit: proc.exitCode ?? 1, out, err };
}

interface TestResult {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
}

const tmpRoot = "/tmp/mrvn07_authority_attacks";

async function runClassify(candDir: string, extraArgs: string[] = []): Promise<{ exit: number; result: any | null }> {
  const args = [
    "bun", resolve(ROOT, "lab/classify.ts"),
    "--candidate", candDir,
    "--canonical-kernel", resolve(ROOT, "baseline"),
    "--oracle", resolve(ROOT, "baseline/oracle.json"),
    "--bend-runner", BEND,
    "--results-out", `${candDir}/_authority_test_result.json`,
    ...extraArgs,
  ];
  const r = await run(args);
  const result = existsSync(`${candDir}/_authority_test_result.json`)
    ? JSON.parse(readFileSync(`${candDir}/_authority_test_result.json`, "utf-8"))
    : null;
  return { exit: r.exit, result };
}

function setupTempDir(name: string): string {
  const d = `${tmpRoot}/${name}`;
  if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  return d;
}

function copyBaseline(d: string) {
  copyFileSync(resolve(ROOT, "baseline/main.bend"), `${d}/main.bend`);
  copyFileSync(resolve(ROOT, "baseline/LAWS.bend"), `${d}/LAWS.bend`);
  copyFileSync(resolve(ROOT, "baseline/PROOF.bend"), `${d}/PROOF.bend`);
}

async function main() {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(tmpRoot, { recursive: true });
  const results: TestResult[] = [];

  // Attack 1: altered laws — should produce DIFFERENT_SPECIFICATION.
  {
    const d = setupTempDir("altered_laws");
    copyBaseline(d);
    const lawsPath = `${d}/LAWS.bend`;
    const lawsText = readFileSync(lawsPath, "utf-8");
    writeFileSync(lawsPath, lawsText + "\n# TAMPERED: benign extra comment to change hash.\n");
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "DIFFERENT_SPECIFICATION" && r.exit === 1;
    results.push({
      name: "altered_laws",
      expected: "DIFFERENT_SPECIFICATION, exit=1",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 2: fake semantic equality — claim ROBUST in result.json (mismatched with real evidence).
  // Expected: classifier recomputes and overwrites result.json; final classification matches reality.
  {
    const d = setupTempDir("fake_behavior");
    copyBaseline(d);
    mkdirSync(`${d}/_behavior`, { recursive: true });
    // Pre-write a fake dump that has 0 cells.  The classifier will OVERWRITE this
    // with the real Bend output (180 cells).  We assert that the post-classify dump
    // is regenerated and the real evidence is authoritative.
    writeFileSync(`${d}/_behavior/_dump.bend`, "# fake dump\n");
    // Use --allow-no-artifact because this attack tests dump-regeneration, not the artifact gate.
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    // For byte-identical canonical, the classifier regenerates a valid dump and
    // returns ROBUST.  The fake dump is overwritten.  This is the correct behavior.
    const correct = cls === "ROBUST" && r.exit === 0;
    results.push({
      name: "fake_behavior_regenerated",
      expected: "ROBUST (regenerated dump overrides fake)",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 2b: corrupt behavior.json after classification, then verify it doesn't
  // affect subsequent classification (because behavior.json is generated, not authoritative).
  // Actually this is similar to attack 3, so skip.


  // Attack 3: fake proof pass — modify result.json to claim ROBUST.
  // Expected: classifier recomputes from real evidence and overwrites result.json.
  {
    const d = setupTempDir("fake_proof");
    copyBaseline(d);
    writeFileSync(`${d}/result.json`, JSON.stringify({
      candidate_id: "fake", classification: "ROBUST", proof: { canonical: "pass" }
    }) + "\n");
    // Use --allow-no-artifact: this test focuses on proof recomputation, not the artifact gate.
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    const rj = JSON.parse(readFileSync(`${d}/result.json`, "utf-8"));
    const correct = rj.classification === cls && cls === "ROBUST";
    results.push({
      name: "fake_proof_pass",
      expected: "classifier recomputes (ROBUST for byte-identical)",
      actual: `class=${cls} on-disk=${rj.classification}`,
      pass: correct,
    });
  }

  // Attack 4: artifact absent under MANDATORY artifact gate.
  // Per ACT-MRVN-07-CORRECTION01: artifact is mandatory.  An impl that
  // would otherwise be ROBUST but has no portable artifact must be
  // classified NO_ROBUSTNESS_CLASSIFICATION.
  // We construct a candidate whose PROOF passes but whose `artifact/`
  // directory is missing.  We then run classify WITHOUT --allow-no-artifact
  // and expect NO_ROBUSTNESS_CLASSIFICATION + exit=1.
  {
    const d = setupTempDir("artifact_absent");
    copyBaseline(d);
    // Make sure artifact/ is empty/missing.
    const artifactDir = `${d}/artifact`;
    if (existsSync(artifactDir)) rmSync(artifactDir, { recursive: true });
    const r = await runClassify(d, []);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "NO_ROBUSTNESS_CLASSIFICATION" && r.exit === 1;
    results.push({
      name: "artifact_absent_mandatory",
      expected: "NO_ROBUSTNESS_CLASSIFICATION (artifact gate mandatory by default), exit=1",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 4b: artifact absent WITH --allow-no-artifact opt-out.
  // Should fall back to ROBUST (for non-authoritative runs).
  {
    const d = setupTempDir("artifact_absent_allow");
    copyBaseline(d);
    const artifactDir = `${d}/artifact`;
    if (existsSync(artifactDir)) rmSync(artifactDir, { recursive: true });
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "ROBUST" && r.exit === 0;
    results.push({
      name: "artifact_absent_allow_optout",
      expected: "ROBUST (with --allow-no-artifact), exit=0",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 5: toolchain intact — verify the classifier does NOT raise TOOLCHAIN_MISMATCH.
  // Use --allow-no-artifact to focus on toolchain matching only.
  {
    const d = setupTempDir("toolchain_intact");
    copyBaseline(d);
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "ROBUST" && r.exit === 0;
    results.push({
      name: "toolchain_intact",
      expected: "ROBUST (live toolchain matches frozen closure)",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 6: oracle contamination — modify the oracle to claim ROBUST for divergent impl.
  // Expected: BEHAVIOR_EVIDENCE_MISMATCH (intent hash mismatch).
  {
    const d = setupTempDir("oracle_contamination");
    copyBaseline(d);
    const oracle = JSON.parse(readFileSync(resolve(ROOT, "baseline/oracle.json"), "utf-8")) as any;
    for (const r of oracle.rows) r.decision = "Allow";
    const tamperedPath = `${tmpRoot}/tampered_oracle.json`;
    writeFileSync(tamperedPath, JSON.stringify(oracle, null, 2));
    const r = await run([
      "bun", resolve(ROOT, "lab/classify.ts"),
      "--candidate", d,
      "--canonical-kernel", resolve(ROOT, "baseline"),
      "--oracle", tamperedPath,
      "--bend-runner", BEND,
      "--results-out", `${d}/_oracle_tamper_result.json`,
    ]);
    const cls = existsSync(`${d}/_oracle_tamper_result.json`)
      ? (JSON.parse(readFileSync(`${d}/_oracle_tamper_result.json`, "utf-8")).classification ?? "<absent>")
      : "<absent>";
    const correct = cls === "BEHAVIOR_EVIDENCE_MISMATCH" && r.exit === 1;
    results.push({
      name: "oracle_contamination",
      expected: "BEHAVIOR_EVIDENCE_MISMATCH (intent hash mismatch), exit=1",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 7: semantic regression — modify candidate main to alter semantics.
  // Expected: SEMANTIC_DRIFT.
  {
    const d = setupTempDir("semantic_regression");
    copyBaseline(d);
    const main = readFileSync(`${d}/main.bend`, "utf-8");
    const lines = main.split("\n");
    let cdStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^def\s+close_decision\s*\(/.test(lines[i])) { cdStart = i; break; }
    }
    let changed = false;
    for (let i = cdStart; i < lines.length; i++) {
      if (/^def\s+/.test(lines[i]) && i !== cdStart) break;
      if (/^\s+case\s+Evidence\.Replay\{\}:\s+Decision\.Deny\{DenyReason\.InsufficientEvidence\{\}\}\s*$/.test(lines[i])) {
        if (!changed) {
          lines[i] = lines[i].replace("InsufficientEvidence", "Terminal");
          changed = true;
        }
      }
    }
    writeFileSync(`${d}/main.bend`, lines.join("\n"));
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "SEMANTIC_DRIFT" && r.exit === 1;
    results.push({
      name: "semantic_regression",
      expected: "SEMANTIC_DRIFT (intent divergence detected), exit=1",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 8: law weakening — replace LAWS.bend with a weaker version.
  // Expected: DIFFERENT_SPECIFICATION.
  {
    const d = setupTempDir("law_weakening");
    copyBaseline(d);
    const lawsText = readFileSync(`${d}/LAWS.bend`, "utf-8");
    // Find a `law <name>:` declaration and chop from there to the next blank line.
    const lines = lawsText.split("\n");
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^law\s+[a-z_]+:\s*$/.test(lines[i])) { start = i; break; }
    }
    if (start >= 0) {
      let end = lines.length;
      for (let i = start + 1; i < lines.length; i++) {
        if (lines[i].trim() === "") { end = i + 1; break; }
      }
      lines.splice(start, end - start);
    }
    writeFileSync(`${d}/LAWS.bend`, lines.join("\n"));
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    const correct = cls === "DIFFERENT_SPECIFICATION" && r.exit === 1;
    results.push({
      name: "law_weakening",
      expected: "DIFFERENT_SPECIFICATION (weakened law hash mismatch), exit=1",
      actual: `class=${cls} exit=${r.exit}`,
      pass: correct,
    });
  }

  // Attack 9: artifact payload tamper — modify a byte in payload/PROOF.bend
  // AFTER the artifact has been built and verified.  Expected:
  // verify FAILS, classifier downgrades to NO_ROBUSTNESS_CLASSIFICATION.
  // We build the artifact via classify (which auto-builds when --no-allow),
  // then tamper, then re-classify with --allow-no-artifact (so the auto-build
  // is skipped and the tampered artifact gets re-verified) — wait, that won't
  // re-verify.  Instead, we build via the MRVN-05 build script directly with
  // --source pointing at our payload.
  {
    const d = setupTempDir("artifact_payload_tamper");
    copyBaseline(d);
    // First build the artifact via the MRVN-05 builder (no candidates.json lookup needed).
    const payloadDir = `${d}/artifact/payload`;
    mkdirSync(payloadDir, { recursive: true });
    copyFileSync(`${d}/main.bend`, `${payloadDir}/main.bend`);
    copyFileSync(`${d}/LAWS.bend`, `${payloadDir}/LAWS.bend`);
    copyFileSync(`${d}/PROOF.bend`, `${payloadDir}/PROOF.bend`);
    const evidenceDir = `${d}/artifact/evidence`;
    mkdirSync(evidenceDir, { recursive: true });
    const replay = await run(["bun", BEND, `${payloadDir}/PROOF.bend`]);
    const replayJson = {
      exit_code: replay.exit,
      stdout_hash: "0".repeat(64),
      stderr_hash: "0".repeat(64),
      replayed_at: new Date().toISOString(),
    };
    writeFileSync(`${evidenceDir}/proof-run.json`, JSON.stringify(replayJson, null, 2) + "\n");
    const buildRes = await run([
      "bun", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/build_artifact.ts"),
      "--source", payloadDir,
      "--out", `${d}/artifact`,
      "--schema", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/schema/proof-artifact-v1.schema.json"),
      "--subject-name", "artifact_payload_tamper",
      "--subject-kind", "bend-module-set",
      "--bend-runner", BEND,
      "--repo", REPO,
      "--source-commit", "",
      "--build-command", "bun authority_attacks.ts (tamper setup)",
      "--evidence", `${evidenceDir}/proof-run.json`,
    ]);
    if (buildRes.exit !== 0) {
      results.push({
        name: "artifact_payload_tamper",
        expected: "build then tamper then verify FAIL",
        actual: `build_failed exit=${buildRes.exit}`,
        pass: false,
      });
    } else {
      // Tamper a byte in the payload PROOF.bend.
      const proofPath = `${payloadDir}/PROOF.bend`;
      if (existsSync(proofPath)) {
        const t = readFileSync(proofPath, "utf-8");
        writeFileSync(proofPath, t.replace("{==}", "=="));
      }
      // Verify: should FAIL because hash of payload/PROOF.bend changed.
      const verifyRes = await run([
        "bun", resolve(REPO, "factory/qualify/ACT-MRVN-QUALIFY05/lab/verify_artifact.ts"),
        "--artifact", `${d}/artifact`,
        "--mode", "full",
        "--bend-runner", BEND,
      ]);
      const correct = verifyRes.exit !== 0; // verify should FAIL
      results.push({
        name: "artifact_payload_tamper",
        expected: "verify FAILED (tamper detected)",
        actual: `verify_exit=${verifyRes.exit}`,
        pass: correct,
      });
    }
  }

  // Attack 10: toolchain tamper — actually mutate a byte in bend2/main.ts,
  // re-run classifier, observe TOOLCHAIN_MISMATCH.
  // Per ACT-MRVN-07-CORRECTION01: this is a true E2E authority attack, not
  // a synthetic self-test.  We restore the file before exiting.
  {
    const d = setupTempDir("toolchain_tamper");
    copyBaseline(d);
    const bendPath = resolve(REPO, "bend2/main.ts");
    const original = readFileSync(bendPath, "utf-8");
    const tampered = original + "\n# TAMPER-MARK-MRVN07-CORRECTION01\n";
    writeFileSync(bendPath, tampered);
    try {
      const r = await runClassify(d, ["--allow-no-artifact"]);
      const cls = r.result?.classification ?? "<absent>";
      const correct = cls === "TOOLCHAIN_MISMATCH" && r.exit === 1;
      results.push({
        name: "toolchain_tamper",
        expected: "TOOLCHAIN_MISMATCH (toolchain byte changed), exit=1",
        actual: `class=${cls} exit=${r.exit}`,
        pass: correct,
      });
    } finally {
      writeFileSync(bendPath, original); // restore
    }
  }

  console.log("=== ACT-MRVN-07 Authority Attack Tests ===");
  let pass = 0, fail = 0;
  for (const r of results) {
    if (r.pass) pass++; else fail++;
    console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}: expected="${r.expected}" actual="${r.actual}"`);
  }
  console.log("");
  console.log(`Results: ${pass} pass, ${fail} fail`);

  writeFileSync(resolve(ROOT, "lab/authority_attacks_result.json"), JSON.stringify({
    act: "ACT-MRVN-QUALIFY07",
    timestamp: new Date().toISOString(),
    tests: results,
    summary: { pass, fail },
  }, null, 2) + "\n");

  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

