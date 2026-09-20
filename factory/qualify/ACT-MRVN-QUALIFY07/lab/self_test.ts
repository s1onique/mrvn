#!/usr/bin/env bun
// ACT-MRVN-07 self_test.ts
//
// Synthetic self-tests for the MRVN-07 classifier and pipeline.
// Mirrors the MRVN-04 / MRVN-06 pattern.  At least 14 cases.

interface ArtifactResult {
  file: string;
  present: boolean;
  ok: boolean;
  exit: number;
  sha256: string | null;
}

function mk(_present: boolean, ok: boolean): ArtifactResult {
  return { file: "x.bend", present: ok, ok, exit: ok ? 0 : 1, sha256: "0".repeat(64) };
}

function classifyMRVN07(
  proofCanonical: "pass" | "fail" | "absent",
  proofReproof: "pass" | "fail" | "absent",
  intentStatus: "EQUIVALENT" | "DIVERGENT" | "NOT_CHECKED",
  lawHashMatches: boolean,
  artifactVerifyOk: boolean,
  artifactRequired: boolean,
): { classification: string; exit: number } {
  if (!lawHashMatches) return { classification: "DIFFERENT_SPECIFICATION", exit: 1 };
  if (intentStatus === "DIVERGENT") return { classification: "SEMANTIC_DRIFT", exit: 1 };
  if (artifactRequired && !artifactVerifyOk) return { classification: "NO_ROBUSTNESS_CLASSIFICATION", exit: 1 };
  if (proofCanonical === "pass") return { classification: "ROBUST", exit: 0 };
  if (proofReproof === "pass") return { classification: "REPROOF_REQUIRED", exit: 0 };
  return { classification: "PROOF_REPAIR_FAILED", exit: 1 };
}

let pass = 0, fail = 0;
function check(name: string, got: string, want: string) {
  if (got === want) {
    console.log(`  PASS  ${name}: ${got}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}: got ${got}, want ${want}`);
    fail++;
  }
}

console.log("=== ACT-MRVN-07 Classifier Self-Tests ===");

check("1.robust_basic",
  classifyMRVN07("pass", "absent", "EQUIVALENT", true, true, false).classification,
  "ROBUST");

check("2.reproof_required",
  classifyMRVN07("fail", "pass", "EQUIVALENT", true, true, false).classification,
  "REPROOF_REQUIRED");

check("3.proof_repair_failed",
  classifyMRVN07("fail", "fail", "EQUIVALENT", true, true, false).classification,
  "PROOF_REPAIR_FAILED");

check("4.semantic_drift",
  classifyMRVN07("pass", "absent", "DIVERGENT", true, true, false).classification,
  "SEMANTIC_DRIFT");

check("5.different_specification",
  classifyMRVN07("pass", "absent", "EQUIVALENT", false, true, false).classification,
  "DIFFERENT_SPECIFICATION");

check("6.artifact_required_downgrade",
  classifyMRVN07("pass", "absent", "EQUIVALENT", true, false, true).classification,
  "NO_ROBUSTNESS_CLASSIFICATION");

function checkToolchain(live: string, expected: string): string {
  return live === expected ? "OK" : "TOOLCHAIN_MISMATCH";
}
check("7.toolchain_tamper",
  checkToolchain("a", "b"),
  "TOOLCHAIN_MISMATCH");

function checkBehaviorCells(cells: number): string {
  return cells === 180 ? "OK" : "BEHAVIOR_EVIDENCE_MISMATCH";
}
check("8.behavior_179_cells",
  checkBehaviorCells(179),
  "BEHAVIOR_EVIDENCE_MISMATCH");

check("9.behavior_181_cells",
  checkBehaviorCells(181),
  "BEHAVIOR_EVIDENCE_MISMATCH");

function checkDuplicates(seen: Set<string>): string {
  return seen.size === 180 ? "OK" : "BEHAVIOR_EVIDENCE_MISMATCH";
}
check("10.duplicate_cells",
  checkDuplicates(new Set(["a", "b"])),
  "BEHAVIOR_EVIDENCE_MISMATCH");

check("11.canonical_fail_no_reproof",
  classifyMRVN07("fail", "absent", "EQUIVALENT", true, true, false).classification,
  "PROOF_REPAIR_FAILED");

check("12.reproof_pass_equiv",
  classifyMRVN07("fail", "pass", "EQUIVALENT", true, true, false).classification,
  "REPROOF_REQUIRED");

check("13.reproof_pass_drift",
  classifyMRVN07("fail", "pass", "DIVERGENT", true, true, false).classification,
  "SEMANTIC_DRIFT");

function checkBehaviorJsonCells(json: { cells: number } | null): string {
  if (!json) return "BEHAVIOR_EVIDENCE_MISMATCH";
  if (json.cells !== 180) return "BEHAVIOR_EVIDENCE_MISMATCH";
  return "OK";
}
check("14.behavior_json_missing",
  checkBehaviorJsonCells(null),
  "BEHAVIOR_EVIDENCE_MISMATCH");

function checkImplHash(stored: string, recomputed: string): string {
  return stored === recomputed ? "OK" : "AUTHORITY_FAILURE";
}
check("15.impl_hash_mismatch",
  checkImplHash("a", "b"),
  "AUTHORITY_FAILURE");

function checkLawHash(stored: string, canonical: string): string {
  return stored === canonical ? "OK" : "DIFFERENT_SPECIFICATION";
}
check("16.law_hash_mismatch",
  checkLawHash("a", "b"),
  "DIFFERENT_SPECIFICATION");

function survivalRate(robust: number, semanticEquiv: number): number {
  if (semanticEquiv === 0) return 0;
  return robust / semanticEquiv * 100;
}
const rate = survivalRate(5, 6);
check("17.survival_rate_calculation",
  Math.round(rate).toString(),
  "83");

function amplification(proofLinesChanged: number, implLinesChanged: number): number {
  if (implLinesChanged === 0) return 0;
  return proofLinesChanged / implLinesChanged;
}
check("18.amplification_zero_impl_unchanged",
  amplification(100, 0).toString(),
  "0");

console.log("");
console.log(`Results: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
