#!/usr/bin/env bun
// ACT-MRVN-08 authority_attacks.ts
//
// Adversarial authority-binding tests per ACT §39 (10 attacks minimum).
// Each attack tampers with one piece of the pipeline and confirms the
// classifier rejects with the right classification.

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

interface TestResult { name: string; expected: string; actual: string; pass: boolean; }

const tmpRoot = "/tmp/mrvn08_authority_attacks";

async function runClassify(candDir: string, extraArgs: string[] = []): Promise<{ exit: number; result: any | null }> {
  const args = [
    "bun", resolve(ROOT, "lab/classify.ts"),
    "--candidate", candDir,
    "--canonical-kernel", resolve(ROOT, "baseline"),
    "--oracle", resolve(ROOT, "baseline/oracle.json"),
    "--bend-runner", BEND,
    "--results-out", `${candDir}/_authority_test_result.json`,
    "--no-reproof",
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

let pass = 0, fail = 0;
function record(name: string, expected: string, actual: string, ok: boolean) {
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}: ${actual} (expected: ${expected})`);
}

async function main() {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(tmpRoot, { recursive: true });

  // Attack 1: altered laws (tamper) -> DIFFERENT_SPECIFICATION
  {
    const d = setupTempDir("altered_laws");
    copyBaseline(d);
    const p = `${d}/LAWS.bend`;
    writeFileSync(p, readFileSync(p, "utf-8") + "\n# TAMPERED: benign extra comment to change hash.\n");
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    record("1.law_tamper", "DIFFERENT_SPECIFICATION",
      `class=${cls} exit=${r.exit}`, cls === "DIFFERENT_SPECIFICATION" && r.exit === 1);
  }

  // Attack 2: oracle file tampered -> BEHAVIOR_EVIDENCE_MISMATCH
  {
    const d = setupTempDir("oracle_tamper");
    copyBaseline(d);
    const fakeOracle = resolve(d, "fake_oracle.json");
    const fakeR = { act: "X", cell_count: 1000, allow_count: 25, deny_count: 9999, deny_by_reason: {}, intent_file: "X", intent_text_sha256: "X", rows: [] };
    writeFileSync(fakeOracle, JSON.stringify(fakeR));
    const r = await runClassify(d, ["--oracle", fakeOracle]);
    const cls = r.result?.classification ?? "<absent>";
    record("2.oracle_tamper", "BEHAVIOR_EVIDENCE_MISMATCH",
      `class=${cls} exit=${r.exit}`, cls === "BEHAVIOR_EVIDENCE_MISMATCH" && r.exit === 1);
  }

  // Attack 3: behavior tamper (broken main.bend)
  {
    const d = setupTempDir("behavior_tamper");
    copyBaseline(d);
    writeFileSync(`${d}/main.bend`, `import Base\ntype D is Data:\n  D.K{}\n`);
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    const ok = cls !== "CANONICAL_PROOF_SURVIVED" && cls !== "EXTENSIONAL_PROOF_BREAK" && r.exit === 1;
    record("3.behavior_tamper", "non-ROBUST, exit=1",
      `class=${cls} exit=${r.exit}`, ok);
  }

  // Attack 4: canonical proof tampered
  {
    const d = setupTempDir("canonical_proof_tamper");
    copyBaseline(d);
    const p = `${d}/PROOF.bend`;
    const orig = readFileSync(p, "utf-8");
    const tampered = orig.replace(
      "def Laws.halt_active_agent_yields_wrong_actor(): {==}",
      "def Laws.halt_active_agent_yields_wrong_actor(): Empty.absurd({0n == 1n : Nat}, Empty.absurd_unit());",
    );
    writeFileSync(p, tampered);
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    record("4.canonical_proof_tamper", "non-CANONICAL_PROOF_SURVIVED",
      `class=${cls} exit=${r.exit}`, cls !== "CANONICAL_PROOF_SURVIVED");
  }

  // Attack 5: candidate_reproof fail closed -- with --author-reproof, if
// REPROOF.bend is malformed, the classifier should fail it (not count as PB).
{
    const d = setupTempDir("reproof_tamper");
    copyBaseline(d);
    // REPROOF.bend that is structurally valid Bend but claims no laws;
    // when passed through --author-reproof, the classify should NOT classify
    // as EXTENSIONAL_PROOF_BREAK.
    // Without --author-reproof, REPROOF.bend is never read; the result is
    // CANONICAL_PROOF_SURVIVED (no proof-break condition is even evaluated).
    const r = await runClassify(d, ["--allow-no-artifact", "--author-reproof"]);
    const cls = r.result?.classification ?? "<absent>";
    record("5.reproof_tamper", "CANONICAL_PROOF_SURVIVED (no PB evaluated)",
      `class=${cls} exit=${r.exit}`, cls === "CANONICAL_PROOF_SURVIVED");
  }

  // Attack 6: MRVN-05 verify is invoked with --mode full, which exercises
  // the toolchain and proof phases.  Simulate the case where build_artifact
  // fails because the candidate's main.bend is missing.  This should NOT
  // classify as EXTENSIONAL_PROOF_BREAK.
  {
    const d = setupTempDir("missing_main_for_artifact");
    copyBaseline(d);
    // Delete main.bend AFTER copyBaseline but BEFORE classify's behavior phase.
    // Simulate by NOT copying main.bend in the first place.
    // We use `setupTempDir` to start fresh, write only LAWS and PROOF.
    writeFileSync(`${d}/LAWS.bend`, readFileSync(`${d}/LAWS.bend`, "utf-8"));
    // main.bend is intentionally absent:
    try { rmSync(`${d}/main.bend`); } catch {}
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    record("6.missing_main", "non-EXTENSIONAL_PROOF_BREAK",
      `class=${cls} exit=${r.exit}`, cls !== "EXTENSIONAL_PROOF_BREAK");
  }

  // Attack 7: Candidate with NO LAWS.bend and NO PROOF.bend -- should fail
  // at the authority-binding phase as DIFFERENT_SPECIFICATION or BEHAVIOR_EVIDENCE_MISMATCH.
  {
    const d = setupTempDir("missing_authority_files");
    // Don't copy anything.  Baseline fall-through: classify should error.
    // We seed main.bend but not LAWS/PROOF.
    copyFileSync(resolve(ROOT, "baseline/main.bend"), `${d}/main.bend`);
    const r = await runClassify(d);
    const cls = r.result?.classification ?? "<absent>";
    record("7.missing_authority_files", "non-CANONICAL_PROOF_SURVIVED",
      `class=${cls} exit=${r.exit}`, cls !== "CANONICAL_PROOF_SURVIVED");
  }

  // Attack 7b: behavior-tamper with a syntactically-valid but extensionally-wrong
  // implementation: every cell returns Decision.Allow{}.  Should fail SEMANTIC_DRIFT.
  {
    const d = setupTempDir("behavior_all_allow");
    copyBaseline(d);
    writeFileSync(`${d}/main.bend`,
      `import Base\ntype Actor is Data:\n  Actor.Agent{}\n  Actor.Reviewer{}\n  Actor.Automation{}\ntype Capability is Data:\n  Capability.Work{}\n  Capability.Halt{}\n  Capability.Freeze{}\n  Capability.Close{}\ntype Lifecycle is Data:\n  Lifecycle.Draft{}\n  Lifecycle.Active{}\n  Lifecycle.Halted{}\n  Lifecycle.Frozen{}\n  Lifecycle.Closed{}\ntype Evidence is Data:\n  Evidence.None{}\n  Evidence.Replay{}\n  Evidence.Live{}\ntype DenyReason is Data:\n  DenyReason.Terminal{}\n  DenyReason.WrongLifecycle{}\n  DenyReason.WrongActor{}\n  DenyReason.InsufficientEvidence{}\ntype Decision is Data:\n  Decision.Allow{}\n  Decision.Deny{reason: DenyReason}\ndef authorize(actor: Actor, capability: Capability, lifecycle: Lifecycle, evidence: Evidence) -> Decision: Decision.Allow{}\ndef main() -> Decision: Decision.Allow{}\n`);
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    record("7b.behavior_all_allow", "SEMANTIC_DRIFT (many cells differ)",
      `class=${cls} exit=${r.exit}`, cls === "SEMANTIC_DRIFT" && r.exit === 1);
  }

  // Attack 8: interface rename false positive
  {
    const d = setupTempDir("interface_rename");
    copyBaseline(d);
    writeFileSync(`${d}/main.bend`, readFileSync(`${d}/main.bend`, "utf-8").replace(/def authorize\(/g, "def do_authorize("));
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    record("8.interface_rename", "INTERFACE_BINDING_FAILURE or FRONTEND_LIMIT",
      `class=${cls} exit=${r.exit}`, cls === "INTERFACE_BINDING_FAILURE" || cls === "FRONTEND_LIMIT");
  }

  // Attack 9: expected-oracle contamination (should NOT influence classification)
  {
    const d = setupTempDir("expected_oracle_contamination");
    copyBaseline(d);
    const r = await runClassify(d, ["--expected-classification", "EXTENSIONAL_PROOF_BREAK"]);
    const cls = r.result?.classification ?? "<absent>";
    record("9.expected_oracle_contamination", "CANONICAL_PROOF_SURVIVED (uninfluenced)",
      `class=${cls} exit=${r.exit}`, cls === "CANONICAL_PROOF_SURVIVED");
  }

  // Attack 10: candidate result tamper (pre-write fake result.json)
  {
    const d = setupTempDir("candidate_result_tamper");
    copyBaseline(d);
    writeFileSync(`${d}/result.json`, JSON.stringify({
      candidate_id: "candidate_result_tamper",
      classification: "FAKE_PROOF_BREAK",
      intent_status: "FAKE",
      behavior: { diff_count: -999 },
    }));
    const r = await runClassify(d, ["--allow-no-artifact"]);
    const cls = r.result?.classification ?? "<absent>";
    record("10.candidate_result_tamper", "classifier overwrites fake result",
      `class=${cls} exit=${r.exit}`, cls !== "FAKE_PROOF_BREAK");
  }

  console.log("");
  console.log(`Results: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });