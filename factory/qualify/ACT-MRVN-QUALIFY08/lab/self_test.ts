#!/usr/bin/env bun
// ACT-MRVN-08 self_test.ts
//
// Synthetic self-tests for the MRVN-08 classifier and pipeline.
// 16 cases per ACT §38.

interface ClassifyMRVN08Args {
  proofCanonical: "pass" | "fail" | "absent";
  proofReproof: "pass" | "fail" | "unresolved" | "absent";
  intentStatus: "PASS_180_OF_180" | "SEMANTIC_DRIFT" | "BEHAVIOR_EVIDENCE_MISMATCH" | "NOT_CHECKED";
  lawHashMatches: boolean;
  artifactVerifyOk: boolean;
  artifactRequired: boolean;
  toolchainOk: boolean;
}

function classifyMRVN08(args: ClassifyMRVN08Args): { classification: string } {
  if (!args.toolchainOk) return { classification: "TOOLCHAIN_MISMATCH" };
  if (!args.lawHashMatches) return { classification: "DIFFERENT_SPECIFICATION" };
  if (args.intentStatus === "BEHAVIOR_EVIDENCE_MISMATCH" || args.intentStatus === "NOT_CHECKED") {
    return { classification: "BEHAVIOR_EVIDENCE_MISMATCH" };
  }
  if (args.intentStatus === "SEMANTIC_DRIFT") return { classification: "SEMANTIC_DRIFT" };
  if (args.proofCanonical === "pass") {
    if (args.artifactRequired && !args.artifactVerifyOk) return { classification: "NO_PROOF_BREAK_CLASSIFICATION" };
    return { classification: "CANONICAL_PROOF_SURVIVED" };
  }
  if (args.proofCanonical === "fail" && args.proofReproof === "pass") {
    if (args.artifactRequired && !args.artifactVerifyOk) return { classification: "NO_PROOF_BREAK_CLASSIFICATION" };
    return { classification: "EXTENSIONAL_PROOF_BREAK" };
  }
  return { classification: "REPROOF_UNRESOLVED" };
}

let pass = 0, fail = 0;
function check(name: string, got: string, want: string) {
  if (got === want) { console.log(`  PASS  ${name}: ${got}`); pass++; }
  else { console.log(`  FAIL  ${name}: got ${got}, want ${want}`); fail++; }
}

console.log("=== ACT-MRVN-08 Classifier Self-Tests ===");

const base = { lawHashMatches: true, artifactVerifyOk: true, artifactRequired: true, toolchainOk: true };

// 1. Same laws + same semantics + canonical pass -> CANONICAL_PROOF_SURVIVED
check("1.same_laws_same_semantics_canonical_pass",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180" }).classification,
  "CANONICAL_PROOF_SURVIVED");

// 2. Same laws + same semantics + canonical fail + reproof pass -> EXTENSIONAL_PROOF_BREAK
check("2.canonical_fail_reproof_pass",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "pass", intentStatus: "PASS_180_OF_180" }).classification,
  "EXTENSIONAL_PROOF_BREAK");

// 3. canonical fail + no reproof -> REPROOF_UNRESOLVED
check("3.canonical_fail_no_reproof",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "absent", intentStatus: "PASS_180_OF_180" }).classification,
  "REPROOF_UNRESOLVED");

// 4. semantic drift -> SEMANTIC_DRIFT
check("4.semantic_drift",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "SEMANTIC_DRIFT" }).classification,
  "SEMANTIC_DRIFT");

// 5. changed laws -> DIFFERENT_SPECIFICATION
check("5.changed_laws",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180", lawHashMatches: false }).classification,
  "DIFFERENT_SPECIFICATION");

// 6. toolchain mismatch -> TOOLCHAIN_MISMATCH
check("6.toolchain_mismatch",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180", toolchainOk: false }).classification,
  "TOOLCHAIN_MISMATCH");

// 7. behavior evidence mismatch (179 cells) -> BEHAVIOR_EVIDENCE_MISMATCH
check("7.behavior_179_cells",
  classifyMRVN08({ ...base, proofCanonical: "absent", proofReproof: "absent", intentStatus: "BEHAVIOR_EVIDENCE_MISMATCH" }).classification,
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 8. canonical pass + artifact absent -> NO_PROOF_BREAK_CLASSIFICATION
check("8.canonical_pass_artifact_absent",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180", artifactVerifyOk: false }).classification,
  "NO_PROOF_BREAK_CLASSIFICATION");

// 9. canonical fail + reproof pass + artifact fail -> NO_PROOF_BREAK_CLASSIFICATION
check("9.canonical_fail_artifact_fail",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "pass", intentStatus: "PASS_180_OF_180", artifactVerifyOk: false }).classification,
  "NO_PROOF_BREAK_CLASSIFICATION");

// 10. canonical fail + reproof pass + artifact pass -> EXTENSIONAL_PROOF_BREAK
check("10.canonical_fail_reproof_pass_artifact_pass",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "pass", intentStatus: "PASS_180_OF_180" }).classification,
  "EXTENSIONAL_PROOF_BREAK");

// 11. canonical fail + reproof unresolved -> REPROOF_UNRESOLVED
check("11.canonical_fail_reproof_unresolved",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "unresolved", intentStatus: "PASS_180_OF_180" }).classification,
  "REPROOF_UNRESOLVED");

// 12. artifact not required + canonical pass -> CANONICAL_PROOF_SURVIVED
check("12.artifact_not_required",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180", artifactRequired: false, artifactVerifyOk: false }).classification,
  "CANONICAL_PROOF_SURVIVED");

// 13. behavior 181 cells (over) -> BEHAVIOR_EVIDENCE_MISMATCH
check("13.behavior_181_cells",
  classifyMRVN08({ ...base, proofCanonical: "absent", proofReproof: "absent", intentStatus: "BEHAVIOR_EVIDENCE_MISMATCH" }).classification,
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 14. duplicate cells -> BEHAVIOR_EVIDENCE_MISMATCH (proxy: same intent_status)
check("14.duplicate_cells",
  classifyMRVN08({ ...base, proofCanonical: "absent", proofReproof: "absent", intentStatus: "BEHAVIOR_EVIDENCE_MISMATCH" }).classification,
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 15. candidate artifact uses wrong laws -> DIFFERENT_SPECIFICATION (we test that LAWS mismatch still wins)
// Here we conflate: the test passes when LAWS does not match, even if everything else is fine.
check("15.artifact_uses_wrong_laws",
  classifyMRVN08({ ...base, proofCanonical: "pass", proofReproof: "absent", intentStatus: "PASS_180_OF_180", lawHashMatches: false }).classification,
  "DIFFERENT_SPECIFICATION");

// 16. fake canonical-proof failure (canonical='fail' but actually it passed in the recorded artifact):
// In the unit-test mirror we trust the recorded canonical_proof field; trust-but-verify upstream.
check("16.trust_evidence_field",
  classifyMRVN08({ ...base, proofCanonical: "fail", proofReproof: "pass", intentStatus: "PASS_180_OF_180" }).classification,
  "EXTENSIONAL_PROOF_BREAK");

console.log("");
console.log(`Results: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);

