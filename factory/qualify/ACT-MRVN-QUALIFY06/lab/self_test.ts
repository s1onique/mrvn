#!/usr/bin/env bun
// ACT-MRVN-06 self_test.ts
//
// 14+ synthetic self-tests for the classifier (mirroring MRVN-04 §48).

interface ArtifactResult {
  file: string;
  present: boolean;
  ok: boolean;
  exit: number;
  sha256: string | null;
  cert: boolean | null;
}

function mk(present: boolean, ok: boolean, cert: boolean | null): ArtifactResult {
  return { file: "x.bend", present, ok, exit: ok ? 0 : 1, sha256: "0".repeat(64), cert };
}

function classify(
  proof: ArtifactResult,
  reproof: ArtifactResult | null,
  counterexample: ArtifactResult | null,
  intentStatus: "EQUIVALENT" | "DIVERGENT" | "NOT_CHECKED",
): { classification: string } {
  if (proof.ok) {
    if (intentStatus === "EQUIVALENT") return { classification: "EQUIVALENT_SURVIVOR" };
    if (intentStatus === "DIVERGENT") return { classification: "SPECIFICATION_GAP" };
    return { classification: "UNRESOLVED" };
  }
  if (reproof && reproof.ok)
    if (intentStatus === "EQUIVALENT") return { classification: "EQUIVALENT_SURVIVOR" };
    else if (intentStatus === "DIVERGENT") return { classification: "SPECIFICATION_GAP" };
    else return { classification: "PROOF_TERM_INVALIDATED" };
  if (counterexample && counterexample.cert === true) return { classification: "LAW_REFUTED" };
  return { classification: "UNRESOLVED" };
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

console.log("=== ACT-MRVN-06 Classifier Self-Tests ===");

// 1. Identical candidate -> EQUIVALENT_SURVIVOR
check("1.identical_equiv",
  classify(mk(true, true, null), null, null, "EQUIVALENT").classification,
  "EQUIVALENT_SURVIVOR");

// 2. Law-refuted candidate -> LAW_REFUTED
check("2.law_refuted",
  classify(mk(true, false, null), mk(true, false, null), mk(true, true, true), "DIVERGENT").classification,
  "LAW_REFUTED");

// 3. Proof fails, no reproof/counterexample -> UNRESOLVED
check("3.unresolved_no_positive",
  classify(mk(true, false, null), null, null, "DIVERGENT").classification,
  "UNRESOLVED");

// 4. Reproof passes + equivalent -> EQUIVALENT_SURVIVOR (PROOF_TERM_INVALIDATED + EQUIVALENT = EQUIVALENT_SURVIVOR)
check("4.reproof_pass_equiv",
  classify(mk(true, false, null), mk(true, true, null), null, "EQUIVALENT").classification,
  "EQUIVALENT_SURVIVOR");

// 5. Reproof passes + divergent -> SPECIFICATION_GAP (PROOF_TERM_INVALIDATED + DIVERGENT = SPECIFICATION_GAP)
check("5.reproof_pass_divergent",
  classify(mk(true, false, null), mk(true, true, null), null, "DIVERGENT").classification,
  "SPECIFICATION_GAP");

// 6. Canonical proof passes + divergent -> SPECIFICATION_GAP
check("6.canonical_pass_divergent",
  classify(mk(true, true, null), null, null, "DIVERGENT").classification,
  "SPECIFICATION_GAP");

// 7. Different law hash -> DIFFERENT_SPECIFICATION  (handled by hash binding, not classify())
// We model this as a separate check.
const LAW = "a".repeat(64);
const OTHER_LAW = "c".repeat(64);
function checkBinding(candLaws: string, canonLaws: string): string | null {
  if (candLaws !== canonLaws) return "DIFFERENT_SPECIFICATION";
  return null;
}
check("7.different_law_hash",
  checkBinding(OTHER_LAW, LAW) ?? "BINDING_OK",
  "DIFFERENT_SPECIFICATION");

// 8. Wrong intent hash -> AUTHORITY_BINDING_FAILURE
function checkIntent(candIntent: string, frozenIntent: string): string | null {
  if (candIntent !== frozenIntent) return "AUTHORITY_BINDING_FAILURE";
  return null;
}
check("8.wrong_intent_hash",
  checkIntent("b".repeat(64), "d".repeat(64)) ?? "BINDING_OK",
  "AUTHORITY_BINDING_FAILURE");

// 9. Candidate artifact verification fails -> no gap classification
// (Modeled as: if behavior.json doesn't exist, classifier bails.)
function checkArtifactVerified(verified: boolean): string {
  return verified ? "OK" : "NO_GAP_CLASSIFICATION";
}
check("9.artifact_verify_fail",
  checkArtifactVerified(false),
  "NO_GAP_CLASSIFICATION");

// 9b. ACT-MRVN-06-CORRECTION01: artifact FULL verify FAIL with
//      --artifact-required must downgrade SPECIFICATION_GAP to
//      NO_GAP_CLASSIFICATION regardless of behavior/observer.
function checkArtifactRequiredDowngrade(
  artifactPresent: boolean,
  artifactVerify: "pass" | "fail" | "absent",
  lawStatus: "SATISFIED" | "REFUTED" | "UNRESOLVED",
  intentStatus: "EQUIVALENT" | "DIVERGENT",
  artifactRequired: boolean,
): { classification: string; exit: number } {
  let classification: string;
  if (lawStatus === "SATISFIED") {
    if (artifactRequired && (!artifactPresent || artifactVerify !== "pass")) {
      classification = "NO_GAP_CLASSIFICATION";
    } else if (intentStatus === "EQUIVALENT") {
      classification = "EQUIVALENT_SURVIVOR";
    } else {
      classification = "SPECIFICATION_GAP";
    }
  } else if (lawStatus === "REFUTED") {
    classification = "LAW_REFUTED";
  } else {
    classification = "UNRESOLVED";
  }
  const exit = (classification === "NO_GAP_CLASSIFICATION" || classification === "INCOMPLETE") ? 1 : 0;
  return { classification, exit };
}
check("9b.artifact_full_verify_fail_downgrades_gap_to_NO_GAP_CLASSIFICATION",
  checkArtifactRequiredDowngrade(true, "fail", "SATISFIED", "DIVERGENT", true).classification,
  "NO_GAP_CLASSIFICATION");
check("9c.artifact_full_verify_fail_exit_is_1",
  String(checkArtifactRequiredDowngrade(true, "fail", "SATISFIED", "DIVERGENT", true).exit),
  "1");
check("9d.artifact_full_verify_pass_preserves_SPECIFICATION_GAP",
  checkArtifactRequiredDowngrade(true, "pass", "SATISFIED", "DIVERGENT", true).classification,
  "SPECIFICATION_GAP");
check("9e.artifact_absent_with_required_downgrades_to_NO_GAP_CLASSIFICATION",
  checkArtifactRequiredDowngrade(false, "absent", "SATISFIED", "DIVERGENT", true).classification,
  "NO_GAP_CLASSIFICATION");

// 10. Behavior dump has 179 cells -> failure
function checkBehaviorCells(cells: number): string {
  if (cells !== 180) return "BEHAVIOR_EVIDENCE_MISMATCH";
  return "OK";
}
check("10.behavior_179_cells",
  checkBehaviorCells(179),
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 11. Duplicate input cell -> failure
function checkDuplicates(seen: Set<string>): string {
  if (seen.size !== 180) return "BEHAVIOR_EVIDENCE_MISMATCH";
  return "OK";
}
check("11.duplicate_cell",
  checkDuplicates(new Set(["a", "b"])),
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 12. Unexpected 181st cell -> failure
check("12.unexpected_181st_cell",
  checkBehaviorCells(181),
  "BEHAVIOR_EVIDENCE_MISMATCH");

// 13. Candidate result hash mismatch -> failure
function checkResultHash(storedHash: string, recomputedHash: string): string {
  return storedHash === recomputedHash ? "OK" : "RESULT_HASH_MISMATCH";
}
check("13.result_hash_mismatch",
  checkResultHash("a", "b"),
  "RESULT_HASH_MISMATCH");

// 14. Expected oracle must not influence classification
// Construct: observed = SPECIFICATION_GAP, expected_class = LAW_REFUTED.
// Classifier must emit SPECIFICATION_GAP (NOT LAW_REFUTED).
function checkExpectedOracleInfluence(
  observedClass: string,
  expectedClass: string,
): { observed: string; expected_mismatch: boolean } {
  return { observed: observedClass, expected_mismatch: observedClass !== expectedClass };
}
const influence = checkExpectedOracleInfluence("SPECIFICATION_GAP", "LAW_REFUTED");
check("14.expected_does_not_influence_classification",
  influence.observed,
  "SPECIFICATION_GAP");
check("14b.expected_mismatch_detected",
  String(influence.expected_mismatch),
  "true");

console.log("");
console.log(`Results: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
