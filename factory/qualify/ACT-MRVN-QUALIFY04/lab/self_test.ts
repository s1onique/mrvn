#!/usr/bin/env bun
// ACT-MRVN-04 classifier self-tests (CORRECTION02).
//
// Inline copies of the classify() logic + hash-binding check, exercised
// against synthetic edge cases including the new AUTHORITY_BINDING_FAILURE
// outcome.
//
// Each test is small and self-contained; they don't run the Bend impl.

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
  equivalence: ArtifactResult | null
): { classification: string; rationale: string[] } {
  if (proof.ok) {
    if (equivalence && equivalence.cert === false)
      return { classification: "SURVIVED/NON_EQUIVALENT", rationale: ["proof PASS", "EQUIV False"] };
    if (equivalence && equivalence.cert === true)
      return { classification: "SURVIVED/EQUIVALENT", rationale: ["proof PASS", "EQUIV True"] };
    return { classification: "UNRESOLVED", rationale: ["proof PASS, no EQUIV"] };
  }
  if (reproof && reproof.ok)
    return { classification: "PROOF_TERM_INVALIDATED", rationale: ["proof FAIL", "REPROOF PASS"] };
  if (counterexample && counterexample.cert === true)
    return { classification: "LAW_REFUTED", rationale: ["proof FAIL", "COUNTEREXAMPLE True"] };
  return { classification: "UNRESOLVED", rationale: ["proof FAIL, no positive artifact"] };
}

// Hash-binding check.  In real verify.ts this runs over the file
// system; here we simulate it.
interface BindingCheck {
  mutatedLawsSha: string;
  mutatedProofSha: string;
  lawBookSha: string;
  canonicalProofSha: string;
  bindingFailure: string[];
  importFailures: { file: string; reason: string }[];
}

function checkBinding(b: BindingCheck): { classification: string; rationale: string[] } | null {
  if (b.mutatedLawsSha !== b.lawBookSha) {
    return {
      classification: "AUTHORITY_BINDING_FAILURE",
      rationale: [`LAWS.bend sha mismatch (got ${b.mutatedLawsSha}, expected ${b.lawBookSha})`],
    };
  }
  if (b.mutatedProofSha !== b.canonicalProofSha) {
    return {
      classification: "AUTHORITY_BINDING_FAILURE",
      rationale: [`PROOF.bend sha mismatch (got ${b.mutatedProofSha}, expected ${b.canonicalProofSha})`],
    };
  }
  for (const f of b.importFailures) {
    return {
      classification: "AUTHORITY_BINDING_FAILURE",
      rationale: [`${f.file}: ${f.reason}`],
    };
  }
  return null;
}

const LAW = "a".repeat(64);
const PROOF = "b".repeat(64);
const OTHER_LAW = "c".repeat(64);
const OTHER_PROOF = "d".repeat(64);

let pass = 0;
let fail = 0;
function check(name: string, got: string, want: string) {
  if (got === want) {
    console.log(`  PASS  ${name}: ${got}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}: got ${got}, want ${want}`);
    fail++;
  }
}

console.log("=== ACT-MRVN-QUALIFY04-CORRECTION02 Classifier Self-Tests ===");

// Original tests from CORRECTION01.
check("1.unresolved.proof_fail_no_artifact",
  classify(mk(true, false, null), null, null, null).classification, "UNRESOLVED");

check("2.unresolved.proof_fail_reproof_fail_no_counter",
  classify(mk(true, false, null), mk(true, false, null), null, null).classification, "UNRESOLVED");

check("3.proof_term_invalidated.reproof_passes",
  classify(mk(true, false, null), mk(true, true, null), null, null).classification, "PROOF_TERM_INVALIDATED");

check("4.law_refuted.counterexample_true",
  classify(mk(true, false, null), mk(true, false, null), mk(true, true, true), null).classification, "LAW_REFUTED");

check("5.survived_equivalent.proof_pass_equiv_true",
  classify(mk(true, true, null), null, null, mk(true, true, true)).classification, "SURVIVED/EQUIVALENT");

check("6.survived_non_equivalent.proof_pass_equiv_false",
  classify(mk(true, true, null), null, null, mk(true, true, false)).classification, "SURVIVED/NON_EQUIVALENT");

check("7.unresolved.proof_pass_no_equiv",
  classify(mk(true, true, null), null, null, null).classification, "UNRESOLVED");

check("8.missing_cert.proof_fail_no_reproof_no_counter",
  classify(mk(true, false, null), null, null, null).classification, "UNRESOLVED");

check("9.inconsistent.counterexample_false_with_proof_fail",
  classify(mk(true, false, null), mk(true, false, null), mk(true, true, false), null).classification, "UNRESOLVED");

// New tests for hash binding (CORRECTION02).
check("10.authority_binding.law_mismatch",
  checkBinding({ mutatedLawsSha: OTHER_LAW, mutatedProofSha: PROOF, lawBookSha: LAW, canonicalProofSha: PROOF, bindingFailure: [], importFailures: [] })!.classification,
  "AUTHORITY_BINDING_FAILURE");

check("11.authority_binding.proof_mismatch",
  checkBinding({ mutatedLawsSha: LAW, mutatedProofSha: OTHER_PROOF, lawBookSha: LAW, canonicalProofSha: PROOF, bindingFailure: [], importFailures: [] })!.classification,
  "AUTHORITY_BINDING_FAILURE");

check("12.authority_binding.cert_imports_wrong_laws",
  checkBinding({
    mutatedLawsSha: LAW,
    mutatedProofSha: PROOF,
    lawBookSha: LAW,
    canonicalProofSha: PROOF,
    bindingFailure: [],
    importFailures: [{ file: "EQUIV.bend", reason: "imports non-canonical LAWS.bend" }],
  })!.classification,
  "AUTHORITY_BINDING_FAILURE");

check("13.authority_binding.canonical_passes_through",
  checkBinding({ mutatedLawsSha: LAW, mutatedProofSha: PROOF, lawBookSha: LAW, canonicalProofSha: PROOF, bindingFailure: [], importFailures: [] }),
  null);

// 14-15: expected/observed mismatch.
check("14.expected_observed_mismatch.mismatch_designed",
  classify(mk(true, true, null), null, null, mk(true, true, false)).classification, "SURVIVED/NON_EQUIVALENT");

console.log("");
console.log(`Results: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
